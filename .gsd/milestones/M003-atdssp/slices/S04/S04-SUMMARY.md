---
id: S04
parent: M003-atdssp
milestone: M003-atdssp
provides:
  - Full layered floating UI in App.tsx with all S01–S03 components wired
  - BottomSheet with 3 snap points wired to DestinationPicker / RoutePreview / settings
  - FloatingSearchBar and FloatingFloorSwitcher visible on map
  - AnimatedRoutePathOverlay layered above map backdrop
  - ConfidenceIndicator with showPulse during active guidance
  - Theme colors applied throughout new UI — no hardcoded literals
  - Telemetry Text removed
  - MapViewportFloor routeOverlay prop for overlay stacking
  - mapApiClient correctly classifies already-aborted signals
requires:
  - slice: M003-atdssp/S02
    provides: BottomSheet, FloatingSearchBar, FloatingFloorSwitcher components
  - slice: M003-atdssp/S03
    provides: AnimatedRoutePathOverlay, ConfidenceIndicator, LiveGuidanceOverlay, FloorTransitionView components
  - slice: M003-atdssp/S01
    provides: useTheme hook, darkColors/lightColors tokens
affects:
  []
key_files:
  - mobile/App.tsx
  - mobile/map/MapViewportFloor.tsx
  - mobile/hooks/useLocationSearch.ts
  - mobile/hooks/useGuidanceSession.ts
  - mobile/routing/routeSessionState.ts
  - mobile/data/mapApiClient.ts
key_decisions:
  - Layered floating UI z-order: MapViewportFloor(z0) → AnimatedRoutePathOverlay(z1) → FloatingSearchBar(z10) → FloatingFloorSwitcher(z10) → LiveGuidanceOverlay(z15) → ConfidenceIndicator(z20) → BottomSheet(z100)
  - NavNode type boundary at useRouteSession: shared/types NavNode differs from useRouteSelection local alias — cast at boundary
  - mapApiClient.withHardTimeout: pass external AbortSignal as 3rd param so already-aborted callers reject immediately rather than racing the timeout
  - Inline import('...').Type in .ts files causes oxc parser failure in vitest 4.x workers — use regular value imports instead
  - export const X = undefined as unknown as X for export type workaround causes TS2395 when type already exported elsewhere — only use when type is declared in same file
patterns_established:
  - Inline import() type syntax in source .ts files causes vitest worker parse failures with oxc — always use regular value imports for types from shared modules
  - withHardTimeout must check external signal.aborted before racing to avoid misclassifying abort errors as timeout
observability_surfaces:
  - console.log guidance-started/guidance-stopped events in useGuidanceSession
  - console.log floor-transition events in processFix
drill_down_paths:
  - M003-atdssp/S04/T01
  - M003-atdssp/S04/T02
  - M003-atdssp/S04/T03
duration: ""
verification_result: passed
completed_at: 2026-04-02T13:38:41.252Z
blocker_discovered: false
---

# S04: App.tsx Integration + Final Wiring

**Full layered floating UI wired in App.tsx; typecheck and 522/522 tests pass after fixing mapApiClient signal handling and inline import() type syntax.**

## What Happened

S04 is the integration slice for M003-atdssp. T01 replaced the ScrollView-based layout with a layered absolute-positioned UI: MapViewportFloor (z0) + AnimatedRoutePathOverlay (z1) + FloatingSearchBar/FloatingFloorSwitcher (z10) + LiveGuidanceOverlay (z15) + ConfidenceIndicator (z20) + BottomSheet (z100). The bottom sheet's three snap points are wired to content: collapsed → DestinationPicker, half → RoutePreview, full → accessible settings. T02 removed the floor selector strip from MapViewportFloor (now FloatingFloorSwitcher's responsibility) and added optional routeOverlay prop for overlay stacking. T03 confirmed typecheck and 521/522 test pass. This closeout unit fixed two remaining issues: (1) mapApiClient.withHardTimeout now checks external AbortSignal before racing against its internal timeout, so already-aborted callers correctly get 'aborted' not 'timeout'; (2) useLocationSearch.ts, useGuidanceSession.ts, and routeSessionState.ts were using inline import() type syntax that oxc can't parse — switched to regular value imports. Result: 522/522 tests pass, tsc --noEmit exits 0. The 7 pre-existing oxc suite failures are now 0. R040–R045 are all integrated and delivered by this slice.

## Verification

522/522 tests pass (npm test). npx tsc --noEmit exits 0. 7 suites that previously failed with SyntaxError now pass. 1 pre-existing mapApiClient behavioral mismatch (already-aborted signal returning 'timeout') is now fixed by passing external signal to withHardTimeout.

## Requirements Advanced

- R040 — App.tsx now renders full layered floating UI with all components at correct z-order
- R041 — BottomSheet integrated in App.tsx with snap→content wiring (strip/destination, half/route preview, full/settings)
- R042 — Theme applied throughout new UI — useTheme() used in all new components, no hardcoded colors
- R043 — AnimatedRoutePathOverlay wired via MapViewportFloor routeOverlay prop
- R044 — FloorTransitionView integrated for cross-fade on floor switch
- R045 — ConfidenceIndicator integrated with showPulse prop from guidance state

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

None from plan. Both deviations were documented in T03.

## Known Limitations

The oxc parser issue persists in some transitive test imports — if a test file imports a module that itself uses import type from a file that hasn't been corrected, the failure may reappear. This is a vitest 4.x worker-level issue requiring either a vitest upgrade or removal of import type from shared types.

## Follow-ups

R040–R045 need milestone closeout validation to move from active to validated in REQUIREMENTS.md. The 7 previously-failing test suites (MapViewportFloor, useLocationSearch, useRouteSelection, useRouteSession, ConfidenceIndicator, LiveGuidanceOverlay, DestinationPicker) now pass, which gives full coverage of the new UI components.

## Files Created/Modified

- `mobile/App.tsx` — Replaced ScrollView with layered absolute UI, all S01-S03 components wired, telemetry removed
- `mobile/map/MapViewportFloor.tsx` — Removed floor selector strip, added routeOverlay prop
- `mobile/hooks/useLocationSearch.ts` — Replaced inline import() type with regular value import
- `mobile/hooks/useGuidanceSession.ts` — Replaced inline import() types with regular value imports
- `mobile/routing/routeSessionState.ts` — Replaced inline import() NavFloor with regular value import
- `mobile/data/mapApiClient.ts` — withHardTimeout checks external signal.aborted before racing; fixed already-aborted signal classification
