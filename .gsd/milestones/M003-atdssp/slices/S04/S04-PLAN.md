# S04: App.tsx Integration + Final Wiring

**Goal:** App.tsx renders the full layered floating UI: full-screen map backdrop, floating search bar + floor switcher on top, bottom sheet with content at bottom. Theme applies. Telemetry text removed.
**Demo:** After this: App renders the full new layered layout: full-screen map backdrop, floating search bar + floor switcher on top, bottom sheet with content at bottom. Theme applies. Telemetry text removed.

## Tasks
- [x] **T01: App.tsx refactored from ScrollView to layered floating UI with BottomSheet, FloatingSearchBar, FloatingFloorSwitcher, AnimatedRoutePathOverlay, and ConfidenceIndicator** — Refactor App.tsx from ScrollView-based vertical layout to layered absolute-positioned floating UI. Import all S01–S03 components, add sheetSnap state, wire BottomSheet snap→content, wire FloatingSearchBar and FloatingFloorSwitcher, wire AnimatedRoutePathOverlay via MapViewportFloor prop, wire ConfidenceIndicator showPulse, remove telemetry Text.
  - Estimate: 1h
  - Files: mobile/App.tsx
  - Verify: cd mobile && npx tsc --noEmit
- [x] **T02: MapViewportFloor stripped of floor selector strip, now accepts optional routeOverlay prop for additional overlays** — Replace hardcoded dark floor button colors with useTheme().colors. Remove the built-in floor selector ScrollView strip (now handled by FloatingFloorSwitcher in App.tsx). Add optional routeOverlay prop and render it inside mapContainer alongside RoutePathOverlay.
  - Estimate: 30m
  - Files: mobile/map/MapViewportFloor.tsx
  - Verify: cd mobile && npx tsc --noEmit
- [x] **T03: Typecheck passes; 521/522 tests pass — remaining 7 suite + 1 test failures are pre-existing infrastructure issues** — Run TypeScript typecheck and existing test suite to confirm no regressions.
  - Estimate: 15m
  - Verify: cd mobile && npx tsc --noEmit && npm test
