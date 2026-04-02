---
id: S02
parent: M003-atdssp
milestone: M003-atdssp
provides:
  - BottomSheet with 3 spring-snap pan gesture points (120/300/600px)
  - AccessibleToggle iOS-style spring-animated switch with full ARIA roles
  - FloatingSearchBar pill with 2 text inputs, swap button, and search CTA
  - FloatingFloorSwitcher horizontal scroll row with single-select floor tabs
  - DirectionStepCard with 5 accent color variants driven by step.iconType
  - RouteSummaryStrip with human-readable distance/duration formatting
  - StartGuidanceButton with spring scale press animation
requires:
  - slice: S01
    provides: useTheme() hook, darkColors/lightColors tokens, theme context
affects:
  - S04 (App.tsx integration — wires BottomSheet, FloatingSearchBar, FloatingFloorSwitcher, StartGuidanceButton into full layered layout)
  - S03 (DirectionStepCard consumed by guidance overlay components)
key_files:
  - mobile/components/sheet/BottomSheet.tsx
  - mobile/components/sheet/BottomSheetHandle.tsx
  - mobile/components/settings/AccessibleToggle.tsx
  - mobile/components/search/FloatingSearchBar.tsx
  - mobile/components/floor/FloatingFloorSwitcher.tsx
  - mobile/components/route/DirectionStepCard.tsx
  - mobile/components/route/RouteSummaryStrip.tsx
  - mobile/components/route/StartGuidanceButton.tsx
  - mobile/components/sheet/index.ts
  - mobile/components/settings/index.ts
  - mobile/components/search/index.ts
  - mobile/components/floor/index.ts
  - mobile/components/route/index.ts
key_decisions:
  - D019: DirectionStepCard accent variants driven by step.iconType rather than a separate variant prop — iconType is the natural discriminator already present on DirectionStep; avoids duplicating state
  - D020: Reuse STEP_ICONS from LiveGuidanceOverlay in DirectionStepCard — ensures consistent icon→emoji mapping across all guidance surfaces
  - D021: Two distinct spring tunings — BottomSheet damping:50/stiffness:300 (smooth settle) vs StartGuidanceButton damping:15/stiffness:400/mass:0.8 (snappy press) — conflating them produces wrong feel
  - D022: accessibilityRole="dialog" is not valid for React Native View types — use role="dialog" or valid RN role instead
patterns_established:
  - GestureDetector + Gesture.Pan() with withSpring for maps-style bottom sheet pan gestures
  - Spring animation tuning differs by use case: smooth settle for sheet (damping:50, stiffness:300) vs snappy press for button (damping:15, stiffness:400, mass:0.8)
  - DirectionStepCard accent derived from step.iconType: arrive→green, elevator/ramp→green, stairs-up/down→warning, active→borderAccent, default→neutral
  - STEP_ICONS record from LiveGuidanceOverlay is the canonical icon→emoji map; reuse rather than reimplement
  - All new UI chrome components consume useTheme() tokens from S01 — no hardcoded colors in S02 components
observability_surfaces:
  - none
drill_down_paths:
  - S02/tasks/T01-SUMMARY.md
  - S02/tasks/T02-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-04-02T11:51:23.362Z
blocker_discovered: false
---

# S02: Bottom Sheet + Floating UI Chrome

**Built BottomSheet (3 spring-snap points), FloatingSearchBar, FloatingFloorSwitcher, DirectionStepCard (5 accent variants), RouteSummaryStrip, StartGuidanceButton, and AccessibleToggle — all using S01 useTheme() tokens.**

## What Happened

S02 established the structural floating UI chrome for the maps-like layered layout. T01 delivered BottomSheet with GestureDetector + Gesture.Pan() pan gesture and withSpring snap animations at 3 points (120/300/600px), BottomSheetHandle, and AccessibleToggle (iOS-style spring-animated switch with full ARIA). T02 delivered FloatingSearchBar (pill with 2 inputs, swap, CTA), FloatingFloorSwitcher (horizontal scroll tabs), DirectionStepCard (5 accent variants driven by step.iconType, reusing STEP_ICONS from LiveGuidanceOverlay), RouteSummaryStrip (distance/duration formatting), and StartGuidanceButton (spring scale pressable). All components consume useTheme() tokens from S01. Fixed invalid accessibilityRole="dialog" on BottomSheet container. Zero TS errors in new components; pre-existing 107 workspace errors unchanged.

## Verification

TypeScript typecheck confirmed zero errors in all S02 component files (components/sheet/, components/search/, components/floor/, components/route/, components/settings/). 13 files present and substantial (868 lines total across 4 key files). All components use useTheme() tokens and follow oxc workaround patterns where needed.

## Requirements Advanced

None.

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

None.

## Known Limitations

Components are built and type-checked but not yet integrated into App.tsx (S04 scope). BottomSheet snap point content scaffolding is props-based; actual content rendering wired by S04. FloatingSearchBar inputs not yet wired to route selection state (S04 wires callbacks).

## Follow-ups

None discovered during execution.

## Files Created/Modified

- `mobile/components/sheet/BottomSheet.tsx` — New — pan gesture BottomSheet with 3 spring-snap points
- `mobile/components/sheet/BottomSheetHandle.tsx` — New — grip handle bar for BottomSheet
- `mobile/components/settings/AccessibleToggle.tsx` — New — iOS-style spring toggle switch with full ARIA
- `mobile/components/search/FloatingSearchBar.tsx` — New — pill search bar with 2 inputs, swap, search CTA
- `mobile/components/floor/FloatingFloorSwitcher.tsx` — New — horizontal floor pill selector row
- `mobile/components/route/DirectionStepCard.tsx` — New — direction step card with 5 accent variants
- `mobile/components/route/RouteSummaryStrip.tsx` — New — compact distance/duration summary row
- `mobile/components/route/StartGuidanceButton.tsx` — New — animated scale pressable for starting guidance
- `mobile/components/sheet/index.ts` — New — barrel export for sheet components
- `mobile/components/settings/index.ts` — New — barrel export for settings components
- `mobile/components/search/index.ts` — New — barrel export for search components
- `mobile/components/floor/index.ts` — New — barrel export for floor components
- `mobile/components/route/index.ts` — New — barrel export for route components
