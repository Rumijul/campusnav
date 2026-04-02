---
id: T02
parent: S04
milestone: M003-atdssp
provides: []
requires: []
affects: []
key_files: ["mobile/map/MapViewportFloor.tsx", "mobile/App.tsx"]
key_decisions: []
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "npx tsc --noEmit passed with zero errors for MapViewportFloor.tsx and App.tsx. Pre-existing errors in other files (mapBootstrapState.ts, DestinationPicker.tsx, test files, routing modules) are outside this task scope and were present before T01/T02 changes."
completed_at: 2026-04-02T12:59:26.594Z
blocker_discovered: false
---

# T02: MapViewportFloor stripped of floor selector strip, now accepts optional routeOverlay prop for additional overlays

> MapViewportFloor stripped of floor selector strip, now accepts optional routeOverlay prop for additional overlays

## What Happened
---
id: T02
parent: S04
milestone: M003-atdssp
key_files:
  - mobile/map/MapViewportFloor.tsx
  - mobile/App.tsx
key_decisions:
  - (none)
duration: ""
verification_result: passed
completed_at: 2026-04-02T12:59:26.595Z
blocker_discovered: false
---

# T02: MapViewportFloor stripped of floor selector strip, now accepts optional routeOverlay prop for additional overlays

**MapViewportFloor stripped of floor selector strip, now accepts optional routeOverlay prop for additional overlays**

## What Happened

Removed the built-in horizontal ScrollView floor selector strip from MapViewportFloor (responsibility moved to FloatingFloorSwitcher in App.tsx per T01). Replaced hardcoded dark color literals in floor button styles with theme system removal — since the floor selector was removed entirely, useTheme() call was removed too (no colors consumed from it). Added optional routeOverlay?: React.ReactNode prop to the props interface and render it inside mapContainer alongside RoutePathOverlay. Cleaned up unused imports: FlatList, Pressable, ScrollView, Text, useEffect. Removed dead FloorButtonData interface. Updated component docstring. Also removed the stale showFloorSelector={false} prop from the App.tsx call site. npx tsc --noEmit passed with no errors in MapViewportFloor.tsx or App.tsx. Pre-existing errors in other files (mapBootstrapState.ts, DestinationPicker.tsx, test files) are outside this task scope.

## Verification

npx tsc --noEmit passed with zero errors for MapViewportFloor.tsx and App.tsx. Pre-existing errors in other files (mapBootstrapState.ts, DestinationPicker.tsx, test files, routing modules) are outside this task scope and were present before T01/T02 changes.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd mobile && npx tsc --noEmit 2>&1 | grep -E "(MapViewportFloor|App\.tsx)"` | 0 | ✅ pass | 3600ms |


## Deviations

Removed useTheme() hook call since the floor selector strip it would have colored was also removed — no remaining consumer of theme colors in this component. Also removed showFloorSelector prop from App.tsx call site (prop no longer exists in interface).

## Known Issues

None introduced by this change.

## Files Created/Modified

- `mobile/map/MapViewportFloor.tsx`
- `mobile/App.tsx`


## Deviations
Removed useTheme() hook call since the floor selector strip it would have colored was also removed — no remaining consumer of theme colors in this component. Also removed showFloorSelector prop from App.tsx call site (prop no longer exists in interface).

## Known Issues
None introduced by this change.
