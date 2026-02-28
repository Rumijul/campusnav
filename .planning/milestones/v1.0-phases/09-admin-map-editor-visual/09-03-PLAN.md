---
phase: 09-admin-map-editor-visual
plan: 03
type: execute
wave: 3
depends_on: ["09-02"]
files_modified:
  - src/client/components/admin/EdgeLayer.tsx
  - src/client/components/admin/EditorSidePanel.tsx
  - src/client/pages/admin/MapEditorCanvas.tsx
autonomous: true
requirements: [EDIT-04, EDIT-05]

must_haves:
  truths:
    - "Admin can create edges by clicking source node then target node in Add Edge mode"
    - "A rubber-band preview line follows the cursor between source and target clicks"
    - "Edge distance/weight is auto-calculated from pixel distance between nodes"
    - "Admin can mark an edge as wheelchair-accessible or not via the side panel"
    - "Admin can edit node properties (name, type, category, description) in the side panel"
    - "Edges are color-coded: green for accessible, grey for non-accessible"
    - "Selected node/edge shows a blue highlight; side panel opens with its properties"
    - "Pressing Escape cancels pending edge creation"
  artifacts:
    - path: "src/client/components/admin/EdgeLayer.tsx"
      provides: "Edge rendering + rubber-band preview line"
      min_lines: 50
    - path: "src/client/components/admin/EditorSidePanel.tsx"
      provides: "OSM-style property editor for selected node or edge"
      min_lines: 80
    - path: "src/client/pages/admin/MapEditorCanvas.tsx"
      provides: "Updated with edge creation wiring, side panel, and full mode interaction"
  key_links:
    - from: "src/client/components/admin/EdgeLayer.tsx"
      to: "src/client/hooks/useEditorState.ts"
      via: "NavEdge type + edge state"
      pattern: "NavEdge"
    - from: "src/client/components/admin/EditorSidePanel.tsx"
      to: "src/client/hooks/useEditorState.ts"
      via: "UPDATE_NODE and UPDATE_EDGE dispatch"
      pattern: "UPDATE_NODE|UPDATE_EDGE"
    - from: "src/client/pages/admin/MapEditorCanvas.tsx"
      to: "src/client/components/admin/EdgeLayer.tsx"
      via: "render inside Stage"
      pattern: "EdgeLayer"
---

<objective>
Add edge creation with rubber-band preview and the OSM-style side panel for editing node/edge properties.

Purpose: Complete the remaining EDIT-04 (edge creation with distance metadata) and EDIT-05 (accessibility marking) requirements. The side panel enables property editing for both nodes and edges, making the editor fully functional for graph construction.

Output:
- `src/client/components/admin/EdgeLayer.tsx` — Edge rendering + rubber-band preview
- `src/client/components/admin/EditorSidePanel.tsx` — Property panel for selected node/edge
- Updated `src/client/pages/admin/MapEditorCanvas.tsx` — Full interaction wiring
</objective>

<execution_context>
@C:/Users/LENOVO/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/LENOVO/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/09-admin-map-editor-visual/09-RESEARCH.md
@.planning/phases/09-admin-map-editor-visual/09-01-SUMMARY.md
@.planning/phases/09-admin-map-editor-visual/09-02-SUMMARY.md
@src/shared/types.ts
@src/client/hooks/useEditorState.ts
@src/client/pages/admin/MapEditorCanvas.tsx
@src/client/components/admin/NodeMarkerLayer.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create EdgeLayer with edge rendering and rubber-band preview</name>
  <files>src/client/components/admin/EdgeLayer.tsx</files>
  <action>
Create `src/client/components/admin/EdgeLayer.tsx` — a Konva Layer that renders all edges and the rubber-band preview line during edge creation.

**Props:**
```typescript
interface EdgeLayerProps {
  edges: NavEdge[]
  nodes: NavNode[]
  selectedEdgeId: string | null
  pendingEdgeSourceId: string | null
  cursorPosition: { x: number; y: number } | null  // canvas-space pixel coords of cursor
  imageRect: { x: number; y: number; width: number; height: number } | null
  mode: EditorMode
  onEdgeClick: (edgeId: string) => void
}
```

**Edge rendering:**
For each edge in `edges`:
1. Find source and target nodes by ID from the `nodes` array
2. Convert both nodes' normalized coords to pixel coords: `px = imageRect.x + node.x * imageRect.width`
3. Render a Konva `Line` with `points={[srcPx, srcPy, tgtPx, tgtPy]}`
4. Color coding per decision:
   - Accessible edges (`edge.accessible === true`): `stroke="#22c55e"` (green)
   - Non-accessible edges: `stroke="#9ca3af"` (grey)
5. Stroke width: `2` at rest
6. Selected edge (`edge.id === selectedEdgeId`): `stroke="#3b82f6"` (blue), `strokeWidth={3}`
7. Set `listening={true}` on edge lines (they need to be clickable for selection)
8. `onClick` → `onEdgeClick(edge.id)`
9. `hitStrokeWidth={10}` — make edges easier to click (wider hit area than visual width)

**Rubber-band preview:**
When `pendingEdgeSourceId` is not null and `cursorPosition` is not null and `mode === 'add-edge'`:
1. Find the source node and compute its pixel position
2. Render a dashed `Line` from source pixel position to `cursorPosition`
3. Props: `stroke="#3b82f6"`, `strokeWidth={2}`, `dash={[8, 4]}`, `listening={false}` (CRITICAL — must not intercept click events)

**Return:** A Konva `<Layer>` wrapping all edge Lines and the optional rubber-band preview Line.

If `imageRect` is null, return null (no rendering until floor plan loads).

Export as default.
  </action>
  <verify>
Run `npx tsc --noEmit` — zero TypeScript errors.
Run `npx biome check src/client/components/admin/EdgeLayer.tsx` — zero errors.
  </verify>
  <done>
EdgeLayer renders color-coded edge lines (green/grey/blue-selected), supports click-to-select with wide hit area, and shows dashed rubber-band preview line during edge creation. Preview line has listening={false} to avoid intercepting events.
  </done>
</task>

<task type="auto">
  <name>Task 2: Create EditorSidePanel and wire edge creation + side panel into MapEditorCanvas</name>
  <files>
    src/client/components/admin/EditorSidePanel.tsx
    src/client/pages/admin/MapEditorCanvas.tsx
  </files>
  <action>
**Create `src/client/components/admin/EditorSidePanel.tsx`:**

An HTML overlay panel (not Konva) positioned on the right side of the editor (absolute, right-0, top of canvas area, z-10). Styled with Tailwind. Same overlay pattern as SearchOverlay/ZoomControls.

**Props:**
```typescript
interface EditorSidePanelProps {
  selectedNode: NavNode | null
  selectedEdge: (NavEdge & { sourceName: string; targetName: string }) | null
  onUpdateNode: (id: string, changes: Partial<NavNode>) => void
  onUpdateEdge: (id: string, changes: Partial<NavEdge>) => void
  onClose: () => void
}
```

**Panel visibility:** Only renders when `selectedNode` or `selectedEdge` is non-null.

**Node editing form (when selectedNode is set):**
- Title: "Node Properties"
- **Name** field: text input, value=`selectedNode.label`, onChange dispatches update with `{ label: value }`
- **Type** dropdown: select with two option groups:
  - Landmark types (visible): room, entrance, elevator, restroom, landmark
  - Navigation types (hidden): stairs, ramp, junction, hallway
  - On change: dispatch update with `{ type: value, searchable: isLandmarkType(value) }` — searchable is true for landmark types, false for navigation types
- **Category display**: Shows the type name as human-readable category (e.g., "Room", "Hallway Junction")
- **Room Number** field: text input (optional), value=`selectedNode.roomNumber ?? ''`
- **Description** field: textarea (optional), value=`selectedNode.description ?? ''`
- Close button (X) at top right of panel

Helper: `isLandmarkType(type: NavNodeType): boolean` — returns true for room, entrance, elevator, restroom, landmark.

**Edge editing form (when selectedEdge is set):**
- Title: "Edge Properties"
- **Source → Target** display: `${sourceName} → ${targetName}` (read-only text)
- **Distance (weight)** field: number input, value=`selectedEdge.standardWeight`, step=`0.001`. On change: update `standardWeight` and also `accessibleWeight` if the edge is accessible (mirror the weights). If edge is non-accessible, only update `standardWeight` (accessibleWeight stays at 1e10).
- **Wheelchair Accessible** toggle: checkbox/toggle input, checked=`selectedEdge.accessible`. On change:
  - If toggling to accessible: set `{ accessible: true, accessibleWeight: selectedEdge.standardWeight }`
  - If toggling to non-accessible: set `{ accessible: false, accessibleWeight: 1e10 }` (sentinel value per project convention)
- **Accessibility Notes** field: text input (optional)
- Close button (X) at top right

Style: `w-72 bg-white border-l shadow-lg p-4 overflow-y-auto`. The panel should have a max height and scroll if needed. Use `absolute right-0 top-0 h-full` positioning within the editor container.

All inputs should use controlled values that update on change. Changes apply immediately to editor state (OSM-style — per user's explicit request). The Save button in the toolbar persists to server.

Export as default.

**Update `src/client/pages/admin/MapEditorCanvas.tsx`:**

Wire in EdgeLayer and EditorSidePanel.

1. **Add edge creation logic to handleNodeClick:**
   - In `add-edge` mode:
     - If `pendingEdgeSourceId` is null: dispatch `SET_PENDING_EDGE_SOURCE(nodeId)` — first click
     - If `pendingEdgeSourceId` is set and `nodeId !== pendingEdgeSourceId` (different node): create the edge
       - Find source and target nodes
       - Calculate distance: `calcDistance(source, target)` (from useEditorState helpers)
       - Create edge: `{ id: generateEdgeId(sourceId, targetId), sourceId, targetId, standardWeight: dist, accessibleWeight: dist, accessible: true, bidirectional: true }`
       - Dispatch `CREATE_EDGE(edge)` then `recordHistory()`
       - Dispatch `SELECT_EDGE(edge.id)` so side panel opens for the new edge
     - If same node clicked: ignore (can't connect node to itself)

2. **Track cursor position for rubber-band:**
   - Add `cursorCanvasPos` state: `{ x: number; y: number } | null`
   - In `handleMouseMove` (on Stage `onMouseMove`):
     - If `mode === 'add-edge'` and `pendingEdgeSourceId` is not null:
       - Get pointer position via `stageRef.current.getPointerPosition()`
       - Convert to canvas-space: `canvasX = (pos.x - stagePos.x) / scale`, `canvasY = (pos.y - stagePos.y) / scale` (where stagePos = `stage.position()`, scale = `stage.scaleX()`)
       - Set `cursorCanvasPos({ x: canvasX, y: canvasY })`
     - Otherwise: set `cursorCanvasPos(null)`

3. **Render EdgeLayer inside Stage (between floor plan Layer and NodeMarkerLayer):**
   ```tsx
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
   ```

4. **handleEdgeClick:** dispatch `SELECT_EDGE(edgeId)` (clears node selection via reducer).

5. **Render EditorSidePanel as HTML overlay (outside Stage, inside the relative container):**
   ```tsx
   <EditorSidePanel
     selectedNode={state.selectedNodeId ? state.nodes.find(n => n.id === state.selectedNodeId) ?? null : null}
     selectedEdge={selectedEdgeWithNames}  // compute from state.selectedEdgeId, look up source/target labels
     onUpdateNode={(id, changes) => { dispatch({ type: 'UPDATE_NODE', id, changes }); recordHistory() }}
     onUpdateEdge={(id, changes) => { dispatch({ type: 'UPDATE_EDGE', id, changes }); recordHistory() }}
     onClose={() => { dispatch({ type: 'SELECT_NODE', id: null }); dispatch({ type: 'SELECT_EDGE', id: null }) }}
   />
   ```

6. **Escape key handling (already in keyboard shortcuts):**
   - Escape clears `pendingEdgeSourceId` (cancel edge creation mid-progress)
   - Also clear selection

7. **Update handleStageClick for add-edge mode:**
   - In `add-edge` mode: clicking empty canvas (not a node) cancels the pending edge. Dispatch `SET_PENDING_EDGE_SOURCE(null)`.

Import EdgeLayer and EditorSidePanel. Import `calcDistance` and `generateEdgeId` from useEditorState.
  </action>
  <verify>
Run `npx tsc --noEmit` — zero TypeScript errors.
Run `npx biome check src/client/components/admin/EditorSidePanel.tsx src/client/pages/admin/MapEditorCanvas.tsx src/client/components/admin/EdgeLayer.tsx` — zero errors.
Start dev server, log in as admin, and verify:
1. In Add Edge mode, clicking a node highlights it as pending source
2. A dashed blue line follows the cursor from source to cursor position
3. Clicking a second node creates an edge (visible as a line between them)
4. Pressing Escape cancels the pending edge
5. In Select mode, clicking a node opens the side panel with its properties
6. Changing name/type in side panel updates immediately
7. Clicking an edge opens its properties in the side panel
8. Toggling accessibility changes edge color (green ↔ grey)
9. Edges show as green (accessible) or grey (non-accessible)
  </verify>
  <done>
Edge creation via two-click flow with rubber-band preview works correctly. Side panel shows node properties (name, type, room number, description) and edge properties (weight, accessibility toggle). Changes apply immediately to editor state. Escape cancels pending edge. Edges color-coded green/grey. All five EDIT requirements (01-05) are now functional.
  </done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` passes with zero errors
2. `npx biome check .` passes with zero errors
3. Add Edge mode: click node A → rubber-band line appears → click node B → edge created with auto-calculated weight
4. Escape cancels pending edge creation (rubber-band disappears)
5. Edge color coding: green for accessible, grey for non-accessible, blue for selected
6. Side panel opens on node selection showing all property fields
7. Side panel opens on edge selection showing weight + accessibility toggle
8. Changing node type between landmark/navigation types updates searchable flag and visual marker style
9. Toggling edge accessibility to false sets accessibleWeight to 1e10
10. All changes tracked by undo/redo (node property edits, edge creation, accessibility changes)
</verification>

<success_criteria>
- EDIT-04: Admin can create edges between nodes by clicking them sequentially; distance auto-calculated; rubber-band preview visible
- EDIT-05: Admin can mark edges as wheelchair-accessible or not via side panel toggle
- Side panel matches OSM iD editor style: appears on selection, fields clearly labeled
- Edge visual design matches spec: green accessible, grey non-accessible, blue selected
- Escape cancels mid-creation edge
- All editor actions are undoable
</success_criteria>

<output>
After completion, create `.planning/phases/09-admin-map-editor-visual/09-03-SUMMARY.md`
</output>
