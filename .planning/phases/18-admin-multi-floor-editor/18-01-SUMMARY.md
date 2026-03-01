---
phase: 18-admin-multi-floor-editor
plan: 01
subsystem: database
tags: [drizzle, postgresql, schema, migration, typescript]

# Dependency graph
requires:
  - phase: 16-multi-floor-data-model
    provides: nodes table with floor connector columns and buildings/floors FK structure
provides:
  - connectsToBuildingId nullable integer FK on nodes table (DB schema + migration)
  - connectsToBuildingId optional field on NavNodeData TypeScript interface
  - GET /api/map passes connectsToBuildingId through when non-null
  - POST /api/admin/graph saves connectsToBuildingId when provided
affects: [18-02, 18-03, 18-04, 18-05]

# Tech tracking
tech-stack:
  added: []
  patterns: [drizzle-kit generate for migration-first schema changes, conditional spread for nullable FK fields in API mapping]

key-files:
  created:
    - drizzle/0002_campus_entrance_bridge.sql
    - drizzle/meta/0002_snapshot.json
  modified:
    - src/server/db/schema.ts
    - src/shared/types.ts
    - src/server/index.ts
    - drizzle/meta/_journal.json

key-decisions:
  - "connectsToBuildingId on nodes references buildings.id nullable — campus entrance nodes only; non-entrance nodes leave it null"
  - "Renamed auto-generated migration from 0002_melodic_richard_fisk.sql to 0002_campus_entrance_bridge.sql per plan spec; updated _journal.json tag accordingly"
  - "Conditional spread pattern ...(n.connectsToBuildingId != null && { connectsToBuildingId }) matches existing nullable FK fields for GET /api/map"

patterns-established:
  - "nullable FK column pattern: integer('column').references(() => table.id) with no .notNull() for optional cross-domain bridges"
  - "API node mapping: conditional spread for each nullable field keeps JSON lean (no explicit nulls in response)"

requirements-completed: [MFLR-04, CAMP-02, CAMP-03, CAMP-04]

# Metrics
duration: 2min
completed: 2026-03-01
---

# Phase 18 Plan 01: Campus Entrance Bridge Schema Summary

**Drizzle migration adding connects_to_building_id nullable FK to nodes table, with TypeScript type update and API passthrough for campus-to-building bridge links**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-01T15:30:39Z
- **Completed:** 2026-03-01T15:32:31Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Added `connectsToBuildingId` nullable integer FK column to nodes table in Drizzle schema (references buildings.id)
- Added optional `connectsToBuildingId?: number` field to `NavNodeData` TypeScript interface with JSDoc comment
- Generated Drizzle migration `0002_campus_entrance_bridge.sql` with ALTER TABLE and FK constraint
- Updated GET /api/map node mapping to include `connectsToBuildingId` via conditional spread when non-null
- Updated POST /api/admin/graph node insert to save `connectsToBuildingId: n.connectsToBuildingId ?? null`

## Task Commits

Each task was committed atomically:

1. **Task 1: Add connectsToBuildingId to DB schema and types** - `a5e3c45` (feat)
2. **Task 2: Generate Drizzle migration and update GET /api/map** - `c7aa1a8` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/server/db/schema.ts` - Added `connectsToBuildingId: integer('connects_to_building_id').references(() => buildings.id)` to nodes table
- `src/shared/types.ts` - Added `connectsToBuildingId?: number` to NavNodeData interface with JSDoc
- `drizzle/0002_campus_entrance_bridge.sql` - ALTER TABLE "nodes" ADD COLUMN + FK constraint to buildings
- `drizzle/meta/_journal.json` - Updated tag from auto-generated name to `0002_campus_entrance_bridge`
- `drizzle/meta/0002_snapshot.json` - Drizzle schema snapshot for migration tracking
- `src/server/index.ts` - GET /api/map conditional spread + POST /api/admin/graph insert for connectsToBuildingId

## Decisions Made
- Renamed auto-generated migration `0002_melodic_richard_fisk.sql` to `0002_campus_entrance_bridge.sql` per plan spec; updated `_journal.json` tag to match — Drizzle uses tag from journal at apply time, not filename, so this is safe
- `connectsToBuildingId` is nullable (no `.notNull()`) — only entrance nodes on campus map will have this set; all other nodes leave it null
- Snapshot index numbers are not affected by rename; only the tag string in `_journal.json` needed updating

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required. The migration runs automatically on server startup via `drizzle-orm/postgres-js/migrator`.

## Next Phase Readiness
- Data contracts complete — all subsequent Phase 18 plans can reference `connectsToBuildingId` in schema, types, and API
- Migration will run on next server startup, adding the column to live PostgreSQL database
- No blockers

---
*Phase: 18-admin-multi-floor-editor*
*Completed: 2026-03-01*
