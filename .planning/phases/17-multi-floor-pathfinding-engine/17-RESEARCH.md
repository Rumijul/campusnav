# Phase 17: Multi-floor Pathfinding Engine - Research

**Researched:** 2026-03-01
**Domain:** Graph algorithms, A* pathfinding, multi-floor navigation, turn-by-turn directions
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Cross-floor edge model:**
- Synthesize inter-floor edges inside `graph-builder.ts` (not stored in the database) — iterate connector nodes and auto-add inter-floor links using `connectsToNodeAboveId` / `connectsToNodeBelowId` already present on every stairs/elevator/ramp node
- Inter-floor edges are bidirectional (traversable up and down)
- Inter-floor edges carry a fixed constant weight (e.g. ~0.3 normalized units) — represents the cost of changing floors regardless of where the connector is positioned on the floor plan
- A* heuristic returns 0 for cross-floor node pairs — Euclidean x,y distance is meaningless between floors; returning 0 keeps the heuristic admissible

**PathResult shape:**
- `PathResult` stays unchanged — flat `nodeIds: string[]`, `segments`, `totalDistance`, `found`
- Consumers (Phase 19) derive floor context by looking up `node.floorId` on each node in the node map they already hold
- `PathfindingEngine` constructor continues to accept `NavGraph` — no change to call sites in `FloorPlanCanvas.tsx`
- `findRoute(fromId, toId, mode)` signature unchanged

**Direction steps for floor changes:**
- Floor-change instruction text format: "Take the stairs/elevator/ramp to Floor N" — uses the connector node's `type` field and the destination floor's `floorNumber`
- New `StepIcon` values: `'stairs-up'`, `'stairs-down'`, `'elevator'`, `'ramp'` — distinct per connector type and direction
- `generateDirections` receives a `floorMap: Map<number, NavFloor>` parameter (floorId → NavFloor) to look up `floorNumber` for the instruction text
- Floor transition detection: compare `nodeMap.get(currId).floorId` vs `nodeMap.get(nextId).floorId` — when they differ, emit a floor-change step instead of a bearing-based turn step

**Accessible routing:**
- Stairs remain blocked at `accessibleWeight: Infinity` in accessible mode — no last-resort fallback through stairs
- If no elevator/ramp route exists in accessible mode, return `{ found: false }` — same behavior as unreachable nodes today
- Elevator/ramp inter-floor edge weight (standard vs penalty): Claude's Discretion — a small detour penalty (e.g. 1.5× standard floor-change weight) is reasonable to avoid routing through elevators unnecessarily on flat-floor paths

### Claude's Discretion

- Exact inter-floor fixed weight constant value (suggested: ~0.3)
- Elevator/ramp accessible weight multiplier (suggested: 1.5×)
- Whether to add a `ramp` StepIcon or fold ramp into elevator icon

### Deferred Ideas (OUT OF SCOPE)

- Admin editor for setting inter-floor connector weights — Phase 18
- Student floor-tab UI to display which floor the route is on — Phase 19
- One-way stairwells (fire exits) — out of scope; no use case identified for CampusNav
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MFLR-03 | Pathfinding engine routes across floors via floor connector nodes, preferring accessible connectors for wheelchair routes | Cross-floor edge synthesis in `buildGraph`, dual-weight pattern extended to inter-floor edges, heuristic returns 0 for cross-floor pairs to preserve admissibility |
</phase_requirements>

---

## Summary

Phase 17 replaces the `flattenNavGraph` shim in `graph-builder.ts` with true cross-floor routing. The shim currently works by extracting all nodes and edges from the buildings → floors hierarchy into a single flat list and ignoring the `connectsToNodeAboveId`/`connectsToNodeBelowId` fields that were stored during Phase 16. Phase 17 changes `buildGraph` to additionally iterate over connector nodes (type: stairs, elevator, ramp) and synthesize directed bidirectional edges between paired nodes on adjacent floors, using those connector fields as the pairing mechanism.

The ngraph.path A* engine already supports everything needed: a `distance` function (used to return edge weight from link data), a `heuristic` function (used for A* search guidance), and a `blocked` function (used to exclude non-accessible edges in accessible mode). The only changes required are: (1) teach `buildGraph` to emit inter-floor edges with dual weights, (2) update the A* heuristic in `engine.ts` to return 0 when comparing nodes on different floors, (3) extend `generateDirections` with a floor-change detection branch that emits a new step type instead of a bearing-based turn, and (4) add the new `StepIcon` values. No schema changes, no API changes, no call-site changes in `FloorPlanCanvas.tsx`.

The `generateDirections` signature change (`floorMap` as a 4th parameter) is the only breaking surface: two call sites in `FloorPlanCanvas.tsx` (via `useRouteDirections`) and the test file `useRouteDirections.test.ts` must be updated to pass the new parameter. Since `NavFloor` is already part of the loaded `NavGraph`, the `floorMap` can be built from `graphState.data.buildings.flatMap(b => b.floors)` with no additional API calls.

**Primary recommendation:** Implement cross-floor edges entirely inside `buildGraph` — zero changes to ngraph.path, zero schema changes, zero API changes. The engine is closed to modification; only the graph construction layer opens.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ngraph.graph | ^20.1.2 | Graph data structure (nodes + directed links) | Already in use; `addLink(from, to, data)` accepts the same `NavEdgeData` shape for inter-floor edges |
| ngraph.path | ^1.6.1 | A* pathfinding with `distance`, `heuristic`, `blocked` callbacks | Already in use; `heuristic` returning 0 is explicitly valid and keeps search admissible |
| TypeScript | ^5.9.3 | Type safety for new `StepIcon` union and `floorMap` parameter | Already in use |
| Vitest | ^4.0.18 | Unit tests for graph-builder and pathfinding | Already in use; 40 passing tests as baseline |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Biome | ^2.4.2 | Lint + format | Run after every file change; enforces exactOptionalPropertyTypes |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Synthesizing inter-floor edges in `buildGraph` | Storing inter-floor edges in the database as regular edges | DB approach requires migration + admin UI changes; synthesis approach is zero-schema, self-documenting in the connector fields that already exist |
| Returning 0 from the heuristic for cross-floor pairs | Using floor-number difference as a heuristic component | Floor-number delta is technically admissible but requires knowing physical floor heights; returning 0 is simpler and still correct (just less guided) |
| Separate `StepIcon` values for each direction | Single `'floor-change'` icon | Directional icons (`stairs-up`, `stairs-down`) provide richer UI information with no additional logic cost |

**Installation:** No new packages required. All libraries are already installed.

---

## Architecture Patterns

### Recommended Project Structure

No new files needed. All changes touch existing files:

```
src/shared/pathfinding/
├── graph-builder.ts    # MODIFY: buildGraph synthesizes inter-floor edges; flattenNavGraph removed/replaced
└── engine.ts           # MODIFY: heuristic returns 0 for cross-floor node pairs

src/client/hooks/
├── useRouteDirections.ts       # MODIFY: StepIcon union extended; generateDirections gets floorMap param
└── useRouteDirections.test.ts  # MODIFY: new test cases; existing call sites pass empty floorMap for single-floor paths

src/shared/__tests__/
├── graph-builder.test.ts       # MODIFY: add cross-floor edge synthesis tests
├── pathfinding.test.ts         # MODIFY: add cross-floor route tests
└── fixtures/
    └── test-graph-multifloor.json   # ADD: two-floor fixture with connector nodes for cross-floor tests
```

### Pattern 1: Inter-floor Edge Synthesis in buildGraph

**What:** After adding all intra-floor nodes and edges, iterate all nodes, find those with `connectsToNodeAboveId` or `connectsToNodeBelowId`, and add a synthetic bidirectional edge between the connector pair. The edge uses `NavEdgeData` shape — same as intra-floor edges — with a fixed `standardWeight` constant and conditional `accessibleWeight`.

**When to use:** Always in `buildGraph`. The synthesis is not conditional on floor count; a single-floor graph simply has no connector nodes so no synthetic edges are added.

**Example:**
```typescript
// Source: project knowledge — extends existing buildGraph pattern
const INTER_FLOOR_WEIGHT = 0.3

// After adding all intra-floor nodes and edges:
graph.forEachNode((node) => {
  const data = node.data as NavNodeData
  // Synthesize upward link
  if (data.connectsToNodeAboveId) {
    const edgeData: NavEdgeData = {
      standardWeight: INTER_FLOOR_WEIGHT,
      accessibleWeight: data.type === 'stairs'
        ? Number.POSITIVE_INFINITY
        : INTER_FLOOR_WEIGHT * 1.5,
      accessible: data.type !== 'stairs',
      bidirectional: true,
    }
    graph.addLink(node.id, data.connectsToNodeAboveId, edgeData)
    graph.addLink(data.connectsToNodeAboveId, node.id, edgeData)
  }
  // connectsToNodeBelowId: same pattern (bidirectional covers both directions,
  // but the node above also has connectsToNodeBelowId pointing back — guard
  // against duplicate edges by checking only one direction per pair)
})
```

**Key implementation note:** Because the above adds both directions from the node that has `connectsToNodeAboveId`, and the partner node has `connectsToNodeBelowId` pointing back, iterating all nodes and naively adding from both sides would create 4 directed links for a pair that needs only 2. The solution is to synthesize only from `connectsToNodeAboveId` (one side of each pair). The floor-above node's `connectsToNodeBelowId` is the same pair — skip it to avoid duplicates. Alternatively, collect processed pairs in a `Set<string>` keyed by `${nodeA}:${nodeB}` with sorted IDs.

### Pattern 2: Heuristic Admissibility Guard for Cross-floor Pairs

**What:** The existing A* heuristic uses Euclidean distance between two nodes' normalized (x, y) coordinates. This is admissible when nodes share a coordinate space (same floor plan). Cross-floor nodes do not share a coordinate space, so Euclidean distance could overestimate the true path cost, making the heuristic inadmissible and potentially causing A* to miss the optimal path.

**When to use:** In the `PathfindingEngine` constructor, where the `heuristic` callback is defined.

**Example:**
```typescript
// Source: project knowledge — extends existing heuristic in engine.ts
heuristic: (a: Node<NavNodeData>, b: Node<NavNodeData>) => {
  if (a.data.floorId !== b.data.floorId) return 0
  return calculateWeight(a.data.x, a.data.y, b.data.x, b.data.y)
}
```

**Why returning 0 is safe:** A heuristic of 0 is always admissible — it never overestimates. With a 0 heuristic, A* degrades to Dijkstra's algorithm for cross-floor queries (still correct, slightly less guided). For same-floor queries the heuristic is unchanged.

### Pattern 3: Floor-change Step Detection in generateDirections

**What:** In the existing loop that processes intermediate nodes, before computing bearing delta, check whether the current node and next node have different `floorId` values. If they differ, emit a floor-change step instead of a bearing-based turn step.

**When to use:** Every intermediate node in the directions loop. The check is O(1) — just compare `floorId` integers.

**Example:**
```typescript
// Source: project knowledge — extends existing generateDirections loop
const currNode = nodeMap.get(currId)
const nextNode = nodeMap.get(nextId)
if (!currNode || !nextNode) continue

// Floor transition detection
if (currNode.floorId !== nextNode.floorId) {
  // nextNode is the connector destination — its floorId is the destination floor
  const destFloor = floorMap.get(nextNode.floorId)
  const floorNumber = destFloor?.floorNumber ?? nextNode.floorId
  const connectorType = currNode.type // 'stairs' | 'elevator' | 'ramp'

  // Determine direction: up or down
  const isGoingUp = nextNode.floorId > currNode.floorId // assumes floorId ordering matches physical floors
  // Note: floorId is a DB auto-increment — floors inserted bottom-to-top have ascending IDs.
  // The floorNumber field is the authoritative "floor 1, 2, 3" indicator.
  // Compare floorNumber of curr vs next floor for up/down direction.

  const icon: StepIcon = connectorType === 'elevator'
    ? 'elevator'
    : connectorType === 'ramp'
    ? 'ramp'
    : isGoingUp ? 'stairs-up' : 'stairs-down'

  const instruction = `Take the ${connectorType} to Floor ${floorNumber}`
  steps.push({ instruction, icon, distanceM: 0, durationSec: 0, isAccessibleSegment: connectorType !== 'stairs' })
  // Note: distanceM for floor-change step is 0 (fixed weight handled by A*; directions show narrative only)
  continue
}

// Existing bearing logic for same-floor steps...
```

**Important:** The direction determination (up vs down) should use `floorNumber` from `floorMap`, not `floorId` (DB auto-increment). Look up both current and destination floor by `floorId` from `floorMap`, then compare their `floorNumber` values.

### Pattern 4: floorMap Construction in FloorPlanCanvas.tsx

**What:** Build the `floorMap` from the already-loaded `NavGraph` so `generateDirections` can look up `floorNumber` by `floorId`.

**When to use:** In `FloorPlanCanvas.tsx`, computed with `useMemo` alongside the existing `nodeMap`.

**Example:**
```typescript
// Source: project knowledge — FloorPlanCanvas.tsx pattern
const floorMap = useMemo<Map<number, NavFloor>>(() => {
  if (graphState.status !== 'loaded') return new Map()
  return new Map(
    graphState.data.buildings.flatMap((b) => b.floors).map((f) => [f.id, f])
  )
}, [graphState])
```

Then pass to `useRouteDirections`:
```typescript
const standardDirections = useRouteDirections(routeResult?.standard ?? null, nodeMap, 'standard', floorMap)
const accessibleDirections = useRouteDirections(routeResult?.accessible ?? null, nodeMap, 'accessible', floorMap)
```

### Anti-Patterns to Avoid

- **Duplicate inter-floor edges:** Synthesizing from both `connectsToNodeAboveId` AND `connectsToNodeBelowId` on each node creates 4 directed links for a pair that needs 2. Use a deduplication strategy (only synthesize from one side, or track processed pairs in a Set).
- **Overestimating cross-floor heuristic:** Do not use `floorId` difference × some constant as a heuristic component unless you can guarantee it never exceeds the true path cost. Returning 0 is the safe choice.
- **Storing inter-floor edges in the database:** Breaks the invariant that graph edges represent surveyed physical paths on a floor plan. Inter-floor cost is a routing abstraction, not a surveyed measurement.
- **Changing `PathResult` shape:** Downstream consumers (RouteLayer, DirectionsSheet, FloorPlanCanvas) all destructure `PathResult` directly. Any shape change would cascade widely.
- **Using `floorId` for up/down direction:** `floorId` is a DB auto-increment that happens to be ascending if floors were inserted bottom-to-top, but this is not guaranteed. Use `floorNumber` from `NavFloor` for the canonical "which is higher" comparison.
- **Breaking existing 40-test baseline:** All new tests must be additive. Existing tests must not require changes unless the signature change (`floorMap` param) forces it — and that change is backward-compatible by making `floorMap` an optional parameter defaulting to an empty map.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| A* with blocked edges | Custom edge-blocking A* | ngraph.path `blocked` callback | Already implemented for stairs in `accessibleFinder`; just extend the same callback |
| Graph node iteration for inter-floor synthesis | Manual loops over `navGraph.buildings` | `graph.forEachNode()` after adding all nodes, or iterate `navGraph` before creating graph | Both work; iterating `navGraph` before graph creation is simpler and avoids ngraph API dependency |
| Heuristic admissibility proof | Custom admissibility analysis | Return 0 (always admissible by definition) | Mathematically sound; no analysis needed |

**Key insight:** The entire implementation is graph construction and heuristic adjustment — no new algorithms, no new libraries, no new data structures. The hard part is correctness (deduplication, direction detection, admissibility) not complexity.

---

## Common Pitfalls

### Pitfall 1: Duplicate Inter-floor Edge Synthesis

**What goes wrong:** The connector node on Floor 1 has `connectsToNodeAboveId = 'stairs-f2'`. The connector node on Floor 2 has `connectsToNodeBelowId = 'stairs-f1'`. If both nodes trigger synthesis, ngraph.graph gets 4 directed links for the same pair, causing A* to find the "right" path but `getLink` to return one of the duplicates arbitrarily — breaking segment distance calculation.

**Why it happens:** Naive iteration over all nodes applies the synthesis rule to both ends of each pair.

**How to avoid:** Only synthesize from `connectsToNodeAboveId` (i.e., only synthesize the "going up" direction for each pair). The `connectsToNodeBelowId` field is informational — used by directions to detect floor transitions and by the admin editor (Phase 18), not for edge synthesis. Alternatively, track a `Set<string>` of already-added pairs: `new Set([sortedIds].join(':'))`.

**Warning signs:** `graph.getLinksCount()` after `buildGraph` is more than expected; A* returns correct paths but segment distances are doubled.

### Pitfall 2: floorId vs floorNumber for Up/Down Direction

**What goes wrong:** Using `nextNode.floorId > currNode.floorId` to determine "going up" works only if floors were inserted into the database in physical order. If the admin later adds a basement floor with a higher `floorId` than the ground floor, the direction detection inverts.

**Why it happens:** `floorId` is a `SERIAL`/auto-increment database primary key, not a semantic floor ordering field. `floorNumber` is the semantic field (1 = ground, 2 = second, etc.).

**How to avoid:** Look up both floors in `floorMap` by `floorId`, then compare their `floorNumber` values: `floorMap.get(currNode.floorId)?.floorNumber` vs `floorMap.get(nextNode.floorId)?.floorNumber`.

**Warning signs:** Directions say "stairs down" when the user is going up; detected by looking at `floorNumber` of consecutive nodes in the path.

### Pitfall 3: Accessible Mode Returns Wrong Result When No Elevator Exists

**What goes wrong:** If an accessible route is requested but only stairs connect two floors, ngraph.path returns a path of length 1 (just the target node). The engine checks `rawPath.length <= 1` and returns `{ found: false }`. This is correct behavior per the locked decision — but callers must not assume that a standard route found implies an accessible route found.

**Why it happens:** Already-correct behavior in the engine; risk is in tests that check for accessible route without verifying that the fixture graph has an accessible inter-floor connector.

**How to avoid:** Test fixtures for accessible-mode cross-floor tests must include an elevator or ramp connector. Test fixtures for "no accessible route" must explicitly use only stairs connectors and assert `{ found: false }`.

**Warning signs:** Test passes on a graph that accidentally has an accessible connector; deleting the connector exposes the bug.

### Pitfall 4: generateDirections Call Sites Need floorMap

**What goes wrong:** Adding `floorMap` as a required 4th parameter to `generateDirections` breaks every existing call site: the hook `useRouteDirections`, tests in `useRouteDirections.test.ts`, and any direct calls.

**Why it happens:** TypeScript will catch this at compile time (`tsc --noEmit`), but if `floorMap` is optional (with a default empty map), existing single-floor behavior is preserved silently — floor-change steps simply never fire because the cross-floor guard only fires when `currNode.floorId !== nextNode.floorId`, which never happens in single-floor fixtures.

**How to avoid:** Make `floorMap` optional with a default of `new Map()`. Update `useRouteDirections` hook to accept and pass through the parameter. Update call sites in `FloorPlanCanvas.tsx` to pass the real `floorMap`. Update test file call sites to either pass an empty map or a populated fixture map for new cross-floor tests.

**Warning signs:** TypeScript errors on `generateDirections` call sites; or floor-change steps never appearing in directions despite cross-floor routes being found.

### Pitfall 5: flattenNavGraph Removal Side Effects

**What goes wrong:** `flattenNavGraph` is exported and used in the admin editor (`MapEditorCanvas.tsx`) for single-floor flattening when loading graph state for editing.

**Why it happens:** The admin editor (Phase 16-03 comment) explicitly flattens NavGraph on load and wraps flat state into single-building NavGraph on save. `flattenNavGraph` is referenced in that flow.

**How to avoid:** Check admin editor usage before removing `flattenNavGraph`. Per the locked decisions, `flattenNavGraph` is the "replacement target" inside `buildGraph` — but the export itself may still be used by the admin editor. Do not remove the export; change `buildGraph` to no longer call `flattenNavGraph` (instead using a local iteration), and keep `flattenNavGraph` exported for the admin editor's use.

**Warning signs:** TypeScript error in `MapEditorCanvas.tsx` or its related hooks after removing the `flattenNavGraph` export.

---

## Code Examples

Verified patterns from existing codebase and ngraph.path docs:

### Existing buildGraph Pattern (to understand before extending)

```typescript
// Source: src/shared/pathfinding/graph-builder.ts
export function buildGraph(navGraph: NavGraph): Graph<NavNodeData, NavEdgeData> {
  const graph = createGraph<NavNodeData, NavEdgeData>()
  const { nodes, edges } = flattenNavGraph(navGraph)  // <-- THIS IS REPLACED

  for (const { id, ...data } of nodes) {
    graph.addNode(id, data)
  }

  for (const { id: _id, sourceId, targetId, ...data } of edges) {
    const edgeData: NavEdgeData = data.accessible
      ? data
      : { ...data, accessibleWeight: Number.POSITIVE_INFINITY }
    graph.addLink(sourceId, targetId, edgeData)
    if (edgeData.bidirectional) {
      graph.addLink(targetId, sourceId, edgeData)
    }
  }

  return graph
}
```

### ngraph.path heuristic returning 0 (confirmed valid from Context7)

```typescript
// Source: https://github.com/anvaka/ngraph.path/blob/main/README.md
// A heuristic of 0 degrades A* to Dijkstra — always correct, always admissible
let pathFinder = aStar(graph, {
  distance(fromNode, toNode, link) {
    return link.data.weight;
  },
  heuristic(fromNode, toNode) {
    // returning 0 is valid — A* becomes Dijkstra for these node pairs
    return 0;
  }
});
```

### ngraph.path blocked callback (confirmed valid from Context7)

```typescript
// Source: https://github.com/anvaka/ngraph.path/blob/main/README.md
let pathFinder = path.aStar(graph, {
  blocked(fromNode, toNode, link) {
    return link.data.disruption;  // return true to block this link
  },
});
// In our case: blocked = !link.data.accessible (already in accessibleFinder)
```

### Existing heuristic in engine.ts (to be updated)

```typescript
// Source: src/shared/pathfinding/engine.ts
heuristic: (a: Node<NavNodeData>, b: Node<NavNodeData>) =>
  calculateWeight(a.data.x, a.data.y, b.data.x, b.data.y),
// After Phase 17:
heuristic: (a: Node<NavNodeData>, b: Node<NavNodeData>) =>
  a.data.floorId === b.data.floorId
    ? calculateWeight(a.data.x, a.data.y, b.data.x, b.data.y)
    : 0,
```

### Two-floor Test Fixture Shape

```json
{
  "buildings": [{
    "id": 1,
    "name": "Test Building",
    "floors": [
      {
        "id": 1, "floorNumber": 1, "imagePath": "floor1.png", "updatedAt": "...",
        "nodes": [
          { "id": "entrance", "x": 0.1, "y": 0.5, "type": "entrance", "floorId": 1, ... },
          { "id": "stairs-f1", "x": 0.5, "y": 0.5, "type": "stairs", "floorId": 1,
            "connectsToNodeAboveId": "stairs-f2", "connectsToFloorAboveId": 2, ... },
          { "id": "elevator-f1", "x": 0.6, "y": 0.5, "type": "elevator", "floorId": 1,
            "connectsToNodeAboveId": "elevator-f2", "connectsToFloorAboveId": 2, ... }
        ],
        "edges": [
          { "id": "e1", "sourceId": "entrance", "targetId": "stairs-f1",
            "standardWeight": 0.4, "accessibleWeight": 0.4, "accessible": true, "bidirectional": true },
          { "id": "e2", "sourceId": "entrance", "targetId": "elevator-f1",
            "standardWeight": 0.5, "accessibleWeight": 0.5, "accessible": true, "bidirectional": true }
        ]
      },
      {
        "id": 2, "floorNumber": 2, "imagePath": "floor2.png", "updatedAt": "...",
        "nodes": [
          { "id": "stairs-f2", "x": 0.5, "y": 0.5, "type": "stairs", "floorId": 2,
            "connectsToNodeBelowId": "stairs-f1", "connectsToFloorBelowId": 1, ... },
          { "id": "elevator-f2", "x": 0.6, "y": 0.5, "type": "elevator", "floorId": 2,
            "connectsToNodeBelowId": "elevator-f1", "connectsToFloorBelowId": 1, ... },
          { "id": "room-201", "x": 0.9, "y": 0.5, "type": "room", "floorId": 2, "label": "Room 201", ... }
        ],
        "edges": [
          { "id": "e3", "sourceId": "stairs-f2", "targetId": "room-201",
            "standardWeight": 0.4, "accessibleWeight": 1e10, "accessible": false, "bidirectional": true },
          { "id": "e4", "sourceId": "elevator-f2", "targetId": "room-201",
            "standardWeight": 0.3, "accessibleWeight": 0.3, "accessible": true, "bidirectional": true }
        ]
      }
    ]
  }]
}
```

### generateDirections signature update

```typescript
// Source: src/client/hooks/useRouteDirections.ts — existing signature
export function generateDirections(
  nodeIds: string[],
  nodeMap: Map<string, NavNode>,
  mode: 'standard' | 'accessible',
): DirectionsResult

// After Phase 17:
export function generateDirections(
  nodeIds: string[],
  nodeMap: Map<string, NavNode>,
  mode: 'standard' | 'accessible',
  floorMap: Map<number, NavFloor> = new Map(),  // optional, defaults to empty (single-floor compat)
): DirectionsResult
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `flattenNavGraph` shim in `buildGraph` | Direct iteration of `navGraph.buildings` with inter-floor edge synthesis | Phase 17 | `buildGraph` becomes truly multi-floor aware; shim is eliminated from `buildGraph` but export preserved for admin editor |
| Single `heuristic` using Euclidean for all nodes | Heuristic returns 0 for cross-floor pairs | Phase 17 | Admissibility maintained; cross-floor queries run as Dijkstra |
| `StepIcon` union without floor-change types | `StepIcon` extended with `'stairs-up' \| 'stairs-down' \| 'elevator' \| 'ramp'` | Phase 17 | `DirectionsSheet` gains richer icon vocabulary for Phase 19 rendering |
| `generateDirections` with 3 params | `generateDirections` with 4 params (optional `floorMap`) | Phase 17 | Backward-compatible; single-floor paths unaffected |

**Deprecated/outdated:**
- `flattenNavGraph` as a `buildGraph` internal: replaced by direct `navGraph.buildings` traversal inside `buildGraph`. The exported function itself is NOT deprecated — admin editor uses it.

---

## Open Questions

1. **Is `connectsToNodeBelowId` set on nodes when `connectsToNodeAboveId` is also available?**
   - What we know: Both fields are defined on `NavNodeData`. Seed data (Phase 16) may only populate one direction.
   - What's unclear: Whether the seed and admin editor populate both `connectsToNodeAboveId` AND `connectsToNodeBelowId` symmetrically, or only one per node.
   - Recommendation: Implement synthesis using only `connectsToNodeAboveId` (synthesize only the "upward" pair). This avoids needing both directions to be populated and avoids duplicate edge risk. Verify with the Phase 16 seed data during implementation.

2. **Does `flattenNavGraph` appear in MapEditorCanvas.tsx or related admin hooks?**
   - What we know: Phase 16-03 decision notes "Admin editor flattens NavGraph on load." The export is from `graph-builder.ts`.
   - What's unclear: Whether the import is in `MapEditorCanvas.tsx` directly or in an admin-specific hook.
   - Recommendation: Grep for `flattenNavGraph` in `src/client/pages/admin/` before modifying its export signature. Keep it exported unchanged.

3. **Exact inter-floor weight value (Claude's Discretion: ~0.3)**
   - What we know: Intra-floor edge weights are Euclidean distances in 0–1 normalized coordinates. A hallway crossing (e.g. 0.3 units) is a typical step. The floor-change cost should feel comparable to walking a moderate distance.
   - Recommendation: Use `INTER_FLOOR_WEIGHT = 0.3` as a named constant in `graph-builder.ts`. For elevator/ramp in standard mode: same `0.3`. In accessible mode with elevator/ramp: `0.3 * 1.5 = 0.45`. In accessible mode with stairs: `Infinity`.

4. **Ramp: separate StepIcon or folded into elevator?**
   - What we know: `ramp` is an existing `NavNodeType`. CONTEXT.md gives this as Claude's Discretion.
   - Recommendation: Add `'ramp'` as a distinct `StepIcon` value. Cost: one extra union member and one extra case in `DirectionsSheet` icon map (Phase 19 concern). Benefit: semantically distinct from elevator for accessibility communication. The instruction text can be "Take the ramp to Floor N" which is more accurate than "Take the elevator."

---

## Sources

### Primary (HIGH confidence)

- `/anvaka/ngraph.path` (Context7) — heuristic returning 0 is valid, `blocked` callback signature, `distance` from link data
- `src/shared/pathfinding/graph-builder.ts` — exact `buildGraph` and `flattenNavGraph` implementation being modified
- `src/shared/pathfinding/engine.ts` — exact heuristic callbacks being updated
- `src/client/hooks/useRouteDirections.ts` — exact `generateDirections` signature and loop structure being extended
- `src/shared/types.ts` — `NavNodeData` fields (`floorId`, `connectsToNodeAboveId`, `connectsToNodeBelowId`), `NavFloor` shape
- `src/shared/__tests__/pathfinding.test.ts` and `graph-builder.test.ts` — 40 passing baseline tests; fixture shapes documented

### Secondary (MEDIUM confidence)

- `src/client/components/FloorPlanCanvas.tsx` — `useRouteDirections` call sites at lines 81–86; `nodeMap` construction pattern at lines 76–78

### Tertiary (LOW confidence)

- None required. All implementation details are derivable from the existing codebase.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries, all existing tools verified in codebase
- Architecture: HIGH — all patterns extend existing verified code; ngraph.path API confirmed via Context7
- Pitfalls: HIGH — derived from actual code inspection (flattenNavGraph export usage, connector field asymmetry, bidirectional dedup risk)

**Research date:** 2026-03-01
**Valid until:** 2026-04-01 (stable domain — pathfinding algorithm and ngraph API are stable)
