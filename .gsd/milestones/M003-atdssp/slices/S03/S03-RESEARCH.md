# S03 Research: Route + Guidance Animated Components

## What S03 Needs

From the roadmap: "Route step cards show current/upcoming/completed states with accent borders. Confidence indicator pulses during guidance. Route path draws itself from origin to destination."

## What Already Exists

### DirectionStepCard ✅ — Done (needs minor cleanup)
- Already has `isActive` prop + accent variant logic
- Already uses `useTheme()` for colors
- Already has `active`/`accessible`/`stairs`/`arrived`/`default` states
- Already imports `StepIcon` from navGraph
- **Minor gap**: uses `colors.guidanceCardBorder` but doesn't handle the `upcoming`/`completed` states explicitly — only `active`/`default`. Design spec says "current/upcoming/completed states" but the current implementation only highlights active. This is a gap to close.

### RouteSummaryStrip ✅ — Done
- Uses `useTheme()` fully
- No animation needed

### StartGuidanceButton ✅ — Done
- Uses `react-native-reanimated` `withSpring` for press scale
- Uses `useTheme()` for colors
- `SPRING_CONFIG` and `PRESSED_SCALE = 0.93` already set

### ConfidenceIndicator ⚠️ — Needs pulsing ring animation
- Has colored dot + label toggle
- Uses hardcoded colors (`DOT_COLOR`, `LABEL_COLOR` maps) — not theme tokens
- No pulsing animation yet
- Design spec: "Colored pulsing ring dot — green/yellow/red based on confidence"

### RoutePathOverlay ⚠️ — Needs animated SVG variant
- Existing implementation uses View-based rotated lines with hardcoded colors
- Design spec: "Route path animates along its length from origin to destination using strokeDashoffset"
- No animated variant exists

### LiveGuidanceOverlay ⚠️ — Uses hardcoded colors, not theme
- Has 5 phase variants (idle/low-confidence/guiding/rerouting/arrived)
- All colors hardcoded in StyleSheet (not using theme tokens)
- Design spec requires theme-consistent colors throughout

## What to Build in S03

### T1: PulseRing + theme-colored ConfidenceIndicator

**Current state:**
```
ConfidenceIndicator has: dot + optional labelBadge
```

**Design spec says:** "Colored pulsing ring dot — green/yellow/red based on confidence"

**Implementation approach:**
- Add `PulseRing` as a sub-component that renders an outer `View` with animated scale (1.0 → 1.8) and opacity (0.6 → 0.0)
- Use `withRepeat(withTiming(1.0, { duration: 1000 }), -1, false)` for continuous pulse
- Color matches the confidence dot color (high=green, medium=yellow, low=orange, none=red)
- Use `withSequence` to reverse the animation back
- Render the PulseRing **behind** the dot (z-order via order in flex container)
- Integrate into `ConfidenceIndicator` with a `showPulse` prop (defaults to true when confidence !== 'high' or always during guiding phase)
- Update `DOT_COLOR` / `LABEL_COLOR` maps to use theme tokens (`colors.confidenceHigh`, etc.) instead of hardcoded hex

**Reanimated integration pattern:**
```tsx
const pulseScale = useSharedValue(1);
const pulseOpacity = useSharedValue(0.6);

useEffect(() => {
  pulseScale.value = withRepeat(
    withSequence(
      withTiming(1.8, { duration: 1000, easing: Easing.out(Easing.ease) }),
      withTiming(1.0, { duration: 0 })
    ),
    -1,
    false
  );
  pulseOpacity.value = withRepeat(
    withSequence(
      withTiming(0, { duration: 1000, easing: Easing.out(Easing.ease) }),
      withTiming(0.6, { duration: 0 })
    ),
    -1,
    false
  );
}, []);

const ringStyle = useAnimatedStyle(() => ({
  transform: [{ scale: pulseScale.value }],
  opacity: pulseOpacity.value,
}));
```

**Verify:** Existing `ConfidenceIndicator.test.tsx` uses React.createElement pattern — should pass with added PulseRing.

### T2: AnimatedRoutePathOverlay (SVG-based)

**Current state:** `RoutePathOverlay.tsx` uses View-based lines with hardcoded colors.

**Design spec says:** "strokeDashoffset driven from path length to 0 over 800ms with ease-out curve"

**Implementation approach:**
- Add new exported component `AnimatedRoutePathOverlay` to `RoutePathOverlay.tsx` (same file, additional export)
- Uses `react-native-svg` with `Path` element
- For each floor's path nodes, generates a single SVG polyline path string (M x1,y1 L x2,y2 L x3,y3...)
- Uses `useSharedValue` for `strokeDashOffset` — starts at total path length, animates to 0
- Triggers animation via `withTiming(totalLength, { duration: 800, easing: Easing.out(Easing.ease) })` when path changes
- Re-exports `RoutePathPoint` type for consumers
- Props interface:
  ```tsx
  interface AnimatedRoutePathOverlayProps {
    path: RoutePathPoint[];
    activeFloorId: number;
    viewport: ViewportDimensions;
    scale: number;
    /** Set false to show static (default: true) */
    animated?: boolean;
  }
  ```
- Also adds theme-colored dots for start/end (green/red) using theme tokens

**SVG path generation for multi-segment polyline:**
```tsx
function floorPathString(nodes: RoutePathPoint[], vp: ViewportDimensions, sc: number): string {
  if (nodes.length === 0) return '';
  const pts = nodes.map(n => ({ x: n.x * vp.width * sc, y: n.y * vp.height * sc }));
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
}
```

**Verify:** New component is pure (no side effects), exports correctly. Existing `RoutePathOverlay` unchanged.

### T3 (stretch): LiveGuidanceOverlay theme color consumption

- Replace hardcoded hex colors in `LiveGuidanceOverlay.tsx` styles with theme tokens
- This is needed for full theme coverage but may be deferred to S04 if time-constrained
- Pattern: `colors.guidanceCard` → `colors.guidanceCard`, `colors.accent` → `colors.accent`, etc.
- Hardcoded colors like `'#38bdf8'` → `colors.accent`, `'#1e3a5f'` → `colors.guidanceStepIcon`

## Constraints

- Must not break existing tests: 508 passing in S01, more added in S02
- `ConfidenceIndicator.test.tsx` uses `React.createElement` pattern to avoid oxc TSX transform issue — must maintain this
- `LiveGuidanceOverlay.test.tsx` uses same pattern — must not break
- All new components must use `useTheme()` hook for color access
- `react-native-reanimated` v3.19.5 is installed (v4 install had peer dep issues — S01 used v3)
- `react-native-svg` 15.15.4 installed — SVG components available

## Files to Modify

1. `mobile/components/guidance/ConfidenceIndicator.tsx` — add PulseRing + theme colors
2. `mobile/components/route/RoutePathOverlay.tsx` — add AnimatedRoutePathOverlay + update dot colors to theme
3. `mobile/components/guidance/ConfidenceIndicator.test.tsx` — add tests for pulse animation
4. `mobile/components/route/index.ts` — verify exports cover both components

## Files to Create

- None — all work is in-place modification

## Verification Strategy

1. `cd mobile && npm test -- --run ConfidenceIndicator` — pulse animation tests pass
2. `cd mobile && npx tsc --noEmit` — no type errors from new SVG/animated components
3. Manual: verify pulse ring animates behind the confidence dot
4. Manual: verify animated path draws from origin to destination on route load
