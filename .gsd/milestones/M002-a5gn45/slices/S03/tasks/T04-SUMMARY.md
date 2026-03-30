---
id: T04
parent: S03
milestone: M002-a5gn45
provides: []
requires: []
affects: []
key_files: ["mobile/hooks/useGuidanceSession.ts", "mobile/hooks/useGuidanceSession.test.ts"]
key_decisions: ["processPositionRef callback pattern: mutable ref avoids stale closures in high-frequency position updates; useState snapshot commits to React only after each processing pass", "reroute phase effect: reads phase from ref via useEffect dependency on guidanceState.phase (stable across renders) — triggers pathfinding asynchronously", "hookFixToStateFix/hookHeadingToStateHeading: pure shape converters exported for unit testability without React rendering", "recomputeDirections: lazy require inside function body to avoid circular dependency at module initialization time"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "npm test -- --run mobile/hooks/useGuidanceSession.test.ts: 45 tests passed in 245ms. npx tsc --noEmit: 0 TypeScript errors for useGuidanceSession.ts."
completed_at: 2026-03-30T12:08:37.696Z
blocker_discovered: false
---

# T04: Implemented useGuidanceSession orchestrator hook with 45 passing tests and 0 TypeScript errors

> Implemented useGuidanceSession orchestrator hook with 45 passing tests and 0 TypeScript errors

## What Happened
---
id: T04
parent: S03
milestone: M002-a5gn45
key_files:
  - mobile/hooks/useGuidanceSession.ts
  - mobile/hooks/useGuidanceSession.test.ts
key_decisions:
  - processPositionRef callback pattern: mutable ref avoids stale closures in high-frequency position updates; useState snapshot commits to React only after each processing pass
  - reroute phase effect: reads phase from ref via useEffect dependency on guidanceState.phase (stable across renders) — triggers pathfinding asynchronously
  - hookFixToStateFix/hookHeadingToStateHeading: pure shape converters exported for unit testability without React rendering
  - recomputeDirections: lazy require inside function body to avoid circular dependency at module initialization time
duration: ""
verification_result: passed
completed_at: 2026-03-30T12:08:37.696Z
blocker_discovered: false
---

# T04: Implemented useGuidanceSession orchestrator hook with 45 passing tests and 0 TypeScript errors

**Implemented useGuidanceSession orchestrator hook with 45 passing tests and 0 TypeScript errors**

## What Happened

Implemented useGuidanceSession — the central orchestration hook for real-time turn-by-turn navigation. Subscribes to useCurrentPosition (GPS + EMA heading), projects lat/lng → normalized map coords, snaps to nearest walkable node, derives confidence, drives the guidance state machine from T02, and triggers reroute via MobilePathfindingEngine when off-route. Key design: processPositionRef callback pattern decouples high-frequency GPS updates from React's render cycle — mutable ref handles every position tick, useState snapshot commits to React only after each processing pass. useEffect on guidanceState.phase drives reroute asynchronously when phase becomes 'rerouting'. Pure shape converters (hookFixToStateFix/hookHeadingToStateHeading) exported for direct unit testing without React rendering.

## Verification

npm test -- --run mobile/hooks/useGuidanceSession.test.ts: 45 tests passed in 245ms. npx tsc --noEmit: 0 TypeScript errors for useGuidanceSession.ts.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx vitest run mobile/hooks/useGuidanceSession.test.ts --reporter=verbose` | 0 | ✅ pass | 245ms |
| 2 | `npx tsc --noEmit 2>&1 | grep useGuidanceSession` | 0 | ✅ pass | 800ms |


## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `mobile/hooks/useGuidanceSession.ts`
- `mobile/hooks/useGuidanceSession.test.ts`


## Deviations
None.

## Known Issues
None.
