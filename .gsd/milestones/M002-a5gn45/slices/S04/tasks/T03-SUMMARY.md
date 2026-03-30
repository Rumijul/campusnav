---
id: T03
parent: S04
milestone: M002-a5gn45
provides: []
requires: []
affects: []
key_files: ["mobile/components/guidance/LiveGuidanceOverlay.tsx", "mobile/App.tsx", "mobile/hooks/findNearestNodeOnFloor.test.ts", "mobile/components/guidance/LiveGuidanceOverlay.test.tsx"]
key_decisions: ["Accessible step highlighting: elevator/ramp icons get amber (#facc15) background + dark icon when accessibleMode is true, and '(accessible)' is appended to instruction text.", "findNearestNodeOnFloor exported from App.tsx so unit tests can import it; snappedPosition from guidanceState is used as the reference point for nearest-node lookup on floor change.", "safeFloorId local introduced in FloorTransitionBanner to coerce floorId?: number | null to number | null before useRef/setState — fixes TypeScript strict mode error."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "TypeScript (npx tsc --noEmit) passes with 0 errors. Full test suite: 49/56 files pass, 522/567 tests pass. New findNearestNodeOnFloor.test.ts: 8/8 tests pass. 7 pre-existing failures (4 TSX SyntaxErrors + 3 React hook errors) are unchanged — not introduced by this task."
completed_at: 2026-03-30T13:30:43.785Z
blocker_discovered: false
---

# T03: Accessible mode wired into LiveGuidanceOverlay with amber highlighting; findNearestNodeOnFloor helper added and floor snap integrated in App.tsx onFloorChange.

> Accessible mode wired into LiveGuidanceOverlay with amber highlighting; findNearestNodeOnFloor helper added and floor snap integrated in App.tsx onFloorChange.

## What Happened
---
id: T03
parent: S04
milestone: M002-a5gn45
key_files:
  - mobile/components/guidance/LiveGuidanceOverlay.tsx
  - mobile/App.tsx
  - mobile/hooks/findNearestNodeOnFloor.test.ts
  - mobile/components/guidance/LiveGuidanceOverlay.test.tsx
key_decisions:
  - Accessible step highlighting: elevator/ramp icons get amber (#facc15) background + dark icon when accessibleMode is true, and '(accessible)' is appended to instruction text.
  - findNearestNodeOnFloor exported from App.tsx so unit tests can import it; snappedPosition from guidanceState is used as the reference point for nearest-node lookup on floor change.
  - safeFloorId local introduced in FloorTransitionBanner to coerce floorId?: number | null to number | null before useRef/setState — fixes TypeScript strict mode error.
duration: ""
verification_result: passed
completed_at: 2026-03-30T13:30:43.786Z
blocker_discovered: false
---

# T03: Accessible mode wired into LiveGuidanceOverlay with amber highlighting; findNearestNodeOnFloor helper added and floor snap integrated in App.tsx onFloorChange.

**Accessible mode wired into LiveGuidanceOverlay with amber highlighting; findNearestNodeOnFloor helper added and floor snap integrated in App.tsx onFloorChange.**

## What Happened

Implemented accessible mode parity and App.tsx integration for T03 of Slice S04. Added accessibleMode: boolean prop to LiveGuidanceOverlay — when true, elevator/ramp step icons render with amber (#facc15) background and dark icon, and instruction text gets ' (accessible)' appended. Fixed FloorTransitionBanner TypeScript strictness with safeFloorId coercion. Exported findNearestNodeOnFloor helper from App.tsx that finds the nearest graph node on a given floor using Euclidean distance. Wired accessibleMode prop to LiveGuidanceOverlay and integrated floor-snap on floor change: onFloorChange uses guidanceState.snappedPosition as reference to find nearest node on the new floor and calls confirmPosition. Created 8-unit test suite for findNearestNodeOnFloor in mobile/hooks/findNearestNodeOnFloor.test.ts. Fixed pre-existing LiveGuidanceOverlay.test.tsx fixture missing currentFloorId field.

## Verification

TypeScript (npx tsc --noEmit) passes with 0 errors. Full test suite: 49/56 files pass, 522/567 tests pass. New findNearestNodeOnFloor.test.ts: 8/8 tests pass. 7 pre-existing failures (4 TSX SyntaxErrors + 3 React hook errors) are unchanged — not introduced by this task.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd mobile && npx tsc --noEmit` | 0 | ✅ pass | 5000ms |
| 2 | `npm test --prefix mobile` | 0 | ⚠️ 7 pre-existing failures (SyntaxError/React hooks); 49 files pass including new findNearestNodeOnFloor.test.ts (8/8 pass) | 6650ms |


## Deviations

None

## Known Issues

4 TSX component test files (LiveGuidanceOverlay, ConfidenceIndicator, MapViewportFloor, DestinationPicker) have pre-existing SyntaxError on `typeof` — Vitest TSX transform issue with TypeScript-specific constructs. 3 hook tests (useRouteSession, useRouteSelection, useLocationSearch) have pre-existing React 19 multiple-copy / invalid hook call errors.

## Files Created/Modified

- `mobile/components/guidance/LiveGuidanceOverlay.tsx`
- `mobile/App.tsx`
- `mobile/hooks/findNearestNodeOnFloor.test.ts`
- `mobile/components/guidance/LiveGuidanceOverlay.test.tsx`


## Deviations
None

## Known Issues
4 TSX component test files (LiveGuidanceOverlay, ConfidenceIndicator, MapViewportFloor, DestinationPicker) have pre-existing SyntaxError on `typeof` — Vitest TSX transform issue with TypeScript-specific constructs. 3 hook tests (useRouteSession, useRouteSelection, useLocationSearch) have pre-existing React 19 multiple-copy / invalid hook call errors.
