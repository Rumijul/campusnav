---
estimated_steps: 16
estimated_files: 2
skills_used: []
---

# T01: Add bearing utility function to navGraph domain

Port the bearing utility from the web codebase into `mobile/domain/navGraph.ts`. Bearing is the angular difference between two normalized map-space points, used for step-advance detection and for heading-aware map rotation in S04.

Steps:
1. Read the existing `mobile/domain/navGraph.ts` file to find a good insertion point (near DirectionStep types or at the bottom before the normalizeNavGraph function).
2. Add the `bearing(ax: number, ay: number, bx: number, by: number): number` function using the formula: `atan2(dx, -dy)` in screen-space coordinates where 0°=north, 90°=east. Return value normalized to [0, 360).
3. Also add `normalizeDelta(delta: number): number` → range [-180, 180] (subtract 360 when delta > 180, add 360 when delta < -180).
4. Export both from `mobile/domain/navGraph.ts`.
5. Add unit tests in `mobile/domain/bearing.test.ts` covering:
   - North: bearing(0, 0, 0, 1) === 0
   - East: bearing(0, 0, 1, 0) === 90
   - South: bearing(0, 0, 0, -1) === 180
   - West: bearing(0, 0, -1, 0) === 270
   - Diagonal: bearing(0, 0, 1, 1) === 45
   - normalizeDelta(200) === -160, normalizeDelta(-200) === 160, normalizeDelta(0) === 0
   - Same point: bearing(0.5, 0.5, 0.5, 0.5) === 0 (handle division by zero gracefully)
6. Run `npm test -- mobile/domain/bearing.test.ts` and verify all pass.
7. Verify TypeScript: 0 errors.

## Inputs

- `mobile/domain/navGraph.ts`

## Expected Output

- `mobile/domain/navGraph.ts`
- `mobile/domain/bearing.test.ts`

## Verification

`npm test -- --run mobile/domain/bearing.test.ts` passes all 8 tests with 0 TypeScript errors

## Observability Impact

None
