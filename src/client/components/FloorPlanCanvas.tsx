import { PathfindingEngine } from '@shared/pathfinding/engine'
import type { PathResult } from '@shared/pathfinding/types'
import type { NavNode } from '@shared/types'
import type Konva from 'konva'
import KonvaModule from 'konva'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Layer, Stage, Text } from 'react-konva'
import { useFloorPlanImage } from '../hooks/useFloorPlanImage'
import { useGraphData } from '../hooks/useGraphData'
import { useMapViewport } from '../hooks/useMapViewport'
import { routesAreIdentical, useRouteDirections } from '../hooks/useRouteDirections'
import { useRouteSelection } from '../hooks/useRouteSelection'
import { useViewportSize } from '../hooks/useViewportSize'
import { DirectionsSheet } from './DirectionsSheet'
import FloorPlanImage from './FloorPlanImage'
import GridBackground from './GridBackground'
import { LandmarkLayer } from './LandmarkLayer'
import { LocationDetailSheet } from './LocationDetailSheet'
import { RouteLayer } from './RouteLayer'
import { SearchOverlay } from './SearchOverlay'
import { SelectionMarkerLayer } from './SelectionMarkerLayer'
import ZoomControls from './ZoomControls'

/* ──────────────── Types ──────────────── */

interface RouteResult {
  standard: PathResult
  accessible: PathResult
}

/* ──────────────── Component ──────────────── */

/**
 * Main floor plan canvas container.
 *
 * Full-viewport layout — the entire viewport is the map (no header).
 * Renders: SearchOverlay → grid background → floor plan image → landmarks → pins → loading/error.
 * Interactive: pan (drag), zoom (scroll/buttons), pinch-zoom, rotation (mobile).
 */
export default function FloorPlanCanvas() {
  const { width, height } = useViewportSize()
  const { image, isLoading, isFailed, isFullLoaded } = useFloorPlanImage()
  const stageRef = useRef<Konva.Stage>(null)
  const [imageRect, setImageRect] = useState<{
    x: number
    y: number
    width: number
    height: number
  } | null>(null)
  const [stageScale, setStageScale] = useState<number>(1)
  const [activeMode, setActiveMode] = useState<'standard' | 'accessible'>('standard')
  const [sheetOpen, setSheetOpen] = useState<boolean>(false)
  // routeVisible tracks whether the route line should be drawn — decoupled from sheetOpen
  // so the line stays visible after pressing Back (sheet closes but route remains)
  const [routeVisible, setRouteVisible] = useState<boolean>(false)
  // detailNode — tracks which landmark is being viewed in the detail sheet
  const [detailNode, setDetailNode] = useState<NavNode | null>(null)

  const routeSelection = useRouteSelection()
  const graphState = useGraphData()

  // Route computation result — fully consumed by RouteLayer and DirectionsSheet
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null)

  // Toast state
  const [toast, setToast] = useState<{ message: string; isError: boolean } | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Get nodes array when graph is loaded
  const nodes = useMemo(() => {
    if (graphState.status === 'loaded') return graphState.data.nodes
    return []
  }, [graphState])

  // Node map for direction step lookup
  const nodeMap = useMemo<Map<string, NavNode>>(() => {
    if (graphState.status !== 'loaded') return new Map()
    return new Map(graphState.data.nodes.map((n) => [n.id, n]))
  }, [graphState])

  // Compute turn-by-turn directions for each mode
  const standardDirections = useRouteDirections(routeResult?.standard ?? null, nodeMap, 'standard')
  const accessibleDirections = useRouteDirections(
    routeResult?.accessible ?? null,
    nodeMap,
    'accessible',
  )
  const routesIdentical = routeResult
    ? routesAreIdentical(routeResult.standard, routeResult.accessible)
    : false

  // Memoize PathfindingEngine from loaded NavGraph
  const engine = useMemo(() => {
    if (graphState.status === 'loaded') return new PathfindingEngine(graphState.data)
    return null
  }, [graphState])

  // Node IDs to hide from LandmarkLayer (replaced by A/B pins)
  const hiddenNodeIds = useMemo(() => {
    const ids: string[] = []
    if (routeSelection.start) ids.push(routeSelection.start.id)
    if (routeSelection.destination) ids.push(routeSelection.destination.id)
    return ids
  }, [routeSelection.start, routeSelection.destination])

  const { handleWheel, handleTouchMove, handleTouchEnd, handleDragEnd, zoomByButton, fitToScreen } =
    useMapViewport({ stageRef, imageRect, onScaleChange: setStageScale })

  // Re-fit floor plan when viewport size changes (e.g. orientation change)
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional — re-fit on viewport resize only when image is loaded
  useEffect(() => {
    if (image && imageRect) {
      fitToScreen(width, height, true)
    }
  }, [width, height])

  /** Show a toast notification that auto-dismisses after 3 seconds */
  const showToast = useCallback((message: string, isError = false) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast({ message, isError })
    toastTimerRef.current = setTimeout(() => setToast(null), 3000)
  }, [])

  /**
   * Animate the stage to frame both nodeA and nodeB with ~15% padding.
   * Converts normalized coords to pixel coords using imageRect, computes
   * required scale and position, and applies via Konva.Tween.
   */
  const fitToBounds = useCallback(
    (nodeA: { x: number; y: number }, nodeB: { x: number; y: number }) => {
      const stage = stageRef.current
      if (!stage || !imageRect) return

      // Convert normalized coords to pixel coords
      const ax = imageRect.x + nodeA.x * imageRect.width
      const ay = imageRect.y + nodeA.y * imageRect.height
      const bx = imageRect.x + nodeB.x * imageRect.width
      const by = imageRect.y + nodeB.y * imageRect.height

      // Bounding box of both points
      const minX = Math.min(ax, bx)
      const maxX = Math.max(ax, bx)
      const minY = Math.min(ay, by)
      const maxY = Math.max(ay, by)
      const boundsW = maxX - minX
      const boundsH = maxY - minY

      // Add 15% padding on all sides (30% total per axis)
      const padding = 0.15
      const paddedW = boundsW * (1 + 2 * padding) || width * 0.5
      const paddedH = boundsH * (1 + 2 * padding) || height * 0.5

      // Scale to fit padded bounds in viewport
      const scaleX = width / paddedW
      const scaleY = height / paddedH
      const newScale = Math.min(scaleX, scaleY, 4) // cap at MAX_SCALE

      // Center of the bounding box
      const centerX = (minX + maxX) / 2
      const centerY = (minY + maxY) / 2

      // Stage position to center the bounding box in viewport
      const newX = width / 2 - centerX * newScale
      const newY = height / 2 - centerY * newScale

      const tween = new KonvaModule.Tween({
        node: stage,
        duration: 0.4,
        scaleX: newScale,
        scaleY: newScale,
        x: newX,
        y: newY,
        easing: KonvaModule.Easings.EaseInOut,
        onFinish: () => setStageScale(newScale),
      })
      tween.play()
    },
    [imageRect, width, height],
  )

  /** Compute route and trigger auto-pan when both start and destination are set */
  const handleRouteTrigger = useCallback(() => {
    if (!routeSelection.start || !routeSelection.destination || !engine) return

    // Auto-pan to show both pins
    fitToBounds(routeSelection.start, routeSelection.destination)

    // Compute routes
    const standard = engine.findRoute(
      routeSelection.start.id,
      routeSelection.destination.id,
      'standard',
    )
    const accessible = engine.findRoute(
      routeSelection.start.id,
      routeSelection.destination.id,
      'accessible',
    )
    setRouteResult({ standard, accessible })

    if (standard.found || accessible.found) {
      setSheetOpen(true)
      setRouteVisible(true)
      setActiveMode('standard')
      showToast('Route calculated')
    } else {
      showToast('No route found', true)
    }
  }, [routeSelection.start, routeSelection.destination, engine, fitToBounds, showToast])

  // Clear route result and close sheet when selections change (start or dest cleared)
  useEffect(() => {
    if (!routeSelection.start || !routeSelection.destination) {
      setRouteResult(null)
      setSheetOpen(false)
      setRouteVisible(false)
    }
  }, [routeSelection.start, routeSelection.destination])

  // Close detail sheet when both endpoints are set and route is triggered
  useEffect(() => {
    if (routeSelection.start !== null && routeSelection.destination !== null) {
      setDetailNode(null)
    }
  }, [routeSelection.start, routeSelection.destination])

  /** Back arrow in directions sheet — close sheet only, keep route line visible */
  const handleSheetBack = useCallback(() => {
    setSheetOpen(false)
  }, [])

  /** Combined landmark tap handler: show detail sheet AND feed route selection */
  const handleLandmarkTap = useCallback(
    (node: NavNode) => {
      setDetailNode(node)
      routeSelection.setFromTap(node)
    },
    [routeSelection],
  )

  /** Convert node IDs to flat pixel coordinate array for RouteLayer */
  const buildRoutePoints = useCallback(
    (nodeIds: string[]): number[] => {
      if (!imageRect) return []
      const pts: number[] = []
      for (const id of nodeIds) {
        const n = nodeMap.get(id)
        if (!n) continue
        pts.push(imageRect.x + n.x * imageRect.width, imageRect.y + n.y * imageRect.height)
      }
      return pts
    },
    [imageRect, nodeMap],
  )

  const activeRoutePoints = useMemo(() => {
    if (!routeResult) return []
    const result = activeMode === 'standard' ? routeResult.standard : routeResult.accessible
    if (!result.found) return []
    return buildRoutePoints(result.nodeIds)
  }, [routeResult, activeMode, buildRoutePoints])

  const activeRouteColor = activeMode === 'standard' ? '#3b82f6' : '#22c55e'

  const interactionDisabled = isLoading || isFailed

  return (
    <div className="relative w-full h-full">
      {/* Search overlay — HTML sibling above Stage in DOM */}
      <SearchOverlay
        selection={routeSelection}
        nodes={nodes}
        onRouteTrigger={handleRouteTrigger}
        sheetOpen={sheetOpen}
        hasRoute={routeResult !== null}
        onOpenSheet={() => setSheetOpen(true)}
      />

      {/* Graph data loading overlay — shows while useGraphData fetches from server */}
      {graphState.status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="flex flex-col items-center gap-3 bg-white/80 backdrop-blur-sm rounded-xl px-6 py-4 shadow">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-slate-600 font-medium">Loading map data…</span>
          </div>
        </div>
      )}

      {/* Graph data error overlay — shows after all retries exhausted */}
      {graphState.status === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="flex flex-col items-center gap-2 bg-white/90 backdrop-blur-sm rounded-xl px-6 py-4 shadow border border-red-200">
            <span className="text-red-500 font-semibold text-sm">Failed to load map data</span>
            <span className="text-slate-500 text-xs">Please refresh the page to try again</span>
          </div>
        </div>
      )}

      <Stage
        ref={stageRef}
        width={width}
        height={height}
        draggable={!interactionDisabled}
        onWheel={handleWheel}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDragEnd={handleDragEnd}
      >
        {/* Grid — static background, not transformed */}
        <Layer>
          <GridBackground width={width} height={height} />
        </Layer>

        {/* Content — floor plan image */}
        <Layer>
          {!isLoading && !isFailed && image && (
            <FloorPlanImage
              image={image}
              isFullLoaded={isFullLoaded}
              viewportWidth={width}
              viewportHeight={height}
              onImageRectChange={setImageRect}
            />
          )}
        </Layer>

        {/* Route path — animated dashed line for active route */}
        <RouteLayer
          points={activeRoutePoints}
          color={activeRouteColor}
          visible={routeVisible && activeRoutePoints.length >= 4}
        />

        {/* Landmarks — markers above floor plan image */}
        <LandmarkLayer
          nodes={nodes}
          imageRect={imageRect}
          stageScale={stageScale}
          selectedNodeId={null}
          onSelectNode={handleLandmarkTap}
          hiddenNodeIds={hiddenNodeIds}
        />

        {/* Selection pins — A/B labeled markers above landmarks */}
        <SelectionMarkerLayer
          start={routeSelection.start}
          destination={routeSelection.destination}
          imageRect={imageRect}
          stageScale={stageScale}
          onClearStart={routeSelection.clearStart}
          onClearDestination={routeSelection.clearDestination}
        />

        {/* UI overlay — loading/error states */}
        <Layer>
          {isLoading && (
            <Text
              x={width / 2 - 100}
              y={height / 2 - 10}
              width={200}
              align="center"
              text="Loading floor plan..."
              fontSize={18}
              fill="#64748b"
            />
          )}
          {isFailed && (
            <Text
              x={width / 2 - 130}
              y={height / 2 - 10}
              width={260}
              align="center"
              text="Failed to load floor plan"
              fontSize={18}
              fill="#ef4444"
            />
          )}
        </Layer>
      </Stage>

      <ZoomControls
        onZoomIn={() => zoomByButton(1)}
        onZoomOut={() => zoomByButton(-1)}
        disabled={interactionDisabled}
      />

      <LocationDetailSheet node={detailNode} onClose={() => setDetailNode(null)} />

      <DirectionsSheet
        open={sheetOpen}
        standard={routeResult?.standard ?? null}
        accessible={routeResult?.accessible ?? null}
        standardDirections={standardDirections}
        accessibleDirections={accessibleDirections}
        routesIdentical={routesIdentical}
        activeMode={activeMode}
        onTabChange={setActiveMode}
        onBack={handleSheetBack}
        startNode={routeSelection.start}
        destNode={routeSelection.destination}
      />

      {/* Canvas legend — color key for route lines, floats above sheet when open */}
      {routeVisible &&
        routeResult &&
        (routeResult.standard.found || routeResult.accessible.found) && (
          <div
            className="absolute left-3 z-20 bg-white/90 backdrop-blur-sm rounded-lg shadow px-3 py-2 flex flex-col gap-1.5 text-xs"
            style={{ bottom: sheetOpen ? '276px' : detailNode !== null ? '196px' : '16px' }}
          >
            {routeResult.standard.found && (
              <div className="flex items-center gap-2">
                <span className="w-6 h-1.5 rounded-full bg-blue-500 inline-block" />
                <span className="text-slate-700">Standard</span>
              </div>
            )}
            {routeResult.accessible.found && !routesIdentical && (
              <div className="flex items-center gap-2">
                <span className="w-6 h-1.5 rounded-full bg-green-500 inline-block" />
                <span className="text-slate-700">Accessible</span>
              </div>
            )}
            {routesIdentical && (
              <div className="flex items-center gap-2">
                <span className="w-6 h-1.5 rounded-full bg-blue-500 inline-block" />
                <span className="text-slate-700">Standard (accessible)</span>
              </div>
            )}
          </div>
        )}

      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-lg shadow-lg text-sm font-medium transition-opacity ${
            toast.isError ? 'bg-red-500 text-white' : 'bg-slate-800 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  )
}
