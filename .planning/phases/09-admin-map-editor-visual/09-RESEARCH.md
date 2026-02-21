# Phase 9: Admin Map Editor — Visual - Research

**Researched:** 2026-02-21
**Domain:** Interactive Konva canvas editor — node/edge placement, mode switching, undo/redo, floor plan upload, admin API
**Confidence:** HIGH (all critical patterns verified against official Konva docs and Hono docs)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- OSM iD editor is the explicit reference for all interaction patterns
- Three distinct editor modes: **Select**, **Add Node**, **Add Edge** — switched via horizontal toolbar at top
- Toolbar contains: mode buttons, **Upload Floor Plan**, **Save**, **Undo**, **Redo**
- Floor plan upload: toolbar button opens file picker; image replaces canvas background inline (no separate upload page)
- Default mode on load: **Select**
- Node placement: Admin activates Add Node mode → clicks canvas → side panel opens for properties
  - Properties: Name (required), Type (Landmark/Navigation), Category, Description (optional)
  - Nodes are repositioned by dragging in Select mode
- Edge creation: Two-click flow — click source node, then target node; Escape cancels; rubber-band line follows cursor
- Distance/weight: auto-calculated from pixel distance; admin can override in side panel
- Wheelchair accessibility: set in side panel after creation (not prompted during creation)
- Directionality: all edges bidirectional (one-way deferred to Phase 10)
- Visual — landmark nodes: Google Maps pin/marker icon with name label beneath
- Visual — navigation nodes: small grey dot
- Visual — selected node: blue highlight ring
- Visual — edges: green for accessible, grey for non-accessible; highlighted on hover/selection; blue-tinted when selected
- Save: explicit Save button only — no auto-save
- Undo/Redo: supported for all canvas actions (place, move, create)

### Claude's Discretion

- Two-click edge creation flow (already described above as locked — source then target)
- Distance auto-calculation from pixel distance
- Edge color coding (green/grey)

### Deferred Ideas (OUT OF SCOPE)

- One-way (directional) edges — Phase 10
- Node deletion and editing of existing nodes — Phase 10
- Sortable data table view of nodes/edges — Phase 10
- JSON/CSV import/export — Phase 10
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| EDIT-01 | Admin can upload a floor plan image as the map base layer | Hono multipart/form-data upload + `node:fs` `writeFile` to `src/server/assets/floor-plan.png`; client-side `URL.createObjectURL` for instant preview before server response; Konva `use-image` hook picks up the new URL |
| EDIT-02 | Admin can place visible landmark nodes on the floor plan via drag-and-drop | Konva Stage `onClick` in Add Node mode; `getRelativePointerPosition()` on the image layer converts pan/zoom-aware stage coordinates to canvas-local coords; normalize to 0–1 against imageRect; render as `Circle` + `Text` with counter-scale Group (same pattern as LandmarkMarker) |
| EDIT-03 | Admin can place hidden navigation nodes (ramps, stairs, hallway junctions) via drag-and-drop | Same placement flow as EDIT-02; node `type` field distinguishes landmark vs navigation; navigation nodes rendered as small grey `Circle` dot without label |
| EDIT-04 | Admin can create edges (connections) between nodes with distance/weight metadata | Add Edge mode: first click on source node sets `pendingEdgeSource`; Stage `onMouseMove` draws rubber-band `Line` from source to cursor; second click on target node finalizes edge; distance auto-calculated via Euclidean distance on normalized coords; side panel allows weight override |
| EDIT-05 | Admin can mark edges as wheelchair-accessible or not | Side panel checkbox/toggle appears after edge creation; sets `accessible` bool and `accessibleWeight` (same as `standardWeight` for accessible, `1e10` for non-accessible per existing sentinel pattern) |
</phase_requirements>

---

## Summary

Phase 9 builds a visual graph editor for admins on top of the existing Konva canvas stack. The project already uses react-konva 19.2.2 + konva 10.2.0 extensively for the student map, so all editor primitives (Stage, Layer, Group, Circle, Line, Text, drag events) are already installed and battle-tested. No new canvas library is needed.

The editor introduces three interaction modes (Select / Add Node / Add Edge) gated by a mode state variable. The Stage's `onClick` and `onMouseMove` handlers branch on the current mode, following the same pattern as OSM iD. Node placement converts stage pointer position to normalized coordinates using `getRelativePointerPosition()` on the floor plan's Layer combined with the `imageRect` dimensions already tracked in `FloorPlanCanvas`. Edge creation uses a two-click rubber-band pattern with a temporary preview `Line` that follows the cursor between clicks.

Undo/redo is implemented with React refs (`history.current` array + `historyStep.current` index) as documented in official Konva examples — no external library needed. The side panel is a positioned HTML overlay (same approach as `SearchOverlay` and `ZoomControls`), not a Konva element. The Save button triggers a `POST /api/admin/graph` endpoint that replaces the entire SQLite graph; the floor plan upload uses `POST /api/admin/floor-plan` with `multipart/form-data` and Hono's `c.req.parseBody()` + Node `writeFile` to disk.

**Primary recommendation:** Build the editor as a new `MapEditorCanvas` component rendered inside `AdminShell`, keeping it completely separate from `FloorPlanCanvas` (student view). Share `useMapViewport`, `useViewportSize`, and the Konva layer structure. Add a dedicated `useEditorState` hook (useReducer) for nodes/edges/history/mode.

---

## Standard Stack

### Core (all already installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| konva | ^10.2.0 | Canvas 2D rendering engine | Already in project; all shapes, events, Tween animations |
| react-konva | ^19.2.2 | React bindings for Konva | Already in project; declarative `<Stage>`, `<Layer>`, `<Group>`, `<Circle>`, `<Line>` |
| react | ^19.2.4 | UI framework | Already in project |
| tailwindcss | ^4.1.18 | Styling for HTML overlays (toolbar, side panel) | Already in project |
| hono | ^4.11.9 | Server for new admin API endpoints | Already in project; JWT guard already on `/api/admin/*` |
| drizzle-orm | ^0.45.1 | DB reads/writes for graph save | Already in project; schema already covers nodes + edges |
| better-sqlite3 | ^12.6.2 | Synchronous SQLite | Already in project |
| zod | ^4.3.6 | Request body validation on new admin endpoints | Already in project |

### No New Dependencies Required

All required functionality is covered by the existing stack. Do NOT add new packages.

### Supporting Patterns Already in Project

| Pattern | Where | Reuse in Phase 9 |
|---------|-------|-----------------|
| `useMapViewport` | `src/client/hooks/useMapViewport.ts` | Reuse as-is for editor pan/zoom |
| `useViewportSize` | `src/client/hooks/useViewportSize.ts` | Reuse as-is |
| `imageRect` tracking | `FloorPlanCanvas.tsx` | Same pattern — editor needs imageRect for coordinate conversion |
| counter-scale Groups | `LandmarkMarker.tsx` | Same `scaleX={1/stageScale}` pattern for node markers in editor |
| HTML overlay positioning | `SearchOverlay`, `ZoomControls` | Toolbar and side panel use same `absolute` CSS positioning |
| `1e10` sentinel | `schema.ts`, `seed.ts` | Use same sentinel for non-accessible edge weights on Save |
| JWT-protected routes | `src/server/index.ts` line 121 | New admin endpoints go under `/api/admin/*` — automatically protected |

---

## Architecture Patterns

### Recommended Project Structure

```
src/client/
├── pages/admin/
│   ├── AdminShell.tsx          # existing — replace placeholder with <MapEditorCanvas>
│   └── MapEditorCanvas.tsx     # NEW — top-level editor component
├── components/admin/           # NEW directory
│   ├── EditorToolbar.tsx       # mode buttons + upload + save + undo/redo
│   ├── EditorSidePanel.tsx     # OSM-style property panel for selected node/edge
│   ├── NodeMarkerLayer.tsx     # editor node rendering (landmark + nav markers)
│   └── EdgeLayer.tsx           # editor edge rendering + rubber-band preview
├── hooks/
│   └── useEditorState.ts       # NEW — useReducer for editor state + history
src/server/
└── index.ts                    # add POST /api/admin/graph + POST /api/admin/floor-plan
```

### Pattern 1: Mode-Based Stage Interaction

**What:** A `mode` state variable gates what happens on canvas click/mousemove.
**When to use:** Anytime the same user gesture (click, drag) should do different things.

```typescript
// Source: Konva official docs — Stage Events + Drag and Drop
type EditorMode = 'select' | 'add-node' | 'add-edge'

const [mode, setMode] = useState<EditorMode>('select')

// On Stage onClick:
const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
  if (mode === 'add-node') {
    // e.target === stage means empty canvas (not a shape)
    if (e.target === stageRef.current) {
      const layer = layerRef.current
      const pos = layer.getRelativePointerPosition() // accounts for pan/zoom
      // Convert to normalized:
      // normX = (pos.x - imageRect.x) / imageRect.width
      // normY = (pos.y - imageRect.y) / imageRect.height
      placeNode(pos)
    }
  } else if (mode === 'add-edge') {
    const clickedNode = getClickedNode(e.target) // check if target is a node shape
    if (clickedNode) handleEdgeNodeClick(clickedNode)
  }
}

// Stage draggable ONLY in select mode — in other modes, disable stage pan
// so clicking empty canvas triggers placement, not a pan gesture
<Stage draggable={mode === 'select'} onClick={handleStageClick} ... />
```

**Critical:** Disable Stage `draggable` in Add Node and Add Edge modes. Otherwise, clicking on empty canvas starts a drag instead of placing a node.

### Pattern 2: Coordinate Conversion (Screen → Normalized)

**What:** Convert a Konva stage click to normalized (0–1) coordinates.
**When to use:** Every time a node is placed or its position is computed.

```typescript
// Source: konvajs.org/docs/sandbox/Relative_Pointer_Position.html
// getRelativePointerPosition() handles ALL transformations (scale, position, rotation)
const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
  const layer = floorPlanLayerRef.current
  if (!layer || !imageRect) return
  const pos = layer.getRelativePointerPosition()
  if (!pos) return
  // pos is in canvas-pixel coords relative to the layer (not stage)
  // imageRect is in the same coordinate space
  const normX = (pos.x - imageRect.x) / imageRect.width
  const normY = (pos.y - imageRect.y) / imageRect.height
  // Clamp to [0, 1] to prevent out-of-bounds nodes
  const x = Math.max(0, Math.min(1, normX))
  const y = Math.max(0, Math.min(1, normY))
  // Use x, y as normalized NavNode coordinates
}
```

### Pattern 3: Node Dragging in Select Mode

**What:** Nodes are draggable in Select mode only; dragging updates normalized coords.
**When to use:** Select mode, node drag end.

```typescript
// Source: konvajs.org/docs/react/Drag_And_Drop.html
// Individual node Groups are draggable; Stage is NOT draggable in select mode
// (to prevent canvas pan interfering with node drag — they share the same gesture)

// Actually: keep Stage draggable in Select mode for pan,
// but individual node Groups have draggable={true} too.
// Konva stops event propagation when a shape drag starts,
// so stage drag only activates on empty-canvas drag.
<Group
  x={pixelX}
  y={pixelY}
  scaleX={1 / stageScale}
  scaleY={1 / stageScale}
  draggable={mode === 'select'}
  onDragEnd={(e) => {
    const layer = floorPlanLayerRef.current
    if (!layer || !imageRect) return
    // e.target.x() / e.target.y() are pixel positions after drag
    const pixX = e.target.x()
    const pixY = e.target.y()
    const normX = (pixX - imageRect.x) / imageRect.width
    const normY = (pixY - imageRect.y) / imageRect.height
    dispatch({ type: 'MOVE_NODE', id: node.id, x: normX, y: normY })
    recordHistory()
  }}
/>
```

**Pitfall:** Node Group counter-scales to 1/stageScale so its rendered screen size is constant. But `draggable` on a counter-scaled Group means `e.target.x()` and `e.target.y()` return the position of the Group's origin relative to the Layer, not the stage. To convert to stage coords, use `e.target.getAbsolutePosition()`. Then convert to normalized as above.

### Pattern 4: Rubber-Band Edge Preview

**What:** When Add Edge mode has a source node selected, a line follows the mouse cursor.
**When to use:** Between source click and target click in Add Edge mode.

```typescript
// Source: konvajs.org/docs/react/Free_Drawing.html (adapted)
// Store pending edge source + live cursor position in state
const [pendingEdge, setPendingEdge] = useState<{
  sourceId: string
  sourceX: number // pixel coords
  sourceY: number
  cursorX: number
  cursorY: number
} | null>(null)

// On Stage onMouseMove (in Add Edge mode when source selected):
const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
  if (mode !== 'add-edge' || !pendingEdge) return
  const stage = stageRef.current
  if (!stage) return
  const pos = stage.getPointerPosition()
  if (!pos) return
  // Adjust for stage transform to get canvas-space coords
  const stagePos = stage.position()
  const scale = stage.scaleX()
  const canvasX = (pos.x - stagePos.x) / scale
  const canvasY = (pos.y - stagePos.y) / scale
  setPendingEdge(prev => prev ? { ...prev, cursorX: canvasX, cursorY: canvasY } : null)
}

// Render rubber-band preview:
{pendingEdge && (
  <Line
    points={[pendingEdge.sourceX, pendingEdge.sourceY, pendingEdge.cursorX, pendingEdge.cursorY]}
    stroke="#3b82f6"
    strokeWidth={2}
    dash={[6, 4]}
    listening={false} // Don't intercept events on the preview line
  />
)}
```

**Key:** Set `listening={false}` on the preview Line so it does not interfere with click events on the stage/nodes.

### Pattern 5: Undo/Redo with Refs

**What:** History stack using refs to avoid unnecessary re-renders.
**When to use:** Every action that modifies editor state (place node, move node, create edge).

```typescript
// Source: konvajs.org/docs/react/Undo-Redo.html
type EditorSnapshot = { nodes: NavNode[]; edges: NavEdge[] }

const history = useRef<EditorSnapshot[]>([{ nodes: initialNodes, edges: initialEdges }])
const historyStep = useRef<number>(0)

const recordHistory = (snapshot: EditorSnapshot) => {
  // Discard any future states (branching timeline prevention)
  history.current = history.current.slice(0, historyStep.current + 1)
  history.current.push(snapshot)
  historyStep.current += 1
}

const handleUndo = () => {
  if (historyStep.current === 0) return
  historyStep.current -= 1
  const snapshot = history.current[historyStep.current]
  setNodes(snapshot.nodes)
  setEdges(snapshot.edges)
}

const handleRedo = () => {
  if (historyStep.current === history.current.length - 1) return
  historyStep.current += 1
  const snapshot = history.current[historyStep.current]
  setNodes(snapshot.nodes)
  setEdges(snapshot.edges)
}
```

**Key Insight:** Keyboard shortcuts (`Ctrl+Z` / `Ctrl+Y` / `Ctrl+Shift+Z`) should be attached via `useEffect` on `window` (not Stage), since keyboard events don't originate in the canvas.

### Pattern 6: Cursor Visual Feedback by Mode

**What:** Cursor changes to crosshair for Add Node, plus-crosshair or pointer for Add Edge.
**When to use:** Any mode switch.

```typescript
// Source: konvajs.org/docs/styling/Mouse_Cursor.html
// Apply cursor directly to Stage's container element OR via inline style on Stage
const cursorForMode: Record<EditorMode, string> = {
  select: 'default',
  'add-node': 'crosshair',
  'add-edge': 'crosshair',
}

// Option A — inline style on Stage (simplest):
<Stage style={{ cursor: cursorForMode[mode] }} ... />

// Option B — imperative (useful for hover changes within a mode):
stageRef.current?.container().style.cursor = cursorForMode[mode]
```

### Pattern 7: Auto-Calculate Edge Distance

**What:** Edge `standardWeight` is the Euclidean distance between node normalized coords.
**When to use:** Immediately after edge creation, before side panel opens.

```typescript
// Source: project convention from [Research] in STATE.md —
// "Normalized 0-1 coordinates to prevent pixel-drift pitfall"
// Distance in normalized space is already scale-independent.

function calcDistance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2)
}

// For a new edge from nodeA to nodeB:
const dist = calcDistance({ x: nodeA.x, y: nodeA.y }, { x: nodeB.x, y: nodeB.y })
const newEdge: NavEdge = {
  id: `edge-${Date.now()}`,
  sourceId: nodeA.id,
  targetId: nodeB.id,
  standardWeight: dist,
  accessibleWeight: dist,  // default: accessible — admin changes in side panel
  accessible: true,        // default accessible until admin changes
  bidirectional: true,     // all edges bidirectional (Phase 9 scope)
}
```

**Note:** Admin can override `standardWeight` in the side panel. `accessibleWeight` mirrors `standardWeight` for accessible edges; set to `1e10` for non-accessible (same sentinel as existing project convention — never `Infinity`).

### Pattern 8: Floor Plan Upload

**What:** Upload a new floor plan image from the toolbar; replace the server-side file; reload in canvas.
**When to use:** "Upload Floor Plan" button clicked.

**Client side:**
```typescript
// Hidden <input type="file" accept="image/*"> triggered programmatically
const fileInputRef = useRef<HTMLInputElement>(null)

const handleUploadClick = () => fileInputRef.current?.click()

const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file) return

  // 1. Instant local preview via object URL (no server round-trip needed yet)
  const previewUrl = URL.createObjectURL(file)
  setEditorFloorPlanUrl(previewUrl) // local state drives canvas image

  // 2. Upload to server in background
  const formData = new FormData()
  formData.append('image', file)
  await fetch('/api/admin/floor-plan', {
    method: 'POST',
    credentials: 'include',
    body: formData,
    // NO Content-Type header — browser sets multipart boundary automatically
  })
  // Server overwrites floor-plan.png; student-facing endpoint serves new file
}
```

**Server side (Hono):**
```typescript
// Source: hono.dev/examples/file-upload
// This route goes under /api/admin/* — automatically JWT-protected
import { writeFile, mkdir } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

app.post('/api/admin/floor-plan', async (c) => {
  const body = await c.req.parseBody()
  const file = body['image'] as File
  if (!file || !(file instanceof File)) {
    return c.json({ error: 'No image provided' }, 400)
  }
  // Validate MIME type
  if (!file.type.startsWith('image/')) {
    return c.json({ error: 'File must be an image' }, 400)
  }
  const buffer = Buffer.from(await file.arrayBuffer())
  const dest = resolve(__dirname, '../assets/floor-plan.png')
  await writeFile(dest, buffer)
  return c.json({ ok: true })
})
```

**CSRF Note:** `multipart/form-data` uploads ARE covered by Hono's CSRF middleware (it validates unsafe methods with form-like content types). Since both client and server run on `localhost:3001` in dev, the `Origin` header will match and CSRF will pass without configuration changes. In production, the CSRF `origin` option in `index.ts` may need to be set, but this is not a Phase 9 concern.

### Pattern 9: Save Graph to Server

**What:** Admin clicks Save — editor's in-memory nodes/edges are POST'd to replace the DB.
**When to use:** Save button click.

```typescript
// Client:
const handleSave = async () => {
  const graph: NavGraph = {
    nodes: editorNodes,
    edges: editorEdges,
    metadata: { buildingName: 'Main Building', floor: 1, lastUpdated: new Date().toISOString() }
  }
  await fetch('/api/admin/graph', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(graph),
  })
}

// Server:
app.post('/api/admin/graph', async (c) => {
  const graph = await c.req.json() as NavGraph
  // Validate with zod
  // Delete all existing nodes/edges/metadata
  db.delete(nodes).run()
  db.delete(edges).run()
  db.delete(graphMetadata).run()
  // Insert new data
  db.insert(nodes).values(graph.nodes.map(...)).run()
  db.insert(edges).values(graph.edges.map(...)).run()
  db.insert(graphMetadata).values([{ ...graph.metadata }]).run()
  return c.json({ ok: true })
})
```

### Anti-Patterns to Avoid

- **Anti-pattern — Stage draggable in Add Node/Edge mode:** If Stage `draggable` stays true during placement modes, clicking on empty canvas will start a drag instead of placing a node. Solution: set `draggable={mode === 'select'}` on Stage.
- **Anti-pattern — Using `stage.getPointerPosition()` for normalized coords:** Raw stage pointer position does NOT account for stage pan/zoom. Use `layer.getRelativePointerPosition()` which applies the inverted absolute transform.
- **Anti-pattern — Storing Infinity in weights:** JSON.stringify(Infinity) produces `null`. Always use `1e10` as the non-accessible edge sentinel (established project convention).
- **Anti-pattern — Setting Content-Type for multipart uploads:** Never manually set `Content-Type: multipart/form-data`. The browser must set it to include the boundary parameter. Use `fetch` with a `FormData` body and no explicit `Content-Type`.
- **Anti-pattern — React setState for history tracking:** Using useState for undo/redo history causes a re-render on every history push (e.g., on every mousemove during node drag). Use refs for the history array and step counter; only call setState when actually applying an undo/redo.
- **Anti-pattern — Mixing editor and student state:** The editor canvas should be a separate component from `FloorPlanCanvas`. They share hooks but not state — an admin edit should not pollute the student view's in-memory graph.
- **Anti-pattern — Listening events on rubber-band Line:** The preview edge Line must have `listening={false}` so it does not capture click events meant for the node below it.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Canvas rendering | Custom canvas drawing with `<canvas>` DOM API | react-konva (already installed) | react-konva handles coordinate transforms, event bubbling, hit detection, layer management — complex to replicate |
| Animated transitions | CSS transitions on canvas | Konva.Tween (already used throughout project) | Konva Tween is already used for zoom animations; same API works for fade-in on node placement |
| Pan/zoom viewport | Custom touch/wheel logic | Reuse `useMapViewport` hook | Already handles wheel zoom, pinch-zoom, rotation, elastic bounds — battle-tested |
| File upload handling | Custom multipart parser | Hono's `c.req.parseBody()` | Official Hono API; handles multipart boundaries automatically |
| Graph persistence | Custom file-based storage | Drizzle + better-sqlite3 (already installed) | Schema already defined; `db.delete().run()` + `db.insert().run()` is 5 lines |

**Key insight:** The project already has every primitive needed. Phase 9 is configuration and composition, not new infrastructure.

---

## Common Pitfalls

### Pitfall 1: Stage Drag Intercepts Node Placement Click

**What goes wrong:** In Add Node mode, clicking on empty canvas starts a drag (0px movement) instead of triggering `onClick`.
**Why it happens:** Konva's `draggable` Stage registers `mousedown → mouseup` as a drag when movement is 0 — `onClick` may still fire, but drag events also fire, causing visual artifacts.
**How to avoid:** Set `draggable={mode === 'select'}` on Stage. In Add Node and Add Edge modes, the Stage is not draggable, so clicks reach `onClick` cleanly.
**Warning signs:** Node is placed but canvas also moves slightly; `onDragStart` fires during placement.

### Pitfall 2: Wrong Coordinate System for Node Placement

**What goes wrong:** Node appears in the wrong position on canvas, especially after panning or zooming.
**Why it happens:** Using `stage.getPointerPosition()` returns viewport coordinates, not canvas coordinates. After pan/zoom, these diverge.
**How to avoid:** Use `layer.getRelativePointerPosition()` on the floor plan's Layer ref. This applies the inverted transform to return canvas-local coordinates.
**Warning signs:** Node placement is correct at zoom=1/pan=0 but drifts at other zoom levels.

### Pitfall 3: Node Drag Position Drift Due to Counter-Scale

**What goes wrong:** After dragging a counter-scaled Group node, its `e.target.x()` / `e.target.y()` don't match where it visually landed.
**Why it happens:** The Group is counter-scaled (`scaleX={1/stageScale}`), so its local coordinate system is warped. `e.target.x()` is in the Group's parent (Layer) coords.
**How to avoid:** To get the Layer-space position after drag on a counter-scaled Group, use `e.target.getAbsolutePosition()` which returns stage-space coords, then convert to normalized using the stage transform + imageRect.
**Warning signs:** Node snaps to wrong position on DragEnd; position diverges more at higher zoom levels.

### Pitfall 4: CSRF Blocking the Graph Save POST

**What goes wrong:** `POST /api/admin/graph` returns 403 from CSRF middleware.
**Why it happens:** The global `app.use(csrf())` in `index.ts` validates `Origin` header for unsafe methods. If the client sends without `credentials: 'include'` or from a different origin, it fails.
**How to avoid:** Always include `credentials: 'include'` on admin fetch calls. In dev (same origin), CSRF passes automatically. Ensure the `Content-Type: application/json` header is set (not a form type) — JSON requests are not the primary CSRF vector but the Origin header must still match.
**Warning signs:** Save returns 403; check browser network tab for `Origin` header value vs server host.

### Pitfall 5: Floor Plan Upload Content-Type Error

**What goes wrong:** Upload endpoint receives empty body or body parse fails.
**Why it happens:** Manually setting `Content-Type: multipart/form-data` in the fetch call omits the boundary parameter, making the server unable to parse the body.
**How to avoid:** Never set `Content-Type` manually for FormData uploads. Let the browser set it automatically via `fetch(url, { method: 'POST', body: formData })`.
**Warning signs:** `c.req.parseBody()` returns `{}` or the File is null/string.

### Pitfall 6: History Stack Grows Unboundedly During Mousemove

**What goes wrong:** Undo history has hundreds of entries from tracking mousemove during rubber-band preview.
**Why it happens:** If `recordHistory()` is called on every `onMouseMove`, the history array grows on every frame.
**How to avoid:** Only record history on discrete user actions: node placed, node moved (DragEnd), edge created. Never record during mousemove preview.
**Warning signs:** Pressing Undo takes many steps to undo a single action; memory usage climbs during Add Edge mode.

### Pitfall 7: `use-image` Does Not Reload After Floor Plan Upload

**What goes wrong:** After uploading a new floor plan, the canvas still shows the old image.
**Why it happens:** `use-image` caches by URL. If the URL doesn't change (`/api/floor-plan/image`), the hook returns the cached image.
**How to avoid:** In the admin editor, maintain a local `floorPlanUrl` state that switches between the server URL and a `URL.createObjectURL()` blob URL after upload. The blob URL is unique per upload, forcing a reload. Alternatively, append a cache-bust query param (`/api/floor-plan/image?t=${Date.now()}`).
**Warning signs:** New floor plan never appears in editor after upload; old image persists.

---

## Code Examples

Verified patterns from official sources and project conventions:

### Getting Canvas-Local Position on Stage Click

```typescript
// Source: konvajs.org/docs/sandbox/Relative_Pointer_Position.html
const floorPlanLayerRef = useRef<Konva.Layer>(null)

const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
  if (mode !== 'add-node') return
  if (e.target !== stageRef.current) return // only empty canvas, not shapes
  const layer = floorPlanLayerRef.current
  if (!layer || !imageRect) return
  const pos = layer.getRelativePointerPosition()
  if (!pos) return
  const normX = Math.max(0, Math.min(1, (pos.x - imageRect.x) / imageRect.width))
  const normY = Math.max(0, Math.min(1, (pos.y - imageRect.y) / imageRect.height))
  dispatch({ type: 'PLACE_NODE', x: normX, y: normY })
}
```

### useEditorState Hook (useReducer Pattern)

```typescript
// No external library — useReducer is sufficient for this editor's complexity
type EditorState = {
  nodes: NavNode[]
  edges: NavEdge[]
  selectedNodeId: string | null
  selectedEdgeId: string | null
  pendingEdgeSourceId: string | null
}

type EditorAction =
  | { type: 'PLACE_NODE'; node: NavNode }
  | { type: 'MOVE_NODE'; id: string; x: number; y: number }
  | { type: 'SELECT_NODE'; id: string | null }
  | { type: 'CREATE_EDGE'; edge: NavEdge }
  | { type: 'SELECT_EDGE'; id: string | null }
  | { type: 'SET_PENDING_EDGE_SOURCE'; id: string | null }
  | { type: 'UPDATE_EDGE'; id: string; changes: Partial<NavEdge> }
  | { type: 'UPDATE_NODE'; id: string; changes: Partial<NavNode> }
  | { type: 'LOAD_GRAPH'; nodes: NavNode[]; edges: NavEdge[] }

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'PLACE_NODE': return { ...state, nodes: [...state.nodes, action.node] }
    case 'MOVE_NODE': return {
      ...state,
      nodes: state.nodes.map(n => n.id === action.id ? { ...n, x: action.x, y: action.y } : n)
    }
    // ... etc
  }
}
```

### Undo/Redo Integration with useReducer

```typescript
// Wrap dispatch with history tracking
// Source: konvajs.org/docs/react/Undo-Redo.html (adapted for useReducer)
const history = useRef<EditorState[]>([initialState])
const historyStep = useRef(0)

const dispatchWithHistory = (action: EditorAction) => {
  dispatch(action) // triggers re-render
  // Record history AFTER dispatch (in useEffect or by computing next state first)
}

// Better: compute next state in a separate reducerRef and record inline
// Use useReducer's functional form:
// const recordHistory = (nextState: EditorState) => {
//   history.current = history.current.slice(0, historyStep.current + 1)
//   history.current.push(nextState)
//   historyStep.current += 1
// }
```

### Rubber-Band Line with listening={false}

```typescript
// Source: konvajs.org/api/Konva.Line.html
{pendingEdge && mode === 'add-edge' && (
  <Layer>
    <Line
      points={[
        pendingEdge.sourcePixelX,
        pendingEdge.sourcePixelY,
        pendingEdge.cursorPixelX,
        pendingEdge.cursorPixelY,
      ]}
      stroke="#3b82f6"
      strokeWidth={2}
      dash={[8, 4]}
      listening={false}
    />
  </Layer>
)}
```

### Node ID Generation

```typescript
// IDs must be unique and URL-safe for API use
// Source: project convention (existing node IDs: "room-204", "entrance-main")
function generateNodeId(type: NavNodeType, label: string): string {
  const slug = label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  return `${type}-${slug}-${Date.now()}`
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Global state (Redux) for canvas editors | Local useReducer + refs for history | 2022–2024 | Simpler, no boilerplate, sufficient for single-component editors |
| Separate upload page for file management | Inline upload via toolbar input | Current OSM iD / Mapbox style | Better UX — admin stays in context |
| Server-side rendering for admin panels | Client-side React with protected routes | Already implemented in Phase 8 | Admin panel is already a SPA with JWT auth |
| Express/multer for file uploads | Hono `c.req.parseBody()` | Hono v3+ (2023) | Native API, no middleware needed for basic uploads |

**Deprecated/outdated:**
- `Konva.GlobalCompositeOperation` for erase effects: Not relevant here but documented in older tutorials; avoid unless implementing eraser
- Class-based React components with Konva: All existing project code uses functional components + hooks; maintain consistency

---

## Open Questions

1. **Node ID uniqueness when label has duplicates**
   - What we know: Current campus-graph.json uses human-readable IDs like `room-204`. Duplicate room labels would create ID collisions.
   - What's unclear: Should Phase 9 auto-suffix duplicate IDs (e.g., `room-office-1`, `room-office-2`) or require unique labels?
   - Recommendation: Auto-append timestamp (`${type}-${slug}-${Date.now()}`) to guarantee uniqueness regardless of label.

2. **Floor plan image format on upload**
   - What we know: Server currently serves `floor-plan.png` and `floor-plan-thumb.jpg`. Upload could receive JPEG, PNG, WebP, etc.
   - What's unclear: Should the upload endpoint convert to PNG? Re-generate the thumbnail?
   - Recommendation: Accept any image format; write as-is to `floor-plan.png` (overwrite). Skip thumbnail regeneration in Phase 9 (thumbnail is the pre-existing Phase 2 asset). Flag for Phase 10 if needed.

3. **Graph save: full replace vs. upsert**
   - What we know: The Save endpoint design above does full DELETE + INSERT. This is atomic with SQLite and simple to implement.
   - What's unclear: If the server crashes mid-save, the DB could be empty.
   - Recommendation: Use a SQLite transaction (Drizzle supports `.transaction()`) to wrap the delete + insert, ensuring atomicity.

4. **Admin editor floor plan URL vs student floor plan URL**
   - What we know: The editor needs to display the floor plan. After upload, the blob URL is local only; the student-facing `/api/floor-plan/image` has the persisted version.
   - What's unclear: Should the editor always load from `/api/floor-plan/image` (server) or from the blob URL after upload?
   - Recommendation: Load from `/api/floor-plan/image` on initial editor mount; after upload, switch to blob URL for instant preview. The server file is updated in the background. Cache-bust with `?t=Date.now()` if needed.

---

## Sources

### Primary (HIGH confidence)

- konvajs.org/docs/react/Drag_And_Drop.html — drag event handlers, `e.target.x()` / `e.target.y()` pattern
- konvajs.org/docs/react/Undo-Redo.html — history ref pattern with `historyStep.current`
- konvajs.org/docs/sandbox/Relative_Pointer_Position.html — `getRelativePointerPosition()` for transform-aware coords
- konvajs.org/docs/events/Stage_Events.html — `e.target === stage` check for empty canvas clicks
- konvajs.org/docs/styling/Mouse_Cursor.html — Stage `style={{ cursor }}` for mode-based cursor
- konvajs.org/docs/react/Free_Drawing.html — mousemove + points array pattern (adapted for rubber-band line)
- hono.dev/examples/file-upload — `c.req.parseBody()` for multipart, File object API
- hono.dev/docs/middleware/builtin/csrf — CSRF covers multipart/form-data; origin validation config
- Project source files: `FloorPlanCanvas.tsx`, `LandmarkMarker.tsx`, `useMapViewport.ts`, `useFloorPlanImage.ts`, `schema.ts`, `seed.ts`, `src/server/index.ts` — all project conventions verified by reading

### Secondary (MEDIUM confidence)

- Konva docs (Drag_And_Drop, Stage Events) verified via WebFetch against official konvajs.org
- Hono file upload example verified via WebFetch against official hono.dev

### Tertiary (LOW confidence)

- WebSearch result: node ID slug pattern — conventional; validated against existing project IDs in campus-graph.json
- WebSearch result: useReducer for editor state — community consensus, not a specific official source

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified all packages are already installed; no new deps needed
- Architecture: HIGH — patterns verified against official Konva and Hono docs; project conventions read directly from source
- Pitfalls: HIGH — coordinate system pitfalls verified from official `getRelativePointerPosition` docs; counter-scale drag drift is a known Konva pattern; CSRF/Content-Type issues verified from Hono docs
- Code examples: HIGH — all examples derived from official docs + existing project patterns

**Research date:** 2026-02-21
**Valid until:** 2026-03-23 (stable libraries — Konva 10.x, Hono 4.x both in maintenance mode with no breaking changes expected)
