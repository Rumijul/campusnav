---
estimated_steps: 1
estimated_files: 3
skills_used: []
---

# T03: Fix hook test failures (renderHook from @testing-library/react-native)

Switch `renderHook` import in 3 hook test files from `@testing-library/react` to `@testing-library/react-native`. The web `@testing-library/react` v16.3.2 does not initialize React 19 fiber correctly in jsdom, causing `Cannot read properties of null (reading 'useState')`. The `@testing-library/react-native` v13.3.3 ships its own React 19-compatible renderHook implementation. Files: mobile/hooks/useLocationSearch.test.ts, mobile/hooks/useRouteSelection.test.ts, mobile/routing/useRouteSession.test.ts. Verify: npm test 2>&1 | tail -5 — must show 0 failed test files, all tests passing.

## Inputs

- None specified.

## Expected Output

- `mobile/hooks/useLocationSearch.test.ts`
- `mobile/hooks/useRouteSelection.test.ts`
- `mobile/routing/useRouteSession.test.ts`

## Verification

npm test 2>&1 | tail -5 — must show 0 failed test files, all tests passing
