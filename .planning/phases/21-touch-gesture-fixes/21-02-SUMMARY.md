---
phase: 21-touch-gesture-fixes
plan: "02"
subsystem: ui
tags: [konva, touch, gesture, pinch-zoom, rotation, viewport, canvas]

# Dependency graph
requires:
  - phase: 21-01
    provides: "8 failing vitest tests (TOUCH-01, TOUCH-02, TOUCH-03) that specify correct gesture behavior"
provides:
  - "Fixed handleTouchMove using Konva inverse-transform for focal-point zoom at any rotation angle"
  - "2-degree rotation jitter threshold preventing spurious rotation during pure pinch gestures"
  - "Rotation pivot corrected to touch midpoint rather than stage origin"
  - "onScaleChange callback preserved after every scale mutation"
affects:
  - 22-accessible-routing
  - any phase touching useMapViewport.ts or Konva stage mutations

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Konva inverse-transform pattern: stage.getAbsoluteTransform().copy().invert().point(screenPoint) to convert screen coords to stage-local before any mutation"
    - "Konva.Transform forward projection: new Konva.Transform().rotate().scale().point() to recalculate stage position after mutation"
    - "Per-frame dead zone: |angleDiff| > 2 degrees threshold applied each frame, no accumulation"

key-files:
  created: []
  modified:
    - src/client/hooks/useMapViewport.ts

key-decisions:
  - "Use getAbsoluteTransform().copy().invert() (not manual sin/cos math) for screen-to-local conversion — mandatory per CONTEXT.md locked decisions"
  - "Scale and rotation applied independently in the same frame, no dominance logic"
  - "TOUCH-03 threshold is strict greater-than (> 2 degrees), not >=, validated at exact boundary by Test 7"
  - "Remove dx/dy pan terms: focal-point recalculation tracks midpoint movement implicitly"

patterns-established:
  - "Inverse-transform before mutation: always read stage-local coords BEFORE mutating scale/rotation (getAbsoluteTransform is live)"
  - "Order matters: apply scale first, then rotation, then recalculate position"
  - "Container offset: subtract getBoundingClientRect() before applying inverse transform"

requirements-completed: [TOUCH-01, TOUCH-02, TOUCH-03]

# Metrics
duration: ~15min
completed: 2026-03-10
---

# Phase 21 Plan 02: Touch Gesture Fixes Summary

**Konva inverse-transform focal-point zoom and 2-degree rotation threshold fix in useMapViewport.ts, making all 8 touch gesture unit tests pass and verified correct on device**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-10T08:40:00Z
- **Completed:** 2026-03-10T08:56:05Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Replaced buggy stage-local coordinate computation in handleTouchMove with Konva inverse-transform approach — pinch-zoom now holds the focal point stationary at any canvas rotation angle
- Added 2-degree per-frame rotation dead zone preventing map rotation drift during pure pinch gestures
- All 8 vitest tests for TOUCH-01, TOUCH-02, TOUCH-03 pass (GREEN) with no regressions in the full suite
- User verified all three touch behaviors correct on device (pinch-zoom holds position, rotation pivots at midpoint, pure pinch does not rotate)

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace handleTouchMove with inverse-transform focal-point + threshold fix** - `b443641` (feat)
2. **Task 2: Manual touch verification on device** - human-approved checkpoint (no code changes)

**Plan metadata:** committed via docs commit (see below)

## Files Created/Modified

- `src/client/hooks/useMapViewport.ts` - handleTouchMove replaced with Konva inverse-transform focal-point zoom, pivot correction, and 2-degree jitter threshold

## Decisions Made

- Used `stage.getAbsoluteTransform().copy().invert().point()` for screen-to-stage-local conversion (mandatory per CONTEXT.md locked decisions; avoids brittle manual sin/cos math that breaks at non-zero rotation)
- Removed dx/dy pan terms from position recalculation — the focal-point formula already tracks midpoint movement implicitly, so including dx/dy caused double-counting
- Applied scale before rotation before position recalculation — order is critical because getAbsoluteTransform is live and reflects current state
- Rotation threshold is strict greater-than (> 2 degrees) per TOUCH-03 spec; boundary value exactly 2 degrees does NOT trigger rotation

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None — implementation matched the spec in CONTEXT.md and RESEARCH.md exactly. The pitfall notes in the plan (read stageLocal before mutation, subtract container offset, strict > threshold) were followed precisely, avoiding the documented failure modes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 21 (Touch Gesture Fixes) is fully complete: tests green, device-verified, all three requirements (TOUCH-01, TOUCH-02, TOUCH-03) satisfied
- useMapViewport.ts is ready for consumption by any future phase that modifies the Konva viewport
- The inverse-transform pattern established here should be reused for any future screen-to-stage-local conversions

---
*Phase: 21-touch-gesture-fixes*
*Completed: 2026-03-10*
