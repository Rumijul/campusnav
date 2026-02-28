---
phase: 03-graph-data-model-pathfinding-engine
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/shared/pathfinding/types.ts
  - src/shared/pathfinding/graph-builder.ts
  - src/shared/__tests__/fixtures/test-graph.json
  - src/shared/__tests__/graph-builder.test.ts
autonomous: true
requirements: [ROUT-01, ROUT-02]

must_haves:
  truths:
    - "NavGraph JSON can be loaded and converted to a typed ngraph.graph instance"
    - "Bidirectional edges create directed links in both directions"
    - "Euclidean weight calculator computes correct normalized distances"
    - "PathResult type captures found/not-found, node sequence, total distance, and per-edge segments"
  artifacts:
    - path: "src/shared/pathfinding/types.ts"
      provides: "Pathfinding result and route mode type definitions"
      exports: ["PathResult", "PathSegment", "RouteMode"]
    - path: "src/shared/pathfinding/graph-builder.ts"
      provides: "Graph construction from NavGraph JSON and weight utility"
      exports: ["buildGraph", "calculateWeight"]
    - path: "src/shared/__tests__/fixtures/test-graph.json"
      provides: "7-node test graph with accessible and non-accessible edges plus isolated node"
    - path: "src/shared/__tests__/graph-builder.test.ts"
      provides: "Graph builder verification tests"
  key_links:
    - from: "src/shared/pathfinding/graph-builder.ts"
      to: "ngraph.graph"
      via: "createGraph<NavNodeData, NavEdgeData>()"
      pattern: "createGraph"
    - from: "src/shared/pathfinding/graph-builder.ts"
      to: "src/shared/types.ts"
      via: "import NavGraph, NavNodeData, NavEdgeData types"
      pattern: "import.*from.*@shared/types"
    - from: "src/shared/__tests__/graph-builder.test.ts"
      to: "src/shared/pathfinding/graph-builder.ts"
      via: "import buildGraph, calculateWeight"
      pattern: "import.*buildGraph"
---

<objective>
Create the pathfinding module's type definitions, graph builder function, test fixture, and builder verification tests.

Purpose: Establish the data layer that the pathfinding engine (Plan 02) builds upon — typed result objects, a function to construct ngraph.graph instances from NavGraph JSON, and a validated test graph with both accessible and non-accessible paths plus a disconnected node for edge-case testing.

Output: 4 new files — pathfinding types, graph builder, test fixture JSON, graph builder tests
</objective>

<execution_context>
@C:/Users/admin/.config/opencode/get-shit-done/workflows/execute-plan.md
@C:/Users/admin/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/03-graph-data-model-pathfinding-engine/03-RESEARCH.md
@src/shared/types.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create pathfinding types and graph builder</name>
  <files>src/shared/pathfinding/types.ts, src/shared/pathfinding/graph-builder.ts</files>
  <action>
  Create `src/shared/pathfinding/` directory with two modules:

  **types.ts** — Pathfinding result types consumed by the engine and downstream phases:
  - `RouteMode = 'standard' | 'accessible'` — mode parameter for findRoute calls
  - `PathSegment` interface: `{ fromId: string, toId: string, distance: number }` — one edge in the path
  - `PathResult` interface: `{ found: boolean, nodeIds: string[], totalDistance: number, segments: PathSegment[] }` — complete route result. "No route found" is `{ found: false, nodeIds: [], totalDistance: 0, segments: [] }`, not an error.

  **graph-builder.ts** — Constructs a live ngraph.graph from serialized NavGraph JSON:
  - `import createGraph from 'ngraph.graph'` and `import type { Graph } from 'ngraph.graph'`
  - Import `NavNodeData`, `NavEdgeData`, `NavGraph` from `@shared/types`
  - Export `buildGraph(navGraph: NavGraph): Graph<NavNodeData, NavEdgeData>`:
    1. Create graph via `createGraph<NavNodeData, NavEdgeData>()`
    2. For each node in `navGraph.nodes`: destructure `{ id, ...data }` and call `graph.addNode(id, data)`
    3. For each edge in `navGraph.edges`: destructure `{ id, sourceId, targetId, ...data }` and call `graph.addLink(sourceId, targetId, data)`. If `data.bidirectional` is true, also call `graph.addLink(targetId, sourceId, data)` to create the reverse directed link. This keeps the graph structure honest — `graph.getLink(a, b)` and `graph.getLink(b, a)` both return a link for bidirectional edges.
    4. Return the graph
  - Export `calculateWeight(ax: number, ay: number, bx: number, by: number): number`:
    - Returns Euclidean distance: `Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2)`
    - Used by admin editor (Phase 9) to auto-compute weights from node coordinates (per user decision: "weights auto-calculated from Euclidean distance")
    - Also used as the A* heuristic in Plan 02

  Note: TypeScript strict mode with `noUnusedLocals` and `noUnusedParameters` is enabled — do not add unused imports. The `id` field destructured from edges is intentionally discarded (prefix with `_` if needed: `{ id: _id, sourceId, targetId, ...data }`).
  </action>
  <verify>Run `npx tsc --noEmit` — must pass with zero errors. Both new files must be importable with @shared/pathfinding/* aliases (already covered by existing `@shared/*` path alias in tsconfig.json and vite.config.ts).</verify>
  <done>PathResult, PathSegment, RouteMode types are defined and exported. buildGraph function constructs a typed ngraph.graph from NavGraph JSON with bidirectional link handling. calculateWeight utility computes Euclidean distance. TypeScript compiles cleanly.</done>
</task>

<task type="auto">
  <name>Task 2: Create test graph fixture and graph builder tests</name>
  <files>src/shared/__tests__/fixtures/test-graph.json, src/shared/__tests__/graph-builder.test.ts</files>
  <action>
  **test-graph.json** — A minimal NavGraph JSON fixture with 7 nodes and 6 edges designed to produce DIFFERENT standard vs accessible paths:

  Nodes (all floor: 1, coordinates in normalized 0-1 space):
  - `entrance` (0.1, 0.5) — type: entrance, searchable: true, label: "Main Entrance"
  - `hall-1` (0.3, 0.5) — type: hallway, searchable: false, label: "Main Hall"
  - `junction-1` (0.5, 0.5) — type: junction, searchable: false, label: "Junction"
  - `stairs-1` (0.5, 0.3) — type: stairs, searchable: false, label: "Stairs A"
  - `elevator-1` (0.5, 0.7) — type: elevator, searchable: true, label: "Elevator A"
  - `room-101` (0.7, 0.3) — type: room, searchable: true, label: "Room 101"
  - `isolated-1` (0.9, 0.9) — type: room, searchable: true, label: "Isolated Room"

  Edges (all bidirectional: true, weights = Euclidean distance between node coordinates):
  - e1: entrance → hall-1 (weight ≈0.2, accessible: true)
  - e2: hall-1 → junction-1 (weight ≈0.2, accessible: true)
  - e3: junction-1 → stairs-1 (weight ≈0.2, accessible: false) — stairs, blocks wheelchair
  - e4: stairs-1 → room-101 (weight ≈0.2, accessible: false) — stairs exit, blocks wheelchair
  - e5: junction-1 → elevator-1 (weight ≈0.2, accessible: true) — wheelchair path diverges here
  - e6: elevator-1 → room-101 (weight ≈0.447, accessible: true) — longer but accessible

  Key design properties:
  - Standard shortest: entrance → hall-1 → junction-1 → stairs-1 → room-101 (≈0.8, uses stairs)
  - Accessible shortest: entrance → hall-1 → junction-1 → elevator-1 → room-101 (≈0.847, avoids stairs)
  - isolated-1 has NO edges → disconnected, for "no route found" testing
  - No direct junction → room-101 edge — forces the standard/accessible path difference
  - Set `accessibleWeight: Infinity` on non-accessible edges (e3, e4) as defensive belt-and-suspenders alongside `blocked()` callback

  Include metadata: `{ buildingName: "Test Building", floor: 1, lastUpdated: "2026-01-01T00:00:00Z" }`

  **graph-builder.test.ts** — Vitest tests verifying graph construction:
  ```
  import { describe, it, expect } from 'vitest'
  import { buildGraph, calculateWeight } from '@shared/pathfinding/graph-builder'
  import testGraphData from './fixtures/test-graph.json'
  import type { NavGraph } from '@shared/types'
  ```

  Tests:
  1. "builds graph with correct node count" — `graph.getNodesCount()` equals 7
  2. "preserves node data" — `graph.getNode('entrance')?.data` has correct x, y, label, type, floor
  3. "creates bidirectional links" — both `graph.getLink('entrance', 'hall-1')` and `graph.getLink('hall-1', 'entrance')` are truthy
  4. "preserves edge data" — link from entrance→hall-1 has correct standardWeight, accessibleWeight, accessible, bidirectional
  5. "non-accessible edges have Infinity accessibleWeight" — link from junction-1→stairs-1 has `accessibleWeight === Infinity`
  6. "isolated node has no links" — `graph.getLinks('isolated-1')` returns null or empty array
  7. "calculateWeight computes Euclidean distance" — `calculateWeight(0, 0, 3, 4)` equals 5, `calculateWeight(0.1, 0.5, 0.3, 0.5)` approximately equals 0.2
  </action>
  <verify>Run `npx vitest run src/shared/__tests__/graph-builder.test.ts` — all 7 tests pass. Also run `npx biome check src/shared/` — zero lint/format issues.</verify>
  <done>Test graph fixture represents a realistic campus floor with stairs/elevator routing choice and an isolated node. All 7 graph builder tests pass. Fixture is in NavGraph JSON format matching the type definition, ready for pathfinding engine tests in Plan 02.</done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` passes — all new TypeScript files compile under strict mode
2. `npx vitest run src/shared/__tests__/graph-builder.test.ts` — all tests pass
3. `npx biome check src/shared/` — zero lint/format errors
4. Test fixture JSON can be imported and cast to NavGraph type without errors
</verification>

<success_criteria>
- PathResult, PathSegment, RouteMode types exported from src/shared/pathfinding/types.ts
- buildGraph correctly constructs ngraph.graph with bidirectional link handling
- calculateWeight utility computes Euclidean distance
- Test graph has 7 nodes (6 connected + 1 isolated), 6 edges, and produces different standard vs accessible shortest paths
- All graph builder tests pass
</success_criteria>

<output>
After completion, create `.planning/phases/03-graph-data-model-pathfinding-engine/03-01-SUMMARY.md`
</output>
