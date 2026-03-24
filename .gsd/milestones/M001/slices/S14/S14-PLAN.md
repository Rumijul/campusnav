# S14: Restore Location Detail View — completed 2026 02 27

**Goal:** unit tests prove Restore Location Detail View — completed 2026-02-27 works
**Demo:** unit tests prove Restore Location Detail View — completed 2026-02-27 works

## Must-Haves


## Tasks

- [x] **T01: Create LocationDetailSheet.tsx — a custom CSS bottom sheet component that displays landmark…**
  - Create LocationDetailSheet.tsx — a custom CSS bottom sheet component that displays landmark detail fields when a student taps a map location.
- [x] **T02: Wire LocationDetailSheet into FloorPlanCanvas.tsx: add detailNode state, create dual-action landmark tap handler…**
  - Wire LocationDetailSheet into FloorPlanCanvas.tsx: add detailNode state, create dual-action landmark tap handler, auto-close detail when route triggers, update legend bottom offset, and render the sheet.
- [x] **T03: Human verification that ROUT-07 is fully working: detail sheet opens on landmark…**
  - Human verification that ROUT-07 is fully working: detail sheet opens on landmark tap, coexists with route selection, is dismissible, and does not block map interaction.

## Files Likely Touched

- `src/client/components/LocationDetailSheet.tsx`
- `src/client/components/FloorPlanCanvas.tsx`
