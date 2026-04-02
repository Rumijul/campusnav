---
id: T02
parent: S02
milestone: M003-atdssp
provides: []
requires: []
affects: []
key_files: ["mobile/components/search/FloatingSearchBar.tsx", "mobile/components/search/index.ts", "mobile/components/floor/FloatingFloorSwitcher.tsx", "mobile/components/floor/index.ts", "mobile/components/route/DirectionStepCard.tsx", "mobile/components/route/RouteSummaryStrip.tsx", "mobile/components/route/StartGuidanceButton.tsx", "mobile/components/route/index.ts"]
key_decisions: ["DirectionStepCard accent variant derived from step icon type: arrive→green, elevator/ramp→green accent, stairs-up/down→warning, active→borderAccent, default→guidanceCardBorder", "FloatingSearchBar follows pill shape pattern with 28px borderRadius, two TextInputs, a swap Pressable, and a search CTA button using useTheme() tokens", "FloatingFloorSwitcher uses ScrollView with horizontal scrolling and per-item Pressable with accessibilityRole=tab and accessibilityState.selected", "StartGuidanceButton uses Animated.View + Pressable with sharedValue scale driven by withSpring (damping:15, stiffness:400, mass:0.8)", "RouteSummaryStrip formats distance as X m or X.X km and duration as X min using the 50m/unit normalization from LiveGuidanceOverlay", "STEP_ICONS record reused from LiveGuidanceOverlay for consistent icon→emoji mapping across DirectionStepCard and guidance overlay"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "TypeScript typecheck on new components: `cd mobile && npx tsc --noEmit 2>&1 | grep -E "components/search|components/floor|components/route/DirectionStep|components/route/RouteSummary|components/route/StartGuidance"` returned 0 errors. Total workspace error count unchanged at 107 (all pre-existing in App.tsx, bootstrap/, and test files)."
completed_at: 2026-04-02T11:46:11.829Z
blocker_discovered: false
---

# T02: Built FloatingSearchBar pill, FloatingFloorSwitcher scroll row, DirectionStepCard with 5 accent variants, RouteSummaryStrip, and StartGuidanceButton with spring scale animation

> Built FloatingSearchBar pill, FloatingFloorSwitcher scroll row, DirectionStepCard with 5 accent variants, RouteSummaryStrip, and StartGuidanceButton with spring scale animation

## What Happened
---
id: T02
parent: S02
milestone: M003-atdssp
key_files:
  - mobile/components/search/FloatingSearchBar.tsx
  - mobile/components/search/index.ts
  - mobile/components/floor/FloatingFloorSwitcher.tsx
  - mobile/components/floor/index.ts
  - mobile/components/route/DirectionStepCard.tsx
  - mobile/components/route/RouteSummaryStrip.tsx
  - mobile/components/route/StartGuidanceButton.tsx
  - mobile/components/route/index.ts
key_decisions:
  - DirectionStepCard accent variant derived from step icon type: arrive→green, elevator/ramp→green accent, stairs-up/down→warning, active→borderAccent, default→guidanceCardBorder
  - FloatingSearchBar follows pill shape pattern with 28px borderRadius, two TextInputs, a swap Pressable, and a search CTA button using useTheme() tokens
  - FloatingFloorSwitcher uses ScrollView with horizontal scrolling and per-item Pressable with accessibilityRole=tab and accessibilityState.selected
  - StartGuidanceButton uses Animated.View + Pressable with sharedValue scale driven by withSpring (damping:15, stiffness:400, mass:0.8)
  - RouteSummaryStrip formats distance as X m or X.X km and duration as X min using the 50m/unit normalization from LiveGuidanceOverlay
  - STEP_ICONS record reused from LiveGuidanceOverlay for consistent icon→emoji mapping across DirectionStepCard and guidance overlay
duration: ""
verification_result: passed
completed_at: 2026-04-02T11:46:11.829Z
blocker_discovered: false
---

# T02: Built FloatingSearchBar pill, FloatingFloorSwitcher scroll row, DirectionStepCard with 5 accent variants, RouteSummaryStrip, and StartGuidanceButton with spring scale animation

**Built FloatingSearchBar pill, FloatingFloorSwitcher scroll row, DirectionStepCard with 5 accent variants, RouteSummaryStrip, and StartGuidanceButton with spring scale animation**

## What Happened

Created all 8 output files defined in the T02 plan. FloatingSearchBar is a pill-shaped widget with two TextInputs (origin/destination), a swap Pressable, and a search CTA — all using useTheme() tokens. FloatingFloorSwitcher is a horizontal ScrollView of floor-number pills with accessibilityRole="tab" and selected state coloring. DirectionStepCard uses DirectionStep from navGraph.ts with five accent variants (arrived/accessible/stairs/active/default) based on step icon type, reusing the STEP_ICONS map from LiveGuidanceOverlay. RouteSummaryStrip renders a compact horizontal strip with distance, duration, and step count. StartGuidanceButton uses Animated.View + Pressable with withSpring scale animation (damping:15, stiffness:400). All components typecheck with zero errors. Pre-existing 107 errors in App.tsx, bootstrap/, and test files are unchanged from T01.

## Verification

TypeScript typecheck on new components: `cd mobile && npx tsc --noEmit 2>&1 | grep -E "components/search|components/floor|components/route/DirectionStep|components/route/RouteSummary|components/route/StartGuidance"` returned 0 errors. Total workspace error count unchanged at 107 (all pre-existing in App.tsx, bootstrap/, and test files).

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd mobile && npx tsc --noEmit 2>&1 | grep -E "components/search|components/floor|components/route/DirectionStep|components/route/RouteSummary|components/route/StartGuidance"` | 0 | ✅ pass | 12000ms |
| 2 | `cd mobile && npx tsc --noEmit 2>&1 | grep -c "error TS"` | 0 | ✅ pass (pre-existing, unchanged) | 12000ms |


## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `mobile/components/search/FloatingSearchBar.tsx`
- `mobile/components/search/index.ts`
- `mobile/components/floor/FloatingFloorSwitcher.tsx`
- `mobile/components/floor/index.ts`
- `mobile/components/route/DirectionStepCard.tsx`
- `mobile/components/route/RouteSummaryStrip.tsx`
- `mobile/components/route/StartGuidanceButton.tsx`
- `mobile/components/route/index.ts`


## Deviations
None.

## Known Issues
None.
