---
estimated_steps: 4
estimated_files: 3
skills_used:
  - react-best-practices
  - test
---

# T02: Group direction steps by floor and render section headers in DirectionsSheet

**Slice:** S24 — Multi Floor Direction Dividers — Add floor Section headers and directional language to cross Floor route directions
**Milestone:** M001

## Description

Implement floor-section rendering for cross-floor routes (R004) using a pure grouping helper and unit tests, then wire grouped rendering into `DirectionsSheet` for both identical-route and tabbed-route display modes.

## Steps

1. Create `src/client/components/directionSections.ts` with a pure helper that groups contiguous `DirectionStep[]` into ordered floor sections using `floorId`/`floorNumber`.
2. Add `src/client/components/directionSections.test.ts` covering single-floor input, multi-floor boundary splitting, and repeated return-to-floor behavior (later return creates a new section instead of merging distant sections).
3. Refactor `src/client/components/DirectionsSheet.tsx` to render direction lists through one shared grouped-section path and show floor headers only when the active direction set has more than one section.
4. Confirm no-route and tab state behavior remains intact while floor headers appear only for cross-floor routes, then run targeted tests.

## Must-Haves

- [ ] Multi-floor direction sets render floor headers at each boundary between floors.
- [ ] Single-floor direction sets render without extra floor header rows.
- [ ] The same section-grouped rendering path is used for routes-identical mode and tabbed mode.
- [ ] Grouping helper behavior is locked by unit tests.

## Verification

- `npm test -- src/client/components/directionSections.test.ts`
- `npm test -- src/client/hooks/useRouteDirections.test.ts src/client/components/directionSections.test.ts`

## Observability Impact

- Signals added/changed: floor-boundary derivation (`DirectionStep[] -> section model`) becomes explicit and testable.
- How a future agent inspects this: run `src/client/components/directionSections.test.ts` for grouping diagnostics and inspect floor-header branch in `src/client/components/DirectionsSheet.tsx`.
- Failure state exposed: missing/incorrect headers appear as deterministic section-count and section-order assertion failures.

## Inputs

- `src/client/components/DirectionsSheet.tsx` — existing flat step list renderer to convert to sectioned rendering.
- `src/client/hooks/useRouteDirections.ts` — floor metadata contract consumed by section grouping.
- `src/client/hooks/useRouteDirections.test.ts` — direction-generation semantics that feed this UI.

## Expected Output

- `src/client/components/directionSections.ts` — pure grouping helper for floor sections.
- `src/client/components/directionSections.test.ts` — unit tests for section boundary behavior.
- `src/client/components/DirectionsSheet.tsx` — grouped multi-floor section rendering with conditional headers.
