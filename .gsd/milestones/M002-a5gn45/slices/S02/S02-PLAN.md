# S02: Visitor trip setup parity (student scope only)

**Goal:** Mobile visitor can choose start/destination in-app and preview a floor-aware route session (standard + accessible mode) without logging in.
**Demo:** After this: After this: visitor can choose start/destination in app and preview route session context (outdoor + floor-aware) without logging in.

## Tasks
- [x] **T01: Implemented custom A* pathfinding engine and direction generation for mobile without ngraph.graph dependency** — ## Task T01 — Pathfinding Engine + Direction Generation

### Why
Trip setup requires computing a route from start to destination. The web codebase uses `ngraph.graph` — an unverified dependency for React Native. Instead of gambling on compatibility, T01 implements a custom A* pathfinding engine directly from `NormalizedNavGraph` (already built by S01). It also ports the direction generation algorithm from the web codebase with corrected relative imports. Together these form the routing computation core that all downstream UI depends on.

### Files
**Created:**
- `mobile/routing/pathfindingEngine.ts` — Custom A* on NormalizedNavGraph
- `mobile/routing/pathfindingEngine.test.ts` — Route found, no route, accessible mode, same-node, inter-floor
- `mobile/routing/generateDirections.ts` — Direction step generation (pure, no React)
- `mobile/routing/generateDirections.test.ts` — Step count, floor-change, accessible, arrive
- `mobile/routing/directionSections.ts` — `groupDirectionSections` for floor grouping
- `mobile/routing/directionSections.test.ts` — Section boundary, empty, single floor

**Modified:**
- `mobile/domain/navGraph.ts` — Append `DirectionStep`, `DirectionsResult`, `StepIcon` types alongside existing `PathResult`/`PathSegment`/`RouteMode`

### Do
1. **Read existing types in `mobile/domain/navGraph.ts`** to understand where `PathResult`, `PathSegment`, `RouteMode` are already defined. Append `DirectionStep`, `DirectionsResult`, `StepIcon` types there.

2. **Implement `mobile/routing/pathfindingEngine.ts`**:
   - Import `NormalizedNavGraph`, `NormalizedNodeRecord`, `NormalizedEdgeRecord` from `../domain/navGraph`
   - Import `NavNode`, `NavEdge` from `../../src/shared/types`
   - Import `RouteMode`, `PathResult`, `PathSegment` from `../domain/navGraph`
   - Export `MobilePathfindingEngine` class with constructor accepting `NormalizedNavGraph`
   - Implement `findRoute(fromId, toId, mode): PathResult` using A*:
     - **Standard mode**: iterate `graph.outgoingEdgesByNodeId[fromId]` and filter accessible edges for accessible mode
     - **Inter-floor traversal**: for stairs/elevator/ramp nodes, follow `connectsToNodeAboveId`/`connectsToNodeBelowId` to find the connected node on adjacent floor; treat it as an outgoing edge with weight 0.3 (standard) / 0.45 (elevator+ramp accessible) / Infinity (stairs accessible)
     - **A***: min-heap priority queue keyed on `fScore = gScore + heuristic`; Euclidean distance heuristic weighted by floor level difference
     - **Not-found**: return `{ found: false, nodeIds: [], totalDistance: 0, segments: [] }`
     - **Trivial same-node**: return `{ found: true, nodeIds: [fromId], totalDistance: 0, segments: [] }`
     - **Node-not-found guard**: check `graph.nodeById.has(fromId)` and `graph.nodeById.has(toId)` before pathfinding
     - **Heuristic**: use `Math.sqrt((ax-bx)² + (ay-by)²)` + `Math.abs(floorLevelDiff) * 0.5` floor-level penalty (admissible)
   - Use a `PriorityQueue` class defined in-file (binary heap with `push(item, priority)` and `pop()`)

3. **Write `mobile/routing/pathfindingEngine.test.ts`**:
   - Create a `createTestNavGraph()` helper with 2 buildings × 2 floors × 3 rooms each, connected by stairs/elevator
   - Test cases: route found between rooms on same floor, route found across floors (stairs), accessible route avoids stairs, no route (disconnected subgraph), same-node returns trivial path, missing source/target node returns not-found

4. **Implement `mobile/routing/generateDirections.ts`**:
   - Copy `generateDirections` from `src/client/hooks/useRouteDirections.ts` but:
     - Replace `@shared/types` import with relative `../../src/shared/types`
     - Replace `@shared/pathfinding/types` import with relative `../domain/navGraph`
     - Import `DirectionsResult`, `DirectionStep`, `StepIcon` from `../domain/navGraph`
     - Import `NavNode`, `NavFloor` from `../../src/shared/types`
   - Copy `routesAreIdentical` from web source
   - Export `generateDirections`, `routesAreIdentical`

5. **Write `mobile/routing/generateDirections.test.ts`**:
   - Use `createTestNavGraph()` helper nodes
   - Test: 0/1 node → empty steps; 2 nodes → arrive step only; 3+ nodes → turn + arrive; floor change → stairs-up icon + correct instruction; accessible mode → ramp/elevator icons

6. **Implement `mobile/routing/directionSections.ts`**:
   - Copy `DirectionSection` type and `groupDirectionSections` from `src/client/components/directionSections.ts`
   - Import `DirectionStep` from `../domain/navGraph`

7. **Write `mobile/routing/directionSections.test.ts`**:
   - Test: single floor → one section; floor change creates new section; boundary detection

8. **Verify**: `npm --prefix mobile run test -- mobile/routing/` → all pass. `npm --prefix mobile run typecheck` → 0 errors.
  - Estimate: 2–3 hours
  - Files: mobile/routing/pathfindingEngine.ts, mobile/routing/pathfindingEngine.test.ts, mobile/routing/generateDirections.ts, mobile/routing/generateDirections.test.ts, mobile/routing/directionSections.ts, mobile/routing/directionSections.test.ts, mobile/domain/navGraph.ts (append types)
  - Verify: npm --prefix mobile run test -- mobile/routing/ && npm --prefix mobile run typecheck
- [x] **T02: Implemented route session state machine + useRouteSession hook** — ## Task T02 — Route Session State Machine + useRouteSession Hook

### Why
The routing computation is only part of the trip setup loop. T02 wires together: route selection state (start/destination), route computation (T01 engine), direction generation (T01), and reactive floor-context updates. It produces a self-contained `useRouteSession` hook that App.tsx can drop in without knowing the implementation details.

### Files
**Created:**
- `mobile/routing/routeSessionState.ts` — State machine types and constants
- `mobile/routing/useRouteSession.ts` — Main hook consuming all routing pieces
- `mobile/routing/useRouteSession.test.ts` — State transitions, error states, mode switching
- `mobile/hooks/useRouteSelection.ts` — Port of web `useRouteSelection` hook (pure React)
- `mobile/hooks/useRouteSelection.test.ts` — Field advancement, swap, clear, tap assignment

**Modified:**
- `mobile/domain/navGraph.ts` (no change — imports from there)

### Do
1. **Implement `mobile/routing/routeSessionState.ts`**:
   - Define `RouteSessionPhase = 'idle' | 'computing' | 'ready' | 'no-route' | 'error'`
   - Define `RouteSessionState` discriminated union carrying: phase, start/destination `NavNode | null`, `RouteMode`, `PathResult | null`, `DirectionsResult | null`, error message
   - Define `RouteSessionOptions = { graph: NormalizedNavGraph; mode: RouteMode; start: NavNode | null; destination: NavNode | null }`
   - Export pure `computeRouteSession(options): RouteSessionState` function that runs synchronously (A* is fast)
   - On `start === null || destination === null`: return `idle` state
   - On route found: return `ready` with PathResult + DirectionsResult
   - On route not found: return `no-route`
   - On node not in graph: return `error`

2. **Implement `mobile/routing/useRouteSession.ts`**:
   - Accept props: `{ graph: NormalizedNavGraph; selection: RouteSelection }` where `RouteSelection` is from `../hooks/useRouteSelection`
   - Use `useMemo` to run `computeRouteSession` whenever `graph`, `selection.start`, `selection.destination` change
   - Track `routeMode` state separately (`'standard' | 'accessible'`) — expose `setRouteMode`
   - Expose: `{ sessionState, routeMode, setRouteMode }`

3. **Write `mobile/routing/useRouteSession.test.ts`**:
   - Mock `NormalizedNavGraph` with `createTestNavGraph()` from T01
   - Test: idle when no selection, computing→ready on both-selected, no-route when unreachable, accessible mode filtering

4. **Port `mobile/hooks/useRouteSelection.ts`**:
   - Copy `src/client/hooks/useRouteSelection.ts` verbatim but:
     - Replace `@shared/types` import with relative `../../src/shared/types`
     - Add `RouteSelection` to the interface (inline the type since this is a small hook)
   - The hook is pure React — no external mobile dependencies needed

5. **Write `mobile/hooks/useRouteSelection.test.ts`**:
   - Use `@testing-library/react-hooks` or Vitest's `fn()` mocking
   - Test: `setFromTap` advances activeField, swap exchanges start/destination, clearAll resets state, tapping same field skips duplicate

6. **Verify**: `npm --prefix mobile run test -- mobile/routing/routeSessionState.test.ts mobile/routing/useRouteSession.test.ts mobile/hooks/useRouteSelection.test.ts` → all pass. `npm --prefix mobile run typecheck` → 0 errors.
  - Estimate: 1–2 hours
  - Files: mobile/routing/routeSessionState.ts, mobile/routing/useRouteSession.ts, mobile/routing/useRouteSession.test.ts, mobile/hooks/useRouteSelection.ts, mobile/hooks/useRouteSelection.test.ts
  - Verify: npm --prefix mobile run test -- mobile/routing/routeSessionState.test.ts mobile/routing/useRouteSession.test.ts mobile/hooks/useRouteSelection.test.ts && npm --prefix mobile run typecheck
- [x] **T03: Implemented useLocationSearch hook and DestinationPicker for mobile visitor location selection** — ## Task T03 — Destination Picker UI with Building/Floor/Node Search

### Why
The visitor needs a way to select start and destination. T03 builds the search UI and the `useLocationSearch` hook that filters the normalized graph in-memory. The picker uses a building→floor→node accordion/tree structure with a fuzzy text input, mirroring the web CampusNav destination experience without re-inventing the UX.

### Files
**Created:**
- `mobile/hooks/useLocationSearch.ts` — In-memory search over NormalizedNavGraph
- `mobile/hooks/useLocationSearch.test.ts` — Prefix match, empty query, type filter, result count
- `mobile/components/destination/DestinationPicker.tsx` — Building/floor/node accordion with search bar
- `mobile/components/destination/DestinationPicker.test.tsx` — Render, search debounce, node selection, accessible mode display

### Do
1. **Implement `mobile/hooks/useLocationSearch.ts`**:
   - Accept `{ graph: NormalizedNavGraph; query: string; typeFilter?: Set<NavNodeType> }`
   - Return `{ buildings: SearchBuilding[] }` where each `SearchBuilding` has `floors: SearchFloor[]` with `nodes: SearchNode[]`
   - Search algorithm: case-insensitive prefix match on `label` OR `roomNumber` OR `description` OR `buildingName`; only include buildings/floors that have at least one matching node
   - Sort: buildings by name, floors by floorNumber ascending, nodes by label
   - Filter by `typeFilter` if provided (useful for restricting to entrances, rooms, etc.)
   - Export `SearchBuilding`, `SearchFloor`, `SearchNode` types
   - For performance: build the search index lazily in `useMemo` keyed on `graph`

2. **Write `mobile/hooks/useLocationSearch.test.ts`**:
   - Create a mock `NormalizedNavGraph` with 2 buildings, 3 floors each, ~5 nodes per floor
   - Test: empty query returns all searchable nodes; prefix "Lib" matches "Library"; prefix "201" matches room "201"; type filter excludes stairs; empty result for nonsense query

3. **Implement `mobile/components/destination/DestinationPicker.tsx`**:
   - Props: `{ graph: NormalizedNavGraph; selection: RouteSelection; onNodeSelect: (node: NavNode) => void }`
   - Layout: `TextInput` for search at top; `FlatList` of `SearchBuilding` results below
   - Each building item is an accordion/expandable section showing building name + floor count + chevron
   - Expanded building shows floors with floor number header; each floor shows its searchable nodes
   - Node row: label + room number + type badge + accessible icon (for elevator/ramp nodes)
   - Active field indicator ("Set Start" / "Set Destination") shown in header; switch button to toggle
   - Use `useLocationSearch` internally with debounced search input (300ms `useEffect` + state)
   - Pressing a node calls `onNodeSelect(node)`
   - Render with `StyleSheet` (dark theme matching existing App.tsx palette: bg #020617, text #f8fafc)

4. **Write `mobile/components/destination/DestinationPicker.test.tsx`**:
   - Use `@testing-library/react-native` or Vitest with React Native mock
   - Test: renders search input; renders building items; search filters results; node press calls `onNodeSelect` with correct node

5. **Verify**: `npm --prefix mobile run test -- mobile/hooks/useLocationSearch.test.ts mobile/components/destination/DestinationPicker.test.tsx` → all pass. `npm --prefix mobile run typecheck` → 0 errors.
  - Estimate: 1–2 hours
  - Files: mobile/hooks/useLocationSearch.ts, mobile/hooks/useLocationSearch.test.ts, mobile/components/destination/DestinationPicker.tsx, mobile/components/destination/DestinationPicker.test.tsx
  - Verify: npm --prefix mobile run test -- mobile/hooks/useLocationSearch.test.ts mobile/components/destination/DestinationPicker.test.tsx && npm --prefix mobile run typecheck
- [ ] **T04: Route preview + floor switching + route path overlay + app wiring** — ## Task T04 — Route Preview + Floor Switching + Route Path Overlay + App Wiring

### Why
T04 is the final integration wave: it connects the route session (T02) and destination picker (T03) into a composable App, adds a step-by-step route preview, extends MapViewport to switch floor images, renders the route polyline as a View-based overlay, and exposes the accessible mode toggle.

### Files
**Created:**
- `mobile/components/route/RoutePreview.tsx` — Step-by-step directions grouped by floor
- `mobile/components/route/RoutePathOverlay.tsx` — Polyline overlay using View components
- `mobile/map/MapViewportFloor.tsx` — Floor-switching extension of MapViewport
- `mobile/map/MapViewportFloor.test.tsx` — Floor switching and overlay tests

**Modified:**
- `mobile/map/MapViewport.tsx` — Re-exported as-is; floor switching lives in `MapViewportFloor.tsx`
- `mobile/App.tsx` — Composed with DestinationPicker, RoutePreview, MapViewportFloor, accessible mode toggle

### Do
1. **Implement `mobile/components/route/RoutePreview.tsx`**:
   - Props: `{ directions: DirectionsResult; floorMap: Map<number, NavFloor>; onFloorChange: (floorId: number) => void }`
   - Import `groupDirectionSections` from `../../routing/directionSections`
   - Import `DirectionSection`, `DirectionStep` from `../../domain/navGraph`
   - Group steps with `groupDirectionSections(directions.steps)`
   - Render each section with floor header ("Floor 1", "Floor 2") and a `FlatList` of step rows
   - Each step row: icon (rendered as emoji or colored View), instruction text, distance + ETA
   - Accessible mode steps: show elevator/ramp icon distinctly
   - Total summary footer: total distance + estimated walking time
   - Dark theme matching app palette

2. **Implement `mobile/components/route/RoutePathOverlay.tsx`**:
   - Props: `{ path: Array<{x: number; y: number; floorId: number}>; activeFloorId: number; viewport: ViewportDimensions; scale: number; }`
   - Filter `path` to nodes on `activeFloorId`
   - Render a `View` overlay with `Position: 'absolute'` containing two dots per segment:
     - Each dot: `width: 8, height: 8, borderRadius: 4, backgroundColor: '#38bdf8'`
     - Positioned using `{ left: node.x * viewport.width * scale - 4, top: node.y * viewport.height * scale - 4 }`
     - Connect with a `View` line: `width: Math.sqrt(dx²+dy²) * scale, height: 2, backgroundColor: '#38bdf8'`
     - Rotate line to match bearing using transform
   - This is a View-based polyline (Option A from S02 research — no new SVG dependency)
   - If polyline rendering proves too complex for View transforms: just render colored dots at each node position

3. **Implement `mobile/map/MapViewportFloor.tsx`**:
   - Props: `{ imageUri: string; floorTargets: FloorPlanTarget[]; activeFloorTarget: FloorPlanTarget | null; routePath: RoutePathPoint[]; onFloorChange: (target: FloorPlanTarget) => void; onTransformChange: (t: MapTransform) => void }`
   - Composition: `MapViewport` (from existing `MapViewport.tsx`) + floor selector strip + `RoutePathOverlay`
   - Floor selector: horizontal `ScrollView` of floor buttons below the controls row
     - Each button: "Bldg {name} Fl {num}" — active floor button has accent color (#38bdf8 bg)
     - On press: calls `onFloorChange(target)`
   - Pass `routePath` filtered to `activeFloorTarget` into `RoutePathOverlay`
   - The inner `MapViewport` gets the image URI from the active floor target via `getFloorPlanImageUrl` from `mapApiClient`

4. **Modify `mobile/App.tsx`**:
   - Import `RouteSessionProvider` logic (inline in component — no context needed for this scale)
   - Add state: `accessibleMode: boolean`
   - After bootstrap `ready` state:
     - `const selection = useRouteSelection()` from `hooks/useRouteSelection`
     - `const { sessionState, routeMode, setRouteMode } = useRouteSession({ graph: bootstrapState.graph, selection })`
     - Show `DestinationPicker` with `graph` and `selection`
     - Show `MapViewportFloor` with `activeFloorTarget`, `routePath` from session
     - Show `RoutePreview` when `sessionState.phase === 'ready'`
     - Accessible mode toggle: `Pressable` switch updating `accessibleMode` → `setRouteMode`
     - Show `no-route` / `error` state messages inline
   - The existing diagnostic panel (API endpoint, building count) stays as-is

5. **Write `mobile/map/MapViewportFloor.test.tsx`**:
   - Mock `MapViewport`, test floor button rendering and `onFloorChange` callback
   - Test: clicking floor button triggers correct callback

6. **Verify**: `npm --prefix mobile run typecheck` → 0 errors. The full App composition is validated by successful typecheck and existing S01 app-shell tests.

7. **Wire up the floor image URL resolution**: In App.tsx, when `activeFloorTarget` changes, call `mapApiClient.getFloorPlanImageUrl(target)` and update the image URI fed to `MapViewportFloor`. Import `createMapApiClient` from `data/mapApiClient` and `validateApiBaseUrl` from `bootstrap/appBootstrap`.
  - Estimate: 2–3 hours
  - Files: mobile/components/route/RoutePreview.tsx, mobile/components/route/RoutePathOverlay.tsx, mobile/map/MapViewportFloor.tsx, mobile/map/MapViewportFloor.test.tsx, mobile/App.tsx (modify)
  - Verify: npm --prefix mobile run typecheck && npm --prefix mobile run test -- mobile/map/MapViewportFloor.test.tsx
