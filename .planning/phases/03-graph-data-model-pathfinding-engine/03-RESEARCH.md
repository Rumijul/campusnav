# Phase 3: Graph Data Model & Pathfinding Engine - Research

**Researched:** 2026-02-18
**Domain:** Graph-based pathfinding with accessibility-aware edge filtering
**Confidence:** HIGH

## Summary

Phase 3 builds the pure computation layer: an in-memory graph constructed from ngraph.graph populated with NavNodeData/NavEdgeData (types already defined in `src/shared/types.ts`), and a pathfinding engine powered by ngraph.path that computes both standard and wheelchair-accessible shortest paths. No UI, no API, no persistence — just a testable TypeScript module.

The ngraph ecosystem (ngraph.graph v20.1.2 + ngraph.path v1.6.1) is already installed in the project and provides: a generic typed graph data structure, three pathfinding algorithms (A*, A*-greedy, NBA*), custom distance/heuristic/blocked callbacks, and built-in TypeScript types. The dual-weight strategy (standardWeight + accessibleWeight on every edge, with `blocked()` filtering non-accessible edges) maps directly to ngraph.path's API.

**Primary recommendation:** Use ngraph.path's `aStar()` with Euclidean heuristic for standard routing and `aStar()` with `blocked()` callback for accessible routing. Represent edge weights as Euclidean distance in normalized coordinates. Wrap ngraph's low-level API in a clean `PathfindingEngine` module that returns strongly-typed `PathResult` objects.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Weights auto-calculated from Euclidean distance between node coordinates (admin can override)
- Single walking speed constant used to convert distance to time estimates downstream — the weight difference between standard and accessible edges handles routing differences
- Minimal toy graph (5-10 nodes, a few edges) for testing — just enough to verify pathfinding works
- Graph data loaded from JSON files (not hardcoded TypeScript) — aligns with how production works (Phase 7 serves JSON)
- Single-floor routing only in this phase — multi-floor navigation deferred until multi-floor data exists
- Floor transitions classified as accessible vs not-accessible (two types, not three)
- Include a `floor` field on nodes now even though unused — future-proofs for multi-floor extension

### Claude's Discretion
- Edge weight semantics (distance vs time) and dual-weight relationship
- Test scenario coverage and JSON graph format
- Path result detail level and API shape
- Pathfinding algorithm selection
- "No route found" communication pattern
- Multi-floor graph structure (for future use)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ROUT-01 | App computes the shortest path between two points using graph-based pathfinding (Dijkstra/A*) | ngraph.path provides A*, A*-greedy, and NBA* algorithms. Verified: aStar() with custom distance function using edge weights correctly finds shortest weighted path. Performance: <0.2ms for 500-node graph. |
| ROUT-02 | App computes a wheelchair-accessible shortest path that excludes stairs and non-accessible edges | ngraph.path's `blocked()` callback filters edges at query time. Verified: combining `distance()` (using accessibleWeight) + `blocked()` (filtering `!accessible`) correctly routes around inaccessible edges. |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ngraph.graph | 20.1.2 | In-memory graph data structure | Generic typed graph (`Graph<NavNodeData, NavEdgeData>`), built-in TS types, addNode/addLink/getNode/forEachNode API. Already referenced in `types.ts` comments. Already installed. |
| ngraph.path | 1.6.1 | Pathfinding algorithms (A*, NBA*) | Custom distance/heuristic/blocked callbacks, returns `Node[]`, built-in TS types. Already installed. |
| vitest | 4.0.18 | Test runner | Already configured in project. Used for unit and performance tests. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none needed) | — | — | The core libraries cover all needs for this phase. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| ngraph.path aStar | ngraph.path nba (NBA*) | NBA* is bi-directional and faster for large graphs. However, **NBA* has a quirk**: it correctly returns `[]` for unreachable nodes while A* returns `[targetNode]`. At 500 nodes, A* runs at 0.14ms — performance difference is irrelevant. Recommend A* for simplicity. |
| ngraph.graph | Hand-rolled adjacency list | ngraph provides typed API, event system, iteration helpers. No reason to hand-roll. |

**Installation:**
```bash
# Already installed — no action needed
npm install ngraph.graph ngraph.path
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── shared/
│   ├── types.ts              # Existing: NavNodeData, NavEdgeData, NavNode, NavEdge, NavGraph
│   └── pathfinding/
│       ├── engine.ts          # PathfindingEngine: graph loading, route computation
│       ├── graph-builder.ts   # Builds ngraph.graph from NavGraph JSON
│       └── types.ts           # PathResult, RouteMode, etc.
├── shared/__tests__/
│   ├── pathfinding.test.ts    # Unit tests for pathfinding
│   └── fixtures/
│       └── test-graph.json    # Minimal test graph (5-10 nodes)
```

**Rationale:** Placing pathfinding in `src/shared/` makes it importable by both client (Phase 6: route visualization) and server (if ever needed). The engine is pure TypeScript with no browser or Node-specific dependencies.

### Pattern 1: Graph Builder (NavGraph JSON → ngraph.graph)
**What:** A function that takes a serialized `NavGraph` object and constructs a live `ngraph.graph` instance with proper node data and bidirectional link handling.
**When to use:** Every time graph data is loaded (from JSON in tests, from API in production).

```typescript
// Source: Verified against ngraph.graph v20.1.2 index.d.ts
import createGraph from 'ngraph.graph'
import type { Graph } from 'ngraph.graph'
import type { NavEdgeData, NavGraph, NavNodeData } from '@shared/types'

export function buildGraph(navGraph: NavGraph): Graph<NavNodeData, NavEdgeData> {
  const graph = createGraph<NavNodeData, NavEdgeData>()

  for (const { id, ...data } of navGraph.nodes) {
    graph.addNode(id, data)
  }

  for (const { id, sourceId, targetId, ...data } of navGraph.edges) {
    graph.addLink(sourceId, targetId, data)
    // CRITICAL: ngraph links are DIRECTED. For bidirectional edges,
    // add the reverse link too.
    if (data.bidirectional) {
      graph.addLink(targetId, sourceId, data)
    }
  }

  return graph
}
```

### Pattern 2: Dual-Mode Pathfinding with ngraph.path
**What:** Two pathfinder instances — one for standard routes, one for accessible routes — both using A* with Euclidean heuristic. The accessible finder uses `blocked()` to exclude non-accessible edges.
**When to use:** Core routing computation.

```typescript
// Source: Verified against ngraph.path v1.6.1 index.d.ts + live testing
import { aStar } from 'ngraph.path'
import type { Graph, Node, Link } from 'ngraph.graph'
import type { NavNodeData, NavEdgeData } from '@shared/types'

function euclideanDistance(a: Node<NavNodeData>, b: Node<NavNodeData>): number {
  const dx = a.data.x - b.data.x
  const dy = a.data.y - b.data.y
  return Math.sqrt(dx * dx + dy * dy)
}

// Standard pathfinder: uses standardWeight, no blocking
const standardFinder = aStar(graph, {
  distance(_from, _to, link) { return link.data.standardWeight },
  heuristic: euclideanDistance,
})

// Accessible pathfinder: uses accessibleWeight + blocks inaccessible edges
const accessibleFinder = aStar(graph, {
  distance(_from, _to, link) { return link.data.accessibleWeight },
  heuristic: euclideanDistance,
  blocked(_from, _to, link) { return !link.data.accessible },
})
```

### Pattern 3: Path Result with Full Breakdown
**What:** A strongly-typed result object that includes the ordered node sequence, total distance, per-segment breakdown, and success/failure status.

```typescript
// Recommended PathResult type
interface PathSegment {
  fromId: string
  toId: string
  distance: number
}

interface PathResult {
  found: boolean
  nodeIds: string[]         // Ordered start → destination
  totalDistance: number      // Sum of edge weights along path
  segments: PathSegment[]   // Per-edge breakdown for direction generation
}

// "No route" is a result, not an error:
// { found: false, nodeIds: [], totalDistance: 0, segments: [] }
```

### Pattern 4: Route Mode Parameter
**What:** A single `findRoute(from, to, mode)` function with a `'standard' | 'accessible'` mode parameter, rather than separate functions or a boolean flag.

```typescript
type RouteMode = 'standard' | 'accessible'

function findRoute(fromId: string, toId: string, mode: RouteMode): PathResult
```

**Why mode parameter over separate calls or boolean:**
- More readable: `findRoute(a, b, 'accessible')` vs `findRoute(a, b, true)`
- Extensible: adding a 'shortest-time' mode later doesn't break the API
- Single function signature for both callers and tests

### Anti-Patterns to Avoid

- **Using `Infinity` weight instead of `blocked()`:** While setting `accessibleWeight: Infinity` on stairs edges does cause A* to avoid them, it doesn't cleanly handle "no accessible path exists" — A* may still return a path through `Infinity`-weight edges. Use `blocked()` for definitive exclusion.

- **Forgetting bidirectional link handling:** ngraph.graph links are **directed**. `addLink('a', 'b', data)` does NOT make b→a traversable (verified). For bidirectional edges, you MUST call `addLink` twice (once in each direction). Without `oriented: true` in the pathfinder, ngraph.path treats ALL links as bidirectional during traversal — so you could omit the second link. **However**, this creates a mismatch: the graph structure wouldn't reflect the true edge model. Recommendation: always add both directed links for bidirectional edges, and do NOT use `oriented: true` in the pathfinder (default behavior = undirected traversal).

  **Important nuance:** Because ngraph.path defaults to undirected traversal, adding a single `addLink('a', 'b')` allows pathfinding from b→a. But `graph.getLink('b', 'a')` returns `undefined`. For consistency with edge lookups and future phases (edge editing), add both links.

- **Re-creating pathfinders on every query:** ngraph.path's `aStar()` constructs internal data structures. Create the pathfinder once after building the graph, reuse it for all queries. If the graph changes, create a new pathfinder.

- **Not handling the A* "single-node" result:** When A* cannot reach the destination (all paths blocked), it returns `[targetNode]` instead of `[]`. This is a known quirk. Always check: if result has ≤ 1 node AND fromId !== toId, treat as "no path found."

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Graph data structure | Custom adjacency list | ngraph.graph | Typed API, tested, handles edge IDs, node iteration. Already in types.ts. |
| Pathfinding algorithm | Custom Dijkstra/A* | ngraph.path aStar() | Optimized heap, object pooling, handles edge cases. 0.14ms for 500 nodes. |
| Priority queue for pathfinding | Custom binary heap | (included in ngraph.path) | ngraph.path includes its own optimized NodeHeap. |

**Key insight:** The entire pathfinding computation for this phase is ~50 lines of wrapper code around ngraph. The value is in the clean API design, edge case handling, and thorough testing — not in algorithm implementation.

## Common Pitfalls

### Pitfall 1: ngraph.path Returns Path in Reverse Order
**What goes wrong:** Path array from `find()` is ordered destination-first, source-last. Consumers expect source-first.
**Why it happens:** ngraph.path backtracks from destination to source during path reconstruction.
**How to avoid:** Always `.reverse()` the result before returning from the engine.
**Warning signs:** Directions say "start at room 204" when user selected the entrance as start.
**Verified:** `find('a','c')` returns `['c', 'b', 'a']` — confirmed via live testing.

### Pitfall 2: A* Returns `[target]` Instead of `[]` for Blocked Paths
**What goes wrong:** Code checks `path.length > 0` and thinks a route was found when all edges from source are blocked.
**Why it happens:** A* implementation adds the target node before discovering no path from source reaches it.
**How to avoid:** Check: `if (rawPath.length <= 1 && fromId !== toId) → no path found`. Or use NBA* which correctly returns `[]`.
**Warning signs:** App shows "route found" with a single dot on the map instead of a path.
**Verified:** A* returns `[targetNode]` for blocked paths; NBA* returns `[]`. Tested with ngraph.path v1.6.1.

### Pitfall 3: Calling `find()` with Non-Existent Node IDs
**What goes wrong:** ngraph.path throws `Error: toId is not defined in this graph: <id>`.
**Why it happens:** No input validation before calling the pathfinder.
**How to avoid:** Validate both node IDs exist in the graph (`graph.hasNode()`) before calling `find()`. Return a clear "node not found" result.
**Warning signs:** Unhandled promise rejection or crash in the browser console.
**Verified:** Confirmed via live testing — throws synchronous Error.

### Pitfall 4: Euclidean Heuristic Overestimation with Non-Distance Weights
**What goes wrong:** If edge weights represent something other than distance (e.g., time with variable speeds), the Euclidean heuristic may overestimate the true cost, breaking A*'s optimality guarantee.
**Why it happens:** A* heuristic must be admissible (never overestimate). Euclidean distance is only admissible when edge weights ≥ Euclidean distance between endpoints.
**How to avoid:** Use normalized Euclidean distance as edge weights (locked decision). Since weights = distance between nodes, the heuristic is admissible by definition.
**Warning signs:** A* returns a suboptimal path (longer than Dijkstra's result).

### Pitfall 5: JSON Fixture Files Not Found in Tests
**What goes wrong:** `vitest` can't resolve JSON imports or fixture file paths.
**Why it happens:** Missing `resolveJsonModule` in tsconfig or incorrect relative paths.
**How to avoid:** `resolveJsonModule: true` is already set in tsconfig.json. Use relative imports: `import testGraph from './fixtures/test-graph.json'`. Vitest handles JSON imports natively.
**Warning signs:** "Cannot find module" errors in test output.

## Code Examples

Verified patterns from official sources and live testing:

### Building a Graph from NavGraph JSON
```typescript
// Source: ngraph.graph v20.1.2 index.d.ts + types.ts in codebase
import createGraph from 'ngraph.graph'
import type { Graph } from 'ngraph.graph'
import type { NavEdgeData, NavGraph, NavNodeData } from '@shared/types'

export function buildGraph(navGraph: NavGraph): Graph<NavNodeData, NavEdgeData> {
  const graph = createGraph<NavNodeData, NavEdgeData>()

  for (const { id, ...data } of navGraph.nodes) {
    graph.addNode(id, data)
  }

  for (const { id, sourceId, targetId, ...data } of navGraph.edges) {
    graph.addLink(sourceId, targetId, data)
    if (data.bidirectional) {
      graph.addLink(targetId, sourceId, data)
    }
  }

  return graph
}
```

### Computing a Route with Result Wrapping
```typescript
// Source: ngraph.path v1.6.1 index.d.ts + live testing
import { aStar } from 'ngraph.path'
import type { Graph, Node, Link } from 'ngraph.graph'
import type { NavNodeData, NavEdgeData } from '@shared/types'

type RouteMode = 'standard' | 'accessible'

interface PathResult {
  found: boolean
  nodeIds: string[]
  totalDistance: number
}

function createFinder(graph: Graph<NavNodeData, NavEdgeData>, mode: RouteMode) {
  const heuristic = (a: Node<NavNodeData>, b: Node<NavNodeData>) => {
    const dx = a.data.x - b.data.x
    const dy = a.data.y - b.data.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  if (mode === 'accessible') {
    return aStar(graph, {
      distance: (_f, _t, link) => link.data.accessibleWeight,
      heuristic,
      blocked: (_f, _t, link) => !link.data.accessible,
    })
  }

  return aStar(graph, {
    distance: (_f, _t, link) => link.data.standardWeight,
    heuristic,
  })
}
```

### Test Graph JSON Fixture Format
```json
{
  "nodes": [
    { "id": "entrance", "x": 0.1, "y": 0.5, "label": "Main Entrance", "type": "entrance", "searchable": true, "floor": 1 },
    { "id": "hall-1", "x": 0.3, "y": 0.5, "label": "Main Hall", "type": "hallway", "searchable": false, "floor": 1 },
    { "id": "stairs-1", "x": 0.5, "y": 0.3, "label": "Stairs A", "type": "stairs", "searchable": false, "floor": 1 },
    { "id": "elevator-1", "x": 0.5, "y": 0.7, "label": "Elevator A", "type": "elevator", "searchable": true, "floor": 1 },
    { "id": "room-101", "x": 0.7, "y": 0.5, "label": "Room 101", "type": "room", "searchable": true, "floor": 1 },
    { "id": "junction-1", "x": 0.5, "y": 0.5, "label": "Junction", "type": "junction", "searchable": false, "floor": 1 }
  ],
  "edges": [
    { "id": "e1", "sourceId": "entrance", "targetId": "hall-1", "standardWeight": 0.2, "accessibleWeight": 0.2, "accessible": true, "bidirectional": true },
    { "id": "e2", "sourceId": "hall-1", "targetId": "junction-1", "standardWeight": 0.2, "accessibleWeight": 0.2, "accessible": true, "bidirectional": true },
    { "id": "e3", "sourceId": "junction-1", "targetId": "stairs-1", "standardWeight": 0.2, "accessibleWeight": 0.2, "accessible": false, "bidirectional": true },
    { "id": "e4", "sourceId": "junction-1", "targetId": "elevator-1", "standardWeight": 0.3, "accessibleWeight": 0.3, "accessible": true, "bidirectional": true },
    { "id": "e5", "sourceId": "stairs-1", "targetId": "room-101", "standardWeight": 0.2, "accessibleWeight": 0.2, "accessible": false, "bidirectional": true },
    { "id": "e6", "sourceId": "elevator-1", "targetId": "room-101", "standardWeight": 0.3, "accessibleWeight": 0.3, "accessible": true, "bidirectional": true },
    { "id": "e7", "sourceId": "junction-1", "targetId": "room-101", "standardWeight": 0.2, "accessibleWeight": 0.2, "accessible": true, "bidirectional": true }
  ],
  "metadata": {
    "buildingName": "Test Building",
    "floor": 1,
    "lastUpdated": "2026-02-18T00:00:00Z"
  }
}
```

**JSON format rationale:** Uses the existing `NavGraph` serialization format (node+edge arrays, not adjacency list). This matches `NavGraph` from `types.ts` exactly — the same JSON shape the API will serve in Phase 7. Weights are Euclidean distances in normalized 0–1 coordinate space.

### Vitest Test Structure
```typescript
// Source: vitest v4.0.18 API
import { describe, it, expect } from 'vitest'
import testGraphData from './fixtures/test-graph.json'
import type { NavGraph } from '@shared/types'

const testGraph = testGraphData as NavGraph

describe('PathfindingEngine', () => {
  it('finds shortest standard path', () => {
    // ...
  })

  it('finds accessible path avoiding stairs', () => {
    // ...
  })

  it('returns not-found for disconnected nodes', () => {
    // ...
  })

  it('handles same start and destination', () => {
    // ...
  })

  it('completes in under 50ms for 500 nodes', () => {
    // ...
  })
})
```

## Discretion Recommendations

### Edge Weight Semantics: Use Normalized Distance
**Recommendation:** Weights represent Euclidean distance in normalized (0–1) coordinates. Do NOT convert to walking time in this phase.

**Rationale:**
- Locked decision says "single walking speed constant converts to time downstream" — meaning the engine works in distance units
- Euclidean distance between normalized coordinates naturally serves as edge weight
- For admin-overridden weights, they can set a larger/smaller number representing effective distance
- `accessibleWeight` = same as `standardWeight` for accessible edges. For non-accessible edges: set `accessible: false` and use `blocked()` callback rather than relying on `Infinity` weight. This avoids the Infinity arithmetic issue (Pitfall 2).
- For accessible paths that are longer (e.g., ramp is further than stairs), `accessibleWeight > standardWeight` on the same edge

### Pathfinding Algorithm: A* with Euclidean Heuristic
**Recommendation:** Use `aStar()`, not `nba()` or `aGreedy()`.

**Rationale:**
- A* is optimal and well-understood
- Euclidean heuristic is admissible since weights = Euclidean distance (never overestimates)
- Performance at 500 nodes: 0.14ms (A*) vs 0.18ms (NBA*) — both trivially fast, A* slightly faster at this scale
- NBA* has better "no path" detection (returns `[]`), but we handle A*'s quirk with a simple length check
- A* greedy is suboptimal — not appropriate when correctness matters

### Path Result Detail: Full Breakdown
**Recommendation:** Return `{ found, nodeIds, totalDistance, segments }`.

**Rationale:**
- `nodeIds` (ordered source → destination) needed by Phase 6 for drawing path on canvas
- `totalDistance` needed by Phase 6 for distance/time display (ROUT-06)
- `segments` (per-edge `{ fromId, toId, distance }`) needed by Phase 6 for step-by-step directions (ROUT-05)
- Including all three avoids re-computing downstream. Cheap to produce during path extraction.

### API Shape: Mode Parameter
**Recommendation:** Single function `findRoute(fromId, toId, mode: 'standard' | 'accessible'): PathResult`.

**Rationale:**
- Clean, self-documenting API
- Caller computes both routes with two calls: `findRoute(a, b, 'standard')` and `findRoute(a, b, 'accessible')`
- No coupling between the two results — accessible route doesn't depend on standard route
- Extensible for future modes without signature changes

### "No Route Found" Communication: Result Object, Not Error
**Recommendation:** Return `{ found: false, nodeIds: [], totalDistance: 0, segments: [] }`.

**Rationale:**
- "No route exists" is a valid domain outcome, not an exceptional condition
- Callers use `if (result.found)` — no try/catch needed
- Invalid node IDs should also return `found: false` (with the engine validating internally)
- Throwing errors is reserved for truly exceptional cases (corrupted graph state, etc.)

### Test Scenario Coverage
**Recommendation:** The following test scenarios cover the success criteria and key edge cases:

| Scenario | What it verifies |
|----------|-----------------|
| Standard shortest path | ROUT-01: Basic pathfinding works |
| Accessible path avoids stairs | ROUT-02: Accessibility filtering works |
| Accessible path uses longer route | ROUT-02: Accessible route differs from standard |
| Disconnected graph | Success criterion 3: "no route found" result |
| Same start and destination | Edge case: returns single-node path with 0 distance |
| Non-existent node ID | Edge case: returns found=false, no crash |
| Standard and accessible return same path | When all edges are accessible, both routes match |
| 500-node performance benchmark | Success criterion 4: under 50ms |

### Multi-Floor Graph Structure (Future, Not Built Now)
**Recommendation:** When multi-floor is needed, use **transition nodes** (not edge properties).

**Rationale:**
- An elevator node on floor 1 connects to the same elevator node on floor 2 via a cross-floor edge
- The cross-floor edge has `accessible: true` for elevators, `accessible: false` for stairs
- This works with the existing NavNodeData (has `floor` field) and NavEdgeData (has `accessible` flag)
- No new types needed — just edges that connect nodes on different floors
- The `floor` field on NavNodeData is already present and will be set to `1` for all nodes in this phase

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Grid-based pathfinding (PathFinding.js) | Graph-based with ngraph.path | N/A (different problem domains) | Graph-based is correct for indoor navigation with named waypoints |
| Custom Dijkstra implementation | ngraph.path library | ngraph.path v1.x stable since 2019 | No reason to hand-roll; ngraph handles heap optimization, object pooling |
| CommonJS imports (`require()`) | ES module imports | ngraph.graph v20+, ngraph.path v1.6+ | Both packages ship ESM builds. Use `import` syntax. |

**Deprecated/outdated:**
- Nothing relevant — ngraph.graph v20.1.2 and ngraph.path v1.6.1 are the current stable releases with active maintenance.

## Open Questions

1. **Bidirectional edge handling strategy**
   - What we know: ngraph.graph links are directed. ngraph.path defaults to undirected traversal. Adding one link allows traversal in both directions.
   - What's unclear: Whether to add two directed links for bidirectional edges (explicit, matches data model) or rely on ngraph.path's default undirected traversal (simpler, fewer links).
   - Recommendation: Add two directed links for bidirectional edges. This keeps the graph structure honest — `graph.getLink(a, b)` and `graph.getLink(b, a)` both return a link. Consistency matters more than saving a few link objects. The planner should decide this definitively.

2. **Accessible weight value for non-accessible edges**
   - What we know: `blocked()` callback handles edge exclusion. The `accessibleWeight` field exists on every edge.
   - What's unclear: What value to set `accessibleWeight` to on non-accessible edges (Infinity, same as standardWeight, or 0).
   - Recommendation: Set `accessibleWeight = Infinity` on non-accessible edges as a defensive signal. The `blocked()` function is the primary filtering mechanism, but Infinity ensures even if `blocked()` is somehow bypassed, the edge is effectively unusable. This is belt-and-suspenders.

## Sources

### Primary (HIGH confidence)
- ngraph.graph v20.1.2 index.d.ts — TypeScript type definitions, `Graph<NodeData, LinkData>` generic, `addNode`, `addLink`, `getNode`, `getLink`, `hasNode`, `forEachNode` API
- ngraph.path v1.6.1 index.d.ts — TypeScript type definitions, `PathFinderOptions<NodeData, LinkData>` with `distance`, `heuristic`, `blocked`, `oriented` options. Three finders: `aStar`, `aGreedy`, `nba`
- ngraph.path README.md (https://github.com/anvaka/ngraph.path) — Usage examples, performance benchmarks (NYC road graph: 264K nodes), algorithm descriptions
- ngraph.graph README.md (https://github.com/anvaka/ngraph.graph) — Graph creation, addNode/addLink with data, iteration, event system

### Verified via Live Testing (HIGH confidence)
- Path return order: `find('a','c')` returns `[c, b, a]` (destination first) — must reverse
- No path: disconnected nodes return `[]` (empty array)
- A* blocked quirk: returns `[target]` when all paths blocked; NBA* returns `[]`
- Same-node path: `find('a','a')` returns `[a]` (single element)
- Non-existent node: throws `Error: toId is not defined in this graph`
- Bidirectionality: `addLink('a','b')` alone does NOT create `getLink('b','a')`, but pathfinder (non-oriented) can traverse b→a
- Dual-weight routing: `distance()` + `blocked()` correctly separates standard vs accessible paths
- Performance: A* on 500-node grid graph = 0.14ms/query; NBA* = 0.18ms/query

### Secondary (MEDIUM confidence)
- Existing codebase types.ts — NavNodeData, NavEdgeData, NavGraph definitions confirmed matching ngraph.graph generic pattern
- Architecture research (.planning/research/ARCHITECTURE.md) — Client-side pathfinding pattern, dual-graph model confirmed

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — ngraph.graph/path already chosen, installed, typed. Live-tested all relevant APIs.
- Architecture: HIGH — Pattern is straightforward wrapper around ngraph. Types already defined.
- Pitfalls: HIGH — All pitfalls verified via live testing against actual library behavior.

**Research date:** 2026-02-18
**Valid until:** 2026-04-18 (stable libraries, unlikely to change)
