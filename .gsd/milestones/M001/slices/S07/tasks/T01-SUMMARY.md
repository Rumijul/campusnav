---
phase: 06-route-visualization-directions
plan: 01
subsystem: api
tags: [vitest, typescript, react, hooks, pathfinding, directions]

# Dependency graph
requires:
  - phase: 03-graph-data-model-pathfinding-engine
    provides: PathResult type and pathfinding engine
  - phase: 05-search-location-selection
    provides: routeResult state to be consumed downstream

provides:
  - useRouteDirections hook for turn-by-turn step generation
  - generateDirections pure function for bearing-based direction computation
  - routesAreIdentical utility for PathResult comparison
  - DirectionStep and DirectionsResult types

affects:
  - 06-03-directions-sheet
  - 06-04-route-overlay
  - 06-05-accessibility

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Bearing-based turn classification: atan2(dx,-dy) for screen-space compass bearing"
    - "noUncheckedIndexedAccess compliance: explicit undefined checks instead of non-null assertions"
    - "TDD cycle: test first (RED) → implement (GREEN) → verify clean (no REFACTOR needed)"

key-files:
  created:
    - src/client/hooks/useRouteDirections.ts
    - src/client/hooks/useRouteDirections.test.ts
  modified: []

key-decisions:
  - "Screen-space bearing convention: atan2(dx, -dy) gives clockwise-from-north in screen coords (y increases down)"
  - "Boundary at |delta| < 30 = straight, 30-120 = turn, ≥120 = sharp — matches plan specification exactly"
  - "noUncheckedIndexedAccess: use undefined guard (continue) instead of non-null assertions for Map.get() and array indexing"
  - "generateDirections exported as pure function alongside hook — enables direct testing without React hook wrapper"

patterns-established:
  - "Bearing delta classification: straight <30°, turn 30-120°, sharp ≥120°"
  - "WALKING_SPEED_STANDARD=0.023, WALKING_SPEED_ACCESSIBLE=0.013 normalized units/s"
  - "Landmark reference appended to turn instruction when node.searchable && LANDMARK_TYPES.has(node.type)"

requirements-completed: [ROUT-05, ROUT-06]

# Metrics
duration: 4min
completed: 2026-02-19
---

# Phase 6 Plan 01: useRouteDirections Summary

**Bearing-based turn-by-turn direction generation hook with landmark references, accessible speed variants, and 23 passing vitest unit tests**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-19T20:34:01Z
- **Completed:** 2026-02-19T20:38:27Z
- **Tasks:** 3 (RED → GREEN → no REFACTOR needed)
- **Files modified:** 2

## Accomplishments
- `generateDirections` pure function: converts nodeId array + nodeMap → DirectionStep[] using screen-space compass bearings
- Turn classification: straight (<30°), turn-left/right (30-120°), sharp-left/right (≥120°) with landmark label appended to instruction
- `routesAreIdentical` utility: compares two PathResult objects by nodeId sequence
- `useRouteDirections` hook: memoized wrapper handling null/not-found PathResult
- 23 unit tests covering all cases: empty path, 2-node, straight, left/right turns, sharp turns, accessible segments, routesAreIdentical

## Task Commits

Each task was committed atomically:

1. **RED: Failing tests** - `742343d` (test)
2. **GREEN: Implementation** - `fe14f99` (feat)

_No REFACTOR commit needed — implementation was clean on first pass._

## Files Created/Modified
- `src/client/hooks/useRouteDirections.ts` - Hook, pure function, types, constants, utility
- `src/client/hooks/useRouteDirections.test.ts` - 23 unit tests covering all direction generation cases

## Decisions Made
- **Screen-space bearing:** Used `atan2(dx, -dy)` convention (y increases down) for correct clockwise-from-north bearings in canvas coordinate space
- **Strict TypeScript compliance:** `noUncheckedIndexedAccess` requires explicit undefined checks for Map.get() and array indexing — used `if (x === undefined) continue` instead of `!` assertions
- **Test geometry:** The sharp-turn test required precise coordinates (c=0.356,0.705) because the boundary is exactly 120° — floating-point precision matters at the threshold
- **Exported pure function:** `generateDirections` is exported alongside the hook for direct unit testing without React wrappers

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed incorrect test geometry for sharp-turn case**
- **Found during:** GREEN phase (test was written with wrong coordinates)
- **Issue:** Test used c(0.4,1.0) but bearing delta was only 101° (turn-right, not sharp). Second attempt c(0.35,0.76) produced 119.98° — just below 120° threshold.
- **Fix:** Computed exact coordinates for ≈215° bearing: c(0.356,0.705) gives delta≈125° (sharp-right)
- **Files modified:** src/client/hooks/useRouteDirections.test.ts
- **Verification:** `sharp-right` assertion passes, all 23 tests green
- **Committed in:** fe14f99 (GREEN commit)

---

**Total deviations:** 1 auto-fixed (1 bug in test geometry)
**Impact on plan:** Test geometry required numerical precision work. No scope creep. All plan requirements met.

## Issues Encountered
- `noUncheckedIndexedAccess` TypeScript flag (strict mode) required handling `Map.get()` and array index access as `T | undefined` — addressed with explicit undefined guards.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `useRouteDirections` hook ready for consumption in DirectionsSheet (Plan 03)
- `routesAreIdentical` utility ready for Plan 02 RouteLayer to detect route changes
- Types `DirectionStep` and `DirectionsResult` exported and ready for UI components

---
*Phase: 06-route-visualization-directions*
*Completed: 2026-02-19*

## Self-Check: PASSED

- `src/client/hooks/useRouteDirections.ts` — FOUND
- `src/client/hooks/useRouteDirections.test.ts` — FOUND
- `.planning/phases/06-route-visualization-directions/06-01-SUMMARY.md` — FOUND
- Commit `742343d` (RED: failing tests) — FOUND
- Commit `fe14f99` (GREEN: implementation) — FOUND
