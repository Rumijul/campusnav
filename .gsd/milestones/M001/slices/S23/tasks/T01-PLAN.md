# T01: 21-touch-gesture-fixes 01

**Slice:** S23 — **Milestone:** M001

## Description

Create the failing test scaffold that defines expected behavior for all three gesture fixes before any production code is written.

Purpose: Establish the RED baseline of the TDD cycle. Tests specify the contract precisely — executor in Plan 02 has no ambiguity about what "correct" means.
Output: `src/client/hooks/useMapViewport.test.ts` with 8 failing tests covering TOUCH-01, TOUCH-02, TOUCH-03.

## Must-Haves

- [ ] "Test file exists and all 8 test cases are written with specific assertions"
- [ ] "Every test runs and FAILS (red) before any production code is changed"
- [ ] "Test cases cover TOUCH-01 at 0°, 45°, and 90° stage rotation"
- [ ] "Test cases cover TOUCH-02 rotation pivot at 0° and 30° initial rotation"
- [ ] "Test cases cover TOUCH-03 threshold at 1°, exactly 2°, and 2.1° angleDiff"

## Files

- `src/client/hooks/useMapViewport.test.ts`
