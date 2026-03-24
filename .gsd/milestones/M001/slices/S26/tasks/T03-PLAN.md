---
estimated_steps: 5
estimated_files: 6
skills_used:
  - react-best-practices
  - test
---

# T03: Deliver admin GPS bounds form UX and campus-mode access wiring

**Slice:** S26 — Admin GPS Bounds Configuration — Schema, API endpoint, and admin form for configuring real World lat/lng bounding boxes per floor and campus map
**Milestone:** M001

## Description

Ship the admin-facing GPS bounds workflow: floor rows gain bounds inputs and save actions with inline validation, campus mode can open Manage Floors for campus floor calibration, and `MapEditorCanvas` patches cached graph floor metadata from server-authoritative save responses.

## Steps

1. Add `src/client/components/admin/gpsBoundsForm.ts` pure helpers for parsing row input, computing validation state (`minLat < maxLat`, `minLng < maxLng`, no partial tuples), and building request payloads.
2. Update `src/client/components/admin/ManageFloorsModal.tsx` to render four GPS bounds inputs per floor row, show inline validation errors, disable save while invalid/pending, and call `PUT /api/admin/floors/:id/gps-bounds`.
3. Update `src/client/components/admin/EditorToolbar.tsx` + `src/client/pages/admin/MapEditorCanvas.tsx` so Manage Floors is available in campus context and modal receives the correct active building/floor set; patch `navGraph` floor metadata from save response using floorId-keyed updates.
4. Add `src/client/components/admin/gpsBoundsForm.test.ts` for helper-level validation/normalization logic and `src/client/components/admin/ManageFloorsModal.gps.test.tsx` for inline-error/save-state rendering behavior.
5. Run targeted client tests plus connector-side-panel regression to ensure S25 controls remain intact.

## Must-Haves

- [ ] Manage Floors supports GPS bounds edits for regular floors and campus floor.
- [ ] Invalid ordering/partial tuples produce inline row errors and prevent save requests.
- [ ] Successful save patches floor `gpsBounds` in editor state from API response (server-authoritative, no optimistic drift).

## Verification

- `npm test -- src/client/components/admin/gpsBoundsForm.test.ts`
- `npm test -- src/client/components/admin/ManageFloorsModal.gps.test.tsx src/client/components/admin/EditorSidePanel.connector.test.tsx`

## Observability Impact

- Signals added/changed: row-level inline validation state + save error messaging in `ManageFloorsModal`; authoritative endpoint errors surfaced to admin.
- How a future agent inspects this: run targeted component/helper tests; inspect modal UI state and network response while saving bounds in admin editor.
- Failure state exposed: invalid inputs are visible before request submission; failed API writes remain visible in-row instead of silently failing.

## Inputs

- `src/client/components/admin/ManageFloorsModal.tsx` — existing floor-management modal to extend.
- `src/client/pages/admin/MapEditorCanvas.tsx` — modal orchestration and cached `navGraph` state patching.
- `src/client/components/admin/EditorToolbar.tsx` — Manage Floors visibility rules (currently hidden for campus).
- `src/server/index.ts` — endpoint contract for `PUT /api/admin/floors/:id/gps-bounds` from T02.
- `src/shared/types.ts` — `NavFloor` `gpsBounds` contract to consume in UI state.

## Expected Output

- `src/client/components/admin/gpsBoundsForm.ts` — pure form parsing/validation/payload helpers.
- `src/client/components/admin/gpsBoundsForm.test.ts` — tests for bounds validation and payload shape.
- `src/client/components/admin/ManageFloorsModal.tsx` — GPS bounds row UI, inline errors, and save wiring.
- `src/client/components/admin/ManageFloorsModal.gps.test.tsx` — modal behavior tests for invalid/valid rows.
- `src/client/components/admin/EditorToolbar.tsx` — campus-visible Manage Floors entry.
- `src/client/pages/admin/MapEditorCanvas.tsx` — campus modal path and floor bounds patching from save response.
