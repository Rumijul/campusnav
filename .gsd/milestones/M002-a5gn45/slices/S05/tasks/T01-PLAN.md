---
estimated_steps: 1
estimated_files: 4
skills_used: []
---

# T01: Fix TSX component test failures (import type → import)

Convert all TypeScript `import type` statements to regular `import` in 4 component source files. The `@vitejs/plugin-react` oxc parser cannot handle `import type` in TSX files, causing SyntaxError when vitest tries to parse the source for component tests. TypeScript erases types at compile time anyway, so the runtime behavior is identical. Also fix `export { type ConfidenceLevel }` → `export { ConfidenceLevel }`.

## Inputs

- `mobile/components/guidance/ConfidenceIndicator.tsx`
- `mobile/components/guidance/LiveGuidanceOverlay.tsx`
- `mobile/components/destination/DestinationPicker.tsx`
- `mobile/map/MapViewportFloor.tsx`

## Expected Output

- `mobile/components/guidance/ConfidenceIndicator.tsx — `import type { ConfidenceLevel }` replaced with `import { ConfidenceLevel }`; `export { type ConfidenceLevel }` replaced with `export { ConfidenceLevel }``
- `mobile/components/guidance/LiveGuidanceOverlay.tsx — `import type { DirectionStep, NormalizedFloorRecord }` replaced with `import { DirectionStep, NormalizedFloorRecord }``
- `mobile/components/destination/DestinationPicker.tsx — 3 `import type` statements replaced with regular `import``
- `mobile/map/MapViewportFloor.tsx — 3 `import type` statements replaced with regular `import``

## Verification

npm test 2>&1 | tail -5 — must show 0 failed test files, 551 tests passing
