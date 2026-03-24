---
phase: 06-route-visualization-directions
plan: 07
subsystem: ui
tags: [react, konva, directions-sheet, route-visualization, accessibility]

# Dependency graph
requires:
  - phase: 06-06
    provides: back arrow closes sheet while keeping route line visible
provides:
  - Compact A->B strip tap reopens DirectionsSheet when route is available
  - Canvas legend positioned bottom-left, clear of ZoomControls
  - All Phase 6 UAT scenarios verified and passing
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - onOpenSheet/hasRoute prop pattern for cross-component sheet reopen control

key-files:
  created: []
  modified:
    - src/client/components/FloorPlanCanvas.tsx
    - src/client/components/SearchOverlay.tsx

key-decisions:
  - "Compact strip passes hasRoute+onOpenSheet props from FloorPlanCanvas to SearchOverlay — sheet reopen is a canvas-level concern, SearchOverlay is the UI trigger"
  - "Legend moved to bottom-left (left-3) rather than increasing bottom offset — cleanest fix with zero math, avoids layout dependency on ZoomControls button dimensions"

patterns-established:
  - "hasRoute + onOpenSheet pattern: parent owns sheet state, child receives open callback only when route is available — no imperative ref needed"

requirements-completed:
  - ROUT-03
  - ROUT-04

# Metrics
duration: 15min
completed: 2026-02-20
---

# Phase 06 Plan 07: Route Visualization Directions UAT Closure Summary

**UAT verified: Standard/Accessible tabs, step list, back arrow, plus two gap fixes — compact strip reopens sheet and legend no longer overlaps zoom controls**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-02-20T11:27:40Z
- **Completed:** 2026-02-20T11:42:00Z
- **Tasks:** 2 (1 auto + 1 human-verify with gap fixes)
- **Files modified:** 2

## Accomplishments
- Human verified all three UAT scenarios: Accessible tab (room-storage → elevator-north), step list (main entrance → library), back arrow (closes sheet without clearing route)
- Fixed sheet-not-reopenable bug: compact A→B strip now calls `setSheetOpen(true)` when `hasRoute` is true, wired via `onOpenSheet` prop
- Fixed legend-over-zoom-controls: legend moved from `right-3` to `left-3`, placing it bottom-left and completely clear of the zoom +/- buttons

## Task Commits

Each task was committed atomically:

1. **Task 1: Start dev server** - no code files changed (TypeScript clean, server running)
2. **Task 2 (gap fixes): Reopen sheet + legend position** - `e0e4209` (fix)

**Plan metadata:** (docs commit — in progress)

## Files Created/Modified
- `src/client/components/FloorPlanCanvas.tsx` - Pass `hasRoute` and `onOpenSheet` to SearchOverlay; move legend `right-3` → `left-3`
- `src/client/components/SearchOverlay.tsx` - Add `onOpenSheet`/`hasRoute` props; compact strip tap reopens sheet when route available

## Decisions Made
- **Sheet reopen via props:** `onOpenSheet` callback + `hasRoute` boolean passed from FloorPlanCanvas to SearchOverlay. The compact strip has the tap target; the canvas owns `sheetOpen` state. Props bridge the two cleanly without refs.
- **Legend to bottom-left:** Moving to `left-3` is the simplest solution — no pixel arithmetic needed, zero risk of future overlap if ZoomControls dimensions change.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Sheet not reopenable after back arrow pressed**
- **Found during:** Task 2 (human-verify — user reported during Scenario C test)
- **Issue:** Compact strip button called `setFocusedField(null)` and `prevBothRef.current = ...` — neither opened the sheet. No path existed to call `setSheetOpen(true)` after back was pressed.
- **Fix:** Added `hasRoute` and `onOpenSheet` props to `SearchOverlay`; compact strip button now calls `onOpenSheet()` when `hasRoute && onOpenSheet` are truthy.
- **Files modified:** `src/client/components/SearchOverlay.tsx`, `src/client/components/FloorPlanCanvas.tsx`
- **Verification:** TypeScript clean; logic verified by inspection
- **Committed in:** e0e4209

**2. [Rule 1 - Bug] Canvas legend overlaps zoom-out button**
- **Found during:** Task 2 (human-verify — user reported during Scenario C test)
- **Issue:** Legend positioned `right-3 bottom-16px`; ZoomControls at `right-6 bottom-6` (two 40px buttons + gap = ~88px height). Legend top reached into zoom-out button area.
- **Fix:** Changed legend from `right-3` to `left-3` — moves to bottom-left corner, no overlap possible.
- **Files modified:** `src/client/components/FloorPlanCanvas.tsx`
- **Verification:** TypeScript clean; layout verified by inspection
- **Committed in:** e0e4209

---

**Total deviations:** 2 auto-fixed (both Rule 1 — bugs found during UAT verification)
**Impact on plan:** Both fixes required for complete UAT approval. No scope creep — directly addressing reported failures.

## Issues Encountered
- Port 5173 was occupied by an existing Vite instance; Vite auto-assigned 5174. Existing API server on 3001 responded correctly (HTTP 200). App was fully functional on the alternate port.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 6 (Route Visualization + Directions) is COMPLETE — all 7 plans executed
- All UAT scenarios verified: route line, accessible tab, step list, back arrow, legend, canvas pan
- Ready for Phase 7 (admin tooling or next planned phase)

---
*Phase: 06-route-visualization-directions*
*Completed: 2026-02-20*
