# M003-atdssp: Visual Redesign — layered floating UI, bottom sheet, animations, light/dark theme

## Vision
Restructure the CampusNav mobile app from a dark vertical ScrollView-based layout to a modern maps-like layered floating UI with a draggable bottom sheet (3 snap points), light/dark theme system with color tokens, and polished animations (route path drawing, floor cross-fade, confidence pulsing). All new components are built alongside existing ones so no breaking changes during implementation.

## Slice Overview
| ID | Slice | Risk | Depends | Done | After this |
|----|-------|------|---------|------|------------|
| S01 | Dependency Install + Theme System | medium | — | ⬜ | Theme tokens (darkColors, lightColors) exist and are accessible via useTheme() hook. No existing functionality is broken. |
| S02 | Bottom Sheet + Floating UI Chrome | high | S01 | ⬜ | Bottom sheet renders and can be dragged between collapsed (strip), half (route preview), and full (settings) snap points. Floating search bar pill is visible at top of screen. |
| S03 | Route + Guidance Animated Components | medium | S01 | ⬜ | Route step cards show current/upcoming/completed states with accent borders. Confidence indicator pulses during guidance. Route path draws itself from origin to destination. |
| S04 | App.tsx Integration + Final Wiring | medium | S02, S03 | ⬜ | App renders the full new layered layout: full-screen map backdrop, floating search bar + floor switcher on top, bottom sheet with content at bottom. Theme applies. Telemetry text removed. |
