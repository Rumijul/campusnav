---
depends_on: [M002-a5gn45]
---

# M003-atdssp: Visual Redesign

**Gathered:** 2026-04-02
**Status:** Ready for planning

## Project Description

Implement the CampusNav mobile visual redesign specified in `docs/plans/2026-04-02-campusnav-visual-redesign-design.md` and `docs/plans/2026-04-02-campusnav-visual-redesign-plan.md`. Restructure the app from a dark vertical `ScrollView`-based layout to a layered floating UI with a draggable bottom sheet, light/dark theme tokens, and animations.

## Why This Milestone

The current app is functional but visually dated. The redesign improves the maps-like feel, makes the app feel polished and modern, and establishes a maintainable theme system for future iterations.

## User-Visible Outcome

### When this milestone is complete, the user can:
- Open the app and see a full-screen floor plan map with floating search bar and bottom sheet
- Drag the bottom sheet between three positions (collapsed strip, half-expanded route preview, full content)
- Use the app in light or dark mode based on system preference
- See route path animate along its length from origin to destination
- See floor cross-fade animation when switching floors
- See a pulsing confidence indicator ring during guidance

### Entry point / environment
- Entry point: `mobile/App.tsx` — Expo managed workflow
- Environment: Android emulator (Expo prebuild + gradle), iOS (blocked on Windows)
- Live dependencies involved: none (pure UI, no backend)

## Completion Class

- Contract complete means: all new components exist, themed, wired to App.tsx, tests pass
- Integration complete means: App.tsx renders new layout, bottom sheet gestures work, theme applies
- Operational complete means: none (no service lifecycle, purely client-side UI)

## Final Integrated Acceptance

To call this milestone complete, we must prove:
- `cd mobile && npm test` passes (all existing tests still green)
- `cd mobile && npx tsc --noEmit` passes (no type errors)
- Bottom sheet drags between all three snap points without crashing
- Light/dark theme switches correctly with system preference
- Route path animates from origin to destination
- Floor cross-fade triggers on floor switch

## Risks and Unknowns

- **`react-native-reanimated` v4 + Expo SDK 53 compatibility** — reanimated v4 may have API changes or peer dependency requirements with Expo SDK 53. Verify install works and plugin config is correct.
- **Gesture handler + reanimated interaction in BottomSheet** — the pan gesture and animated style must not conflict. Test early.
- **`@react-native-community/blur` compatibility** — blur views on Android can be inconsistent. Verify it builds without crashing.
- **React 19 + reanimated v4** — reanimated's worklet model may require adjustments for React 19.
- **Test rendering with new dependencies** — existing Vitest tests may break with new package imports if jsdom environment is not configured for reanimated.

## Existing Codebase / Prior Art

- `mobile/App.tsx` — current vertical ScrollView layout, hardcoded dark colors (#020617, #0a0f1e, etc.), must be refactored to use theme system
- `mobile/theme/` — does not exist yet; must be created
- `mobile/components/sheet/` — does not exist; bottom sheet goes here
- `mobile/components/search/` — does not exist; floating search bar goes here
- `mobile/components/floor/` — does not exist; floor switcher + transition view go here
- `mobile/components/settings/` — does not exist; accessible toggle goes here
- `mobile/components/guidance/ConfidenceIndicator.tsx` — exists; must be enhanced with pulsing animation
- `mobile/components/route/RoutePreview.tsx` — exists; content moves into bottom sheet half state
- `mobile/components/route/RoutePathOverlay.tsx` — exists; must add animated variant
- `mobile/map/MapViewportFloor.tsx` — exists; must integrate floor transition animation

## Relevant Requirements

- R040 — New layered floating UI layout with full-screen map backdrop
- R041 — Draggable bottom sheet with 3 snap points
- R042 — Light/dark theme system with color tokens
- R043 — Animated route path drawing
- R044 — Floor cross-fade animation on floor switch
- R045 — Pulsing confidence indicator animation

## Scope

### In Scope
- Install `react-native-reanimated`, `react-native-gesture-handler`, `react-native-svg`, `@react-native-community/blur`
- Theme system: color tokens, spacing scale, typography, `useTheme` hook
- BottomSheet component with 3 snap points (collapsed/half/full)
- FloatingSearchBar with origin/destination/swap
- FloatingFloorSwitcher pill
- DirectionStepCard with current/upcoming/completed states
- RouteSummaryStrip for collapsed bottom sheet
- StartGuidanceButton with press animation
- AccessibleToggle iOS-style switch
- Animated route path overlay
- Floor cross-fade transition view
- ConfidenceIndicator pulsing ring enhancement
- App.tsx refactor to new layered layout
- Remove hardcoded colors from App.tsx
- Remove telemetry text from release view

### Out of Scope / Non-Goals
- Component library extraction
- Custom font loading
- Haptic feedback
- Offline mode
- Accessibility audit beyond accessible routing toggle
- Backend changes

## Technical Constraints

- Must not break existing tests (522 tests in M002)
- Must not break existing functionality (bootstrap, route selection, guidance)
- Expo managed workflow — native changes via `npx expo prebuild`
- React Native 0.79.6 + Expo SDK 53 — verify peer deps

## Integration Points

- `mobile/App.tsx` — orchestrates all new components; uses existing `useRouteSelection`, `useGuidanceSession`, `useCurrentPosition` hooks
- `mobile/map/MapViewportFloor.tsx` — wraps floor images in transition view
- `mobile/components/route/RoutePathOverlay.tsx` — adds animated stroke variant
- `mobile/components/guidance/ConfidenceIndicator.tsx` — adds pulsing ring

## Open Questions

- Does `react-native-reanimated` v4 work with Expo SDK 53 and React 19? — verify on install
- Does `@react-native-community/blur` have Android rendering issues? — may need fallback to solid semi-transparent background
- Should `BottomSheet` use `react-native-safe-area-context` for notch/home indicator? — plan uses 16px corner radius, safe area may be needed
