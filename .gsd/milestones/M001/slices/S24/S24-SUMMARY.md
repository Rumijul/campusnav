---
id: S24
parent: M001
milestone: M001
provides:
  - Floor-aware `DirectionStep` output with stable `floorId`/`floorNumber` metadata and explicit connector up/down language.
  - Deterministic contiguous floor-boundary grouping via `groupDirectionSections`.
  - `DirectionsSheet` floor headers for cross-floor routes while preserving flat single-floor rendering.
requires:
  - slice: S23
    provides: Stable post-gesture-fix directions UI baseline that S24 extends without changing gesture behavior.
affects:
  - S25
  - S26
  - S27
key_files:
  - src/client/hooks/useRouteDirections.ts
  - src/client/hooks/useRouteDirections.test.ts
  - src/client/components/directionSections.ts
  - src/client/components/directionSections.test.ts
  - src/client/components/DirectionsSheet.tsx
  - .gsd/REQUIREMENTS.md
  - .gsd/milestones/M001/M001-ROADMAP.md
key_decisions:
  - D011: derive vertical connector wording from resolved floor numbers and stamp floor metadata on each emitted direction step.
  - D012: group directions by contiguous floor runs and render floor headers only when more than one section exists.
patterns_established:
  - Resolve floor semantics from `floorMap` first, then fallback to `floorId` when metadata is missing.
  - Treat floor grouping as sequence-aware (boundary split on floor changes, including return-to-floor cases).
  - Use one shared section-list rendering path in `DirectionsSheet` for identical-route and tabbed-route modes.
observability_surfaces:
  - npm test -- src/client/hooks/useRouteDirections.test.ts
  - npm test -- src/client/components/directionSections.test.ts
  - npm test -- src/client/hooks/useRouteDirections.test.ts -t "falls back to floorId when floorMap is missing"
  - npm test
drill_down_paths:
  - .gsd/milestones/M001/slices/S24/tasks/T01-SUMMARY.md
  - .gsd/milestones/M001/slices/S24/tasks/T02-SUMMARY.md
duration: 1.4h
verification_result: passed
completed_at: 2026-03-24
---

# S24: Multi Floor Direction Dividers — Add floor Section headers and directional language to cross Floor route directions

**Shipped floor-aware cross-floor directions end-to-end: connector steps now use explicit up/down phrasing and the directions sheet renders deterministic floor sections only when a route actually crosses floors.**

## What Happened

S24 closed both slice requirements (R004, R005) by finishing the directions pipeline from generation through rendering.

- **T01 (hook contract + wording):** `useRouteDirections` now emits stable `floorId` and `floorNumber` on every `DirectionStep`, including arrival steps. Connector instructions now derive vertical wording (`up` / `down`) from resolved floor ordering (floor numbers), with fallback safety when `floorMap` metadata is absent.
- **T02 (UI grouping + rendering):** added contiguous floor-run grouping in `directionSections.ts` and routed `DirectionsSheet` through a shared section-list renderer. Floor headers appear only when there are multiple floor sections, so single-floor directions remain visually flat.
- **Closure updates:** R004/R005 were moved to validated in `.gsd/REQUIREMENTS.md`; S24 was marked complete in `M001-ROADMAP.md`; knowledge and project state docs were refreshed.

## Verification

All slice-plan verification commands passed during closure:

- `npm test -- src/client/hooks/useRouteDirections.test.ts` ✅
- `npm test -- src/client/components/directionSections.test.ts` ✅
- `npm test -- src/client/hooks/useRouteDirections.test.ts -t "falls back to floorId when floorMap is missing"` ✅
- `npm test` ✅

These checks prove:
- floor metadata is stamped per step,
- up/down phrasing is deterministic and regression-protected,
- floor boundary grouping is correct (including return-to-floor scenarios),
- single-floor routes do not get unnecessary headers.

## New Requirements Surfaced

- none

## Deviations

No scope deviations. T02 implementation was already present in this worktree; closure focused on verification completion and slice artifact finalization.

## Known Limitations

- Browser-runtime visual UAT was not executed inside this worktree because local Vite dev startup can fail in this Node v25 worktree environment; verification remained artifact-driven (tests) per known environment constraints.
- Connector step text is floor-direction aware but does **not** yet include connector landmark naming (tracked separately as deferred R019).

## Follow-ups

- S25 should reuse S24’s per-step floor metadata and contiguous grouping assumptions when implementing admin connector-link UX to avoid reintroducing floor-order ambiguity.
- When running outside this worktree environment, perform an optional browser smoke pass on a real multi-floor route to capture UI screenshot evidence.

## Files Created/Modified

- `.gsd/milestones/M001/slices/S24/S24-SUMMARY.md` — created consolidated slice closure summary.
- `.gsd/milestones/M001/slices/S24/S24-UAT.md` — replaced placeholder with concrete artifact-driven UAT script.
- `.gsd/REQUIREMENTS.md` — moved R004 and R005 from active to validated with proof text.
- `.gsd/milestones/M001/M001-ROADMAP.md` — marked S24 complete.
- `.gsd/KNOWLEDGE.md` — added floor-direction/grouping implementation guidance for downstream slices.
- `.gsd/PROJECT.md` — refreshed milestone active-state indicators and update timestamp.

## Forward Intelligence

### What the next slice should know
- `DirectionStep` now already carries `floorId` + `floorNumber`; consumers should use that metadata directly instead of doing extra graph/floor lookups in UI code.

### What's fragile
- Floor-direction wording depends on how floor ordering is resolved — if future code switches back to raw floor ID comparison, up/down phrasing will silently become wrong on non-sequential IDs.

### Authoritative diagnostics
- `src/client/hooks/useRouteDirections.test.ts` + targeted fallback test are the best signals for connector wording and metadata guarantees.
- `src/client/components/directionSections.test.ts` is the authoritative signal for floor-boundary splitting and single-floor no-header behavior.

### What assumptions changed
- Assumption: floor IDs can be used to determine vertical movement.
- Reality: floor IDs are identifiers, not guaranteed ordering; resolved floor numbers (with fallback) must drive direction semantics.
