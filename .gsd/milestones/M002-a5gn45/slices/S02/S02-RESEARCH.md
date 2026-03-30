# S02 Research: Visitor Trip Setup Parity (Student Scope Only)

## Slice Purpose

S02 ports the student-facing trip setup loop into the mobile app: visitor can choose start/destination and preview a route session without logging in. This covers destination search/pick, route computation, route preview (polyline + steps), floor context switching, and accessible mode toggle.

**Primary owning requirement: R025** — "App can load map graph data, choose start/destination, and render route + steps across existing campus/building/floor model."

**Supporting requirements:** R024 (no-login), R031 (accessible parity), R030 (floor context), R034 (admin stays web).

## What Exists

### S01 Deliverables (consumed by S02)

| File | Role |
|---|---|
| `mobile/domain/navGraph.ts` | `NormalizedNavGraph` with `nodeById: Map<string, NormalizedNodeRecord>`, `buildingById`, `floorById`, `outgoingEdgesByNodeId`. Bootstrap ready state exposes `graph: NormalizedNavGraph`. |
| `mobile/domain/navGraphSchema.ts` | Zod contract validation for map payloads. |
| `mobile/bootstrap/mapBootstrapState.ts` | `runMapBootstrap()` → `ready` state carries `graph: NormalizedNavGraph`. |
| `mobile/map/MapViewport.tsx` | Gesture-capable map viewport; exposes `onTransformChange`. Currently renders a single floor plan `Image`. |
| `mobile/App.tsx` | Bootstrap shell; when `phase === 'ready'` it receives `bootstrapState.graph` and `bootstrapState.image`. |

### Web Codebase (to port/mirror)

| File | Role |
|---|---|
| `src/shared/pathfinding/engine.ts` | `PathfindingEngine` class wrapping `ngraph.path`. `findRoute(fromId, toId, mode)` returns `PathResult`. |
| `src/shared/pathfinding/graph-builder.ts` | `buildGraph(navGraph)` builds an `ngraph.graph` from `NavGraph`. Also exports `flattenNavGraph` and `calculateWeight`. |
| `src/shared/pathfinding/types.ts` | `PathResult`, `PathSegment`, `RouteMode = 'standard' \| 'accessible'`. |
| `src/client/hooks/useRouteSelection.ts` | `useRouteSelection()` — manages `start`/`destination`/`activeField`/`bothSelected`, `setFromTap`, `swap`, `clearAll`. Fully self-contained. |
| `src/client/hooks/useRouteDirections.ts` | `generateDirections(nodeIds, nodeMap, mode, floorMap)` → `DirectionsResult` with `DirectionStep[]`. Pure function; no React deps. Also exports `routesAreIdentical`. |
| `src/client/components/directionSections.ts` | Groups `DirectionStep[]` by floor for multi-floor display. |

### Shared Types (`src/shared/types.ts`)

- `NavNode` (with `id`, `x`, `y`, `label`, `type`, `searchable`, `floorId`, `roomNumber`, `description`, `accessibilityNotes`, `connectsToFloorAboveId`, `connectsToFloorBelowId`, `connectsToNodeAboveId`, `connectsToNodeBelowId`, `connectsToBuildingId`)
- `NavEdge`, `NavFloor`, `NavBuilding`, `NavGraph`
- `NavFloorGpsBounds`

## Critical Unknowns and Risks

### CRITICAL: ngraph.graph compatibility with React Native

`src/shared/pathfinding/engine.ts` and `graph-builder.ts` both import from `ngraph.graph`. This is a pure JS library with no Node.js-specific APIs (no `process`, no `fs`, no `path`). However:

- **Not verified in mobile runtime.** Needs a test or explicit check.
- **Alternative if broken:** Re-implement A* pathfinding in a single mobile-specific file using a priority queue (binary heap). Web `PathfindingEngine` has `findRoute(fromId, toId, mode)` interface — a mobile equivalent must match.
- **Scope risk if re-implementation needed:** This would be the most time-consuming part of S02. Path to mitigate: write a minimal A* with a binary heap first, or use a proven RN-compatible pathfinding library.

### Map floor overlay rendering (route polylines)

S01 `MapViewport.tsx` renders a single floor plan `Image` with gesture transforms. S02 needs to:
1. Render a polyline/path overlay on top of the floor plan.
2. Switch the rendered image when the active guidance floor changes.

**Approach options:**
- **Option A (simpler):** Render path as a `View`-based overlay using absolute positioning with normalized coordinates transformed to pixel coordinates. Works for single-floor routes.
- **Option B (more complex):** Use `react-native-svg` to draw polylines on the map. Requires adding a new native dependency.
- **Recommendation:** Start with Option A; `react-native-svg` can be deferred unless polylines prove insufficient for the UX bar.

### Floor-aware context (outdoor + indoor)

The `NormalizedNavGraph` from S01 has `floorByBuildingAndNumber` lookup. Route segments are keyed by `floorId`. The UI needs:
1. Building/floor selector for destination picking.
2. Active floor indicator and floor switching during route preview.
3. Outdoor campus map rendering (campus image from `/api/campus/image`).

Current `mapBootstrapState` only loads the first floor image. S02 needs to extend this to load multiple floor images on demand (lazy, per building/floor selected).

### Destination search UX on mobile

Web `useLocationSearch` provides fuzzy/prefix search over `NavNode` labels. The mobile equivalent needs:
- Searchable flat list of buildings → floors → nodes.
- Filtering by node type (rooms, landmarks, entrances).
- No new backend endpoint needed — search is in-memory over the loaded graph.

### `useRouteSelection` porting

`src/client/hooks/useRouteSelection.ts` is a pure React hook with no external dependencies. It can be copied verbatim into `mobile/hooks/useRouteSelection.ts` (or `mobile/routing/useRouteSelection.ts`) and adjusted for TypeScript import paths.

## Skills Discovered

No additional skills needed. `ngraph.graph` is a standard npm package — no MCP or specialized skill required. The primary work is TypeScript porting, React Native-specific rendering, and graph traversal compatibility verification.

## Implementation Landscape

### Where to work (files to create/change)

**New files to create:**
- `mobile/routing/pathfindingEngine.ts` — Mobile-compatible pathfinding. **Priority: T01** (risk: ngraph compatibility)
- `mobile/routing/useRouteDirections.ts` — Port of `generateDirections()` with corrected import paths.
- `mobile/routing/useRouteSession.ts` — Orchestrates: route computation + direction generation + active floor/step state.
- `mobile/components/destination/DestinationPicker.tsx` — Building/floor/node search + selection UI.
- `mobile/components/route/RoutePreview.tsx` — Step-by-step directions list.
- `mobile/components/route/RoutePathOverlay.tsx` — Polyline path overlay on map.
- `mobile/hooks/useLocationSearch.ts` — In-memory search over `NormalizedNavGraph`.
- `mobile/hooks/useRouteSelection.ts` — Port from web (or import from shared if moved to `src/shared/hooks`).
- `mobile/map/MapViewport.tsx` (modify) — Integrate floor switching and route overlay.
- `mobile/App.tsx` (modify) — Wire destination picker, route session, and floor-aware map.
- `mobile/routing/routeSessionState.ts` — Route session state machine: idle → computing → ready → error.

**Files to reference but NOT modify:**
- `src/shared/pathfinding/engine.ts` — Pattern reference; not imported directly.
- `src/client/hooks/useRouteSelection.ts` — Pattern reference; not imported directly (hook).
- `src/client/hooks/useRouteDirections.ts` — Pattern reference; not imported directly (has React dep).

### Natural seams (task decomposition)

**T01 — Pathfinding engine (CRITICAL PATH):** Verify `ngraph.graph` works in RN; implement mobile pathfinding if not. Port `PathfindingEngine` interface (`findRoute(fromId, toId, mode) → PathResult`). Tests: route found, no route, accessible mode, same-node.

**T02 — Route session state machine + route computation:** `routeSessionState.ts` + `useRouteSession.ts`. Takes `NormalizedNavGraph`, `start`, `destination`, `mode` → computes route → generates directions. Tests: computing→ready, no-route, accessibility filtering.

**T03 — Destination picker UI:** `DestinationPicker.tsx` + `useLocationSearch.ts`. Building→floor→node tree with search. Integrates with `useRouteSelection`. Tests: search filters results, selection advances activeField.

**T04 — Route preview + floor context:** `RoutePreview.tsx` + floor grouping logic. Renders steps grouped by floor (web `directionSections.ts` pattern). Floor-aware step highlighting. Tests: floor sections, empty result.

**T05 — Map floor switching + route overlay:** Extend `MapViewport.tsx` to accept `activeFloorTarget`, `routePath` (array of `{x,y}` per floor). `RoutePathOverlay.tsx` renders path. Tests: floor switch renders correct image, route polyline visible.

**T06 — App wiring + accessible mode toggle:** Modify `App.tsx` to compose: `DestinationPicker` + `MapViewport` + `RoutePreview`. Add accessible mode toggle. Test the full trip setup flow. End-to-end integration tests.

### How to verify

1. `npm --prefix mobile run typecheck` — 0 errors throughout.
2. `npm --prefix mobile run test` — All mobile tests pass (routing + route directions + route session).
3. On device: Select a building, pick a destination, see route steps grouped by floor, see path on map, toggle accessible mode.

## Recommendations

1. **Start T01 immediately** — verify ngraph compatibility in a throwaway test. If it fails, implement minimal A* in mobile before building any UI on top of a broken foundation.
2. **Port direction generation as a pure function** — `generateDirections()` from `src/client/hooks/useRouteDirections.ts` is already framework-agnostic; copy it with corrected import paths.
3. **Keep the map viewport and routing layers separate** — `MapViewport` should accept route data as props; don't couple the routing logic to the viewport.
4. **Lazy-load floor images** — Don't load all floor images upfront; load per `FloorPlanTarget` on selection.
5. **Mirror the web hook patterns** — `useRouteSelection` and `useRouteDirections` ports keep parity with existing CampusNav semantics without re-inventing direction generation logic.
