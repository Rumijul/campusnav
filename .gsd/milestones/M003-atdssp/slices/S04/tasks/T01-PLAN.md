---
estimated_steps: 1
estimated_files: 1
skills_used: []
---

# T01: App.tsx layered layout refactor

Refactor App.tsx from ScrollView-based vertical layout to layered absolute-positioned floating UI. Import all S01–S03 components, add sheetSnap state, wire BottomSheet snap→content, wire FloatingSearchBar and FloatingFloorSwitcher, wire AnimatedRoutePathOverlay via MapViewportFloor prop, wire ConfidenceIndicator showPulse, remove telemetry Text.

## Inputs

- `mobile/App.tsx`
- `mobile/components/sheet/BottomSheet.tsx`
- `mobile/components/search/FloatingSearchBar.tsx`
- `mobile/components/floor/FloatingFloorSwitcher.tsx`
- `mobile/components/route/RoutePathOverlay.tsx`
- `mobile/components/guidance/ConfidenceIndicator.tsx`
- `mobile/theme/index.ts`
- `mobile/map/MapViewportFloor.tsx`

## Expected Output

- `mobile/App.tsx`

## Verification

cd mobile && npx tsc --noEmit
