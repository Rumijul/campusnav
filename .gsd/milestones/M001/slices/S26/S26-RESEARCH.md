# S26 Research — Admin GPS Bounds Configuration

**Researched:** 2026-03-24  
**Scope depth:** Targeted (existing stack, moderate server+admin integration)  
**Confidence:** High

## Active Requirements This Slice Owns

- **R009 — Admin can configure min/max latitude and longitude bounds per floor and for campus map.**
- **R010 — Admin GPS bounds form enforces minLat < maxLat and minLng < maxLng with inline errors.**

## Skills Discovered

- **Already installed and directly relevant (in-session):**
  - `react-best-practices`
  - `drizzle-orm`
  - `test`
- **Skill discovery commands run:**
  - `npx skills find "hono"` → installed `yusukebe/hono-skill@hono` globally.
  - `npx skills find "zod"` → installed `pproenca/dot-skills@zod` globally.
- **Registry note:** globally installed skills are not exposed in the current Skill registry yet, so implementation guidance below uses in-session skills + codebase patterns.

### Skill rules applied to this slice

- From `react-best-practices`:
  - `rerender-derived-state-no-effect`: derive per-floor validation state from form values during render (or memoized pure helper), not effect-driven synchronization.
  - `js-index-maps`: use `Map` keyed by floorId for repeated floor update/lookups when patching `navGraph` after save.
- From `drizzle-orm`:
  - avoid raw SQL string construction in route handlers; keep writes via typed Drizzle `update(...).set(...).where(eq(...))`.
  - apply schema evolution through Drizzle migration artifacts (schema + migration files), not ad-hoc runtime SQL.
- From `test`:
  - match existing Vitest conventions and colocated `*.test.ts(x)` style already used in `src/server` and `src/client/components/admin`.

---

## Summary

S26 is a straightforward extension of existing S25 patterns, but there are two non-obvious constraints:

1. **Campus bounds are currently unreachable in admin UI**
   - `ManageFloorsModal` is only opened for non-campus building context.
   - Toolbar hides **Manage Floors** while campus is active (`EditorToolbar.tsx`).
   - In `MapEditorCanvas.tsx`, `activeBuilding` is intentionally `undefined` for campus mode, so modal rendering is blocked.

2. **No floor-level metadata update endpoint exists yet**
   - Current admin floor endpoints handle add/delete/image replacement.
   - No endpoint updates per-floor scalar metadata (needed for GPS bounds).

What already exists and can be reused safely:

- `floors` table is the right ownership point for map calibration metadata (`src/server/db/schema.ts`).
- `/api/map` already serializes `buildings -> floors -> nodes/edges`; adding optional `gpsBounds` is additive and low-risk (`src/server/index.ts`).
- S25 established the preferred pattern: **server-authoritative updates + local `navGraph` patching**, not optimistic cross-floor edits.

---

## Implementation Landscape (files that matter)

### 1) `src/server/db/schema.ts` (schema seam)

Current `floors` columns: `id`, `buildingId`, `floorNumber`, `imagePath`, `updatedAt`.

S26 needs four nullable real columns on `floors`:
- `gps_min_lat`
- `gps_max_lat`
- `gps_min_lng`
- `gps_max_lng`

### 2) `drizzle/*` + `drizzle/meta/*` (migration seam)

Current latest migration is `0002_campus_entrance_bridge.sql`.
S26 needs next migration (`0003_*`) plus snapshot/journal updates.

### 3) `src/shared/types.ts` (API contract seam)

`NavFloor` currently has no GPS field.
Add optional structure for downstream S27 consumption, e.g.:
- `gpsBounds?: { minLat; maxLat; minLng; maxLng }`

### 4) `src/server/index.ts` (API seams)

Two changes:
- **GET `/api/map`**: include `floor.gpsBounds` when floor has complete bounds.
- **NEW protected endpoint**: update bounds for one floor id (recommended `PUT /api/admin/floors/:id/gps-bounds`).

### 5) `src/client/components/admin/ManageFloorsModal.tsx` (admin form seam)

Current modal handles:
- replace floor image
- delete floor
- add floor

S26 needs per-row GPS bounds inputs + row-level save + inline validation errors.

### 6) `src/client/pages/admin/MapEditorCanvas.tsx` (orchestration seam)

Needs to:
- expose campus floor to modal flow,
- receive GPS bounds save callbacks,
- patch `navGraph` floor metadata after successful save (server-authoritative payload).

### 7) `src/client/components/admin/EditorToolbar.tsx` (access seam)

Manage modal button is hidden for campus mode today.
S26 must make campus bounds editable, so this visibility rule needs adjustment.

### 8) Tests (new)

No existing test currently covers GPS bounds schema/endpoint/form logic.
Add focused unit tests for validation + patching utilities and server validation behavior.

---

## Natural Work Seams (task decomposition)

1. **Data contract + persistence foundation**
   - DB schema + migration + shared type + `/api/map` serialization.
2. **Server mutation endpoint**
   - request validation, floor existence checks, bounds update, response payload contract.
3. **Admin form + campus accessibility**
   - modal inputs + inline errors + save wiring + local graph patch + campus entry path.
4. **Regression/verification**
   - targeted Vitest coverage and full suite run.

These seams can be split into T01/T02/T03 cleanly, with T01 unblocking all others.

---

## Recommendation

### API contract (recommended)

Use one floor-scoped endpoint for both regular floors and campus floor (floorNumber 0):

- `PUT /api/admin/floors/:id/gps-bounds`
- body:
  - either all numeric fields present,
  - or all `null` (clear/reset).

Recommended response:
- `{ ok: true, floorId, gpsBounds: { minLat, maxLat, minLng, maxLng } | null }`

Validation rules (server authoritative):
- floor id must exist,
- numeric shape must be complete (no partial tuple),
- `minLat < maxLat`,
- `minLng < maxLng`.

### UI behavior (recommended)

- Add four number inputs per floor row in `ManageFloorsModal`.
- Show inline row-level errors before request for R010.
- Disable row save button when local validation fails.
- In campus mode, open same modal against campus floor set (no separate endpoint).

### State update pattern (recommended)

Follow S25 decision pattern (D003):
- treat server response as authoritative,
- patch `navGraph` floor metadata from response payload,
- avoid optimistic derived local calibration writes.

---

## Build / Proof Order

1. **T01 — Schema + type + map serialization**
   - Add columns and migration.
   - Extend `NavFloor` type.
   - Emit optional `gpsBounds` in `/api/map`.

2. **T02 — Bounds endpoint + server tests**
   - Add `PUT /api/admin/floors/:id/gps-bounds`.
   - Enforce full validation and deterministic error codes/messages.

3. **T03 — Admin form + campus path + client tests**
   - Add bounds inputs + inline errors in `ManageFloorsModal`.
   - Enable campus access to modal.
   - Patch `navGraph` from successful save response.

4. **T04 — Full regression run**
   - targeted tests first, then full suite.

---

## Verification Plan

### Targeted (must pass)

- `npm test -- src/server/floorGpsBounds.test.ts` *(new)*
- `npm test -- src/client/components/admin/gpsBoundsForm.test.ts` *(new helper-focused test; or equivalent location)*
- `npm test -- src/client/components/admin/ManageFloorsModal.gps.test.tsx` *(optional but recommended if component test harness remains lightweight)*

### Existing regression checks (recommended)

- `npm test -- src/client/components/admin/connectorLinking.test.ts`
- `npm test -- src/client/components/admin/EditorSidePanel.connector.test.tsx`
- `npm test`

### Manual admin smoke checks

1. Open non-campus building → Manage Floors modal shows GPS fields per floor.
2. Enter invalid tuple (`minLat >= maxLat` or `minLng >= maxLng`) → inline error appears, save blocked.
3. Enter valid tuple and save → persists after refresh/reload.
4. Switch to campus mode and open same flow → campus floor bounds editable.

---

## Risks / Fragile Points

- **Campus path gap:** if toolbar/modal gating is not updated, R009 fails for campus even if endpoint exists.
- **Partial tuple writes:** allowing partial null/number combinations creates ambiguous map projection state for S27.
- **Strict typing friction:** with `exactOptionalPropertyTypes`, optional `gpsBounds` should be conditionally added (not `undefined` fields sprayed into payload objects).
- **Worktree runtime constraint:** known local Vite runtime instability in `.gsd/worktrees/*`; rely on Vitest + artifact checks for this slice.

---

## Planner-ready file shortlist

- `src/server/db/schema.ts`
- `drizzle/0003_*.sql` + `drizzle/meta/*`
- `src/shared/types.ts`
- `src/server/index.ts`
- `src/client/components/admin/ManageFloorsModal.tsx`
- `src/client/pages/admin/MapEditorCanvas.tsx`
- `src/client/components/admin/EditorToolbar.tsx`
- `src/server/floorGpsBounds.test.ts` *(new)*
- `src/client/components/admin/gpsBoundsForm.test.ts` *(new; or equivalent helper test)*

---

## Forward Intelligence for S27

S27 (student GPS dot) should assume this slice returns **complete and validated** `floor.gpsBounds` tuples only. Do not make S27 responsible for correcting malformed bounds; fail closed when `gpsBounds` is missing.
