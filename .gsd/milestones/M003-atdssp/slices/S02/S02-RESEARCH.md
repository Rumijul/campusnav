# S02 Research: Bottom Sheet + Floating UI Chrome

## Summary

S02 builds the structural UI chrome layer — BottomSheet with 3 snap points, FloatingSearchBar pill, FloatingFloorSwitcher, DirectionStepCard, RouteSummaryStrip, StartGuidanceButton, and AccessibleToggle. All consume the theme system from S01. The core risk is gesture-handler + reanimated interaction correctness and ensuring GestureHandlerRootView wraps the app.

## Critical Implementation Findings

### 1. Reanimated is v3.19.5 (NOT v4 as the plan document says)

The installed version is `react-native-reanimated@^3.19.5`. The API surface for v3 and v4 is essentially the same for the features S02 needs:
- `useSharedValue`, `useAnimatedStyle`, `withSpring`, `withTiming`, `Easing` — all work identically
- `runOnJS` for calling React callbacks from worklets
- `Gesture.Pan()` from `react-native-gesture-handler` + `GestureDetector`
- `Animated.createAnimatedComponent` or direct `Animated.View` usage

**BottomSheet implementation approach:**
- Use `translateY` from bottom: sheet starts at `height` (fully off-screen/up), drags down toward 0 (fully open)
- Initial value: `snapPoints.half` (translateY = half height, leaving half-expanded as default)
- Gesture: pan delta added to current translateY, clamped between `snapPoints.full` (top) and `snapPoints.collapsed` (bottom)
- Velocity-based snap: `velocityY > 500` → snap to nearest; otherwise threshold-based midpoint comparison
- `runOnJS` to update a `snapPoint` state that drives the render children

### 2. GestureHandlerRootView Required in App.tsx

`GestureDetector` from `react-native-gesture-handler` requires a `GestureHandlerRootView` ancestor. This must be added in S04 (App.tsx integration), but it's a dependency for all gesture-based components. Should be noted in the S02 plan so S04 knows to add it.

### 3. Reanimated v3 + SVG Animated Props

For RoutePathOverlay (S03), if using animated SVG `strokeDashoffset`, note that `react-native-svg@15.x` provides `AnimatedSvg` / `AnimatedPath` from `react-native-reanimated` integration. The v3 approach uses `useAnimatedProps` on an `AnimatedPath` — this is well-established in v3.

### 4. DirectionStepCard Type Imports

`DirectionStep`, `DirectionsResult`, `DirectionSection` are exported from `mobile/domain/navGraph.ts`. These are the types to use for DirectionStepCard props.

`FloorPlanTarget` is exported from `mobile/data/mapApiClient.ts` for FloatingFloorSwitcher.

## Existing Components to Consume

| Component | Location | Notes |
|---|---|---|
| `useTheme()` | `mobile/theme/index.ts` | Returns `{ colors, spacing, typography, isDark }` |
| `DirectionStep`, `DirectionsResult`, `DirectionSection` | `mobile/domain/navGraph.ts` | For DirectionStepCard props |
| `FloorPlanTarget` | `mobile/data/mapApiClient.ts` | For FloatingFloorSwitcher |
| Existing `ConfidenceIndicator` | `mobile/components/guidance/ConfidenceIndicator.tsx` | Will be enhanced in S03 |

## Theme Tokens Available (from S01)

**darkColors**: `background: '#020617'`, `surface: '#0f172a'`, `surfaceElevated: '#1e293b'`, `accent: '#38bdf8'`, `textPrimary: '#f8fafc'`, `textSecondary: '#e2e8f0'`, `textMuted: '#94a3b8'`, `border: '#1e293b'`, `borderMuted: '#334155'`, `success: '#22c55e'`, `warning: '#eab308'`, `error: '#ef4444'`, `chipActive: '#1e3a5f'`, `routeLine: '#38bdf8'`, etc.

**lightColors**: `background: '#f8fafc'`, `surface: '#ffffff'`, `surfaceElevated: '#f1f5f9'`, `accent: '#0284c7'`, etc.

**spacing**: `xs: 4`, `sm: 8`, `md: 12`, `lg: 16`, `xl: 24`, `2xl: 32`, `3xl: 48`, `4xl: 64`

**typography**: `title`, `sectionHeader`, `body`, `bodyBold`, `caption`, `captionBold`, `label`, `chip` (all `TextStyle` objects)

## Component Architecture

### BottomSheet
- `mobile/components/sheet/BottomSheet.tsx`
- `mobile/components/sheet/BottomSheetHandle.tsx` (handle bar, separate for testability)
- Props: `{ snapPoints: { collapsed: number, half: number, full: number }, defaultSnapPoint?, children: ({ snapPoint }) => ReactNode }`
- Uses `GestureDetector` + `Gesture.Pan()` + `useSharedValue` + `useAnimatedStyle`
- `runOnJS` updates a `useState` `snapPoint` value for render children
- Sheet uses `position: absolute; bottom: 0; left: 0; right: 0` + animated `translateY`
- Handle bar: 36×4 rounded rect, centered, themed border color
- Background: `theme.colors.surface`, top corners 16px radius, shadow
- **Important**: clamps translateY between `snapPoints.full` (top = max height) and `snapPoints.collapsed` (bottom = min height)

### FloatingSearchBar
- `mobile/components/search/FloatingSearchBar.tsx`
- Props: `{ originValue, destinationValue, onOriginChange, onDestinationChange, onSwap, onFocus? }`
- Pill shape: `borderRadius: 9999`, semi-transparent surface color + blur (optional)
- Two TextInputs + swap Pressable in a row
- Positioned absolutely at top in S04 App.tsx integration
- Blur via `@react-native-community/blur` optional — solid semi-transparent fallback if blur fails on Android

### FloatingFloorSwitcher
- `mobile/components/floor/FloatingFloorSwitcher.tsx`
- Props: `{ targets: FloorPlanTarget[], activeTarget: FloorPlanTarget | null, onSelect }`
- Horizontal row of floor number pills
- Highlights active pill with `theme.colors.accent`
- Returns null if `targets.length <= 1`
- Positioned absolutely on map in S04

### DirectionStepCard
- `mobile/components/route/DirectionStepCard.tsx`
- Props: `{ step: DirectionStep, accessibleMode: boolean, state: 'current' | 'upcoming' | 'completed' }`
- Left accent bar (3px wide, themed color based on state)
- Icon box (36×36, rounded, icon background tinted)
- Instruction text + distance/duration meta
- `useAnimatedStyle` for opacity and scale on state change (150ms)
- State → accent color: completed → `textMuted`, current → `accent`, upcoming → `accent`
- Step icon map: straight ↑, turn-left ←, turn-right →, arrive 🏁, stairs-up ⬆, stairs-down ⬇, elevator 🛗, ramp ♿

### RouteSummaryStrip
- `mobile/components/route/RouteSummaryStrip.tsx`
- Props: `{ floorNumber, buildingId, totalMinutes, totalMeters, isGuidanceActive? }`
- Horizontal row: floor badge pill + "~X min" + distance + optional "● Guiding" badge
- Used in BottomSheet collapsed state
- All colors from theme

### StartGuidanceButton
- `mobile/components/guidance/StartGuidanceButton.tsx`
- Props: `{ onPress: () => void, disabled?: boolean }`
- Full-width primary button
- `Animated.createAnimatedComponent(Pressable)` + `useSharedValue(1)` for scale
- `onPressIn`: `scale.value = withTiming(0.95, { duration: 100 })`
- `onPressOut`: `scale.value = withTiming(1, { duration: 100 })`
- Disabled: uses `textMuted` background
- Label: "Start Guidance"

### AccessibleToggle
- `mobile/components/settings/AccessibleToggle.tsx`
- Props: `{ value: boolean, onValueChange: (v: boolean) => void }`
- iOS-style: 51×31 track, 27px thumb, rounded track
- `useSharedValue(0)` → animated to 1 when `value` is true
- `interpolateColor` for track color (border → accent)
- Thumb translateX animated via `useAnimatedStyle`
- `withSpring({ damping: 15, stiffness: 200 })` for thumb movement
- Pressable wraps both, calls `onValueChange(!value)`

## Verification Approach

- **Typecheck**: `cd mobile && npx tsc --noEmit` — all new files must type cleanly
- **Existing tests**: `cd mobile && npm test` — must remain at 508 pass (no regressions)
- **Build verification**: Not runnable in worktree environment (PostgreSQL required for full build)
- **Note**: Component rendering tests will likely fail due to pre-existing React 19 / Vitest jsdom incompatibility (known from S01). Typecheck is the primary verification surface in worktree environments.

## Key Decisions to Record

- **Sheet translateY direction**: translateY represents pixel offset from rest position (0 = at rest). Bottom sheet starts at `snapPoints.collapsed` (moved up by its height), drag adds to translateY. Clamp between `snapPoints.full` (max open) and `snapPoints.collapsed` (fully collapsed). Snap targets are pixel heights from bottom.
- **DirectionStepCard is S02** per plan despite being route-oriented — it lives in `mobile/components/route/`
- **DirectionStepCard animation**: `withTiming` opacity/scale, not `withSpring` — scale and opacity are non-interactive, just visual feedback
- **No manual theme toggle**: useColorScheme() only, as established in S01

## Implementation Order

1. BottomSheet (foundation — other components don't depend on it but it establishes the pattern)
2. FloatingSearchBar (simple, self-contained)
3. AccessibleToggle (simple, self-contained)
4. RouteSummaryStrip (depends on theme only)
5. DirectionStepCard (depends on DirectionStep type from navGraph)
6. StartGuidanceButton (depends on theme only)
7. FloatingFloorSwitcher (depends on FloorPlanTarget type)
8. Verify all typecheck + existing tests pass
