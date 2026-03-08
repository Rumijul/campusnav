---
phase: 17-multi-floor-pathfinding-engine
plan: "04"
subsystem: ui
tags: [directions, pathfinding, multi-floor, floorMap, react, hooks, typescript]

# Dependency graph
requires:
  - phase: 17-02
    provides: Cross-floor A* heuristic in engine.ts
  - phase: 17-03
    provides: generateDirections with floorMap parameter and floor-change step emission

provides:
  - floorMap useMemo in FloorPlanCanvas (Map<number, NavFloor> built from loaded NavGraph)
  - useRouteDirections hook accepts optional floorMap 4th parameter and threads it to generateDirections
  - Both standardDirections and accessibleDirections calls supply live floorMap from NavGraph
affects:
  - DirectionsSheet (now receives floor-change steps with correct floor numbers from live data)
  - Phase 18 admin editor (flattenNavGraph export retained for Phase 18 MapEditorCanvas)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "floorMap useMemo after nodeMap: graphState.status guard returns empty Map when not loaded; flatMap buildings.floors for all floors across all buildings"
    - "Optional 4th parameter threading: hook accepts floorMap? and passes to pure function; useMemo dep array includes floorMap"

key-files:
  created: []
  modified:
    - src/client/hooks/useRouteDirections.ts
    - src/client/components/FloorPlanCanvas.tsx

key-decisions:
  - "floorMap passed as optional (not required) to useRouteDirections — backward compatible with any future call sites that don't supply a floorMap"
  - "floorMap useMemo depends on graphState (not buildings array) — graphState reference changes atomically on load; avoids redundant recalculation"
  - "flattenNavGraph not imported by FloorPlanCanvas — engine uses buildGraph directly; flattenNavGraph export retained only for future admin editor (Phase 18)"

patterns-established:
  - "Hook-to-pure-function parameter threading: add optional param to hook, add to useMemo dep array, pass through to underlying pure function"

requirements-completed: [MFLR-03]

# Metrics
duration: 5min
completed: 2026-03-01
---

# Phase 17 Plan 04: FloorPlanCanvas floorMap Wiring Summary

**floorMap useMemo added to FloorPlanCanvas and threaded through useRouteDirections hook to generateDirections, activating floor-change steps (stairs/elevator/ramp) in the live DirectionsSheet UI.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-01T20:20:00Z
- **Completed:** 2026-03-01T20:27:00Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments

- Added optional `floorMap?: Map<number, NavFloor>` as 4th parameter to `useRouteDirections` hook; threads to `generateDirections` and included in `useMemo` dependency array
- Added `floorMap` useMemo to `FloorPlanCanvas` — builds `Map<number, NavFloor>` from all buildings' floors in the loaded `NavGraph`; returns empty Map when graph is not yet loaded
- Updated both `standardDirections` and `accessibleDirections` calls to pass `floorMap` as 4th argument
- Verified `flattenNavGraph` not imported anywhere except `src/shared/pathfinding/graph-builder.ts` (export definition retained for Phase 18 admin editor)
- All 57 tests pass; `npx tsc --noEmit` exits 0

## Task Commits

Each task was committed atomically:

1. **Task 1: Add floorMap to useRouteDirections hook and wire FloorPlanCanvas** - `744f598` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/client/hooks/useRouteDirections.ts` — Hook signature extended with optional `floorMap?: Map<number, NavFloor>` 4th param; passed to `generateDirections`; added to `useMemo` dep array
- `src/client/components/FloorPlanCanvas.tsx` — `NavFloor` added to `@shared/types` import; `floorMap` useMemo added after `nodeMap` useMemo; both `useRouteDirections` calls updated to pass `floorMap`

## Decisions Made

- **Optional floorMap parameter:** Made optional (not required) so any future call sites that don't have a NavGraph loaded can still call the hook without supplying floorMap — backward compatible.
- **Depends on graphState, not derived array:** `floorMap` useMemo depends on `graphState` rather than a derived `floors` array — graphState reference changes atomically on load, which is the correct granularity; avoids a third derived intermediate.
- **flattenNavGraph not touched:** FloorPlanCanvas already uses the engine directly via `buildGraph`; `flattenNavGraph` export kept untouched in `graph-builder.ts` as the plan specified (Phase 18 admin editor will use it).

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Floor-change direction steps are now fully wired to live data: `generateDirections` emits correct floor numbers via `floorMap`, and `FloorPlanCanvas` supplies that map from the loaded `NavGraph`
- `DirectionsSheet` will display "Take the stairs/elevator/ramp to Floor N" for any multi-floor route
- Phase 17 complete — all 4 plans delivered: edge synthesis (01), cross-floor A* heuristic (02), floor-change direction steps (03), FloorPlanCanvas wiring (04)
- Phase 18 (admin editor MapEditorCanvas multi-floor support) can proceed; `flattenNavGraph` export is available

---
*Phase: 17-multi-floor-pathfinding-engine*
*Completed: 2026-03-01*
