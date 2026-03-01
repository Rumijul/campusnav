---
phase: 16-multi-floor-data-model
plan: "02"
subsystem: types-and-seed
tags: [types, seed-data, multi-floor, campus-graph]
dependency_graph:
  requires: [16-01]
  provides: [16-03]
  affects: [src/shared/types.ts, src/server/assets/campus-graph.json, src/server/db/seed.ts]
tech_stack:
  added: []
  patterns: [RETURNING-pattern, nested-JSON-traversal, SeedGraph-local-types]
key_files:
  created: []
  modified:
    - src/shared/types.ts
    - src/server/assets/campus-graph.json
    - src/server/db/seed.ts
decisions:
  - NavGraph.buildings is the sole top-level field; nodes/edges/metadata removed from root
  - SeedGraph local type in seed.ts mirrors JSON shape; NavGraph remains the API type
  - RETURNING guard uses explicit index access with Error throw rather than destructuring to satisfy strict null checks
  - floorId is NOT in campus-graph.json nodes; seeder assigns it from RETURNING floor.id
  - onConflictDoNothing NOT used on buildings/floors inserts — nodes-count guard is idempotency mechanism
metrics:
  duration: "~4 min"
  completed_date: "2026-03-01"
  tasks_completed: 2
  files_modified: 3
---

# Phase 16 Plan 02: Multi-Floor Types and Seed Data Summary

Multi-floor TypeScript type system and seed data reformatted; `NavGraph` now uses nested `buildings → floors → nodes/edges` shape; `seed.ts` traverses the new format using RETURNING to capture FK IDs.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Update types.ts with multi-floor interfaces | 6bd546c | src/shared/types.ts |
| 2 | Reformat campus-graph.json and update seed.ts | 2a8b12c | src/server/assets/campus-graph.json, src/server/db/seed.ts |

## Final Interface Shapes

### NavNodeData (updated)
```typescript
export interface NavNodeData {
  x: number
  y: number
  label: string
  type: NavNodeType
  searchable: boolean
  floorId: number                    // replaces floor: number
  // buildingName REMOVED
  roomNumber?: string
  description?: string
  accessibilityNotes?: string
  connectsToFloorAboveId?: number    // new connector linkage fields
  connectsToFloorBelowId?: number
  connectsToNodeAboveId?: string
  connectsToNodeBelowId?: string
}
```

### NavFloor (new)
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

### NavBuilding (new)
```typescript
export interface NavBuilding {
  id: number
  name: string
  floors: NavFloor[]
}
```

### NavGraph (updated)
```typescript
export interface NavGraph {
  buildings: NavBuilding[]
  // nodes, edges, metadata removed from root
}
```

## campus-graph.json Structural Verification

```
buildings: 1
floors:    1 (under buildings[0])
nodes:     48 (under buildings[0].floors[0])
edges:     50 (under buildings[0].floors[0])
```

Node objects verified clean: 0 nodes with `floor` field, 0 nodes with `buildingName` field.

## seed.ts Changes

- Removed: `import { graphMetadata } from './schema'`
- Added: `import { buildings, floors } from './schema'`
- Added: Local `SeedGraph` type hierarchy (SeedNode, SeedEdge, SeedFloor, SeedBuilding, SeedGraph)
- Updated: Graph traversal from flat `graph.nodes` to `graph.buildings[].floors[]` loops
- Added: `RETURNING` pattern for both `buildings` and `floors` inserts to capture serial PKs
- Added: Null guard with Error throw on RETURNING results (TypeScript strict null check compliance)
- Removed: `graphMetadata` insertion block

## TypeScript Compilation Results

- `types.ts`: No errors
- `seed.ts`: No errors (after null guard fix — see Deviations)
- Downstream errors in FloorPlanCanvas.tsx, MapEditorCanvas.tsx, LandmarkSheet.tsx etc.: Expected — these are out-of-scope for Plan 02 and will be fixed in Plan 03

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript strict null check on RETURNING array destructuring**
- **Found during:** Task 2 verification
- **Issue:** `const [building] = await db.insert(...).returning(...)` — TypeScript TS18048 flags `building` as possibly undefined when used with strict null checks
- **Fix:** Changed from destructuring to explicit index access (`buildingRows[0]`) with an Error throw guard if undefined
- **Files modified:** src/server/db/seed.ts
- **Commit:** 2a8b12c (included in Task 2 commit)

## Self-Check: PASSED

Files verified:
- FOUND: src/shared/types.ts
- FOUND: src/server/assets/campus-graph.json
- FOUND: src/server/db/seed.ts

Commits verified:
- FOUND: 6bd546c (Task 1)
- FOUND: 2a8b12c (Task 2)
