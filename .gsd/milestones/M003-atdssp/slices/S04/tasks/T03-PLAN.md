---
estimated_steps: 1
estimated_files: 2
skills_used: []
---

# T03: Verification — typecheck and tests

Run TypeScript typecheck and existing test suite to confirm no regressions.

## Inputs

- `mobile/App.tsx`
- `mobile/map/MapViewportFloor.tsx`

## Expected Output

- Update the implementation and proof artifacts needed for this task.

## Verification

cd mobile && npx tsc --noEmit && npm test
