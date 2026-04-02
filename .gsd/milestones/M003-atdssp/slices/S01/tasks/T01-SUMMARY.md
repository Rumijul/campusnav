---
id: T01
parent: S01
milestone: M003-atdssp
provides: []
requires: []
affects: []
key_files: ["mobile/package.json", "mobile/babel.config.js"]
key_decisions: ["Used react-native-reanimated@^3.19.5 instead of ^4.0.0 or ^3.21.0 — v4 requires react-native 0.81+, v3.21.0 doesn't exist on npm"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "TypeScript (tsc --noEmit) shows 31 pre-existing errors in App.tsx, DestinationPicker.tsx, and test files — all NavNode type mismatches and MapImageContract assignment errors, not caused by package installation. Tests: 7 failed suites (SyntaxError "Unexpected token 'typeof'" from React 19 incompatibility with @testing-library/react v16.3.2) and 2 pre-existing assertion failures (appBootstrap and mapApiClient). npm install completed successfully in 4.7s with 23 packages added. All 4 packages are confirmed in mobile/package.json."
completed_at: 2026-04-02T10:32:24.897Z
blocker_discovered: false
---

# T01: Install reanimated v3.19.5, gesture-handler, svg, blur and update babel plugin

> Install reanimated v3.19.5, gesture-handler, svg, blur and update babel plugin

## What Happened
---
id: T01
parent: S01
milestone: M003-atdssp
key_files:
  - mobile/package.json
  - mobile/babel.config.js
key_decisions:
  - Used react-native-reanimated@^3.19.5 instead of ^4.0.0 or ^3.21.0 — v4 requires react-native 0.81+, v3.21.0 doesn't exist on npm
duration: ""
verification_result: mixed
completed_at: 2026-04-02T10:32:24.897Z
blocker_discovered: false
---

# T01: Install reanimated v3.19.5, gesture-handler, svg, blur and update babel plugin

**Install reanimated v3.19.5, gesture-handler, svg, blur and update babel plugin**

## What Happened

Installed four animation/gesture packages into mobile/package.json and updated mobile/babel.config.js to include the reanimated Babel plugin. react-native-reanimated v4.x requires react-native 0.81+, but the project uses 0.79.6, so fell back to v3.19.5 (latest stable v3; the plan specified ^3.21.0 which does not exist on npm). react-native-gesture-handler ^2.30.1, react-native-svg ^15.15.4, and @react-native-community/blur ^4.4.1 installed successfully. Babel config updated with 'react-native-reanimated/plugin' as the last plugin entry. TypeScript and test failures observed are all pre-existing in the codebase (NavNode type mismatches, React 19 / @testing-library/react incompatibility, two assertion failures) and unrelated to this task's package installs.

## Verification

TypeScript (tsc --noEmit) shows 31 pre-existing errors in App.tsx, DestinationPicker.tsx, and test files — all NavNode type mismatches and MapImageContract assignment errors, not caused by package installation. Tests: 7 failed suites (SyntaxError "Unexpected token 'typeof'" from React 19 incompatibility with @testing-library/react v16.3.2) and 2 pre-existing assertion failures (appBootstrap and mapApiClient). npm install completed successfully in 4.7s with 23 packages added. All 4 packages are confirmed in mobile/package.json.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd mobile && npm install react-native-reanimated@^3.19.5 react-native-gesture-handler@^2.20.0 react-native-svg@^15.8.0 @react-native-community/blur@^4.4.0` | 0 | ✅ pass | 4700ms |
| 2 | `cd mobile && npx tsc --noEmit` | 2 | ❌ fail (pre-existing) | 6100ms |
| 3 | `cd mobile && npm test` | 1 | ❌ fail (pre-existing) | 29200ms |


## Deviations

react-native-reanimated v4.x is incompatible with react-native 0.79.6 (requires 0.81+); fell back to v3.19.5. react-native-reanimated ^3.21.0 from the plan does not exist on npm; used ^3.19.5 which is the latest stable v3 release.

## Known Issues

TypeScript errors and test failures are pre-existing in the codebase and not caused by the package installations done in this task.

## Files Created/Modified

- `mobile/package.json`
- `mobile/babel.config.js`


## Deviations
react-native-reanimated v4.x is incompatible with react-native 0.79.6 (requires 0.81+); fell back to v3.19.5. react-native-reanimated ^3.21.0 from the plan does not exist on npm; used ^3.19.5 which is the latest stable v3 release.

## Known Issues
TypeScript errors and test failures are pre-existing in the codebase and not caused by the package installations done in this task.
