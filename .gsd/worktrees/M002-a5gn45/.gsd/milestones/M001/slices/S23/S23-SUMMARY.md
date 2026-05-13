---
id: S23
parent: M001
milestone: M001
provides: []
requires: []
affects: []
key_files: []
key_decisions: []
patterns_established: []
observability_surfaces: []
drill_down_paths: []
duration: 
verification_result: passed
completed_at: 
blocker_discovered: false
---
# S23: Touch Gesture Fixes

**# Phase 21 Plan 01: Touch Gesture Fixes — Test Scaffold Summary**

## What Happened

# Phase 21 Plan 01: Touch Gesture Fixes — Test Scaffold Summary

**8 failing unit tests establishing the RED contract for gesture math helpers: inverse-transform screen-to-stage conversion, pivot-aware position recalculation, and 2-degree rotation threshold**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-10T05:54:06Z
- **Completed:** 2026-03-10T05:57:10Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Created `src/client/hooks/useMapViewport.test.ts` with 8 failing tests (RED phase of TDD cycle)
- 3 tests for TOUCH-01: `toStageLocalFromScreen` at 0°, 45°, and 90° stage rotation — validates Konva inverse transform approach vs naive division
- 2 tests for TOUCH-02: `computePivotPosition` at 0° and 30° initial rotation — validates midpoint stays stationary after rotation
- 3 tests for TOUCH-03: `applyRotationThreshold` at 1°, exactly 2°, and 2.1° — validates strict greater-than threshold with exact boundary

## Task Commits

Each task was committed atomically:

1. **Task 1: Write failing tests for TOUCH-01, TOUCH-02, TOUCH-03** - `1274ad5` (test)

## Files Created/Modified

- `src/client/hooks/useMapViewport.test.ts` - 8 failing tests covering all three gesture bug requirements; imports named exports that Plan 02 must add to useMapViewport.ts

## Decisions Made

- Used named-export import strategy (test imports `toStageLocalFromScreen`, `computePivotPosition`, `applyRotationThreshold` from production file) — all tests fail with `TypeError: not a function` since exports don't exist yet, giving clean RED state
- MockStage `getAbsoluteTransform` uses a real `Konva.Transform` instance (translate + rotate + scale) to exactly replicate what `Konva.Stage.getAbsoluteTransform()` returns internally — avoids any approximation in mock math
- TOUCH-01 Test 1 at 0° verifies canonical case: screen (200,300) → stageLocal (200,300) → position (-200,-300) after 2x zoom
- TOUCH-01 Tests 2+3 verify non-trivial rotated cases with precise expected values derived from rotation matrix math
- TOUCH-03 boundary case (Test 7 at exactly 2°) explicitly validates strict greater-than semantics as specified in locked decisions

## Deviations from Plan

None - plan executed exactly as written.

The plan allowed approach (b) — mock Konva.Stage objects with formula tests. The chosen implementation uses named export imports (a stronger contract than inline mock formula tests) which ensures Plan 02 must add specific exports to useMapViewport.ts to make tests pass.

## Issues Encountered

Initial test design (v1) had 4/8 tests passing because the tests verified correct formulas in isolation (not against production code). Corrected by switching to named export imports — tests now fail because production code lacks the required exports.

## Next Phase Readiness

- Plan 02 (GREEN phase) must add three named exports to `useMapViewport.ts`:
  - `toStageLocalFromScreen(stage, screenPoint)` — inverse transform approach
  - `computePivotPosition(stageLocal, screenCenter, newScale, newRotationDeg)` — Konva.Transform forward projection
  - `applyRotationThreshold(angleDiffDeg)` — strict `|x| > 2` check
- All test assertions are mathematically precise — implementation must match expected values within 1e-6 tolerance
- No blockers for Plan 02

---
*Phase: 21-touch-gesture-fixes*
*Completed: 2026-03-10*

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
