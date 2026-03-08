---
phase: 16-multi-floor-data-model
plan: 03
type: execute
wave: 3
depends_on:
  - 16-02
files_modified:
  - src/server/index.ts
  - src/shared/pathfinding/graph-builder.ts
autonomous: true
requirements:
  - MFLR-01
  - MFLR-02
  - CAMP-01

must_haves:
  truths:
    - "GET /api/map returns a NavGraph with buildings → floors → nodes/edges nested structure"
    - "POST /api/admin/graph accepts and saves the new NavGraph shape, iterating buildings[].floors[] to insert nodes and edges"
    - "The pathfinding engine compiles and runs against the new NavGraph type via a flattenNavGraph shim"
    - "GET /api/floor-plan/:buildingId/:floorNumber serves per-floor images read from floors.imagePath; old /api/floor-plan/image alias still works"
  artifacts:
    - path: "src/server/index.ts"
      provides: "Updated API handlers for multi-floor NavGraph shape and parametric floor plan image endpoint"
      contains: "GET /api/floor-plan/:buildingId/:floorNumber, updated GET /api/map JOIN query, updated POST /api/admin/graph"
    - path: "src/shared/pathfinding/graph-builder.ts"
      provides: "flattenNavGraph utility shim that makes existing pathfinding compile against new NavGraph type"
      contains: "flattenNavGraph function iterating buildings[].floors[].nodes/edges"
  key_links:
    - from: "src/server/index.ts GET /api/map"
      to: "buildings, floors, nodes, edges tables"
      via: "Drizzle JOIN queries assembled into NavGraph { buildings: [...] } response"
      pattern: "db\\.select.*from.*buildings|JOIN.*floors|JOIN.*nodes"
    - from: "src/server/index.ts POST /api/admin/graph"
      to: "buildings, floors, nodes, edges tables"
      via: "Drizzle transaction deletes and re-inserts, iterating graph.buildings[].floors[]"
      pattern: "graph\\.buildings.*floors.*nodes"
    - from: "src/shared/pathfinding/graph-builder.ts buildGraph"
      to: "flattenNavGraph"
      via: "buildGraph calls flattenNavGraph to get flat nodes/edges before building ngraph"
      pattern: "flattenNavGraph.*navGraph"
---

<objective>
Update the API handlers in index.ts to serve the new multi-floor NavGraph shape, and add a flattenNavGraph shim to graph-builder.ts so the pathfinding engine compiles against the new NavGraph type without cross-floor logic changes (that is Phase 17's work).

Purpose: Plan 02 established the types; this plan wires the database → API → client and engine paths. After this plan the full stack compiles and the server can start with the migrated schema.

Output:
- `src/server/index.ts` — GET /api/map returns multi-floor NavGraph; POST /api/admin/graph handles the new shape; new GET /api/floor-plan/:buildingId/:floorNumber endpoint added
- `src/shared/pathfinding/graph-builder.ts` — flattenNavGraph shim keeps engine compiling without cross-floor logic
</objective>

<execution_context>
@C:/Users/admin/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/admin/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/phases/16-multi-floor-data-model/16-CONTEXT.md
@.planning/phases/16-multi-floor-data-model/16-RESEARCH.md
@.planning/phases/16-multi-floor-data-model/16-01-SUMMARY.md
@.planning/phases/16-multi-floor-data-model/16-02-SUMMARY.md

<interfaces>
<!-- New types from Plan 02 — executor should use these directly -->
From src/shared/types.ts (after Plan 02):
```typescript
export interface NavNodeData {
  x: number; y: number; label: string; type: NavNodeType; searchable: boolean
  floorId: number                 // FK → floors.id
  roomNumber?: string; description?: string; accessibilityNotes?: string
  connectsToFloorAboveId?: number; connectsToFloorBelowId?: number
  connectsToNodeAboveId?: string;  connectsToNodeBelowId?: string
}
export interface NavNode extends NavNodeData { id: string }
export interface NavFloor { id: number; floorNumber: number; imagePath: string; updatedAt: string; nodes: NavNode[]; edges: NavEdge[] }
export interface NavBuilding { id: number; name: string; floors: NavFloor[] }
export interface NavGraph { buildings: NavBuilding[] }
```

<!-- Schema exports from Plan 01 — for Drizzle queries -->
From src/server/db/schema.ts (after Plan 01):
```typescript
export const buildings = pgTable('buildings', { id: serial, name: text })
export const floors = pgTable('floors', { id: serial, buildingId: integer, floorNumber: integer, imagePath: text, updatedAt: text })
export const nodes = pgTable('nodes', {
  id: text, x: real, y: real, label: text, type: text, searchable: boolean,
  floorId: integer,
  roomNumber: text, description: text, accessibilityNotes: text,
  connectsToFloorAboveId: integer, connectsToFloorBelowId: integer,
  connectsToNodeAboveId: text, connectsToNodeBelowId: text
})
export const edges = pgTable('edges', { id: text, sourceId: text, targetId: text, standardWeight: real, accessibleWeight: real, accessible: boolean, bidirectional: boolean, accessibilityNotes: text })
// graphMetadata: REMOVED
```

<!-- Current graph-builder.ts that accesses navGraph.nodes and navGraph.edges (flat) — these no longer exist -->
From src/shared/pathfinding/graph-builder.ts (CURRENT, needs shim):
```typescript
export function buildGraph(navGraph: NavGraph): Graph<NavNodeData, NavEdgeData> {
  for (const { id, ...data } of navGraph.nodes) { ... }   // BREAKS — .nodes no longer exists
  for (const { id: _id, sourceId, targetId, ...data } of navGraph.edges) { ... }  // BREAKS
}
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Update index.ts — GET /api/map, POST /api/admin/graph, add GET /api/floor-plan/:buildingId/:floorNumber</name>
  <files>src/server/index.ts</files>
  <action>
Update the three API handlers in src/server/index.ts to work with the new multi-floor schema and types.

**Change 1 — Imports:**
- Remove `graphMetadata` from the schema import line.
- Add `buildings` and `floors` to the schema import:
  ```typescript
  import { buildings, edges, floors, nodes } from './db/schema'
  ```

**Change 2 — GET /api/map (lines ~74–119):**

Replace the current handler (which queries nodes, edges, and graphMetadata separately and builds a flat NavGraph) with one that queries all four tables and assembles the nested structure.

Strategy: Query all four tables in parallel with `Promise.all`, then assemble in-memory using Maps for O(n) lookup.

```typescript
app.get('/api/map', async (c) => {
  try {
    const [buildingRows, floorRows, nodeRows, edgeRows] = await Promise.all([
      db.select().from(buildings),
      db.select().from(floors),
      db.select().from(nodes),
      db.select().from(edges),
    ])

    if (buildingRows.length === 0) return c.json({ error: 'Graph data not found' }, 404)

    // Group nodes and edges by floorId for efficient assembly
    const nodesByFloor = new Map<number, typeof nodeRows>()
    for (const n of nodeRows) {
      if (!nodesByFloor.has(n.floorId)) nodesByFloor.set(n.floorId, [])
      nodesByFloor.get(n.floorId)!.push(n)
    }
    // Note: edges are not currently floor-scoped in the DB; assign to source node's floor
    const edgesByFloor = new Map<number, typeof edgeRows>()
    const nodeFloorMap = new Map(nodeRows.map(n => [n.id, n.floorId]))
    for (const e of edgeRows) {
      const floorId = nodeFloorMap.get(e.sourceId)
      if (floorId !== undefined) {
        if (!edgesByFloor.has(floorId)) edgesByFloor.set(floorId, [])
        edgesByFloor.get(floorId)!.push(e)
      }
    }

    // Group floors by buildingId
    const floorsByBuilding = new Map<number, typeof floorRows>()
    for (const f of floorRows) {
      if (!floorsByBuilding.has(f.buildingId)) floorsByBuilding.set(f.buildingId, [])
      floorsByBuilding.get(f.buildingId)!.push(f)
    }

    const graph: NavGraph = {
      buildings: buildingRows.map((b) => ({
        id: b.id,
        name: b.name,
        floors: (floorsByBuilding.get(b.id) ?? []).map((f) => ({
          id: f.id,
          floorNumber: f.floorNumber,
          imagePath: f.imagePath,
          updatedAt: f.updatedAt,
          nodes: (nodesByFloor.get(f.id) ?? []).map((n) => ({
            id: n.id,
            x: n.x,
            y: n.y,
            label: n.label,
            type: n.type as NavNode['type'],
            searchable: n.searchable,
            floorId: n.floorId,
            ...(n.roomNumber != null && { roomNumber: n.roomNumber }),
            ...(n.description != null && { description: n.description }),
            ...(n.accessibilityNotes != null && { accessibilityNotes: n.accessibilityNotes }),
            ...(n.connectsToFloorAboveId != null && { connectsToFloorAboveId: n.connectsToFloorAboveId }),
            ...(n.connectsToFloorBelowId != null && { connectsToFloorBelowId: n.connectsToFloorBelowId }),
            ...(n.connectsToNodeAboveId != null && { connectsToNodeAboveId: n.connectsToNodeAboveId }),
            ...(n.connectsToNodeBelowId != null && { connectsToNodeBelowId: n.connectsToNodeBelowId }),
          })),
          edges: (edgesByFloor.get(f.id) ?? []).map((e) => ({
            id: e.id,
            sourceId: e.sourceId,
            targetId: e.targetId,
            standardWeight: e.standardWeight,
            accessibleWeight: e.accessibleWeight,
            accessible: e.accessible,
            bidirectional: e.bidirectional,
            ...(e.accessibilityNotes != null && { accessibilityNotes: e.accessibilityNotes }),
          })),
        })),
      })),
    }

    c.header('Cache-Control', 'public, max-age=60')
    return c.json(graph)
  } catch (_err) {
    return c.json({ error: 'Failed to load graph data' }, 500)
  }
})
```

Import `NavNode` type from `@shared/types` if needed for the type cast.

**Change 3 — POST /api/admin/graph (lines ~134–194):**

Replace the handler body. The validation changes from `Array.isArray(graph.nodes)` to checking `Array.isArray(graph.buildings)`. The transaction now deletes all floors (which cascade isn't guaranteed — delete in FK-safe order) and re-inserts via the nested buildings structure.

```typescript
app.post('/api/admin/graph', async (c) => {
  try {
    const graph = (await c.req.json()) as NavGraph
    if (!Array.isArray(graph.buildings)) {
      return c.json({ error: 'Invalid graph data' }, 400)
    }

    await db.transaction(async (tx) => {
      // Delete in FK-safe order (nodes → edges → floors → buildings)
      await tx.delete(edges)
      await tx.delete(nodes)
      await tx.delete(floors)
      await tx.delete(buildings)

      for (const b of graph.buildings) {
        const [building] = await tx.insert(buildings).values({ name: b.name }).returning({ id: buildings.id })

        for (const f of b.floors) {
          const [floor] = await tx.insert(floors).values({
            buildingId: building.id,
            floorNumber: f.floorNumber,
            imagePath: f.imagePath,
            updatedAt: new Date().toISOString(),
          }).returning({ id: floors.id })

          for (const n of f.nodes) {
            await tx.insert(nodes).values({
              id: n.id, x: n.x, y: n.y, label: n.label, type: n.type,
              searchable: n.searchable, floorId: floor.id,
              roomNumber: n.roomNumber ?? null,
              description: n.description ?? null,
              accessibilityNotes: n.accessibilityNotes ?? null,
              connectsToFloorAboveId: n.connectsToFloorAboveId ?? null,
              connectsToFloorBelowId: n.connectsToFloorBelowId ?? null,
              connectsToNodeAboveId: n.connectsToNodeAboveId ?? null,
              connectsToNodeBelowId: n.connectsToNodeBelowId ?? null,
            })
          }

          for (const e of f.edges) {
            await tx.insert(edges).values({
              id: e.id, sourceId: e.sourceId, targetId: e.targetId,
              standardWeight: e.standardWeight, accessibleWeight: e.accessibleWeight,
              accessible: e.accessible, bidirectional: e.bidirectional,
              accessibilityNotes: e.accessibilityNotes ?? null,
            })
          }
        }
      }
    })

    return c.json({ ok: true })
  } catch (err) {
    console.error('Graph save failed:', err)
    return c.json({ error: 'Failed to save graph' }, 500)
  }
})
```

**Change 4 — Add GET /api/floor-plan/:buildingId/:floorNumber (new endpoint):**

Add this endpoint BEFORE the existing `GET /api/floor-plan/image` endpoint to ensure the parametric route doesn't shadow the static one:

```typescript
/** Serve the floor plan image for a specific building and floor. */
app.get('/api/floor-plan/:buildingId/:floorNumber', async (c) => {
  try {
    const buildingId = Number(c.req.param('buildingId'))
    const floorNumber = Number(c.req.param('floorNumber'))
    if (Number.isNaN(buildingId) || Number.isNaN(floorNumber)) {
      return c.json({ error: 'Invalid building or floor number' }, 400)
    }

    const [floorRow] = await db
      .select({ imagePath: floors.imagePath })
      .from(floors)
      .where(
        // Use Drizzle eq from 'drizzle-orm'
        // floors.buildingId = buildingId AND floors.floorNumber = floorNumber
        and(eq(floors.buildingId, buildingId), eq(floors.floorNumber, floorNumber))
      )
      .limit(1)

    if (!floorRow) return c.json({ error: 'Floor not found' }, 404)

    const filePath = resolve(__dirname, 'assets', floorRow.imagePath)
    const buffer = await readFile(filePath)
    // Detect content type from extension
    const ext = floorRow.imagePath.split('.').pop()?.toLowerCase()
    const contentType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png'
    c.header('Content-Type', contentType)
    c.header('Cache-Control', 'public, max-age=3600')
    return c.body(buffer)
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException).code
    if (code === 'ENOENT') return c.json({ error: 'Floor plan image not found' }, 404)
    return c.json({ error: 'Failed to read floor plan' }, 500)
  }
})
```

Add `and`, `eq` to the import from `drizzle-orm`:
```typescript
import { and, eq } from 'drizzle-orm'
```

Keep the existing `GET /api/floor-plan/image` and `GET /api/floor-plan/thumbnail` endpoints UNCHANGED — they remain as backward-compatible aliases for Floor 1 of Building 1.

After all changes, run `npx tsc --noEmit` and confirm no errors in index.ts.
  </action>
  <verify>
    <automated>cd C:/Users/admin/Desktop/projects/campusnav && npx tsc --noEmit 2>&1 | grep "index.ts" | head -20 || echo "index.ts: no type errors"</automated>
  </verify>
  <done>index.ts compiles without type errors. GET /api/map handler references graph.buildings (not graph.nodes/graph.metadata). POST /api/admin/graph validates graph.buildings. New parametric floor plan endpoint exists at /api/floor-plan/:buildingId/:floorNumber. graphMetadata import removed from schema import line.</done>
</task>

<task type="auto">
  <name>Task 2: Add flattenNavGraph shim to graph-builder.ts so pathfinding engine compiles</name>
  <files>src/shared/pathfinding/graph-builder.ts</files>
  <action>
The `buildGraph` function currently iterates `navGraph.nodes` and `navGraph.edges` directly. After Plan 02, these top-level arrays no longer exist on `NavGraph` — data now lives in `navGraph.buildings[].floors[].nodes/edges`. The function must be updated to compile.

The approach: add a `flattenNavGraph` utility that extracts a flat `{ nodes, edges }` view from the nested structure. This is the minimal shim that keeps Phase 16 compiling without implementing cross-floor pathfinding (Phase 17's responsibility). Document clearly that Phase 17 will replace this shim with actual cross-floor routing logic.

**Changes to graph-builder.ts:**

1. **Add import** for NavFloor if needed (it's already part of NavGraph type — no explicit import needed beyond what's already imported from `@shared/types`). Add `NavNode` and `NavEdge` to the imports from `@shared/types` if not already imported.

2. **Add `flattenNavGraph` function** before `buildGraph`:

```typescript
/**
 * Flattens a multi-floor NavGraph into a single list of nodes and edges.
 *
 * Phase 16 compatibility shim: the pathfinding engine was written for a flat
 * NavGraph. This function extracts all nodes and edges across all buildings and
 * floors so the existing engine continues to work for single-floor routing.
 *
 * Phase 17 will replace this shim with cross-floor routing logic that properly
 * handles floor connector nodes and inter-floor edges.
 */
export function flattenNavGraph(navGraph: NavGraph): { nodes: NavNode[]; edges: NavEdge[] } {
  const nodes: NavNode[] = []
  const edges: NavEdge[] = []
  for (const building of navGraph.buildings) {
    for (const floor of building.floors) {
      nodes.push(...floor.nodes)
      edges.push(...floor.edges)
    }
  }
  return { nodes, edges }
}
```

3. **Update `buildGraph`** to use the shim:

```typescript
export function buildGraph(navGraph: NavGraph): Graph<NavNodeData, NavEdgeData> {
  const graph = createGraph<NavNodeData, NavEdgeData>()
  const { nodes, edges } = flattenNavGraph(navGraph)

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

Note: The `data` spread from `NavNode` will include `floorId` and the optional connector fields. The `NavNodeData` interface now includes these fields, so there is no type mismatch — they pass through as node data in the ngraph instance. The pathfinding engine uses only `x`, `y`, and weight fields for routing; extra fields are harmless.

After updating graph-builder.ts, run `npx tsc --noEmit` and confirm the full project compiles cleanly — no errors in graph-builder.ts, engine.ts, types.ts, schema.ts, seed.ts, or index.ts.
  </action>
  <verify>
    <automated>cd C:/Users/admin/Desktop/projects/campusnav && npx tsc --noEmit 2>&1 | head -30 && echo "--- tsc exit ---"</automated>
  </verify>
  <done>npx tsc --noEmit exits with no errors across the entire project. graph-builder.ts exports flattenNavGraph. buildGraph calls flattenNavGraph internally and iterates the flattened nodes/edges arrays.</done>
</task>

</tasks>

<verification>
After both tasks complete:
1. `npx tsc --noEmit` — zero errors across the full project (schema.ts, types.ts, seed.ts, index.ts, graph-builder.ts)
2. `grep "graph.buildings" src/server/index.ts` — confirms GET /api/map and POST /api/admin/graph both reference the new shape
3. `grep "flattenNavGraph" src/shared/pathfinding/graph-builder.ts` — confirms the shim exists
4. `grep "graphMetadata" src/server/index.ts` — returns empty (old reference removed)
5. `grep "floor-plan/:buildingId" src/server/index.ts` — confirms parametric endpoint exists
</verification>

<success_criteria>
- Full project TypeScript compilation is clean (zero errors)
- GET /api/map assembles NavGraph with buildings → floors → nodes/edges nesting
- POST /api/admin/graph iterates graph.buildings[].floors[] to save data
- GET /api/floor-plan/:buildingId/:floorNumber reads imagePath from floors table and serves the file
- flattenNavGraph documented as Phase 17 replacement target
</success_criteria>

<output>
After completion, create `.planning/phases/16-multi-floor-data-model/16-03-SUMMARY.md` documenting:
- Final shape of GET /api/map response (NavGraph structure)
- List of all schema imports in index.ts (confirming graphMetadata removed)
- flattenNavGraph implementation confirmation
- tsc --noEmit result (zero errors or any remaining issues)
</output>
