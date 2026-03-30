---
id: T06
parent: S03
milestone: M002-a5gn45
provides: []
requires: []
affects: []
key_files: ["mobile/App.tsx", "mobile/routing/index.ts", "mobile/hooks/index.ts", "mobile/tsconfig.json (added DOM lib)", "mobile/routing/guidanceState.test.ts (PathWithNodeById type fix)", "mobile/hooks/useGuidanceSession.test.ts (import source fix)"]
key_decisions: ["useGuidanceSession called only when sessionState.phase === 'ready'; returns no-op object when not ready", "LiveGuidanceOverlay rendered as absolute overlay inside View container (position: absolute, zIndex: 100)", "ConfidenceIndicator fixed top-right dot (position: absolute, top: 16, right: 16, zIndex: 101)", "Start Guidance button styled #0f4a7a bg / #38bdf8 border to match existing toggle buttons", "guidanceState mutable ref object not exported — deriveConfidence, isOffRoute, shouldAdvanceStep, deriveNextPhase, getActiveStep are the public helpers", "PathWithNodeById changed from interface to type alias to fix TS2499 error"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "TypeScript: 0 errors. S03 test suite (guidanceState, useCurrentPosition, useGuidanceSession): 108 tests passing. LiveGuidanceOverlay renders for non-idle phases; Start Guidance button visible when route ready and guidance idle. bearing.test.ts has pre-existing isolated failure (vitest globals environment issue, not task-related)."
completed_at: 2026-03-30T12:47:21.997Z
blocker_discovered: false
---

# T06: Wired guidance into App.tsx with overlay and Start button; created routing/hooks entry points; 0 TS errors, 108 S03 tests passing

> Wired guidance into App.tsx with overlay and Start button; created routing/hooks entry points; 0 TS errors, 108 S03 tests passing

## What Happened
---
id: T06
parent: S03
milestone: M002-a5gn45
key_files:
  - mobile/App.tsx
  - mobile/routing/index.ts
  - mobile/hooks/index.ts
  - mobile/tsconfig.json (added DOM lib)
  - mobile/routing/guidanceState.test.ts (PathWithNodeById type fix)
  - mobile/hooks/useGuidanceSession.test.ts (import source fix)
key_decisions:
  - useGuidanceSession called only when sessionState.phase === 'ready'; returns no-op object when not ready
  - LiveGuidanceOverlay rendered as absolute overlay inside View container (position: absolute, zIndex: 100)
  - ConfidenceIndicator fixed top-right dot (position: absolute, top: 16, right: 16, zIndex: 101)
  - Start Guidance button styled #0f4a7a bg / #38bdf8 border to match existing toggle buttons
  - guidanceState mutable ref object not exported — deriveConfidence, isOffRoute, shouldAdvanceStep, deriveNextPhase, getActiveStep are the public helpers
  - PathWithNodeById changed from interface to type alias to fix TS2499 error
duration: ""
verification_result: passed
completed_at: 2026-03-30T12:47:21.997Z
blocker_discovered: false
---

# T06: Wired guidance into App.tsx with overlay and Start button; created routing/hooks entry points; 0 TS errors, 108 S03 tests passing

**Wired guidance into App.tsx with overlay and Start button; created routing/hooks entry points; 0 TS errors, 108 S03 tests passing**

## What Happened

Wired the real-time guidance system (S03) into App.tsx and created public API re-export entry points. App.tsx imports useGuidanceSession, useCurrentPosition, LiveGuidanceOverlay, and ConfidenceIndicator. useGuidanceSession is called conditionally when sessionState.phase === 'ready'. The Start Guidance button appears only when route is ready and guidance is idle. LiveGuidanceOverlay renders as an absolute-positioned overlay above the map, with a fixed ConfidenceIndicator dot in the top-right corner. Created mobile/routing/index.ts and mobile/hooks/index.ts re-exporting all S02 and S03 public API. Fixed three pre-existing TypeScript errors: added DOM lib to tsconfig.json, changed PathWithNodeById from interface to intersection type in guidanceState.test.ts, fixed HeadingData/PositionFix imports in useGuidanceSession.test.ts. Result: 0 TypeScript errors, 108 S03 tests passing.

## Verification

TypeScript: 0 errors. S03 test suite (guidanceState, useCurrentPosition, useGuidanceSession): 108 tests passing. LiveGuidanceOverlay renders for non-idle phases; Start Guidance button visible when route ready and guidance idle. bearing.test.ts has pre-existing isolated failure (vitest globals environment issue, not task-related).

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit -p mobile/tsconfig.json` | 0 | ✅ pass | 14200ms |
| 2 | `npm test -- --run mobile/routing/guidanceState.test.ts` | 0 | ✅ pass | 155ms |
| 3 | `npm test -- --run mobile/hooks/useCurrentPosition.test.ts` | 0 | ✅ pass | 158ms |
| 4 | `npm test -- --run mobile/hooks/useGuidanceSession.test.ts` | 0 | ✅ pass | 243ms |


## Deviations

Pre-existing: mobile/domain/bearing.test.ts fails with 'describe is not defined' when run in isolation — a vitest globals environment setup issue, not caused by this task. guidanceState mutable ref removed from routing/index.ts as it is not part of public API.

## Known Issues

Pre-existing: mobile/domain/bearing.test.ts fails with 'describe is not defined' when run in isolation — vitest globals environment not fully applied to isolated file run.

## Files Created/Modified

- `mobile/App.tsx`
- `mobile/routing/index.ts`
- `mobile/hooks/index.ts`
- `mobile/tsconfig.json (added DOM lib)`
- `mobile/routing/guidanceState.test.ts (PathWithNodeById type fix)`
- `mobile/hooks/useGuidanceSession.test.ts (import source fix)`


## Deviations
Pre-existing: mobile/domain/bearing.test.ts fails with 'describe is not defined' when run in isolation — a vitest globals environment setup issue, not caused by this task. guidanceState mutable ref removed from routing/index.ts as it is not part of public API.

## Known Issues
Pre-existing: mobile/domain/bearing.test.ts fails with 'describe is not defined' when run in isolation — vitest globals environment not fully applied to isolated file run.
