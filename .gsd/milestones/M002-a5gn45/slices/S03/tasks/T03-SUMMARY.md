---
id: T03
parent: S03
milestone: M002-a5gn45
provides: []
requires: []
affects: []
key_files: ["mobile/hooks/useCurrentPosition.ts", "mobile/hooks/useCurrentPosition.test.ts", "mobile/vitest.config.ts"]
key_decisions: ["EMA wraparound: shortest angular path — if |delta| > 180, subtract 360 to get shorter rotation", "isConfident=false before first position (hasPosition ref guards initial null state)", "DefaultNativeHeadingReader: atan2(x,y)+90deg rotation for compass bearing; catches expo-sensors absence gracefully", "Test strategy: pure function EMA + interface contracts; full hook tests blocked by pre-existing React 19 / @testing-library/react@16.3.2 incompatibility"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "npm test -- --run mobile/hooks/useCurrentPosition.test.ts: 22 tests pass; npx tsc --noEmit: 0 TypeScript errors"
completed_at: 2026-03-30T11:56:59.578Z
blocker_discovered: false
---

# T03: Implement useCurrentPosition hook: GPS + heading subscription with EMA smoothing, injectable interfaces, 22 tests, 0 TS errors

> Implement useCurrentPosition hook: GPS + heading subscription with EMA smoothing, injectable interfaces, 22 tests, 0 TS errors

## What Happened
---
id: T03
parent: S03
milestone: M002-a5gn45
key_files:
  - mobile/hooks/useCurrentPosition.ts
  - mobile/hooks/useCurrentPosition.test.ts
  - mobile/vitest.config.ts
key_decisions:
  - EMA wraparound: shortest angular path — if |delta| > 180, subtract 360 to get shorter rotation
  - isConfident=false before first position (hasPosition ref guards initial null state)
  - DefaultNativeHeadingReader: atan2(x,y)+90deg rotation for compass bearing; catches expo-sensors absence gracefully
  - Test strategy: pure function EMA + interface contracts; full hook tests blocked by pre-existing React 19 / @testing-library/react@16.3.2 incompatibility
duration: ""
verification_result: passed
completed_at: 2026-03-30T11:56:59.578Z
blocker_discovered: false
---

# T03: Implement useCurrentPosition hook: GPS + heading subscription with EMA smoothing, injectable interfaces, 22 tests, 0 TS errors

**Implement useCurrentPosition hook: GPS + heading subscription with EMA smoothing, injectable interfaces, 22 tests, 0 TS errors**

## What Happened

Built mobile/hooks/useCurrentPosition.ts with injectable PositionReader and HeadingReader interfaces. Returns position, heading, smoothedHeadingDegrees, isConfident, isHeadingValid. EMA smoothing alpha=0.3 with angular wraparound at 0/360deg. isGpsFixConfident imported from src/shared/gps.ts. DefaultNativeHeadingReader uses expo-sensors Magnetometer with graceful fallback. DefaultPositionReader uses navigator.geolocation.watchPosition. Cleanup stops both subscriptions on unmount. Fixed mobile/vitest.config.ts: added React plugin + path aliases, installed missing jsdom. Full hook integration tests blocked by pre-existing React 19 / @testing-library/react@16.3.2 incompatibility in vitest jsdom (same failure as useRouteSelection.test.ts). Tests cover pure EMA smoothing, cleanup spy verification, and interface contracts.

## Verification

npm test -- --run mobile/hooks/useCurrentPosition.test.ts: 22 tests pass; npx tsc --noEmit: 0 TypeScript errors

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm test -- --run mobile/hooks/useCurrentPosition.test.ts` | 0 | ✅ pass | 4ms |
| 2 | `npx tsc --noEmit` | 0 | ✅ pass | 0ms |


## Deviations

Full hook integration tests (React rendering) not possible due to pre-existing React 19 incompatibility with @testing-library/react@16.3.2 in vitest jsdom (same failure affects useRouteSelection.test.ts).

## Known Issues

Full hook integration tests blocked by React 19 incompatibility; fix requires @testing-library/react@19.x or downgrading React

## Files Created/Modified

- `mobile/hooks/useCurrentPosition.ts`
- `mobile/hooks/useCurrentPosition.test.ts`
- `mobile/vitest.config.ts`


## Deviations
Full hook integration tests (React rendering) not possible due to pre-existing React 19 incompatibility with @testing-library/react@16.3.2 in vitest jsdom (same failure affects useRouteSelection.test.ts).

## Known Issues
Full hook integration tests blocked by React 19 incompatibility; fix requires @testing-library/react@19.x or downgrading React
