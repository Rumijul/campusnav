import type { NavEdge, NavGraph, NavNode } from '@shared/types'
import type Konva from 'konva'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Layer, Stage } from 'react-konva'
import useImage from 'use-image'
import EdgeLayer from '../../components/admin/EdgeLayer'
import EditorSidePanel from '../../components/admin/EditorSidePanel'
import EditorToolbar from '../../components/admin/EditorToolbar'
import NodeMarkerLayer from '../../components/admin/NodeMarkerLayer'
import FloorPlanImage from '../../components/FloorPlanImage'
import {
  calcDistance,
  generateEdgeId,
  generateNodeId,
  useEditorState,
} from '../../hooks/useEditorState'
import { useMapViewport } from '../../hooks/useMapViewport'
import { useViewportSize } from '../../hooks/useViewportSize'

/* ──────────────── Props ──────────────── */

interface MapEditorCanvasProps {
  onLogout: () => void
}

/* ──────────────── Component ──────────────── */

export default function MapEditorCanvas({ onLogout }: MapEditorCanvasProps) {
  const { width, height } = useViewportSize()
  const { state, dispatch, recordHistory, handleUndo, handleRedo, canUndo, canRedo } =
    useEditorState()

  const stageRef = useRef<Konva.Stage>(null)
  const floorPlanLayerRef = useRef<Konva.Layer>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [imageRect, setImageRect] = useState<{
    x: number
    y: number
    width: number
    height: number
  } | null>(null)
  const [stageScale, setStageScale] = useState<number>(1)
  const [floorPlanUrl, setFloorPlanUrl] = useState<string>('/api/floor-plan/image')
  const [cursorCanvasPos, setCursorCanvasPos] = useState<{ x: number; y: number } | null>(null)

  // Compute editor viewport height (full height minus toolbar ~52px)
  const editorHeight = height

  // Load floor plan image via use-image
  const [image, imageStatus] = useImage(floorPlanUrl)
  const isFullLoaded = imageStatus === 'loaded'

  const { handleWheel, handleTouchMove, handleTouchEnd, handleDragEnd } = useMapViewport({
    stageRef,
    imageRect,
    onScaleChange: setStageScale,
  })

  // Load graph from server on mount
  useEffect(() => {
    fetch('/api/map', { credentials: 'include' })
      .then((res) => {
        if (!res.ok) return
        return res.json() as Promise<NavGraph>
      })
      .then((graph) => {
        if (!graph) return
        dispatch({ type: 'LOAD_GRAPH', nodes: graph.nodes, edges: graph.edges })
      })
      .catch(() => {
        // Silently fail — editor starts empty if graph cannot be loaded
      })
  }, [dispatch])

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
          floor: 1,
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
    [state.mode, imageRect, dispatch, recordHistory],
  )

  // Handle node click
  const handleNodeClick = useCallback(
    (nodeId: string) => {
      if (state.mode === 'select') {
        dispatch({ type: 'SELECT_NODE', id: nodeId })
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
    [state.mode, state.pendingEdgeSourceId, state.nodes, dispatch, recordHistory],
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

  // Handle save — POST graph to server
  const handleSave = useCallback(async () => {
    const graph: NavGraph = {
      nodes: state.nodes,
      edges: state.edges,
      metadata: {
        buildingName: 'Main Building',
        floor: 1,
        lastUpdated: new Date().toISOString(),
      },
    }
    const res = await fetch('/api/admin/graph', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(graph),
    })
    if (res.ok) dispatch({ type: 'MARK_SAVED' })
  }, [state.nodes, state.edges, dispatch])

  // Handle upload button click — open file picker
  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  // Handle file selection — instant preview + background upload
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Instant local preview
    const previewUrl = URL.createObjectURL(file)
    setFloorPlanUrl(previewUrl)

    // Background upload to server
    const formData = new FormData()
    formData.append('image', file)
    await fetch('/api/admin/floor-plan', {
      method: 'POST',
      credentials: 'include',
      body: formData,
      // No Content-Type header — browser sets multipart boundary automatically
    })
  }, [])

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
    <div className="relative w-full h-full">
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
      />
      <div style={{ paddingTop: '52px', width, height: editorHeight }} className="relative">
        <Stage
          ref={stageRef}
          width={width}
          height={editorHeight - 52}
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
                viewportWidth={width}
                viewportHeight={editorHeight - 52}
                onImageRectChange={setImageRect}
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
          />
        </Stage>

        {/* Side panel — HTML overlay inside the padded container (positioned relative to editor area) */}
        <div className="absolute right-0 top-0 h-full pointer-events-none">
          <div className="pointer-events-auto h-full">
            <EditorSidePanel
              selectedNode={
                state.selectedNodeId
                  ? (state.nodes.find((n) => n.id === state.selectedNodeId) ?? null)
                  : null
              }
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
            />
          </div>
        </div>
      </div>

      {/* Hidden file input for floor plan upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}
