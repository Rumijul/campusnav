# S19: Multi Floor Pathfinding Engine — completed 2026 03 01

**Goal:** unit tests prove Multi-floor Pathfinding Engine — completed 2026-03-01 works
**Demo:** unit tests prove Multi-floor Pathfinding Engine — completed 2026-03-01 works

## Must-Haves


## Tasks

- [x] **T01: Replace the flattenNavGraph Phase 16 compatibility shim with real cross-floor edge synthesis…**
  - Replace the flattenNavGraph Phase 16 compatibility shim with real cross-floor edge synthesis inside buildGraph. After this plan, the ngraph.graph will contain inter-floor links alongside intra-floor links, making the A* engine capable of routing across floors.
- [x] **T02: Update the A* heuristic inside PathfindingEngine to return 0 for node pairs…**
  - Update the A* heuristic inside PathfindingEngine to return 0 for node pairs on different floors. This keeps the heuristic admissible (never overestimates) for cross-floor routing, allowing the engine to find optimal paths that traverse inter-floor edges synthesized in Plan 01.
- [x] **T03: Extend generateDirections to detect floor transitions in the route and emit human-readable…**
  - Extend generateDirections to detect floor transitions in the route and emit human-readable "Take the stairs/elevator/ramp to Floor N" direction steps with appropriate new StepIcon values.
- [x] **T04: Wire the completed engine and directions changes into FloorPlanCanvas: build a floorMap…**
  - Wire the completed engine and directions changes into FloorPlanCanvas: build a floorMap (Map<number, NavFloor>) from the loaded NavGraph and pass it as the 4th argument to both useRouteDirections calls. Also confirm flattenNavGraph is no longer imported anywhere.

## Files Likely Touched

- `src/shared/pathfinding/graph-builder.ts`
- `src/shared/__tests__/fixtures/multi-floor-test-graph.json`
- `src/shared/__tests__/graph-builder.test.ts`
- `src/shared/pathfinding/engine.ts`
- `src/shared/__tests__/pathfinding.test.ts`
- `src/client/hooks/useRouteDirections.ts`
- `src/client/hooks/useRouteDirections.test.ts`
- `src/client/components/FloorPlanCanvas.tsx`
