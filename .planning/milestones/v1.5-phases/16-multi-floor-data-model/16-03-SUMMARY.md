---
phase: 16-multi-floor-data-model
plan: 03
subsystem: api
tags: [hono, drizzle-orm, postgres, typescript, pathfinding, navgraph]

requires:
  - phase: 16-02
    provides: NavGraph multi-floor types (NavBuilding, NavFloor) and updated seed.ts
  - phase: 16-01
    provides: buildings/floors/nodes/edges PostgreSQL schema with Drizzle ORM

provides:
  - GET /api/map returns NavGraph { buildings[].floors[].nodes/edges } from four-table JOIN
  - POST /api/admin/graph accepts multi-floor NavGraph and saves via FK-safe delete/re-insert transaction
  - GET /api/floor-plan/:buildingId/:floorNumber serves per-floor images from floors.imagePath
  - flattenNavGraph shim in graph-builder.ts makes pathfinding engine compile against new NavGraph type
  - All NavGraph type consumers updated to new buildings-nested shape

affects:
  - 17-cross-floor-pathfinding
  - client/components (FloorPlanCanvas, LandmarkSheet, LocationDetailSheet)
  - admin editor (MapEditorCanvas, importExport)

tech-stack:
  added: []
  patterns:
    - "Multi-table parallel fetch: Promise.all([buildings, floors, nodes, edges]) then in-memory Map assembly"
    - "FK-safe delete order: edges → nodes → floors → buildings before re-insert"
    - "Shim pattern: flattenNavGraph as Phase 17 replacement target, documented with comment"
    - "Admin editor flattens NavGraph on load, wraps flat state into NavGraph on save"

key-files:
  created: []
  modified:
    - src/server/index.ts
    - src/shared/pathfinding/graph-builder.ts
    - src/shared/__tests__/fixtures/test-graph.json
    - src/shared/__tests__/graph-builder.test.ts
    - src/shared/__tests__/pathfinding.test.ts
    - src/client/hooks/useRouteDirections.test.ts
    - src/client/components/FloorPlanCanvas.tsx
    - src/client/components/admin/NodeDataTable.tsx
    - src/client/components/LandmarkSheet.tsx
    - src/client/components/LocationDetailSheet.tsx
    - src/client/pages/admin/MapEditorCanvas.tsx
    - src/client/utils/importExport.ts

key-decisions:
  - "flattenNavGraph documented as Phase 17 replacement target — shim keeps engine compiling without cross-floor routing"
  - "Edges assigned to source node's floor for GET /api/map response assembly (edges not directly floor-scoped in DB)"
  - "Admin editor maintains flat nodes/edges state internally; flattens on load, wraps into single-building NavGraph on save"
  - "Rule 3 auto-fixes applied to all NavGraph type consumers broken by Plan 02 type changes"

patterns-established:
  - "NavGraph load pattern: flatMap buildings → floors → nodes/edges for flat consumer state"
  - "NavGraph save pattern: wrap flat nodes/edges in buildings[0].floors[0] envelope"

requirements-completed:
  - MFLR-01
  - MFLR-02
  - CAMP-01

duration: 5min
completed: 2026-03-01
---

# Phase 16 Plan 03: Multi-Floor API Handlers and Pathfinding Shim Summary

**GET /api/map, POST /api/admin/graph, and GET /api/floor-plan/:buildingId/:floorNumber updated for multi-floor NavGraph shape; flattenNavGraph shim added so existing pathfinding engine compiles; all NavGraph type consumers updated project-wide**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-01T06:45:11Z
- **Completed:** 2026-03-01T06:50:00Z
- **Tasks:** 2 (+ 1 auto-fix batch for Rule 3 blocking issues)
- **Files modified:** 13

## Accomplishments

- GET /api/map now queries all four tables (buildings, floors, nodes, edges) in parallel and assembles `NavGraph { buildings: [...floors: [...nodes/edges]] }`
- POST /api/admin/graph validates `graph.buildings`, deletes in FK-safe order (edges → nodes → floors → buildings), and re-inserts iterating `buildings[].floors[]`
- New GET /api/floor-plan/:buildingId/:floorNumber reads `floors.imagePath` from the database and serves the image; placed before the legacy `/image` route to preserve backward compatibility
- `flattenNavGraph` exported from graph-builder.ts — iterates `navGraph.buildings[].floors[]` and collects all nodes and edges into flat arrays; `buildGraph` calls it internally
- Full project TypeScript compilation is zero errors after updating 11 additional consumer files that referenced the old flat NavGraph shape

## Task Commits

Each task was committed atomically:

1. **Task 1: Update index.ts API handlers** - `1050bec` (feat)
2. **Task 2: Add flattenNavGraph shim + fix all NavGraph type consumers** - `31d8f04` (feat)

## Files Created/Modified

- `src/server/index.ts` - GET /api/map multi-floor handler; POST /api/admin/graph; new parametric floor plan endpoint; buildings/floors/and/eq imports; graphMetadata removed
- `src/shared/pathfinding/graph-builder.ts` - flattenNavGraph utility + updated buildGraph
- `src/shared/__tests__/fixtures/test-graph.json` - Converted from flat to buildings/floors/nodes/edges nested format
- `src/shared/__tests__/graph-builder.test.ts` - Updated node data assertion from `floor` to `floorId`
- `src/shared/__tests__/pathfinding.test.ts` - generateGridGraph updated to return buildings-nested NavGraph
- `src/client/hooks/useRouteDirections.test.ts` - makeNode uses `floorId` not `floor`
- `src/client/components/FloorPlanCanvas.tsx` - nodes/nodeMap derived by flatMapping `navGraph.buildings`
- `src/client/components/admin/NodeDataTable.tsx` - sort and display `floorId` instead of `floor`
- `src/client/components/LandmarkSheet.tsx` - removed `buildingName` (no longer on NavNode), display `floorId`
- `src/client/components/LocationDetailSheet.tsx` - removed `buildingName`, display `floorId`
- `src/client/pages/admin/MapEditorCanvas.tsx` - flatten on load; `floorId: 1` on new nodes; wrap flat state in NavGraph on save
- `src/client/utils/importExport.ts` - Zod schema, exportJson, exportNodesCsv, parseNodesCsv all updated to `floorId` and multi-floor NavGraph shape

## Decisions Made

- Edges are assigned to source node's floor for GET /api/map response assembly since edges are not directly floor-scoped in the database
- `flattenNavGraph` explicitly documented as a Phase 17 replacement target — cross-floor routing will replace this shim with proper floor connector logic
- Admin editor maintains flat `NavNode[]`/`NavEdge[]` state internally to avoid rewriting the entire editor state machine; it wraps the state into a single-building NavGraph only at save time
- Rule 3 auto-fixes (blocking compilation failures in consumer files) were applied in the Task 2 commit — all caused by the NavGraph type change in Plan 02

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] TypeScript errors in 10 consumer files referencing old NavGraph shape**
- **Found during:** Task 2 (running `npx tsc --noEmit` after updating graph-builder.ts)
- **Issue:** Plan 02 changed NavGraph from flat `{ nodes, edges, metadata }` to nested `{ buildings[].floors[] }` but did not update the ~10 consumer files that reference `navGraph.nodes`, `navGraph.edges`, `node.floor`, or `node.buildingName`. These caused 25+ TypeScript compilation errors across the project.
- **Fix:** Updated all 10 consumer files (test fixtures, test files, React components, admin editor, importExport utility) to use the new NavGraph shape and `floorId` instead of `floor`.
- **Files modified:** test-graph.json, graph-builder.test.ts, pathfinding.test.ts, useRouteDirections.test.ts, FloorPlanCanvas.tsx, NodeDataTable.tsx, LandmarkSheet.tsx, LocationDetailSheet.tsx, MapEditorCanvas.tsx, importExport.ts
- **Verification:** `npx tsc --noEmit` exits with zero errors across the full project
- **Committed in:** `31d8f04` (Task 2 commit)

---

**Total deviations:** 1 auto-fix batch (Rule 3 blocking, 10 files)
**Impact on plan:** Required for the plan's stated success criterion of zero TypeScript errors. No scope creep — all fixes were direct consequences of the Plan 02 type change.

## Issues Encountered

- TypeScript strict null checks flagged that Drizzle `.returning()` destructuring could yield undefined on the first element. Fixed by collecting the full array and using explicit `!` assertion after a guard throw — matching the pattern established in Plan 02's seed.ts.

## GET /api/map Response Shape

```typescript
{
  buildings: [
    {
      id: 1,
      name: "Main Building",
      floors: [
        {
          id: 1,
          floorNumber: 1,
          imagePath: "floor-plan.png",
          updatedAt: "2026-01-01T00:00:00Z",
          nodes: [ { id, x, y, label, type, searchable, floorId, ...optional } ],
          edges: [ { id, sourceId, targetId, standardWeight, accessibleWeight, accessible, bidirectional } ]
        }
      ]
    }
  ]
}
```

## Schema Imports in index.ts (Confirmed)

```typescript
import { buildings, edges, floors, nodes } from './db/schema'
// graphMetadata: REMOVED (table dropped in Plan 01)
```

## flattenNavGraph Implementation

```typescript
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

## tsc --noEmit Result

Zero errors across the full project (schema.ts, types.ts, seed.ts, index.ts, graph-builder.ts, engine.ts, and all client components and tests).

## Next Phase Readiness

- Full stack compiles and is ready for Phase 17 cross-floor pathfinding implementation
- `flattenNavGraph` is the documented replacement target — Phase 17 will swap it for logic that properly traverses floor connector nodes and inter-floor edges
- The admin editor currently hard-codes `floorId: 1` for new nodes and wraps saves in a single-floor NavGraph — Phase 17 will introduce multi-floor editing UI

---
*Phase: 16-multi-floor-data-model*
*Completed: 2026-03-01*
