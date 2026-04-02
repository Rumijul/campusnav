---
sliceId: S02
uatType: artifact-driven
verdict: PASS
date: 2026-04-02T10:18:00.000Z
---

# UAT Result — S02

## Checks

| Check | Mode | Result | Notes |
|-------|------|--------|-------|
| TC-1: BottomSheet exports DEFAULT_SNAP_POINTS = [120, 300, 600] | artifact | PASS | Line 54: `export const DEFAULT_SNAP_POINTS: [number, number, number] = [120, 300, 600]`; SnapIndex type defined as `0 \| 1 \| 2`; snapToOffset function computes screen positions |
| TC-2: BottomSheet pan gesture — GestureDetector + Gesture.Pan() with withSpring | artifact | PASS | GestureDetector wraps Animated.View (line 137); Gesture.Pan() chained with .onStart/.onUpdate/.onEnd (line 109+); withSpring on line 122 |
| TC-3: BottomSheetHandle accessibilityRole="adjustable" and useTheme() | artifact | PASS | accessibilityRole="adjustable" present; `const { colors } = useTheme()` on line 23; colors.borderMuted and colors.textMuted used |
| TC-4: AccessibleToggle spring config (damping:20, stiffness:400, mass:0.6) | artifact | PASS | SPRING_CONFIG defined (lines 40-43); knobX useSharedValue animated between 0 and KNOB_TRAVEL with withSpring |
| TC-5: AccessibleToggle full ARIA (role=switch, accessibilityState, label, hint) | artifact | PASS | accessibilityRole="switch", accessibilityState={{ checked, disabled }}, accessibilityLabel, accessibilityHint all present (lines 78-81) |
| TC-6: FloatingSearchBar pill with two TextInputs (origin + destination) | artifact | PASS | Two TextInput fields: "My location" placeholder (origin, line 127) and "Where to?" placeholder (destination, line 169); both have accessibilityLabel and placeholderTextColor |
| TC-7: FloatingSearchBar swap button with ⇅ icon and onSwap callback | artifact | PASS | Swap Pressable with testID="search-swap-btn" (line 146); onSwap prop (line 48); ⇅ icon (line 155); disabled guard via handleSwap (line 82) |
| TC-8: FloatingFloorSwitcher ScrollView with horizontal tabs, accessibilityRole="tablist" | artifact | PASS | ScrollView with horizontal + showsHorizontalScrollIndicator:false (line 67-68); accessibilityRole="tablist" on container (line 64); each pill has accessibilityRole="tab" with accessibilityState.selected (line 77) |
| TC-9: DirectionStepCard 5 accent variants driven by step.iconType | artifact | PASS | accentVariant type = 'default' \| 'active' \| 'accessible' \| 'stairs' \| 'arrived' (line 81); function body maps: arrive→arrived, isActive→active, elevator/ramp→accessible, stairs-up/down→stairs, else→default (lines 84-88) |
| TC-10: DirectionStepCard STEP_ICONS record with all icon types | artifact | PASS | STEP_ICONS record has: straight, turn-left, turn-right, sharp-left, sharp-right, arrive, accessible, stairs-up, stairs-down, elevator, ramp; stepIconEmoji uses STEP_ICONS[icon] ?? '→' |
| TC-11: RouteSummaryStrip formatDistance and formatDuration functions | artifact | PASS | formatDistance: <1m / meters / km (line 40+); formatDuration: seconds / min+sec (line 48+); both used in render (lines 66-67); stepLabel handles plural "1 step" vs "N steps" |
| TC-12: StartGuidanceButton spring scale animation (damping:15, stiffness:400, mass:0.8, scale:0.93) | artifact | PASS | SPRING_CONFIG (lines 36-38): damping:15, stiffness:400, mass:0.8; PRESSED_SCALE=0.93 (line 42); withSpring(PRESSED_SCALE) on pressIn, withSpring(1) on pressOut (lines 58-62) |
| TC-13: All 8 S02 components consume useTheme() tokens | artifact | PASS | All 8 files import useTheme from '../../theme'; 24 unique color tokens used across all components; all verified present in S01 theme/colors.ts (darkColors + lightColors) |
| TC-14: DirectionStepCard handles optional DirectionStep fields | artifact | PASS | step.floorNumber (required, confirmed in navGraph.ts line 52/72/86); step.instruction, step.distanceM, step.durationSec used directly; step.isAccessibleSegment guarded with `&&` conditional (line 203) |
| TC-15: FloatingFloorSwitcher returns null for empty floor list | artifact | PASS | Lines 48-49: `if (!floors \|\| floors.length === 0) { return null; }` |
| TC-16: BottomSheet intermediate-position spring behavior | artifact | PASS | findNearestSnap() (lines 92-105) computes nearest snap to currentY; onEnd calls withSpring(snapToOffset(nearest)) (line 122); damping:50/stiffness:300 for smooth settle |
| TC-17: AccessibleToggle disabled prop guards onPress and onValueChange | artifact | PASS | Line 76: `onPress={disabled ? undefined : handleToggle}`; line 65: onValueChange called only inside handleToggle; disabled also reduces track opacity to 0.4 |
| TC-18: DirectionStepCard optional onPress — conditionally uses Pressable vs View | artifact | PASS | Line 32: `onPress?: () => void`; line 157: `const CardWrapper = onPress ? Pressable : View`; pressed style guarded with `pressed && onPress && styles.cardPressed` (line 172) |
| TC-19: TypeScript — zero errors in all S02 component directories | artifact | PASS | `npx tsc --noEmit` returns no errors for components/sheet/, components/settings/, components/search/, components/floor/, components/route/ (pre-existing errors only in routing/ and vitest.config.ts and server/) |
| TC-20: Mobile test suite — 521 tests pass (pre-existing failures unchanged) | artifact | PASS | `npm test -- --run`: 48 passed files, 1 failed test (pre-existing mapApiClient assertion), 8 failed files (pre-existing oxc/React 19 issues); 521 tests pass; S02 component files have no test files (components built, integration via S04) |

## Overall Verdict

PASS — All 20 artifact-driven checks pass. All 8 S02 components are present, type-correct, consume useTheme() tokens from S01, and implement their specified behavior. 521 mobile tests pass; pre-existing test failures are unchanged.

## Notes

- No runtime/live checks possible in artifact-driven mode; all checks are code-inspection and typecheck.
- Pre-existing TypeScript errors (routing/RouteMode, vitest.config.ts ts option, server/ NavNodeType) are unchanged and outside S02 scope.
- Pre-existing test failures (oxc typeof parser error in 2 guidance component tests, 1 mapApiClient assertion) are unchanged.
- 4 edge cases referenced in UAT intro (missing optional fields, single-floor switcher, empty onPress, intermediate-position spring) all verified in code.
- DirectionStepCard uses colors.guidanceCardBorder, colors.guidanceStepIcon, colors.guidanceFloorBadge, colors.guidanceCard — all 4 guidance* tokens confirmed present in S01 darkColors/lightColors.
