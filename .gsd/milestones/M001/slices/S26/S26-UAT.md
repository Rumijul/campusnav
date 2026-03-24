# S26: Admin GPS Bounds Configuration — Schema, API endpoint, and admin form for configuring real World lat/lng bounding boxes per floor and campus map — UAT

**Milestone:** M001  
**Slice:** S26  
**Written:** 2026-03-24

## UAT Type

- UAT mode: artifact-driven integration verification
- Why this is sufficient: S26 proof level is integration with explicit test surfaces for schema, API validation, and admin form behavior; real runtime/human UAT is not required by the slice plan.

## Preconditions

1. Working directory is the S26 worktree root.
2. Dependencies are installed (`node_modules` present).
3. Test runner is available (`npm test` uses Vitest).
4. Required S26 files exist:
   - `drizzle/0003_floor_gps_bounds.sql`
   - `src/server/floorGpsBounds.ts`
   - `src/server/floorGpsBounds.test.ts`
   - `src/client/components/admin/gpsBoundsForm.ts`
   - `src/client/components/admin/ManageFloorsModal.tsx`
   - `src/client/components/admin/ManageFloorsModal.gps.test.tsx`

## Smoke Test

1. Run:
   - `npm test -- src/server/floorGpsBounds.test.ts src/client/components/admin/gpsBoundsForm.test.ts src/client/components/admin/ManageFloorsModal.gps.test.tsx`
2. **Expected:** All suites pass, proving schema/API/UI logic agrees on GPS bounds contract and validation behavior.

## Test Cases

### 1) Persistence layer includes floor GPS bounds columns

1. Run: `test -f drizzle/0003_floor_gps_bounds.sql`
2. Open migration file and confirm all four columns are added:
   - `gps_min_lat`
   - `gps_max_lat`
   - `gps_min_lng`
   - `gps_max_lng`
3. **Expected:** File exists and adds exactly the four nullable GPS fields to `floors`.

### 2) `/api/map` emits `gpsBounds` only for complete tuples

1. Run: `npm test -- src/server/floorGpsBounds.test.ts -t "serializes gpsBounds only when complete tuple is present"`
2. **Expected:**
   - Complete tuple serializes as `{ gpsBounds: { minLat, maxLat, minLng, maxLng } }`.
   - Any missing/null member suppresses `gpsBounds` emission.

### 3) API accepts valid full tuple set and full clear tuple

1. Run: `npm test -- src/server/floorGpsBounds.test.ts`
2. Inspect tests covering:
   - updates with full numeric tuple
   - clear with full null tuple
3. **Expected:**
   - Success payload shape `{ ok: true, floorId, gpsBounds }`.
   - Clear operation returns `gpsBounds: null` and persists null columns.

### 4) API rejects partial tuples with deterministic error and no mutation

1. Run: `npm test -- src/server/floorGpsBounds.test.ts -t "returns GPS_BOUNDS_INCOMPLETE when tuple is partially provided"`
2. **Expected:**
   - Error code/status: `GPS_BOUNDS_INCOMPLETE` / 400.
   - Floor snapshot remains unchanged (no partial write).

### 5) API rejects invalid ordering (`min >= max`) with deterministic error and no mutation

1. Run: `npm test -- src/server/floorGpsBounds.test.ts -t "returns BOUNDS_RANGE_INVALID when min/max ordering is invalid"`
2. **Expected:**
   - Error code/status: `BOUNDS_RANGE_INVALID` / 400.
   - No state mutation is committed.

### 6) API returns floor-not-found diagnostic

1. Run: `npm test -- src/server/floorGpsBounds.test.ts -t "returns FLOOR_NOT_FOUND when floor id does not exist"`
2. **Expected:**
   - Error code/status: `FLOOR_NOT_FOUND` / 404.
   - No mutation occurs.

### 7) Form helper enforces complete-or-clear + range ordering before request payload

1. Run: `npm test -- src/client/components/admin/gpsBoundsForm.test.ts`
2. **Expected:**
   - All-empty fields produce valid clear payload (`null` tuple).
   - Partial tuple yields `GPS_BOUNDS_INCOMPLETE` and null payload.
   - Invalid ordering yields `BOUNDS_RANGE_INVALID` and null payload.
   - Valid numeric tuple yields parsed numeric payload.

### 8) Manage Floors row UX blocks invalid save and shows inline validation

1. Run: `npm test -- src/client/components/admin/ManageFloorsModal.gps.test.tsx -t "renders inline validation error and blocks save for partial gps tuple"`
2. **Expected:**
   - Inline error contains `GPS_BOUNDS_INCOMPLETE`.
   - Save action is disabled for that row.

### 9) Campus-mode access and controls are correct

1. Run: `npm test -- src/client/components/admin/ManageFloorsModal.gps.test.tsx`
2. **Expected:**
   - Campus mode renders `Campus Map` row + `Save GPS Bounds`.
   - Campus mode hides floor-structure actions (`Add Floor`, `Replace Image`, `Delete`).
   - Building mode still shows those floor-management controls.

### 10) Full slice regression check

1. Run: `npm test -- src/client/components/admin/EditorSidePanel.connector.test.tsx`
2. Run: `npm test`
3. **Expected:**
   - Existing connector UI tests still pass (no regression from S26 UI wiring).
   - Full project test suite passes.

## Edge Cases

### Edge Case A — Non-JSON or malformed request body

1. Validate via server route behavior in `src/server/index.ts` and `parseFloorGpsBoundsUpdatePayload` tests.
2. **Expected:** deterministic `INVALID_REQUEST` response with 400 status.

### Edge Case B — Numeric-but-non-finite values

1. Validate with helper tests (`toNavFloorGpsBounds` non-finite case).
2. **Expected:** bounds are treated as invalid/incomplete and not emitted as `gpsBounds`.

### Edge Case C — No-op save gating

1. Validate `deriveGpsBoundsRowUiState` behavior via modal/helper tests.
2. **Expected:** save stays disabled when there are no effective changes or when row is pending/saving.

## Failure Signals

- Migration file missing or missing any of the 4 GPS columns.
- `/api/map` emits partial `gpsBounds` tuples.
- Partial/invalid tuple writes mutate floor data.
- Form allows save with `minLat >= maxLat` or `minLng >= maxLng`.
- Campus mode cannot access GPS row editing.
- Full suite (`npm test`) fails after S26 changes.

## Not Proven By This UAT

- Interactive browser calibration flow against a live running dev server (not required for this slice).
- End-to-end JWT cookie issuance/login flow (admin auth itself is covered by prior slices).
- Student-side geolocation projection behavior (belongs to S27).

## Tester Notes

- Prefer these test-driven checks in this worktree environment.
- If doing optional manual runtime checks outside this worktree, confirm that saving a floor’s GPS bounds updates `/api/map` output for that floor only when tuple is complete.
