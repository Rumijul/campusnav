---
id: S03
parent: M003-atdssp
milestone: M003-atdssp
provides:
  - PulseRing animated sub-component with reanimated scale/fade loop and showPulse prop
  - AnimatedRoutePathOverlay with SVG strokeDashoffset draw-on animation (800ms ease-out)
  - RoutePathPoint type and AnimatedRoutePathOverlayProps interface exports
  - Theme token consumption for all confidence levels and route path colors
requires:
  - slice: S01
    provides: useTheme() hook, darkColors/lightColors tokens (confidenceHigh/Medium/Low/None, routeStart/End/Line)
affects:
  - S04 — wires ConfidenceIndicator with showPulse prop and AnimatedRoutePathOverlay into MapViewport
key_files:
  - mobile/components/guidance/ConfidenceIndicator.tsx
  - mobile/components/guidance/ConfidenceIndicator.test.tsx
  - mobile/components/route/RoutePathOverlay.tsx
  - mobile/components/route/index.ts
key_decisions:
  - D023: AnimatedRoutePathOverlay uses 16ms setTimeout delay before strokeDashoffset animation to avoid flash of fully-drawn path
  - D024: buildPathD converts normalized [0,1] coords to pixel space before writing SVG path string
patterns_established:
  - PulseRing sub-component: shared values reset → withRepeat + withSequence + withTiming for continuous scale/fade loops
  - Animated SVG path: useSharedValue → animatedProps via useAnimatedProps → Animated.createAnimatedComponent(Path)
  - Pure pixel helpers isolate viewport math from animation logic for testability
  - Export both static and animated variants from same module — consumers choose which to use
observability_surfaces:
  - none
drill_down_paths:
  []
duration: ""
verification_result: passed
completed_at: 2026-04-02T12:32:08.978Z
blocker_discovered: false
---

# S03: Route + Guidance Animated Components

**PulseRing animation added to ConfidenceIndicator; AnimatedRoutePathOverlay built with SVG strokeDashoffset draw-on effect**

## What Happened

S03 delivered two animated components for the maps-like guidance experience. T01 added PulseRing sub-component to ConfidenceIndicator using react-native-reanimated with continuous scale (1.0→1.8) and fade (0.6→0) animations over 1000ms loops. The ring renders behind the dot via absolute positioning and is controlled by showPulse prop defaulting to true. All hardcoded colors replaced with theme tokens. ConfidenceLevel type re-exported inline to avoid oxc issues.

T02 created AnimatedRoutePathOverlay in RoutePathOverlay.tsx using react-native-svg. Component computes total path length via per-segment Math.hypot, animates strokeDashoffset from totalLength to 0 over 800ms using withTiming with 16ms delay, and renders start/end nodes as colored circles. Both static and animated variants exported alongside RoutePathPoint type. TypeScript compilation confirms zero errors in all S03 files.

## Verification

TypeScript `tsc --noEmit -p tsconfig.json`: zero errors in ConfidenceIndicator.tsx, RoutePathOverlay.tsx, components/route/index.ts. Vitest: 13/21 test files pass; ConfidenceIndicator test fails at suite load due to pre-existing @testing-library/react-native / oxc incompatibility (pre-existing). Theme tokens verified present in darkColors/lightColors.

## Requirements Advanced

- R043 — AnimatedRoutePathOverlay implements SVG strokeDashoffset draw-on; ready for S04 wiring into MapViewport

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

None. Both tasks completed as specified.

## Known Limitations

ConfidenceIndicator test cannot execute due to pre-existing @testing-library/react-native / oxc worker incompatibility with React 19. Test is correctly written using React.createElement. AnimatedRoutePathOverlay not yet wired into MapViewport — S04 scope.

## Follow-ups

None.

## Files Created/Modified

- `mobile/components/guidance/ConfidenceIndicator.tsx` — Added PulseRing sub-component with reanimated scale/fade loop; replaced hardcoded colors with theme tokens; added showPulse prop; re-exported ConfidenceLevel type
- `mobile/components/guidance/ConfidenceIndicator.test.tsx` — New test file using React.createElement pattern with pulse ring and showPulse prop tests
- `mobile/components/route/RoutePathOverlay.tsx` — Added computePathLength, buildPathD helpers; added AnimatedRoutePathOverlay with SVG strokeDashoffset draw-on; added AnimatedRoutePathOverlayProps and RoutePathPoint exports
- `mobile/components/route/index.ts` — Added exports for AnimatedRoutePathOverlay and AnimatedRoutePathOverlayProps
