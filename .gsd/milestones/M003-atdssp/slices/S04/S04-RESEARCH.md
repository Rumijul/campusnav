# S04 Research: App.tsx Integration + Final Wiring

## Summary

S04 wires the complete layered floating UI into App.tsx. The existing ScrollView-based vertical layout (hardcoded dark colors, telemetry text, inline DestinationPicker section) is replaced with an absolute-positioned layered layout using all S01–S03 components. The refactor touches App.tsx and MapViewportFloor.tsx only; no new components are created.

## What Exists and Where

### Theme system (S01 — `mobile/theme/`)
- `mobile/theme/index.ts` — `useTheme()` hook: returns `{ colors, spacing, typography, isDark }`
- `mobile/theme/colors.ts` — `darkColors` / `lightColors` with full palette; `colors.background`, `colors.surface`, `colors.surfaceElevated`, `colors.textPrimary`, `colors.accent`, `colors.border`, `colors.routeLine`, `colors.routeStart`, `colors.routeEnd`, `colors.confidenceHigh/Medium/Low/None`
- `mobile/theme/spacing.ts` — 4pt-grid scale (`xs`–`4xl`)
- `mobile/theme/typography.ts` — text style tokens

### Components ready to wire (S02 + S03)
| Component | File | Props interface |
|---|---|---|
| `BottomSheet` | `components/sheet/BottomSheet.tsx` | `snapPoints`, `initialSnapIndex`, `onSnapChange`, `containerStyle`, `children` |
| `BottomSheetHandle` | `components/sheet/BottomSheetHandle.tsx` | (stateless visual) |
| `FloatingSearchBar` | `components/search/FloatingSearchBar.tsx` | `origin`, `destination`, `onOriginChange`, `onDestinationChange`, `onSwap`, `onSearchPress`, `disabled`, `style` |
| `FloatingFloorSwitcher` | `components/floor/FloatingFloorSwitcher.tsx` | `floors`, `selectedFloor`, `onSelectFloor`, `style` |
| `DirectionStepCard` | `components/route/DirectionStepCard.tsx` | `step`, `isActive`, `onPress`, `style` |
| `RouteSummaryStrip` | `components/route/RouteSummaryStrip.tsx` | `totalDistanceNorm`, `totalDurationSec`, `stepCount`, `style` |
| `StartGuidanceButton` | `components/route/StartGuidanceButton.tsx` | `onPress`, `disabled`, `label`, `style` |
| `AccessibleToggle` | `components/settings/AccessibleToggle.tsx` | `value`, `onValueChange`, `disabled`, `accessibilityLabel` |
| `ConfidenceIndicator` | `components/guidance/ConfidenceIndicator.tsx` | `confidence: ConfidenceLevel`, `showPulse?: boolean` |
| `AnimatedRoutePathOverlay` | `components/route/RoutePathOverlay.tsx` | `path`, `activeFloorId`, `viewport`, `scale` (same as RoutePathOverlay) |

### Key hook interfaces already available
- `useRouteSelection()` — returns `{ start, destination, bothSelected, setStart, setDestination, swap, clearAll }`
- `useGuidanceSession()` — returns `{ guidanceState, startGuidance, stopGuidance, confirmPosition }`; `guidanceState.phase` ∈ `'idle'|'low-confidence'|'guiding'|'rerouting'|'arrived'`
- `useCurrentPosition()` — returns `{ position, smoothedHeadingDegrees }`
- `useRouteSession()` — returns `{ sessionState, routeMode, setRouteMode }`; `sessionState.phase` ∈ `'idle'|'no-route'|'ready'|'error'`

## What Needs to Be Built / Changed

### App.tsx — layered layout (≈250 lines change)

**Current structure (to remove):**
- `View.container` with `backgroundColor: '#020617'` (hardcoded)
- `ScrollView.scrollContent` wrapping all sections
- `DestinationPicker` as a scrollable section
- `RoutePreview` as a scrollable section
- Inline `Pressable` for accessible mode toggle
- `MapViewportFloor` with hardcoded dark floor buttons
- Telemetry `Text` element
- `LiveGuidanceOverlay` and `ConfidenceIndicator` already positioned (good — keep pattern)

**New structure:**
```
View (flex:1, backgroundColor: theme)
  ├── MapViewportFloor (absolute fill, zIndex:0)
  ├── AnimatedRoutePathOverlay (absolute fill, zIndex:1) — replaces RoutePathOverlay
  ├── FloatingSearchBar (absolute top, zIndex:10, SafeAreaView)
  ├── FloatingFloorSwitcher (absolute above sheet, zIndex:10)
  ├── BottomSheet (absolute bottom, zIndex:100)
  │     ├── snap 0 (collapsed 120px): RouteSummaryStrip + floor badge
  │     ├── snap 1 (half 300px): RoutePreview + StartGuidanceButton
  │     └── snap 2 (full 600px): DestinationPicker + AccessibleToggle
  ├── LiveGuidanceOverlay (absolute top, zIndex:200)
  └── ConfidenceIndicator (absolute top-right, zIndex:201)
```

**Key wiring decisions:**
1. `BottomSheet` `onSnapChange` → local `sheetSnap` state (0|1|2). Content is a single `children` prop — use conditional rendering based on `sheetSnap`.
2. When `guidanceState.phase !== 'idle'`, force `sheetSnap = 0` (collapsed) and prevent user drag-up — OR just let it stay wherever user left it. Design says collapsed is primary during guidance.
3. `FloatingSearchBar.onSearchPress` → if `bothSelected`, call nothing (route finding is automatic via `useRouteSession`). Else focus the empty field. Actually `useRouteSession` computes route automatically from `selection.start/destination` — no explicit search call needed. `onSearchPress` could clear or do nothing.
4. `FloatingSearchBar.onSwap` → `selection.swap()`
5. `FloatingSearchBar.onOriginChange` / `onDestinationChange` → update local text state, but actual node setting happens via `onNodeSelect` from map tap. The search bar is display + optional text entry only.
6. `AnimatedRoutePathOverlay` is already exported alongside `RoutePathOverlay` from `components/route/index.ts`. Import it and pass to `MapViewportFloor` via `routeOverlay` prop, or directly in App.tsx layered above the map.

### MapViewportFloor.tsx — 2 changes (≈15 lines)
1. Remove hardcoded dark floor button colors (`backgroundColor: '#0f172a'`, etc.) — use `useTheme().colors`
2. Remove the built-in floor selector (now handled by `FloatingFloorSwitcher` outside `MapViewportFloor`)

### ConfidenceIndicator showPulse wiring
`showPulse={guidanceState.phase !== 'idle'}` — pulse during any active guidance phase.

## Natural Seams / Task Decomposition

**T01 — App.tsx layered layout refactor**
- Remove ScrollView, hardcoded dark background, telemetry text
- Add imports for all new components
- Add `sheetSnap` state (useState<SnapIndex>)
- Render layered layout with absolute positioning
- Wire BottomSheet snap→content conditional
- Wire FloatingSearchBar to selection state
- Wire FloatingFloorSwitcher to floor state
- Wire AccessibleToggle (replaces inline Pressable)
- Replace ConfidenceIndicator with theme + showPulse
- Wire AnimatedRoutePathOverlay (import + render above map)
- Replace `routePath` in MapViewportFloor with animated overlay in App.tsx layer

**T02 — MapViewportFloor cleanup**
- Remove hardcoded colors → useTheme().colors
- Remove built-in floor selector strip (now FloatingFloorSwitcher)

**T03 — Verification**
- `npm test` in mobile/ (must not regress)
- `npx tsc --noEmit` in mobile/ (zero errors)

## Risks and Known Constraints

1. **GestureDetector at root**: `BottomSheet` uses `GestureDetector` internally; `FloatingSearchBar` has no gesture. No conflict expected. The `GestureHandlerRootView` wrapper (required by gesture-handler) should already be set up by Expo prebuild; if not, App.tsx needs to wrap in `GestureHandlerRootView`.

2. **SafeAreaView for floating search bar**: The search bar should sit below the notch. Wrap it in React Native's `SafeAreaView` or `useSafeAreaInsets()` from `react-native-safe-area-context`.

3. **BottomSheet z-index vs gesture**: Sheet has `zIndex:100`. During guidance, LiveGuidanceOverlay at `zIndex:200` sits above it — correct. The guidance overlay taps should not be blocked by the bottom sheet.

4. **AnimatedRoutePathOverlay import path**: It's exported from `components/route/index.ts` alongside `RoutePathOverlay`. Pass to `MapViewportFloor` via a new optional `routeOverlayComponent` prop, OR render it directly in App.tsx as a sibling above the map. Simplest: add to `MapViewportFloor` via a new optional prop `routeOverlay?: React.ReactNode` — render the animated overlay as a sibling inside the map container.

5. **`RoutePreview` content**: The existing `RoutePreview` component renders DirectionStepCard list + AccessibleToggle. It needs to move into BottomSheet half state. If `RoutePreview` has its own AccessibleToggle, S04 needs to avoid rendering two toggles — use `AccessibleToggle` in the full sheet state only.

6. **S03 AnimatedRoutePathOverlay** uses `setTimeout` 16ms delay before stroke animation. This is fine for integration — no special handling needed in App.tsx.

## Implementation Order

1. T01: App.tsx layered layout — highest-impact, establishes the new visual structure
2. T02: MapViewportFloor cleanup — small, clear, isolated
3. T03: Verification — typecheck + tests

## Verification

- `cd mobile && npx tsc --noEmit` — zero errors
- `cd mobile && npm test` — existing tests pass (no regressions)
- Visual: App renders full-screen map, floating search bar at top, floor switcher pill, bottom sheet draggable between 3 positions, route path draws on route selection, confidence dot pulses during guidance
