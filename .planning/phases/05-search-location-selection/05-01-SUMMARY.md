---
phase: 05-search-location-selection
plan: 01
subsystem: ui
tags: [react-konva, route-selection, state-management, hooks]

# Dependency graph
requires:
  - phase: 04-map-landmarks-location-display
    provides: LandmarkLayer, LandmarkMarker, useGraphData, FloorPlanCanvas with landmark rendering
provides:
  - useRouteSelection hook with start/destination state, setFromTap, swap, clear
  - SelectionMarkerLayer component rendering A/B labeled pins
  - LandmarkLayer hiddenNodeIds prop for marker exclusion
  - FloorPlanCanvas wired with route selection state
affects: [05-02-search-ui, 05-03-route-trigger, 06-route-display]

# Tech tracking
tech-stack:
  added: []
  patterns: [route-selection-state-hook, labeled-pin-markers, hidden-node-filtering]

key-files:
  created:
    - src/client/hooks/useRouteSelection.ts
    - src/client/components/SelectionMarkerLayer.tsx
  modified:
    - src/client/components/FloorPlanCanvas.tsx
    - src/client/components/LandmarkLayer.tsx

key-decisions:
  - "Landmark tap feeds into route selection via setFromTap instead of opening detail sheet"
  - "A/B pins use counter-scaled Groups matching LandmarkMarker pattern for zoom consistency"
  - "LandmarkSheet removed from render tree — detail view no longer opens on landmark tap"
  - "hiddenNodeIds filtering in LandmarkLayer prevents duplicate markers at selected positions"

patterns-established:
  - "Route selection hook pattern: centralized start/dest state with activeField auto-advance"
  - "Pin marker pattern: labeled A/B circles with counter-scaling via Group scaleX/Y=1/stageScale"

requirements-completed: [SRCH-02]

# Metrics
duration: 3min
completed: 2026-02-19
---

# Phase 5 Plan 1: Route Selection State & A/B Pin Markers Summary

**useRouteSelection hook with tap-to-select flow and counter-scaled A/B labeled pin markers on Konva map**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-19T12:42:09Z
- **Completed:** 2026-02-19T12:45:33Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Created useRouteSelection hook managing start/destination state with setFromTap, swap, and clear operations
- Built SelectionMarkerLayer with green "A" (start) and red "B" (destination) labeled pin markers
- Rewired FloorPlanCanvas so landmark taps feed into route selection instead of opening detail sheet
- Added hiddenNodeIds prop to LandmarkLayer to exclude nodes selected as start/destination (replaced by A/B pins)

## Task Commits

Each task was committed atomically:

1. **Task 1: useRouteSelection hook and SelectionMarkerLayer component** - `3513cd5` (feat)
2. **Task 2: Wire route selection into FloorPlanCanvas and modify landmark tap behavior** - `a34b166` (feat)

## Files Created/Modified
- `src/client/hooks/useRouteSelection.ts` - Route selection state hook with setFromTap, swap, clear, activeField auto-advance
- `src/client/components/SelectionMarkerLayer.tsx` - A/B labeled pin markers (green/red circles with white text) on Konva Layer
- `src/client/components/FloorPlanCanvas.tsx` - Integrated useRouteSelection and SelectionMarkerLayer, removed LandmarkSheet
- `src/client/components/LandmarkLayer.tsx` - Added hiddenNodeIds prop to filter out selected-as-waypoint nodes

## Decisions Made
- Landmark tap calls setFromTap directly — no detail sheet opens. LandmarkSheet removed from render tree.
- A/B pins use same counter-scaling pattern as LandmarkMarker (Group scaleX/Y = 1/stageScale) for consistent zoom behavior.
- hiddenNodeIds filtering ensures no duplicate markers when a node is selected as start/destination.
- Background tap does NOT clear route selections — only search bar X buttons will clear (Plan 02).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Restored deleted Phase 04 files from git HEAD**
- **Found during:** Pre-execution context loading
- **Issue:** LandmarkLayer.tsx, LandmarkMarker.tsx, LandmarkSheet.tsx, useGraphData.ts, campus-graph.json and other Phase 04 files were deleted from working tree
- **Fix:** Ran `git checkout HEAD --` to restore all deleted/modified files to committed state
- **Files modified:** Multiple files restored from git
- **Verification:** `git status` showed clean working tree
- **Committed in:** N/A (restore, not a code change)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** File restoration was necessary prerequisite. No scope creep.

## Issues Encountered
None — all TypeScript and Biome checks passed on first attempt after file creation.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Route selection state hook ready for Plan 02's search UI to consume
- SelectionMarkerLayer rendering correctly with A/B pins
- Ready for 05-02: Search UI & route trigger

---
*Phase: 05-search-location-selection*
*Completed: 2026-02-19*

## Self-Check: PASSED
- All created files exist on disk
- Both task commits verified in git history
