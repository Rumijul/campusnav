---
phase: 06-route-visualization-directions
plan: "06"
subsystem: ui
tags: [react, konva, directions-sheet, route-visualization, touch-handling]

requires:
  - phase: 06-04
    provides: RouteLayer integration + sheet auto-open on route computed
  - phase: 05.1-02
    provides: Custom CSS bottom sheet replacing Vaul

provides:
  - Back arrow closes sheet without clearing route (routeVisible state decoupled from sheetOpen)
  - RouteLayer visibility driven by routeVisible — route line persists after sheet close
  - Legend positioned dynamically above sheet (276px) or near bottom (16px) based on sheetOpen
  - Canvas single-finger pan unblocked after route selection (preventDefault only on multi-touch)

affects:
  - 06-07-PLAN
  - UAT verification

tech-stack:
  added: []
  patterns:
    - "routeVisible state decoupled from sheetOpen — route line persists when sheet is closed via back arrow"
    - "Dynamic bottom positioning via inline style to clear the sheet PEEK_HEIGHT of 260px"
    - "preventDefault only on touches.length >= 2 to preserve native single-finger drag"

key-files:
  created: []
  modified:
    - src/client/components/FloorPlanCanvas.tsx
    - src/client/hooks/useMapViewport.ts

key-decisions:
  - "routeVisible state introduced to decouple route line from sheetOpen — back arrow can close sheet while keeping route drawn"
  - "handleSheetBack changed from clearAll() to setSheetOpen(false) — back = hide sheet, not exit route mode"
  - "Legend bottom style: sheetOpen ? 276px : 16px — keeps legend above PEEK_HEIGHT=260px when sheet is open"
  - "useMapViewport: e.evt.preventDefault() moved inside touches.length >= 2 guard — single-finger drag to native Konva draggable handler"

patterns-established:
  - "Route state separation: sheetOpen (UI visibility) vs routeVisible (canvas line visibility) are independent"

requirements-completed:
  - ROUT-03
  - ROUT-05
  - ROUT-06

duration: 3min
completed: 2026-02-20
---

# Phase 06 Plan 06: UAT Gap Closure — Back Arrow, Legend Position, Canvas Pan Summary

**Three UAT gaps fixed: back arrow closes sheet without nuking route, legend floats above sheet dynamically, single-finger pan unblocked after route by scoping preventDefault to multi-touch only**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-20T11:21:02Z
- **Completed:** 2026-02-20T11:24:19Z
- **Tasks:** 5
- **Files modified:** 2

## Accomplishments

- Committed the previously approved but uncommitted 05.1-02 changes (DirectionsSheet, SearchOverlay, FloorPlanCanvas)
- Introduced `routeVisible` state in FloorPlanCanvas — decoupled from `sheetOpen` so route line stays drawn after pressing Back
- Fixed `handleSheetBack` to call `setSheetOpen(false)` instead of `routeSelection.clearAll()` — UAT test 6 now passes
- Legend positioned via dynamic inline style: `bottom: sheetOpen ? '276px' : '16px'` so it always appears above the 260px peek height
- Fixed single-finger canvas pan blocking after route selection by moving `e.evt.preventDefault()` inside the `touches.length >= 2` guard in `useMapViewport.ts`

## Task Commits

1. **Task 1: Commit uncommitted 05.1-02 changes** - `91444e4` (feat)
2. **Tasks 2-4: Back arrow + legend + canvas pan** - `3eefa0b` (fix)

## Files Created/Modified

- `src/client/components/FloorPlanCanvas.tsx` — routeVisible state, handleSheetBack fix, legend dynamic bottom, RouteLayer visibility update
- `src/client/hooks/useMapViewport.ts` — preventDefault scoped to multi-touch only

## Decisions Made

- `routeVisible` state decoupled from `sheetOpen`: allows back arrow to close the sheet while the route line and legend remain visible on the canvas. The route is only hidden when `routeResult` is cleared (user clears selections via X button).
- `handleSheetBack` now calls `setSheetOpen(false)` only — not `clearAll()`. The distinction: back = temporarily hide sheet, X button = exit route mode entirely.
- Legend uses inline `style={{ bottom: sheetOpen ? '276px' : '16px' }}` because Tailwind JIT cannot generate dynamic pixel values from runtime state; the `PEEK_HEIGHT = 260` constant from DirectionsSheet adds 16px gap.
- `e.evt.preventDefault()` moved inside `touches.length >= 2` guard: single-finger native touch events must reach Konva's `draggable` handler unchanged. Previously, `preventDefault()` was called for all touches before the early return, suppressing the browser's touch-to-drag delegation.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All three UAT gaps addressed: back arrow (test 6), legend position (test 5), canvas pan (test 1 partial)
- Route line visibility state properly separated from sheet state
- Ready for phase 06-07 (end-to-end UAT verification or remaining route visualization work)

---
*Phase: 06-route-visualization-directions*
*Completed: 2026-02-20*
