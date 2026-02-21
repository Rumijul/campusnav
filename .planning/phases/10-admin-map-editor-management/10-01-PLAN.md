---
phase: 10-admin-map-editor-management
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/client/hooks/useEditorState.ts
  - src/client/pages/admin/MapEditorCanvas.tsx
  - src/client/components/admin/EditorSidePanel.tsx
autonomous: true
requirements: [EDIT-06]

must_haves:
  truths:
    - "Admin can select a node on the canvas and press Delete or Backspace to remove it (and all its connected edges)"
    - "Admin can select an edge on the canvas and press Delete or Backspace to remove it"
    - "Admin can click Delete in the EditorSidePanel to remove the selected node or edge"
    - "Pressing Backspace while typing in a side panel text field does NOT trigger deletion"
    - "Deleting a node that has connected edges removes those edges too — no dangling edges"
    - "Deletion is undoable via Ctrl+Z"
  artifacts:
    - path: "src/client/hooks/useEditorState.ts"
      provides: "DELETE_NODE and DELETE_EDGE reducer cases"
      contains: "DELETE_NODE"
    - path: "src/client/pages/admin/MapEditorCanvas.tsx"
      provides: "keyboard delete handler with input focus guard"
      contains: "isInputFocused"
    - path: "src/client/components/admin/EditorSidePanel.tsx"
      provides: "Delete button for selected node or edge"
      contains: "onDeleteNode"
  key_links:
    - from: "src/client/pages/admin/MapEditorCanvas.tsx"
      to: "src/client/hooks/useEditorState.ts"
      via: "dispatch({ type: 'DELETE_NODE' }) and dispatch({ type: 'DELETE_EDGE' })"
      pattern: "DELETE_NODE|DELETE_EDGE"
    - from: "src/client/components/admin/EditorSidePanel.tsx"
      to: "src/client/hooks/useEditorState.ts"
      via: "onDeleteNode/onDeleteEdge props calling dispatch"
      pattern: "onDeleteNode|onDeleteEdge"
---

<objective>
Add node and edge deletion to the admin map editor via keyboard shortcuts and the side panel Delete button.

Purpose: EDIT-06 requires admins to delete any node. This plan wires DELETE_NODE (cascade to edges) and DELETE_EDGE into the reducer, keyboard handler, and side panel — completing the deletion surface.
Output: Extended useEditorState with deletion actions; MapEditorCanvas with keyboard delete (with input focus guard); EditorSidePanel with Delete button.
</objective>

<execution_context>
@C:/Users/admin/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/admin/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/09-admin-map-editor-visual/09-01-SUMMARY.md
@.planning/phases/09-admin-map-editor-visual/09-03-SUMMARY.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add DELETE_NODE and DELETE_EDGE to useEditorState reducer</name>
  <files>src/client/hooks/useEditorState.ts</files>
  <action>
In `src/client/hooks/useEditorState.ts`, extend the `EditorAction` discriminated union with two new action types:

```typescript
| { type: 'DELETE_NODE'; id: string }
| { type: 'DELETE_EDGE'; id: string }
```

Add two new cases to `editorReducer`:

```typescript
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
```

CRITICAL: DELETE_NODE MUST filter edges simultaneously (not after) — both nodes and edges update in the same returned state object to prevent any intermediate state with dangling edges.

After adding the cases, run `rtk tsc` to confirm zero TypeScript errors. The reducer switch is likely exhaustive-typed — the new cases must be handled before the compiler is satisfied.
  </action>
  <verify>rtk tsc passes with zero errors; grep confirms 'DELETE_NODE' and 'DELETE_EDGE' exist in useEditorState.ts</verify>
  <done>useEditorState.ts exports DELETE_NODE and DELETE_EDGE action types; reducer handles both; DELETE_NODE cascades to edges; DELETE_EDGE clears selectedEdgeId</done>
</task>

<task type="auto">
  <name>Task 2: Wire keyboard delete in MapEditorCanvas + Delete button in EditorSidePanel</name>
  <files>src/client/pages/admin/MapEditorCanvas.tsx, src/client/components/admin/EditorSidePanel.tsx</files>
  <action>
**MapEditorCanvas.tsx — keyboard delete:**

Locate the existing `handleKeyDown` function (already registered on `window` in Phase 9). Extend it to handle Delete and Backspace:

```typescript
// Add BEFORE any Delete/Backspace handling:
const isInputFocused = ['INPUT', 'TEXTAREA', 'SELECT'].includes(
  (document.activeElement as HTMLElement)?.tagName ?? ''
)
if (isInputFocused) return

if (e.key === 'Delete' || e.key === 'Backspace') {
  if (state.selectedNodeId) {
    dispatch({ type: 'DELETE_NODE', id: state.selectedNodeId })
    recordHistory()
  } else if (state.selectedEdgeId) {
    dispatch({ type: 'DELETE_EDGE', id: state.selectedEdgeId })
    recordHistory()
  }
}
```

The `isInputFocused` guard MUST come first — without it, typing in the side panel Name field and pressing Backspace deletes the selected node (documented critical pitfall from research).

**EditorSidePanel.tsx — Delete button:**

Add `onDeleteNode: (id: string) => void` and `onDeleteEdge: (id: string) => void` props to the `EditorSidePanelProps` interface.

In the node form section, add a Delete button at the bottom (use red styling to signal destructive action):

```tsx
<button
  type="button"
  onClick={() => onDeleteNode(node.id)}
  className="mt-4 w-full rounded bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
>
  Delete Node
</button>
```

In the edge form section, add:

```tsx
<button
  type="button"
  onClick={() => onDeleteEdge(edge.id)}
  className="mt-4 w-full rounded bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
>
  Delete Edge
</button>
```

**MapEditorCanvas.tsx — wire side panel props:**

Pass the new delete handlers to `EditorSidePanel`:

```tsx
<EditorSidePanel
  ...existing props...
  onDeleteNode={(id) => { dispatch({ type: 'DELETE_NODE', id }); recordHistory() }}
  onDeleteEdge={(id) => { dispatch({ type: 'DELETE_EDGE', id }); recordHistory() }}
/>
```

Run `rtk tsc` and `rtk lint` after changes.
  </action>
  <verify>rtk tsc passes; rtk lint passes; manually test in browser: place a node, select it, press Delete key → node disappears; place an edge, select it, press Delete → edge disappears; type in Name field with node selected, press Backspace → only the character is deleted, not the node; click Delete button in side panel → node/edge removed</verify>
  <done>Keyboard Delete/Backspace removes selected node or edge from canvas; input focus guard prevents accidental deletion when typing; EditorSidePanel Delete button triggers deletion; all deletions are undoable via Ctrl+Z; node deletion cascades to connected edges</done>
</task>

</tasks>

<verification>
1. Run `rtk tsc` — zero errors
2. Run `rtk lint` — zero errors
3. Start dev server, navigate to admin map editor
4. Place two nodes, connect them with an edge
5. Select the node (click it), press Delete key → both node and its edge disappear
6. Press Ctrl+Z → node and edge restored
7. Select an edge, press Delete → edge disappears; nodes remain
8. Select a node, open side panel, click "Delete Node" → node + connected edges disappear
9. Select a node, click Name field in side panel, press Backspace to edit → only the character is removed, node stays on canvas
</verification>

<success_criteria>
- DELETE_NODE and DELETE_EDGE are valid EditorAction types in useEditorState.ts
- DELETE_NODE reducer case filters both nodes AND edges in one state update (no dangling edges)
- MapEditorCanvas handleKeyDown guards against input focus before triggering deletion
- EditorSidePanel renders Delete Node / Delete Edge buttons that call onDeleteNode/onDeleteEdge props
- Deletion is confirmed undoable via undo/redo (recordHistory called after every delete dispatch)
- rtk tsc and rtk lint pass with zero errors
</success_criteria>

<output>
After completion, create `.planning/phases/10-admin-map-editor-management/10-01-SUMMARY.md`
</output>
</invoke>