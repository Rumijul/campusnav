# S23: Touch Gesture Fixes

**Goal:** Create the failing test scaffold that defines expected behavior for all three gesture fixes before any production code is written.
**Demo:** Create the failing test scaffold that defines expected behavior for all three gesture fixes before any production code is written.

## Must-Haves


## Tasks

- [x] **T01: 21-touch-gesture-fixes 01**
  - Create the failing test scaffold that defines expected behavior for all three gesture fixes before any production code is written.

Purpose: Establish the RED baseline of the TDD cycle. Tests specify the contract precisely — executor in Plan 02 has no ambiguity about what "correct" means.
Output: `src/client/hooks/useMapViewport.test.ts` with 8 failing tests covering TOUCH-01, TOUCH-02, TOUCH-03.
- [x] **T02: 21-touch-gesture-fixes 02**
  - Fix `handleTouchMove` in `useMapViewport.ts` to make all 8 failing tests pass by replacing the buggy stage-local coordinate computation with the Konva inverse-transform approach and adding the 2-degree rotation threshold.

Purpose: Students and admins experience correct pinch-to-zoom and two-finger rotation on mobile at any rotation angle, without map jumps or jitter.
Output: Modified `src/client/hooks/useMapViewport.ts` — only `handleTouchMove` changes. All 8 vitest tests GREEN.

## Files Likely Touched

- `src/client/hooks/useMapViewport.test.ts`
- `src/client/hooks/useMapViewport.ts`
