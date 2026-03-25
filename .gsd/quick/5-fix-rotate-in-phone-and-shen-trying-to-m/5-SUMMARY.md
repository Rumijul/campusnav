# Quick Task: fix rotate in phone. and shen trying to move with finger in phone, it goes to somewhere else.

**Date:** 2026-03-25
**Branch:** gsd/quick/5-fix-rotate-in-phone-and-shen-trying-to-m

## What Changed
- Fixed mobile rotation delta handling by normalizing per-frame angle differences to the shortest path (`[-180, 180)`) before applying the 2° jitter threshold, preventing large spin jumps when touch angle crosses the `+π/-π` boundary.
- Improved touch handoff behavior between two-finger pinch/rotate and one-finger pan:
  - stop drag when entering multi-touch,
  - resume drag when one touch remains,
  - reset multi-touch tracking refs cleanly on touch end.
- Expanded gesture math tests to cover angle wrap-around scenarios so rotation remains stable and does not jump by hundreds of degrees.

## Files Modified
- `src/client/hooks/useMapViewport.ts`
- `src/client/hooks/useMapViewport.test.ts`
- `.gsd/quick/5-fix-rotate-in-phone-and-shen-trying-to-m/5-SUMMARY.md`

## Verification
- `npx biome check src/client/hooks/useMapViewport.ts src/client/hooks/useMapViewport.test.ts`
- `npm run test -- src/client/hooks/useMapViewport.test.ts`
- `npm run typecheck`
