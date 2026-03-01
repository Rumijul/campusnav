# Phase 18: Admin Multi-floor Editor - Research

**Researched:** 2026-03-01
**Domain:** React admin editor extension — multi-floor management UI, campus map editing, Konva canvas, Hono server routes, Drizzle ORM
**Confidence:** HIGH (all findings grounded in direct codebase inspection; no external library guesses)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Floor switching UX**
- Floor tabs appear between the toolbar and the canvas (second row)
- Active floor tab shows only that floor's image and nodes/edges — no cross-floor overlays
- Unsaved changes on the current floor are auto-saved before switching tabs (silent, no interruption)
- A building selector (dropdown or button group) sits above the floor tab row; switching buildings updates the floor tabs

**Floor management workflow**
- A "Manage Floors" button in the EditorToolbar opens a modal dialog
- Modal lists all floors for the selected building; each row has: floor number, image preview, Replace Image button, and Delete (x)
- Adding a floor: both floor number and image upload are required together in one form — no empty floors
- Removing a floor with nodes: confirm dialog showing "Floor X has N nodes. Delete all?" — explicit, not blocked, not soft-delete
- Replace Image: available per floor in the Manage Floors modal; nodes are preserved (coordinates are normalized 0-1)

**Campus map editing**
- "Campus" tab appears at the top level alongside building name tabs (e.g., "Campus | Building A")
- Campus editor reuses the same Konva canvas infrastructure as the floor editor
- Two node types on the campus map: outdoor path nodes (junctions/hallways for routing) and building entrance markers (link to a specific building's floor 1)
- Existing NavNodeType values ('entrance', 'junction', 'hallway') are reused — no new node types needed
- Campus image upload: context-sensitive — when Campus tab is active, the toolbar Upload button targets the campus image
- Empty state (no campus image yet): "Upload campus map to begin" prompt centered on the canvas, click triggers upload

**Building entrance linking**
- Claude's discretion — how the admin specifies which building/floor-1 node an entrance links to (side panel dropdown is the likely approach)
- Claude's discretion — whether a campus entrance node must link to a specific floor-1 node or just a building
- Multiple campus entrance nodes can link to the same building — each can represent a different door
- Entrance nodes on the campus map use a visually distinct marker vs. regular outdoor path nodes

### Claude's Discretion
- How NavNodeData / NavNode is extended to carry the campus-to-building bridge FK (e.g., `connectsToBuildingId` or similar)
- Whether the campus map is stored as a special building+floor in the DB or as a separate entity
- Exact visual styling for entrance node markers on the canvas
- Campus image upload API endpoint design
- How the Manage Floors modal integrates with existing toolbar (button placement, modal vs. sheet)

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MFLR-04 | Admin can add/remove floors per building and upload a distinct floor plan image for each floor | Manage Floors modal + per-floor upload API |
| CAMP-02 | Admin uploads a hand-drawn overhead image as the campus-level outdoor map | Campus tab + context-sensitive upload route |
| CAMP-03 | Admin places outdoor path nodes and building entrance markers on the campus map | Campus-aware editor state + NodeMarkerLayer styling |
| CAMP-04 | Building entrance nodes bridge the outdoor graph to floor 1 of each building, enabling cross-building routes | NavNodeData extension + building FK + EditorSidePanel dropdown |
</phase_requirements>

---

## Summary

Phase 18 extends an already-mature admin editor that handles a single flat nodes/edges array for one building+floor. The primary technical challenge is evolving `useEditorState` (currently a single flat reducer) and `MapEditorCanvas` (currently building/floor agnostic) into a multi-context editor: one context per floor per building, plus a separate campus context. All infrastructure that matters — the Konva Stage/Layer pattern, normalized 0-1 coordinates, useReducer dispatch pattern, Hono multipart uploads, Drizzle transaction-based graph save — already exists and is healthy.

The codebase is built with React 19 + react-konva 19.2.2 (Konva 10.2.0), Hono 4 on Node.js, Drizzle ORM with PostgreSQL (postgres-js), and Tailwind CSS 4. No new packages are needed for this phase; everything required is already installed.

The three architectural choices that require deliberate design are: (1) how to scope `useEditorState` per floor so undo/redo history doesn't bleed across floors, (2) how to represent the campus map in the database (recommended: as a special sentinel building named "Campus" with floorNumber 0), and (3) how `NavNodeData` carries the building bridge FK for campus entrance nodes (recommended: add optional `connectsToBuildingId` field).

**Primary recommendation:** Extend `useEditorState` via a `Map<floorId, EditorState>` keyed per floor (plus a dedicated campus state), instantiated on-demand. Keep the reducer pure and unchanged — just multiplex dispatch to the right keyed instance. This isolates undo history per floor without a rewrite.

---

## Standard Stack

### Core (already installed — no new installs needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-konva | 19.2.2 | Konva canvas in React | Established in phases 9-17; all editor layers use it |
| konva | 10.2.0 | Stage/Layer/Group/Circle/Line/Image | Same; direct Konva mutations for 60fps |
| use-image | 1.1.4 | Load floor plan images into Konva | Used for all floor plan loads; handles async naturally |
| hono | 4.11.9 | Server API routes (admin floor/campus upload) | All existing admin routes use Hono |
| drizzle-orm | 0.45.1 | PostgreSQL query builder | All DB access uses Drizzle; transactions already used |
| tailwindcss | 4.1.18 | Modal/tab/panel styling | All UI uses Tailwind |
| react | 19.2.4 | useState, useReducer, useRef, useMemo, useCallback | All hooks patterns established |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vaul | 1.1.2 | Already in project (NOT recommended for modal) | Vaul was replaced with custom sheet in phase 05.1 — do NOT use for the Manage Floors modal |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom HTML modal | Radix UI Dialog / HeadlessUI | No new dependencies needed; plain HTML modal with Tailwind is sufficient for the simple list-based manage-floors dialog |
| sentinel building in DB | Separate `campus` table | Separate table avoids sentinel values but requires schema migration and type changes; sentinel "Campus" building reuses all existing infrastructure |

**Installation:**
```bash
# No new packages required — all dependencies already installed
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── client/
│   ├── components/admin/
│   │   ├── EditorToolbar.tsx        # Add: onManageFloors prop, onOpenCampus concept
│   │   ├── EditorSidePanel.tsx      # Add: building link dropdown when campus entrance selected
│   │   ├── NodeMarkerLayer.tsx      # Modify: entrance marker visual distinction (campus context)
│   │   ├── EdgeLayer.tsx            # Unchanged
│   │   ├── ManageFloorsModal.tsx    # NEW: floor list, add-floor form, delete confirm dialog
│   │   └── (other admin components unchanged)
│   ├── hooks/
│   │   └── useEditorState.ts        # Modify: add per-floor state map + campus state
│   └── pages/admin/
│       └── MapEditorCanvas.tsx      # Major modification: building/floor/campus tabs, auto-save
├── server/
│   └── index.ts                     # Add: POST /api/admin/floors, DELETE /api/admin/floors/:id,
│                                    #      POST /api/admin/floor-plan/:buildingId/:floorNumber,
│                                    #      POST /api/admin/campus/image, GET /api/campus/image
```

### Pattern 1: Per-Floor Editor State via Map

**What:** Instead of one `useEditorState` hook for a single flat floor, use a `Map<string, EditorState>` where keys are `floorId` strings (e.g., "floor-1", "floor-3") plus a sentinel key `"campus"`. Each floor gets its own independent undo/redo history. The reducer function (`editorReducer`) is unchanged — it is a pure function, so it can be called for any keyed instance.

**When to use:** Whenever the active floor tab changes, dispatch goes to `stateMap.get(activeKey)`.

**Why not multiple `useEditorState` hook calls:** React rules of hooks prohibit dynamic counts. A `Map` held in `useRef` or a single `useReducer` with nested state by key is the correct approach.

**Recommended approach — single reducer with `activeFloorKey` in top-level state:**

```typescript
// Source: codebase analysis — useEditorState.ts pattern
type MultiFloorEditorState = {
  // Keyed by floorId (number) or 'campus'
  floors: Map<number | 'campus', EditorState>
  activeKey: number | 'campus'
  activeBuildingId: number | 'campus'
}
```

**Alternative approach — single reducer with all floors embedded:**

Keep the existing `EditorState` shape but add `activeFloorId` and a `floorStates: Record<number, { nodes: NavNode[], edges: NavEdge[] }>` map. On floor switch: (1) snapshot current floor into `floorStates[currentFloorId]`, (2) load new floor from `floorStates[newFloorId]`. This is simpler — undo history resets on floor switch (acceptable since auto-save handles persistence). This is the recommended approach given the auto-save constraint.

```typescript
// Source: codebase analysis — extends existing EditorState
export type EditorState = {
  nodes: NavNode[]
  edges: NavEdge[]
  // ... existing fields ...
  activeBuildingId: number | 'campus'
  activeFloorId: number | null  // null when campus active
  // Snapshot cache: floorId → { nodes, edges } (loaded from server, mutated by editing)
  floorSnapshots: Record<number, { nodes: NavNode[]; edges: NavEdge[] }>
  campusSnapshot: { nodes: NavNode[]; edges: NavEdge[] } | null
}
```

New actions needed:
```typescript
| { type: 'SWITCH_FLOOR'; floorId: number; nodes: NavNode[]; edges: NavEdge[] }
| { type: 'SWITCH_TO_CAMPUS'; nodes: NavNode[]; edges: NavEdge[] }
| { type: 'SWITCH_BUILDING'; buildingId: number }
| { type: 'SET_ACTIVE_BUILDING'; buildingId: number | 'campus' }
```

### Pattern 2: Auto-Save Before Floor Switch

**What:** Before switching floors, automatically persist the current floor's nodes/edges to the server. This is a silent operation (no UI interruption). The component calls `handleSave()` for the current floor before dispatching `SWITCH_FLOOR`.

**Implementation flow:**
```typescript
// In MapEditorCanvas.tsx
const handleFloorSwitch = useCallback(async (newFloorId: number) => {
  // 1. Auto-save current floor (silently)
  await saveCurrentFloor()  // POST /api/admin/graph (scoped to active building/floor)
  // 2. Load new floor data (from server or snapshot cache)
  const floorData = await fetchFloor(activeBuildingId, newFloorId)
  // 3. Dispatch floor switch
  dispatch({ type: 'SWITCH_FLOOR', floorId: newFloorId, ...floorData })
}, [activeBuildingId, saveCurrentFloor])
```

### Pattern 3: Campus Map as Sentinel Building in DB

**What:** Store the campus map as a building named "Campus" with a single floor at `floorNumber: 0`. This reuses all existing infrastructure (floors table, imagePath column, nodes/edges tables) without schema changes.

**Why this over a separate table:** The `GET /api/map` response already groups by buildings. Pathfinding engine already iterates buildings→floors. The campus "building" participates naturally in the existing multi-building graph. The only required type extension is on `NavNodeData` to add the bridge FK.

**DB representation:**
```sql
-- Campus building (seeded or created on first campus edit)
INSERT INTO buildings (name) VALUES ('Campus');  -- id = 2 (or next serial)
INSERT INTO floors (building_id, floor_number, image_path, updated_at)
  VALUES (2, 0, 'campus-map.png', now());
-- Nodes: type = 'entrance' for building entrance markers, type = 'junction'/'hallway' for outdoor paths
-- connectsToBuildingId stored in the new NavNodeData field
```

**Sentinel detection in client:** `building.name === 'Campus'` or `floor.floorNumber === 0` — used to render the "Campus" top-level tab.

### Pattern 4: NavNodeData Extension for Campus Bridge FK

**Recommended field name:** `connectsToBuildingId?: number`

This is the minimal extension that enables CAMP-04. An entrance node on the campus map points to a building ID; the pathfinding engine can then use the floor 1 of that building as the entry point for indoor routing.

**Whether to link to building or specific floor-1 node:** Link to the building ID only (not a specific node). The engine can look up building → floors → floor 1 → nodes at pathfinding time. This avoids having to wire a specific node ID at edit time (which could become stale if nodes are deleted).

**Schema impact:** Add `connectsToBuildingId` as a nullable integer column to the `nodes` table — requires a new Drizzle migration.

```typescript
// In src/shared/types.ts — NavNodeData interface extension
/** ID of the building this campus entrance marker bridges to (campus map only) */
connectsToBuildingId?: number
```

```typescript
// In src/server/db/schema.ts — nodes table
connectsToBuildingId: integer('connects_to_building_id').references(() => buildings.id),
```

### Pattern 5: Manage Floors Modal

**What:** A plain HTML modal (no library). Opens on "Manage Floors" button click. Contains: floor list (floor number + image thumbnail + Replace button + Delete button), plus an "Add Floor" section with floor number input + file upload.

**Implementation pattern (matches existing EditorSidePanel + EditorToolbar HTML overlay pattern):**
```tsx
// ManageFloorsModal.tsx — absolute positioned overlay, z-20, backdrop
{isOpen && (
  <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40">
    <div className="bg-white rounded-lg shadow-xl w-96 p-4 flex flex-col gap-4">
      {/* Floor list rows */}
      {/* Add floor form */}
    </div>
  </div>
)}
```

**Delete confirmation:** Use browser `window.confirm()` or a second modal state. Browser confirm is the simplest approach that meets the UX decision.

### Pattern 6: Context-Sensitive Upload Button

**What:** The toolbar's "Upload Floor Plan" button targets different endpoints depending on the active context:
- Active building + floor tab → `POST /api/admin/floor-plan/:buildingId/:floorNumber`
- Campus tab active → `POST /api/admin/campus/image`

**Implementation:** Pass `activeContext: { type: 'floor'; buildingId: number; floorId: number } | { type: 'campus' }` as a prop (or derive it from shared state) to `EditorToolbar`. The toolbar calls `onUpload` with no arguments; the parent provides the appropriate handler.

### Pattern 7: Entrance Node Visual Distinction on Campus Map

**What:** When rendering nodes on the campus canvas, `type === 'entrance'` nodes that have a `connectsToBuildingId` get a distinct visual treatment. Recommended: gold/amber circle instead of the standard green entrance color, plus a building icon or letter label.

```typescript
// In NodeMarkerLayer.tsx — add campus-context entrance color
const CAMPUS_ENTRANCE_COLOR = '#f59e0b'  // amber — matches restroom amber, visually distinct from junction gray
```

### Anti-Patterns to Avoid

- **Multiple useEditorState hook instances via array/loop:** React rules of hooks prohibit dynamic hook counts. Use a single reducer with floor-keyed snapshot cache.
- **Loading all floors' node data simultaneously into state:** Only the active floor's nodes/edges live in the active editor state. Other floors are either cached in `floorSnapshots` or fetched lazily.
- **Storing imageBlob URLs in Redux/reducer:** Blob URLs created by `URL.createObjectURL()` should be stored in `useRef` or `useState` — NOT in the reducer — to avoid stale URL issues.
- **Blocking floor switch pending save:** Auto-save must be fire-and-forget from UX perspective; optimistic UI, error handling is secondary.
- **Using Vaul for the Manage Floors modal:** Vaul was replaced in Phase 05.1 due to fundamental pointer-event conflicts. Plain HTML modal is correct.
- **Skipping the migration for `connectsToBuildingId`:** The field must be in the DB schema for pathfinding to use it. Do not store it only in-memory.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image loading state | Custom image loading logic | `use-image` hook (already installed) | Handles loading/error/loaded states, works with Konva |
| Multipart file parsing | Manual binary stream parsing | Hono's `c.req.parseBody()` (already used in `/api/admin/floor-plan`) | Pattern established in Phase 09 |
| DB transaction atomicity | Manual rollback logic | `db.transaction(async tx => {...})` (already used in `/api/admin/graph`) | Handles PostgreSQL transaction semantics |
| Normalized coordinate math | Custom pixel-to-norm conversion | Existing pattern from `NodeMarkerLayer.tsx` and `handleStageClick` | `normX = (pos.x - imageRect.x) / imageRect.width`, clamped 0-1 |
| Floor sorting | Custom sort function | `floors.sort((a, b) => a.floorNumber - b.floorNumber)` | Simple numeric sort; floor numbers are integers |

**Key insight:** Every complex operation in this phase has a direct precedent in the existing codebase. The research shows no net-new algorithmic complexity — only composition and extension of existing patterns.

---

## Common Pitfalls

### Pitfall 1: floorId vs. buildingId Confusion When Placing Nodes

**What goes wrong:** When a node is placed on the campus canvas (which is a special building with floorNumber 0), the `floorId` assigned to the new node must be the campus floor's DB `id`, not 0. The floor `id` is a serial integer from the `floors` table, not the `floorNumber`.

**Why it happens:** The distinction between `floors.id` (serial PK) and `floors.floor_number` (1, 2, 3... or 0 for campus) is easy to conflate during node placement.

**How to avoid:** Always derive `activeFloorId` from `floor.id` (DB PK), not from `floor.floorNumber`. When creating a new NavNode, set `floorId: activeFloor.id` (the DB ID).

**Warning signs:** Nodes inserted with `floorId: 0` instead of the actual floor record's serial ID will fail FK constraints at save time.

### Pitfall 2: Undo History Bleed Across Floors

**What goes wrong:** If the undo history in `useRef` contains snapshots from multiple floors, pressing Ctrl+Z on Floor 2 could restore Floor 1's node set (which no longer matches the active floor image).

**Why it happens:** The existing history is a flat array of `EditorState` snapshots. If floor switching doesn't reset history, cross-floor snapshots accumulate.

**How to avoid:** Reset undo history on every floor switch. The auto-save constraint means floor switch is a save point; history can safely reset. Clear `history.current = [newFloorState]` and `historyStep.current = 0` on `SWITCH_FLOOR`.

**Warning signs:** After undo, the canvas shows node positions that don't correspond to the current floor image.

### Pitfall 3: Image Path Collision for Per-Floor Images

**What goes wrong:** If all floor plan images are written to `assets/floor-plan.png`, uploading Floor 2's image overwrites Floor 1's image.

**Why it happens:** The existing `POST /api/admin/floor-plan` always writes to `assets/floor-plan.png` (hardcoded path in `index.ts` line 283).

**How to avoid:** Name per-floor images by `buildingId-floorNumber` convention: `assets/floor-plan-{buildingId}-{floorNumber}.png`. Update the `imagePath` column in the `floors` table row after upload. The new route `POST /api/admin/floor-plan/:buildingId/:floorNumber` handles this.

**Warning signs:** After uploading Floor 2 image, Floor 1 image also changes.

### Pitfall 4: Stale `floorPlanUrl` After Floor Switch

**What goes wrong:** `MapEditorCanvas` currently stores `floorPlanUrl` in `useState`. When switching floors, if the URL is not updated, the old floor's image continues rendering under the new floor's nodes.

**Why it happens:** The `useImage` hook caches by URL. The same URL would return the cached (old) image.

**How to avoid:** On floor switch, set `floorPlanUrl` to `/api/floor-plan/:buildingId/:floorNumber` for the new floor. Add a cache-bust param if needed after replace-image operations: `/api/floor-plan/1/2?t=timestamp`.

**Warning signs:** Floor image doesn't change after switching floor tabs.

### Pitfall 5: CSRF Token on Multipart Upload

**What goes wrong:** The new `POST /api/admin/floors` and campus image upload routes are protected by both the JWT guard and CSRF middleware. Multipart form submissions without the CSRF token will be rejected.

**Why it happens:** Hono's `csrf()` middleware is applied globally (line 33 in `index.ts`). The existing `POST /api/admin/floor-plan` avoids this by using `credentials: 'include'` — CSRF tokens are handled via the cookie-based CSRF pattern.

**How to avoid:** All fetch calls from the client use `credentials: 'include'`. Hono's CSRF uses the `Origin` header check for same-origin requests, which is fine for same-origin fetch calls. No additional CSRF token headers are needed for same-origin fetch.

**Warning signs:** 403 Forbidden on admin POST requests.

### Pitfall 6: Campus Building Not Found on First Load

**What goes wrong:** If the "Campus" sentinel building doesn't exist in the DB (fresh install), the campus tab renders but has no data. The admin clicks "Upload campus map to begin" and the upload succeeds, but there's no `buildings` row to insert a `floors` record against.

**Why it happens:** The campus building must be created before floors can be attached to it.

**How to avoid:** The `POST /api/admin/campus/image` endpoint creates the Campus building+floor row if it doesn't exist (upsert pattern), then saves the image and updates `imagePath`.

**Warning signs:** 500 error on first campus image upload due to FK violation.

### Pitfall 7: Delete Floor with FK-Constrained Nodes

**What goes wrong:** `DELETE FROM floors WHERE id = ?` fails if nodes reference that floor via `floor_id` FK.

**Why it happens:** The schema has `nodes.floor_id` → `floors.id` with `ON DELETE NO ACTION`.

**How to avoid:** The `DELETE /api/admin/floors/:id` handler must delete in FK-safe order: `DELETE FROM edges WHERE source_id IN (SELECT id FROM nodes WHERE floor_id = ?)`, then `DELETE FROM nodes WHERE floor_id = ?`, then `DELETE FROM floors WHERE id = ?`. Wrap in a transaction.

**Warning signs:** PostgreSQL FK violation error on floor deletion.

---

## Code Examples

Verified patterns from existing codebase:

### Existing Multipart Upload Pattern (reuse for per-floor and campus)
```typescript
// Source: src/server/index.ts — POST /api/admin/floor-plan (existing)
app.post('/api/admin/floor-plan/:buildingId/:floorNumber', async (c) => {
  const buildingId = Number(c.req.param('buildingId'))
  const floorNumber = Number(c.req.param('floorNumber'))
  const body = await c.req.parseBody()
  const file = body.image
  if (!file || !(file instanceof File)) return c.json({ error: 'No image file provided' }, 400)
  const buffer = Buffer.from(await file.arrayBuffer())
  const filename = `floor-plan-${buildingId}-${floorNumber}.png`
  const dest = resolve(__dirname, `assets/${filename}`)
  await writeFile(dest, buffer)
  // Update floors.image_path
  await db.update(floors)
    .set({ imagePath: filename })
    .where(and(eq(floors.buildingId, buildingId), eq(floors.floorNumber, floorNumber)))
  return c.json({ ok: true })
})
```

### Existing FK-Safe Delete Pattern (reuse for floor deletion)
```typescript
// Source: src/server/index.ts — POST /api/admin/graph uses transaction; DELETE needs same order
await db.transaction(async (tx) => {
  // 1. Delete edges whose source nodes are on this floor
  const floorNodeIds = await tx.select({ id: nodes.id }).from(nodes).where(eq(nodes.floorId, floorId))
  const ids = floorNodeIds.map(n => n.id)
  if (ids.length > 0) {
    await tx.delete(edges).where(inArray(edges.sourceId, ids))
    await tx.delete(edges).where(inArray(edges.targetId, ids))
    await tx.delete(nodes).where(eq(nodes.floorId, floorId))
  }
  await tx.delete(floors).where(eq(floors.id, floorId))
})
```

### Existing Per-Floor Image Serving (already exists, needs no change)
```typescript
// Source: src/server/index.ts — GET /api/floor-plan/:buildingId/:floorNumber (already exists)
// This route is already correct — no modification needed for image serving
```

### URL Pattern for Active Floor Image
```typescript
// In MapEditorCanvas.tsx — derive floor plan URL from active context
const floorPlanUrl = useMemo(() => {
  if (activeBuildingId === 'campus') return `/api/campus/image`
  if (activeFloorId === null) return null
  const floor = activeBuilding?.floors.find(f => f.id === activeFloorId)
  const floorNumber = floor?.floorNumber ?? 1
  return `/api/floor-plan/${activeBuildingId}/${floorNumber}?t=${floor?.updatedAt ?? ''}`
}, [activeBuildingId, activeFloorId, activeBuilding])
```

### Floor Tab Row (second row between toolbar and canvas)
```tsx
{/* Source: MapEditorCanvas.tsx render — extend existing tab bar pattern */}
{/* Context: building selector + floor tabs rendered between EditorToolbar and Stage */}
<div className="flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-1.5">
  {/* Building selector */}
  <select
    value={activeBuildingId}
    onChange={e => handleBuildingSwitch(e.target.value)}
    className="border rounded px-2 py-1 text-sm"
  >
    <option value="campus">Campus</option>
    {buildings.map(b => (
      <option key={b.id} value={b.id}>{b.name}</option>
    ))}
  </select>
  {/* Floor tabs — only shown when a building (not campus) is active */}
  {activeBuildingId !== 'campus' && activeBuilding?.floors
    .sort((a, b) => a.floorNumber - b.floorNumber)
    .map(floor => (
      <button
        key={floor.id}
        type="button"
        onClick={() => handleFloorSwitch(floor.id)}
        className={`px-3 py-1 rounded text-sm ${activeFloorId === floor.id ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
      >
        Floor {floor.floorNumber}
      </button>
    ))
  }
  {/* Manage Floors button */}
  {activeBuildingId !== 'campus' && (
    <button type="button" onClick={() => setManageFloorsOpen(true)}
      className="ml-auto text-sm px-3 py-1 border rounded">
      Manage Floors
    </button>
  )}
</div>
```

### Campus Empty State on Canvas
```tsx
{/* Source: FloorPlanCanvas.tsx pattern — centered overlay on canvas */}
{activeBuildingId === 'campus' && !campusImage && (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-auto"
       onClick={handleUploadClick}>
    <div className="text-center text-slate-500 cursor-pointer hover:text-slate-700">
      <p className="text-lg font-medium">Upload campus map to begin</p>
      <p className="text-sm">Click to upload an overhead image</p>
    </div>
  </div>
)}
```

### Building Link Dropdown in EditorSidePanel (for campus entrance nodes)
```tsx
{/* Source: EditorSidePanel.tsx pattern — add below node type selector */}
{selectedNode.type === 'entrance' && activeBuildingId === 'campus' && (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
      Links to Building
    </label>
    <select
      value={selectedNode.connectsToBuildingId ?? ''}
      onChange={e => onUpdateNode(selectedNode.id, {
        connectsToBuildingId: Number(e.target.value) || undefined
      })}
      className="border rounded px-2 py-1.5 text-sm"
    >
      <option value="">— None —</option>
      {nonCampusBuildings.map(b => (
        <option key={b.id} value={b.id}>{b.name}</option>
      ))}
    </select>
  </div>
)}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single flat `nodes[]`/`edges[]` in editor | Must scope to `activeFloorId` | Phase 18 | Editor state shape extends to include floor context |
| `POST /api/admin/floor-plan` → overwrites single file | `POST /api/admin/floor-plan/:buildingId/:floorNumber` | Phase 18 | Per-floor image files |
| `handleSave` hardcodes building 1 / floor 1 | `handleSave` uses active building/floor from state | Phase 18 | Save is context-aware |
| No campus concept | Campus as sentinel building (name = "Campus", floorNumber = 0) | Phase 18 | Participates in existing graph/pathfinding infrastructure |

**Deprecated/outdated:**
- `POST /api/admin/floor-plan` (flat, single-floor): superseded by the parameterized route; keep for backward compat or remove
- `GET /api/floor-plan/image` (hardcoded single image): superseded by `GET /api/floor-plan/:buildingId/:floorNumber`; may retain as legacy shim

---

## Open Questions

1. **Should the old `GET /api/floor-plan/image` and `POST /api/admin/floor-plan` routes be removed or kept?**
   - What we know: Both are called from `MapEditorCanvas` (upload) and `useFloorPlanImage` (student view)
   - What's unclear: Student view `useFloorPlanImage` still uses `/api/floor-plan/image` and `/api/floor-plan/thumbnail` — these student-facing hooks are not in scope for Phase 18, but removing the routes would break Phase 17's existing student view
   - Recommendation: Keep the old routes intact; add new parameterized routes alongside. Phase 19 (Student Floor Tab UI) will update the student-facing hooks.

2. **How does the initial NavGraph load in MapEditorCanvas change?**
   - What we know: `useEffect` fetches `GET /api/map` and flattens all buildings→floors→nodes into a single array. Phase 18 must preserve the multi-building/multi-floor structure instead of flattening.
   - What's unclear: Whether to restructure the initial load effect or add a separate state for the full `NavGraph`.
   - Recommendation: Store the full `NavGraph` response in a `useState<NavGraph | null>` (separate from `useEditorState`). Derive `activeBuilding` and `activeFloor` by lookup. Only flatten into `EditorState` for the active floor.

3. **Migration strategy for `connectsToBuildingId` column**
   - What we know: A new Drizzle migration is needed; Drizzle-kit generates SQL from schema changes
   - What's unclear: Whether the `drizzle-kit generate` command is run manually or via a script in this project
   - Recommendation: Run `npx drizzle-kit generate` after updating `schema.ts`, then commit the generated SQL file to `drizzle/`. The migration runs automatically on server startup (existing `migrate()` call in `index.ts`).

---

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection: `src/server/index.ts` — all existing API routes and patterns
- Direct codebase inspection: `src/client/pages/admin/MapEditorCanvas.tsx` — editor structure and lifecycle
- Direct codebase inspection: `src/client/hooks/useEditorState.ts` — reducer/history pattern
- Direct codebase inspection: `src/shared/types.ts` — NavNodeData/NavGraph type shapes
- Direct codebase inspection: `src/server/db/schema.ts` — PostgreSQL table definitions
- Direct codebase inspection: `package.json` — all installed library versions

### Secondary (MEDIUM confidence)
- Project STATE.md accumulated decisions — documents Phase 09-17 decisions that constrain this phase
- `.planning/phases/18-admin-multi-floor-editor/18-CONTEXT.md` — locked user decisions

### Tertiary (LOW confidence)
- None — all findings are from direct code inspection, not web search

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — read directly from package.json; no new packages needed
- Architecture: HIGH — all patterns derived from existing working code in the codebase
- Pitfalls: HIGH — derived from code inspection of FK relationships, file path patterns, and existing workarounds

**Research date:** 2026-03-01
**Valid until:** 2026-04-01 (stable — all dependencies are locked versions; no fast-moving external APIs)
