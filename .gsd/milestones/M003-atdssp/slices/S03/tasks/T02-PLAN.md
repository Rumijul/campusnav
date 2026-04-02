---
estimated_steps: 18
estimated_files: 2
skills_used: []
---

# T02: Build AnimatedRoutePathOverlay with SVG strokeDashoffset

Add AnimatedRoutePathOverlay component to mobile/components/route/RoutePathOverlay.tsx. Uses react-native-svg with a Path polyline for each floor's route segment. Animates strokeDashoffset from total path length to 0 over 800ms with ease-out easing. Exports RoutePathPoint type. Uses theme colors (colors.routeStart, colors.routeEnd, colors.routeLine) for dots and path. Renders behind the floor image (pointerEvents none). Exports both RoutePathOverlay (existing View-based) and AnimatedRoutePathOverlay (new SVG-based) from the file.

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

## Inputs

- `mobile/components/route/RoutePathOverlay.tsx`
- `mobile/theme/colors.ts`
- `mobile/theme/index.ts`

## Expected Output

- `mobile/components/route/RoutePathOverlay.tsx`
- `mobile/components/route/index.ts`

## Verification

cd mobile && npx tsc --noEmit 2>&1 | head -20
