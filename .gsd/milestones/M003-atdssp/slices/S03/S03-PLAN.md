# S03: Route + Guidance Animated Components

**Goal:** Route step cards show current/upcoming/completed states with accent borders. Confidence indicator pulses during guidance. Route path draws itself from origin to destination.
**Demo:** After this: Route step cards show current/upcoming/completed states with accent borders. Confidence indicator pulses during guidance. Route path draws itself from origin to destination.

## Tasks
- [x] **T01: Added PulseRing to ConfidenceIndicator with theme tokens** — Add a pulsing ring sub-component to ConfidenceIndicator using react-native-reanimated. The ring scales from 1.0 to 1.8 and fades from opacity 0.6 to 0 over 1000ms, looping continuously. It renders behind the dot (flex order). Replace hardcoded DOT_COLOR/LABEL_COLOR hex values with theme tokens (colors.confidenceHigh, colors.confidenceMedium, colors.confidenceLow, colors.confidenceNone). Add a `showPulse` prop defaulting to true during non-idle phases. Add Vitest tests for pulse animation behavior.

Steps:
1. Read mobile/components/guidance/ConfidenceIndicator.tsx and confirm current DOT_COLOR/LABEL_COLOR hardcoded values
2. Import useTheme from '../../theme' and use colors.confidenceHigh/Medium/Low/None
3. Create PulseRing sub-component using useSharedValue + useAnimatedStyle + withRepeat(withSequence(withTiming(...)))
4. Render PulseRing behind dot by placing it before dot in JSX (flex order)
5. Add showPulse prop (default true) to conditionally show pulse
6. Update ConfidenceIndicator.test.tsx with React.createElement tests for pulse ring rendering and showPulse prop
7. Run npm test -- --run ConfidenceIndicator to verify all tests pass
8. Verify no TypeScript errors with npx tsc --noEmit
  - Estimate: 45m
  - Files: mobile/components/guidance/ConfidenceIndicator.tsx, mobile/components/guidance/ConfidenceIndicator.test.tsx, mobile/theme/colors.ts
  - Verify: cd mobile && npm test -- --run ConfidenceIndicator && npx tsc --noEmit 2>&1 | head -10
- [x] **T02: Add AnimatedRoutePathOverlay with SVG strokeDashoffset draw-on animation** — Add AnimatedRoutePathOverlay component to mobile/components/route/RoutePathOverlay.tsx. Uses react-native-svg with a Path polyline for each floor's route segment. Animates strokeDashoffset from total path length to 0 over 800ms with ease-out easing. Exports RoutePathPoint type. Uses theme colors (colors.routeStart, colors.routeEnd, colors.routeLine) for dots and path. Renders behind the floor image (pointerEvents none). Exports both RoutePathOverlay (existing View-based) and AnimatedRoutePathOverlay (new SVG-based) from the file.

Steps:
1. Read mobile/components/route/RoutePathOverlay.tsx and confirm existing RoutePathPoint type and View-based implementation
2. Import Svg, Path, Circle from react-native-svg
3. Import Animated and useSharedValue from react-native-reanimated
4. Import useTheme from '../../theme'
5. Create floorPathString helper to generate SVG polyline path from RoutePathPoint array
6. Create AnimatedRoutePathOverlay component:
   - Filter path nodes to activeFloorId
   - Compute total path length using Math.hypot on segment distances
   - Use useSharedValue for strokeDashOffset (starts at totalLength, animates to 0)
   - Trigger withTiming animation on mount/props change
   - Render Svg with Path using animated strokeDashoffset
   - Render Circle for start/end nodes with theme colors
7. Add AnimatedRoutePathOverlayProps interface
8. Export RoutePathPoint, RoutePathOverlay, AnimatedRoutePathOverlay, AnimatedRoutePathOverlayProps from the file
9. Update mobile/components/route/index.ts to re-export AnimatedRoutePathOverlay
10. Run npx tsc --noEmit to verify no type errors
  - Estimate: 45m
  - Files: mobile/components/route/RoutePathOverlay.tsx, mobile/components/route/index.ts
  - Verify: cd mobile && npx tsc --noEmit 2>&1 | head -20
