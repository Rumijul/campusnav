---
phase: 06-route-visualization-directions
plan: 04
subsystem: ui
tags: [react, konva, vaul, route-visualization, directions, animated-line]

# Dependency graph
requires:
  - phase: 06-route-visualization-directions
    provides: RouteLayer animated dashed line component (06-02)
  - phase: 06-route-visualization-directions
    provides: DirectionsSheet Vaul bottom sheet with Standard/Accessible tabs (06-03)
  - phase: 06-route-visualization-directions
    provides: useRouteDirections hook and generateDirections pure function (06-01)
provides:
  - FloorPlanCanvas fully wired with RouteLayer, DirectionsSheet, legend, and activeMode control
  - routeResult fully consumed — no @ts-expect-error or biome-ignore suppressions remain
  - End-to-end route visualization: compute → animate line → show directions sheet
affects:
  - 06-05
  - phase-07-and-beyond

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "buildRoutePoints callback converts node ID arrays to flat pixel coords using imageRect and nodeMap"
    - "Sheet lifecycle: open on route found, close on back arrow or selection cleared"
    - "activeMode state drives both route line color/path and directions tab rendering simultaneously"

key-files:
  created: []
  modified:
    - src/client/components/FloorPlanCanvas.tsx

key-decisions:
  - "RouteLayer sits inside Stage between FloorPlanImage Layer and LandmarkLayer — canvas-space positioning"
  - "DirectionsSheet and legend are HTML siblings outside Stage — they live in the absolute-positioned div overlay"
  - "buildRoutePoints is a useCallback (not useMemo) to avoid recalculating when only activeMode changes"
  - "Sheet auto-opens at 35% peek on route computed; user can drag to 92%; back arrow closes fully"

patterns-established:
  - "Route visualization lifecycle: computeRoute → setRouteResult → setSheetOpen(true) → setActiveMode('standard')"
  - "Legend visibility gated on sheetOpen && route found — same condition as RouteLayer visible prop"

requirements-completed:
  - ROUT-03
  - ROUT-04
  - ROUT-05
  - ROUT-06

# Metrics
duration: 2 min
completed: 2026-02-19
---

# Phase 6 Plan 04: FloorPlanCanvas Integration Summary

**Animated route line + DirectionsSheet wired into FloorPlanCanvas — routeResult fully consumed with no TypeScript suppression comments**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-19T20:46:38Z
- **Completed:** 2026-02-19T20:49:22Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Removed all `@ts-expect-error` and `biome-ignore` suppression comments on `routeResult` — now fully consumed
- RouteLayer renders animated dashed route line inside Stage between FloorPlanImage and LandmarkLayer
- DirectionsSheet opens automatically at 35% peek when a route is computed, closes with back arrow
- Canvas legend displays blue=Standard / green=Accessible color coding when sheet is open
- Tab switching in DirectionsSheet updates both `activeMode` → route line color and directions content simultaneously
- Route clearing when start/destination is cleared also closes the sheet

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire RouteLayer, DirectionsSheet, legend into FloorPlanCanvas** - `5002928` (feat)

**Plan metadata:** (docs commit — to be added)

## Files Created/Modified
- `src/client/components/FloorPlanCanvas.tsx` - Added imports for RouteLayer, DirectionsSheet, useRouteDirections, routesAreIdentical, NavNode; added activeMode/sheetOpen state; added nodeMap useMemo; added standardDirections/accessibleDirections hooks; added buildRoutePoints/activeRoutePoints; updated handleRouteTrigger to open sheet; updated useEffect to close sheet; added handleSheetBack; added RouteLayer in Stage JSX; added DirectionsSheet + legend as HTML siblings

## Decisions Made
- RouteLayer sits inside the Konva Stage between FloorPlanImage Layer and LandmarkLayer — so route line appears above floor plan but below pins
- DirectionsSheet and legend are HTML overlays outside Stage — positioned in absolute div alongside ZoomControls and toast
- `buildRoutePoints` uses `useCallback` (not useMemo) since it's a function, `activeRoutePoints` uses `useMemo` for the computed array
- Sheet auto-opens at 35% peek (`snapPoints={[0.35, 0.92]}`) when route is computed — matching plan specification

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 6 Plan 05 (end-to-end verification) is ready to execute
- All route visualization components are wired: RouteLayer animates, DirectionsSheet shows turn-by-turn, legend shows color coding
- `npx tsc --noEmit` and `npx biome check` both exit 0

## Self-Check: PASSED
- `src/client/components/FloorPlanCanvas.tsx` — FOUND (modified, 384 lines)
- Commit `5002928` — FOUND (`feat(06-04): wire RouteLayer, DirectionsSheet, legend into FloorPlanCanvas`)
- No @ts-expect-error or biome-ignore on routeResult in FloorPlanCanvas — CONFIRMED
- RouteLayer, DirectionsSheet, useRouteDirections all imported and used — CONFIRMED

---
*Phase: 06-route-visualization-directions*
*Completed: 2026-02-19*
