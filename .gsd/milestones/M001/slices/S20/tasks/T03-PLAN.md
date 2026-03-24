---
phase: 18-admin-multi-floor-editor
plan: 03
type: execute
wave: 2
depends_on: [18-01]
files_modified:
  - src/client/hooks/useEditorState.ts
autonomous: true
requirements:
  - MFLR-04
  - CAMP-02
  - CAMP-03
  - CAMP-04

must_haves:
  truths:
    - "useEditorState hook exports activeBuildingId and activeFloorId from its state"
    - "SWITCH_FLOOR action loads new floor nodes/edges and resets undo history"
    - "SWITCH_TO_CAMPUS action activates campus context and resets undo history"
    - "SWITCH_BUILDING action changes the active building and resets floor selection"
    - "floorSnapshots cache prevents re-fetching already-loaded floor data"
  artifacts:
    - path: "src/client/hooks/useEditorState.ts"
      provides: "Extended EditorState with multi-floor context + 3 new actions"
      contains: "activeBuildingId"
  key_links:
    - from: "SWITCH_FLOOR action"
      to: "undo history refs"
      via: "history.current reset to [newFloorState]; historyStep.current = 0"
      pattern: "SWITCH_FLOOR"
    - from: "floorSnapshots"
      to: "EditorState"
      via: "Record<number, { nodes: NavNode[]; edges: NavEdge[] }> cache keyed by floor DB id"
      pattern: "floorSnapshots"
---

<objective>
Extend useEditorState to support multi-floor and campus editing. The hook needs to track which building/floor is active and provide snapshot caching so floor switches don't re-fetch already-loaded data. Undo history resets on floor switch (auto-save handles persistence).

Purpose: MapEditorCanvas cannot implement floor switching UI without useEditorState providing activeBuildingId, activeFloorId, SWITCH_FLOOR, SWITCH_TO_CAMPUS, and SWITCH_BUILDING actions.

Output: useEditorState.ts with extended EditorState, new actions, and snapshot cache — fully backward compatible with existing usage in MapEditorCanvas.
</objective>

<execution_context>
@C:/Users/admin/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/admin/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md
@.planning/phases/18-admin-multi-floor-editor/18-CONTEXT.md
@.planning/phases/18-admin-multi-floor-editor/18-RESEARCH.md

<interfaces>
<!-- Current useEditorState.ts shape — executor must extend this, not replace it. -->

Current EditorState (all existing fields must be preserved):
```typescript
export type EditorState = {
  nodes: NavNode[]
  edges: NavEdge[]
  mode: EditorMode
  selectedNodeId: string | null
  selectedEdgeId: string | null
  pendingEdgeSourceId: string | null
  isDirty: boolean
}
```

Current actions (all must be preserved exactly):
LOAD_GRAPH, SET_MODE, PLACE_NODE, MOVE_NODE, UPDATE_NODE, SELECT_NODE,
SET_PENDING_EDGE_SOURCE, CREATE_EDGE, UPDATE_EDGE, SELECT_EDGE,
DELETE_NODE, DELETE_EDGE, MARK_SAVED, RESTORE_SNAPSHOT

Current hook return signature (must remain identical for backward compat):
```typescript
return { state, dispatch, recordHistory, handleUndo, handleRedo, canUndo, canRedo }
```

History mechanism: history.current: EditorState[], historyStep.current: number
Reset history pattern = history.current = [newState]; historyStep.current = 0; setHistoryInfo(...)
</interfaces>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Extend EditorState and add multi-floor actions to useEditorState</name>
  <files>src/client/hooks/useEditorState.ts</files>
  <action>
    Extend useEditorState.ts with multi-floor context. All existing fields and logic must be preserved exactly — only additions, no removals.

    **1. Extend EditorState type** — add 4 new fields after isDirty:
    ```typescript
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
    ```

    **2. Update initialState** — add defaults for new fields:
    ```typescript
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
    ```

    **3. Add 3 new action types** to EditorAction union (add after RESTORE_SNAPSHOT):
    ```typescript
    | { type: 'SWITCH_FLOOR'; floorId: number; nodes: NavNode[]; edges: NavEdge[] }
    | { type: 'SWITCH_TO_CAMPUS'; nodes: NavNode[]; edges: NavEdge[] }
    | { type: 'SWITCH_BUILDING'; buildingId: number | 'campus' }
    ```

    **4. Add 3 new cases to editorReducer** (add after the RESTORE_SNAPSHOT case, before the default):

    ```typescript
    case 'SWITCH_FLOOR':
      return {
        ...state,
        nodes: action.nodes,
        edges: action.edges,
        activeFloorId: action.floorId,
        activeBuildingId: typeof state.activeBuildingId === 'number' ? state.activeBuildingId : state.activeBuildingId,
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
    ```

    **5. Update the useEditorState hook's history reset** — SWITCH_FLOOR and SWITCH_TO_CAMPUS must reset undo history. The hook function currently has handleUndo/handleRedo using history refs. Add a resetHistory helper function inside the hook (after recordHistory), and call it from a useEffect that watches state.activeFloorId and state.activeBuildingId:

    Actually, reset history by wrapping dispatch for the switch actions. Add a `switchFloor` helper exported from the hook that dispatches SWITCH_FLOOR and resets history:

    Inside the useEditorState function body, after the existing recordHistory/handleUndo/handleRedo functions, add:

    ```typescript
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
    ```

    **6. Update the return object** of useEditorState to include the new helpers:
    ```typescript
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
    ```

    Note: The existing consumers of useEditorState (MapEditorCanvas.tsx) use destructuring, so adding new fields to the return is fully backward compatible — existing code continues working unchanged.
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>EditorState has activeBuildingId, activeFloorId, floorSnapshots, campusSnapshot fields; EditorAction union includes SWITCH_FLOOR, SWITCH_TO_CAMPUS, SWITCH_BUILDING; reducer handles all 3; switchFloor and switchToCampus helpers exported from hook; TypeScript compiles without errors; existing MapEditorCanvas.tsx continues to compile</done>
</task>

</tasks>

<verification>
After task completes:
1. `npx tsc --noEmit` passes — MapEditorCanvas.tsx and all existing consumers still compile
2. `grep "activeBuildingId" src/client/hooks/useEditorState.ts` returns matches
3. `grep "SWITCH_FLOOR" src/client/hooks/useEditorState.ts` returns match in union type AND reducer case
4. `grep "switchFloor" src/client/hooks/useEditorState.ts` returns match in hook return
5. `grep "floorSnapshots" src/client/hooks/useEditorState.ts` returns matches in type, initialState, and reducer
</verification>

<success_criteria>
- EditorState extended with activeBuildingId, activeFloorId, floorSnapshots, campusSnapshot
- Three new action types: SWITCH_FLOOR, SWITCH_TO_CAMPUS, SWITCH_BUILDING
- Reducer handles all three with correct field updates and selection resets
- switchFloor and switchToCampus helpers exported — each resets undo history to fresh state
- All existing exports and functionality preserved (hook return is a superset)
- TypeScript compiles without errors across the full project
</success_criteria>

<output>
After completion, create `.planning/phases/18-admin-multi-floor-editor/18-03-SUMMARY.md`
</output>
