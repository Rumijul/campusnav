---
phase: 06-route-visualization-directions
plan: 03
subsystem: ui
tags: [react, vaul, directions, accessibility, bottom-sheet, typescript]

# Dependency graph
requires:
  - phase: 06-01
    provides: DirectionStep, DirectionsResult types from useRouteDirections hook
  - phase: 04-map-landmarks-location-display
    provides: modal=false Vaul Drawer.Root pattern established in LandmarkSheet

provides:
  - DirectionsSheet component: Vaul bottom sheet with Standard/Accessible route tabs
  - DirectionsSheetProps interface: fully typed prop contract
  - StepIconComponent: inline SVG icons for all 7 step types

affects:
  - 06-04-route-overlay (wires DirectionsSheet into FloorPlanCanvas)
  - 06-05-accessibility (accessible tab UI already handled here)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "exactOptionalPropertyTypes compliance: spread conditional props ({...condition ? {prop: val} : {}}) instead of prop={val | undefined}"
    - "Vaul stateless tab pattern: activeMode/onTabChange flow via props, only snapPoint is local state"
    - "Three-case UI branching: neitherFound / routesIdentical / distinct routes"

key-files:
  created:
    - src/client/components/DirectionsSheet.tsx
  modified: []

key-decisions:
  - "Tab state (activeMode) is stateless in DirectionsSheet — flows via props from parent, enabling parent-controlled route mode switching"
  - "snapPoint state is local to DirectionsSheet — no reason to lift it, it's purely UI drag behavior"
  - "exactOptionalPropertyTypes: spread conditional object pattern required for optional props to avoid string|undefined type error"
  - "biome-ignore lint/suspicious/noArrayIndexKey on step list items — steps are ordered and stable within a single route render (no reorder/insert operations)"

patterns-established:
  - "Vaul sheet: snapPoints=[0.35, 0.92], modal=false, dismissible=false, no Drawer.Overlay"
  - "Disabled tab: button disabled attribute + title tooltip for accessibility — no custom ARIA needed"

requirements-completed: [ROUT-03, ROUT-04, ROUT-05, ROUT-06]

# Metrics
duration: 2min
completed: 2026-02-19
---

# Phase 6 Plan 03: DirectionsSheet Summary

**Vaul bottom sheet with Standard/Accessible route tabs, step-by-step direction list, and three edge-case render branches (no route / identical / distinct)**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-19T20:41:58Z
- **Completed:** 2026-02-19T20:43:40Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- `DirectionsSheet` Vaul bottom sheet with `snapPoints=[0.35, 0.92]`, `modal=false`, `dismissible=false` — map stays interactive while sheet is open
- Three render cases: no-route message, identical-routes single "Standard (accessible)" chip, two distinct tabs with disabled accessible tab support
- `TabButton` sub-component handles active (colored bg + dot) / inactive (gray) / disabled (grayed + `title` tooltip) states
- `StepIconComponent` with 7 inline SVG icons (straight, turn-left, turn-right, sharp-left, sharp-right, arrive, accessible)
- `StepItem` renders instruction text + per-step duration + accessible segment ♿ badge
- `BackArrowIcon` chevron-left calls `onBack()` to return user to A/B pin selection
- `formatDuration` helper (seconds < 60 shown as `Xs`, else `X min`)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create DirectionsSheet component** - `1981e05` (feat)

**Plan metadata:** TBD (docs: complete plan)

## Files Created/Modified
- `src/client/components/DirectionsSheet.tsx` — Vaul directions sheet, 442 lines, exports `DirectionsSheet` and `DirectionsSheetProps`

## Decisions Made
- **Stateless tabs in DirectionsSheet:** `activeMode` and `onTabChange` flow via props from parent. DirectionsSheet never owns route mode state — only `snapPoint` (local Vaul drag behavior) is local state.
- **exactOptionalPropertyTypes compliance:** Passing `string | undefined` to an `?: string` prop triggers a TypeScript error under strict `exactOptionalPropertyTypes`. Fixed with spread conditional: `{...(condition ? { disabledTitle: 'No accessible route available' } : {})}`.
- **Array index key on step list:** Biome flags `noArrayIndexKey` but direction steps are structurally stable within a single route render (no reordering or insertions). Suppressed with `biome-ignore` comment.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed exactOptionalPropertyTypes TypeScript error on disabledTitle prop**
- **Found during:** Task 1 (immediately after writing component)
- **Issue:** LSP reported `Type 'string | undefined' is not assignable to type 'string'` on `disabledTitle={accessible?.found === false ? '...' : undefined}` because `exactOptionalPropertyTypes` is enabled in tsconfig
- **Fix:** Changed to spread conditional: `{...(accessible?.found === false ? { disabledTitle: 'No accessible route available' } : {})}`
- **Files modified:** src/client/components/DirectionsSheet.tsx
- **Verification:** `npx tsc --noEmit` exits 0
- **Committed in:** 1981e05 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 TypeScript strict-mode bug)
**Impact on plan:** Single-line fix, no scope change. Required by existing `exactOptionalPropertyTypes: true` tsconfig setting.

## Issues Encountered
None — component compiled and passed both TypeScript and Biome checks on first run after the deviation fix.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `DirectionsSheet` component ready to be wired into `FloorPlanCanvas` in Plan 04
- `DirectionsSheetProps` interface provides the full contract for parent-controlled state
- All three edge cases handled — Plan 04 only needs to pass the correct props

---
*Phase: 06-route-visualization-directions*
*Completed: 2026-02-19*

## Self-Check: PASSED

- `src/client/components/DirectionsSheet.tsx` — FOUND (442 lines)
- Commit `1981e05` (feat: DirectionsSheet Vaul bottom sheet) — FOUND
- `.planning/phases/06-route-visualization-directions/06-03-SUMMARY.md` — FOUND
