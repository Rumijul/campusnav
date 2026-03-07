import { PathfindingEngine } from '@shared/pathfinding/engine'
import type { PathResult } from '@shared/pathfinding/types'
import type { NavBuilding, NavFloor, NavNode } from '@shared/types'
import type Konva from 'konva'
import KonvaModule from 'konva'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Layer, Stage, Text } from 'react-konva'
import { filterNodesByActiveFloor, filterRouteSegmentByFloor, totalFloorCount } from '../hooks/useFloorFiltering'
import { useFloorPlanImage } from '../hooks/useFloorPlanImage'
import { useGraphData } from '../hooks/useGraphData'
import { useMapViewport } from '../hooks/useMapViewport'
import { routesAreIdentical, useRouteDirections } from '../hooks/useRouteDirections'
import { useRouteSelection } from '../hooks/useRouteSelection'
import { useViewportSize } from '../hooks/useViewportSize'
import { DirectionsSheet } from './DirectionsSheet'
import FloorPlanImage from './FloorPlanImage'
import { FloorTabStrip } from './FloorTabStrip'
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

  // ── Active floor/building state ──
  const [activeBuildingId, setActiveBuildingId] = useState<number | 'campus' | null>(null)
  const [activeFloorId, setActiveFloorId] = useState<number | null>(null)

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

  // ── All buildings from the graph ──
  const allBuildings = useMemo<NavBuilding[]>(() => {
    if (graphState.status !== 'loaded') return []
    return graphState.data.buildings
  }, [graphState])

  // Non-campus buildings for the building selector
  const nonCampusBuildings = useMemo(
    () => allBuildings.filter(b => b.name !== 'Campus'),
    [allBuildings],
  )

  // Campus building (may be undefined — only present if admin uploaded campus map)
  const campusBuilding = useMemo(
    () => allBuildings.find(b => b.name === 'Campus'),
    [allBuildings],
  )

  // The active NavBuilding object
  const activeBuilding = useMemo(() => {
    if (activeBuildingId === 'campus') return campusBuilding
    if (activeBuildingId === null) return undefined
    return allBuildings.find(b => b.id === activeBuildingId)
  }, [activeBuildingId, allBuildings, campusBuilding])

  // Sorted floors for the active building (for floor tab buttons)
  const sortedActiveFloors = useMemo(
    () => (activeBuilding?.floors ?? []).slice().sort((a, b) => a.floorNumber - b.floorNumber),
    [activeBuilding],
  )

  // The currently active NavFloor object
  const activeFloor = useMemo(
    () => sortedActiveFloors.find(f => f.id === activeFloorId) ?? null,
    [sortedActiveFloors, activeFloorId],
  )

  // Floor count across all buildings — used to show/hide the tab strip
  const floorCount = useMemo(() => totalFloorCount(allBuildings), [allBuildings])

  // Compute target for useFloorPlanImage — must be stable (not constructed inline) to avoid hook dependency issues
  const floorImageTarget = useMemo<{ buildingId: number; floorNumber: number } | 'campus' | undefined>(() => {
    if (activeBuildingId === 'campus') return 'campus'
    if (!activeBuilding || !activeFloor) return undefined
    return { buildingId: activeBuilding.id, floorNumber: activeFloor.floorNumber }
  }, [activeBuildingId, activeBuilding, activeFloor])

  const { image, isLoading, isFailed, isFullLoaded } = useFloorPlanImage(floorImageTarget)

  // Get nodes array when graph is loaded — flatten from buildings → floors → nodes
  const nodes = useMemo(() => {
    if (graphState.status !== 'loaded') return []
    return graphState.data.buildings.flatMap((b) => b.floors.flatMap((f) => f.nodes))
  }, [graphState])

  // Node map for direction step lookup
  const nodeMap = useMemo<Map<string, NavNode>>(() => {
    return new Map(nodes.map((n) => [n.id, n]))
  }, [nodes])

  // Floor map for floor-change direction step lookup (floor number by floor ID)
  const floorMap = useMemo<Map<number, NavFloor>>(() => {
    if (graphState.status !== 'loaded') return new Map()
    return new Map(
      graphState.data.buildings.flatMap((b) => b.floors).map((f) => [f.id, f]),
    )
  }, [graphState])

  // Show tab strip: only when > 1 total floor AND DirectionsSheet is closed
  const showTabStrip = graphState.status === 'loaded' && floorCount > 1 && !sheetOpen

  // Filtered nodes for LandmarkLayer — active floor + dimmed adjacent elevator connectors
  const { nodes: filteredNodes, dimmedNodeIds } = useMemo(() => {
    if (!activeFloor) return { nodes: [] as NavNode[], dimmedNodeIds: new Set<string>() }
    return filterNodesByActiveFloor(nodes, activeFloor.id)
  }, [nodes, activeFloor])

  // Compute turn-by-turn directions for each mode
  const standardDirections = useRouteDirections(routeResult?.standard ?? null, nodeMap, 'standard', floorMap)
  const accessibleDirections = useRouteDirections(
    routeResult?.accessible ?? null,
    nodeMap,
    'accessible',
    floorMap,
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

  // Default initialization — on first graph load, set active floor to Floor 1 of first non-campus building
  // biome-ignore lint/correctness/useExhaustiveDependencies: initialize once on first load
  useEffect(() => {
    if (graphState.status !== 'loaded') return
    if (activeFloorId !== null) return // already initialized
    const firstBuilding = graphState.data.buildings.find(b => b.name !== 'Campus')
    if (!firstBuilding) return
    const floor1 = firstBuilding.floors
      .slice()
      .sort((a, b) => a.floorNumber - b.floorNumber)[0]
    if (floor1) {
      setActiveBuildingId(firstBuilding.id)
      setActiveFloorId(floor1.id)
    }
  }, [graphState.status])

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

  /** Switch to a new floor — updates state and re-fits the canvas */
  const handleFloorSwitch = useCallback(
    (floor: NavFloor) => {
      const building = allBuildings.find(b => b.floors.some(f => f.id === floor.id))
      if (building) setActiveBuildingId(building.id)
      setActiveFloorId(floor.id)
      fitToScreen(width, height, true)
    },
    [allBuildings, width, height, fitToScreen],
  )

  /** Switch to a different building — defaults to Floor 1 (or campus floor) */
  const handleBuildingSwitch = useCallback(
    (id: number | 'campus') => {
      setActiveBuildingId(id)
      if (id === 'campus') {
        // Campus has exactly one map — no floor tabs. Set activeFloorId to campus floor id.
        const campusBld = allBuildings.find(b => b.name === 'Campus')
        const campusFloor = campusBld?.floors[0]
        if (campusFloor) setActiveFloorId(campusFloor.id)
      } else {
        // Switch to floor 1 (lowest floorNumber) of the newly selected building
        const bld = allBuildings.find(b => b.id === id)
        const firstFloor = bld?.floors.slice().sort((a, b) => a.floorNumber - b.floorNumber)[0]
        if (firstFloor) setActiveFloorId(firstFloor.id)
        fitToScreen(width, height, true)
      }
    },
    [allBuildings, width, height, fitToScreen],
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

      // Auto-switch to start node's floor so student sees where journey begins
      if (routeSelection.start) {
        const startFloor = floorMap.get(routeSelection.start.floorId)
        if (startFloor) handleFloorSwitch(startFloor)
      }
    } else {
      showToast('No route found', true)
    }
  }, [routeSelection.start, routeSelection.destination, engine, fitToBounds, showToast, floorMap, handleFloorSwitch])

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

  /** Combined landmark tap handler: show detail sheet AND feed route selection.
   *  Also auto-switches floor when tapping a dimmed elevator connector. */
  const handleLandmarkTap = useCallback(
    (node: NavNode) => {
      // Auto-switch floor when tapping a node on a different floor (e.g. dimmed elevator connector)
      if (activeFloor && node.floorId !== activeFloor.id) {
        const targetFloor = floorMap.get(node.floorId)
        if (targetFloor) {
          handleFloorSwitch(targetFloor)
          return // Don't open detail sheet on auto-switch tap
        }
      }
      setDetailNode(node)
      routeSelection.setFromTap(node)
    },
    [routeSelection, activeFloor, floorMap, handleFloorSwitch],
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

  // Active route points — filtered to the currently active floor only
  const activeRoutePoints = useMemo(() => {
    if (!routeResult || !activeFloor) return []
    const result = activeMode === 'standard' ? routeResult.standard : routeResult.accessible
    if (!result.found) return []
    const floorNodeIds = filterRouteSegmentByFloor(result.nodeIds, nodeMap, activeFloor.id)
    return buildRoutePoints(floorNodeIds)
  }, [routeResult, activeMode, activeFloor, nodeMap, buildRoutePoints])

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

        {/* Landmarks — markers above floor plan image, filtered to active floor */}
        <LandmarkLayer
          nodes={filteredNodes}
          imageRect={imageRect}
          stageScale={stageScale}
          selectedNodeId={null}
          onSelectNode={handleLandmarkTap}
          hiddenNodeIds={hiddenNodeIds}
          dimmedNodeIds={dimmedNodeIds}
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
            style={{
              bottom: sheetOpen
                ? '276px'
                : detailNode !== null
                  ? '196px'
                  : showTabStrip
                    ? '64px'   // 48px strip height + 16px gap
                    : '16px'
            }}
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

      {/* Floor tab strip — hidden when DirectionsSheet is open or only 1 floor total */}
      {showTabStrip && (
        <FloorTabStrip
          buildings={nonCampusBuildings}
          campusBuilding={campusBuilding}
          activeBuildingId={activeBuildingId}
          activeFloorId={activeFloorId}
          sortedFloors={sortedActiveFloors}
          onBuildingSwitch={handleBuildingSwitch}
          onFloorSwitch={handleFloorSwitch}
        />
      )}
    </div>
  )
}
