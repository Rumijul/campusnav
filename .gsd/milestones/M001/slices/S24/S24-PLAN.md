# S24: Multi Floor Direction Dividers — Add floor Section headers and directional language to cross Floor route directions

**Goal:** Multi-floor directions are floor-aware: connector instructions include explicit up/down language and the sheet renders floor section headers at floor boundaries.
**Demo:** Given a cross-floor route, students see grouped direction sections (e.g., Floor 1 then Floor 2) and connector instructions like “Take the stairs up to Floor 2,” while single-floor routes remain visually flat.

## Must-Haves

- **R004 (owned):** Multi-floor route directions display floor-section headers between steps on different floors.
- **R005 (owned):** Every floor-change direction step includes explicit up/down movement language.
- `DirectionStep` carries stable floor metadata (`floorId`, `floorNumber`) so section rendering does not need extra graph lookups.
- Existing single-floor direction presentation stays unchanged (no extra headers when only one floor section exists).

## Proof Level

- This slice proves: integration
- Real runtime required: no
- Human/UAT required: no

## Verification

- `npm test -- src/client/hooks/useRouteDirections.test.ts`
- `npm test -- src/client/components/directionSections.test.ts`
- `npm test -- src/client/hooks/useRouteDirections.test.ts -t "falls back to floorId when floorMap is missing"` (diagnostic/failure-path check)
- `npm test`

## Observability / Diagnostics

- Runtime signals: deterministic per-step floor metadata (`floorId`, `floorNumber`) and deterministic section boundaries from grouping logic.
- Inspection surfaces: `src/client/hooks/useRouteDirections.test.ts`, `src/client/components/directionSections.test.ts`, and rendered floor-header rows in `src/client/components/DirectionsSheet.tsx`.
- Failure visibility: failing assertions show incorrect up/down phrasing, wrong boundary grouping, or bad fallback behavior when floor metadata is unavailable.
- Redaction constraints: none (no secrets/PII in these UI strings or tests).

## Integration Closure

- Upstream surfaces consumed: `PathResult` contract, `NavNode`/`NavFloor` models, and `floorMap` wiring from `src/client/components/FloorPlanCanvas.tsx`.
- New wiring introduced in this slice: `generateDirections` emits floor-aware step data and directional floor-change wording; `DirectionsSheet` consumes grouped sections via a pure helper.
- What remains before the milestone is truly usable end-to-end: nothing for S24 scope.

## Tasks

- [ ] **T01: Add floor-aware direction contracts and up/down floor-change wording** `est:1h`
  - Why: Closes R005 and establishes the floor metadata contract required for section headers in R004.
  - Files: `src/client/hooks/useRouteDirections.ts`, `src/client/hooks/useRouteDirections.test.ts`
  - Do: Extend `DirectionStep` with floor context, update floor-change instruction generation to include explicit up/down language based on floor-number direction, and add/update tests for up/down text, floor-number-vs-floorId ordering, fallback when `floorMap` is missing, and floor metadata on generated steps.
  - Verify: `npm test -- src/client/hooks/useRouteDirections.test.ts`
  - Done when: floor-change steps always include up/down wording and tests prove floor metadata + fallback behavior.
- [ ] **T02: Group direction steps by floor and render section headers in DirectionsSheet** `est:1h`
  - Why: Closes R004 by converting flat direction lists into floor-scannable sections for cross-floor routes.
  - Files: `src/client/components/directionSections.ts`, `src/client/components/directionSections.test.ts`, `src/client/components/DirectionsSheet.tsx`
  - Do: Create a pure helper that groups contiguous steps by floor, add unit tests for grouping boundaries and single-floor behavior, and refactor DirectionsSheet rendering to use grouped sections with conditional floor headers in both identical-route and tabbed-route modes.
  - Verify: `npm test -- src/client/components/directionSections.test.ts && npm test -- src/client/hooks/useRouteDirections.test.ts`
  - Done when: multi-floor routes render floor headers at boundaries, single-floor routes do not show headers, and targeted tests pass.

## Files Likely Touched

- `src/client/hooks/useRouteDirections.ts`
- `src/client/hooks/useRouteDirections.test.ts`
- `src/client/components/directionSections.ts`
- `src/client/components/directionSections.test.ts`
- `src/client/components/DirectionsSheet.tsx`
