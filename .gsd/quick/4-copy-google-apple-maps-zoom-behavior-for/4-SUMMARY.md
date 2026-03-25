# Quick Task: copy google/apple maps zoom behavior for phone

**Date:** 2026-03-25
**Branch:** gsd/quick/4-copy-google-apple-maps-zoom-behavior-for

## What Changed
- Added `computeTwoTouchFrameTransform` in `useMapViewport` to compute each two-finger frame using the previous midpoint as the anchor, so pinch + drag behaves like mobile map apps (the grabbed map point follows finger movement).
- Updated `handleTouchMove` to use the new frame helper, then apply scale, rotation, and position together from the computed transform.
- Added `TOUCH-04` gesture tests to lock in phone-style two-finger midpoint pan behavior and midpoint-anchor preservation across pinch+drag.
- Cleaned stale test header/comments so the file reflects the current verification intent.

## Files Modified
- `src/client/hooks/useMapViewport.ts`
- `src/client/hooks/useMapViewport.test.ts`
- `.gsd/quick/4-copy-google-apple-maps-zoom-behavior-for/4-SUMMARY.md`

## Verification
- `npx biome check src/client/hooks/useMapViewport.ts src/client/hooks/useMapViewport.test.ts`
- `npm test -- src/client/hooks/useMapViewport.test.ts`
- `npm run typecheck`
