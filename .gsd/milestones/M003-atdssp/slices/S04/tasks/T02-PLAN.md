---
estimated_steps: 1
estimated_files: 1
skills_used: []
---

# T02: MapViewportFloor cleanup

Replace hardcoded dark floor button colors with useTheme().colors. Remove the built-in floor selector ScrollView strip (now handled by FloatingFloorSwitcher in App.tsx). Add optional routeOverlay prop and render it inside mapContainer alongside RoutePathOverlay.

## Inputs

- `mobile/map/MapViewportFloor.tsx`
- `mobile/theme/colors.ts`

## Expected Output

- `mobile/map/MapViewportFloor.tsx`

## Verification

cd mobile && npx tsc --noEmit
