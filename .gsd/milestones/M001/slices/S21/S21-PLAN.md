# S21: Student Floor Tab UI — completed 2026 03 07

**Goal:** unit tests prove Student Floor Tab UI — completed 2026-03-07 works
**Demo:** unit tests prove Student Floor Tab UI — completed 2026-03-07 works

## Must-Haves


## Tasks

- [x] **T01: Create the Wave 0 test stub for Phase 19's filtering pure functions.**
  - Create the Wave 0 test stub for Phase 19's filtering pure functions.
- [x] **T02: Create the pure-function filtering module and parameterize the floor plan image hook.…**
  - Create the pure-function filtering module and parameterize the floor plan image hook. This is the GREEN phase of the TDD loop started in Plan 00.
- [x] **T03: Build the UI components needed for floor navigation: dimmed marker support in…**
  - Build the UI components needed for floor navigation: dimmed marker support in LandmarkMarker/LandmarkLayer, and the new FloorTabStrip HTML overlay.
- [x] **T04: Rewire FloorPlanCanvas.tsx with full multi-floor state management: active building/floor state, derived filtering…**
  - Rewire FloorPlanCanvas.tsx with full multi-floor state management: active building/floor state, derived filtering via useMemo, FloorTabStrip rendering, auto-switch on route trigger, default initialization on graph load, and dimmed connector tap handling.
- [x] **T05: Human verification of the complete Phase 19 student floor tab UI.**
  - Human verification of the complete Phase 19 student floor tab UI.

## Files Likely Touched

- `src/client/hooks/useFloorFiltering.test.ts`
- `src/client/hooks/useFloorFiltering.ts`
- `src/client/hooks/useFloorPlanImage.ts`
- `src/client/components/LandmarkMarker.tsx`
- `src/client/components/LandmarkLayer.tsx`
- `src/client/components/FloorTabStrip.tsx`
- `src/client/components/FloorPlanCanvas.tsx`
