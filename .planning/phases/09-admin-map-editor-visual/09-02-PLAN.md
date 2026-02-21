---
phase: 09-admin-map-editor-visual
plan: 02
type: execute
wave: 2
depends_on: ["09-01"]
files_modified:
  - src/client/pages/admin/MapEditorCanvas.tsx
  - src/client/components/admin/EditorToolbar.tsx
  - src/client/components/admin/NodeMarkerLayer.tsx
  - src/client/pages/admin/AdminShell.tsx
autonomous: true
requirements: [EDIT-01, EDIT-02, EDIT-03]

must_haves:
  truths:
    - "Admin sees the editor canvas with the floor plan image as background"
    - "Admin can switch between Select, Add Node, and Add Edge modes via toolbar"
    - "Admin can click on the canvas in Add Node mode to place a new node"
    - "Admin can upload a floor plan image that replaces the canvas background"
    - "Landmark nodes appear as pin markers with labels; navigation nodes appear as small grey dots"
    - "Nodes can be dragged to new positions in Select mode"
    - "Undo/Redo buttons work for node placement and movement"
  artifacts:
    - path: "src/client/pages/admin/MapEditorCanvas.tsx"
      provides: "Top-level editor component with Konva Stage, mode handling, node placement"
      min_lines: 100
    - path: "src/client/components/admin/EditorToolbar.tsx"
      provides: "Horizontal toolbar with mode buttons, upload, save, undo, redo"
      min_lines: 40
    - path: "src/client/components/admin/NodeMarkerLayer.tsx"
      provides: "Renders landmark markers and navigation dots on editor canvas"
      min_lines: 40
    - path: "src/client/pages/admin/AdminShell.tsx"
      provides: "Updated shell that mounts MapEditorCanvas instead of placeholder"
  key_links:
    - from: "src/client/pages/admin/MapEditorCanvas.tsx"
      to: "src/client/hooks/useEditorState.ts"
      via: "useEditorState() hook call"
      pattern: "useEditorState\\("
    - from: "src/client/pages/admin/MapEditorCanvas.tsx"
      to: "src/client/hooks/useMapViewport.ts"
      via: "useMapViewport() reuse for pan/zoom"
      pattern: "useMapViewport\\("
    - from: "src/client/pages/admin/AdminShell.tsx"
      to: "src/client/pages/admin/MapEditorCanvas.tsx"
      via: "import and render"
      pattern: "MapEditorCanvas"
    - from: "src/client/components/admin/EditorToolbar.tsx"
      to: "/api/admin/floor-plan"
      via: "fetch upload on file change"
      pattern: "api/admin/floor-plan"
---

<objective>
Build the visual map editor canvas with toolbar, node placement, and node rendering.

Purpose: This is the core visual editor — admin can see the floor plan, switch modes, place nodes, drag nodes, upload a new floor plan, and use undo/redo. This plan delivers the EDIT-01 (floor plan upload), EDIT-02 (landmark placement), and EDIT-03 (navigation node placement) requirements as interactive features.

Output:
- `src/client/pages/admin/MapEditorCanvas.tsx` — Editor canvas with Konva Stage
- `src/client/components/admin/EditorToolbar.tsx` — Mode buttons + upload + save + undo/redo
- `src/client/components/admin/NodeMarkerLayer.tsx` — Node rendering layer
- Updated `src/client/pages/admin/AdminShell.tsx` — Mounts the editor
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
@src/shared/types.ts
@src/client/hooks/useEditorState.ts
@src/client/hooks/useMapViewport.ts
@src/client/hooks/useViewportSize.ts
@src/client/hooks/useFloorPlanImage.ts
@src/client/components/FloorPlanImage.tsx
@src/client/components/LandmarkMarker.tsx
@src/client/pages/admin/AdminShell.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create MapEditorCanvas with Konva Stage, node placement, and floor plan rendering</name>
  <files>
    src/client/pages/admin/MapEditorCanvas.tsx
    src/client/components/admin/NodeMarkerLayer.tsx
  </files>
  <action>
**Create `src/client/components/admin/NodeMarkerLayer.tsx`:**

A Konva Layer that renders all editor nodes. Two visual styles based on node type:

- **Landmark nodes** (type in `room`, `entrance`, `elevator`, `restroom`, `landmark`): Google Maps-style pin marker using a Konva `Group` with a `Circle` (filled, colored) + `Text` label beneath. The marker pattern should match `LandmarkMarker.tsx` with counter-scaling: `scaleX={1/stageScale}`, `scaleY={1/stageScale}`. Use a recognizable pin color (e.g., red `#ef4444` fill).
- **Navigation nodes** (type in `stairs`, `ramp`, `junction`, `hallway`): Small grey `Circle` dot (radius ~4px at screen scale), also counter-scaled.
- **Selected node** (matching `selectedNodeId`): Add a blue highlight ring — an additional `Circle` with `stroke="#3b82f6"`, `strokeWidth=2`, no fill, slightly larger radius.

**Props:**
```typescript
interface NodeMarkerLayerProps {
  nodes: NavNode[]
  selectedNodeId: string | null
  stageScale: number
  imageRect: { x: number; y: number; width: number; height: number } | null
  mode: EditorMode
  onNodeClick: (nodeId: string) => void
  onNodeDragEnd: (nodeId: string, normX: number, normY: number) => void
}
```

Each node Group:
- Position: `x = imageRect.x + node.x * imageRect.width`, `y = imageRect.y + node.y * imageRect.height`
- `draggable={mode === 'select'}` — only draggable in Select mode
- `onClick` → calls `onNodeClick(node.id)`
- `onDragEnd` → compute normalized coords from the Group's position after drag:
  ```
  const pixX = e.target.x()
  const pixY = e.target.y()
  const normX = Math.max(0, Math.min(1, (pixX - imageRect.x) / imageRect.width))
  const normY = Math.max(0, Math.min(1, (pixY - imageRect.y) / imageRect.height))
  onNodeDragEnd(node.id, normX, normY)
  ```
- The Group is counter-scaled so screen size stays constant during zoom.

Export the component as default.

**Create `src/client/pages/admin/MapEditorCanvas.tsx`:**

Top-level editor component. Structure:

```typescript
import { useEditorState, generateNodeId } from '../../hooks/useEditorState'
import { useMapViewport } from '../../hooks/useMapViewport'
import { useViewportSize } from '../../hooks/useViewportSize'
// Konva imports: Stage, Layer, Image (from react-konva), useImage (from use-image)
```

**State setup:**
- Call `useEditorState()` for state/dispatch/undo/redo
- Call `useViewportSize()` for { width, height }
- Call `useMapViewport()` for pan/zoom handling
- Track `stageScale` via state (synced from viewport hook's onScaleChange callback — same pattern as student FloorPlanCanvas)
- Track `imageRect` via state (from FloorPlanImage's onImageRectChange callback)
- Track `floorPlanUrl` state — initially `/api/floor-plan/image`, changed to blob URL after upload

**Floor plan rendering:**
- Reuse the existing `FloorPlanImage` component for image loading and rendering in a Konva Layer
- Pass `floorPlanUrl` as the image source

**Initial data load:**
- In a `useEffect`, fetch `GET /api/map` on mount (`credentials: 'include'`). On success, dispatch `LOAD_GRAPH` with the response's nodes and edges.

**Stage setup:**
```tsx
<Stage
  ref={stageRef}
  width={width}
  height={height}
  draggable={state.mode === 'select'}  // CRITICAL: disable stage drag in add-node/add-edge modes
  onClick={handleStageClick}
  onMouseMove={handleMouseMove}
  onWheel={handleWheel}  // from useMapViewport
  onTouchStart={handleTouchStart}  // from useMapViewport
  onTouchMove={handleTouchMove}  // from useMapViewport
  onTouchEnd={handleTouchEnd}  // from useMapViewport
  style={{ cursor: state.mode === 'select' ? 'default' : 'crosshair' }}
>
  {/* Layer 1: Floor plan image */}
  <Layer ref={floorPlanLayerRef}>
    <FloorPlanImage ... />
  </Layer>

  {/* Layer 2: Node markers */}
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
```

**handleStageClick:**
- In `add-node` mode: If `e.target === stageRef.current` (clicked empty canvas, not a shape), get position via `floorPlanLayerRef.current.getRelativePointerPosition()`. Convert to normalized coords using imageRect. Create a new NavNode with `generateNodeId('room', 'New Node')`, type `'room'`, label `'New Node'`, searchable `true`, floor `1`. Dispatch `PLACE_NODE` then call `recordHistory()`. Then dispatch `SELECT_NODE` with the new node ID so the side panel opens for editing.
- In `add-edge` mode: handled in Plan 03
- In `select` mode: If `e.target === stageRef.current` (empty canvas), dispatch `SELECT_NODE(null)` and `SELECT_EDGE(null)` to clear selection.

**handleNodeClick:**
- In `select` mode: dispatch `SELECT_NODE(nodeId)`
- In `add-edge` mode: handled in Plan 03 (leave as no-op for now)

**handleNodeDragEnd:**
- Dispatch `MOVE_NODE(nodeId, normX, normY)` then call `recordHistory()`.

**handleSave:**
```typescript
const handleSave = async () => {
  const graph: NavGraph = {
    nodes: state.nodes,
    edges: state.edges,
    metadata: { buildingName: 'Main Building', floor: 1, lastUpdated: new Date().toISOString() }
  }
  const res = await fetch('/api/admin/graph', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(graph),
  })
  if (res.ok) dispatch({ type: 'MARK_SAVED' })
}
```

**handleUpload:**
- Hidden `<input type="file" accept="image/*">` triggered from toolbar
- On file selected: `URL.createObjectURL(file)` → set `floorPlanUrl` for instant preview
- In background: POST to `/api/admin/floor-plan` with FormData (no manual Content-Type header)

**Keyboard shortcuts:**
- `useEffect` on `window` for `keydown`:
  - `Ctrl+Z` → handleUndo
  - `Ctrl+Y` or `Ctrl+Shift+Z` → handleRedo
  - `Escape` → dispatch `SET_PENDING_EDGE_SOURCE(null)` + `SELECT_NODE(null)` + `SELECT_EDGE(null)`

Export as default.
  </action>
  <verify>
Run `npx tsc --noEmit` — zero TypeScript errors.
Run `npx biome check src/client/pages/admin/MapEditorCanvas.tsx src/client/components/admin/NodeMarkerLayer.tsx` — zero errors.
  </verify>
  <done>
MapEditorCanvas renders the floor plan with pan/zoom, loads graph from API, supports node placement in Add Node mode, node dragging in Select mode, floor plan upload, save, undo/redo keyboard shortcuts. NodeMarkerLayer renders landmark pins and navigation dots with selection highlighting.
  </done>
</task>

<task type="auto">
  <name>Task 2: Create EditorToolbar and wire MapEditorCanvas into AdminShell</name>
  <files>
    src/client/components/admin/EditorToolbar.tsx
    src/client/pages/admin/AdminShell.tsx
  </files>
  <action>
**Create `src/client/components/admin/EditorToolbar.tsx`:**

A horizontal HTML toolbar (absolute positioned at top of editor, z-10, same overlay pattern as SearchOverlay/ZoomControls) with Tailwind styling.

**Props:**
```typescript
interface EditorToolbarProps {
  mode: EditorMode
  onModeChange: (mode: EditorMode) => void
  onUpload: () => void
  onSave: () => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  isDirty: boolean
  onLogout: () => void
}
```

**Layout:**
```
[ Select | Add Node | Add Edge ]  |  [ Upload Floor Plan ]  [ Save ]  [ Undo ] [ Redo ]  |  [ Logout ]
```

- Left group: three mode buttons. Active mode has a distinct style (e.g., `bg-blue-600 text-white`) while inactive has `bg-white text-gray-700 border`. Use `type="button"` on all buttons.
- Middle group: Upload Floor Plan button (triggers `onUpload`), Save button (triggers `onSave`, `bg-green-600 text-white`, grayed out / less prominent when `!isDirty`).
- Right group: Undo button (disabled when `!canUndo`), Redo button (disabled when `!canRedo`), Logout button (`bg-red-500 text-white`).

Style the toolbar container:
```
bg-white border-b shadow-sm px-4 py-2 flex items-center gap-2 flex-wrap
```

Use semantic HTML — all interactive elements are `<button>` elements (not divs with onClick). Disabled buttons get `opacity-50 cursor-not-allowed`.

Export as default.

**Update `src/client/pages/admin/AdminShell.tsx`:**

Replace the placeholder content with the MapEditorCanvas.

```typescript
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import MapEditorCanvas from './MapEditorCanvas'

export default function AdminShell() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      <MapEditorCanvas onLogout={handleLogout} />
    </div>
  )
}
```

The AdminShell now passes `onLogout` to MapEditorCanvas (which passes it to EditorToolbar). The old header with "Admin Panel" and standalone Logout button is replaced — the toolbar contains the logout button now. The outer div is `h-screen w-screen` to give the editor full viewport space.

**Update MapEditorCanvas to accept `onLogout` prop** and pass it through to EditorToolbar. The toolbar is rendered as an HTML overlay above the Konva Stage (not inside it). Structure:

```tsx
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
  <div className="flex-1" style={{ paddingTop: '52px' }}>
    <Stage ...>
      ...
    </Stage>
  </div>
  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
</div>
```

The toolbar sits at the top; the Stage fills the remaining space below it.
  </action>
  <verify>
Run `npx tsc --noEmit` — zero TypeScript errors.
Run `npx biome check src/client/components/admin/EditorToolbar.tsx src/client/pages/admin/AdminShell.tsx src/client/pages/admin/MapEditorCanvas.tsx` — zero errors.
Start dev server (`npm run dev`), navigate to `/admin/login`, log in, verify the editor loads with:
1. Toolbar visible at top with all buttons
2. Floor plan image renders on canvas
3. Clicking "Add Node" then clicking canvas places a node
4. Nodes appear as markers on the floor plan
5. Switching to "Select" mode allows dragging nodes
6. Undo/Redo buttons respond to placement and drag actions
  </verify>
  <done>
EditorToolbar renders with mode switching, upload, save, undo/redo, and logout. AdminShell mounts MapEditorCanvas as full-screen editor. Node placement, dragging, and undo/redo are functional. Floor plan upload replaces canvas background.
  </done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` passes with zero errors
2. `npx biome check .` passes with zero errors
3. Admin can log in and see the editor canvas with floor plan
4. Toolbar mode buttons switch between Select/Add Node/Add Edge with visual feedback
5. Clicking canvas in Add Node mode places a node at the click position
6. Landmark nodes show as pin markers with labels; navigation nodes show as grey dots
7. Dragging a node in Select mode updates its position
8. Undo reverses the last action; Redo re-applies it
9. Upload Floor Plan button opens file picker; selected image replaces canvas background
10. Save button sends graph to POST /api/admin/graph
</verification>

<success_criteria>
- EDIT-01: Admin can upload a floor plan image as the map base layer
- EDIT-02: Admin can place visible landmark nodes on the floor plan (default type is 'room')
- EDIT-03: Admin can place hidden navigation nodes (changeable via side panel in Plan 03)
- Node visual styles match spec: pin markers for landmarks, grey dots for navigation nodes
- Mode switching clears selection and works correctly
- Undo/Redo works for placement and movement
</success_criteria>

<output>
After completion, create `.planning/phases/09-admin-map-editor-visual/09-02-SUMMARY.md`
</output>
