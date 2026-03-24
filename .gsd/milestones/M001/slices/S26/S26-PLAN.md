# S26: Admin GPS Bounds Configuration — Schema, API endpoint, and admin form for configuring real World lat/lng bounding boxes per floor and campus map

**Goal:** Admins can configure and persist real-world GPS bounds (`minLat`, `maxLat`, `minLng`, `maxLng`) for every floor, including the campus map floor, through validated admin tooling.
**Demo:** In the admin editor, Manage Floors exposes GPS bounds inputs per floor (including campus mode), blocks invalid ranges inline, saves through a protected floor-scoped endpoint, and `GET /api/map` returns optional `gpsBounds` for calibrated floors.

## Must-Haves

- **R009:** Admin can configure min/max latitude and longitude bounds per floor and for campus map.
- **R010:** Admin GPS bounds form enforces `minLat < maxLat` and `minLng < maxLng` with inline errors.
- GPS bounds persistence is server-authoritative: save responses are the single source of truth for editor state and `NavGraph` floor metadata patches.

## Proof Level

- This slice proves: integration
- Real runtime required: no
- Human/UAT required: no

## Verification

- `test -f drizzle/0003_floor_gps_bounds.sql`
- `npm test -- src/server/floorGpsBounds.test.ts`
- `npm test -- src/server/floorGpsBounds.test.ts -t "returns BOUNDS_RANGE_INVALID when min/max ordering is invalid"`
- `npm test -- src/server/floorGpsBounds.test.ts -t "returns GPS_BOUNDS_INCOMPLETE when tuple is partially provided"`
- `npm test -- src/server/floorGpsBounds.test.ts -t "returns FLOOR_NOT_FOUND when floor id does not exist"`
- `npm test -- src/client/components/admin/gpsBoundsForm.test.ts`
- `npm test -- src/client/components/admin/ManageFloorsModal.gps.test.tsx`
- `npm test -- src/client/components/admin/ManageFloorsModal.gps.test.tsx -t "renders inline validation error and blocks save for partial gps tuple"`
- `npm test -- src/client/components/admin/EditorSidePanel.connector.test.tsx`
- `npm test`

## Observability / Diagnostics

- Runtime signals: `PUT /api/admin/floors/:id/gps-bounds` returns structured success payload (`{ ok, floorId, gpsBounds }`) and deterministic failures (`{ errorCode, error }`); UI row validation renders inline ordering/incomplete-tuple errors.
- Inspection surfaces: admin network response for `PUT /api/admin/floors/:id/gps-bounds`; `GET /api/map` payload floor metadata (`gpsBounds` present only when complete); targeted Vitest suites for server validation and form logic.
- Failure visibility: invalid tuples fail with explicit error codes (e.g. `GPS_BOUNDS_INCOMPLETE`, `BOUNDS_RANGE_INVALID`) and row-level UI messaging; failed saves do not silently mutate `navGraph` floor bounds.
- Redaction constraints: diagnostics expose only floor IDs and numeric bounds; no auth token/session data or PII appears in responses.

## Integration Closure

- Upstream surfaces consumed: `src/server/db/schema.ts` floors table model, `src/shared/types.ts` `NavFloor` contract, `src/server/index.ts` map/admin route composition, `src/client/pages/admin/MapEditorCanvas.tsx` + `src/client/components/admin/EditorToolbar.tsx` + `src/client/components/admin/ManageFloorsModal.tsx` admin orchestration.
- New wiring introduced in this slice: Manage Floors row save action → `PUT /api/admin/floors/:id/gps-bounds` → server-authoritative response → `MapEditorCanvas` floor metadata patch in cached `navGraph`.
- What remains before the milestone is truly usable end-to-end: nothing for GPS bounds configuration; S27 consumes this contract for student geolocation projection.

## Tasks

- [x] **T01: Add GPS bounds persistence schema and `GET /api/map` contract surface** `est:1h`
  - Why: R009 needs durable floor-level bounds storage and a serialized graph contract S27 can consume.
  - Files: `src/server/db/schema.ts`, `drizzle/0003_floor_gps_bounds.sql`, `drizzle/meta/0003_snapshot.json`, `drizzle/meta/_journal.json`, `src/shared/types.ts`, `src/server/floorGpsBounds.ts`, `src/server/index.ts`, `src/server/floorGpsBounds.test.ts`
  - Do: Add nullable GPS bounds columns to `floors`, generate migration artifacts, extend `NavFloor` with optional `gpsBounds`, add server helper(s) for tuple completeness/shape mapping, and serialize `gpsBounds` in `GET /api/map` only when all four values are present.
  - Verify: `npm test -- src/server/floorGpsBounds.test.ts -t "serializes gpsBounds only when complete tuple is present"`
  - Done when: migration artifacts exist, shared types compile with optional floor `gpsBounds`, and map serialization tests confirm complete-only emission.

- [x] **T02: Implement protected floor GPS bounds update endpoint with deterministic validation diagnostics** `est:1.25h`
  - Why: R009/R010 require a single authoritative write path that rejects malformed tuples and preserves inspectable failure states.
  - Files: `src/server/floorGpsBounds.ts`, `src/server/index.ts`, `src/server/floorGpsBounds.test.ts`
  - Do: Implement `PUT /api/admin/floors/:id/gps-bounds` (JWT-protected) accepting either a full numeric tuple or full null tuple, enforce `minLat < maxLat` and `minLng < maxLng`, validate floor existence, update via typed Drizzle `update(...).set(...).where(...)`, and return stable success/error payloads.
  - Verify: `npm test -- src/server/floorGpsBounds.test.ts`
  - Done when: endpoint returns server-authoritative `gpsBounds` on success, emits deterministic 4xx diagnostics on invalid input, and failure-path tests prove no partial tuple persistence.

- [x] **T03: Deliver admin GPS bounds form UX and campus-mode access wiring** `est:1.75h`
  - Why: R009 and R010 are only complete when admins can edit bounds in UI for both building floors and campus floor with inline guardrails.
  - Files: `src/client/components/admin/EditorToolbar.tsx`, `src/client/components/admin/ManageFloorsModal.tsx`, `src/client/components/admin/gpsBoundsForm.ts`, `src/client/components/admin/gpsBoundsForm.test.ts`, `src/client/components/admin/ManageFloorsModal.gps.test.tsx`, `src/client/pages/admin/MapEditorCanvas.tsx`
  - Do: Add per-floor GPS bounds inputs + row save controls in `ManageFloorsModal`, derive validation state in pure helper(s) (`min < max`, complete tuple), render inline errors and disable invalid saves, enable Manage Floors access in campus context, and patch `navGraph` floor metadata from endpoint response.
  - Verify: `npm test -- src/client/components/admin/gpsBoundsForm.test.ts src/client/components/admin/ManageFloorsModal.gps.test.tsx src/client/components/admin/EditorSidePanel.connector.test.tsx`
  - Done when: campus/building floors both expose editable GPS bounds rows, invalid ordering shows inline errors before network call, and successful saves update local graph state from authoritative API payload.

## Files Likely Touched

- `src/server/db/schema.ts`
- `drizzle/0003_floor_gps_bounds.sql`
- `drizzle/meta/0003_snapshot.json`
- `drizzle/meta/_journal.json`
- `src/shared/types.ts`
- `src/server/floorGpsBounds.ts`
- `src/server/floorGpsBounds.test.ts`
- `src/server/index.ts`
- `src/client/components/admin/EditorToolbar.tsx`
- `src/client/components/admin/ManageFloorsModal.tsx`
- `src/client/components/admin/gpsBoundsForm.ts`
- `src/client/components/admin/gpsBoundsForm.test.ts`
- `src/client/components/admin/ManageFloorsModal.gps.test.tsx`
- `src/client/pages/admin/MapEditorCanvas.tsx`
