import type { NavBuilding, NavEdge, NavFloor, NavFloorGpsBounds, NavGraph, NavNode } from '@shared/types'
import type Konva from 'konva'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Layer, Stage } from 'react-konva'
import useImage from 'use-image'
import { DataTabToolbar } from '../../components/admin/DataTabToolbar'
import { EdgeDataTable } from '../../components/admin/EdgeDataTable'
import EdgeLayer from '../../components/admin/EdgeLayer'
import EditorSidePanel from '../../components/admin/EditorSidePanel'
import EditorToolbar from '../../components/admin/EditorToolbar'
import ManageFloorsModal from '../../components/admin/ManageFloorsModal'
import { NodeDataTable } from '../../components/admin/NodeDataTable'
import NodeMarkerLayer from '../../components/admin/NodeMarkerLayer'
import {
  applyConnectorUpdatesToFloorNodes,
  applyConnectorUpdatesToNavGraph,
  deriveConnectorCandidates,
  isConnectorNodeType,
  type ConnectorDirection,
  type ConnectorUpdatedNode,
} from '../../components/admin/connectorLinking'
import FloorPlanImage from '../../components/FloorPlanImage'
import {
  calcDistance,
  generateEdgeId,
  generateNodeId,
  useEditorState,
} from '../../hooks/useEditorState'
import { useMapViewport } from '../../hooks/useMapViewport'

/* ──────────────── Props ──────────────── */

interface MapEditorCanvasProps {
  onLogout: () => void
}

interface ConnectorLinkSuccessResponse {
  ok: true
  updatedNodes: ConnectorUpdatedNode[]
}

interface ConnectorLinkErrorResponse {
  errorCode?: string
  error?: string
}

function applyFloorGpsBoundsPatch(
  floor: NavFloor,
  gpsBounds: NavFloorGpsBounds | null,
): NavFloor {
  const { gpsBounds: _existingGpsBounds, ...floorWithoutGpsBounds } = floor

  return gpsBounds
    ? { ...floorWithoutGpsBounds, gpsBounds }
    : floorWithoutGpsBounds
}

function patchNavGraphFloorGpsBounds(
  navGraph: NavGraph | null,
  floorId: number,
  gpsBounds: NavFloorGpsBounds | null,
): NavGraph | null {
  if (!navGraph) return navGraph

  let graphChanged = false

  const buildings = navGraph.buildings.map((building) => {
    let buildingChanged = false

    const floors = building.floors.map((floor) => {
      if (floor.id !== floorId) {
        return floor
      }

      buildingChanged = true
      return applyFloorGpsBoundsPatch(floor, gpsBounds)
    })

    if (!buildingChanged) {
      return building
    }

    graphChanged = true
    return {
      ...building,
      floors,
    }
  })

  if (!graphChanged) {
    return navGraph
  }

  return { buildings }
}

/* ──────────────── Component ──────────────── */

export default function MapEditorCanvas({ onLogout }: MapEditorCanvasProps) {
  const { state, dispatch, recordHistory, handleUndo, handleRedo, canUndo, canRedo, switchFloor, switchToCampus } =
    useEditorState()

  const stageRef = useRef<Konva.Stage>(null)
  const floorPlanLayerRef = useRef<Konva.Layer>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const el = canvasContainerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const { width, height } = entry.contentRect
      setCanvasSize({ width, height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const [activeTab, setActiveTab] = useState<'map' | 'data'>('map')
  const [activeSubTab, setActiveSubTab] = useState<'nodes' | 'edges'>('nodes')

  const [imageRect, setImageRect] = useState<{
    x: number
    y: number
    width: number
    height: number
  } | null>(null)
  const [stageScale, setStageScale] = useState<number>(1)
  const [floorPlanUrl, setFloorPlanUrl] = useState<string>('/api/floor-plan/image')
  const [cursorCanvasPos, setCursorCanvasPos] = useState<{ x: number; y: number } | null>(null)

  // Multi-floor state
  const [navGraph, setNavGraph] = useState<NavGraph | null>(null)
  const [manageFloorsOpen, setManageFloorsOpen] = useState(false)
  const [isSavingFloor, setIsSavingFloor] = useState(false)
  const [connectorLinkError, setConnectorLinkError] = useState<string | null>(null)
  const [isConnectorLinkPending, setIsConnectorLinkPending] = useState(false)

  const canvasWidth = canvasSize.width
  const canvasHeight = canvasSize.height

  // Load floor plan image via use-image
  const [image, imageStatus] = useImage(floorPlanUrl)
  const isFullLoaded = imageStatus === 'loaded'

  const { handleWheel, handleTouchMove, handleTouchEnd, handleDragEnd } = useMapViewport({
    stageRef,
    imageRect,
    onScaleChange: setStageScale,
  })

  // Load graph from server on mount — initialize multi-floor NavGraph state
  // Note: uses dispatch directly (not switchFloor) so this callback stays stable.
  // switchFloor is not useCallback-wrapped, so including it as a dep would cause
  // loadNavGraph to rebuild every render → infinite useEffect loop.
  const loadNavGraph = useCallback(async () => {
    try {
      const res = await fetch('/api/map', { credentials: 'include' })
      if (!res.ok) return
      const graph = (await res.json()) as NavGraph
      setNavGraph(graph)
      // Auto-select first real building (non-Campus), first floor
      const firstRealBuilding = graph.buildings.find((b) => b.name !== 'Campus')
      if (firstRealBuilding) {
        const firstFloor = firstRealBuilding.floors.slice().sort((a, b) => a.floorNumber - b.floorNumber)[0]
        if (firstFloor) {
          dispatch({ type: 'SWITCH_BUILDING', buildingId: firstRealBuilding.id })
          dispatch({ type: 'SWITCH_FLOOR', floorId: firstFloor.id, nodes: firstFloor.nodes, edges: firstFloor.edges })
          setFloorPlanUrl(`/api/floor-plan/${firstRealBuilding.id}/${firstFloor.floorNumber}?t=${firstFloor.updatedAt}`)
        }
      }
    } catch {
      // Silently fail — editor starts empty if graph cannot be loaded
    }
  }, [dispatch])

  useEffect(() => {
    loadNavGraph()
  }, [loadNavGraph])

  // Derived helpers from navGraph + state
  const isCampusActive = state.activeBuildingId === 'campus'

  const nonCampusBuildings: NavBuilding[] = (navGraph?.buildings ?? []).filter((b) => b.name !== 'Campus')

  const activeBuilding: NavBuilding | undefined = isCampusActive
    ? undefined
    : nonCampusBuildings.find((b) => b.id === state.activeBuildingId)

  const campusBuilding: NavBuilding | undefined = navGraph?.buildings.find((b) => b.name === 'Campus')

  const manageFloorsBuilding: NavBuilding | undefined = isCampusActive
    ? campusBuilding
    : activeBuilding

  const sortedFloors: NavFloor[] = (activeBuilding?.floors ?? [])
    .slice()
    .sort((a, b) => a.floorNumber - b.floorNumber)

  const selectedNode = useMemo(
    () => (state.selectedNodeId ? (state.nodes.find((node) => node.id === state.selectedNodeId) ?? null) : null),
    [state.selectedNodeId, state.nodes],
  )

  const connectorCandidates = useMemo(
    () => deriveConnectorCandidates(navGraph, selectedNode),
    [navGraph, selectedNode],
  )

  // Handle building switch — switches building context, loads first floor
  const handleBuildingSwitch = useCallback(
    async (value: string) => {
      if (value === 'campus') {
        const campusBuilding = navGraph?.buildings.find((b) => b.name === 'Campus')
        const campusFloor = campusBuilding?.floors[0]
        switchToCampus(campusFloor?.nodes ?? [], campusFloor?.edges ?? [])
        setFloorPlanUrl('/api/campus/image')
      } else {
        const buildingId = Number(value)
        dispatch({ type: 'SWITCH_BUILDING', buildingId })
        const building = navGraph?.buildings.find((b) => b.id === buildingId)
        const firstFloor = building?.floors.slice().sort((a, b) => a.floorNumber - b.floorNumber)[0]
        if (firstFloor) {
          switchFloor(firstFloor.id, firstFloor.nodes, firstFloor.edges)
          setFloorPlanUrl(`/api/floor-plan/${buildingId}/${firstFloor.floorNumber}?t=${firstFloor.updatedAt}`)
        }
      }
    },
    [navGraph, dispatch, switchFloor, switchToCampus],
  )

  // Keyboard shortcuts for undo/redo, escape, and delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
      } else if (e.ctrlKey && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        handleRedo()
      } else if (e.key === 'Escape') {
        dispatch({ type: 'SET_PENDING_EDGE_SOURCE', id: null })
        dispatch({ type: 'SELECT_NODE', id: null })
        dispatch({ type: 'SELECT_EDGE', id: null })
        setCursorCanvasPos(null)
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        const isInputFocused = ['INPUT', 'TEXTAREA', 'SELECT'].includes(
          (document.activeElement as HTMLElement)?.tagName ?? '',
        )
        if (isInputFocused) return

        if (state.selectedNodeId) {
          dispatch({ type: 'DELETE_NODE', id: state.selectedNodeId })
          recordHistory()
        } else if (state.selectedEdgeId) {
          dispatch({ type: 'DELETE_EDGE', id: state.selectedEdgeId })
          recordHistory()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleUndo, handleRedo, dispatch, state.selectedNodeId, state.selectedEdgeId, recordHistory])

  // Handle mouse move — track cursor position for rubber-band preview
  const handleMouseMove = useCallback(() => {
    const stage = stageRef.current
    if (!stage) return

    if (state.mode === 'add-edge' && state.pendingEdgeSourceId !== null) {
      const pos = stage.getPointerPosition()
      if (!pos) return

      const stagePosition = stage.position()
      const scale = stage.scaleX()
      const canvasX = (pos.x - stagePosition.x) / scale
      const canvasY = (pos.y - stagePosition.y) / scale
      setCursorCanvasPos({ x: canvasX, y: canvasY })
    } else {
      setCursorCanvasPos(null)
    }
  }, [state.mode, state.pendingEdgeSourceId])

  // Handle stage click for node placement and selection clearing
  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = stageRef.current
      const layer = floorPlanLayerRef.current

      if (state.mode === 'add-node') {
        // Place node on any canvas click (floor plan image is a shape, not the stage)
        // NodeMarkerLayer stops propagation for clicks on existing nodes
        if (!layer || !imageRect) return

        const pos = layer.getRelativePointerPosition()
        if (!pos) return

        const normX = Math.max(0, Math.min(1, (pos.x - imageRect.x) / imageRect.width))
        const normY = Math.max(0, Math.min(1, (pos.y - imageRect.y) / imageRect.height))

        const newNode: NavNode = {
          id: generateNodeId('room', 'New Node'),
          type: 'room',
          label: 'New Node',
          x: normX,
          y: normY,
          searchable: true,
          floorId: state.activeFloorId ?? 1,  // use active floor DB id, fallback to 1
        }

        dispatch({ type: 'PLACE_NODE', node: newNode })
        recordHistory()
        dispatch({ type: 'SELECT_NODE', id: newNode.id })
      } else if (state.mode === 'select') {
        // Clear selection when clicking empty canvas
        if (e.target === stage) {
          dispatch({ type: 'SELECT_NODE', id: null })
          dispatch({ type: 'SELECT_EDGE', id: null })
        }
      } else if (state.mode === 'add-edge') {
        // Clicking empty canvas cancels the pending edge
        if (e.target === stage) {
          dispatch({ type: 'SET_PENDING_EDGE_SOURCE', id: null })
          setCursorCanvasPos(null)
        }
      }
    },
    [state.mode, state.activeFloorId, imageRect, dispatch, recordHistory],
  )

  // Handle node click
  const handleNodeClick = useCallback(
    (nodeId: string) => {
      if (state.mode === 'select') {
        if (state.selectedNodeId === nodeId) {
          // Toggle: clicking already-selected node clears selection
          dispatch({ type: 'SELECT_NODE', id: null })
        } else {
          dispatch({ type: 'SELECT_NODE', id: nodeId })
        }
      } else if (state.mode === 'add-edge') {
        if (state.pendingEdgeSourceId === null) {
          // First click: set pending source
          dispatch({ type: 'SET_PENDING_EDGE_SOURCE', id: nodeId })
        } else if (state.pendingEdgeSourceId !== nodeId) {
          // Second click: create edge between source and target
          const sourceId = state.pendingEdgeSourceId
          const targetId = nodeId
          const source = state.nodes.find((n) => n.id === sourceId)
          const target = state.nodes.find((n) => n.id === targetId)

          if (source && target) {
            const dist = calcDistance(source, target)
            const newEdge: NavEdge = {
              id: generateEdgeId(sourceId, targetId),
              sourceId,
              targetId,
              standardWeight: dist,
              accessibleWeight: dist,
              accessible: true,
              bidirectional: true,
            }
            dispatch({ type: 'CREATE_EDGE', edge: newEdge })
            recordHistory()
            dispatch({ type: 'SELECT_EDGE', id: newEdge.id })
            setCursorCanvasPos(null)
          }
        }
        // Same node clicked: ignore (no self-loops)
      }
    },
    [state.mode, state.selectedNodeId, state.pendingEdgeSourceId, state.nodes, dispatch, recordHistory],
  )

  // Handle edge click
  const handleEdgeClick = useCallback(
    (edgeId: string) => {
      dispatch({ type: 'SELECT_EDGE', id: edgeId })
    },
    [dispatch],
  )

  // Handle node drag end — normalize position and record history
  const handleNodeDragEnd = useCallback(
    (nodeId: string, normX: number, normY: number) => {
      dispatch({ type: 'MOVE_NODE', id: nodeId, x: normX, y: normY })
      recordHistory()
    },
    [dispatch, recordHistory],
  )

  // Handle connector link/unlink updates via the atomic server endpoint
  const handleConnectorLinkChange = useCallback(
    async (direction: ConnectorDirection, targetNodeId: string | null) => {
      if (!selectedNode || !isConnectorNodeType(selectedNode.type)) return

      setConnectorLinkError(null)
      setIsConnectorLinkPending(true)

      try {
        const response = await fetch('/api/admin/connectors/link', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceNodeId: selectedNode.id,
            direction,
            targetNodeId,
          }),
        })

        const payload =
          (await response.json().catch(() => ({}))) as
            | ConnectorLinkSuccessResponse
            | ConnectorLinkErrorResponse

        if (!response.ok) {
          const errorCode =
            typeof payload.errorCode === 'string' ? payload.errorCode : 'CONNECTOR_LINK_ERROR'
          const errorMessage =
            typeof payload.error === 'string' ? payload.error : 'Failed to update connector link'
          setConnectorLinkError(`${errorCode}: ${errorMessage}`)
          return
        }

        if (!('ok' in payload) || payload.ok !== true || !Array.isArray(payload.updatedNodes)) {
          setConnectorLinkError('INVALID_RESPONSE: Connector update response was malformed')
          return
        }

        const successPayload = payload as ConnectorLinkSuccessResponse

        setNavGraph((previousGraph) =>
          applyConnectorUpdatesToNavGraph(previousGraph, successPayload.updatedNodes),
        )

        const patchedActiveFloorNodes = applyConnectorUpdatesToFloorNodes(
          state.nodes,
          successPayload.updatedNodes,
        )
        if (patchedActiveFloorNodes !== state.nodes) {
          dispatch({
            type: 'REPLACE_NODES',
            nodes: patchedActiveFloorNodes,
            isDirty: state.isDirty,
          })
        }
      } catch {
        setConnectorLinkError('NETWORK_ERROR: Unable to update floor connector link')
      } finally {
        setIsConnectorLinkPending(false)
      }
    },
    [dispatch, selectedNode, state.isDirty, state.nodes],
  )

  // Handle save — POST graph to server, context-aware (campus vs floor)
  const handleSave = useCallback(async () => {
    if (isCampusActive) {
      // Campus save: find campus building/floor in navGraph
      const campusBuilding = navGraph?.buildings.find((b) => b.name === 'Campus')
      if (!campusBuilding) return
      const campusFloor = campusBuilding.floors[0]
      if (!campusFloor) return
      const graph: NavGraph = {
        buildings: [{
          ...campusBuilding,
          floors: [{ ...campusFloor, nodes: state.nodes, edges: state.edges }],
        }],
      }
      const res = await fetch('/api/admin/graph', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(graph),
      })
      if (res.ok) {
        dispatch({ type: 'MARK_SAVED' })
        setNavGraph((previousGraph) => {
          if (!previousGraph) return previousGraph

          return {
            buildings: previousGraph.buildings.map((building) =>
              building.name === 'Campus'
                ? { ...building, floors: [{ ...campusFloor, nodes: state.nodes, edges: state.edges }] }
                : building,
            ),
          }
        })
      }
    } else {
      // Building/floor save: wrap active floor nodes into the full NavGraph
      if (!navGraph || !activeBuilding || state.activeFloorId === null) return
      const updatedBuildings = navGraph.buildings.map((b) => {
        if (b.id !== activeBuilding.id) return b
        return {
          ...b,
          floors: b.floors.map((f) => {
            if (f.id !== state.activeFloorId) return f
            return { ...f, nodes: state.nodes, edges: state.edges }
          }),
        }
      })
      const graph: NavGraph = { buildings: updatedBuildings }
      const res = await fetch('/api/admin/graph', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(graph),
      })
      if (res.ok) {
        dispatch({ type: 'MARK_SAVED' })
        setNavGraph({ buildings: updatedBuildings })
      }
    }
  }, [isCampusActive, navGraph, activeBuilding, state.activeFloorId, state.nodes, state.edges, dispatch])

  // Handle floor switch — auto-saves current floor, loads new floor
  const handleFloorSwitch = useCallback(
    async (floor: NavFloor) => {
      if (floor.id === state.activeFloorId) return
      // Auto-save current floor silently (fire-and-forget)
      if (state.isDirty && !isCampusActive && state.activeFloorId !== null) {
        setIsSavingFloor(true)
        try {
          await handleSave()
        } catch {
          /* silent */
        } finally {
          setIsSavingFloor(false)
        }
      }
      // Switch floor
      switchFloor(floor.id, floor.nodes, floor.edges)
      setFloorPlanUrl(`/api/floor-plan/${state.activeBuildingId}/${floor.floorNumber}?t=${floor.updatedAt}`)
    },
    [state.activeFloorId, state.isDirty, state.activeBuildingId, isCampusActive, switchFloor, handleSave],
  )

  // Handle upload button click — open file picker
  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  // Handle file selection — instant preview + background upload, routes to correct endpoint
  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      // Instant local preview
      const previewUrl = URL.createObjectURL(file)
      setFloorPlanUrl(previewUrl)

      const formData = new FormData()
      formData.append('image', file)

      if (isCampusActive) {
        await fetch('/api/admin/campus/image', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        })
        // Reload navGraph to pick up new campus building/floor ids
        await loadNavGraph()
      } else {
        // Per-floor upload — use active building/floor numbers
        const floorNumber =
          activeBuilding?.floors.find((f) => f.id === state.activeFloorId)?.floorNumber ?? 1
        await fetch(`/api/admin/floor-plan/${state.activeBuildingId}/${floorNumber}`, {
          method: 'POST',
          credentials: 'include',
          body: formData,
        })
      }
    },
    [isCampusActive, activeBuilding, state.activeBuildingId, state.activeFloorId, loadNavGraph],
  )

  // Compute selected edge with source/target names for side panel
  const selectedEdgeWithNames = (() => {
    if (!state.selectedEdgeId) return null
    const edge = state.edges.find((e) => e.id === state.selectedEdgeId)
    if (!edge) return null
    const sourceNode = state.nodes.find((n) => n.id === edge.sourceId)
    const targetNode = state.nodes.find((n) => n.id === edge.targetId)
    return {
      ...edge,
      sourceName: sourceNode?.label ?? edge.sourceId,
      targetName: targetNode?.label ?? edge.targetId,
    }
  })()

  return (
    <div className="relative flex h-full w-full flex-col min-h-0">
      {/* Toolbar — only shown on Map tab */}
      <div className={activeTab !== 'map' ? 'hidden' : ''}>
        <EditorToolbar
          mode={state.mode}
          onModeChange={(m) => dispatch({ type: 'SET_MODE', mode: m })}
          onUpload={handleUploadClick}
          onSave={handleSave}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
          isDirty={state.isDirty}
          onLogout={onLogout}
          isCampusActive={isCampusActive}
          onManageFloors={() => setManageFloorsOpen(true)}
        />
      </div>

      {/* Tab bar — always visible */}
      <div className="flex gap-2 border-b border-gray-200 bg-white px-4 py-2">
        <button
          type="button"
          onClick={() => setActiveTab('map')}
          className={`rounded px-4 py-1.5 text-sm font-medium ${activeTab === 'map' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Map
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('data')}
          className={`rounded px-4 py-1.5 text-sm font-medium ${activeTab === 'data' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Data
        </button>
      </div>

      {/* Building selector + floor tab row — only shown on Map tab */}
      {activeTab === 'map' && (
        <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-1.5 flex-wrap">
          {/* Building / Campus selector */}
          <select
            value={isCampusActive ? 'campus' : String(state.activeBuildingId)}
            onChange={(e) => handleBuildingSwitch(e.target.value)}
            className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="campus">Campus</option>
            {nonCampusBuildings.map((b) => (
              <option key={b.id} value={String(b.id)}>{b.name}</option>
            ))}
          </select>

          {/* Floor tabs — only when a real building is active */}
          {!isCampusActive && sortedFloors.map((floor) => (
            <button
              key={floor.id}
              type="button"
              onClick={() => handleFloorSwitch(floor)}
              disabled={isSavingFloor}
              className={`px-3 py-1 rounded text-sm font-medium ${
                state.activeFloorId === floor.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Floor {floor.floorNumber}
            </button>
          ))}
        </div>
      )}

      {/* Map panel — mounted but hidden when Data tab is active */}
      <div
        ref={canvasContainerRef}
        className={activeTab !== 'map' ? 'hidden' : 'relative flex-1 overflow-hidden'}
      >
        <Stage
          ref={stageRef}
          width={canvasWidth}
          height={canvasHeight}
          draggable={state.mode === 'select'}
          onClick={handleStageClick}
          onMouseMove={handleMouseMove}
          onWheel={handleWheel}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onDragEnd={handleDragEnd}
          style={{ cursor: state.mode === 'select' ? 'default' : 'crosshair' }}
        >
          {/* Layer 1: Floor plan image */}
          <Layer ref={floorPlanLayerRef}>
            {image && (
              <FloorPlanImage
                image={image}
                isFullLoaded={isFullLoaded}
                viewportWidth={canvasWidth}
                viewportHeight={canvasHeight}
                onImageRectChange={setImageRect}
                onClick={() => {
                  if (state.mode === 'select') {
                    dispatch({ type: 'SELECT_NODE', id: null })
                    dispatch({ type: 'SELECT_EDGE', id: null })
                  }
                }}
              />
            )}
          </Layer>

          {/* Layer 2: Edges (between floor plan and nodes so nodes render on top) */}
          <EdgeLayer
            edges={state.edges}
            nodes={state.nodes}
            selectedEdgeId={state.selectedEdgeId}
            pendingEdgeSourceId={state.pendingEdgeSourceId}
            cursorPosition={cursorCanvasPos}
            imageRect={imageRect}
            mode={state.mode}
            onEdgeClick={handleEdgeClick}
          />

          {/* Layer 3: Node markers */}
          <NodeMarkerLayer
            nodes={state.nodes}
            selectedNodeId={state.selectedNodeId}
            stageScale={stageScale}
            imageRect={imageRect}
            mode={state.mode}
            onNodeClick={handleNodeClick}
            onNodeDragEnd={handleNodeDragEnd}
            isCampusActive={isCampusActive}
          />
        </Stage>

        {/* Campus empty state overlay */}
        {isCampusActive && !image && (
          <button
            type="button"
            className="absolute inset-0 flex items-center justify-center pointer-events-auto cursor-pointer"
            onClick={handleUploadClick}
          >
            <span className="text-center text-slate-500 hover:text-slate-700">
              <p className="text-lg font-medium">Upload campus map to begin</p>
              <p className="text-sm">Click to upload an overhead image</p>
            </span>
          </button>
        )}

        {/* Side panel — HTML overlay inside the padded container (positioned relative to editor area) */}
        <div className="pointer-events-none absolute right-0 top-0 h-full">
          <div className="pointer-events-auto h-full">
            <EditorSidePanel
              selectedNode={selectedNode}
              selectedEdge={selectedEdgeWithNames}
              onUpdateNode={(id, changes) => {
                dispatch({ type: 'UPDATE_NODE', id, changes })
                recordHistory()
              }}
              onUpdateEdge={(id, changes) => {
                dispatch({ type: 'UPDATE_EDGE', id, changes })
                recordHistory()
              }}
              onDeleteNode={(id) => {
                dispatch({ type: 'DELETE_NODE', id })
                recordHistory()
              }}
              onDeleteEdge={(id) => {
                dispatch({ type: 'DELETE_EDGE', id })
                recordHistory()
              }}
              onClose={() => {
                dispatch({ type: 'SELECT_NODE', id: null })
                dispatch({ type: 'SELECT_EDGE', id: null })
              }}
              isCampusActive={isCampusActive}
              buildings={nonCampusBuildings}
              connectorCandidates={connectorCandidates}
              onConnectorLinkChange={handleConnectorLinkChange}
              connectorLinkError={connectorLinkError}
              isConnectorLinkPending={isConnectorLinkPending}
            />
          </div>
        </div>
      </div>

      {/* Data panel — mounted but hidden when Map tab is active */}
      <div className={activeTab !== 'data' ? 'hidden' : 'flex-1 overflow-auto'}>
        <DataTabToolbar
          nodes={state.nodes}
          edges={state.edges}
          activeSubTab={activeSubTab}
          onSubTabChange={setActiveSubTab}
          onImportGraph={(nodes, edges) => {
            dispatch({ type: 'LOAD_GRAPH', nodes, edges })
            recordHistory()
          }}
        />
        {activeSubTab === 'nodes' ? (
          <NodeDataTable
            nodes={state.nodes}
            selectedNodeId={state.selectedNodeId}
            onUpdateNode={(id, updates) => {
              dispatch({ type: 'UPDATE_NODE', id, changes: updates })
              recordHistory()
            }}
            onDeleteNode={(id) => {
              dispatch({ type: 'DELETE_NODE', id })
              recordHistory()
            }}
            onSelectNode={(id) => dispatch({ type: 'SELECT_NODE', id })}
          />
        ) : (
          <EdgeDataTable
            edges={state.edges}
            nodes={state.nodes}
            selectedEdgeId={state.selectedEdgeId}
            onUpdateEdge={(id, updates) => {
              dispatch({ type: 'UPDATE_EDGE', id, changes: updates })
              recordHistory()
            }}
            onDeleteEdge={(id) => {
              dispatch({ type: 'DELETE_EDGE', id })
              recordHistory()
            }}
            onSelectEdge={(id) => dispatch({ type: 'SELECT_EDGE', id })}
            recordHistory={recordHistory}
          />
        )}
      </div>

      {/* Hidden file input for floor plan upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Manage Floors modal */}
      {manageFloorsOpen && manageFloorsBuilding && (
        <ManageFloorsModal
          isOpen={manageFloorsOpen}
          buildingId={manageFloorsBuilding.id}
          floors={manageFloorsBuilding.floors}
          isCampusMode={isCampusActive}
          onClose={() => setManageFloorsOpen(false)}
          onFloorAdded={(newFloor) => {
            setManageFloorsOpen(false)
            setNavGraph((prev) => {
              if (!prev || !manageFloorsBuilding) return prev
              return {
                buildings: prev.buildings.map((b) =>
                  b.id === manageFloorsBuilding.id
                    ? { ...b, floors: [...b.floors, newFloor] }
                    : b,
                ),
              }
            })
          }}
          onFloorDeleted={(floorId) => {
            setManageFloorsOpen(false)
            setNavGraph((prev) => {
              if (!prev || !manageFloorsBuilding) return prev
              return {
                buildings: prev.buildings.map((b) =>
                  b.id === manageFloorsBuilding.id
                    ? { ...b, floors: b.floors.filter((f) => f.id !== floorId) }
                    : b,
                ),
              }
            })
          }}
          onFloorImageReplaced={() => {
            loadNavGraph()
          }}
          onFloorGpsBoundsSaved={(floorId, gpsBounds) => {
            setNavGraph((prev) => patchNavGraphFloorGpsBounds(prev, floorId, gpsBounds))
          }}
        />
      )}
    </div>
  )
}
