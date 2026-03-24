---
id: T01
parent: S24
milestone: M001
provides:
  - Floor-aware `DirectionStep` contract with `floorId`/`floorNumber` on every generated step
  - Explicit connector wording with deterministic `up`/`down` semantics
  - Regression coverage for floor-number ordering and floor-map fallback behavior
key_files:
  - src/client/hooks/useRouteDirections.ts
  - src/client/hooks/useRouteDirections.test.ts
  - .gsd/milestones/M001/slices/S24/S24-PLAN.md
key_decisions:
  - D011: Use resolved floor numbers (not raw floor IDs) for vertical direction semantics
patterns_established:
  - Resolve `floorNumber` via `floorMap` with `floorId` fallback, then derive vertical direction from resolved floor numbers
  - Stamp floor metadata on each emitted step so renderers can group by floor without additional graph lookups
observability_surfaces:
  - src/client/hooks/useRouteDirections.test.ts
  - npm test -- src/client/hooks/useRouteDirections.test.ts -t "falls back to floorId when floorMap is missing"
duration: 1h
verification_result: partial
completed_at: 2026-03-24
blocker_discovered: false
---

# T01: Add floor-aware direction contracts and up/down floor-change wording

**Added floor-aware direction metadata and explicit up/down connector wording, with fallback-safe route direction tests.**

## What Happened

Implemented the T01 contract in `useRouteDirections` by extending `DirectionStep` with `floorId` and `floorNumber`, then updating direction generation so every pushed step (including `arrive`) includes deterministic floor metadata.

For floor-change instructions, I introduced helper logic to resolve floor numbers from `floorMap` with fallback to `floorId`, and changed connector wording to explicit vertical language (`up`/`down`) across stairs/elevator/ramp transitions.

I also updated test coverage in `useRouteDirections.test.ts` to assert:
- explicit up/down wording,
- per-step floor metadata,
- out-of-order `floorId` with floor-number-driven direction semantics,
- fallback behavior when floor metadata is missing.

I marked T01 done in `S24-PLAN.md`.

## Verification

Ran the task-level and slice-level checks from the plan. Hook-focused tests and full suite passed. The `directionSections` check fails at this point because that file is planned for T02 and does not exist yet.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm test -- src/client/hooks/useRouteDirections.test.ts` | 0 | ✅ pass | 1068ms |
| 2 | `npm test -- src/client/components/directionSections.test.ts` | 1 | ❌ fail | 724ms |
| 3 | `npm test -- src/client/hooks/useRouteDirections.test.ts -t "falls back to floorId when floorMap is missing"` | 0 | ✅ pass | 950ms |
| 4 | `npm test` | 0 | ✅ pass | 1024ms |

## Diagnostics

The new runtime signals are directly inspectable in generated `DirectionStep` objects:
- `floorId` + `floorNumber` are present on each step,
- connector text encodes vertical movement (`up`/`down`),
- fallback cases avoid malformed output (`undefined`) and remain readable.

Primary inspection surface is `src/client/hooks/useRouteDirections.test.ts`, which now fails deterministically if any of those guarantees regress.

## Deviations

None.

## Known Issues

- `src/client/components/directionSections.test.ts` is not present yet (owned by T02), so that slice-level verification command currently fails as expected for this intermediate task.

## Files Created/Modified

- `src/client/hooks/useRouteDirections.ts` — added floor metadata to `DirectionStep`, floor-number resolution helpers, floor-number-based up/down semantics, and metadata stamping for all emitted steps.
- `src/client/hooks/useRouteDirections.test.ts` — expanded floor-change tests for up/down wording, per-step metadata, floorId-vs-floorNumber direction semantics, and fallback safety.
- `.gsd/milestones/M001/slices/S24/S24-PLAN.md` — marked T01 as complete (`[x]`).
