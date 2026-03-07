# Phase 19: Student Floor Tab UI - Research

**Researched:** 2026-03-07
**Domain:** React/Konva floor-switching UI, node filtering, route segment filtering
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Floor tab layout**
- Floor tabs appear as a bottom strip anchored above the sheets (DirectionsSheet / LocationDetailSheet)
- A building selector sits above the floor tab row (same hierarchy as the admin editor) — switching buildings updates the floor tabs below
- Campus tab appears alongside building tabs at the top level of the building selector (if campus map image/nodes exist)
- Tab strip is hidden when the DirectionsSheet is open — reduces bottom chrome crowding; tab strip reappears when the sheet closes
- Tab strip is hidden entirely when only one floor exists across all buildings — single-floor campuses see no new chrome (preserves v1.0 experience)

**Active floor filtering**
- Active floor canvas shows: all nodes on the active floor at full opacity + connector nodes (stairs, elevators, ramps) from adjacent floors dimmed — lets students locate connectors without visual clutter from unrelated floors
- Tapping a dimmed connector node (or any node on a non-active floor) auto-switches the active floor to that node's floor — seamless, no manual tab tap required
- Switching floors re-fits the floor plan image to screen (fitToScreen) and loads the new floor's plan image

**Cross-floor route display**
- RouteLayer renders only the route segment that falls on the currently active floor — other floor segments are not shown
- No auto-switching floors while following directions — directions panel already includes a "Take stairs/elevator to Floor N" step; student reads it, switches tabs manually, sees the next segment
- Route visibility on floors the route doesn't pass through: Claude's Discretion (e.g. empty canvas or subtle no-route indicator)

**Default state on load**
- On app open: Floor 1 of the first building returned by the API is the default active floor
- When a route is computed (Get Directions): auto-switch active floor to the start pin's floor — student immediately sees where their journey begins

### Claude's Discretion
- Whether to show a subtle indicator on floors the route doesn't pass through ("Route doesn't pass through this floor")
- Exact visual styling of dimmed connector node markers vs. active floor markers
- How the building selector is rendered (dropdown vs. button group) in the bottom strip
- useFloorPlanImage parameterization strategy (new hook or parameter added to existing)
- How `imageRect` and zoom state are reset vs. preserved on floor switch

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MFLR-05 | Student sees per-floor route segments — each segment displayed on that floor's map | Route segment filtering: `nodeIds` where `nodeMap.get(id).floorId === activeFloor.id`; covered by RouteLayer points prop pattern |
| MFLR-06 | Student can switch between floor tabs to browse any floor's map independently of the active route | Floor tab strip UI component; `activeFloorId` state; `useFloorPlanImage` parameterization; `fitToScreen` on switch |
| CAMP-05 | Routes crossing buildings display an outdoor campus segment between each building's floor segments | Campus building treated as a selectable "building" in selector; campus floor (floorNumber=0) has its own route segment filtering |
</phase_requirements>

---

## Summary

Phase 19 is a pure UI wiring phase. All backend data, pathfinding engine, and admin editor machinery is in place. The task is to add floor/building navigation UI to `FloorPlanCanvas.tsx` and related components so students can browse floors, see filtered landmarks, and view the correct route segment per floor.

The approach mirrors the admin editor pattern (`MapEditorCanvas.tsx`) but simplified for read-only student use: no save/undo/redo, no mode system. State lives in `FloorPlanCanvas.tsx` as `activeFloorId: number | null` and `activeBuildingId: number | 'campus' | null`. The `useGraphData` hook already provides the full `NavGraph` with `buildings[].floors[]` — no new API calls needed.

The key insight about filtering: `LandmarkLayer` receives a pre-filtered `nodes` prop (already the pattern from Phase 7). The caller (FloorPlanCanvas) filters nodes before passing them in, so no changes are needed to `LandmarkLayer` beyond opacity support for dimmed connectors. `RouteLayer` similarly receives a pre-filtered `points[]` array.

**Primary recommendation:** Lift active floor/building state into `FloorPlanCanvas.tsx`. Derive all filtered data with `useMemo`. Add a new `FloorTabStrip` HTML overlay component positioned above the bottom sheets. Parameterize `useFloorPlanImage` to accept `{ buildingId, floorNumber }`.

---

## Standard Stack

### Core (already in project — no new dependencies)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18.x | Component state, effects, memo | Project baseline |
| react-konva | Current | Konva canvas layer rendering | All existing canvas work |
| Tailwind CSS | v4 (via @tailwindcss/vite) | HTML overlay styling | All existing overlay UI uses Tailwind |
| use-image | Current | Image loading (thumbnail + full) | Already used in `useFloorPlanImage` and `MapEditorCanvas` |

### No New Dependencies Required
All floor-switching functionality uses existing infrastructure:
- `useGraphData` — provides full `NavGraph` with `buildings[].floors[]`
- `useFloorPlanImage` — parameterize to accept `buildingId + floorNumber`
- `useMapViewport.fitToScreen` — reset viewport on floor switch
- `LandmarkLayer` / `RouteLayer` — accept filtered arrays from caller

---

## Architecture Patterns

### Active Floor State Shape

```typescript
// Inside FloorPlanCanvas.tsx — new state additions
const [activeBuildingId, setActiveBuildingId] = useState<number | 'campus' | null>(null)
const [activeFloorId, setActiveFloorId] = useState<number | null>(null)
```

Initialization: On first graph load, find first non-Campus building, sort its floors by `floorNumber`, select floor with `floorNumber === 1` (or the lowest floor if 1 doesn't exist).

### Derived State via useMemo (HIGH confidence — established project pattern)

```typescript
// All buildings from graph
const allBuildings = useMemo(() => {
  if (graphState.status !== 'loaded') return []
  return graphState.data.buildings
}, [graphState])

// Non-campus buildings for the building selector
const nonCampusBuildings = useMemo(() =>
  allBuildings.filter(b => b.name !== 'Campus'), [allBuildings])

// Campus building (may be undefined if no campus map uploaded)
const campusBuilding = useMemo(() =>
  allBuildings.find(b => b.name === 'Campus'), [allBuildings])

// Active building derived from activeBuildingId
const activeBuilding = useMemo(() => {
  if (activeBuildingId === 'campus') return campusBuilding
  return allBuildings.find(b => b.id === activeBuildingId) ?? null
}, [activeBuildingId, allBuildings, campusBuilding])

// Sorted floors for active building's floor tabs
const sortedActiveFloors = useMemo(() =>
  (activeBuilding?.floors ?? []).slice().sort((a, b) => a.floorNumber - b.floorNumber),
  [activeBuilding])

// The currently active NavFloor object
const activeFloor = useMemo(() =>
  sortedActiveFloors.find(f => f.id === activeFloorId) ?? null,
  [sortedActiveFloors, activeFloorId])

// Total floor count across all buildings (for show/hide tab strip decision)
const totalFloorCount = useMemo(() => {
  return allBuildings.reduce((sum, b) => sum + b.floors.length, 0)
}, [allBuildings])

// showTabStrip: hide when DirectionsSheet is open OR only one floor total
const showTabStrip = !sheetOpen && totalFloorCount > 1
```

### Node Filtering (LandmarkLayer nodes prop)

```typescript
// Connector types that may appear dimmed from adjacent floors
const CONNECTOR_TYPES: NavNodeType[] = ['stairs', 'elevator', 'ramp']
// Note: 'stairs' and 'ramp' are invisible to students normally,
// but the decision says connector nodes from adjacent floors appear dimmed.
// Only 'elevator' is currently in VISIBLE_NODE_TYPES.
// Resolution: for this phase, 'elevator' is the connector type visible to students;
// stairs/ramp remain hidden (infrastructure only per existing types.ts comment).

// Nodes to pass to LandmarkLayer: active floor nodes + dimmed connectors from adjacent floors
const filteredNodes = useMemo(() => {
  if (!activeFloor) return []
  const activeFloorNodes = allNodes.filter(n => n.floorId === activeFloor.id)
  // Connector nodes from adjacent floors (floors that share a connector with activeFloor)
  const adjacentFloorIds = new Set<number>()
  activeFloorNodes.forEach(n => {
    if (n.connectsToFloorAboveId) adjacentFloorIds.add(n.connectsToFloorAboveId)
    if (n.connectsToFloorBelowId) adjacentFloorIds.add(n.connectsToFloorBelowId)
  })
  const dimmedConnectors = allNodes.filter(n =>
    adjacentFloorIds.has(n.floorId) &&
    CONNECTOR_TYPES.includes(n.type) &&
    (n.connectsToFloorAboveId === activeFloor.id || n.connectsToFloorBelowId === activeFloor.id)
  )
  return [...activeFloorNodes, ...dimmedConnectors]
}, [activeFloor, allNodes])

// Which node IDs are dimmed (from non-active floor)
const dimmedNodeIds = useMemo(() => {
  if (!activeFloor) return new Set<string>()
  return new Set(filteredNodes.filter(n => n.floorId !== activeFloor.id).map(n => n.id))
}, [filteredNodes, activeFloor])
```

`LandmarkLayer` will need a `dimmedNodeIds?: Set<string>` prop, and `LandmarkMarker` will need an `isDimmed?: boolean` prop that reduces opacity (e.g., `opacity: 0.35`).

### Route Segment Filtering (RouteLayer points)

```typescript
// Only include nodeIds that belong to the active floor
const activeRoutePoints = useMemo(() => {
  if (!routeResult || !activeFloor) return []
  const result = activeMode === 'standard' ? routeResult.standard : routeResult.accessible
  if (!result.found) return []
  // Filter nodeIds to active floor only
  const floorNodeIds = result.nodeIds.filter(id => {
    const n = nodeMap.get(id)
    return n?.floorId === activeFloor.id
  })
  return buildRoutePoints(floorNodeIds)
}, [routeResult, activeMode, activeFloor, nodeMap, buildRoutePoints])
```

Note: Consecutive segments on the same floor will be connected by the existing `buildRoutePoints` function which just iterates nodeIds in order. This is correct — the points array for a floor will be the contiguous run(s) of nodes on that floor.

### useFloorPlanImage Parameterization

New signature:

```typescript
// Option A: Add optional param to existing hook
export function useFloorPlanImage(target?: { buildingId: number; floorNumber: number } | 'campus') {
  const url = target === 'campus'
    ? '/api/campus/image'
    : target
    ? `/api/floor-plan/${target.buildingId}/${target.floorNumber}`
    : '/api/floor-plan/image'  // legacy fallback (single-building v1.0)

  const [img, status] = useImage(url)
  return { image: status === 'loaded' ? img : undefined, isLoading: status === 'loading', isFailed: status === 'failed', isFullLoaded: status === 'loaded' }
}
```

The admin editor (`MapEditorCanvas.tsx`) already uses `useImage` directly with a URL state variable. The student canvas uses `useFloorPlanImage`. Simplest approach: parameterize `useFloorPlanImage` to build the URL from the active floor target. The thumbnail progressive-load pattern (thumb + full) can be preserved for the new URL scheme or simplified — the multi-floor images are served from `/api/floor-plan/:buildingId/:floorNumber` with no separate thumbnail endpoint.

**Decision (Claude's Discretion):** For multi-floor images, skip the progressive thumbnail pattern since those endpoints serve one image only (no `/thumbnail` variant). When no `target` is provided (legacy), keep the existing thumbnail + full behavior. When `target` is provided, load the single floor-plan URL directly with no thumb.

### Floor Tab Strip Component

New component: `FloorTabStrip.tsx` (HTML overlay, not Konva).

```tsx
// src/client/components/FloorTabStrip.tsx
interface FloorTabStripProps {
  buildings: NavBuilding[]           // non-campus buildings
  campusBuilding: NavBuilding | undefined
  activeBuildingId: number | 'campus' | null
  activeFloorId: number | null
  onBuildingSwitch: (id: number | 'campus') => void
  onFloorSwitch: (floor: NavFloor) => void
}
```

Layout: `position: fixed, bottom: 0` (or anchored to sit above sheets via CSS). A bottom strip with:
1. A building selector (dropdown `<select>` matching admin editor pattern — established in MapEditorCanvas)
2. Floor tab buttons (matching admin editor button pattern: `bg-blue-600 text-white` for active, `bg-gray-100` for inactive)

The strip is a sibling HTML element inside `FloorPlanCanvas`'s wrapper div, not inside the Konva Stage.

```
┌──────────────────────────────────┐
│  [Building: Main Bldg ▼]  [F1] [F2] [F3]  │  ← FloorTabStrip
└──────────────────────────────────┘
```

Sits above `LocationDetailSheet` (z-40) and `DirectionsSheet` (z-50) in the DOM. Needs to be hidden when `sheetOpen === true`. Bottom offset must account for safe-area-inset-bottom on mobile.

### Auto-switch to Start Floor on Route Compute

In `handleRouteTrigger` (already in FloorPlanCanvas):

```typescript
// After computing route, switch to start node's floor
if (standard.found || accessible.found) {
  // existing: setSheetOpen(true), setRouteVisible(true), setActiveMode('standard')
  // NEW: switch to start node's floor
  const startNode = routeSelection.start
  if (startNode) {
    const startFloorId = startNode.floorId
    const startFloor = floorMap.get(startFloorId)
    if (startFloor) {
      handleFloorSwitch(startFloor)
    }
  }
}
```

`handleFloorSwitch` (new internal helper in FloorPlanCanvas):

```typescript
const handleFloorSwitch = useCallback((floor: NavFloor) => {
  // Find which building this floor belongs to
  const building = allBuildings.find(b => b.floors.some(f => f.id === floor.id))
  if (building) setActiveBuildingId(building.id)
  setActiveFloorId(floor.id)
  fitToScreen(width, height, true)  // animated re-fit
}, [allBuildings, width, height, fitToScreen])
```

### Default State Initialization

```typescript
// After graphState transitions to 'loaded'
useEffect(() => {
  if (graphState.status !== 'loaded') return
  if (activeFloorId !== null) return  // already initialized
  const firstBuilding = graphState.data.buildings.find(b => b.name !== 'Campus')
  if (!firstBuilding) return
  const floor1 = firstBuilding.floors
    .slice()
    .sort((a, b) => a.floorNumber - b.floorNumber)[0]
  if (floor1) {
    setActiveBuildingId(firstBuilding.id)
    setActiveFloorId(floor1.id)
  }
}, [graphState])
```

### Anti-Patterns to Avoid
- **Putting floor state in a separate hook unnecessarily:** State belongs in `FloorPlanCanvas` where it controls render. No new hook needed beyond parameterizing `useFloorPlanImage`.
- **Filtering inside LandmarkLayer:** Caller (FloorPlanCanvas) filters, LandmarkLayer renders what it receives. Already the established pattern.
- **Using floorNumber as key instead of floorId:** Always use DB id (`floor.id`) as the primary key; `floorNumber` is for display only.
- **Forgetting to reset imageRect on floor switch:** When `useFloorPlanImage` URL changes, the new image will trigger `onImageRectChange` via `FloorPlanImage`'s effect. `imageRect` will momentarily be null/stale. Acceptable; `fitToScreen` is called after switch.
- **Showing tab strip before graph loads:** Guard with `graphState.status === 'loaded'`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image loading | Custom fetch + blob URL | `use-image` hook | Already used in admin editor; handles caching, status states |
| Floor plan image URL construction | Complex URL builder | Simple template literal in parameterized `useFloorPlanImage` | Route is `GET /api/floor-plan/:buildingId/:floorNumber` — already exists |
| Floor tab UI state | Separate hook | `useState` in FloorPlanCanvas | Not complex enough to extract; admin editor does this inline in MapEditorCanvas |
| Building selector UI | Custom dropdown | HTML `<select>` | Matches admin editor; zero deps; accessible |

---

## Common Pitfalls

### Pitfall 1: Campus Map Has floorNumber=0 Sentinel
**What goes wrong:** Treating campus like a normal floor (`floorNumber=0`) in sort/display logic causes "Floor 0" to appear.
**Why it happens:** Campus building uses `floorNumber=0` as sentinel (established in Phase 18).
**How to avoid:** When `activeBuildingId === 'campus'`, don't render floor tabs — the campus has exactly one "floor" (the overhead map), no tab strip needed. Image URL is `/api/campus/image` not `/api/floor-plan/...`.
**Warning signs:** "Floor 0" tab appearing in UI.

### Pitfall 2: Route Points for Disconnected Floor Segments
**What goes wrong:** Route `nodeIds` list for a cross-floor route has nodes interleaved across floors (F1 nodes, then F2 nodes, then back to F1 via campus). Filtering by floor may produce disconnected node runs that `buildRoutePoints` naively connects.
**Why it happens:** `nodeIds` is a flat list in path order; floor membership is derived from `nodeMap.get(id).floorId`.
**How to avoid:** When filtering by active floor, the `buildRoutePoints` function will only use IDs that belong to the active floor. If those IDs form two separate segments (e.g., entering and exiting a shared corridor), they will be drawn as one connected line — which is actually correct because the points are in path order and the intermediate nodes (connectors) are on the floor boundary. Typically a cross-floor path passes through F1 → connector → F2, so the F1 segment is contiguous.
**Warning signs:** Route line drawing through wrong parts of the floor plan. Validate with multi-floor seed data.

### Pitfall 3: useFloorPlanImage URL Changes Cause Stale imageRect
**What goes wrong:** After switching floors, `imageRect` briefly refers to the previous floor's geometry. If `fitToScreen` runs before the new image loads, it resets stage transform but `imageRect` is still null or old.
**Why it happens:** Image loading is async; `imageRect` is set by `FloorPlanImage.onImageRectChange` only after the image loads.
**How to avoid:** Call `fitToScreen` in a `useEffect` that watches the new image load (`isFullLoaded` state). Or reset `imageRect` to `null` on floor switch and let the normal load cycle re-trigger `fitToScreen`.
**Warning signs:** Floor plan image appearing at wrong scale/position after floor switch.

### Pitfall 4: Tab Strip Z-Index Conflicts
**What goes wrong:** Floor tab strip appears above DirectionsSheet (z-50) or LocationDetailSheet (z-40).
**Why it happens:** Adding fixed-position HTML elements without explicit z-index management.
**How to avoid:** Give `FloorTabStrip` `z-30` (below both sheets). When `sheetOpen` is true, set `display: none` on the strip (or return null from render).
**Warning signs:** Tab strip visible through DirectionsSheet.

### Pitfall 5: Single-Floor Campus Sees Tab Chrome
**What goes wrong:** Tab strip appears on single-floor campuses, breaking the "zero new chrome" promise.
**Why it happens:** Checking only active building's floor count instead of total floor count across all buildings.
**How to avoid:** `totalFloorCount = allBuildings.reduce((sum, b) => sum + b.floors.length, 0)`. Hide strip entirely when `totalFloorCount <= 1`.
**Warning signs:** Tab UI visible when only one building with one floor exists.

### Pitfall 6: Dimmed Connector Node on Tap Doesn't Find Correct Floor
**What goes wrong:** Tapping a dimmed elevator node (from floor 2 shown on floor 1's canvas) doesn't switch to floor 2.
**Why it happens:** The node's `floorId` is correct, but finding the `NavFloor` object requires looking up `floorMap` which maps `floorId → NavFloor`.
**How to avoid:** In the `handleLandmarkTap` handler, check if tapped node's `floorId !== activeFloor.id`. If so, look up the floor via `floorMap` and call `handleFloorSwitch`.
**Warning signs:** Tapping connector node opens detail sheet but doesn't switch floor.

---

## Code Examples

Verified patterns from project source:

### Existing building selector pattern (MapEditorCanvas.tsx lines 472-498)
```tsx
// Source: src/client/pages/admin/MapEditorCanvas.tsx
<select
  value={isCampusActive ? 'campus' : String(state.activeBuildingId)}
  onChange={(e) => handleBuildingSwitch(e.target.value)}
  className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
>
  <option value="campus">Campus</option>
  {nonCampusBuildings.map((b) => (
    <option key={b.id} value={String(b.id)}>{b.name}</option>
  ))}
</select>
{!isCampusActive && sortedFloors.map((floor) => (
  <button
    key={floor.id}
    type="button"
    onClick={() => handleFloorSwitch(floor)}
    className={`px-3 py-1 rounded text-sm font-medium ${
      state.activeFloorId === floor.id
        ? 'bg-blue-600 text-white'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`}
  >
    Floor {floor.floorNumber}
  </button>
))}
```

### Existing node filtering pattern (FloorPlanCanvas.tsx lines 70-73)
```typescript
// Source: src/client/components/FloorPlanCanvas.tsx
const nodes = useMemo(() => {
  if (graphState.status !== 'loaded') return []
  return graphState.data.buildings.flatMap((b) => b.floors.flatMap((f) => f.nodes))
}, [graphState])
```

### Existing useFloorPlanImage (src/client/hooks/useFloorPlanImage.ts)
```typescript
// Current implementation — hardcoded URL
import useImage from 'use-image'
export function useFloorPlanImage() {
  const [thumb, thumbStatus] = useImage('/api/floor-plan/thumbnail')
  const [full, fullStatus] = useImage('/api/floor-plan/image')
  // ...
}
```

### Existing floor plan image API
```
GET /api/floor-plan/:buildingId/:floorNumber
GET /api/campus/image
```
Both exist in `src/server/index.ts`. No server changes needed.

### LandmarkMarker opacity for dimmed state (add to existing component)
```tsx
// To add in LandmarkMarker.tsx
// opacity prop (0 = transparent, 1 = opaque)
// Konva Group supports opacity directly:
<Group x={pixelX} y={pixelY} scaleX={scale} scaleY={scale} opacity={isDimmed ? 0.35 : 1} onClick={onClick} onTap={onClick}>
```

### fitToScreen call pattern (useMapViewport.ts lines 295-326)
```typescript
// Source: src/client/hooks/useMapViewport.ts
// fitToScreen resets stage to identity (scale=1, pos=0, rotation=0)
// FloorPlanImage recalculates the fit internally via its onImageRectChange callback
fitToScreen(width, height, true)  // true = animated
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single-floor `useFloorPlanImage` with hardcoded URL | Parameterized with `buildingId + floorNumber` | Phase 19 | Enables multi-floor image switching |
| `nodes` flat array from all floors | `filteredNodes` from active floor + dimmed connectors | Phase 19 | Correct per-floor rendering |
| `activeRoutePoints` using all route nodeIds | Filtered to active floor nodeIds only | Phase 19 | Per-floor route segment display |

---

## Open Questions

1. **Dimmed connector opacity for stairs/ramp vs elevator**
   - What we know: `stairs` and `ramp` are "invisible to students" per `types.ts` and existing `VISIBLE_NODE_TYPES`
   - What's unclear: Should dimmed connectors from adjacent floors show stairs/ramp (currently hidden) or only elevators?
   - Recommendation: Only show elevator nodes dimmed (already in `VISIBLE_NODE_TYPES`). Stairs/ramp remain hidden from students as per v1.0 design decision. This simplifies filtering significantly — the dimmed connector set is just `elevator` nodes from adjacent floors.

2. **imageRect stale state on rapid floor switches**
   - What we know: `imageRect` is set asynchronously via `onImageRectChange` after image loads
   - What's unclear: Should `imageRect` be explicitly reset to `null` on floor switch to prevent stale geometry?
   - Recommendation: Reset `imageRect` to `null` when `setActiveFloorId` is called. This ensures `LandmarkLayer` and `RouteLayer` receive `imageRect === null` (and render nothing) while the new floor image loads.

3. **Route segment display when route doesn't pass through active floor**
   - What we know: This is Claude's Discretion per CONTEXT.md
   - Recommendation: Show no route line (empty `activeRoutePoints`) and optionally a subtle HTML overlay text "Route doesn't pass through this floor" positioned below the search overlay. Keep it subtle — gray text, not an error state.

---

## Validation Architecture

`workflow.nyquist_validation` is not explicitly set to false in `.planning/config.json` — the section is absent, so validation is treated as enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (via `vite.config.ts` — no separate vitest config; vitest detects test files automatically) |
| Config file | `vite.config.ts` (no dedicated vitest config) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### What to Test — Phase Requirements Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MFLR-05 | Route segment filtering: only nodeIds on active floor returned | unit | `npx vitest run src/shared/__tests__/ --reporter=verbose` | ✅ (add new test) |
| MFLR-06 | Floor switching updates active floor state | unit | `npx vitest run src/client/hooks/ --reporter=verbose` | ✅ (add new test) |
| MFLR-06 | Total floor count < 2 → tab strip hidden | unit | Test helper function | ❌ Wave 0 |
| CAMP-05 | Campus segment included in route when active floor is campus | unit | `npx vitest run src/shared/__tests__/` | ✅ (extend existing) |

### Key Integration Test Scenarios (Manual Verification)

These scenarios cannot be covered by unit tests and must be verified by human in the browser:

**Scenario A — Default floor on load:**
1. Open student app
2. Verify: Floor 1 of first building is active (floor tab highlighted, correct floor plan shown)
3. Verify: No tab strip visible if campus has only one floor per building (single-floor case)

**Scenario B — Manual floor switching:**
1. Open student app with multi-floor building loaded (floor 1 and floor 2 exist)
2. Tap "Floor 2" tab
3. Verify: Floor 2 image loads, landmarks for floor 2 visible
4. Verify: Floor 1 landmarks not visible
5. Verify: fitToScreen fires — floor plan re-centers in viewport

**Scenario C — Building selector:**
1. Open student app with multiple buildings
2. Use building selector dropdown to switch buildings
3. Verify: Floor tabs update to show new building's floors
4. Verify: First floor of new building becomes active
5. Verify: Correct floor plan image loads

**Scenario D — Route computed, auto-switches to start floor:**
1. Select start node on floor 2
2. Select destination on floor 3
3. Tap "Get Directions"
4. Verify: Active floor switches to floor 2 (start node's floor)
5. Verify: DirectionsSheet opens
6. Verify: Tab strip is hidden (sheetOpen=true)
7. Verify: Route line shows only the segment on floor 2

**Scenario E — Cross-floor route segment viewing:**
1. With route computed (F2→F3)
2. Manually tap "Floor 3" tab (outside directions sheet — wait, sheet is open so tabs are hidden)
3. Close sheet (Back button)
4. Tab strip reappears
5. Tap "Floor 3"
6. Verify: Route segment for floor 3 appears
7. Verify: Floor 3 landmarks visible

**Scenario F — Dimmed connector tap auto-switches floor:**
1. On floor 1 canvas, elevator node from floor 2 is visible dimmed
2. Tap the dimmed elevator node
3. Verify: Active floor switches to floor 2 (no manual tab tap needed)
4. Verify: Floor 2 image loads and fits to screen

**Scenario G — Single-floor campus sees no tab chrome:**
1. Load app with campus that has only one building with one floor
2. Verify: Floor tab strip is completely hidden
3. Verify: No building selector visible
4. Verify: App behaves exactly as v1.0 (zero new chrome)

### Unit Tests to Add

**New test file: `src/client/hooks/useFloorFiltering.test.ts`** (or inline in existing test files)

Test cases:
1. `filterNodesByActiveFloor` — nodes on active floor included, nodes on other floors excluded
2. `filterNodesByActiveFloor` — elevator nodes from adjacent floors included with dimmed=true
3. `filterNodesByActiveFloor` — stairs/ramp nodes from adjacent floors NOT included (remain hidden)
4. `filterRouteSegmentByFloor` — route nodeIds filtered to active floor only
5. `filterRouteSegmentByFloor` — empty array when no route nodes on active floor
6. `totalFloorCount` — returns 1 for single-floor campus (tab strip should hide)
7. `totalFloorCount` — returns N for multi-building campus

### Sampling Rate
- **Per task commit:** `npx vitest run src/client/hooks/ src/shared/__tests__/ --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/client/hooks/useFloorFiltering.test.ts` — pure function unit tests for floor filtering logic (extract filtering functions from FloorPlanCanvas for testability)
- [ ] No framework install needed — Vitest already configured

*(No gaps in framework; only new test files needed for new pure functions)*

---

## Sources

### Primary (HIGH confidence)
- Direct codebase read — `src/client/components/FloorPlanCanvas.tsx` (current student canvas state/structure)
- Direct codebase read — `src/client/pages/admin/MapEditorCanvas.tsx` (building selector + floor tab pattern to replicate)
- Direct codebase read — `src/client/hooks/useFloorPlanImage.ts` (current hook to parameterize)
- Direct codebase read — `src/client/components/LandmarkLayer.tsx` (nodes prop filtering pattern)
- Direct codebase read — `src/client/components/RouteLayer.tsx` (points prop filtering pattern)
- Direct codebase read — `src/client/hooks/useMapViewport.ts` (fitToScreen API)
- Direct codebase read — `src/server/index.ts` (API routes `/api/floor-plan/:buildingId/:floorNumber`, `/api/campus/image`)
- Direct codebase read — `src/shared/types.ts` (NavFloor, NavBuilding, NavGraph, NavNodeData connector fields)
- Direct codebase read — `.planning/phases/19-student-floor-tab-ui/19-CONTEXT.md` (locked decisions)

### Secondary (MEDIUM confidence)
- `.planning/REQUIREMENTS.md` — MFLR-05, MFLR-06, CAMP-05 requirement definitions
- `.planning/STATE.md` — accumulated decisions from Phases 16-18 (floorNumber=0 campus sentinel, connector node patterns, useFloorPlanImage provenance)

### Tertiary (LOW confidence)
- None — all findings verified against live codebase

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new deps, all existing libraries confirmed in package.json and codebase
- Architecture: HIGH — patterns confirmed by reading MapEditorCanvas.tsx (direct precedent) and FloorPlanCanvas.tsx (modification target)
- API surface: HIGH — server routes read directly from src/server/index.ts; `/api/floor-plan/:buildingId/:floorNumber` confirmed present
- Pitfalls: HIGH — derived from understanding of async image loading, z-index layout, and existing code patterns; campus sentinel confirmed in STATE.md
- Validation architecture: MEDIUM — Vitest confirmed in package.json; test file locations confirmed; integration scenarios derived from requirements

**Research date:** 2026-03-07
**Valid until:** 2026-04-07 (stable codebase, no external deps to track)
