---
phase: 19-student-floor-tab-ui
plan: "00"
subsystem: testing
tags: [vitest, tdd, pure-functions, floor-filtering, typescript]

# Dependency graph
requires:
  - phase: 17-multi-floor-pathfinding-engine
    provides: NavNode.floorId, cross-floor pathfinding result with nodeIds
  - phase: 16-multi-floor-data-model
    provides: NavBuilding/NavFloor/NavNode types in shared/types.ts
provides:
  - Failing test stubs for filterNodesByActiveFloor, filterRouteSegmentByFloor, totalFloorCount
  - RED state TDD foundation for Plan 01 implementation
affects: [19-01-useFloorFiltering-implementation]

# Tech tracking
tech-stack:
  added: []
  patterns: [TDD RED state — test stubs precede implementation; makeNode factory for concise fixture data]

key-files:
  created:
    - src/client/hooks/useFloorFiltering.test.ts
  modified: []

key-decisions:
  - "Elevator nodes from adjacent floors appear dimmed on active floor (accessibility visible); stairs/ramps do NOT appear from adjacent floors"
  - "filterNodesByActiveFloor returns { nodes, dimmedNodeIds } — dimmedNodeIds is a Set<string> for O(1) lookup in LandmarkLayer"
  - "filterRouteSegmentByFloor takes nodeIds[] + nodeMap + activeFloorId — pure function requiring no React hook context"
  - "totalFloorCount sums all floors across all buildings — single-floor campuses return 1 and hide tab UI"

patterns-established:
  - "makeNode factory: Partial<NavNode> & { id, floorId } overrides with sensible defaults — same pattern as useRouteDirections.test.ts"

requirements-completed: [MFLR-05, MFLR-06, CAMP-05]

# Metrics
duration: 1min
completed: 2026-03-07
---

# Phase 19 Plan 00: useFloorFiltering Test Stubs (RED State) Summary

**7 failing Vitest test stubs for filterNodesByActiveFloor, filterRouteSegmentByFloor, and totalFloorCount — RED state established for Plan 01 TDD loop**

## Performance

- **Duration:** ~1 min
- **Started:** 2026-03-07T11:12:32Z
- **Completed:** 2026-03-07T11:13:20Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Created `src/client/hooks/useFloorFiltering.test.ts` with all 7 test stubs
- Vitest picks up the file and reports ERR_MODULE_NOT_FOUND (expected RED state)
- Tests define the precise function signatures Plan 01 must implement
- Inline fixture data (no external JSON) using `makeNode` factory pattern

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useFloorFiltering.test.ts stub (RED state)** - `6bdf4e0` (test)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified
- `src/client/hooks/useFloorFiltering.test.ts` - 7 Vitest test stubs for floor filtering pure functions; fails due to missing ./useFloorFiltering import

## Decisions Made
- Elevator nodes from adjacent floors appear dimmed on active floor; stairs/ramps from adjacent floors are NOT shown — matches Phase 19 context decision (accessibility connectors visible, routing-only connectors hidden)
- `filterNodesByActiveFloor` returns `{ nodes: NavNode[], dimmedNodeIds: Set<string> }` — Set enables O(1) lookup in LandmarkLayer render
- Test fixture uses two floors: floor 1 has a room + stairs node; floor 2 has elevator with `connectsToFloorBelowId: 1`

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- RED state confirmed: Vitest reports `Cannot find module './useFloorFiltering'`
- Plan 01 can immediately implement `filterNodesByActiveFloor`, `filterRouteSegmentByFloor`, and `totalFloorCount` to achieve GREEN
- All function signatures are locked in the test file; Plan 01 must match them exactly

## Self-Check

### Files
- `src/client/hooks/useFloorFiltering.test.ts` — exists, 156 lines, 7 tests
- `.planning/phases/19-student-floor-tab-ui/19-00-SUMMARY.md` — this file

### Commits
- `6bdf4e0` — test(19-00): add failing test stubs for useFloorFiltering (RED state)

## Self-Check: PASSED

---
*Phase: 19-student-floor-tab-ui*
*Completed: 2026-03-07*
