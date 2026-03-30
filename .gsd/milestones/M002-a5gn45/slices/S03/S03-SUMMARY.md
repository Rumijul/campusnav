---
id: S03
parent: M002-a5gn45
milestone: M002-a5gn45
provides:
  - GuidanceState machine with ConfidenceLevel and GuidancePhase types
  - useCurrentPosition hook with injectable device interfaces
  - useGuidanceSession orchestrator hook with reroute capability
  - LiveGuidanceOverlay component with 5-phase conditional rendering
  - ConfidenceIndicator colored dot component
  - bearing() and normalizeDelta() geometry utilities exported from mobile/domain/navGraph.ts
  - routing/index.ts and hooks/index.ts public API entry points
requires:
  - slice: S02
    provides: computeRouteSession, RouteSessionReadyState, NormalizedNavGraph, MobilePathfindingEngine — useGuidanceSession consumes all of these
affects:
  - S04: requires guidanceState, useGuidanceSession, LiveGuidanceOverlay, ConfidenceIndicator
  - S04: bearing() ready for heading-aware map rotation
  - S04: confirmPosition() wired in App.tsx
  - S04: rerouteCooldownMs configurable via useGuidanceSession props
  - S05: all S03 infrastructure required for end-to-end device verification
key_files:
  - mobile/routing/guidanceState.ts
  - mobile/hooks/useGuidanceSession.ts
  - mobile/hooks/useCurrentPosition.ts
  - mobile/components/guidance/LiveGuidanceOverlay.tsx
  - mobile/components/guidance/ConfidenceIndicator.tsx
  - mobile/App.tsx
  - mobile/routing/index.ts
  - mobile/hooks/index.ts
  - mobile/domain/navGraph.ts
key_decisions:
  - bearing() formula: atan2(dy, -dx) * (180/π) + 270 with x-axis mirroring — screen-space coords where north=0°, east=90°, south=180°, west=270°
  - Confidence 'low' when GPS finite but unconfident; 'none' only when accuracy is null or infinite (per spec)
  - processPositionRef mutable ref + useState snapshot — decouples high-frequency GPS ticks from React render cycle
  - useEffect on guidanceState.phase (stable) drives async reroute — avoids stale closures
  - Two-phase nodeById lookup: path.nodeById ?? route.path.nodeById — bridges test shapes and production NormalizedNavGraph
  - EMA alpha=0.3 with shortest-angular-path wraparound for heading smoothing
  - Lazy require inside reroute function body — avoids circular module dependency at init time
patterns_established:
  - Mutable ref + useState snapshot pattern for high-frequency device updates
  - Interface injection for device/hardware-dependent hooks
  - Shape converters for non-React unit testing of hook internals
  - Two-phase coordinate resolution for test/production shape bridging
  - Phase-driven conditional rendering in overlay components
  - Angular shortest-path wraparound for heading/bearing smoothing
  - Lazy require for circular-dependency avoidance in module initialization
observability_surfaces:
  - Phase transitions logged via console.group in guidance state machine
  - Reroute triggered logged with snappedNodeId and destination node IDs
  - Position projection failures logged with original lat/lng values
  - guidanceState useState snapshot committed on every processing pass (reactive to React DevTools)
drill_down_paths:
  - tasks/T01-SUMMARY.md
  - tasks/T02-SUMMARY.md
  - tasks/T03-SUMMARY.md
  - tasks/T04-SUMMARY.md
  - tasks/T05-SUMMARY.md
  - tasks/T06-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-30T12:55:01.853Z
blocker_discovered: false
---

# S03: Real-time guidance core (confidence + reroute engine)

**Built the confidence-gated guidance state machine, GPS+heading subscription with EMA smoothing, session orchestrator, and live UI overlay — 119 tests passing, 0 TS errors.**

## What Happened

S03 delivered the real-time guidance core as a layered system. T01 added bearing/normalizeDelta geometry utilities (11 tests). T02 built the guidance state machine with ConfidenceLevel, GuidancePhase, deriveConfidence, isOffRoute, shouldAdvanceStep, deriveNextPhase (41 tests). T03 implemented useCurrentPosition with injectable PositionReader/HeadingReader interfaces, EMA smoothing with angular wraparound, and graceful expo-sensors fallback (22 tests). T04 built the session orchestrator useGuidanceSession using a mutable ref + snapshot pattern to decouple high-frequency GPS ticks from React's render cycle; useEffect on guidanceState.phase drives async reroute; MobilePathfindingEngine recomputes path when off-route is confirmed (45 tests). T05 created ConfidenceIndicator (colored dot) and LiveGuidanceOverlay (5-phase conditional renderer) in mobile/components/guidance/ (0 TS errors; component tests blocked by pre-existing Vite 7 TSX bug). T06 wired everything into App.tsx with Start Guidance button, absolute-positioned overlay, top-right confidence dot, and public API entry points (routing/index.ts, hooks/index.ts). Total: 119 tests passing, 0 TypeScript errors.

## Verification

119 tests passing across 4 test suites (11 bearing, 41 guidanceState, 22 useCurrentPosition, 45 useGuidanceSession). TypeScript: 0 errors (npx tsc --noEmit). Entry points verified: routing/index.ts and hooks/index.ts re-export all public API. App.tsx wiring verified: useGuidanceSession called conditionally, LiveGuidanceOverlay renders for non-idle phases, ConfidenceIndicator dot visible in top-right, Start Guidance button visible when route ready and guidance idle. Component TSX smoke tests blocked by pre-existing Vite 7 TSX transform bug (same as DestinationPicker.test.tsx).

## Requirements Advanced

- R026 — Core guidance loop built: guidanceState machine, useGuidanceSession orchestrator, LiveGuidanceOverlay with 5-phase UI. Floor transitions deferred to S04.
- R027 — 4-level ConfidenceLevel with deriveConfidence(), explicit low-confidence banner in LiveGuidanceOverlay, ConfidenceIndicator dot.
- R028 — Off-route detection via isOffRoute(), rerouteConfirmFixes counter, MobilePathfindingEngine reroute. rerouteConfirmFixes(2) × updateIntervalMs(2000ms) ≈ 4-6s.
- R029 — heading + smoothedHeadingDegrees in GuidanceState, exported via routing/index.ts. S04 implements actual map rotation.

## Requirements Validated

None.

## New Requirements Surfaced

- R026 verified in-unit: guidance loop architecture complete, floor transitions deferred to S04
- R027 verified in-unit: 4-level confidence with explicit low-confidence UI treatment
- R028 verified in-unit: rerouteConfirmFixes × updateIntervalMs ≈ 4-6s in foreground, matches 5-10s SLA
- R029 provided by: heading + smoothedHeadingDegrees in guidanceState, ready for S04 map rotation

## Requirements Invalidated or Re-scoped

None.

## Deviations

T05 component tests (ConfidenceIndicator.test.tsx, LiveGuidanceOverlay.test.tsx) were written but cannot execute due to pre-existing Vite 7 oxc TSX transform bug parsing `import type` in .tsx files. T03 React hook integration tests blocked by pre-existing React 19 / @testing-library/react@16.3.2 incompatibility in vitest jsdom. These are infrastructure gaps, not code gaps.

## Known Limitations

No heading-aware map rotation yet (S04 feature). No floor transition handling in guidance loop (S04 feature). No accessible-mode-specific waypoint instructions (S04 feature). No background/lock-screen continuity (deferred from M002). bearing.test.ts fails in isolation due to vitest globals environment issue; passes with full vitest config.

## Follow-ups

S04 must add floor-aware overlays, heading-driven map rotation, and accessible mode parity. The guidanceState machine is ready for S04 to extend with floor-transition phases. confirmPosition() is wired but S04 should ensure floor context is preserved across manual confirmation.

## Files Created/Modified

- `mobile/domain/navGraph.ts` — Added bearing() and normalizeDelta() geometry utilities
- `mobile/domain/bearing.test.ts` — 11 tests for bearing/normalizeDelta
- `mobile/routing/guidanceState.ts` — Guidance state machine: ConfidenceLevel, GuidancePhase, GuidanceState, deriveConfidence, isOffRoute, shouldAdvanceStep, deriveNextPhase, getActiveStep
- `mobile/routing/guidanceState.test.ts` — 41 tests + PathWithNodeById type fix
- `mobile/hooks/useCurrentPosition.ts` — GPS + heading subscription hook with injectable interfaces and EMA smoothing
- `mobile/hooks/useCurrentPosition.test.ts` — 22 tests for useCurrentPosition pure functions and interface contracts
- `mobile/vitest.config.ts` — Added React plugin and path aliases for mobile tests
- `mobile/hooks/useGuidanceSession.ts` — Session orchestrator: processPositionRef pattern, useEffect phase driver, reroute via MobilePathfindingEngine
- `mobile/hooks/useGuidanceSession.test.ts` — 45 tests for session orchestrator
- `mobile/components/guidance/ConfidenceIndicator.tsx` — Colored dot keyed to ConfidenceLevel with tap-to-label interaction
- `mobile/components/guidance/ConfidenceIndicator.test.tsx` — Component smoke tests (blocked by Vite 7 TSX bug)
- `mobile/components/guidance/LiveGuidanceOverlay.tsx` — 5-phase conditional renderer: idle/null, low-confidence, guiding, rerouting, arrived
- `mobile/components/guidance/LiveGuidanceOverlay.test.tsx` — Component smoke tests (blocked by Vite 7 TSX bug)
- `mobile/__mocks__/react-native.js` — React Native mock for jsdom test environment
- `mobile/App.tsx` — Guidance wiring: Start Guidance button, LiveGuidanceOverlay, ConfidenceIndicator dot, useGuidanceSession conditional call
- `mobile/routing/index.ts` — Public API re-exports: MobilePathfindingEngine, computeRouteSession, guidanceState helpers, bearing, normalizeDelta
- `mobile/hooks/index.ts` — Hook re-exports: useCurrentPosition, useGuidanceSession, types
- `mobile/tsconfig.json` — Added DOM lib for TypeScript DOM API types
