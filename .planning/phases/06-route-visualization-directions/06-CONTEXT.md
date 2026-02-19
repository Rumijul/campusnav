# Phase 6: Route Visualization & Directions - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Draw computed routes on the map canvas and display step-by-step walking directions with time estimates. The pathfinding engine (Phase 3) and route selection state (Phase 5, `routeResult` stored but not consumed) are already in place — this phase makes routes visible and readable to the student. Editing the graph, persisting routes, or any admin functionality are out of scope.

</domain>

<decisions>
## Implementation Decisions

### Route Path Rendering
- Toggle mode: only one route (standard OR accessible) is drawn on the canvas at a time
- Default route shown first: standard route
- Color scheme: blue for standard route, green for accessible route
- Line style: animated dashes moving along the path (conveys direction of travel)
- A legend must explain which color is which

### Directions Panel
- A new bottom sheet replaces the compact strip (A/B selection strip) once routes are computed
- Default state: peeked (partial height), user can drag up to full screen
- Route toggle lives inside the sheet as tabs in the sheet header — Standard tab / Accessible tab; switching tab updates both the sheet content and the active map route simultaneously
- Dismissal: back arrow returns user to the compact strip (A/B pin selection state)
- On open: map auto-fits to show the full active route, then user is free to pan freely

### Step Format & Content
- Steps are landmark-based turns: e.g., "Turn left at the cafeteria"
- Time estimate shown per step (each step has a small duration alongside the instruction)
- Walking speed assumption: Claude's discretion (mode-appropriate speeds are acceptable — slower for accessible route)
- Each step has a directional icon (arrow for turn, straight arrow for forward, accessibility symbol for ramp/accessible segments)

### Same-Route & Missing-Route Edge Cases
- Standard and accessible routes are **identical**: merge into a single tab with a combined label (e.g., "Standard (accessible)") — no duplicate steps
- Accessible route **doesn't exist** (no wheelchair path): Accessible tab is shown but disabled/grayed out with a tooltip: "No accessible route available"
- **Neither route exists** (A and B disconnected): sheet shows a "No route found" message, map clears the route overlay, user can change their selection

### Claude's Discretion
- Exact walking speed values for time calculation (mode-appropriate is acceptable)
- Sheet drag snap points (peek height, half, full)
- Exact animated dash parameters (speed, gap size, stroke width)
- Legend placement on the canvas
- Empty/loading state while pathfinding runs (if any)

</decisions>

<specifics>
## Specific Ideas

- The animated dashes on the route line should convey direction of travel (moving toward the destination)
- The back arrow from the directions sheet returns to the compact strip — the user can reselect A or B without starting over
- The Standard/Accessible tab switch should update both the drawn route on canvas AND the step list simultaneously

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 06-route-visualization-directions*
*Context gathered: 2026-02-19*
