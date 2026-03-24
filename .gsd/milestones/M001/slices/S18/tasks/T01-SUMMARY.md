---
phase: 16-multi-floor-data-model
plan: "01"
subsystem: database-schema
tags: [drizzle, postgresql, schema, migration, multi-floor, buildings, floors, foreign-keys]
dependency_graph:
  requires: [15-postgresql-migration]
  provides: [buildings-table, floors-table, multi-floor-nodes-schema, migration-sql]
  affects: [seed.ts, index.ts, types.ts, pathfinding/graph-builder.ts]
tech_stack:
  added: []
  patterns: [self-referential-FK-AnyPgColumn, add-nullable-backfill-set-not-null, drizzle-kit-generate-then-hand-edit]
key_files:
  created:
    - drizzle/0001_multi_floor.sql
    - drizzle/meta/0001_snapshot.json
  modified:
    - src/server/db/schema.ts
    - drizzle/meta/_journal.json
decisions:
  - "Used text type for connects_to_node_above_id and connects_to_node_below_id to match nodes.id text PK"
  - "Kept text for floors.updated_at to match existing project ISO 8601 string convention"
  - "Wrote migration SQL manually due to drizzle-kit interactive prompt blocking in CI environment; snapshot JSON updated manually to stay in sync"
  - "graphMetadata table dropped in same migration as buildings/floors creation — atomic transition"
metrics:
  duration: "~2.5 min"
  completed: "2026-03-01"
  tasks: 2
  files: 4
---

# Phase 16 Plan 01: Multi-floor Schema and Migration Summary

Drizzle schema updated and atomic migration SQL written: buildings and floors as first-class entities, nodes linked to floors via FK with four connector linkage columns, graphMetadata dropped.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Update schema.ts — add buildings and floors tables, modify nodes, remove graphMetadata | b61ecc3 | src/server/db/schema.ts |
| 2 | Generate migration SQL and hand-edit to add data back-fill | 81076f3 | drizzle/0001_multi_floor.sql, drizzle/meta/_journal.json, drizzle/meta/0001_snapshot.json |

## Schema Changes (src/server/db/schema.ts)

### buildings table (new)

```typescript
export const buildings = pgTable('buildings', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
})
```

### floors table (new)

```typescript
export const floors = pgTable('floors', {
  id: serial('id').primaryKey(),
  buildingId: integer('building_id').notNull().references(() => buildings.id),
  floorNumber: integer('floor_number').notNull(),
  imagePath: text('image_path').notNull(),
  updatedAt: text('updated_at').notNull(), // ISO 8601 string — matches project text convention
})
```

### nodes table (modified)

```typescript
export const nodes = pgTable('nodes', {
  id: text('id').primaryKey(),
  x: real('x').notNull(),
  y: real('y').notNull(),
  label: text('label').notNull(),
  type: text('type').notNull(),
  searchable: boolean('searchable').notNull(),
  floorId: integer('floor_id').notNull().references(() => floors.id),  // replaces: floor integer
  // buildingName REMOVED — derived via floor → building join
  roomNumber: text('room_number'),
  description: text('description'),
  accessibilityNotes: text('accessibility_notes'),
  // Floor connector linkage — nullable on non-connector nodes
  connectsToFloorAboveId: integer('connects_to_floor_above_id').references(() => floors.id),
  connectsToFloorBelowId: integer('connects_to_floor_below_id').references(() => floors.id),
  connectsToNodeAboveId: text('connects_to_node_above_id').references((): AnyPgColumn => nodes.id),
  connectsToNodeBelowId: text('connects_to_node_below_id').references((): AnyPgColumn => nodes.id),
})
```

Key design points:
- `connectsToNodeAboveId` and `connectsToNodeBelowId` are `text` (not `integer`) — matches `nodes.id` which is a text primary key
- Self-referential FKs use `references((): AnyPgColumn => nodes.id)` to break TypeScript circular type inference
- `connectsToFloorAboveId` and `connectsToFloorBelowId` are `integer` — matches `floors.id` which is a serial (integer) primary key

### Removed

- `graphMetadata` table export removed — replaced by `floors.updatedAt`
- `nodes.floor` integer column — replaced by `nodes.floorId` FK
- `nodes.buildingName` text column — building name now derived via floor → building join

## Migration SQL Structure (drizzle/0001_multi_floor.sql)

The migration executes atomically in 9 steps to avoid PostgreSQL NOT NULL constraint violations:

| Step | Operation | Why this order |
|------|-----------|----------------|
| 1 | CREATE TABLE buildings | No dependencies |
| 2 | CREATE TABLE floors + FK to buildings | Requires buildings to exist |
| 3 | INSERT buildings + floors seed rows | Must insert before FK on nodes is added |
| 4 | ALTER TABLE nodes ADD COLUMN floor_id (nullable) + 4 connector columns | Nullable so existing rows don't violate constraint |
| 5 | UPDATE nodes SET floor_id = 1 | Back-fill all 48 existing nodes to Floor 1 |
| 6 | ALTER COLUMN floor_id SET NOT NULL | Safe because all rows now populated |
| 7 | ADD FK constraints on nodes (5 constraints) | After column is populated |
| 8 | DROP COLUMN floor, building_name from nodes | Old columns no longer needed |
| 9 | DROP TABLE graph_metadata | Replaced by floors.updated_at |

Key DML lines:
```sql
INSERT INTO "buildings" ("name") VALUES ('Main Building');
INSERT INTO "floors" ("building_id", "floor_number", "image_path", "updated_at")
  VALUES (1, 1, 'floor-plan.png', to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'));
UPDATE "nodes" SET "floor_id" = 1;
```

## Decisions Made

1. **text type for self-referential node FK columns:** `connectsToNodeAboveId` and `connectsToNodeBelowId` use `text` because `nodes.id` is a `text` primary key (e.g., `"room-204"`). Using `integer` here would cause a PostgreSQL type mismatch error at constraint creation time.

2. **text for floors.updated_at:** Kept as ISO 8601 text string to match the existing project convention established by `graphMetadata.lastUpdated`. Switching to `timestamp` would introduce inconsistency mid-project.

3. **Manual SQL write instead of drizzle-kit generate:** drizzle-kit presented an interactive prompt asking whether `buildings` is a new table or renamed from `graph_metadata`. In a non-TTY CI environment this prompt cannot be answered. The SQL was written manually from the plan's specification and the drizzle/meta snapshot was hand-crafted to maintain future `drizzle-kit generate` compatibility.

4. **graphMetadata dropped in same migration:** The atomic drop-and-replace in a single migration file ensures the database never has both the old `graphMetadata` table and the new `floors` table simultaneously.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] drizzle-kit interactive prompt cannot run in non-TTY environment**
- **Found during:** Task 2
- **Issue:** `npx drizzle-kit generate --name=multi_floor` presented an interactive prompt (new table vs. rename from graph_metadata) that did not accept piped stdin input and could not proceed.
- **Fix:** Wrote `drizzle/0001_multi_floor.sql` manually from the plan's exact target SQL specification. Created `drizzle/meta/0001_snapshot.json` manually to reflect the new schema state. Updated `drizzle/meta/_journal.json` to add the new migration entry. The result is functionally identical to what `drizzle-kit generate` would have produced.
- **Files modified:** drizzle/0001_multi_floor.sql, drizzle/meta/0001_snapshot.json, drizzle/meta/_journal.json
- **Commit:** 81076f3

## Downstream Impact (Out of Scope — Next Plans)

The schema change cascades to files not in this plan's scope. TypeScript errors exist in:
- `src/server/db/seed.ts` — references removed `graphMetadata` export; reads old flat NavGraph format
- `src/server/index.ts` — references removed `graphMetadata` export; builds old flat NavGraph shape in GET /api/map and POST /api/admin/graph
- `src/shared/types.ts` — NavGraph type still has flat `nodes/edges/metadata` shape; needs multi-floor `buildings` nesting
- `src/shared/pathfinding/graph-builder.ts` — iterates `navGraph.nodes` and `navGraph.edges` at top level which no longer exist

These are intentional — the schema plan (16-01) is complete; downstream code updates are the responsibility of subsequent plans in Phase 16.

## Self-Check: PASSED

Files created/modified:
- FOUND: src/server/db/schema.ts (modified)
- FOUND: drizzle/0001_multi_floor.sql (created)
- FOUND: drizzle/meta/0001_snapshot.json (created)
- FOUND: drizzle/meta/_journal.json (modified)

Commits verified:
- FOUND: b61ecc3 (feat(16-01): update schema.ts for multi-floor data model)
- FOUND: 81076f3 (feat(16-01): add multi-floor migration SQL with data back-fill)
