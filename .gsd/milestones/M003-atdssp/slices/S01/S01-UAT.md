# S01: Dependency Install + Theme System — UAT

**Milestone:** M003-atdssp
**Written:** 2026-04-02T11:21:14.722Z

## TC-1: Package installation
Run `cd mobile && cat package.json | grep -E "reanimated|gesture-handler|react-native-svg|blur"` → verify all four dependencies present with correct versions.

## TC-2: Babel plugin
Run `cat mobile/babel.config.js` → verify `'react-native-reanimated/plugin'` is last entry in plugins array.

## TC-3: Theme colors module
Import `mobile/theme/colors.ts` → verify `darkColors` and `lightColors` both exported with distinct values.

## TC-4: useTheme hook — type-check
Run `cd mobile && npx tsc --noEmit` → zero TypeScript errors in theme module.

## TC-5: useTheme returns dark colors in dark mode
Verify hook uses `useColorScheme() === 'dark'` for isDark gating.

## TC-6: Spacing scale 4pt grid
Verify `mobile/theme/spacing.ts` exports xs=4 through 4xl=64.

## TC-7: Typography tokens
Verify all four tiers (title/sectionHeader/body/caption) with fontSize and fontWeight.

## TC-8: Theme hook integration
Verify `useTheme()` returns `{ colors, spacing, typography, isDark }` — all four fields present.

## TC-9: Existing tests pass (regression)
Run `cd mobile && npm test -- --run` → ≥500 tests pass (9 suites fail due to pre-existing Vitest oxc/React 19 infrastructure issues).

## TC-10: Bootstrap missing-url detection
Verify that `runAppBootstrap({ env: { EXPO_PUBLIC_API_BASE_URL: '' } })` transitions to error state with reason 'missing-api-base-url'.
