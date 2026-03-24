import type { NavEdge, NavNode } from '@shared/types'
import { useReducer, useRef, useState } from 'react'

// ============================================================
// Types
// ============================================================

export type EditorMode = 'select' | 'add-node' | 'add-edge'

export type EditorState = {
  nodes: NavNode[]
  edges: NavEdge[]
  mode: EditorMode
  selectedNodeId: string | null
  selectedEdgeId: string | null
  pendingEdgeSourceId: string | null
  isDirty: boolean
  // Multi-floor context (added Phase 18)
  activeBuildingId: number | 'campus'
  activeFloorId: number | null  // null when campus is active
  floorSnapshots: Record<number, { nodes: NavNode[]; edges: NavEdge[] }>
  campusSnapshot: { nodes: NavNode[]; edges: NavEdge[] } | null
}

export type EditorAction =
  | { type: 'LOAD_GRAPH'; nodes: NavNode[]; edges: NavEdge[] }
  | { type: 'SET_MODE'; mode: EditorMode }
  | { type: 'PLACE_NODE'; node: NavNode }
  | { type: 'MOVE_NODE'; id: string; x: number; y: number }
  | { type: 'UPDATE_NODE'; id: string; changes: Partial<NavNode> }
  | { type: 'REPLACE_NODES'; nodes: NavNode[]; isDirty: boolean }
  | { type: 'SELECT_NODE'; id: string | null }
  | { type: 'SET_PENDING_EDGE_SOURCE'; id: string | null }
  | { type: 'CREATE_EDGE'; edge: NavEdge }
  | { type: 'UPDATE_EDGE'; id: string; changes: Partial<NavEdge> }
  | { type: 'SELECT_EDGE'; id: string | null }
  | { type: 'DELETE_NODE'; id: string }
  | { type: 'DELETE_EDGE'; id: string }
  | { type: 'MARK_SAVED' }
  | { type: 'RESTORE_SNAPSHOT'; snapshot: EditorState }
  | { type: 'SWITCH_FLOOR'; floorId: number; nodes: NavNode[]; edges: NavEdge[] }
  | { type: 'SWITCH_TO_CAMPUS'; nodes: NavNode[]; edges: NavEdge[] }
  | { type: 'SWITCH_BUILDING'; buildingId: number | 'campus' }

// ============================================================
// Initial State
// ============================================================

const initialState: EditorState = {
  nodes: [],
  edges: [],
  mode: 'select',
  selectedNodeId: null,
  selectedEdgeId: null,
  pendingEdgeSourceId: null,
  isDirty: false,
  activeBuildingId: 1,        // Default to building 1 (Main Building)
  activeFloorId: null,        // null until first floor is loaded
  floorSnapshots: {},
  campusSnapshot: null,
}

// ============================================================
// Reducer
// ============================================================

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'LOAD_GRAPH':
      return {
        ...state,
        nodes: action.nodes,
        edges: action.edges,
        isDirty: false,
        selectedNodeId: null,
        selectedEdgeId: null,
        pendingEdgeSourceId: null,
      }

    case 'SET_MODE':
      return {
        ...state,
        mode: action.mode,
        selectedNodeId: null,
        selectedEdgeId: null,
        pendingEdgeSourceId: null,
      }

    case 'PLACE_NODE':
      return {
        ...state,
        nodes: [...state.nodes, action.node],
        isDirty: true,
      }

    case 'MOVE_NODE':
      return {
        ...state,
        nodes: state.nodes.map((n) =>
          n.id === action.id ? { ...n, x: action.x, y: action.y } : n,
        ),
        isDirty: true,
      }

    case 'UPDATE_NODE':
      return {
        ...state,
        nodes: state.nodes.map((n) => (n.id === action.id ? { ...n, ...action.changes } : n)),
        isDirty: true,
      }

    case 'REPLACE_NODES':
      return {
        ...state,
        nodes: action.nodes,
        selectedNodeId: action.nodes.some((node) => node.id === state.selectedNodeId)
          ? state.selectedNodeId
          : null,
        isDirty: action.isDirty,
      }

    case 'SELECT_NODE':
      return {
        ...state,
        selectedNodeId: action.id,
        selectedEdgeId: null,
      }

    case 'SET_PENDING_EDGE_SOURCE':
      return {
        ...state,
        pendingEdgeSourceId: action.id,
      }

    case 'CREATE_EDGE':
      return {
        ...state,
        edges: [...state.edges, action.edge],
        pendingEdgeSourceId: null,
        isDirty: true,
      }

    case 'UPDATE_EDGE':
      return {
        ...state,
        edges: state.edges.map((e) => (e.id === action.id ? { ...e, ...action.changes } : e)),
        isDirty: true,
      }

    case 'SELECT_EDGE':
      return {
        ...state,
        selectedEdgeId: action.id,
        selectedNodeId: null,
      }

    case 'DELETE_NODE':
      return {
        ...state,
        nodes: state.nodes.filter((n) => n.id !== action.id),
        edges: state.edges.filter((e) => e.sourceId !== action.id && e.targetId !== action.id),
        selectedNodeId: state.selectedNodeId === action.id ? null : state.selectedNodeId,
        pendingEdgeSourceId:
          state.pendingEdgeSourceId === action.id ? null : state.pendingEdgeSourceId,
        isDirty: true,
      }

    case 'DELETE_EDGE':
      return {
        ...state,
        edges: state.edges.filter((e) => e.id !== action.id),
        selectedEdgeId: state.selectedEdgeId === action.id ? null : state.selectedEdgeId,
        isDirty: true,
      }

    case 'MARK_SAVED':
      return {
        ...state,
        isDirty: false,
      }

    case 'RESTORE_SNAPSHOT':
      return {
        ...action.snapshot,
      }

    case 'SWITCH_FLOOR':
      return {
        ...state,
        nodes: action.nodes,
        edges: action.edges,
        activeFloorId: action.floorId,
        activeBuildingId: state.activeBuildingId,
        mode: 'select',
        selectedNodeId: null,
        selectedEdgeId: null,
        pendingEdgeSourceId: null,
        isDirty: false,
        // Cache the loaded floor data in snapshots
        floorSnapshots: {
          ...state.floorSnapshots,
          [action.floorId]: { nodes: action.nodes, edges: action.edges },
        },
      }

    case 'SWITCH_TO_CAMPUS':
      return {
        ...state,
        nodes: action.nodes,
        edges: action.edges,
        activeBuildingId: 'campus',
        activeFloorId: null,
        mode: 'select',
        selectedNodeId: null,
        selectedEdgeId: null,
        pendingEdgeSourceId: null,
        isDirty: false,
        campusSnapshot: { nodes: action.nodes, edges: action.edges },
      }

    case 'SWITCH_BUILDING':
      return {
        ...state,
        activeBuildingId: action.buildingId,
        activeFloorId: null,
        nodes: [],
        edges: [],
        mode: 'select',
        selectedNodeId: null,
        selectedEdgeId: null,
        pendingEdgeSourceId: null,
        isDirty: false,
      }

    default:
      return state
  }
}

// ============================================================
// ID Generation Helpers (exported)
// ============================================================

export function generateNodeId(type: string, label: string): string {
  const slug = label
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
  return `${type}-${slug || 'node'}-${Date.now()}`
}

export function generateEdgeId(sourceId: string, targetId: string): string {
  return `edge-${sourceId}-${targetId}-${Date.now()}`
}

// ============================================================
// Distance Calculation Helper (exported)
// ============================================================

export function calcDistance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2)
}

// ============================================================
// Hook
// ============================================================

const MAX_HISTORY = 50

export function useEditorState() {
  const [state, dispatch] = useReducer(editorReducer, initialState)

  // Undo/redo refs — not React state to avoid unnecessary re-renders
  const history = useRef<EditorState[]>([initialState])
  const historyStep = useRef<number>(0)

  // Lightweight state to trigger re-renders when history position changes
  const [historyInfo, setHistoryInfo] = useState({ step: 0, length: 1 })

  const recordHistory = () => {
    // Discard redo future and push current state
    const newHistory = history.current.slice(0, historyStep.current + 1)
    newHistory.push(state)

    // Cap at MAX_HISTORY entries
    if (newHistory.length > MAX_HISTORY) {
      newHistory.shift()
    }

    history.current = newHistory
    historyStep.current = newHistory.length - 1

    setHistoryInfo({ step: historyStep.current, length: newHistory.length })
  }

  const handleUndo = () => {
    if (historyStep.current <= 0) return

    historyStep.current -= 1
    const snapshot = history.current[historyStep.current]
    if (!snapshot) return
    dispatch({ type: 'RESTORE_SNAPSHOT', snapshot })
    setHistoryInfo({ step: historyStep.current, length: history.current.length })
  }

  const handleRedo = () => {
    if (historyStep.current >= history.current.length - 1) return

    historyStep.current += 1
    const snapshot = history.current[historyStep.current]
    if (!snapshot) return
    dispatch({ type: 'RESTORE_SNAPSHOT', snapshot })
    setHistoryInfo({ step: historyStep.current, length: history.current.length })
  }

  const canUndo = historyInfo.step > 0
  const canRedo = historyInfo.step < historyInfo.length - 1

  const switchFloor = (floorId: number, nodes: NavNode[], edges: NavEdge[]) => {
    dispatch({ type: 'SWITCH_FLOOR', floorId, nodes, edges })
    // Reset undo history to the new floor's initial state
    const newState: EditorState = {
      ...initialState,
      activeBuildingId: state.activeBuildingId,
      activeFloorId: floorId,
      nodes,
      edges,
      floorSnapshots: { ...state.floorSnapshots, [floorId]: { nodes, edges } },
      campusSnapshot: state.campusSnapshot,
    }
    history.current = [newState]
    historyStep.current = 0
    setHistoryInfo({ step: 0, length: 1 })
  }

  const switchToCampus = (nodes: NavNode[], edges: NavEdge[]) => {
    dispatch({ type: 'SWITCH_TO_CAMPUS', nodes, edges })
    const newState: EditorState = {
      ...initialState,
      activeBuildingId: 'campus',
      activeFloorId: null,
      nodes,
      edges,
      campusSnapshot: { nodes, edges },
      floorSnapshots: state.floorSnapshots,
    }
    history.current = [newState]
    historyStep.current = 0
    setHistoryInfo({ step: 0, length: 1 })
  }

  return {
    state,
    dispatch,
    recordHistory,
    handleUndo,
    handleRedo,
    canUndo,
    canRedo,
    switchFloor,
    switchToCampus,
  }
}
