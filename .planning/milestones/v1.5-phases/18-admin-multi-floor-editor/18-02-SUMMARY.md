---
phase: 18-admin-multi-floor-editor
plan: 02
subsystem: server-api
tags: [hono, drizzle, postgresql, multipart-upload, floor-management, campus-map]

# Dependency graph
requires:
  - phase: 18-01
    provides: connectsToBuildingId FK on nodes table; buildings/floors FK structure
provides:
  - POST /api/admin/floors: create floor row + write image file atomically
  - DELETE /api/admin/floors/:id: FK-safe transaction delete (edges → nodes → floor)
  - POST /api/admin/floor-plan/:buildingId/:floorNumber: replace per-floor image, update floors.imagePath
  - POST /api/admin/campus/image: upsert Campus building+floor (floorNumber=0 sentinel), save campus-map file
  - GET /api/campus/image: public route serving campus map image via DB lookup
affects: [18-03, 18-04, 18-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "inArray from drizzle-orm for batch FK-safe edge deletion by sourceId/targetId"
    - "Campus building upsert pattern: SELECT-before-INSERT with floorNumber=0 sentinel"
    - "Per-floor image naming convention: floor-plan-{buildingId}-{floorNumber}.{ext}"
    - "Public route (GET /api/campus/image) placed before JWT guard — no /api/admin/* prefix needed"

key-files:
  created: []
  modified:
    - src/server/index.ts

key-decisions:
  - "GET /api/campus/image placed with public image routes (before JWT guard) — does not use /api/admin/* prefix so guard does not apply regardless, but grouped logically with other image-serving routes"
  - "Campus floor uses floorNumber=0 as sentinel — distinguishes campus overlay from real building floors (which start at 1)"
  - "inArray used for edge deletion by sourceId and targetId separately — two passes required since edges table has separate FK columns, not a single floorId column"
  - "POST /api/admin/floors writes file before inserting DB row — file write failure throws before DB insert; no orphaned DB rows possible"

patterns-established:
  - "Upsert pattern: SELECT first, INSERT only if not found — used for Campus building and Campus floor"
  - "Per-floor image filename: floor-plan-{buildingId}-{floorNumber}.{ext} — deterministic, idempotent on re-upload"

requirements-completed: [MFLR-04, CAMP-02]

# Metrics
duration: ~1min
completed: 2026-03-01
---

# Phase 18 Plan 02: Multi-Floor and Campus API Routes Summary

**Five new Hono admin API routes for floor CRUD, per-floor image replace, campus image upsert, and campus image serving — all protected by existing JWT guard except the public GET /api/campus/image**

## Performance

- **Duration:** ~1 min
- **Started:** 2026-03-01T15:35:09Z
- **Completed:** 2026-03-01T15:36:48Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Added `inArray` to drizzle-orm import for FK-safe batch edge deletion
- Added `POST /api/admin/floors`: accepts multipart (buildingId, floorNumber, image), writes `floor-plan-{b}-{f}.{ext}`, inserts floor row, returns floorId
- Added `DELETE /api/admin/floors/:id`: transaction selects floor's nodes, deletes edges by sourceId, deletes edges by targetId, deletes nodes, deletes floor
- Added `POST /api/admin/floor-plan/:buildingId/:floorNumber`: replaces per-floor image, updates `floors.imagePath` and `updatedAt`
- Added `POST /api/admin/campus/image`: upserts Campus building and floor (floorNumber=0 sentinel), saves `campus-map.{ext}`
- Added `GET /api/campus/image`: public route; DB lookup for Campus building → floor imagePath → serve file

## Task Commits

Each task was committed atomically:

1. **Task 1: POST /api/admin/floors and DELETE /api/admin/floors/:id** - `65b281f` (feat)
2. **Task 2: POST /api/admin/floor-plan/:buildingId/:floorNumber, POST /api/admin/campus/image, GET /api/campus/image** - `922695f` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/server/index.ts` - Added `inArray` import + 5 new routes (2 in Task 1, 3 in Task 2)

## Decisions Made

- `GET /api/campus/image` placed with public image-serving routes before JWT guard. The route path does not start with `/api/admin/*` so it is not covered by the guard regardless of position; logical grouping with other floor-plan image routes improves readability
- Campus floor uses `floorNumber: 0` as sentinel value — distinguishes the campus overhead map from real building floors (which start at 1)
- `inArray` used twice in the DELETE transaction: once for `edges.sourceId` and once for `edges.targetId` — the edges table has two separate FK columns, requiring two passes
- File write happens before DB insert in `POST /api/admin/floors` — a write failure throws before the insert, preventing orphaned DB rows; a DB failure after write leaves an orphaned file (acceptable trade-off, no DB rollback needed for file system)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — routes are automatically available after server restart. No new environment variables, migrations, or external services required.

## Self-Check: PASSED

- FOUND: src/server/index.ts
- FOUND: .planning/phases/18-admin-multi-floor-editor/18-02-SUMMARY.md
- FOUND commit: 65b281f (Task 1)
- FOUND commit: 922695f (Task 2)

## Next Phase Readiness

- All 5 API routes are live and TypeScript-clean
- Client-side multi-floor editor (Plan 03) can call these endpoints to create/delete floors and upload images
- Campus editor (Plan 04+) can upload and display the campus map via the new routes
- No blockers
</content>
</invoke>