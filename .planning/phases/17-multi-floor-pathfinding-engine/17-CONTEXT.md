# Phase 17: Multi-floor Pathfinding Engine - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Upgrade the A* pathfinding engine to route across multiple floors — from a node on Floor 1 to a node on Floor 3, traversing stairs/elevator/ramp connectors. Replaces the `flattenNavGraph` shim (explicitly marked as the Phase 17 replacement target in graph-builder.ts). The client floor-tab UI (Phase 19) and admin editor (Phase 18) are separate phases — this phase delivers only the engine and directions logic.

</domain>

<decisions>
## Implementation Decisions

### Cross-floor edge model
- Synthesize inter-floor edges inside `graph-builder.ts` (not stored in the database) — iterate connector nodes and auto-add inter-floor links using `connectsToNodeAboveId` / `connectsToNodeBelowId` already present on every stairs/elevator/ramp node
- Inter-floor edges are **bidirectional** (traversable up and down)
- Inter-floor edges carry a **fixed constant weight** (e.g. ~0.3 normalized units) — represents the cost of changing floors regardless of where the connector is positioned on the floor plan
- A* heuristic **returns 0 for cross-floor node pairs** — Euclidean x,y distance is meaningless between floors; returning 0 keeps the heuristic admissible

### PathResult shape
- `PathResult` stays **unchanged** — flat `nodeIds: string[]`, `segments`, `totalDistance`, `found`
- Consumers (Phase 19) derive floor context by looking up `node.floorId` on each node in the node map they already hold
- `PathfindingEngine` constructor continues to accept `NavGraph` — no change to call sites in `FloorPlanCanvas.tsx`
- `findRoute(fromId, toId, mode)` signature unchanged

### Direction steps for floor changes
- Floor-change instruction text format: **"Take the stairs/elevator/ramp to Floor N"** — uses the connector node's `type` field and the destination floor's `floorNumber`
- New `StepIcon` values: **`'stairs-up'`**, **`'stairs-down'`**, **`'elevator'`**, **`'ramp'`** — distinct per connector type and direction
- `generateDirections` receives a **`floorMap: Map<number, NavFloor>`** parameter (floorId → NavFloor) to look up `floorNumber` for the instruction text
- Floor transition detection: compare `nodeMap.get(currId).floorId` vs `nodeMap.get(nextId).floorId` — when they differ, emit a floor-change step instead of a bearing-based turn step

### Accessible routing
- Stairs remain **blocked at `accessibleWeight: Infinity`** in accessible mode — no last-resort fallback through stairs
- If no elevator/ramp route exists in accessible mode, return **`{ found: false }`** — same behavior as unreachable nodes today
- Elevator/ramp inter-floor edge weight (standard vs penalty): **Claude's Discretion** — a small detour penalty (e.g. 1.5× standard floor-change weight) is reasonable to avoid routing through elevators unnecessarily on flat-floor paths

### Claude's Discretion
- Exact inter-floor fixed weight constant value (suggested: ~0.3)
- Elevator/ramp accessible weight multiplier (suggested: 1.5×)
- Whether to add a `ramp` StepIcon or fold ramp into elevator icon

</decisions>

<specifics>
## Specific Ideas

No specific references — open to standard approaches within the decisions above.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `PathfindingEngine` (`src/shared/pathfinding/engine.ts`): existing A* class with `standardFinder` and `accessibleFinder` — signature stays intact, only `buildGraph` changes
- `buildGraph` + `flattenNavGraph` (`src/shared/pathfinding/graph-builder.ts`): `flattenNavGraph` is the explicit replacement target; `buildGraph` to be updated to synthesize cross-floor edges
- `calculateWeight` (`graph-builder.ts`): Euclidean weight utility — already used for intra-floor edges and A* heuristic; reuse for intra-floor edges, return 0 for cross-floor pairs
- `generateDirections` (`src/client/hooks/useRouteDirections.ts`): direction step generator — needs floor-change branch and `floorMap` parameter
- `StepIcon` type (`useRouteDirections.ts`): `'straight' | 'turn-left' | 'turn-right' | 'sharp-left' | 'sharp-right' | 'arrive' | 'accessible'` — new icons added here
- `NavNodeData` (`src/shared/types.ts`): already has `floorId`, `connectsToFloorAboveId`, `connectsToFloorBelowId`, `connectsToNodeAboveId`, `connectsToNodeBelowId` — no schema changes needed
- `NavFloor` (`src/shared/types.ts`): has `id`, `floorNumber`, `imagePath` — `floorNumber` is what "to Floor N" instructions need

### Established Patterns
- Dual-weight pattern: every edge has both `standardWeight` and `accessibleWeight` — inter-floor edges must follow this same pattern
- `accessibleWeight: Infinity` for non-accessible edges (stairs) — already normalized in `buildGraph`; inter-floor stair edges must also get `Infinity` accessible weight
- `PathResult` is a value object (not thrown as errors) — `{ found: false }` is the no-route signal
- `useMemo` pattern: `PathfindingEngine` is memoized from `NavGraph` in `FloorPlanCanvas.tsx` — engine rebuild triggers automatically when NavGraph changes

### Integration Points
- `FloorPlanCanvas.tsx:93`: `new PathfindingEngine(graphState.data)` — unchanged call site
- `FloorPlanCanvas.tsx:188-196`: `engine.findRoute(start.id, dest.id, mode)` — unchanged call site
- `useRouteDirections.tsx`: `generateDirections(pathResult.nodeIds, nodeMap, mode)` — will need `floorMap` as 4th argument; existing call sites need updating
- `src/shared/__tests__/pathfinding.test.ts` and `src/shared/__tests__/graph-builder.test.ts` — need cross-floor test cases added

</code_context>

<deferred>
## Deferred Ideas

- Admin editor for setting inter-floor connector weights — Phase 18
- Student floor-tab UI to display which floor the route is on — Phase 19
- One-way stairwells (fire exits) — out of scope; no use case identified for CampusNav

</deferred>

---

*Phase: 17-multi-floor-pathfinding-engine*
*Context gathered: 2026-03-01*
