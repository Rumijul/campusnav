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
}

export type EditorAction =
  | { type: 'LOAD_GRAPH'; nodes: NavNode[]; edges: NavEdge[] }
  | { type: 'SET_MODE'; mode: EditorMode }
  | { type: 'PLACE_NODE'; node: NavNode }
  | { type: 'MOVE_NODE'; id: string; x: number; y: number }
  | { type: 'UPDATE_NODE'; id: string; changes: Partial<NavNode> }
  | { type: 'SELECT_NODE'; id: string | null }
  | { type: 'SET_PENDING_EDGE_SOURCE'; id: string | null }
  | { type: 'CREATE_EDGE'; edge: NavEdge }
  | { type: 'UPDATE_EDGE'; id: string; changes: Partial<NavEdge> }
  | { type: 'SELECT_EDGE'; id: string | null }
  | { type: 'DELETE_NODE'; id: string }
  | { type: 'DELETE_EDGE'; id: string }
  | { type: 'MARK_SAVED' }
  | { type: 'RESTORE_SNAPSHOT'; snapshot: EditorState }

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
        pendingEdgeSourceId: state.pendingEdgeSourceId === action.id ? null : state.pendingEdgeSourceId,
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

  return {
    state,
    dispatch,
    recordHistory,
    handleUndo,
    handleRedo,
    canUndo,
    canRedo,
  }
}
