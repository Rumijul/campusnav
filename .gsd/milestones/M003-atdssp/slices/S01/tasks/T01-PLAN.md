---
estimated_steps: 1
estimated_files: 2
skills_used: []
---

# T01: Install animation/gesture packages and update babel config

Install react-native-reanimated ^4.0.0, react-native-gesture-handler ^2.20.0, react-native-svg ^15.8.0, @react-native-community/blur ^4.4.0 into mobile/package.json. Update mobile/babel.config.js to include 'react-native-reanimated/plugin' as the last entry in the plugins array. If reanimated v4 produces unresolved peer-dep warnings, fall back to ^3.21.0. Verify with tsc --noEmit and npm test.

## Inputs

- `mobile/package.json`
- `mobile/babel.config.js`

## Expected Output

- `mobile/package.json`
- `mobile/babel.config.js`

## Verification

cd mobile && npx tsc --noEmit && npm test
