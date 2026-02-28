---
phase: 14.1-node-selection-fixes-and-admin-room-number-edit
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/client/components/FloorPlanImage.tsx
  - src/client/pages/admin/MapEditorCanvas.tsx
autonomous: true
requirements: [FIX-03]

must_haves:
  truths:
    - "Clicking an already-selected node in select mode deselects it — selectedNodeId becomes null and the side panel closes"
    - "Clicking the floor plan image in select mode deselects any selected node or edge — side panel closes"
    - "Clicking a different (unselected) node in select mode still selects it normally"
    - "Clicking the floor plan image in add-node or add-edge mode does NOT trigger deselect — node placement and edge creation still work"
  artifacts:
    - path: "src/client/components/FloorPlanImage.tsx"
      provides: "Optional onClick prop on the Konva Image shape"
      contains: "onClick?"
    - path: "src/client/pages/admin/MapEditorCanvas.tsx"
      provides: "Toggle deselect in handleNodeClick + FloorPlanImage onClick wired"
      contains: "state.selectedNodeId === nodeId"
  key_links:
    - from: "MapEditorCanvas.tsx handleNodeClick"
      to: "dispatch SELECT_NODE id: null"
      via: "toggle guard: if selectedNodeId === nodeId, dispatch null"
      pattern: "selectedNodeId === nodeId"
    - from: "MapEditorCanvas.tsx FloorPlanImage usage"
      to: "FloorPlanImage onClick prop"
      via: "mode guard: only dispatches in select mode"
      pattern: "state.mode === 'select'"
---

<objective>
Fix admin map editor node selection: clicking an already-selected node toggles it off (deselects), and clicking the floor plan image in select mode also deselects any current selection.

Purpose: Currently both behaviors silently do nothing — an admin cannot deselect a node without pressing Escape or clicking the transparent stage background. This makes the selection UX feel broken.
Output: Two surgical changes across two files — FloorPlanImage gets an optional onClick prop, MapEditorCanvas gets a toggle guard in handleNodeClick and wires the FloorPlanImage onClick.
</objective>

<execution_context>
@C:/Users/admin/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/admin/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/14.1-node-selection-fixes-and-admin-room-number-edit/14.1-RESEARCH.md

<interfaces>
<!-- Key interfaces the executor needs. Extracted from codebase. -->

From src/client/components/FloorPlanImage.tsx (current interface — no onClick):
```typescript
interface FloorPlanImageProps {
  image: HTMLImageElement | undefined
  isFullLoaded: boolean
  viewportWidth: number
  viewportHeight: number
  onImageRectChange?: (rect: { x: number; y: number; width: number; height: number }) => void
}
// Renders: <Image ref={imageRef} image={image} x={rect.x} y={rect.y} width={rect.width} height={rect.height} />
```

From src/client/pages/admin/MapEditorCanvas.tsx (handleNodeClick — current, no toggle):
```typescript
const handleNodeClick = useCallback(
  (nodeId: string) => {
    if (state.mode === 'select') {
      dispatch({ type: 'SELECT_NODE', id: nodeId })  // ← always selects, no toggle
    } else if (state.mode === 'add-edge') {
      // ... edge creation logic unchanged
    }
  },
  [state.mode, state.pendingEdgeSourceId, state.nodes, dispatch, recordHistory],
  // NOTE: state.selectedNodeId NOT in dep array yet — must add for toggle
)
```

From src/client/pages/admin/MapEditorCanvas.tsx (FloorPlanImage usage — current, no onClick):
```typescript
<FloorPlanImage
  image={image}
  isFullLoaded={isFullLoaded}
  viewportWidth={width}
  viewportHeight={editorHeight - 52}
  onImageRectChange={setImageRect}
  // ← no onClick prop wired yet
/>
```

From src/client/pages/admin/MapEditorCanvas.tsx (handleStageClick — for context):
```typescript
} else if (state.mode === 'select') {
  // Clear selection when clicking empty canvas
  if (e.target === stage) {          // ← only fires when stage background clicked
    dispatch({ type: 'SELECT_NODE', id: null })
    dispatch({ type: 'SELECT_EDGE', id: null })
  }
}
// When the floor plan Image shape is clicked, e.target !== stage,
// so handleStageClick does NOT clear selection — that's the gap we're fixing.
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add optional onClick prop to FloorPlanImage</name>
  <files>src/client/components/FloorPlanImage.tsx</files>
  <action>
Add an optional `onClick?: () => void` prop to `FloorPlanImageProps` and wire it to the Konva `<Image>` element.

Exact changes:
1. Add `onClick?: () => void` to the `FloorPlanImageProps` interface (after `onImageRectChange?`).
2. Destructure `onClick` from the function parameters.
3. Add `onClick={onClick}` to the `<Image>` JSX element.

No other changes. The prop is optional so student-facing `FloorPlanCanvas.tsx` (which doesn't pass onClick) continues to work unchanged.

Anti-pattern to avoid: Do NOT add `e.cancelBubble = true` here — event bubbling behavior in the admin canvas is deliberate (add-node mode relies on the stage also receiving the click).
  </action>
  <verify>
    <automated>rtk tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>FloorPlanImageProps includes `onClick?: () => void`; Konva Image has `onClick={onClick}`; TypeScript passes with no errors</done>
</task>

<task type="auto">
  <name>Task 2: Fix handleNodeClick toggle and wire FloorPlanImage onClick in MapEditorCanvas</name>
  <files>src/client/pages/admin/MapEditorCanvas.tsx</files>
  <action>
Two changes in `MapEditorCanvas.tsx`:

**Change A — handleNodeClick toggle deselect:**
In the `handleNodeClick` useCallback, add a toggle guard in the `select` mode branch:
```typescript
if (state.mode === 'select') {
  if (state.selectedNodeId === nodeId) {
    // Toggle: clicking already-selected node clears selection
    dispatch({ type: 'SELECT_NODE', id: null })
  } else {
    dispatch({ type: 'SELECT_NODE', id: nodeId })
  }
}
```
Also add `state.selectedNodeId` to the `useCallback` dep array (currently absent — would cause stale closure on toggle check):
```typescript
[state.mode, state.selectedNodeId, state.pendingEdgeSourceId, state.nodes, dispatch, recordHistory]
```

**Change B — Wire FloorPlanImage onClick:**
Add `onClick` prop to the `<FloorPlanImage>` JSX in the render:
```typescript
<FloorPlanImage
  image={image}
  isFullLoaded={isFullLoaded}
  viewportWidth={width}
  viewportHeight={editorHeight - 52}
  onImageRectChange={setImageRect}
  onClick={() => {
    if (state.mode === 'select') {
      dispatch({ type: 'SELECT_NODE', id: null })
      dispatch({ type: 'SELECT_EDGE', id: null })
    }
  }}
/>
```

The `if (state.mode === 'select')` guard is critical — without it, clicking the floor plan image in add-node mode would clear selection AND the stage click would then place a node (double effect). In add-node mode the onClick does nothing; the stage handleStageClick handles placement. In add-edge mode similarly, this guard prevents interference with edge creation.

Pitfall to avoid: Do NOT forget to add `state.selectedNodeId` to the handleNodeClick dep array. Without it, the toggle comparison `state.selectedNodeId === nodeId` reads a stale closure value and the toggle will not work on second click.
  </action>
  <verify>
    <automated>rtk tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>
    - handleNodeClick dep array includes `state.selectedNodeId`
    - Clicking already-selected node dispatches `SELECT_NODE id: null`
    - FloorPlanImage receives onClick that clears selection only in select mode
    - TypeScript passes with no errors
    - rtk lint reports no new violations
  </done>
</task>

</tasks>

<verification>
After both tasks:
1. `rtk tsc --noEmit` — zero TypeScript errors
2. `rtk lint` — zero new Biome violations
3. Manual browser test in admin editor: place a node → select it → click it again → side panel closes (deselected) ✓; click floor plan image background → selection clears ✓; place new node in add-node mode still works ✓
</verification>

<success_criteria>
- Admin can click an already-selected node to deselect it (toggle behavior)
- Admin can click the floor plan image to deselect the current selection in select mode
- Node placement and edge creation in add-node/add-edge modes are unaffected
- TypeScript and Biome pass with zero errors
</success_criteria>

<output>
After completion, create `.planning/phases/14.1-node-selection-fixes-and-admin-room-number-edit/14.1-01-SUMMARY.md`
</output>
