# S24: Multi Floor Direction Dividers — Add floor Section headers and directional language to cross Floor route directions — UAT

**Milestone:** M001
**Written:** 2026-03-24

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: S24’s proof level is integration with unit/integration test surfaces (no required live runtime or human interaction), and this worktree environment has known Vite runtime instability under Node v25.

## Preconditions

- Dependencies installed (`npm install` already completed in this worktree).
- Test runner available (`vitest` via `npm test`).
- S24 code present in:
  - `src/client/hooks/useRouteDirections.ts`
  - `src/client/components/directionSections.ts`
  - `src/client/components/DirectionsSheet.tsx`

## Smoke Test

Run:

1. `npm test -- src/client/hooks/useRouteDirections.test.ts src/client/components/directionSections.test.ts`
2. **Expected:** Both test files pass, confirming floor-aware direction generation and floor-section grouping are wired together.

## Test Cases

### 1. Floor-change instructions include explicit up/down language

1. Run `npm test -- src/client/hooks/useRouteDirections.test.ts`
2. Verify the suite passes including cross-floor wording assertions and per-step floor metadata assertions.
3. **Expected:** Connector directions contain explicit vertical movement (`up`/`down`) and each emitted `DirectionStep` includes `floorId`/`floorNumber`.

### 2. Directions are grouped by contiguous floor boundaries with conditional headers

1. Run `npm test -- src/client/components/directionSections.test.ts`
2. Confirm tests cover: single-floor route, cross-floor split, and return-to-floor resections.
3. **Expected:**
   - Cross-floor transitions create new sections.
   - Returning to a previous floor creates a new section later in the sequence.
   - Single-floor routes remain a single section (no extra floor header requirement).

### 3. Missing floorMap fallback remains deterministic

1. Run `npm test -- src/client/hooks/useRouteDirections.test.ts -t "falls back to floorId when floorMap is missing"`
2. **Expected:** Targeted fallback test passes (with other tests skipped), proving direction output remains readable and floor metadata fallback does not regress.

### 4. Full regression safety

1. Run `npm test`
2. **Expected:** Full project suite passes with no regressions introduced by S24 changes.

## Edge Cases

### Missing floor metadata map

1. Execute the targeted fallback diagnostic test (Test Case 3).
2. **Expected:** No `undefined` or malformed floor-change strings; fallback to `floorId` keeps direction output stable.

### Single-floor route should stay visually flat

1. Execute `npm test -- src/client/components/directionSections.test.ts`.
2. **Expected:** Single-floor case produces one section, so `DirectionsSheet` does not need floor divider headers.

## Failure Signals

- Any connector instruction text missing explicit `up`/`down` movement language.
- `DirectionStep` objects missing `floorId` or `floorNumber`.
- Grouping logic globally merges same-floor steps and fails to split on return-to-floor boundaries.
- Single-floor directions begin rendering redundant floor headers.
- Any of the four verification commands above fail.

## Not Proven By This UAT

- Browser-rendered visual confirmation in a live Vite session (blocked by known Node v25 worktree runtime issue).
- Admin floor-connector visual linking (S25 scope).
- GPS bounds configuration and live geolocation behaviors (S26/S27 scope).

## Notes for Tester

- In this worktree, prefer test-based verification over local `npm run dev:client` runtime checks due known Vite dependency-optimization instability.
- If a non-worktree runtime is available later, optional visual smoke should verify floor headers in the live directions sheet for one cross-floor route and one single-floor route.
