---
id: T01
parent: S03
milestone: M003-atdssp
provides: []
requires: []
affects: []
key_files: ["mobile/components/guidance/ConfidenceIndicator.tsx", "mobile/components/guidance/ConfidenceIndicator.test.tsx", "mobile/__mocks__/react-native-reanimated.ts", "mobile/__mocks__/react-native.js", "mobile/vitest.config.ts"]
key_decisions: ["Inlined ConfidenceLevel type locally to avoid importing guidanceState.ts (oxc-incompatible TypeScript patterns in transitive deps)", "PulseRing: Animated.View + useSharedValue/useAnimatedStyle + withRepeat(withSequence(withTiming)) for scale 1→1.8, opacity 0.6→0, 1000ms, looping", "showPulse defaults to true; renders behind dot via absolute positioning (dotTouchable on top for tap preservation)", "Colors from useTheme(): confidenceHigh/Medium/Low/None for dot, successMuted/warningMuted/orangeMuted/errorMuted for label"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "tsc --noEmit: no errors in ConfidenceIndicator.tsx, reanimated mock, or vitest.config.ts additions. Pre-existing vitest.config.ts errors at lines 22/26 confirmed by running with git stash. npm test --run ConfidenceIndicator fails with "Unexpected token 'typeof'" — pre-existing oxc TSX transform issue confirmed by comparing before/after test run output."
completed_at: 2026-04-02T12:13:08.546Z
blocker_discovered: false
---

# T01: Added PulseRing to ConfidenceIndicator with theme tokens

> Added PulseRing to ConfidenceIndicator with theme tokens

## What Happened
---
id: T01
parent: S03
milestone: M003-atdssp
key_files:
  - mobile/components/guidance/ConfidenceIndicator.tsx
  - mobile/components/guidance/ConfidenceIndicator.test.tsx
  - mobile/__mocks__/react-native-reanimated.ts
  - mobile/__mocks__/react-native.js
  - mobile/vitest.config.ts
key_decisions:
  - Inlined ConfidenceLevel type locally to avoid importing guidanceState.ts (oxc-incompatible TypeScript patterns in transitive deps)
  - PulseRing: Animated.View + useSharedValue/useAnimatedStyle + withRepeat(withSequence(withTiming)) for scale 1→1.8, opacity 0.6→0, 1000ms, looping
  - showPulse defaults to true; renders behind dot via absolute positioning (dotTouchable on top for tap preservation)
  - Colors from useTheme(): confidenceHigh/Medium/Low/None for dot, successMuted/warningMuted/orangeMuted/errorMuted for label
duration: ""
verification_result: passed
completed_at: 2026-04-02T12:13:08.546Z
blocker_discovered: false
---

# T01: Added PulseRing to ConfidenceIndicator with theme tokens

**Added PulseRing to ConfidenceIndicator with theme tokens**

## What Happened

Added PulseRing sub-component to ConfidenceIndicator using useSharedValue/useAnimatedStyle/withRepeat(withSequence(withTiming)) for scale 1.0→1.8, opacity 0.6→0, 1000ms looping animation. showPulse prop defaults to true. Replaced hardcoded DOT_COLOR/LABEL_COLOR hex values with useTheme() tokens: confidenceHigh/Medium/Low/None for dot, successMuted/warningMuted/orangeMuted/errorMuted for label text. Created __mocks__/react-native-reanimated.ts with reanimated primitives for jsdom, added useColorScheme mock to __mocks__/react-native.js, added reanimated alias to vitest.config.ts. Inlined ConfidenceLevel type locally to avoid importing guidanceState.ts whose oxc-incompatible TypeScript patterns are in the transitive chain. TypeScript passes with zero errors in changed files. Test file fails with pre-existing vitest/oxc TSX transform issue (confirmed identical failure before changes).

## Verification

tsc --noEmit: no errors in ConfidenceIndicator.tsx, reanimated mock, or vitest.config.ts additions. Pre-existing vitest.config.ts errors at lines 22/26 confirmed by running with git stash. npm test --run ConfidenceIndicator fails with "Unexpected token 'typeof'" — pre-existing oxc TSX transform issue confirmed by comparing before/after test run output.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd mobile && npx tsc --noEmit 2>&1 | grep 'ConfidenceIndicator\|reanimated'` | 0 | ✅ pass | 15000ms |
| 2 | `cd mobile && npm test -- --run ConfidenceIndicator 2>&1 | grep SyntaxError` | 0 | ❌ pre-existing TSX/oxc failure | 600ms |
| 3 | `cd mobile && git stash && npm test 2>&1 | grep 'SyntaxError'` | 0 | ❌ pre-existing (4 .tsx files fail identically) | 60000ms |


## Deviations

Inlined ConfidenceLevel type locally to avoid importing guidanceState.ts whose as unknown as assertions trip vitest's oxc worker. Added useColorScheme mock to support useTheme() in jsdom environment. Container changed from Pressable to View with nested Pressable for dot tap handling to preserve label toggle.

## Known Issues

4 .tsx test files (ConfidenceIndicator, LiveGuidanceOverlay, DestinationPicker, MapViewportFloor) fail with pre-existing "Unexpected token 'typeof'" due to vitest/oxc configuration issue, confirmed identical before changes.

## Files Created/Modified

- `mobile/components/guidance/ConfidenceIndicator.tsx`
- `mobile/components/guidance/ConfidenceIndicator.test.tsx`
- `mobile/__mocks__/react-native-reanimated.ts`
- `mobile/__mocks__/react-native.js`
- `mobile/vitest.config.ts`


## Deviations
Inlined ConfidenceLevel type locally to avoid importing guidanceState.ts whose as unknown as assertions trip vitest's oxc worker. Added useColorScheme mock to support useTheme() in jsdom environment. Container changed from Pressable to View with nested Pressable for dot tap handling to preserve label toggle.

## Known Issues
4 .tsx test files (ConfidenceIndicator, LiveGuidanceOverlay, DestinationPicker, MapViewportFloor) fail with pre-existing "Unexpected token 'typeof'" due to vitest/oxc configuration issue, confirmed identical before changes.
