---
estimated_steps: 49
estimated_files: 7
skills_used: []
---

# T01: Pathfinding engine + direction generation

## Task T01 — Pathfinding Engine + Direction Generation

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

## Inputs

- `mobile/domain/navGraph.ts`
- `src/shared/pathfinding/types.ts`
- `src/shared/types.ts`
- `src/client/hooks/useRouteDirections.ts`
- `src/client/components/directionSections.ts`
- `src/shared/pathfinding/engine.ts`

## Expected Output

- `mobile/routing/pathfindingEngine.ts`
- `mobile/routing/pathfindingEngine.test.ts`
- `mobile/routing/generateDirections.ts`
- `mobile/routing/generateDirections.test.ts`
- `mobile/routing/directionSections.ts`
- `mobile/routing/directionSections.test.ts`

## Verification

npm --prefix mobile run test -- mobile/routing/ && npm --prefix mobile run typecheck

## Observability Impact

PathfindingEngine errors (node-not-found, no-route) are explicit result fields — no exceptions thrown. Direction generation is pure and deterministic.
