# Quick Task: when deploying in render, it shows this
Render deploy build was failing at `tsc --noEmit && vite build` with strict TypeScript errors around union response narrowing, optional string indexing, and nullable GPS bounds.

**Date:** 2026-03-25
**Branch:** gsd/quick/3-when-deploying-in-render-it-shows-this-d

## What Changed
- Added explicit runtime/type guards for GPS bounds save error payloads in `ManageFloorsModal` and used them in non-OK response handling.
- Added explicit runtime/type guards for connector link success/error payloads in `MapEditorCanvas` and replaced ad hoc union checks/casts.
- Fixed strict optional indexing in connector candidate label formatting by switching from `nodeType[0]` to `nodeType.charAt(0)`.
- Fixed nullable bounds typing in GPS projection by explicitly narrowing with `isGpsBoundsCalibrated(bounds)` before reading bound fields.

## Files Modified
- `src/client/components/admin/ManageFloorsModal.tsx`
- `src/client/pages/admin/MapEditorCanvas.tsx`
- `src/client/components/admin/connectorLinking.ts`
- `src/shared/gps.ts`

## Verification
- `npm run test -- --run src/shared/gps.test.ts src/client/components/admin/connectorLinking.test.ts`
  - 2 test files passed, 16 tests passed.
- `npm run build`
  - `tsc --noEmit` passed.
  - `vite build` completed successfully.
