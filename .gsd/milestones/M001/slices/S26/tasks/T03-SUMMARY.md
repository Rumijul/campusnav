---
id: T03
parent: S26
milestone: M001
provides:
  - Added campus-aware Manage Floors GPS bounds editing UX with inline tuple validation and server-authoritative floor metadata patching.
key_files:
  - src/client/components/admin/gpsBoundsForm.ts
  - src/client/components/admin/gpsBoundsForm.test.ts
  - src/client/components/admin/ManageFloorsModal.tsx
  - src/client/components/admin/ManageFloorsModal.gps.test.tsx
  - src/client/components/admin/EditorToolbar.tsx
  - src/client/pages/admin/MapEditorCanvas.tsx
  - .gsd/milestones/M001/slices/S26/S26-PLAN.md
key_decisions:
  - Centralized GPS bounds parsing/validation/payload derivation in a pure helper module so UI gating and tests share one deterministic ruleset.
  - Treated PUT `/api/admin/floors/:id/gps-bounds` responses as authoritative and patched `navGraph` floors by `floorId` instead of optimistic local tuple mutation.
patterns_established:
  - Derive per-row save readiness from a pure row-state helper (`deriveGpsBoundsRowUiState`) combining validation, dirty-state, and pending flags.
observability_surfaces:
  - Manage Floors rows now show inline validation errors for partial/invalid tuples and preserve structured API failure messaging (`errorCode: error`) per row.
duration: ~1.75h
verification_result: passed
completed_at: 2026-03-24
blocker_discovered: false
---

# T03: Deliver admin GPS bounds form UX and campus-mode access wiring

**Enabled campus/building Manage Floors GPS calibration with inline tuple validation and authoritative floor metadata patching from save responses.**

## What Happened

Implemented the full T03 client-side GPS bounds workflow and campus access wiring:

- Added `src/client/components/admin/gpsBoundsForm.ts` pure helpers for:
  - draft initialization from persisted floor metadata,
  - tuple validation (`minLat < maxLat`, `minLng < maxLng`, complete-or-clear),
  - deterministic payload building for the GPS bounds endpoint.
- Added `src/client/components/admin/gpsBoundsForm.test.ts` covering valid set/clear payloads and failure states (partial tuple + ordering invalid).
- Extended `ManageFloorsModal` to render four GPS bounds inputs per floor row, inline validation messaging, row-level pending/error state, and row-scoped `PUT /api/admin/floors/:id/gps-bounds` saves.
- Added campus-aware modal behavior in `ManageFloorsModal`:
  - campus row label/surface for calibration,
  - floor-structure controls (add/delete/replace image) hidden in campus mode.
- Updated `EditorToolbar` to expose **Manage Floors** in campus context.
- Updated `MapEditorCanvas` to:
  - route Manage Floors modal through active building or campus building context,
  - patch `navGraph` floor metadata by `floorId` from save responses via `patchNavGraphFloorGpsBounds(...)`.
- Added `src/client/components/admin/ManageFloorsModal.gps.test.tsx` for row-state validation/pending gating and campus rendering behavior.
- Applied the required pre-flight observability verification fix by adding a targeted failure-path check to `S26-PLAN.md` verification.
- Marked T03 complete in `S26-PLAN.md`.

Must-haves satisfied:
1. Manage Floors now supports GPS bounds edits for regular floors and campus floor.
2. Partial/ordering-invalid tuples surface inline errors and disable save.
3. Successful save responses are applied back to `navGraph` floor metadata via authoritative response patching.

## Verification

Ran the task-level targeted suites, then executed the full slice verification matrix (including failure-path diagnostics), and re-ran full project tests.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `test -f drizzle/0003_floor_gps_bounds.sql` | 0 | ✅ pass | 0.020s |
| 2 | `npm test -- src/server/floorGpsBounds.test.ts` | 0 | ✅ pass | 0.979s |
| 3 | `npm test -- src/server/floorGpsBounds.test.ts -t "returns BOUNDS_RANGE_INVALID when min/max ordering is invalid"` | 0 | ✅ pass | 0.993s |
| 4 | `npm test -- src/server/floorGpsBounds.test.ts -t "returns GPS_BOUNDS_INCOMPLETE when tuple is partially provided"` | 0 | ✅ pass | 0.975s |
| 5 | `npm test -- src/server/floorGpsBounds.test.ts -t "returns FLOOR_NOT_FOUND when floor id does not exist"` | 0 | ✅ pass | 0.961s |
| 6 | `npm test -- src/client/components/admin/gpsBoundsForm.test.ts` | 0 | ✅ pass | 0.699s |
| 7 | `npm test -- src/client/components/admin/ManageFloorsModal.gps.test.tsx` | 0 | ✅ pass | 0.760s |
| 8 | `npm test -- src/client/components/admin/ManageFloorsModal.gps.test.tsx -t "renders inline validation error and blocks save for partial gps tuple"` | 0 | ✅ pass | 0.760s |
| 9 | `npm test -- src/client/components/admin/EditorSidePanel.connector.test.tsx` | 0 | ✅ pass | 0.759s |
| 10 | `npm test` | 0 | ✅ pass | 1.136s |
| 11 | `npm test -- src/client/components/admin/gpsBoundsForm.test.ts src/client/components/admin/ManageFloorsModal.gps.test.tsx src/client/components/admin/EditorSidePanel.connector.test.tsx` | 0 | ✅ pass | 0.229s |

## Diagnostics

- UI inspection surface: `ManageFloorsModal` rows now show inline validation failures before requests are dispatched.
- API inspection surface: row save uses `PUT /api/admin/floors/:id/gps-bounds`; non-2xx responses are shown in-row as structured error text.
- State patching surface: `MapEditorCanvas` applies authoritative `floorId + gpsBounds` response tuples to cached `navGraph` via `patchNavGraphFloorGpsBounds(...)`.
- Regression surface: `gpsBoundsForm.test.ts`, `ManageFloorsModal.gps.test.tsx`, and `EditorSidePanel.connector.test.tsx`.

## Deviations

- Added one explicit slice verification command (`ManageFloorsModal.gps` targeted partial-tuple test) in `S26-PLAN.md` to satisfy the pre-flight observability-gap directive.
- While touching `MapEditorCanvas`, converted the campus upload empty-state overlay wrapper to a semantic `<button>` element to keep accessibility lint clean.

## Known Issues

- None.

## Files Created/Modified

- `.gsd/milestones/M001/slices/S26/S26-PLAN.md` — added pre-flight failure-path verification command and marked T03 complete.
- `src/client/components/admin/gpsBoundsForm.ts` — added pure GPS draft/validation/payload helpers.
- `src/client/components/admin/gpsBoundsForm.test.ts` — added helper-level validation and payload-shape tests.
- `src/client/components/admin/ManageFloorsModal.tsx` — added per-row GPS inputs, inline errors, save gating, endpoint wiring, and campus-mode behavior.
- `src/client/components/admin/ManageFloorsModal.gps.test.tsx` — added modal GPS row-state and campus rendering tests.
- `src/client/components/admin/EditorToolbar.tsx` — enabled Manage Floors access in campus context.
- `src/client/pages/admin/MapEditorCanvas.tsx` — wired campus/manage-building modal context and authoritative navGraph floor gpsBounds patching.
