---
phase: 19-student-floor-tab-ui
plan: "03"
subsystem: ui
tags: [react, konva, multi-floor, floor-tabs, filtering]

# Dependency graph
requires:
  - phase: 19-01
    provides: filterNodesByActiveFloor, filterRouteSegmentByFloor, totalFloorCount pure functions; useFloorPlanImage parameterized hook
  - phase: 19-02
    provides: FloorTabStrip component; LandmarkLayer dimmedNodeIds prop; LandmarkMarker dimming via opacity
provides:
  - FloorPlanCanvas with full multi-floor state: activeBuildingId, activeFloorId, showTabStrip
  - Default initialization to Floor 1 of first non-campus building on graph load
  - handleFloorSwitch and handleBuildingSwitch helpers with fitToScreen
  - handleLandmarkTap auto-switching floor on dimmed connector tap
  - handleRouteTrigger auto-switching to start node's floor on route compute
  - activeRoutePoints filtered to active floor via filterRouteSegmentByFloor
  - FloorTabStrip rendered conditionally (hidden when DirectionsSheet open or <=1 total floor)
  - LandmarkLayer receiving filteredNodes and dimmedNodeIds for floor-aware display
  - Canvas legend bottom offset accounting for FloorTabStrip presence
affects:
  - Student-facing map experience for multi-floor buildings

# Tech tracking
tech-stack:
  added: []
  patterns:
    - floorImageTarget useMemo placed before useFloorPlanImage hook call — hook ordering with derived params
    - biome-ignore on initialization useEffect with graphState.status dep — run-once pattern
    - Auto-floor-switch on dimmed connector tap returns early (no detail sheet) — distinct UX for cross-floor navigation
    - showTabStrip computed from graphState.status + floorCount + !sheetOpen — three-way visibility guard

key-files:
  created: []
  modified:
    - src/client/components/FloorPlanCanvas.tsx

key-decisions:
  - "floorImageTarget useMemo must precede useFloorPlanImage hook call — React hooks rules; target derived from activeBuilding + activeFloor state"
  - "handleLandmarkTap returns early (no detail sheet) when auto-switching floor — avoids opening detail for adjacent-floor elevator taps"
  - "activeRoutePoints filtered by active floor via filterRouteSegmentByFloor — each floor shows only its route segment"
  - "showTabStrip guard: graphState.status === loaded AND floorCount > 1 AND !sheetOpen — three conditions enforce all visibility rules"
  - "Canvas legend bottom: 64px when showTabStrip (48px strip + 16px gap) — prevents legend overlap with tab strip"

patterns-established:
  - "Floor state pattern: activeBuildingId + activeFloorId → activeBuilding → activeFloor → floorImageTarget chain"
  - "Auto-switch on tap: check node.floorId !== activeFloor.id, call handleFloorSwitch, return early"

requirements-completed: [MFLR-05, MFLR-06, CAMP-05]

# Metrics
duration: 3min
completed: 2026-03-07
---

# Phase 19 Plan 03: Student Floor Tab UI Integration Summary

**FloorPlanCanvas rewired with full multi-floor state: active building/floor tracking, per-floor node/route filtering, FloorTabStrip rendering, auto-floor-switch on route trigger and dimmed connector tap**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-07T11:26:06Z
- **Completed:** 2026-03-07T11:29:44Z
- **Tasks:** 2 (implemented atomically — both modify same file)
- **Files modified:** 1

## Accomplishments
- Added `activeBuildingId` / `activeFloorId` state with all derived data (allBuildings, campusBuilding, activeBuilding, sortedActiveFloors, activeFloor, floorCount)
- Wired `floorImageTarget` useMemo before `useFloorPlanImage(floorImageTarget)` call — parameterized floor plan image loading
- Default initialization useEffect fires once on graph load, sets Floor 1 of first non-campus building
- `handleFloorSwitch` and `handleBuildingSwitch` useCallback helpers with `fitToScreen` on switch
- `handleLandmarkTap` auto-switches floor when tapping dimmed elevator connector (returns early, no detail sheet)
- `handleRouteTrigger` auto-switches to start node's floor when route is computed
- `activeRoutePoints` filtered to active floor only via `filterRouteSegmentByFloor`
- `FloorTabStrip` rendered conditionally below DirectionsSheet/LocationDetailSheet (z-30)
- `LandmarkLayer` receives `filteredNodes` and `dimmedNodeIds` for floor-aware display
- Canvas legend `bottom` offset updated to `64px` when `showTabStrip` is true

## Task Commits

Both tasks implemented in a single atomic commit (same file):

1. **Task 1: Add active floor state, derived data, and default initialization** - `19fd448` (feat)
2. **Task 2: Wire FloorTabStrip and LandmarkLayer dimmedNodeIds into JSX render** - `19fd448` (feat)

## Files Created/Modified
- `src/client/components/FloorPlanCanvas.tsx` — Rewired with full multi-floor state management, FloorTabStrip render, dimmedNodeIds, floor-filtered route points (602 lines)

## Decisions Made
- Implemented both tasks in one commit since they both modify the same file and are logically a single unit
- `floorImageTarget` useMemo placed before `useFloorPlanImage` hook call to satisfy React hook ordering (derived param must be stable before hook call)
- `handleLandmarkTap` returns early without opening detail sheet when auto-switching floor — tap on dimmed elevator = navigation intent, not detail view intent
- `activeRoutePoints` now depends on `activeFloor` — returns `[]` when no active floor (graph loading), preventing stale route display
- `showTabStrip = graphState.status === 'loaded' && floorCount > 1 && !sheetOpen` — all three conditions must hold; campus with one map + one building floor = floorCount 2, strip shows correctly

## Deviations from Plan

None - plan executed exactly as written. TypeScript clean, all 64 tests green.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 19 complete — all three plans (01: pure functions + hook, 02: FloorTabStrip component + LandmarkLayer dimming, 03: FloorPlanCanvas integration) are shipped
- Students can now navigate between floors and buildings via the floor tab strip
- Multi-floor route segments display only on the active floor
- FloorTabStrip hidden on single-floor campuses (backward compatible with v1.0 experience)

## Self-Check: PASSED

- `src/client/components/FloorPlanCanvas.tsx`: EXISTS (602 lines)
- Commit `19fd448`: EXISTS (verified via git rev-parse)
- TypeScript: CLEAN (npx tsc --noEmit returned no errors)
- Tests: GREEN (64/64 passed)

---
*Phase: 19-student-floor-tab-ui*
*Completed: 2026-03-07*
