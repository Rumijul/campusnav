---
id: T02
parent: S24
milestone: M001
provides:
  - Contiguous floor-boundary grouping from `DirectionStep[]` into deterministic section models
  - Conditional floor-header rendering in `DirectionsSheet` for cross-floor routes while preserving single-floor flat rendering
  - Regression coverage for single-floor, floor-boundary split, and return-to-floor section behavior
key_files:
  - src/client/components/directionSections.ts
  - src/client/components/directionSections.test.ts
  - src/client/components/DirectionsSheet.tsx
  - .gsd/milestones/M001/slices/S24/S24-PLAN.md
key_decisions:
  - Reuse one `DirectionSectionList` rendering path in both routes-identical and tabbed modes so floor-section behavior is consistent across UI states.
patterns_established:
  - Group by contiguous floor runs (`floorId` + `floorNumber`) instead of globally merging same-floor steps.
  - Show floor headers only when `sections.length > 1` so single-floor routes remain visually flat.
observability_surfaces:
  - src/client/components/directionSections.test.ts
  - src/client/components/DirectionsSheet.tsx
  - npm test -- src/client/components/directionSections.test.ts
duration: 0.4h
verification_result: passed
completed_at: 2026-03-24
blocker_discovered: false
---

# T02: Group direction steps by floor and render section headers in DirectionsSheet

**Shipped floor-section grouping with conditional floor headers in `DirectionsSheet`, verified for cross-floor and single-floor behavior.**

## What Happened

Validated the local implementation against the T02 contract and confirmed the required runtime pieces are present:
- `groupDirectionSections` groups contiguous `DirectionStep` runs by `floorId`/`floorNumber`.
- `directionSections.test.ts` locks single-floor behavior, cross-floor boundary splitting, and return-to-floor re-sectioning.
- `DirectionsSheet` renders through one shared `DirectionSectionList` path in both routes-identical and tabbed modes, and only renders floor headers when multiple sections exist.

No additional source changes were required in the component/helper files during this execution pass; the implementation in this worktree already satisfied the plan. I then marked T02 complete in the slice plan.

## Verification

Executed task-level and slice-level verification commands plus diagnostics:
- Grouping helper test suite passes.
- Direction generation regression suite still passes.
- Fallback diagnostic check for missing floor metadata passes.
- Full project test suite passes.
- LSP diagnostics report no issues for `DirectionsSheet.tsx`, `directionSections.ts`, and `directionSections.test.ts`.
- Browser smoke verification was attempted for UI runtime behavior, but local Vite startup crashed during dependency optimization in this environment (Node v25), so browser assertions could not be completed.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm test -- src/client/components/directionSections.test.ts` | 0 | ✅ pass | 1037ms |
| 2 | `npm test -- src/client/hooks/useRouteDirections.test.ts src/client/components/directionSections.test.ts` | 0 | ✅ pass | 1039ms |
| 3 | `npm test -- src/client/hooks/useRouteDirections.test.ts` | 0 | ✅ pass | 999ms |
| 4 | `npm test -- src/client/hooks/useRouteDirections.test.ts -t "falls back to floorId when floorMap is missing"` | 0 | ✅ pass | 1016ms |
| 5 | `npm test` | 0 | ✅ pass | 1136ms |
| 6 | `npm run dev:client -- --host 127.0.0.1 --port 5173` (bg_shell readiness check) | 1 | ❌ fail | 2000ms |

## Diagnostics

Primary inspection surface for floor-boundary derivation is `src/client/components/directionSections.test.ts`; failures there directly expose wrong section count/order and boundary handling. Floor-header rendering behavior is isolated in the `DirectionSectionList` branch of `src/client/components/DirectionsSheet.tsx` (`showFloorHeaders = sections.length > 1`), so regressions appear as deterministic render-branch mismatches.

## Deviations

Source implementation for the planned T02 files was already present and contract-compliant in this worktree; execution focused on verification and plan closure rather than further code edits.

## Known Issues

- `npm run dev:client -- --host 127.0.0.1 --port 5173` crashes in this environment during Vite dependency optimization (`Cannot read properties of undefined (reading 'imports')` under Node.js v25.8.1), which blocked browser-level UI assertions during this task.

## Files Created/Modified

- `.gsd/milestones/M001/slices/S24/tasks/T02-SUMMARY.md` — added execution narrative, verification evidence, diagnostics, and completion metadata for T02.
- `.gsd/milestones/M001/slices/S24/S24-PLAN.md` — marked T02 as complete (`[x]`).
