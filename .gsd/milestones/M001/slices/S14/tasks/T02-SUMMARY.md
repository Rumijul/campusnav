---
phase: 13-restore-location-detail
plan: 02
subsystem: ui
tags: [react, typescript, bottom-sheet, konva, tailwind, biome]

# Dependency graph
requires:
  - phase: 13-01
    provides: LocationDetailSheet component (custom CSS bottom sheet for NavNode details)
  - phase: 05-search-location-selection
    provides: routeSelection.setFromTap tap handler pattern in FloorPlanCanvas
  - phase: 06-route-visualization-directions
    provides: DirectionsSheet and sheetOpen state in FloorPlanCanvas
provides:
  - FloorPlanCanvas wired with dual-action landmark tap handler (detail + route selection)
  - detailNode state controls LocationDetailSheet visibility
  - Auto-close behavior when both A/B route endpoints are set
  - Legend bottom offset accounts for detail sheet open state (196px at peek)
affects: [13-03-human-verify, student wayfinding flow, ROUT-07]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Dual-action tap handler pattern — single useCallback calls both setDetailNode and routeSelection.setFromTap
    - Auto-close via useEffect on combined state — detail sheet closes when both route endpoints are non-null
    - Three-state bottom offset — legend float: 276px (directions), 196px (detail peek), 16px (default)

key-files:
  created: []
  modified:
    - src/client/components/FloorPlanCanvas.tsx

key-decisions:
  - "handleLandmarkTap calls both setDetailNode and routeSelection.setFromTap — single tap does double duty (detail view + route A/B assignment)"
  - "Auto-close useEffect watches [routeSelection.start, routeSelection.destination] — same dep array as the existing clear-route effect, intentional dual behavior"
  - "LocationDetailSheet rendered before DirectionsSheet in DOM — z-40 vs z-50 ensures directions sheet always stacks on top"
  - "196px legend bottom offset = PEEK_HEIGHT(180) + 16px gap — matches LocationDetailSheet peek geometry exactly"

patterns-established:
  - "Dual-action landmark tap: handleLandmarkTap = useCallback((node) => { setDetailNode(node); routeSelection.setFromTap(node) }, [routeSelection])"
  - "Auto-close detail on route trigger: useEffect(() => { if (start && dest) setDetailNode(null) }, [start, dest])"

requirements-completed: [ROUT-07]

# Metrics
duration: 5min
completed: 2026-02-27
---

# Phase 13 Plan 02: Restore Location Detail Summary

**LocationDetailSheet wired into FloorPlanCanvas with dual-action tap handler, auto-close on route trigger, and three-state legend offset — ROUT-07 fully implemented**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-02-27T12:05:00Z
- **Completed:** 2026-02-27T12:10:26Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Added `detailNode` state and `handleLandmarkTap` useCallback to FloorPlanCanvas
- Replaced direct `routeSelection.setFromTap` with dual-action `handleLandmarkTap` in LandmarkLayer
- Added useEffect to auto-close detail sheet when both A and B route endpoints are selected
- Rendered `<LocationDetailSheet>` before `<DirectionsSheet>` for correct z-stacking (z-40 vs z-50)
- Updated legend bottom offset to use three-state expression: 276px/196px/16px
- Zero Biome errors, zero TypeScript errors after all changes

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire LocationDetailSheet into FloorPlanCanvas tap flow** - `c9f741b` (feat)

**Plan metadata:** (docs commit — pending)

## Files Created/Modified
- `src/client/components/FloorPlanCanvas.tsx` - Added detailNode state, handleLandmarkTap callback, auto-close useEffect, LocationDetailSheet render, and three-state legend bottom offset

## Decisions Made
- `handleLandmarkTap` uses `[routeSelection]` as dependency (not `[routeSelection.setFromTap]`) — Biome's exhaustive deps rule accepts the whole object reference for stable callback identity
- The auto-close `useEffect` shares the same dependency array `[routeSelection.start, routeSelection.destination]` as the existing clear-route effect — intentional: two separate behavioral responses to the same state change, kept as separate effects for clarity
- `<LocationDetailSheet>` placed before `<DirectionsSheet>` in JSX return — DOM order determines stacking for elements at same z-index tier; z-40 vs z-50 ensures directions sheet always renders on top regardless

## Deviations from Plan

None - plan executed exactly as written. All 7 changes (import, state, callback, useEffect, onSelectNode, legend offset, JSX render) were applied as specified. The changes were already partially applied in the working tree from prior session work; committed cleanly after verification.

## Issues Encountered
None. All verifications passed on first attempt:
- `npx biome check src/client/components/FloorPlanCanvas.tsx` — 0 errors
- `npx tsc --noEmit` — 0 type errors
- grep verifications confirmed all 6 plan success criteria

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- FloorPlanCanvas.tsx now fully wires the LocationDetailSheet into the landmark tap flow
- ROUT-07 (restore location detail view) is complete from an implementation standpoint
- Plan 13-03 will be a human-verify checkpoint to confirm the bottom sheet behavior in browser

---
*Phase: 13-restore-location-detail*
*Completed: 2026-02-27*
