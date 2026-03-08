---
phase: 17-multi-floor-pathfinding-engine
plan: 03
subsystem: ui
tags: [directions, pathfinding, multi-floor, typescript, vitest, tdd]

# Dependency graph
requires:
  - phase: 17-multi-floor-pathfinding-engine
    provides: Cross-floor edges in NavGraph; NavFloor type with floorNumber
  - phase: 06-route-visualization-directions
    provides: generateDirections function and StepIcon type baseline
provides:
  - Floor-change direction steps in generateDirections (stairs-up/stairs-down/elevator/ramp)
  - Extended StepIcon type with 4 new floor-change values
  - Optional floorMap parameter (Map<number, NavFloor>) in generateDirections
affects:
  - 17-multi-floor-pathfinding-engine (Phase 19 will wire floorMap into hook)
  - DirectionsSheet component (reads StepIcon to render icons)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Floor-change branch checked BEFORE bearing calculation in intermediate-node loop — prevents incorrect turn icon on connector nodes"
    - "continue statement skips normal turn classification when floor transition detected"
    - "floorNumber ?? next.floorId fallback — graceful degradation when floorMap incomplete"

key-files:
  created:
    - (no new files)
  modified:
    - src/client/hooks/useRouteDirections.ts
    - src/client/hooks/useRouteDirections.test.ts

key-decisions:
  - "Floor-change detection checks curr.floorId !== next.floorId BEFORE the bearing calculation — uses continue to skip normal turn step for this iteration"
  - "classifyTurn and buildInstruction return types narrowed to exclude floor-change icons — TypeScript strict compliance"
  - "useRouteDirections hook signature unchanged — floorMap omitted (defaults to empty Map); Phase 19 will wire real floorMap"
  - "stairs direction determined by comparing next.floorId > curr.floorId (not floor numbers) — floorId ordering matches DB insertion order"

patterns-established:
  - "TDD RED commit then GREEN+REFACTOR commit pattern for 17-03"

requirements-completed: [MFLR-03]

# Metrics
duration: 3min
completed: 2026-03-01
---

# Phase 17 Plan 03: Floor-Change Direction Steps Summary

**Floor-change detection branch added to generateDirections: emits 'Take the stairs/elevator/ramp to Floor N' steps with 4 new StepIcon values (stairs-up, stairs-down, elevator, ramp) when adjacent nodes have different floorId.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-01T12:13:52Z
- **Completed:** 2026-03-01T12:16:15Z
- **Tasks:** 1 TDD task (RED + GREEN + REFACTOR)
- **Files modified:** 2

## Accomplishments
- Extended `StepIcon` type with 4 new values: `stairs-up`, `stairs-down`, `elevator`, `ramp`
- Added optional `floorMap: Map<number, NavFloor>` 4th parameter to `generateDirections` (backward compatible; defaults to `new Map()`)
- Floor-change detection in intermediate-node loop: checks `curr.floorId !== next.floorId` before bearing calculation and emits correct step using connector type and floorNumber lookup
- `isAccessibleSegment` set to `true` for elevator and ramp floor-change steps; `false` for stairs
- All 29 tests pass: 6 new floor-change tests + 23 pre-existing tests unchanged
- TypeScript strict compliance verified: `npx tsc --noEmit` exits 0

## Task Commits

Each task was committed atomically:

1. **RED — Failing floor-change tests** - `9e2fb56` (test)
2. **GREEN+REFACTOR — Floor-change implementation** - `2d54c77` (feat)

_Note: TDD tasks have multiple commits (test RED → feat GREEN+REFACTOR)_

## Files Created/Modified
- `src/client/hooks/useRouteDirections.ts` — Extended StepIcon, floorMap parameter, floor-change detection branch in loop, narrowed classifyTurn/buildInstruction return types
- `src/client/hooks/useRouteDirections.test.ts` — Added makeFloor/makeFloorMap helpers; 6 new floor-change test cases

## Decisions Made
- **Floor-change branch before bearing:** Check `curr.floorId !== next.floorId` first in the loop, then `continue` to skip normal bearing/turn logic — ensures connector nodes never emit misleading "Continue straight" instructions
- **classifyTurn and buildInstruction return type narrowing:** Excluded the 4 new floor-change icons from their return types to maintain TypeScript strict compliance; floor-change steps bypass both functions entirely
- **useRouteDirections hook unchanged:** Hook passes no floorMap (undefined), which defaults to empty Map inside generateDirections; Phase 19 will supply real floorMap when per-floor routing is wired up
- **floorId comparison for stairs direction:** `next.floorId > curr.floorId` yields `stairs-up`; this relies on floorId ordering matching physical floor ordering (as established by seeder in Phase 16)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Narrowed classifyTurn and buildInstruction return types**
- **Found during:** REFACTOR (`npx tsc --noEmit`)
- **Issue:** `classifyTurn` return type was `Exclude<StepIcon, 'arrive' | 'accessible'>` — after adding new icons to StepIcon, this included the 4 new floor-change values, causing TS2345 when passed to `buildInstruction`
- **Fix:** Narrowed both return types to also exclude `'stairs-up' | 'stairs-down' | 'elevator' | 'ramp'` — floor-change steps bypass these functions entirely, so this is semantically accurate
- **Files modified:** `src/client/hooks/useRouteDirections.ts`
- **Verification:** `npx tsc --noEmit` exits 0; all 29 tests still pass
- **Committed in:** `2d54c77` (GREEN+REFACTOR commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — TypeScript type narrowing bug)
**Impact on plan:** Auto-fix required for TypeScript strict compliance. No scope creep.

## Issues Encountered
- Biome linter reverted some early edits when the file was saved — had to re-read the file state before applying remaining changes. Resolved by reading current file state then making targeted edits.

## Next Phase Readiness
- `generateDirections` is fully floor-change-aware; Phase 19 only needs to supply the real `floorMap` to the hook to activate floor-change steps in the UI
- `StepIcon` type extended and exported — `DirectionsSheet` can now render distinct icons per floor-change connector type
- All existing directions tests pass — no regression risk from this change

---
*Phase: 17-multi-floor-pathfinding-engine*
*Completed: 2026-03-01*
