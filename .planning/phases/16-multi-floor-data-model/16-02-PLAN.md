---
phase: 16-multi-floor-data-model
plan: 02
type: execute
wave: 2
depends_on:
  - 16-01
files_modified:
  - src/shared/types.ts
  - src/server/assets/campus-graph.json
  - src/server/db/seed.ts
autonomous: true
requirements:
  - MFLR-01
  - MFLR-02
  - CAMP-01

must_haves:
  truths:
    - "NavGraph type is nested: buildings → floors → nodes/edges (not flat)"
    - "NavNodeData has floorId (number) replacing floor; buildingName removed"
    - "NavBuilding and NavFloor interfaces exported from types.ts"
    - "NavNodeData has four optional connector linkage fields for stairs/elevator/ramp nodes"
    - "campus-graph.json uses the new nested buildings format with Floor 1 wrapping all 48 nodes"
    - "seedIfEmpty() reads the new multi-floor JSON format and inserts buildings → floors → nodes → edges using RETURNING to capture IDs"
  artifacts:
    - path: "src/shared/types.ts"
      provides: "Multi-floor TypeScript type definitions"
      exports: ["NavBuilding", "NavFloor", "NavGraph", "NavNodeData", "NavNode", "NavEdge", "NavEdgeData", "NavNodeType"]
      contains: "NavGraph = { buildings: NavBuilding[] }"
    - path: "src/server/assets/campus-graph.json"
      provides: "Multi-floor seed data with 48 nodes nested under Main Building / Floor 1"
      contains: "buildings array with one building containing one floor containing nodes and edges arrays"
    - path: "src/server/db/seed.ts"
      provides: "Updated seeder that reads multi-floor JSON and inserts with RETURNING pattern"
      contains: "db.insert(buildings).values(...).returning(), db.insert(floors).values(...).returning()"
  key_links:
    - from: "src/server/db/seed.ts"
      to: "src/shared/types.ts"
      via: "SeedGraph local type mirrors NavGraph nested structure"
      pattern: "buildings.*floors.*nodes.*edges"
    - from: "src/server/db/seed.ts"
      to: "src/server/db/schema.ts"
      via: "imports buildings, floors, nodes, edges from schema"
      pattern: "import.*buildings.*floors.*from.*schema"
    - from: "src/server/assets/campus-graph.json"
      to: "src/server/db/seed.ts"
      via: "seedIfEmpty reads the JSON at startup"
      pattern: "campus-graph\\.json"
---

<objective>
Update the shared TypeScript types to the multi-floor shape, reformat the seed data file, and update the seeder to write buildings → floors → nodes → edges in dependency order.

Purpose: After Plan 01 creates the new database schema, this plan aligns the application's type system and seed data with that schema. Plan 03 (API + pathfinding) depends on these types compiling correctly.

Output:
- `src/shared/types.ts` — new NavBuilding, NavFloor interfaces; updated NavGraph, NavNodeData
- `src/server/assets/campus-graph.json` — reformatted to nested multi-floor structure
- `src/server/db/seed.ts` — updated to traverse the new JSON format and use RETURNING for FK ID capture
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

<interfaces>
<!-- Current types.ts — target state to replace -->
From src/shared/types.ts (CURRENT, being replaced):
```typescript
export interface NavNodeData {
  x: number; y: number; label: string; type: NavNodeType; searchable: boolean
  floor: number           // <-- being replaced by floorId: number
  roomNumber?: string; description?: string
  buildingName?: string   // <-- being removed
  accessibilityNotes?: string
}
export interface NavGraph {
  nodes: NavNode[]
  edges: NavEdge[]
  metadata: { buildingName: string; floor: number; lastUpdated: string }
}
```

<!-- Current campus-graph.json (flat, single-floor) -->
From src/server/assets/campus-graph.json (CURRENT, being reformatted):
```json
{
  "nodes": [{ "id": "...", "x": 0.93, "y": 0.20, "label": "...", "type": "entrance", "searchable": true, "floor": 1 }, ...],
  "edges": [{ "id": "...", "sourceId": "...", "targetId": "...", "standardWeight": 0.05, "accessibleWeight": 0.05, "accessible": true, "bidirectional": true }],
  "metadata": { "buildingName": "Main Building", "floor": 1, "lastUpdated": "..." }
}
```

<!-- Current seed.ts imports and patterns being updated -->
From src/server/db/seed.ts (CURRENT):
```typescript
import { edges, graphMetadata, nodes } from './schema'
// reads graph.nodes (flat array), graph.edges (flat array), graph.metadata
```

<!-- New schema exports available from Plan 01 -->
From src/server/db/schema.ts (after Plan 01):
```typescript
export const buildings = pgTable('buildings', { id: serial, name: text })
export const floors = pgTable('floors', { id: serial, buildingId: integer, floorNumber: integer, imagePath: text, updatedAt: text })
export const nodes = pgTable('nodes', {
  id: text, x: real, y: real, label: text, type: text, searchable: boolean,
  floorId: integer,  // FK → floors.id
  roomNumber: text, description: text, accessibilityNotes: text,
  connectsToFloorAboveId: integer, connectsToFloorBelowId: integer,
  connectsToNodeAboveId: text, connectsToNodeBelowId: text
})
export const edges = pgTable('edges', { ... /* unchanged */ })
// graphMetadata REMOVED
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Update src/shared/types.ts — add NavBuilding, NavFloor; update NavGraph and NavNodeData</name>
  <files>src/shared/types.ts</files>
  <action>
Rewrite the serialization types section of src/shared/types.ts to reflect the multi-floor nested shape. Keep the NavNodeType union, NavEdgeData interface, NavNode, and NavEdge types intact (they need minimal or no changes). The main changes are to NavNodeData and NavGraph.

**Changes required:**

1. **Update NavNodeData** — replace `floor: number` with `floorId: number`, remove `buildingName?: string`, add four optional connector linkage fields:
   ```typescript
   export interface NavNodeData {
     x: number
     y: number
     label: string
     type: NavNodeType
     searchable: boolean
     /** ID of the floors record this node belongs to (FK → floors.id) */
     floorId: number
     // buildingName REMOVED — derived transitively via floor → building
     roomNumber?: string
     description?: string
     accessibilityNotes?: string
     // Floor connector linkage — only set on stairs, elevator, ramp nodes
     connectsToFloorAboveId?: number
     connectsToFloorBelowId?: number
     connectsToNodeAboveId?: string
     connectsToNodeBelowId?: string
   }
   ```

2. **Add NavFloor interface** (new, in the Serialization Types section):
   ```typescript
   export interface NavFloor {
     id: number
     floorNumber: number
     imagePath: string
     updatedAt: string
     nodes: NavNode[]
     edges: NavEdge[]
   }
   ```

3. **Add NavBuilding interface** (new, in the Serialization Types section):
   ```typescript
   export interface NavBuilding {
     id: number
     name: string
     floors: NavFloor[]
   }
   ```

4. **Update NavGraph** — replace flat shape with nested buildings structure:
   ```typescript
   export interface NavGraph {
     buildings: NavBuilding[]
     // nodes and edges now live under buildings[].floors[].nodes/edges
     // metadata replaced by floors[].updatedAt
   }
   ```
   Remove the old `nodes`, `edges`, and `metadata` top-level fields.

5. **NavNode and NavEdge** — these extend NavNodeData and NavEdgeData respectively. NavNode is `interface NavNode extends NavNodeData { id: string }`. Since NavNodeData now has `floorId` instead of `floor`, NavNode inherits the new field automatically. No direct change to NavNode or NavEdge definitions needed.

Update the file-level JSDoc comment to reflect that NavGraph now uses the nested buildings structure, and that `NavNode` objects live inside `NavFloor.nodes[]`.
  </action>
  <verify>
    <automated>cd C:/Users/admin/Desktop/projects/campusnav && npx tsc --noEmit 2>&1 | grep "types.ts" | head -20 || echo "types.ts: no type errors"</automated>
  </verify>
  <done>types.ts exports NavBuilding, NavFloor with the exact interfaces above. NavGraph.buildings is the only top-level field. NavNodeData has floorId (number) and no buildingName. tsc --noEmit reports no errors in types.ts itself (downstream errors in index.ts, seed.ts, graph-builder.ts are expected and fixed in Plans 02 Task 2 and Plan 03).</done>
</task>

<task type="auto">
  <name>Task 2: Reformat campus-graph.json and update seed.ts for multi-floor format</name>
  <files>src/server/assets/campus-graph.json, src/server/db/seed.ts</files>
  <action>
These two files must be updated together — the JSON format change and the seeder that reads it are tightly coupled.

**Part A — campus-graph.json:**

Reformat the file from the flat single-floor shape to the nested multi-floor shape. The 48 existing nodes and all existing edges move inside `buildings[0].floors[0]`. Individual node objects drop their `floor` and `buildingName` fields (now implicit from nesting). The top-level `metadata` object is removed.

Target structure:
```json
{
  "buildings": [
    {
      "id": 1,
      "name": "Main Building",
      "floors": [
        {
          "floorNumber": 1,
          "imagePath": "floor-plan.png",
          "nodes": [
            {
              "id": "room-new-node-1771677125414",
              "x": 0.9327003751002229,
              "y": 0.20166337728180692,
              "label": "Private Area Entrance",
              "type": "entrance",
              "searchable": true
            }
            ... (all 48 nodes, WITHOUT "floor" or "buildingName" fields)
          ],
          "edges": [
            ... (all edges — UNCHANGED content, just relocated under floors[0])
          ]
        }
      ]
    }
  ]
}
```

Rules for the node objects in the reformatted JSON:
- Remove `"floor": 1` from each node object (now implicit from nesting position)
- Remove `"buildingName": "Main Building"` if present on any nodes
- Keep all other node fields: id, x, y, label, type, searchable, roomNumber, description, accessibilityNotes
- Do NOT add `floorId` to the JSON — the seeder will assign it from the RETURNING value

**Part B — seed.ts:**

Rewrite `seedIfEmpty()` to traverse the new nested JSON structure. Key changes:

1. **Update imports** — remove `graphMetadata` from schema import, add `buildings` and `floors`:
   ```typescript
   import { buildings, edges, floors, nodes } from './schema'
   ```

2. **Define local SeedGraph types** matching the new JSON format:
   ```typescript
   type SeedNode = { id: string; x: number; y: number; label: string; type: string; searchable: boolean; roomNumber?: string; description?: string; accessibilityNotes?: string }
   type SeedEdge = { id: string; sourceId: string; targetId: string; standardWeight: number; accessibleWeight: number; accessible: boolean; bidirectional: boolean; accessibilityNotes?: string }
   type SeedFloor = { floorNumber: number; imagePath: string; nodes: SeedNode[]; edges: SeedEdge[] }
   type SeedBuilding = { id: number; name: string; floors: SeedFloor[] }
   type SeedGraph = { buildings: SeedBuilding[] }
   ```

3. **Update the guard check** — the existing `db.select().from(nodes)` check remains valid; no change needed.

4. **Update how the graph file is parsed** — change `const graph: NavGraph = ...` to `const graph: SeedGraph = ...` (NavGraph is now the API type, SeedGraph is the simpler seed-file type).

5. **Update the insertion logic** — iterate `graph.buildings` → `building.floors`, using RETURNING to capture auto-generated serial IDs:
   ```typescript
   for (const b of graph.buildings) {
     const [building] = await db.insert(buildings).values({ name: b.name }).returning({ id: buildings.id })

     for (const f of b.floors) {
       const [floor] = await db.insert(floors).values({
         buildingId: building.id,
         floorNumber: f.floorNumber,
         imagePath: f.imagePath,
         updatedAt: new Date().toISOString(),
       }).returning({ id: floors.id })

       await db.insert(nodes).values(
         f.nodes.map((n) => ({
           id: n.id,
           x: n.x,
           y: n.y,
           label: n.label,
           type: n.type,
           searchable: n.searchable,
           floorId: floor.id,  // assigned from RETURNING
           roomNumber: n.roomNumber ?? null,
           description: n.description ?? null,
           accessibilityNotes: n.accessibilityNotes ?? null,
           // connector linkage defaults to null for all seed nodes (none are cross-floor yet)
           connectsToFloorAboveId: null,
           connectsToFloorBelowId: null,
           connectsToNodeAboveId: null,
           connectsToNodeBelowId: null,
         }))
       ).onConflictDoNothing()

       await db.insert(edges).values(
         f.edges.map((e) => ({
           id: e.id,
           sourceId: e.sourceId,
           targetId: e.targetId,
           standardWeight: e.standardWeight,
           accessibleWeight: e.accessibleWeight,
           accessible: e.accessible,
           bidirectional: e.bidirectional,
           accessibilityNotes: e.accessibilityNotes ?? null,
         }))
       ).onConflictDoNothing()
     }
   }

   // Count total nodes inserted for the log message
   const totalNodes = graph.buildings.reduce((sum, b) => sum + b.floors.reduce((s, f) => s + f.nodes.length, 0), 0)
   const totalEdges = graph.buildings.reduce((sum, b) => sum + b.floors.reduce((s, f) => s + f.edges.length, 0), 0)
   console.log(`[seed] Inserted ${totalNodes} nodes, ${totalEdges} edges`)
   ```

6. **Remove graphMetadata insertion** — the old `db.insert(graphMetadata).values(...)` block is gone. No replacement needed.

CRITICAL: The `onConflictDoNothing()` for buildings and floors inserts must NOT be used — if a building/floor is already seeded, the `nodes` count check at the top of `seedIfEmpty()` will return early before reaching these inserts. Using `onConflictDoNothing()` on the buildings/floors insert could silently skip the RETURNING value, causing `floor.id` to be undefined. The existing nodes-count guard is the idempotency mechanism.

After writing both files, run `npx tsc --noEmit` and confirm seed.ts has no errors related to the old `floor`, `buildingName`, or `graphMetadata` references.
  </action>
  <verify>
    <automated>cd C:/Users/admin/Desktop/projects/campusnav && node -e "const g = JSON.parse(require('fs').readFileSync('src/server/assets/campus-graph.json','utf-8')); console.log('buildings:', g.buildings.length, 'floors:', g.buildings[0].floors.length, 'nodes:', g.buildings[0].floors[0].nodes.length, 'edges:', g.buildings[0].floors[0].edges.length)" && npx tsc --noEmit 2>&1 | grep "seed.ts" | head -10 || echo "seed.ts: no type errors"</automated>
  </verify>
  <done>campus-graph.json has 1 building, 1 floor, 48 nodes, and edges count matching original. Each node object has no "floor" or "buildingName" field. seed.ts compiles without errors referencing graphMetadata or the old flat floor field.</done>
</task>

</tasks>

<verification>
After both tasks complete:
1. `npx tsc --noEmit` reports no errors in types.ts or seed.ts
2. `node -e "const g = JSON.parse(require('fs').readFileSync('src/server/assets/campus-graph.json','utf-8')); console.log(g.buildings[0].floors[0].nodes.length)"` prints `48`
3. types.ts exports: NavBuilding, NavFloor, NavGraph (buildings only), NavNodeData (floorId, no buildingName/floor), NavNode, NavEdge, NavEdgeData, NavNodeType
4. seed.ts imports buildings and floors from schema; does not reference graphMetadata
</verification>

<success_criteria>
- NavGraph.buildings is the only top-level field (no nodes/edges/metadata at root)
- NavNodeData.floorId: number replaces floor: number; buildingName removed
- campus-graph.json: 48 nodes nested under buildings[0].floors[0].nodes
- seed.ts: uses RETURNING to capture floor.id before inserting nodes
- TypeScript compiles without errors in types.ts and seed.ts
</success_criteria>

<output>
After completion, create `.planning/phases/16-multi-floor-data-model/16-02-SUMMARY.md` documenting:
- Final NavGraph, NavBuilding, NavFloor interface shapes
- campus-graph.json structural verification (node count confirmed)
- Any TypeScript errors encountered and how resolved
</output>
