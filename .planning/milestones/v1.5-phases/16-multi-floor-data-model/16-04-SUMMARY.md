---
phase: 16-multi-floor-data-model
plan: "04"
subsystem: database
tags: [postgresql, drizzle, migration, seed, multi-floor, verification]

# Dependency graph
requires:
  - phase: 16-03
    provides: GET /api/map multi-floor NavGraph, flattenNavGraph shim, POST /api/admin/graph updated
  - phase: 16-02
    provides: NavGraph nested type, campus-graph.json multi-floor format, seed.ts updated
  - phase: 16-01
    provides: buildings/floors tables, 0001_multi_floor.sql migration, schema.ts updated
provides:
  - Human-verified end-to-end confirmation that multi-floor data model works against live PostgreSQL
  - MFLR-01, MFLR-02, CAMP-01 requirements satisfied
affects: [17-multi-floor-pathfinding, 18-admin-multi-floor-editor, 19-student-floor-tab-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "seed.ts queries existing building by name before inserting — prevents duplicates when migration pre-populates buildings table"

key-files:
  created: []
  modified:
    - src/server/seed.ts

key-decisions:
  - "seed.ts reuses existing building from migration by SELECT-before-INSERT — migration pre-creates Main Building (ID 1), seed must not duplicate it"

patterns-established:
  - "Migration + seed coexistence: migration owns DDL and reference data; seed must SELECT first and only INSERT if absent"

requirements-completed: [MFLR-01, MFLR-02, CAMP-01]

# Metrics
duration: 0min (checkpoint only — human verification)
completed: 2026-03-01
---

# Phase 16 Plan 04: Multi-floor Data Model Human Verification Summary

**End-to-end verification of multi-floor PostgreSQL schema: migration runs, seed inserts 48 nodes under buildings/floors hierarchy, GET /api/map returns nested NavGraph, both floor-plan endpoints return 200**

## Performance

- **Duration:** 0 min (checkpoint plan — no auto tasks)
- **Started:** 2026-03-01T06:52:59Z
- **Completed:** 2026-03-01T06:54:00Z
- **Tasks:** 1 (human-verify checkpoint)
- **Files modified:** 1 (seed.ts — bug fix during verification)

## Accomplishments

- All 6 verification checks passed on live Docker PostgreSQL database
- GET /api/map confirmed returning `{ "buildings": 1, "floors": 1, "nodes": 48 }` with no top-level `nodes`/`edges`/`metadata` keys
- GET /api/floor-plan/1/1 (parametric) and GET /api/floor-plan/image (legacy) both return 200
- Server restart confirmed idempotent: `[seed] Already seeded (48 nodes) — skipping` on second boot
- Student map renders at http://localhost:3001 with no console errors
- Seed duplicate-building bug discovered and fixed during verification (commit `23b6a6b`)

## Verification Results

| Check | Description | Result |
|-------|-------------|--------|
| 1 | Server starts, migration applied, seed inserts 48 nodes | PASSED |
| 2 | GET /api/map returns `{buildings:1, floors:1, nodes:48}`, keys=`["buildings"]` | PASSED |
| 3 | GET /api/floor-plan/1/1 returns 200 | PASSED |
| 4 | GET /api/floor-plan/image (legacy) returns 200 | PASSED |
| 5 | Server restart: seed guard fires, no duplicate inserts | PASSED |
| 6 | Student map loads at localhost:3001 with no console errors | PASSED |

## Task Commits

This plan is a human-verify checkpoint — no auto task commits. A bug fix was committed during verification:

1. **Bug fix (found during verification):** `23b6a6b` fix(seed): reuse existing building from migration instead of inserting duplicate

## Files Created/Modified

- `src/server/seed.ts` — Fixed to query existing building by name before inserting; migration pre-populates `Main Building` (ID 1), seed must reuse it rather than insert a second row (ID 2) that would leave buildings[0] empty

## Decisions Made

- seed.ts must SELECT-before-INSERT for buildings: the 0001_multi_floor.sql migration pre-creates "Main Building" as a reference data row. If seed.ts unconditionally inserts, it creates a second building (ID 2) with all 48 nodes, leaving the migration's building (ID 1) empty — so GET /api/map returns buildings[0] with zero nodes. Fix: query by name first and reuse the existing ID.

## Deviations from Plan

### Auto-fixed Issues (fixed by human during verification, committed separately)

**1. [Rule 1 - Bug] Duplicate building insertion causing buildings[0] to be empty**
- **Found during:** Human verification check 2 (GET /api/map node count)
- **Issue:** Migration SQL inserted "Main Building" (ID 1) as reference data. seed.ts then inserted a second "Main Building" (ID 2) with all 48 nodes attached. GET /api/map returned buildings[0] (the migration row) with zero nodes instead of 48.
- **Fix:** seed.ts now queries for an existing building by name (`SELECT id FROM buildings WHERE name = ?`) and reuses that ID before inserting. Only inserts if no existing building found.
- **Files modified:** `src/server/seed.ts`
- **Verification:** GET /api/map returns `{ "buildings": 1, "floors": 1, "nodes": 48 }` after fix; idempotent restart logs `[seed] Already seeded (48 nodes) — skipping`
- **Commit:** `23b6a6b` fix(seed): reuse existing building from migration instead of inserting duplicate

---

**Total deviations:** 1 (Rule 1 - Bug — fixed during human verification)
**Impact on plan:** Necessary correctness fix. Without it GET /api/map would always return 0 nodes on fresh databases seeded with the migration pre-populating buildings.

## Issues Encountered

The migration + seed separation created a data ownership ambiguity: migration owns DDL and reference data (buildings/floors rows), but seed.ts was written to insert its own building row. The fix establishes a clear pattern: migration owns reference data, seed checks for existing rows before inserting.

## User Setup Required

None - no external service configuration required beyond Docker PostgreSQL already running.

## Next Phase Readiness

- Phase 16 complete: multi-floor PostgreSQL schema is live, verified, and stable
- Phase 17 (Multi-floor Pathfinding Engine) can now depend on the buildings/floors/nodes hierarchy
- The `flattenNavGraph` shim in graph-builder.ts is the planned replacement target for Phase 17
- Requirements MFLR-01, MFLR-02, CAMP-01 satisfied

---
*Phase: 16-multi-floor-data-model*
*Completed: 2026-03-01*
