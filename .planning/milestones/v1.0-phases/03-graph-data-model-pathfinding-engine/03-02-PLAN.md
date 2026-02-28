---
phase: 03-graph-data-model-pathfinding-engine
plan: 02
type: tdd
wave: 2
depends_on: [03-01]
files_modified:
  - src/shared/pathfinding/engine.ts
  - src/shared/__tests__/pathfinding.test.ts
autonomous: true
requirements: [ROUT-01, ROUT-02]

must_haves:
  truths:
    - "Engine returns shortest standard path between two connected nodes"
    - "Engine returns shortest wheelchair-accessible path avoiding non-accessible edges"
    - "Engine returns found=false for disconnected or non-existent nodes"
    - "Same start and destination returns found=true with single-node path and zero distance"
    - "Pathfinding completes in under 50ms for a 500-node graph"
    - "Path node IDs are in source-first order (not reversed)"
  artifacts:
    - path: "src/shared/pathfinding/engine.ts"
      provides: "PathfindingEngine class with findRoute method"
      exports: ["PathfindingEngine"]
      min_lines: 50
    - path: "src/shared/__tests__/pathfinding.test.ts"
      provides: "Comprehensive pathfinding test suite with 8 scenarios"
      min_lines: 80
  key_links:
    - from: "src/shared/pathfinding/engine.ts"
      to: "ngraph.path"
      via: "aStar() with distance, heuristic, and blocked callbacks"
      pattern: "aStar"
    - from: "src/shared/pathfinding/engine.ts"
      to: "src/shared/pathfinding/graph-builder.ts"
      via: "import buildGraph"
      pattern: "import.*buildGraph"
    - from: "src/shared/pathfinding/engine.ts"
      to: "src/shared/pathfinding/types.ts"
      via: "import PathResult, RouteMode"
      pattern: "import.*PathResult"
    - from: "src/shared/__tests__/pathfinding.test.ts"
      to: "src/shared/pathfinding/engine.ts"
      via: "import PathfindingEngine"
      pattern: "import.*PathfindingEngine"
---

<objective>
Implement the PathfindingEngine using TDD — write comprehensive tests first (RED), then implement the engine to pass them (GREEN), then refactor if needed.

Purpose: Deliver the core computation for ROUT-01 (standard pathfinding) and ROUT-02 (accessible pathfinding) as a tested, reliable module. This is pure business logic with clearly defined inputs and outputs — ideal for TDD.

Output: PathfindingEngine class + passing test suite covering all 4 success criteria
</objective>

<execution_context>
@C:/Users/admin/.config/opencode/get-shit-done/workflows/execute-plan.md
@C:/Users/admin/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/03-graph-data-model-pathfinding-engine/03-RESEARCH.md
@.planning/phases/03-graph-data-model-pathfinding-engine/03-01-SUMMARY.md
@src/shared/types.ts
@src/shared/pathfinding/types.ts
@src/shared/pathfinding/graph-builder.ts
@src/shared/__tests__/fixtures/test-graph.json
</context>

<feature>
  <name>PathfindingEngine — dual-mode A* with accessibility filtering</name>
  <files>src/shared/pathfinding/engine.ts, src/shared/__tests__/pathfinding.test.ts</files>
  <behavior>
  The PathfindingEngine class wraps ngraph.path's A* algorithm with the project's type system.
  It takes a NavGraph, builds an internal ngraph.graph, and exposes findRoute(fromId, toId, mode).

  **Test cases — each maps to a specific success criterion or edge case:**

  Using the test-graph.json fixture from Plan 01 (7 nodes, 6 edges, stairs vs elevator routing):

  1. **Standard shortest path (ROUT-01)**
     `findRoute('entrance', 'room-101', 'standard')` →
     `{ found: true, nodeIds: ['entrance', 'hall-1', 'junction-1', 'stairs-1', 'room-101'], totalDistance: ≈0.8 }`
     Standard route goes through stairs (shorter path).

  2. **Accessible path avoids stairs (ROUT-02)**
     `findRoute('entrance', 'room-101', 'accessible')` →
     `{ found: true, nodeIds: ['entrance', 'hall-1', 'junction-1', 'elevator-1', 'room-101'], totalDistance: ≈0.847 }`
     Accessible route avoids stairs edges (accessible: false), takes elevator path.

  3. **Accessible path is longer than standard**
     Compare totalDistance from tests 1 and 2: accessible totalDistance > standard totalDistance.

  4. **Disconnected graph returns not-found (Success Criterion 3)**
     `findRoute('entrance', 'isolated-1', 'standard')` →
     `{ found: false, nodeIds: [], totalDistance: 0, segments: [] }`

  5. **Same start and destination**
     `findRoute('entrance', 'entrance', 'standard')` →
     `{ found: true, nodeIds: ['entrance'], totalDistance: 0, segments: [] }`

  6. **Non-existent node ID returns not-found (no crash)**
     `findRoute('nonexistent', 'room-101', 'standard')` →
     `{ found: false, nodeIds: [], totalDistance: 0, segments: [] }`

  7. **All-accessible graph: both modes return same path**
     When all edges are accessible, `findRoute(a, b, 'standard')` and `findRoute(a, b, 'accessible')` return the same nodeIds. Test with: `findRoute('entrance', 'hall-1', 'accessible')` — only accessible edges on this subpath.

  8. **Performance: under 50ms for 500 nodes (Success Criterion 4)**
     Programmatically generate a 500-node grid graph (e.g., 25×20 grid with edges to adjacent nodes). Run pathfinding from corner to opposite corner. Assert total time < 50ms. Use `performance.now()` for timing.

  **Path result structure for each found route includes:**
  - `nodeIds`: ordered source-first (NOT reversed — engine must reverse ngraph.path's output)
  - `totalDistance`: sum of edge weights along path
  - `segments`: array of `{ fromId, toId, distance }` for each edge traversed
  </behavior>
  <implementation>
  **src/shared/pathfinding/engine.ts** — PathfindingEngine class:

  ```
  import { aStar } from 'ngraph.path'
  import type { Graph, Node, Link } from 'ngraph.graph'
  import type { NavNodeData, NavEdgeData, NavGraph } from '@shared/types'
  import { buildGraph, calculateWeight } from '@shared/pathfinding/graph-builder'
  import type { PathResult, PathSegment, RouteMode } from '@shared/pathfinding/types'
  ```

  Class design:
  - `constructor(navGraph: NavGraph)`: calls `buildGraph(navGraph)` to create the internal graph, then creates two A* pathfinder instances (standard + accessible) via `aStar()`.
  - Private `graph: Graph<NavNodeData, NavEdgeData>`
  - Private `standardFinder` and `accessibleFinder` — created once, reused for all queries.

  Standard finder options:
  - `distance(_from, _to, link)`: return `link.data.standardWeight`
  - `heuristic(a, b)`: Euclidean distance between `a.data` and `b.data` using `calculateWeight(a.data.x, a.data.y, b.data.x, b.data.y)`

  Accessible finder options:
  - `distance(_from, _to, link)`: return `link.data.accessibleWeight`
  - `heuristic(a, b)`: same Euclidean distance heuristic
  - `blocked(_from, _to, link)`: return `!link.data.accessible`

  `findRoute(fromId: string, toId: string, mode: RouteMode): PathResult`:
  1. **Validate inputs**: if `fromId === toId`, return `{ found: true, nodeIds: [fromId], totalDistance: 0, segments: [] }`
  2. **Check node existence**: if `!graph.hasNode(fromId)` or `!graph.hasNode(toId)`, return not-found result
  3. **Select finder**: `mode === 'accessible' ? accessibleFinder : standardFinder`
  4. **Run pathfinding**: `const rawPath = finder.find(fromId, toId)`
  5. **Handle A* single-node quirk**: if `rawPath.length <= 1`, return not-found result (A* returns `[targetNode]` when all paths are blocked — this is NOT a valid path)
  6. **Reverse path**: ngraph.path returns destination-first, `.reverse()` to get source-first
  7. **Build result**: iterate reversed path to extract nodeIds, compute segments (look up link data for each consecutive pair), sum totalDistance
  8. Return `{ found: true, nodeIds, totalDistance, segments }`

  Not-found result helper: `{ found: false, nodeIds: [], totalDistance: 0, segments: [] }`

  **CRITICAL ngraph.path pitfalls to handle (from RESEARCH.md):**
  - Path returned in REVERSE order — must `.reverse()` before extracting nodeIds
  - A* returns `[targetNode]` for blocked paths — check `rawPath.length <= 1` when `fromId !== toId`
  - Non-existent node IDs throw Error — validate with `graph.hasNode()` BEFORE calling find()
  - Pathfinders should be created ONCE in constructor, not per-query

  **Segment extraction**: For each consecutive pair in the reversed path `[nodeA, nodeB]`, look up the link via `graph.getLink(nodeA.id, nodeB.id)` and extract `link.data.standardWeight` or `link.data.accessibleWeight` depending on mode.

  Export only the class: `export class PathfindingEngine { ... }`
  </implementation>
</feature>

<verification>
1. `npx vitest run src/shared/__tests__/pathfinding.test.ts` — all 8 test scenarios pass
2. `npx vitest run src/shared/__tests__/graph-builder.test.ts` — still passes (no regressions)
3. `npx tsc --noEmit` — zero TypeScript errors
4. `npx biome check src/shared/` — zero lint/format issues
5. Performance test confirms pathfinding on 500-node graph completes in under 50ms
</verification>

<success_criteria>
- All 8 test scenarios pass covering both success criteria and edge cases
- Standard pathfinding returns shortest path through stairs (ROUT-01)
- Accessible pathfinding returns shortest accessible path through elevator, avoids stairs (ROUT-02)
- Disconnected nodes and invalid IDs return found=false without crashing
- 500-node performance benchmark passes under 50ms
- PathfindingEngine is exported and reusable by downstream phases (6, 7)
</success_criteria>

<output>
After completion, create `.planning/phases/03-graph-data-model-pathfinding-engine/03-02-SUMMARY.md`
</output>
