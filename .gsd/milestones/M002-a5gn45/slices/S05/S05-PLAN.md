# S05: Integrated acceptance + internal build delivery

**Goal:** All 551 tests pass (522 passing + 29 currently failing across 7 test files), and installable Android APK/AAB and iOS .app artifacts are generated in the mobile/ directory.
**Demo:** After this: After this: internal iOS and Android builds are installable, and a full visitor journey (with one reroute) is proven end-to-end on device.

## Tasks
- [x] **T01: Source + test file import type fixes applied; vitest.config.ts esbuild plugin attempted but insufficient — full dependency chain still has import type blocking transitive module parse** — Convert all TypeScript `import type` statements to regular `import` in 4 component source files. The `@vitejs/plugin-react` oxc parser cannot handle `import type` in TSX files, causing SyntaxError when vitest tries to parse the source for component tests. TypeScript erases types at compile time anyway, so the runtime behavior is identical. Also fix `export { type ConfidenceLevel }` → `export { ConfidenceLevel }`.
  - Estimate: 30m
  - Files: mobile/components/guidance/ConfidenceIndicator.tsx, mobile/components/guidance/LiveGuidanceOverlay.tsx, mobile/components/destination/DestinationPicker.tsx, mobile/map/MapViewportFloor.tsx
  - Verify: npm test 2>&1 | tail -5 — must show 0 failed test files, 551 tests passing
  - Blocker: vitest 4.x (Vite 6) uses oxc parser in worker processes for ALL transitive imports. The only viable fixes are: (A) convert import type to import in every file in the dependency graph, or (B) configure vitest to use esbuild for the entire module graph (not just entry file transform). Baseline failures (7 files / 45 tests) predate these changes.
- [ ] **T02: Fix hook test failures (renderHook from @testing-library/react-native)** — Switch `renderHook` import in 3 hook test files from `@testing-library/react` to `@testing-library/react-native`. The web `@testing-library/react` v16.3.2 does not initialize React 19 fiber correctly in jsdom, causing `Cannot read properties of null (reading 'useState')`. The `@testing-library/react-native` v13.3.3 ships its own React 19-compatible renderHook implementation.
  - Estimate: 30m
  - Files: mobile/hooks/useLocationSearch.test.ts, mobile/hooks/useRouteSelection.test.ts, mobile/routing/useRouteSession.test.ts
  - Verify: npm test 2>&1 | tail -5 — must show 0 failed test files, 551 tests passing
- [ ] **T03: Configure Expo build artifacts (app.json, eas.json, .env, prebuild)** — Expand app.json with icon, splash, and build configuration. Create eas.json with internal build profiles (dev, preview). Create .env with EXPO_PUBLIC_API_BASE_URL for Android emulator (10.0.2.2:3000) and iOS simulator (localhost:3000). Then run `npx expo prebuild --clean` to generate android/ and ios/ native directories.
  - Estimate: 30m
  - Files: mobile/app.json, eas.json
  - Verify: ls mobile/android/ && ls mobile/ios/ — both directories must exist after prebuild; eas.json must be valid JSON with `build.profiles` key
- [ ] **T04: Build Android APK/AAB artifact** — Build Android APK or AAB from the generated android/ directory. Run `npx eas build --platform android --profile preview --non-interactive` or fall back to `./gradlew assembleRelease` inside `mobile/android/`. If EAS credentials are not configured, fall back to local gradle build. The APK/AAB must be generated in `mobile/android/app/build/outputs/` or the EAS default output directory.
  - Estimate: 30m
  - Files: mobile/android/, mobile/.env
  - Verify: ls mobile/android/app/build/outputs/apk/ 2>/dev/null || ls mobile/android/app/build/outputs/bundle/ 2>/dev/null — must contain .apk or .aab file
- [ ] **T05: Build iOS .app bundle artifact** — Build iOS .app bundle from the generated ios/ directory. Run `npx eas build --platform ios --profile preview --non-interactive` or fall back to `xcodebuild -workspace` inside `mobile/ios/`. If Apple Developer credentials are not configured, build for iOS Simulator only. The .app bundle must be generated in `mobile/ios/build/` or the EAS default output directory.
  - Estimate: 30m
  - Files: mobile/ios/, mobile/.env
  - Verify: ls mobile/ios/build/ 2>/dev/null | grep -E "\.app$|\.ipa$" — must contain .app or .ipa bundle
- [ ] **T06: Manual E2E on-device proof (R033 verification)** — Document and execute the manual end-to-end verification checklist proving R033: visitor completes one end-to-end guided trip including an off-route recovery. Transfer the APK to an Android device (or install via `adb install`) and the .app to an iOS device/simulator. Execute the checklist: (1) App launches, (2) Visitor selects start + destination, (3) Route preview appears, (4) Guidance starts, (5) Visitor deliberately deviates from route, (6) Reroute triggers within 5-10 seconds, (7) Destination reached. Write a E2E checklist file documenting each step and whether it passed.
  - Estimate: 45m
  - Files: mobile/e2e-checklist.md
  - Verify: manual — inspect E2E checklist file for all steps marked pass/fail
