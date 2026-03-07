# Phase 19: Student Floor Tab UI - Context

**Gathered:** 2026-03-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Add floor and building navigation UI to the student-facing map view. Students can switch between buildings and floors; the canvas displays the correct floor plan image and landmarks for the active floor. Cross-floor route segments are shown only for the active floor. Campus tab included alongside buildings. Admin editor and pathfinding engine are complete — this phase wires the UI layer only.

</domain>

<decisions>
## Implementation Decisions

### Floor tab layout
- Floor tabs appear as a **bottom strip anchored above the sheets** (DirectionsSheet / LocationDetailSheet)
- A **building selector sits above the floor tab row** (same hierarchy as the admin editor) — switching buildings updates the floor tabs below
- **Campus tab appears** alongside building tabs at the top level of the building selector (if campus map image/nodes exist)
- Tab strip is **hidden when the DirectionsSheet is open** — reduces bottom chrome crowding; tab strip reappears when the sheet closes
- Tab strip is **hidden entirely when only one floor exists** across all buildings — single-floor campuses see no new chrome (preserves v1.0 experience)

### Active floor filtering
- Active floor canvas shows: **all nodes on the active floor at full opacity + connector nodes (stairs, elevators, ramps) from adjacent floors dimmed** — lets students locate connectors without visual clutter from unrelated floors
- Tapping a dimmed connector node (or any node on a non-active floor) **auto-switches the active floor** to that node's floor — seamless, no manual tab tap required
- Switching floors **re-fits the floor plan image to screen** (fitToScreen) and loads the new floor's plan image

### Cross-floor route display
- RouteLayer renders **only the route segment that falls on the currently active floor** — other floor segments are not shown
- **No auto-switching floors while following directions** — directions panel already includes a "Take stairs/elevator to Floor N" step; student reads it, switches tabs manually, sees the next segment
- Route visibility on floors the route doesn't pass through: **Claude's Discretion** (e.g. empty canvas or subtle no-route indicator)

### Default state on load
- On app open: **Floor 1 of the first building** returned by the API is the default active floor
- When a route is computed (Get Directions): **auto-switch active floor to the start pin's floor** — student immediately sees where their journey begins

### Claude's Discretion
- Whether to show a subtle indicator on floors the route doesn't pass through ("Route doesn't pass through this floor")
- Exact visual styling of dimmed connector node markers vs. active floor markers
- How the building selector is rendered (dropdown vs. button group) in the bottom strip
- useFloorPlanImage parameterization strategy (new hook or parameter added to existing)
- How `imageRect` and zoom state are reset vs. preserved on floor switch

</decisions>

<specifics>
## Specific Ideas

- "The floor tab row mirrors what students will see in Phase 19" — admin editor already established the spatial metaphor; student tabs should feel familiar and consistent
- Single-floor campuses must see zero new chrome — hide all tab UI when there's only one floor total

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `FloorPlanCanvas.tsx` — main student canvas; needs active floor state, filtered node list, parameterized image loading, and route segment filtering wired in
- `useFloorPlanImage` (`src/client/hooks/useFloorPlanImage.ts`) — currently hardcoded to `/api/floor-plan/thumbnail` and `/api/floor-plan/image`; must be parameterized to accept `buildingId + floorNumber`
- `useGraphData` — already loads full `NavGraph` with `buildings[].floors[]`; no API change needed, all floor data is client-side
- `LandmarkLayer` — receives `nodes[]` prop; caller filters by floor before passing in
- `RouteLayer` — receives `points[]` prop; caller filters route segment by active floor before computing points
- `useMapViewport` → `fitToScreen` — already available for re-fitting on floor switch
- `NavNode.floorId`, `NavFloor.id`, `NavFloor.floorNumber`, `NavFloor.imagePath` — all present in shared types, no schema changes needed
- `PathResult.nodeIds[]` — flat list; floor context derived by `nodeMap.get(id).floorId` (established in Phase 17)

### Established Patterns
- `useGraphData` graph loading with retry and `{ status: 'loading' | 'loaded' | 'error' }` shape
- Normalized coordinates (0.0–1.0) for node positions — consistent across all floors
- Tailwind CSS for all UI styling
- `useMemo` for derived state from graph data (nodes, nodeMap, floorMap)
- Konva `Stage` + `Layer` pattern; floor plan image swap triggers re-render of image layer

### Integration Points
- `FloorPlanCanvas.tsx` — add active building/floor state; derive `activeFloor: NavFloor` and filter nodes/route points accordingly
- `StudentApp.tsx` — currently just `<FloorPlanCanvas />`, may need floor tab strip rendered as a sibling HTML element
- `useFloorPlanImage` — parameterize; new signature accepts `{ buildingId: number, floorNumber: number } | null`
- Server `GET /api/floor-plan/:buildingId/:floorNumber` — already exists from Phase 18 work (admin editor uses it)
- `LandmarkLayer` nodes prop: filter by `node.floorId === activeFloor.id` before passing in (plus dimmed connectors from adjacent floors)
- `RouteLayer` points: build only from `nodeIds` where `node.floorId === activeFloor.id`

</code_context>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 19-student-floor-tab-ui*
*Context gathered: 2026-03-07*
