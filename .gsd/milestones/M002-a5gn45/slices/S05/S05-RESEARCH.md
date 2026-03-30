# S05 Research: Integrated acceptance + internal build delivery

## What This Slice Must Deliver

- **R032** — Internal iOS and Android distributable builds produced (primary owner)
- **R033** — Visitor completes one end-to-end guided trip with a reroute (primary owner)
- R029, R030, R031 are already fully wired end-to-end in App.tsx from S04

Two jobs:
1. Fix 45 pre-existing test failures so the app test suite is clean
2. Configure Expo for native builds and generate installable android/ios artifacts

---

## What S04 Delivered (S05 Consumes)

S04 completed visitor-first live UX wiring:
- `headingRotationDeg` field + `applyHeadingRotation` in `mobile/map/mapTransform.ts`
- `headingRotationDeg` prop in `mobile/map/MapViewport.tsx` with cumulative rotateZ
- `headingDegrees` prop passthrough in `mobile/map/MapViewportFloor.tsx`
- `currentFloorId: number | null` + `deriveFloorContext()` in `mobile/routing/guidanceState.ts`
- `previousFloorIdRef` pattern + floor transition console.log in `mobile/hooks/useGuidanceSession.ts`
- `FloorBadge`, `FloorTransitionBanner` (2500ms), accessible amber (#facc15) highlighting in `mobile/components/guidance/LiveGuidanceOverlay.tsx`
- Full composition in `mobile/App.tsx` wiring `smoothedHeadingDegrees`, `accessibleMode`, `currentFloorId`, `findNearestNodeOnFloor`

---

## Test Failure Diagnosis

**Status: TypeScript compiles clean (0 errors). 522 tests pass. 45 tests fail across 7 files.**

### Category A — 4 TSX component test files (SyntaxError: Unexpected token 'typeof')

Root cause: `@vitejs/plugin-react` + Vite 7 (oxc parser) cannot parse TypeScript `import type` syntax in component files.

The affected component source files each contain `import type` statements:
- `mobile/components/guidance/ConfidenceIndicator.tsx` — `import type { ConfidenceLevel }`
- `mobile/components/guidance/LiveGuidanceOverlay.tsx` — `import type { DirectionStep, NormalizedFloorRecord }`
- `mobile/components/destination/DestinationPicker.tsx` — 3 `import type` statements
- `mobile/map/MapViewportFloor.tsx` — 3 `import type` statements

The test files use `React.createElement` or `@testing-library/react-native`'s render, but importing the components triggers oxc parse failure on the component source files.

**Fix:** Convert all `import type` to regular `import` in these 4 component files. TypeScript erases types at runtime regardless. Also replace `export { type ConfidenceLevel }` with a regular type export.

### Category B — 2 hook test files (React 19 hook error in jsdom)

`useLocationSearch.test.ts` and `useRouteSelection.test.ts` use `renderHook` from `@testing-library/react` 16.3.2. In React 19 with jsdom, React fiber initialization fails with `Cannot read properties of null (reading 'useState')`.

`@testing-library/react-native` 13.3.3 ships its own `renderHook` (in `build/render-hook.js`) that properly initializes React 19 hooks.

**Fix:** Switch both hook test files to use `@testing-library/react-native`'s `renderHook`.

---

## Build Configuration Diagnosis

**Stack:** Expo SDK 53 + React 19 + React Native 0.79

**Current state:**
- `mobile/app.json` — basic config (name, slug, scheme, iOS/android package IDs)
- No icons, no splash, no build scripts
- `mobile/.env` — `EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3000` (Android emulator default)
- `eas.json` — does not exist

**Needed:**
- `eas.json` — EAS Build configuration for internal builds
- `app.json` — Add app icon, splash, build settings, `extra.eas` configuration
- Run `npx expo prebuild --clean` to generate `android/` and `ios/` native directories
- Build Android APK/AAB (local gradle or `eas build --platform android`)
- Build iOS .app (local xcodebuild or `eas build --platform ios`)

---

## Implementation Plan

### T01 — Fix TSX component test failures
Convert `import type` → `import` in 4 component files:
- `mobile/components/guidance/ConfidenceIndicator.tsx`
- `mobile/components/guidance/LiveGuidanceOverlay.tsx`
- `mobile/components/destination/DestinationPicker.tsx`
- `mobile/map/MapViewportFloor.tsx`

Also fix `export { type ConfidenceLevel }`.

### T02 — Fix hook test failures
Switch `useLocationSearch.test.ts` and `useRouteSelection.test.ts` to use `@testing-library/react-native`'s `renderHook`.

### T03 — Configure Expo build artifacts
- Expand `mobile/app.json` with icon, splash, build settings
- Create `eas.json` with internal build profiles (dev, preview)
- Run `npx expo prebuild --clean` to generate native directories

### T04 — Build Android artifact
- Run `eas build --platform android --profile preview` (or local gradle)
- Verify APK/AAB generated

### T05 — Build iOS artifact
- Configure iOS signing (requires Apple Developer account)
- Run `eas build --platform ios --profile preview`
- Verify .app bundle generated

### T06 — E2E on-device proof
Manual on-device testing of the full visitor journey with reroute (R033 verification).

---

## Key Risks

1. **iOS signing** — Requires Apple Developer account; without it, only iOS Simulator builds are possible
2. **EAS credentials** — Expo account with associated credentials needed for both platforms
3. **Backend API** — `EXPO_PUBLIC_API_BASE_URL` must be set correctly for the target device's network
4. **GPS/sensor simulation** — On-device E2E requires real GPS or a GPS simulation tool

---

## Files to Modify

| File | Change |
|------|--------|
| `mobile/components/guidance/ConfidenceIndicator.tsx` | `import type` → `import`; fix `export { type }` |
| `mobile/components/guidance/LiveGuidanceOverlay.tsx` | `import type` → `import` |
| `mobile/components/destination/DestinationPicker.tsx` | `import type` → `import` |
| `mobile/map/MapViewportFloor.tsx` | `import type` → `import` |
| `mobile/hooks/useLocationSearch.test.ts` | Use `@testing-library/react-native` `renderHook` |
| `mobile/hooks/useRouteSelection.test.ts` | Use `@testing-library/react-native` `renderHook` |
| `mobile/app.json` | Add icon, splash, build config |
| `eas.json` | Create EAS Build configuration |
| `mobile/.env` | Set `EXPO_PUBLIC_API_BASE_URL` correctly for target devices |

## Files Already Complete (Do Not Modify)

- `mobile/App.tsx` — Fully composed from S04
- `mobile/routing/guidanceState.ts` — Has `currentFloorId` + `deriveFloorContext`
- `mobile/hooks/useGuidanceSession.ts` — Has floor tracking
- `mobile/map/mapTransform.ts` — Has `headingRotationDeg`
- `mobile/map/MapViewport.tsx` — Wired with heading rotation
- `mobile/components/guidance/LiveGuidanceOverlay.tsx` — Has FloorBadge, FloorTransitionBanner, accessibleMode
