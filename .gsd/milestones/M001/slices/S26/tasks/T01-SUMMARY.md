---
id: T01
parent: S26
milestone: M001
provides:
  - Added floor-level GPS bounds persistence columns and complete-only map payload serialization contract.
key_files:
  - src/server/db/schema.ts
  - drizzle/0003_floor_gps_bounds.sql
  - src/server/floorGpsBounds.ts
  - src/server/index.ts
key_decisions:
  - Centralized GPS tuple normalization in a server helper so `/api/map` can never emit partial `gpsBounds` values.
patterns_established:
  - Build optional API fields with spread helpers (`...serializeFloorGpsBounds(row)`) to satisfy exact optional typing while suppressing incomplete tuples.
observability_surfaces:
  - GET /api/map floor payload now includes optional `gpsBounds` only when all four DB bounds are present; behavior is covered by `src/server/floorGpsBounds.test.ts`.
duration: ~1h
verification_result: passed
completed_at: 2026-03-24
blocker_discovered: false
---

# T01: Add GPS bounds persistence schema and `GET /api/map` contract surface

**Added nullable floor GPS bounds persistence plus complete-only `/api/map` `gpsBounds` emission.**

## What Happened

Implemented the T01 storage/read-contract foundation for floor GPS calibration metadata.

- Extended `floors` schema with nullable `gpsMinLat`, `gpsMaxLat`, `gpsMinLng`, `gpsMaxLng` columns.
- Added migration artifacts:
  - `drizzle/0003_floor_gps_bounds.sql`
  - `drizzle/meta/0003_snapshot.json`
  - new `0003_floor_gps_bounds` entry in `drizzle/meta/_journal.json`
- Extended shared contract in `src/shared/types.ts` with `NavFloorGpsBounds` and optional `NavFloor.gpsBounds`.
- Added `src/server/floorGpsBounds.ts` helper to normalize DB rows into complete-or-absent bounds.
- Updated `GET /api/map` serialization to include `gpsBounds` only via `serializeFloorGpsBounds(f)`.
- Added `src/server/floorGpsBounds.test.ts` to verify complete-tuple emission behavior.
- Applied required pre-flight observability fix by adding an explicit failure-path verification command to `S26-PLAN.md`.

## Verification

Ran the minimal required T01 verification commands in timeout-recovery mode; all passed.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `test -f drizzle/0003_floor_gps_bounds.sql` | 0 | ✅ pass | 0.031s |
| 2 | `npm test -- src/server/floorGpsBounds.test.ts` | 0 | ✅ pass | 0.694s |
| 3 | `npm test -- src/server/floorGpsBounds.test.ts -t "serializes gpsBounds only when complete tuple is present"` | 0 | ✅ pass | 0.698s |

## Diagnostics

- Inspect `/api/map` floor entries: `gpsBounds` is present only when all four `gps_*` DB values are non-null and finite.
- Use `src/server/floorGpsBounds.test.ts` as the targeted regression surface for complete-vs-partial tuple serialization.

## Deviations

- Added one extra slice verification line in `S26-PLAN.md` (`GPS_BOUNDS_INCOMPLETE`-focused test) to satisfy the pre-flight observability-gap fix directive.
- Did not execute the full slice-wide verification matrix during this task’s hard-timeout recovery; executed the T01-minimal verification set instead.

## Known Issues

- Remaining slice verification commands for T02/T03-specific server/UI tests are expected to be completed in later tasks.

## Files Created/Modified

- `.gsd/milestones/M001/slices/S26/S26-PLAN.md` — added pre-flight observability verification step and marked T01 complete.
- `src/server/db/schema.ts` — added nullable GPS bounds columns to `floors`.
- `drizzle/0003_floor_gps_bounds.sql` — migration adding the four GPS bounds columns.
- `drizzle/meta/0003_snapshot.json` — updated Drizzle schema snapshot including new floor columns.
- `drizzle/meta/_journal.json` — added migration journal entry for `0003_floor_gps_bounds`.
- `src/shared/types.ts` — introduced `NavFloorGpsBounds` and optional `NavFloor.gpsBounds`.
- `src/server/floorGpsBounds.ts` — added tuple normalization/serialization helpers.
- `src/server/index.ts` — wired `/api/map` floor serialization to emit `gpsBounds` only when complete.
- `src/server/floorGpsBounds.test.ts` — added complete-only serialization tests.
