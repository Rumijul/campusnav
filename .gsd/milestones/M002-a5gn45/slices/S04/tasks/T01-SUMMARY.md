---
id: T01
parent: S04
milestone: M002-a5gn45
provides: []
requires: []
affects: []
key_files: ["mobile/map/mapTransform.ts", "mobile/map/MapViewport.tsx", "mobile/map/MapViewportFloor.tsx", "mobile/App.tsx", "mobile/map/mapTransform.test.ts"]
key_decisions: ["Heading rotation gated on guidance phase: passes null (no cumulative rotation) during idle to preserve user manual map exploration before guidance starts.", "headingRotationDeg field is preserved through all transform mutations (applyPanDelta via spread, applyPinchRotate explicit), preventing heading value loss during pan/pinch gestures."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "TypeScript: npx tsc --noEmit returned 0 errors. Unit tests: npx vitest run map/mapTransform.test.ts returned 10 passed with exit code 0. Both verification gates pass."
completed_at: 2026-03-30T13:11:30.008Z
blocker_discovered: false
---

# T01: Heading-aware map rotation wired end-to-end: headingRotationDeg field added to MapTransform, applyHeadingRotation helper added, MapViewport applies cumulative rotateZ, MapViewportFloor passes headingDegrees, App.tsx wires smoothedHeadingDegrees from useCurrentPosition with phase-gated activation during active guidance.

> Heading-aware map rotation wired end-to-end: headingRotationDeg field added to MapTransform, applyHeadingRotation helper added, MapViewport applies cumulative rotateZ, MapViewportFloor passes headingDegrees, App.tsx wires smoothedHeadingDegrees from useCurrentPosition with phase-gated activation during active guidance.

## What Happened
---
id: T01
parent: S04
milestone: M002-a5gn45
key_files:
  - mobile/map/mapTransform.ts
  - mobile/map/MapViewport.tsx
  - mobile/map/MapViewportFloor.tsx
  - mobile/App.tsx
  - mobile/map/mapTransform.test.ts
key_decisions:
  - Heading rotation gated on guidance phase: passes null (no cumulative rotation) during idle to preserve user manual map exploration before guidance starts.
  - headingRotationDeg field is preserved through all transform mutations (applyPanDelta via spread, applyPinchRotate explicit), preventing heading value loss during pan/pinch gestures.
duration: ""
verification_result: passed
completed_at: 2026-03-30T13:11:30.008Z
blocker_discovered: false
---

# T01: Heading-aware map rotation wired end-to-end: headingRotationDeg field added to MapTransform, applyHeadingRotation helper added, MapViewport applies cumulative rotateZ, MapViewportFloor passes headingDegrees, App.tsx wires smoothedHeadingDegrees from useCurrentPosition with phase-gated activation during active guidance.

**Heading-aware map rotation wired end-to-end: headingRotationDeg field added to MapTransform, applyHeadingRotation helper added, MapViewport applies cumulative rotateZ, MapViewportFloor passes headingDegrees, App.tsx wires smoothedHeadingDegrees from useCurrentPosition with phase-gated activation during active guidance.**

## What Happened

Extended the map transform system to support device heading rotation. Added `headingRotationDeg: number` (default 0) to the `MapTransform` interface and updated all call sites that construct or compare transforms — DEFAULT_TRANSFORM, createInitialMapTransform, applyPinchRotate, mapTransformsEqual, screenFromWorld intermediate objects, MapViewportFloor local state, App.tsx transform-state callback, and existing test fixtures. Added `applyHeadingRotation(existing, headingDegrees)` pure function that passes through existing transform when heading is null and sets headingRotationDeg when non-null. MapViewport applies cumulative rotation via `rotateZ: \`${transform.rotationDeg + (headingRotationDeg ?? 0)}deg\`` — manual rotation plus heading. App.tsx passes `headingDegrees={guidanceState.phase === 'idle' ? null : smoothedHeadingDegrees}`, ensuring heading rotation activates only during active guidance sessions. All TypeScript compiles clean, all 10 unit tests pass.

## Verification

TypeScript: npx tsc --noEmit returned 0 errors. Unit tests: npx vitest run map/mapTransform.test.ts returned 10 passed with exit code 0. Both verification gates pass.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit` | 0 | ✅ pass | 1000ms |
| 2 | `npx vitest run map/mapTransform.test.ts` | 0 | ✅ pass | 565ms |


## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `mobile/map/mapTransform.ts`
- `mobile/map/MapViewport.tsx`
- `mobile/map/MapViewportFloor.tsx`
- `mobile/App.tsx`
- `mobile/map/mapTransform.test.ts`


## Deviations
None.

## Known Issues
None.
