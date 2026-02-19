import { PathfindingEngine } from '@shared/pathfinding/engine'
import type { PathResult } from '@shared/pathfinding/types'
import type Konva from 'konva'
import KonvaModule from 'konva'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Layer, Stage, Text } from 'react-konva'
import { useFloorPlanImage } from '../hooks/useFloorPlanImage'
import { useGraphData } from '../hooks/useGraphData'
import { useMapViewport } from '../hooks/useMapViewport'
import { useRouteSelection } from '../hooks/useRouteSelection'
import { useViewportSize } from '../hooks/useViewportSize'
import FloorPlanImage from './FloorPlanImage'
import GridBackground from './GridBackground'
import { LandmarkLayer } from './LandmarkLayer'
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

  const routeSelection = useRouteSelection()
  const graphState = useGraphData()

  // Route computation result — consumed by Phase 6 for visualization
  // @ts-expect-error routeResult will be consumed by Phase 6 route visualization layer
  // biome-ignore lint/correctness/noUnusedVariables: stored for Phase 6 consumption
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null)

  // Toast state
  const [toast, setToast] = useState<{ message: string; isError: boolean } | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Get nodes array when graph is loaded
  const nodes = useMemo(() => {
    if (graphState.status === 'loaded') return graphState.data.nodes
    return []
  }, [graphState])

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
      showToast('Route calculated')
    } else {
      showToast('No route found', true)
    }
  }, [routeSelection.start, routeSelection.destination, engine, fitToBounds, showToast])

  // Clear route result when selections change (start or dest cleared)
  useEffect(() => {
    if (!routeSelection.start || !routeSelection.destination) {
      setRouteResult(null)
    }
  }, [routeSelection.start, routeSelection.destination])

  const interactionDisabled = isLoading || isFailed

  return (
    <div className="relative w-full h-full">
      {/* Search overlay — HTML sibling above Stage in DOM */}
      <SearchOverlay selection={routeSelection} nodes={nodes} onRouteTrigger={handleRouteTrigger} />

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

        {/* Landmarks — markers above floor plan image */}
        <LandmarkLayer
          imageRect={imageRect}
          stageScale={stageScale}
          selectedNodeId={null}
          onSelectNode={routeSelection.setFromTap}
          hiddenNodeIds={hiddenNodeIds}
        />

        {/* Selection pins — A/B labeled markers above landmarks */}
        <SelectionMarkerLayer
          start={routeSelection.start}
          destination={routeSelection.destination}
          imageRect={imageRect}
          stageScale={stageScale}
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
