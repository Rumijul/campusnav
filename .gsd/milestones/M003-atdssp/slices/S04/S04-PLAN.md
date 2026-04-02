# S04: App.tsx Integration + Final Wiring

**Goal:** Refactor App.tsx to use the new layered absolute-positioned layout, consuming all S02 and S03 components. Remove the ScrollView-based vertical layout. Replace all hardcoded colors with useTheme(). Remove telemetry text. Wire bottom sheet snap point to route state, floor cross-fade to floor changes, animated path to route selection.
**Demo:** After this: App renders the full new layered layout: full-screen map backdrop, floating search bar + floor switcher on top, bottom sheet with content at bottom. Theme applies. Telemetry text removed.

## Tasks
