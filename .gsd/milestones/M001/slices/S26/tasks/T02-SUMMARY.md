---
id: T02
parent: S26
milestone: M001
provides:
  - Added a JWT-protected floor GPS bounds mutation path with deterministic validation errors and server-authoritative responses.
key_files:
  - src/server/floorGpsBounds.ts
  - src/server/index.ts
  - src/server/floorGpsBounds.test.ts
  - .gsd/milestones/M001/slices/S26/S26-PLAN.md
key_decisions:
  - Modeled GPS-bound mutation as a service with a typed transaction-store interface so validation and no-mutation failure behavior are testable without DB integration harnesses.
patterns_established:
  - Parse unknown payloads into a strict complete-tuple-or-full-null shape first, then execute writes only after ordering checks pass.
observability_surfaces:
  - PUT /api/admin/floors/:id/gps-bounds now returns structured success ({ ok, floorId, gpsBounds }) and deterministic failures ({ errorCode, error }) with stable status codes.
duration: ~1.25h
verification_result: passed
completed_at: 2026-03-24
blocker_discovered: false
---

# T02: Implement protected floor GPS bounds update endpoint with deterministic validation diagnostics

**Implemented a protected floor GPS bounds update endpoint with deterministic validation/error diagnostics and no-partial-write guarantees.**

## What Happened

Implemented the T02 server mutation contract for floor GPS calibration.

- Extended `src/server/floorGpsBounds.ts` from read-only serialization helpers into a full mutation service:
  - Added payload parsing for `{ minLat, maxLat, minLng, maxLng }`.
  - Enforced complete numeric tuple OR complete null clear tuple.
  - Enforced ordering constraints (`minLat < maxLat`, `minLng < maxLng`).
  - Added deterministic domain error model:
    - `INVALID_REQUEST` (400)
    - `GPS_BOUNDS_INCOMPLETE` (400)
    - `BOUNDS_RANGE_INVALID` (400)
    - `FLOOR_NOT_FOUND` (404)
  - Added typed Drizzle transaction-backed store for floor lookup + update using `update(...).set(...).where(eq(...))`.
- Added `PUT /api/admin/floors/:id/gps-bounds` in `src/server/index.ts` under existing JWT admin guard.
  - Handles invalid floor id and invalid JSON body deterministically.
  - Returns server-authoritative success payload and structured failure diagnostics.
  - Preserves explicit internal-error surface for unexpected failures.
- Expanded `src/server/floorGpsBounds.test.ts` to cover:
  - Success set + clear flows.
  - Partial tuple rejection with no state mutation.
  - Ordering rejection with no state mutation.
  - Floor-not-found rejection.
  - Existing complete-only serialization behavior from T01.
- Applied the pre-flight observability verification gap fix in slice plan verification by adding:
  - `npm test -- src/server/floorGpsBounds.test.ts -t "returns FLOOR_NOT_FOUND when floor id does not exist"`.

## Verification

Executed T02 targeted checks and the full slice verification command list. T02 checks passed; expected T03 client-test placeholders still fail because those files are created in the next task.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `test -f drizzle/0003_floor_gps_bounds.sql` | 0 | ✅ pass | ~0.01s |
| 2 | `npm test -- src/server/floorGpsBounds.test.ts` | 0 | ✅ pass | 0.439s |
| 3 | `npm test -- src/server/floorGpsBounds.test.ts -t "returns BOUNDS_RANGE_INVALID when min/max ordering is invalid"` | 0 | ✅ pass | 0.424s |
| 4 | `npm test -- src/server/floorGpsBounds.test.ts -t "returns GPS_BOUNDS_INCOMPLETE when tuple is partially provided"` | 0 | ✅ pass | 0.424s |
| 5 | `npm test -- src/server/floorGpsBounds.test.ts -t "returns FLOOR_NOT_FOUND when floor id does not exist"` | 0 | ✅ pass | 0.431s |
| 6 | `npm test -- src/client/components/admin/gpsBoundsForm.test.ts` | 1 | ❌ fail | ~0.42s |
| 7 | `npm test -- src/client/components/admin/ManageFloorsModal.gps.test.tsx` | 1 | ❌ fail | ~0.42s |
| 8 | `npm test -- src/client/components/admin/EditorSidePanel.connector.test.tsx` | 0 | ✅ pass | 0.342s |
| 9 | `npm test` | 0 | ✅ pass | 0.584s |

## Diagnostics

- Endpoint inspection surface: `PUT /api/admin/floors/:id/gps-bounds`
  - Success: `{ ok: true, floorId, gpsBounds }` where `gpsBounds` is either full tuple or `null` on clear.
  - Failure: `{ errorCode, error }` with stable codes/status for invalid body, incomplete tuple, invalid ordering, and missing floor.
- Non-mutation guarantees for failed writes are covered by in-memory transactional test snapshots in `src/server/floorGpsBounds.test.ts`.

## Deviations

- Added one extra slice verification command (`FLOOR_NOT_FOUND` targeted test) to satisfy the required pre-flight observability/failure-surface verification fix.

## Known Issues

- `src/client/components/admin/gpsBoundsForm.test.ts` and `src/client/components/admin/ManageFloorsModal.gps.test.tsx` do not exist yet (expected for T03), so those slice-level verification commands currently fail.
- `npm run typecheck` still reports pre-existing client typing issues outside this task’s scope (`connectorLinking.ts`, `MapEditorCanvas.tsx`).

## Files Created/Modified

- `src/server/floorGpsBounds.ts` — added payload parser, deterministic error model, typed update service, and floor mutation flow.
- `src/server/index.ts` — added protected `PUT /api/admin/floors/:id/gps-bounds` route wiring and structured error handling.
- `src/server/floorGpsBounds.test.ts` — expanded with mutation success/failure and no-partial-state-regression tests.
- `.gsd/milestones/M001/slices/S26/S26-PLAN.md` — added failure-path verification command and marked T02 complete.
