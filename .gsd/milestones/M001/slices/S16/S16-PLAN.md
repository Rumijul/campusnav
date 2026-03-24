# S16: Node Selection Fixes & Admin Room # Edit — completed 2026 02 28 [INSERTED]

**Goal:** unit tests prove Node Selection Fixes & Admin Room # Edit — completed 2026-02-28 [INSERTED] works
**Demo:** unit tests prove Node Selection Fixes & Admin Room # Edit — completed 2026-02-28 [INSERTED] works

## Must-Haves


## Tasks

- [x] **T01: Fix admin map editor node selection: clicking an already-selected node toggles it…**
  - Fix admin map editor node selection: clicking an already-selected node toggles it off (deselects), and clicking the floor plan image in select mode also deselects any current selection.
- [x] **T02: Make the A and B selection pins in the student-facing map tappable…**
  - Make the A and B selection pins in the student-facing map tappable so users can clear a route endpoint by tapping its pin directly.
- [x] **T03: Add inline editing to the Room # column in NodeDataTable (consistent with…**
  - Add inline editing to the Room # column in NodeDataTable (consistent with the existing Name/Type pattern), and improve room number display in the SearchOverlay result dropdown to show "Room 204" with a separator rather than the raw value "204".

## Files Likely Touched

- `src/client/components/FloorPlanImage.tsx`
- `src/client/pages/admin/MapEditorCanvas.tsx`
- `src/client/components/SelectionMarkerLayer.tsx`
- `src/client/components/FloorPlanCanvas.tsx`
- `src/client/components/admin/NodeDataTable.tsx`
- `src/client/components/SearchOverlay.tsx`
