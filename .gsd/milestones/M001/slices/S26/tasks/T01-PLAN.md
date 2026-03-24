---
estimated_steps: 5
estimated_files: 8
skills_used:
  - drizzle-orm
  - test
---

# T01: Add GPS bounds persistence schema and `GET /api/map` contract surface

**Slice:** S26 — Admin GPS Bounds Configuration — Schema, API endpoint, and admin form for configuring real World lat/lng bounding boxes per floor and campus map
**Milestone:** M001

## Description

Establish the storage and read-contract foundation for floor GPS calibration metadata. This task adds nullable floor GPS bounds columns, updates shared graph types, and makes map serialization emit `gpsBounds` only when a full tuple is present.

## Steps

1. Extend `floors` schema with nullable real columns for `gps_min_lat`, `gps_max_lat`, `gps_min_lng`, and `gps_max_lng` in `src/server/db/schema.ts`.
2. Create Drizzle migration artifacts for the new columns (`drizzle/0003_floor_gps_bounds.sql`, `drizzle/meta/0003_snapshot.json`, and `drizzle/meta/_journal.json` entry).
3. Add optional GPS bounds contract types to `src/shared/types.ts` so `NavFloor` can carry `gpsBounds` without breaking strict optional typing.
4. Implement/extend `src/server/floorGpsBounds.ts` helper(s) that normalize DB rows into complete-or-absent `gpsBounds` values.
5. Update `GET /api/map` serialization in `src/server/index.ts` to include `floor.gpsBounds` only when all four bounds are non-null, then add/extend `src/server/floorGpsBounds.test.ts` assertions for this behavior.

## Must-Haves

- [ ] Floor bounds storage is represented as four nullable DB columns on `floors`, with migration artifacts checked in.
- [ ] `NavFloor` API contract can carry optional GPS bounds in a strongly typed structure.
- [ ] `GET /api/map` never emits partial bounds tuples; output is either a complete `gpsBounds` object or omitted.

## Verification

- `test -f drizzle/0003_floor_gps_bounds.sql`
- `npm test -- src/server/floorGpsBounds.test.ts -t "serializes gpsBounds only when complete tuple is present"`

## Observability Impact

- Signals added/changed: `GET /api/map` floor payload shape gains optional `gpsBounds` emission.
- How a future agent inspects this: run targeted server test and inspect `/api/map` JSON for calibrated vs incomplete floor rows.
- Failure state exposed: incomplete DB tuples remain suppressed from map payload, preventing ambiguous downstream GPS projection inputs.

## Inputs

- `src/server/db/schema.ts` — existing Drizzle table definitions for `floors`.
- `drizzle/0002_campus_entrance_bridge.sql` — latest migration baseline and naming/DDL style.
- `drizzle/meta/0002_snapshot.json` — snapshot baseline for next migration state.
- `drizzle/meta/_journal.json` — migration journal requiring next entry.
- `src/shared/types.ts` — current `NavFloor` contract consumed by client/server.
- `src/server/index.ts` — existing `GET /api/map` serialization pipeline.

## Expected Output

- `src/server/db/schema.ts` — `floors` table includes nullable GPS bounds columns.
- `drizzle/0003_floor_gps_bounds.sql` — migration adding floor GPS bounds columns.
- `drizzle/meta/0003_snapshot.json` — updated Drizzle schema snapshot.
- `drizzle/meta/_journal.json` — migration journal entry for tag `0003_floor_gps_bounds`.
- `src/shared/types.ts` — optional `gpsBounds` structure on `NavFloor`.
- `src/server/floorGpsBounds.ts` — helper(s) to map/normalize bounds tuple shape.
- `src/server/index.ts` — map serialization includes complete-only `gpsBounds`.
- `src/server/floorGpsBounds.test.ts` — assertions for complete tuple emission behavior.
