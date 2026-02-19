---
phase: 06-route-visualization-directions
plan: "02"
subsystem: ui
tags: [konva, react-konva, animation, canvas, route-visualization]

# Dependency graph
requires:
  - phase: 02-floor-plan-rendering
    provides: Konva Stage/Layer pattern and direct mutation performance approach
  - phase: 05-search-location-selection
    provides: routeResult state with pixel-coord path arrays ready for visualization
provides:
  - RouteLayer Konva component that renders animated dashed route line
  - RouteLayerProps interface for typed prop passing
affects:
  - 06-route-visualization-directions (Plan 04 wires RouteLayer into FloorPlanCanvas)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Konva.Animation for imperative canvas animation — avoids React setState at 60fps"
    - "dashOffset mutation via animation frame callback for smooth path animation"
    - "tension=0 on Konva Line ensures straight segments through node points"

key-files:
  created:
    - src/client/components/RouteLayer.tsx
  modified: []

key-decisions:
  - "Konva.Animation with dashOffset mutation (not React setState) — prevents 60fps re-renders that would drop frames"
  - "tension=0 on Line — tension > 0 causes spline that doesn't pass through node points"
  - "listening=false on Line — route line must not intercept pointer events for map interaction"
  - "Returns null guard before Layer render — nothing rendered when !visible or points.length < 4"

patterns-established:
  - "Animation cleanup pattern: animRef.current?.stop() in useEffect cleanup and before creating new animation"
  - "Layer encapsulation: RouteLayer owns its own Layer, consistent with LandmarkLayer and SelectionMarkerLayer"

requirements-completed: [ROUT-03, ROUT-04]

# Metrics
duration: 2min
completed: 2026-02-19
---

# Phase 06 Plan 02: RouteLayer Summary

**Animated dashed Konva route line using Konva.Animation with dashOffset imperative mutation — 60fps-safe, no React re-renders**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-19T20:34:10Z
- **Completed:** 2026-02-19T20:35:42Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Created `RouteLayer.tsx` with animated dashed line using `Konva.Animation` (imperative `dashOffset` mutation, never React `setState`)
- `tension={0}` ensures the route line passes through actual node points without spline smoothing
- `listening={false}` ensures route line doesn't block map pan/zoom/tap interactions
- Component returns `null` when `!visible` or `points.length < 4` — no Konva Layer overhead when inactive
- Animation lifecycle properly managed: stopped on unmount, stopped before recreation when deps change

## Task Commits

Each task was committed atomically:

1. **Task 1: Create RouteLayer component with animated dash** - `bd77491` (feat)

**Plan metadata:** _(pending docs commit)_

## Files Created/Modified
- `src/client/components/RouteLayer.tsx` — Animated dashed Konva route line component with Konva.Animation lifecycle management

## Decisions Made
- Used `Konva.Animation` with imperative `dashOffset` mutation rather than React `useState` — a 60fps animation updating state would cause full React tree re-renders on every frame, dropping frames and killing performance
- `tension={0}` is mandatory — any positive tension value causes the Line to render as a spline that "shortcuts" corners and doesn't actually pass through the pathfinding node waypoints
- `listening={false}` — the route line must be transparent to pointer events so users can still tap landmarks and pan the map while a route is displayed

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
Pre-existing TypeScript error in `src/client/hooks/useRouteDirections.test.ts` (Cannot find module `./useRouteDirections`) — this is the TDD RED phase test committed in Plan 06-01 awaiting the GREEN implementation in Plan 06-03. Not caused by this plan. `RouteLayer.tsx` itself compiles cleanly with zero errors.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `RouteLayer` component ready to be wired into `FloorPlanCanvas` between FloorPlanImage and LandmarkLayer (Plan 06-04)
- Exports `RouteLayer` and `RouteLayerProps` as required by downstream consumers
- No blockers — component is standalone and requires only `points`, `color`, and `visible` props

## Self-Check: PASSED

- ✅ `src/client/components/RouteLayer.tsx` — exists on disk
- ✅ `.planning/phases/06-route-visualization-directions/06-02-SUMMARY.md` — exists on disk
- ✅ Commit `bd77491` — verified in git log

---
*Phase: 06-route-visualization-directions*
*Completed: 2026-02-19*
