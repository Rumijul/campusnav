---
phase: 19-student-floor-tab-ui
plan: "01"
subsystem: ui
tags: [react, hooks, typescript, vitest, tdd, floor-filtering, floor-plan-image]

# Dependency graph
requires:
  - phase: 19-00
    provides: "useFloorFiltering.test.ts with 7 failing RED-state test stubs"
  - phase: 18-admin-multi-floor-editor
    provides: "NavBuilding/NavFloor/NavNode types with floorId, connectsToFloorAboveId/BelowId"
provides:
  - "filterNodesByActiveFloor: active-floor nodes + dimmed adjacent elevator connectors, Set<string> dimmedNodeIds"
  - "filterRouteSegmentByFloor: filters route nodeIds to active floor via nodeMap"
  - "totalFloorCount: sums floors across all buildings for FloorTabStrip visibility decision"
  - "useFloorPlanImage: backward-compatible hook accepting optional FloorTarget param (campus | {buildingId, floorNumber})"
affects: [19-02, 19-03, FloorPlanCanvas, FloorTabStrip, RouteLayer]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure function module pattern: logic extracted from React hooks into named exports for direct testability"
    - "React rules of hooks compliance via sentinel URL: pass '' to useImage for unused slots instead of conditional hook calls"
    - "TDD GREEN phase: failing RED test file from prior plan becomes GREEN by creating the implementation module"

key-files:
  created:
    - src/client/hooks/useFloorFiltering.ts
  modified:
    - src/client/hooks/useFloorPlanImage.ts

key-decisions:
  - "filterNodesByActiveFloor includes only elevator type from adjacent floors (not stairs/ramp) — student-visible connector rule"
  - "useFloorPlanImage uses unconditional useImage calls with sentinel '' URL for unused slots — React hooks rules compliance"
  - "useFloorPlanImage target=undefined path preserved exactly — backward-compatible so FloorPlanCanvas needs no change until Plan 03"
  - "FloorTarget union type: { buildingId, floorNumber } | 'campus' — discriminated by string equality check (=== 'campus')"

patterns-established:
  - "Pure function filtering: filterNodesByActiveFloor, filterRouteSegmentByFloor, totalFloorCount are side-effect-free named exports"
  - "Hook parameterization: optional target param with sentinel URL keeps all useImage calls unconditional"

requirements-completed: [MFLR-05, MFLR-06, CAMP-05]

# Metrics
duration: 2min
completed: 2026-03-07
---

# Phase 19 Plan 01: Floor Filtering Pure Functions + useFloorPlanImage Parameterization Summary

**Three exported pure functions (filterNodesByActiveFloor, filterRouteSegmentByFloor, totalFloorCount) in useFloorFiltering.ts pass all 7 TDD tests; useFloorPlanImage gains optional FloorTarget param with backward-compatible legacy path**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-07T11:15:22Z
- **Completed:** 2026-03-07T11:17:38Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created `useFloorFiltering.ts` with three pure functions satisfying all 7 RED-state test stubs from Plan 00 (GREEN phase complete)
- `filterNodesByActiveFloor` correctly includes adjacent-floor elevator connectors as dimmed while excluding stairs/ramp (student-visibility rule)
- `useFloorPlanImage` parameterized to accept `{ buildingId, floorNumber } | 'campus' | undefined` — unconditional hook calls via sentinel `''` URL
- Full test suite: 64 tests pass across hooks + shared (no regressions); `npx tsc --noEmit` clean

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement useFloorFiltering.ts (GREEN)** - `d8c85f7` (feat)
2. **Task 2: Parameterize useFloorPlanImage** - `e26ba8f` (feat)

**Plan metadata:** (docs commit follows)

_Note: This plan is the GREEN phase of the TDD loop. RED phase (test stubs) was Plan 00._

## Files Created/Modified
- `src/client/hooks/useFloorFiltering.ts` - Three pure functions: filterNodesByActiveFloor, filterRouteSegmentByFloor, totalFloorCount
- `src/client/hooks/useFloorPlanImage.ts` - Added optional FloorTarget param; sentinel '' URL for unused useImage slots; legacy path unchanged

## Decisions Made
- Only `elevator` type connector nodes from adjacent floors are included dimmed (not `stairs`/`ramp`) — per v1.0 student-visibility design where stairs/ramp are routing-infrastructure invisible to students
- `useFloorPlanImage` hook uses `''` sentinel string for unused `useImage` slots rather than conditional hook calls — strict adherence to React rules of hooks
- Legacy `undefined` target path in `useFloorPlanImage` kept identical to prior implementation — FloorPlanCanvas requires zero changes until Plan 03 rewires it
- `FloorTarget` type defined locally in the hook file (not exported) since it will be consumed as a parameter shape by Plan 03 callers

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- `useFloorFiltering.ts` ready for FloorPlanCanvas (Plan 03) to import and call
- `useFloorPlanImage` accepts floor targets — Plan 03 will pass `{ buildingId, floorNumber }` instead of no-arg call
- `totalFloorCount` ready for FloorTabStrip (Plan 02) visibility decision
- All downstream plans (19-02 FloorTabStrip, 19-03 FloorPlanCanvas wiring) can proceed

---
*Phase: 19-student-floor-tab-ui*
*Completed: 2026-03-07*
