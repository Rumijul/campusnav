---
phase: 19-student-floor-tab-ui
plan: "02"
subsystem: ui
tags: [react, konva, tailwind, floor-navigation, components]

# Dependency graph
requires:
  - phase: 19-00
    provides: useFloorFiltering hook stubs (RED state for TDD)
provides:
  - LandmarkMarker with optional isDimmed prop (opacity 0.35 when true)
  - LandmarkLayer with optional dimmedNodeIds: Set<string> prop
  - FloorTabStrip HTML overlay component (building selector + floor tabs)
affects:
  - 19-03-PLAN (wires FloorTabStrip and dimmedNodeIds into FloorPlanCanvas)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - isDimmed opacity pattern on Konva Group for floor-aware dimming
    - Pure presenter component pattern for FloorTabStrip (caller controls state and visibility)
    - Fixed-position HTML overlay with z-30 for tab strip below sheets

key-files:
  created:
    - src/client/components/FloorTabStrip.tsx
  modified:
    - src/client/components/LandmarkMarker.tsx
    - src/client/components/LandmarkLayer.tsx

key-decisions:
  - "isDimmed opacity applied to Konva Group (not Circle) so all visual elements (circle + label) dim together"
  - "dimmedNodeIds uses Set<string> for O(1) has() lookup per marker render"
  - "FloorTabStrip visibility controlled by caller (FloorPlanCanvas) via conditional render — no internal visibility logic"
  - "z-30 for FloorTabStrip renders below LocationDetailSheet (z-40) and DirectionsSheet (z-50)"
  - "overflow-x-auto + shrink-0 on tabs handles many-floor buildings without wrapping"

patterns-established:
  - "isDimmed?: boolean on LandmarkMarker — optional prop defaulting to full opacity for backward compat"
  - "dimmedNodeIds?.has(node.id) ?? false — safe optional chaining for Set membership"

requirements-completed: [MFLR-06, CAMP-05]

# Metrics
duration: 3min
completed: 2026-03-07
---

# Phase 19 Plan 02: Student Floor Tab UI Components Summary

**LandmarkMarker dimming via isDimmed opacity prop and new FloorTabStrip fixed-bottom HTML overlay matching admin editor visual style**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-07T19:15:15Z
- **Completed:** 2026-03-07T19:16:56Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Extended LandmarkMarker with optional `isDimmed` prop; Group opacity set to 0.35 when true, covering both the circle and label together
- Extended LandmarkLayer with optional `dimmedNodeIds?: Set<string>` prop; passes `isDimmed` to each marker via O(1) Set lookup
- Created FloorTabStrip component: fixed-position bottom overlay with building selector dropdown and floor tab buttons matching admin editor Tailwind classes exactly

## Task Commits

Each task was committed atomically:

1. **Task 1: Add isDimmed support to LandmarkMarker and LandmarkLayer** - `229541c` (feat)
2. **Task 2: Create FloorTabStrip component** - `4ad8f10` (feat)

**Plan metadata:** _(to be filled after final docs commit)_

## Files Created/Modified
- `src/client/components/LandmarkMarker.tsx` - Added optional `isDimmed?: boolean` prop; `opacity={isDimmed ? 0.35 : 1}` on Konva Group
- `src/client/components/LandmarkLayer.tsx` - Added optional `dimmedNodeIds?: Set<string>` prop; passes `isDimmed` to each LandmarkMarker
- `src/client/components/FloorTabStrip.tsx` - New HTML overlay: fixed bottom, z-30, building selector + floor tab buttons

## Decisions Made
- Applied opacity to the Konva Group (not the Circle) so label text also dims — no per-element opacity needed
- Set default `false` for `isDimmed` via `?? false` so callers that don't pass the prop get full opacity
- FloorTabStrip has no internal visibility state — Plan 03 controls whether it renders

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- LandmarkMarker and LandmarkLayer updated and backward compatible — all existing callers unaffected
- FloorTabStrip ready to import in FloorPlanCanvas (Plan 03 rewire)
- TypeScript clean, 64 tests passing

---
*Phase: 19-student-floor-tab-ui*
*Completed: 2026-03-07*
