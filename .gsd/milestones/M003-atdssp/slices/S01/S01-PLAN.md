# S01: Dependency Install + Theme System

**Goal:** Install react-native-reanimated, react-native-gesture-handler, react-native-svg, and @react-native-community/blur. Create mobile/theme/ with colors.ts (darkColors/lightColors), spacing.ts, typography.ts, and index.ts (useTheme hook). TypeScript clean, all existing tests green.
**Demo:** After this: Theme tokens (darkColors, lightColors) exist and are accessible via useTheme() hook. No existing functionality is broken.

## Tasks
- [x] **T01: Install reanimated v3.19.5, gesture-handler, svg, blur and update babel plugin** — Install react-native-reanimated ^4.0.0, react-native-gesture-handler ^2.20.0, react-native-svg ^15.8.0, @react-native-community/blur ^4.4.0 into mobile/package.json. Update mobile/babel.config.js to include 'react-native-reanimated/plugin' as the last entry in the plugins array. If reanimated v4 produces unresolved peer-dep warnings, fall back to ^3.21.0. Verify with tsc --noEmit and npm test.
  - Estimate: 30m
  - Files: mobile/package.json, mobile/babel.config.js
  - Verify: cd mobile && npx tsc --noEmit && npm test
- [ ] **T02: Create mobile/theme/ token files and useTheme hook** — Create mobile/theme/colors.ts with darkColors and lightColors const-asserted token objects matching the design palette. Create mobile/theme/spacing.ts with xs/sm/md/lg/xl/2xl on a 4pt grid. Create mobile/theme/typography.ts with title/sectionHeader/body/caption text styles. Create mobile/theme/index.ts exporting a useTheme() hook using useColorScheme() that returns { colors, spacing, typography, isDark }. Verify with tsc --noEmit and npm test.
  - Estimate: 1h
  - Files: mobile/theme/colors.ts, mobile/theme/spacing.ts, mobile/theme/typography.ts, mobile/theme/index.ts
  - Verify: cd mobile && npx tsc --noEmit && npm test
