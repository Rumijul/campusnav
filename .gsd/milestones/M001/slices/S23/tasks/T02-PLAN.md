# T02: 21-touch-gesture-fixes 02

**Slice:** S23 — **Milestone:** M001

## Description

Fix `handleTouchMove` in `useMapViewport.ts` to make all 8 failing tests pass by replacing the buggy stage-local coordinate computation with the Konva inverse-transform approach and adding the 2-degree rotation threshold.

Purpose: Students and admins experience correct pinch-to-zoom and two-finger rotation on mobile at any rotation angle, without map jumps or jitter.
Output: Modified `src/client/hooks/useMapViewport.ts` — only `handleTouchMove` changes. All 8 vitest tests GREEN.

## Must-Haves

- [ ] "Pinch-to-zoom on a rotated floor plan keeps the map stationary under both fingers — no jump toward stage origin"
- [ ] "Two-finger rotation pivots around the touch midpoint at all canvas rotation angles"
- [ ] "A slow pinch gesture with incidental finger rotation below 2° does not change the map's rotation"
- [ ] "The onScaleChange callback is still called after every pinch-zoom scale mutation"
- [ ] "All 8 vitest tests pass (GREEN)"

## Files

- `src/client/hooks/useMapViewport.ts`
