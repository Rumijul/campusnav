---
id: S26
parent: M001
milestone: M001
provides:
  - Floor-level GPS bounds persistence (`gpsMinLat/gpsMaxLat/gpsMinLng/gpsMaxLng`) with migration artifacts and complete-only `/api/map` serialization (`gpsBounds` emitted only for complete tuples).
  - Protected admin endpoint `PUT /api/admin/floors/:id/gps-bounds` with deterministic validation errors (`INVALID_REQUEST`, `GPS_BOUNDS_INCOMPLETE`, `BOUNDS_RANGE_INVALID`, `FLOOR_NOT_FOUND`) and server-authoritative success payloads.
  - Campus-aware Manage Floors GPS calibration UI (building + campus rows) with inline validation, save blocking for invalid tuples, and authoritative `navGraph` floor metadata patching by `floorId`.
requires:
  - slice: S25
    provides: Stable multi-floor admin editor orchestration and established server-authoritative patching pattern in `MapEditorCanvas`.
affects:
  - S27
key_files:
  - drizzle/0003_floor_gps_bounds.sql
  - drizzle/meta/0003_snapshot.json
  - drizzle/meta/_journal.json
  - src/server/db/schema.ts
  - src/shared/types.ts
  - src/server/floorGpsBounds.ts
  - src/server/floorGpsBounds.test.ts
  - src/server/index.ts
  - src/client/components/admin/gpsBoundsForm.ts
  - src/client/components/admin/gpsBoundsForm.test.ts
  - src/client/components/admin/ManageFloorsModal.tsx
  - src/client/components/admin/ManageFloorsModal.gps.test.tsx
  - src/client/components/admin/EditorToolbar.tsx
  - src/client/pages/admin/MapEditorCanvas.tsx
  - .gsd/REQUIREMENTS.md
  - .gsd/DECISIONS.md
  - .gsd/KNOWLEDGE.md
  - .gsd/milestones/M001/M001-ROADMAP.md
  - .gsd/PROJECT.md
key_decisions:
  - D004: model GPS bounds persistence via dedicated protected floor endpoint and server-authoritative response patching.
  - D005: centralize GPS bounds parsing/validation/payload derivation in pure helpers used by UI gating + tests.
patterns_established:
  - Treat floor GPS bounds as an atomic tuple (all 4 numeric values) or full clear tuple (all null), never partial.
  - Emit optional API fields through complete-only serializers (`...serializeFloorGpsBounds(row)`) to preserve exact optional typing and prevent partial contract drift.
  - Derive row save readiness from pure state helpers (`deriveGpsBoundsRowUiState`) that combine validation, dirty-state, and pending/saving flags.
observability_surfaces:
  - `PUT /api/admin/floors/:id/gps-bounds` success payload: `{ ok: true, floorId, gpsBounds }`.
  - `PUT /api/admin/floors/:id/gps-bounds` deterministic failures: `{ errorCode, error }` with stable 4xx status mapping.
  - `GET /api/map` floor metadata emits `gpsBounds` only when full tuple exists.
  - Row-level inline validation + API failure messaging in `ManageFloorsModal`.
  - Verification suites: `src/server/floorGpsBounds.test.ts`, `src/client/components/admin/gpsBoundsForm.test.ts`, `src/client/components/admin/ManageFloorsModal.gps.test.tsx`.
drill_down_paths:
  - .gsd/milestones/M001/slices/S26/tasks/T01-SUMMARY.md
  - .gsd/milestones/M001/slices/S26/tasks/T02-SUMMARY.md
  - .gsd/milestones/M001/slices/S26/tasks/T03-SUMMARY.md
duration: ~4h
verification_result: passed
completed_at: 2026-03-24
---

# S26: Admin GPS Bounds Configuration — Schema, API endpoint, and admin form for configuring real World lat/lng bounding boxes per floor and campus map

**Delivered end-to-end admin GPS calibration for every floor (including campus map), with strict tuple validation and a server-authoritative persistence contract ready for S27 geolocation projection.**

## What This Slice Actually Delivered

S26 closed the full schema → API → admin UI path for GPS bounds.

- **T01 (data model + read contract):**
  - Added nullable GPS bounds columns to `floors` schema.
  - Added migration artifacts (`drizzle/0003_floor_gps_bounds.sql` + meta updates).
  - Extended shared floor contract with optional `NavFloor.gpsBounds`.
  - Added complete-only serializer so `/api/map` includes `gpsBounds` only when all four bounds are present.

- **T02 (authoritative write path):**
  - Added protected `PUT /api/admin/floors/:id/gps-bounds`.
  - Enforced strict payload semantics:
    - full numeric tuple set,
    - or full null tuple clear,
    - no partial tuples.
  - Added deterministic failure diagnostics and status mapping:
    - `INVALID_REQUEST` (400)
    - `GPS_BOUNDS_INCOMPLETE` (400)
    - `BOUNDS_RANGE_INVALID` (400)
    - `FLOOR_NOT_FOUND` (404)
  - Added regression tests proving no mutation on invalid tuple/floor-not-found failures.

- **T03 (admin UX + campus wiring):**
  - Added per-floor GPS bounds inputs and Save action in `ManageFloorsModal`.
  - Added inline validation and save-button gating before network dispatch.
  - Enabled Manage Floors flow in campus context and rendered campus row calibration controls.
  - Patched cached `navGraph` floor metadata from authoritative save responses by `floorId`.

## Verification (Slice-Level Matrix)

All required S26 plan verification commands were re-run at slice closure and passed:

1. `test -f drizzle/0003_floor_gps_bounds.sql` ✅
2. `npm test -- src/server/floorGpsBounds.test.ts` ✅
3. `npm test -- src/server/floorGpsBounds.test.ts -t "returns BOUNDS_RANGE_INVALID when min/max ordering is invalid"` ✅
4. `npm test -- src/server/floorGpsBounds.test.ts -t "returns GPS_BOUNDS_INCOMPLETE when tuple is partially provided"` ✅
5. `npm test -- src/server/floorGpsBounds.test.ts -t "returns FLOOR_NOT_FOUND when floor id does not exist"` ✅
6. `npm test -- src/client/components/admin/gpsBoundsForm.test.ts` ✅
7. `npm test -- src/client/components/admin/ManageFloorsModal.gps.test.tsx` ✅
8. `npm test -- src/client/components/admin/ManageFloorsModal.gps.test.tsx -t "renders inline validation error and blocks save for partial gps tuple"` ✅
9. `npm test -- src/client/components/admin/EditorSidePanel.connector.test.tsx` ✅
10. `npm test` ✅

## Observability / Diagnostics Confirmation

Required observability surfaces are present and test-backed:

- **Runtime API diagnostics:**
  - Success path returns `{ ok, floorId, gpsBounds }`.
  - Validation/failure paths return `{ errorCode, error }` with deterministic codes.
- **Payload inspection surface:**
  - `/api/map` now reflects complete-only `gpsBounds` floor metadata.
- **UI failure visibility:**
  - Manage Floors rows show inline ordering/incomplete-tuple validation messages.
  - Non-2xx save responses show row-level `errorCode: error` diagnostics.
- **No-silent-drift behavior:**
  - Invalid requests do not mutate persisted bounds; this is explicitly asserted in server tests.

## Requirements and Milestone State Updates

- Updated `.gsd/REQUIREMENTS.md`:
  - **R009** moved to **validated** with S26 proof.
  - **R010** moved to **validated** with S26 proof.
- Updated `.gsd/milestones/M001/M001-ROADMAP.md`:
  - **S26 marked complete**.
- Updated `.gsd/PROJECT.md`:
  - Active milestone status now reflects GPS bounds admin capability as complete.

## Decisions and Knowledge Captured

- Added **D005** to `.gsd/DECISIONS.md` (pure helper-based validation + row save readiness derivation).
- Added S26 lessons to `.gsd/KNOWLEDGE.md`:
  - GPS bounds are atomic tuple-or-clear only.
  - `/api/map` should remain complete-only for `gpsBounds`.
  - `MapEditorCanvas` should patch floor metadata from authoritative endpoint responses.

## Deviations

- Added targeted failure-path checks in the slice verification list during execution (incomplete tuple + floor not found + row validation test focus) to strengthen diagnostic coverage.
- No scope-expanding product deviation beyond planned S26 deliverables.

## Known Limitations

- No live browser UAT was required/executed in this worktree; closure is artifact/test driven per slice proof level.

## Forward Intelligence for S27

- S27 should treat `NavFloor.gpsBounds` as **optional but trustworthy when present** (already complete-validated at source).
- Any new GPS write flows should preserve the same atomic tuple contract and server-authoritative client patching pattern.
- If `gpsBounds` is absent for a floor, S27 should gracefully skip projection for that floor rather than infer partial calibration.
