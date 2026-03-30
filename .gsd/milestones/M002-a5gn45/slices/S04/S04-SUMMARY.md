---
id: S04
parent: M002-a5gn45
milestone: M002-a5gn45
provides:
  - Heading-aware map rotation during active guidance sessions
  - FloorBadge subcomponent showing current floor number
  - FloorTransitionBanner for 2500ms floor change toast
  - Accessible mode with amber highlighting for elevator/ramp steps
  - findNearestNodeOnFloor helper for floor-snap on floor changes
  - currentFloorId tracking in GuidanceState
  - deriveFloorContext(state) helper for testability
requires:
  - slice: S03
    provides: Real-time guidance core (confidence + reroute engine) with snappedRecord.floorId for floor tracking source
  - slice: S02
    provides: Visitor trip setup parity with graph.floorById for floorMap prop source
  - slice: S01
    provides: Native app runtime with useCurrentPosition returning smoothedHeadingDegrees
affects:
  - S05 - Integrated acceptance + internal build delivery
key_files:
  - mobile/map/mapTransform.ts
  - mobile/map/MapViewport.tsx
  - mobile/map/MapViewportFloor.tsx
  - mobile/map/mapTransform.test.ts
  - mobile/routing/guidanceState.ts
  - mobile/routing/guidanceState.test.ts
  - mobile/hooks/useGuidanceSession.ts
  - mobile/components/guidance/LiveGuidanceOverlay.tsx
  - mobile/App.tsx
  - mobile/hooks/findNearestNodeOnFloor.ts
  - mobile/hooks/findNearestNodeOnFloor.test.ts
key_decisions:
  - Heading rotation phase-gated: passes null during idle to preserve manual map exploration, active only during guidance sessions.
  - headingRotationDeg preserved through all transform mutations (applyPanDelta via spread, applyPinchRotate explicit) to prevent value loss during gestures.
  - currentFloorId initialized to null in idle state, updated on each position fix via snappedRecord.floorId.
  - previousFloorIdRef pattern for detecting genuine floor crossings (both non-null and different) — fires console.log('[Guidance] floor-transition', { from, to }).
  - FloorTransitionBanner uses useRef inside component body for prevFloorId tracking — state-free display updates.
  - stopGuidance resets currentFloorId to null to match idle semantics.
  - deriveFloorContext(state) pure helper extracts floorId from GuidanceState snapshot for testability.
  - Accessible step highlighting: elevator/ramp icons get amber (#facc15) background + dark icon when accessibleMode === true, with '(accessible)' appended to instruction text.
  - safeFloorId local introduced in FloorTransitionBanner to coerce floorId?: number | null to number | null before useRef/setState — fixes TypeScript strict mode error.
patterns_established:
  - Phase-gated feature activation pattern: null during idle state to preserve base functionality, non-null during active state for enhanced UX
  - previousFloorIdRef pattern for detecting state boundary crossings in hooks without triggering re-renders
  - safeFloorId coercion pattern for TypeScript strict mode with optional props
  - Cumulative rotation pattern: manual rotation + heading rotation combined in rotateZ transform
observability_surfaces:
  - console.log('[Guidance] floor-transition', { from, to }) on genuine floor crossings
  - console.log('[Guidance] floor-transition', { from, to }) with both non-null values
  - headingDegrees propagates through MapTransform → MapViewport → MapViewportFloor → LiveGuidanceOverlay
drill_down_paths:
  - .gsd/milestones/M002-a5gn45/slices/S04/tasks/T01-SUMMARY.md
  - .gsd/milestones/M002-a5gn45/slices/S04/tasks/T02-SUMMARY.md
  - .gsd/milestones/M002-a5gn45/slices/S04/tasks/T03-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-30T13:37:55.482Z
blocker_discovered: false
---

# S04: Visitor-first live UX + floor-safe accessible parity

**Heading-aware map rotation, floor-aware guidance overlay, and accessible mode parity wired end-to-end in the CampusNav mobile app.**

## What Happened

S04 wired visitor-first live UX improvements end-to-end in the CampusNav mobile app, completing the native app foundation milestone. T01 extended the map transform system with heading-aware rotation — device heading from useCurrentPosition flows through MapTransform → MapViewport → MapViewportFloor → App.tsx, with cumulative rotateZ and phase-gated activation. T02 added floor-aware guidance state (currentFloorId tracking, deriveFloorContext helper, FloorBadge, FloorTransitionBanner) to prevent wrong-floor instructions and provide explicit floor context during transitions. T03 implemented accessible mode parity (amber highlighting for elevator/ramp icons, "(accessible)" instruction suffix) and the findNearestNodeOnFloor helper for floor-snap on floor changes. All 145 S04-related tests pass. Pre-existing test failures (TSX SyntaxErrors, React 19 hook errors) are unrelated to S04 work.

## Verification

TypeScript: npx tsc --noEmit passes with 0 errors. S04-specific unit tests: 145 tests pass across 7 test files (appBootstrap, bearing, findNearestNodeOnFloor, guidanceState, useGuidanceSession, useCurrentPosition). TypeScript compiles clean. The slice verifies all T01/T02/T03 plan gates.

## Requirements Advanced

- R029 — headingRotationDeg wired through MapTransform → MapViewport with cumulative rotateZ; phase-gated activation ensures heading rotation only during active guidance
- R030 — currentFloorId tracking in GuidanceState, FloorBadge and FloorTransitionBanner in LiveGuidanceOverlay prevent wrong-floor instructions
- R031 — accessibleMode boolean prop wired to LiveGuidanceOverlay with amber (#facc15) highlighting for elevator/ramp icons and (accessible) instruction suffix

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

None

## Known Limitations

Pre-existing test failures in 7 other test files (4 TSX component tests with SyntaxError on typeof, 3 hook tests with React 19 invalid hook call errors) — unrelated to S04 work and not introduced by this slice.

## Follow-ups

None

## Files Created/Modified

- `mobile/map/mapTransform.ts` — Added headingRotationDeg field and applyHeadingRotation helper
- `mobile/map/MapViewport.tsx` — Added headingRotationDeg prop with cumulative rotateZ transform
- `mobile/map/MapViewportFloor.tsx` — Added headingDegrees prop passthrough to MapViewport
- `mobile/App.tsx` — Wired smoothedHeadingDegrees, accessibleMode, floorId, floorMap props; import findNearestNodeOnFloor
- `mobile/routing/guidanceState.ts` — Added currentFloorId to GuidanceState interface and deriveFloorContext helper
- `mobile/hooks/useGuidanceSession.ts` — Added currentFloorId tracking with previousFloorIdRef for floor transitions
- `mobile/components/guidance/LiveGuidanceOverlay.tsx` — Added FloorBadge, FloorTransitionBanner, accessibleMode highlighting, floorId/floorMap props
- `mobile/map/mapTransform.test.ts` — Extended with headingRotationDeg tests
- `mobile/routing/guidanceState.test.ts` — Added 6 floor-tracker tests for deriveFloorContext
- `mobile/hooks/findNearestNodeOnFloor.ts` — New file: findNearestNodeOnFloor helper extracted from App.tsx
- `mobile/hooks/findNearestNodeOnFloor.test.ts` — New file: 8 unit tests for findNearestNodeOnFloor
- `mobile/components/guidance/LiveGuidanceOverlay.test.tsx` — Fixed fixture missing currentFloorId field
