# Architecture Patterns — v1.6 Integration Analysis

**Domain:** Campus indoor wayfinding — GPS integration, mobile gesture fix, multi-floor directions UX, admin floor-connector visual linking
**Researched:** 2026-03-09
**Confidence:** HIGH — based on direct source code inspection of v1.5 codebase

---

## Existing Architecture (v1.5 Baseline)

This section documents what is already in place. All four v1.6 features integrate INTO this structure.

### System Diagram

```
STUDENT SIDE                              ADMIN SIDE
============                              ==========
FloorPlanCanvas.tsx                       MapEditorCanvas.tsx
  ├── useGraphData → GET /api/map           ├── useEditorState (reducer)
  ├── useMapViewport (Konva stage direct)   ├── useMapViewport (same hook)
  ├── useRouteSelection                     ├── EditorSidePanel.tsx
  ├── useRouteDirections                    │     └── node property form
  ├── DirectionsSheet.tsx                   ├── NodeDataTable.tsx
  ├── LandmarkLayer.tsx                     ├── EdgeDataTable.tsx
  ├── RouteLayer.tsx                        ├── ManageFloorsModal.tsx
  ├── SelectionMarkerLayer.tsx              └── EditorToolbar.tsx
  └── FloorTabStrip.tsx
              |
              | GET /api/map (public, no auth)
              | POST /api/admin/* (JWT cookie)
              v
      Hono REST API (src/server/index.ts)
              |
              v
      PostgreSQL via Drizzle ORM
      buildings → floors → nodes / edges

Object storage: Backblaze B2 (S3-compatible)
  - floor-plan-{buildingId}-{floorNumber}.{ext}
  - campus-map.{ext}
```

### Key Invariants (Must Not Break)

| Invariant | Where enforced |
|-----------|---------------|
| Coordinates stored as normalized 0-1 fractions | `NavNodeData.x / .y`, schema `real` columns |
| Konva stage mutations are DIRECT (not React setState) | `useMapViewport.ts` — all viewport ops write directly to `stage` ref |
| Two-pass buildGraph: pass 1 intra-floor, pass 2 inter-floor from `connectsToNodeAboveId` | `graph-builder.ts` |
| `floorNumber=0` sentinel for campus map | `schema.ts`, `server/index.ts` campus upsert |
| JWT in httpOnly cookie named `admin_token` | `server/index.ts` jwt middleware |
| `GET /api/map` fully public, no auth | All student clients call this without credentials |

---

## Feature 1: Pinch-Zoom / Rotation Focal Point Fix

### What is broken

In `useMapViewport.ts` `handleTouchMove`, when two fingers move, the zoom is applied but the stage position does not correctly account for the touch midpoint as the focal center. The current code computes `pointTo` using `stage.scaleX()` at the start of the gesture frame, but the initial frame (`lastDist.current === 0`) returns early WITHOUT setting `lastCenter.current` to the current midpoint — it sets it and then bails out. On the next frame, `lastCenter.current` is used correctly, but the scale application on the first non-bail frame uses `center` as if it is the reference, when the reference is `lastCenter.current`.

The rotation logic is also using `lastAngle.current` correctly — it tracks the delta from the previous frame, which is correct.

The core bug in the zoom focal point: `pointTo` is computed relative to `center` (current touch midpoint in screen coords), not relative to the touch midpoint converted through the CURRENT stage transform. This means when you pinch, the map drifts rather than zooming around the midpoint.

### What changes

**File to modify: `src/client/hooks/useMapViewport.ts`**

Only `handleTouchMove` needs fixing. The fix is:
1. Compute `pointTo` in stage-local coordinates using the CURRENT frame's `center` converted through the inverse of the current stage transform (same pattern as `handleWheel`).
2. Apply new scale, then set stage position to `center - pointTo * newScale + (translationDelta from finger pan)`.

No new files, no new components, no schema changes. Pure bug fix in one function.

### Integration points

| Touch point | File | Change type |
|-------------|------|-------------|
| Touch handler | `src/client/hooks/useMapViewport.ts` | MODIFY `handleTouchMove` only |
| Admin editor | Uses same `useMapViewport` hook — fix applies automatically | NONE |

### Confidence: HIGH
The code is visible and the bug is mechanical. The wheel handler implements the correct focal-point math already — the touch handler just needs the same `pointTo` computation.

---

## Feature 2: Multi-Floor Directions — Floor-Change Dividers

### What exists

`useRouteDirections.ts` (`generateDirections`) already detects floor-change steps:

```ts
if (curr.floorId !== next.floorId) {
  // ... emits a floor-transition DirectionStep
  // icon: 'stairs-up' | 'stairs-down' | 'elevator' | 'ramp'
  // instruction: "Take the stairs to Floor 3"
}
```

`DirectionsSheet.tsx` renders all steps as a flat list of `<StepItem>` components. There is currently NO visual section divider between the per-floor segments of the route.

### What the feature requires

1. The directions list must show a **section header/divider** between segments that belong to different floors. E.g.: a "Floor 2" header row before the steps on Floor 2.
2. The connector step ("Take the stairs to Floor 3") acts as a transition between sections.

### Data already available

`DirectionStep` already carries `isAccessibleSegment`. The floor number is embedded in the instruction text ("Take the stairs to Floor 3") but is not a structured field.

To render section dividers cleanly, the step list needs to know WHICH FLOOR each step belongs to. Two options:

**Option A (recommended):** Add a `floorId?: number` field to `DirectionStep`. `generateDirections` already has access to `curr.floorId` at the moment it emits each step — simply include it. Then `DirectionsSheet` can group steps by floorId and render a "Floor N" divider row whenever `floorId` changes.

**Option B:** Parse floor number from instruction text in `DirectionsSheet`. Fragile — instruction text can change, and it would couple rendering to string parsing.

### What changes

**File: `src/client/hooks/useRouteDirections.ts`**
- Add `floorId?: number` to `DirectionStep` interface
- Populate `floorId` in `generateDirections` from `curr.floorId` for each intermediate step
- Populate `floorId` for the arrive step from `last.floorId`

**File: `src/client/components/DirectionsSheet.tsx`**
- Modify the step list renderer (`StepItem` loop) to detect `floorId` changes and insert a floor section header div before the first step of each new floor
- Section header: e.g. `"Floor 2"` label with a horizontal rule, styled as a divider row

**New sub-component (inline or extracted):** `FloorSectionHeader` — renders the floor label between step groups.

No API changes. No schema changes. No new endpoints.

### Integration points

| Touch point | File | Change type |
|-------------|------|-------------|
| Step type | `src/client/hooks/useRouteDirections.ts` | ADD `floorId` field to `DirectionStep` |
| Direction generation | `src/client/hooks/useRouteDirections.ts` | MODIFY `generateDirections` to populate `floorId` |
| Step rendering | `src/client/components/DirectionsSheet.tsx` | MODIFY step list loop to insert floor dividers |
| Test | `src/client/hooks/useRouteDirections.test.ts` | UPDATE to assert `floorId` on steps |

### Confidence: HIGH
All required data flows through the existing pipeline. The change is additive (new field, new rendering logic). No regressions possible in the pathfinding or graph layers.

---

## Feature 3: GPS Bounds Configuration + "You Are Here" Dot

This is the most architecturally new feature. It touches schema, API, admin UI, and student UI.

### Conceptual model

**GPS bounds per floor:** Admin configures four real-world lat/lng values for each floor plan (or the campus map). These define the bounding box that maps the image corners to real-world coordinates.

```
(minLng, maxLat) ----------- (maxLng, maxLat)   ← image top-left / top-right
       |                              |
       |     floor plan image         |
       |                              |
(minLng, minLat) ----------- (maxLng, minLat)   ← image bottom-left / bottom-right
```

**Coordinate transformation:** Given a GPS point `(lat, lng)`, convert to normalized 0-1:
```
normX = (lng - minLng) / (maxLng - minLng)
normY = (maxLat - lat) / (maxLat - minLat)   // Y is inverted: image Y=0 is top (maxLat)
```

**Nearest-node snap:** Once the user's GPS position is in normalized 0-1 space, find the nearest visible landmark node (Euclidean distance) and offer it as the start location.

### New data: GPS bounds on floors table

**Schema change required.** The `floors` table must gain four new nullable columns:

```sql
ALTER TABLE floors ADD COLUMN gps_min_lat REAL;
ALTER TABLE floors ADD COLUMN gps_max_lat REAL;
ALTER TABLE floors ADD COLUMN gps_min_lng REAL;
ALTER TABLE floors ADD COLUMN gps_max_lng REAL;
```

These are nullable — floors without GPS bounds configured show no GPS feature.

**Drizzle schema (`src/server/db/schema.ts`):** Add four `real()` nullable columns to `floors`.

**Migration:** A new Drizzle migration file must be generated (`drizzle generate`).

### API changes

**Existing `GET /api/map`:** The `NavFloor` serialization must include GPS bounds when present. Add four optional fields to the response:

```ts
// In NavFloor (shared/types.ts)
gpsBounds?: {
  minLat: number
  maxLat: number
  minLng: number
  maxLng: number
}
```

No new endpoint needed — GPS bounds ride the existing `GET /api/map` payload.

**New admin endpoint — `PUT /api/admin/floors/:id/gps-bounds`:**

```
PUT /api/admin/floors/:id/gps-bounds
Body: { minLat, maxLat, minLng, maxLng }
Response: { ok: true }
```

JWT-protected (falls under `/api/admin/*` middleware already in place). Updates the four columns on the specified floor row.

### Admin UI: GPS Bounds Form

**Where to add it:** Inside `ManageFloorsModal.tsx`, per-floor row. Each floor in the list gets an expandable "Configure GPS bounds" section with four number inputs (min/max lat, min/max lng) and a Save button that calls the new endpoint.

**Alternative placement:** In `EditorSidePanel.tsx` as a floor-level panel (not node/edge). This is less discoverable because the side panel only appears when a node/edge is selected.

**Recommended:** Expand `ManageFloorsModal.tsx` — it already has the floor list, each floor has a row, and it handles async API calls. The GPS bounds form fits naturally as a collapsible section per row.

### Student UI: GPS Dot + Nearest-Node Snap

**New hook: `src/client/hooks/useGeolocation.ts`**

```ts
export function useGeolocation(): {
  position: GeolocationCoordinates | null
  error: string | null
  isSupported: boolean
}
```

Calls `navigator.geolocation.watchPosition` for live updates. Returns null when permission denied or unavailable. The hook cleans up the watcher on unmount.

**New hook: `src/client/hooks/useGpsPosition.ts`** (or inline in `FloorPlanCanvas`)

Given:
- Geolocation coordinates
- Active floor's `gpsBounds` (from the NavFloor object in `graphState.data`)
- `imageRect` (the floor plan's pixel rect on the Konva stage)

Computes the normalized 0-1 position of the user, then converts to pixel coords for Konva rendering. Returns `{ normX, normY, pixelX, pixelY }` or `null` when bounds not configured or GPS unavailable.

**Nearest-node snap:**

```ts
function findNearestNode(
  normX: number,
  normY: number,
  nodes: NavNode[],
  activeFloorId: number
): NavNode | null
```

Filters nodes to `activeFloorId` and `searchable: true`, then finds the node with minimum Euclidean distance to `(normX, normY)` in normalized coords. Returns null if no nodes on current floor.

**New Konva layer: GPS Dot**

A new Konva `Circle` (or custom `Group`) rendered on the stage showing the user's position. Uses the Konva `hitOnDragEnabled` pattern already in use. Renders only when GPS is available and floor has bounds configured.

**Placement in `FloorPlanCanvas.tsx`:** Add GPS dot as a new `Layer` between `RouteLayer` and `LandmarkLayer`, so it appears above the route line but below landmark markers.

**"Snap to start" UX:** When GPS position is available and a nearest node is found, show a dismissible banner or button ("Use your location as start") that calls `routeSelection.setFromTap(nearestNode)`. This is additive — user can still manually pick a start.

### New GPS permission handling

GPS requires `navigator.geolocation`. The app must handle:
- Browser API not available (non-HTTPS, old browser): show nothing, no error
- Permission denied: show nothing silently (do not alarm student-facing UX)
- Permission prompt: browser handles natively

### Integration points summary — GPS feature

| Touch point | File | Change type |
|-------------|------|-------------|
| DB schema | `src/server/db/schema.ts` | ADD 4 nullable GPS columns to `floors` |
| Migration | New Drizzle migration file | NEW |
| Shared types | `src/shared/types.ts` | ADD `gpsBounds?` to `NavFloor` |
| GET /api/map | `src/server/index.ts` | MODIFY NavFloor serialization to include gpsBounds |
| New endpoint | `src/server/index.ts` | ADD `PUT /api/admin/floors/:id/gps-bounds` |
| Admin GPS form | `src/client/components/admin/ManageFloorsModal.tsx` | ADD GPS bounds fields per floor row |
| Geolocation hook | `src/client/hooks/useGeolocation.ts` | NEW |
| GPS transform | `src/client/hooks/useGpsPosition.ts` or inline | NEW |
| GPS dot layer | `src/client/components/FloorPlanCanvas.tsx` | ADD Konva Circle layer |
| "Use location" banner | `src/client/components/FloorPlanCanvas.tsx` | ADD conditionally rendered HTML overlay |

### Confidence: HIGH (for architecture). MEDIUM for browser GPS behavior specifics.
The coordinate math is straightforward. The browser Geolocation API is stable since 2013 (MDN, HIGH confidence). The main uncertainty: GPS accuracy on mobile inside buildings is typically 5-30m, which may snap to wrong nodes — this is a UX/data quality concern, not an architectural one.

---

## Feature 4: Admin Visual Floor-Connector Linking

### What the problem is

Currently, linking a staircase/elevator/ramp node to its counterpart on another floor requires the admin to:
1. Know the exact node ID of the node on the other floor
2. Type it manually into a text field (which does not currently exist in the UI — the connector IDs are only set via JSON import/export)

This is the current state: `EditorSidePanel.tsx` does NOT render any UI for `connectsToNodeAboveId / connectsToNodeBelowId`. These fields exist in the DB schema and types, but the admin UI has no way to set them interactively.

### Proposed workflow

When a connector node (type: `stairs`, `elevator`, or `ramp`) is selected in the admin editor:
1. EditorSidePanel shows a "Floor Connections" section
2. A "Link to node above" picker appears — a `<select>` dropdown populated with connector nodes from the floor above
3. A "Link to node below" picker appears — a `<select>` populated with connector nodes from the floor below
4. Selecting a node from the dropdown sets `connectsToNodeAboveId` or `connectsToNodeBelowId` on both nodes (bidirectional link — when you link A to B above, B's `connectsToNodeBelowId` should be set to A)

### What data is needed

The editor already loads the full `NavGraph` (`navGraph` state in `MapEditorCanvas.tsx`). All buildings, floors, and their nodes are available. The side panel needs access to:
- The full `NavGraph` (or at least the adjacent floor's nodes)
- The active floor's `floorNumber` and `buildingId`
- The floor above (if exists) and floor below (if exists), extracted from `navGraph`

**Current `EditorSidePanel` props do NOT include `navGraph`.**

### What changes

**File: `src/client/components/admin/EditorSidePanel.tsx`**

Add props:
- `navGraph: NavGraph | null` — to populate cross-floor node pickers
- `activeFloorId: number | null` — to know which floor is active (already in editor state, needs to be threaded)
- `activeBuildingId: number | 'campus'` — to scope floor lookup

Add a new "Floor Connections" section in the node editing form, visible only when `selectedNode.type === 'stairs' || selectedNode.type === 'elevator' || selectedNode.type === 'ramp'`.

The section contains two dropdowns:
- "Connects to floor above": `<select>` of connector nodes on the floor above (same building). Populated by looking up `navGraph.buildings.find(b => b.id === activeBuildingId)?.floors.find(f => f.floorNumber === activeFloorNumber + 1)?.nodes.filter(n => isConnectorType(n.type))`.
- "Connects to floor below": same pattern for `floorNumber - 1`.

When the admin selects a node from the dropdown, `onUpdateNode` is called with `{ connectsToNodeAboveId: selectedId }`. The reciprocal update (`connectsToNodeBelowId` on the target node) requires either:
- **Option A (recommended):** A second `onUpdateNode` call for the target node in the same handler, dispatching `UPDATE_NODE` for both nodes atomically.
- **Option B:** Server-side enforcement of bidirectionality. Not recommended — adds complexity to the thin CRUD server.

**File: `src/client/pages/admin/MapEditorCanvas.tsx`**

Pass `navGraph`, `activeFloorId`, `activeBuildingId` into `EditorSidePanel`.

**No API changes required.** The existing `POST /api/admin/graph` saves the full graph including connector IDs. The new UI simply populates fields that were previously only settable via import. Graph save is unmodified.

### Visual "link line" enhancement (optional / defer)

A more advanced version would draw a visual indicator line between linked connector nodes across floors (e.g., in a "floor overview" panel). This is higher complexity and should be deferred to a later phase. The dropdown UX described above is sufficient for v1.6.

### Integration points

| Touch point | File | Change type |
|-------------|------|-------------|
| Side panel props | `src/client/components/admin/EditorSidePanel.tsx` | ADD `navGraph`, `activeFloorId`, `activeBuildingId` props |
| Floor connector section | `src/client/components/admin/EditorSidePanel.tsx` | ADD "Floor Connections" section with two dropdowns |
| Bidirectional update | `src/client/components/admin/EditorSidePanel.tsx` | Call `onUpdateNode` TWICE (source + target) on selection |
| Canvas wires props | `src/client/pages/admin/MapEditorCanvas.tsx` | PASS navGraph + floor context to EditorSidePanel |

### Confidence: HIGH
All data is already in-memory in the editor. The change is pure UI addition. The reducer already handles `UPDATE_NODE` for arbitrary node updates.

---

## Component Boundaries: New vs Modified

### New files

| File | Purpose |
|------|---------|
| `src/client/hooks/useGeolocation.ts` | Browser Geolocation API wrapper — watchPosition, cleanup, error handling |
| `src/client/hooks/useGpsPosition.ts` | Transform lat/lng to normalized 0-1 coords given floor gpsBounds |
| New Drizzle migration file | Adds 4 GPS columns to `floors` table |

### Modified files

| File | What changes | Feature |
|------|--------------|---------|
| `src/server/db/schema.ts` | Add 4 nullable GPS real columns to `floors` | GPS |
| `src/shared/types.ts` | Add `gpsBounds?` to `NavFloor`; add `floorId?` to `DirectionStep` | GPS + Directions |
| `src/server/index.ts` | Include GPS bounds in `GET /api/map` serialization; add `PUT /api/admin/floors/:id/gps-bounds` | GPS |
| `src/client/hooks/useRouteDirections.ts` | Add `floorId` to `DirectionStep`; populate in `generateDirections` | Directions |
| `src/client/hooks/useMapViewport.ts` | Fix `handleTouchMove` focal-point calculation | Touch |
| `src/client/components/DirectionsSheet.tsx` | Render floor-section dividers between step groups | Directions |
| `src/client/components/FloorPlanCanvas.tsx` | Add GPS dot layer + geolocation hooks + "use my location" UX | GPS |
| `src/client/components/admin/EditorSidePanel.tsx` | Add floor connector picker UI; add navGraph + floor context props | Connector |
| `src/client/components/admin/ManageFloorsModal.tsx` | Add GPS bounds config per floor | GPS |
| `src/client/pages/admin/MapEditorCanvas.tsx` | Pass navGraph + floor context to EditorSidePanel | Connector |

### Unchanged files

Pathfinding engine, graph builder, all DB queries except GET /api/map serialization, RouteLayer, LandmarkLayer, FloorTabStrip, SearchOverlay, SelectionMarkerLayer.

---

## Data Flow Changes

### GPS: Admin → Student

```
Admin opens ManageFloorsModal
  → enters GPS bounds (minLat, maxLat, minLng, maxLng) for a floor
  → calls PUT /api/admin/floors/:id/gps-bounds
  → server writes 4 columns to floors table
  → next time student loads app: GET /api/map includes gpsBounds on NavFloor
  → useGpsPosition reads floor's gpsBounds
  → browser Geolocation API returns lat/lng
  → transform to normX, normY
  → nearest searchable node on active floor found
  → GPS dot drawn on Konva canvas at (pixelX, pixelY)
  → optional: user taps "Use my location" → routeSelection.setFromTap(nearestNode)
```

### Floor Directions: Pathfinding → Rendering

```
PathfindingEngine.findRoute → PathResult.nodeIds (ordered, may cross floors)
  → generateDirections(nodeIds, nodeMap, mode, floorMap)
  → DirectionStep[] where each step now carries floorId
  → DirectionsSheet renders steps grouped by floorId
  → FloorSectionHeader inserted between groups
```

### Admin Floor Connector: UI → Graph

```
Admin selects a staircase node in EditorSidePanel
  → EditorSidePanel shows "Connects to floor above" dropdown
  → Dropdown populated from navGraph.buildings[].floors[floorAbove].nodes.filter(isConnector)
  → Admin selects target node
  → onUpdateNode(sourceNode.id, { connectsToNodeAboveId: targetId })
  → onUpdateNode(targetNode.id, { connectsToNodeBelowId: sourceNode.id })
  → Both dispatched as UPDATE_NODE to editorReducer
  → Editor state is dirty
  → Admin saves → POST /api/admin/graph with full graph
  → buildGraph pass 2 synthesizes inter-floor edges from connectsToNodeAboveId
  → Routes now cross floors correctly
```

---

## Build Order for v1.6

Dependencies dictate order. Independent features can be parallelized.

### Dependency graph

```
Feature A: Touch fix (useMapViewport)
  → No dependencies on other features. Can be built first, standalone.

Feature B: Directions dividers (useRouteDirections + DirectionsSheet)
  → No dependencies on other features. Can be built standalone.
  → DEPENDS ON: existing DirectionStep type (extend it, don't replace it)

Feature C: Admin floor-connector picker (EditorSidePanel)
  → No dependencies on GPS or directions features.
  → DEPENDS ON: navGraph being passed through (thread prop from MapEditorCanvas)

Feature D: GPS bounds + GPS dot
  → DEPENDS ON: schema migration (must run first)
  → DEPENDS ON: shared types update (NavFloor.gpsBounds)
  → DEPENDS ON: server endpoint (PUT gps-bounds)
  → DEPENDS ON: GPS bounds form in ManageFloorsModal
  → AFTER: schema → API → admin form → student GPS dot
```

### Recommended phase order

**Phase 1 — Touch Fix (standalone, zero risk)**
Fix `handleTouchMove` in `useMapViewport.ts`. Verify on mobile. No dependencies. Unblocks nothing but should ship early — it affects both student and admin canvas.

**Phase 2 — Directions Floor Dividers (standalone, low risk)**
Extend `DirectionStep` with `floorId`, populate in `generateDirections`, render dividers in `DirectionsSheet`. Update tests. No server changes. Can proceed in parallel with Phase 1.

**Phase 3 — Admin Floor-Connector Picker (UI only, medium complexity)**
Thread `navGraph` + floor context into `EditorSidePanel`. Add connector picker section. Handle bidirectional UPDATE_NODE dispatches. No schema or API changes. Requires careful prop threading.

**Phase 4 — GPS Schema + API (blocks student GPS feature)**
Write Drizzle migration. Update `schema.ts`. Update `shared/types.ts` (`NavFloor.gpsBounds`). Update `GET /api/map` serialization. Add `PUT /api/admin/floors/:id/gps-bounds`. This is the prerequisite for all GPS UI.

**Phase 5 — GPS Admin Form (depends on Phase 4)**
Add GPS bounds config UI in `ManageFloorsModal.tsx`. Admin can now store bounds per floor.

**Phase 6 — GPS Student Feature (depends on Phase 4 + 5)**
Implement `useGeolocation`, `useGpsPosition`. Add GPS dot to `FloorPlanCanvas`. Add nearest-node snap + "use my location" UX. Full end-to-end GPS feature complete.

### Summary table

| Phase | Feature | Files | Depends on |
|-------|---------|-------|------------|
| 1 | Touch focal point fix | `useMapViewport.ts` | Nothing |
| 2 | Directions floor dividers | `useRouteDirections.ts`, `DirectionsSheet.tsx` | Nothing |
| 3 | Admin floor-connector picker | `EditorSidePanel.tsx`, `MapEditorCanvas.tsx` | Nothing (navGraph already loaded) |
| 4 | GPS schema + API | `schema.ts`, migration, `types.ts`, `server/index.ts` | Phase 3 (for clean merge), but technically independent |
| 5 | GPS admin form | `ManageFloorsModal.tsx` | Phase 4 |
| 6 | GPS student feature | `useGeolocation.ts`, `useGpsPosition.ts`, `FloorPlanCanvas.tsx` | Phase 4 + 5 |

Phases 1, 2, 3 are fully independent and can be parallelized. Phase 4 must precede Phases 5 and 6. Phase 5 must precede Phase 6 (admin sets bounds before student GPS works).

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Storing GPS bounds on the NavNode (not the floor)
**What:** Attaching GPS-corner nodes to the node graph.
**Why bad:** GPS bounds are a property of the floor IMAGE, not the navigation graph. Mixing concerns complicates the schema and makes bounds editing dependent on the graph editor.
**Instead:** Store GPS bounds on the `floors` table. Independent admin UI in ManageFloorsModal.

### Anti-Pattern 2: Server-side GPS coordinate transformation
**What:** Sending raw lat/lng to server, receiving normalized 0-1 back.
**Why bad:** Adds a round-trip for every GPS position update. Client already has all the data (NavFloor.gpsBounds) needed to do the math locally in <1ms.
**Instead:** Transform client-side in `useGpsPosition`. Server only persists the bounds.

### Anti-Pattern 3: React state for Konva GPS dot position
**What:** Storing GPS dot pixel position in React state and re-rendering the Stage component.
**Why bad:** GPS updates can arrive frequently (1Hz). Forcing React re-renders would drop frames and conflict with the established pattern of direct Konva stage mutations for viewport.
**Instead:** Use a Konva `Circle` ref and call `circle.position({ x, y })` directly when GPS updates arrive, consistent with the `direct stage mutations` pattern for viewport. Only re-render the GPS layer, not the whole Stage.

### Anti-Pattern 4: One-way floor-connector linking (only set connectsToNodeAboveId, not the reciprocal)
**What:** Admin links A → B above, but doesn't update B's `connectsToNodeBelowId`.
**Why bad:** `buildGraph` pass 2 only reads `connectsToNodeAboveId` to synthesize the inter-floor edge. If only `connectsToNodeBelowId` is set (with no `connectsToNodeAboveId` counterpart), the cross-floor edge is never created. The pair must be set bidirectionally.
**Instead:** When admin sets A's `connectsToNodeAboveId = B`, immediately also dispatch `UPDATE_NODE(B.id, { connectsToNodeBelowId: A.id })`.

### Anti-Pattern 5: Parsing floor number from direction instruction text
**What:** Reading "Take the stairs to Floor 3" and extracting "3" with regex in `DirectionsSheet`.
**Why bad:** Couples rendering to instruction string format. Any wording change breaks the parser. The floor ID is available as structured data in `curr.floorId`.
**Instead:** Add `floorId` as a typed field on `DirectionStep` and use it directly.

---

## Scalability Impact of v1.6

| Change | Impact | Mitigation |
|--------|--------|------------|
| 4 new nullable columns on `floors` | Negligible — table has few rows (one per floor) | None needed |
| `gpsBounds` in GET /api/map response | Adds ~100 bytes per floor to JSON payload | None needed at this scale |
| Geolocation watchPosition | Battery drain on mobile | Use `maximumAge: 10000` to throttle GPS queries; stop watcher when user leaves student view |
| GPS dot Konva layer | Extra draw call on GPS update | Use direct Konva node mutation (not React state) to update position without full stage re-render |

---

## Sources

- Direct source code inspection: `src/client/hooks/useMapViewport.ts` (v1.5)
- Direct source code inspection: `src/client/hooks/useRouteDirections.ts` (v1.5)
- Direct source code inspection: `src/client/components/DirectionsSheet.tsx` (v1.5)
- Direct source code inspection: `src/client/components/admin/EditorSidePanel.tsx` (v1.5)
- Direct source code inspection: `src/server/db/schema.ts` (v1.5)
- Direct source code inspection: `src/server/index.ts` (v1.5)
- Direct source code inspection: `src/shared/types.ts` (v1.5)
- Direct source code inspection: `src/shared/pathfinding/graph-builder.ts` (v1.5)
- MDN Web Docs — Geolocation API: `navigator.geolocation.watchPosition` — stable since 2013 [HIGH confidence]
- Konva.js direct node mutation pattern — already used in useMapViewport.ts `handleWheel` [HIGH confidence]

---

*Architecture research for: CampusNav v1.6 — GPS Integration & UX Refinements*
*Researched: 2026-03-09*
