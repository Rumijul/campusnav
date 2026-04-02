# S01 Research: Dependency Install + Theme System

## Summary

**S01 scope:** Install four animation/gesture packages and create the complete theme token system (`mobile/theme/`). No existing files are modified. Existing tests must remain green after package install.

**Verdict:** Straightforward dependency install + new-file creation. No risky integration. Primary risk is `react-native-reanimated` v4 peer dependency compatibility with Expo SDK 53 + React 19.

---

## What Exists

### Package.json state
- React Native `0.79.6` + Expo SDK `53` + React `19.0.0`
- Current deps: `expo`, `expo-location`, `expo-sensors`
- devDeps: `@testing-library/react-native ^13.3.3`, `vitest ^4.0.18`

### App.tsx color usage
Hardcoded dark-only colors throughout:
```
backgroundColor: #020617 (container)
backgroundColor: #0a0f1e (sections)
backgroundColor: #0f172a (buttons, toggle)
borderColor: #334155 / #475569 / #1e3a5f
textPrimary: #f8fafc
textSecondary: #cbd5e1
textMuted: #94a3b8 / #64748b
accent: #38bdf8 (blue)
success: #4ade80 (green)
warning: #facc15 (yellow)
error: #fda4af
```
No theme directory exists.

### Existing components
- `mobile/components/route/RoutePathOverlay.tsx` — view-based polyline (no SVG yet). Uses hardcoded `#38bdf8`, `#4ade80`, `#f87171`.
- `mobile/components/guidance/ConfidenceIndicator.tsx` — hardcoded dot colors (`#22c55e`, `#eab308`, `#f97316`, `#ef4444`).
- `mobile/map/MapViewportFloor.tsx` — hardcoded floor button colors matching App.tsx palette.
- `mobile/components/destination/DestinationPicker.tsx` — existing, used in App.tsx.
- `mobile/components/route/RoutePreview.tsx` — existing, used in App.tsx.
- `mobile/components/guidance/LiveGuidanceOverlay.tsx` — existing.

### Test mocks
`mobile/__mocks__/react-native.js` exists and mocks `View`, `Text`, `Pressable`. Vitest uses `jsdom` environment + `globals: true`. No reanimated mock yet.

### babel.config.js
```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
```
Needs `'react-native-reanimated/plugin'` added to plugins.

---

## Package Versions (per D018)

```
react-native-reanimated        ^4.0.0
react-native-gesture-handler   ^2.20.0
react-native-svg               ^15.8.0
@react-native-community/blur   ^4.4.0
```

---

## What to Create

### Theme files (`mobile/theme/`)
1. **`colors.ts`** — `darkColors` and `lightColors` objects as `const` assertions (per design doc tokens), plus `ColorTokens` type
2. **`spacing.ts`** — `spacing` object with xs/sm/md/lg/xl/2xl values (4pt grid)
3. **`typography.ts`** — `typography` object with title/sectionHeader/body/caption text styles as `TextStyle`
4. **`index.ts`** — `useTheme()` hook using `useColorScheme()`, returns `{ colors, spacing, typography, isDark }`

### Existing files touched
- `mobile/package.json` — add 4 deps
- `mobile/babel.config.js` — add reanimated plugin

No other existing files modified in S01.

---

## Verification Plan

### Step 1: Install packages
```bash
cd mobile && npm install react-native-reanimated@^4.0.0 react-native-gesture-handler@^2.20.0 react-native-svg@^15.8.0 @react-native-community/blur@^4.4.0
```
Expected: clean install, no peer dep warnings. If reanimated v4 has peer warnings with Expo SDK 53 / React 19, fall back to v3 stable.

### Step 2: Update babel.config.js
Add `'react-native-reanimated/plugin'` to plugins array. Must be LAST plugin.

### Step 3: Typecheck
```bash
cd mobile && npx tsc --noEmit
```
Expected: clean. New files only, no breaking changes to existing code.

### Step 4: Test suite
```bash
cd mobile && npm test
```
Expected: all existing tests green. No new tests in S01 (theme files are utility-only, no testable component surface yet).

### Step 5: Expo prebuild sanity (if time permits)
```bash
cd mobile && npx expo install --check
```
Check for missing peer deps.

---

## Risks and Mitigations

### Risk: Reanimated v4 peer dep warnings with Expo SDK 53 + React 19
- Decision D018 says use v4 and verify. If peer warnings appear, try v3 stable (`^3.21.0`) which is confirmed compatible.
- Mitigation: install v3 if v4 has unresolved peer conflicts. Update D018 if version changes.

### Risk: Vitest failing with new package imports
- Adding reanimated/gesture-handler imports to test files (S02 onward) will require a jsdom-compatible mock.
- In S01, no existing test files are touched. Theme files export only plain TS objects/hooks with no native deps.
- Mitigation for S02+: create `__mocks__/react-native-reanimated.js` that returns mock worklets before importing components that use reanimated.

### Risk: `react-native-svg` unused in S01
- Not needed for theme system. Installing it in S01 aligns with the plan's dependency step, but it won't be used until S03 (animated route path).
- Not a functional risk.

### Risk: `@react-native-community/blur` Android rendering
- Blur view on Android can be inconsistent. The design uses semi-transparent backgrounds as fallback.
- Not a S01 concern (theme only). Risk acknowledged for S02.

---

## Decision Needed Before Execution

**Fallback version for reanimated v4 incompatibility:** Should we hardcode v3 stable (`^3.21.0`) as the primary pick, and only try v4 if v3 is unavailable? The plan says v4 but the risk is real. Recommend: try v4 first as stated in D018, fall back to v3 if peer dep warnings appear during install.

---

## Forward Intelligence for Planner

- S02 (BottomSheet) will need a reanimated mock for tests. Budget one task to create `__mocks__/react-native-reanimated.js` early if test failures appear.
- The `useTheme()` hook returns `isDark: boolean` — downstream components (ConfidenceIndicator, RoutePathOverlay, MapViewportFloor) all have hardcoded colors that need to be replaced in S03/S04. S01 only creates the system.
- app.json has `"userInterfaceStyle": "automatic"` which aligns with `useColorScheme()` behavior.
- No `safe-area-context` dependency needed yet; bottom sheet corner radius 16px uses standard padding.

---

## Skill Discovery

No additional skills needed. `react-native-reanimated`, `react-native-gesture-handler`, `react-native-svg` are all well-established RN packages with patterns identical to prior work in this codebase (gesture handling via PanResponder, animated styles via reanimated primitives). The `useColorScheme` hook is a built-in React Native API.
