---
estimated_steps: 4
estimated_files: 2
skills_used:
  - react-best-practices
  - test
---

# T01: Add floor-aware direction contracts and up/down floor-change wording

**Slice:** S24 — Multi Floor Direction Dividers — Add floor Section headers and directional language to cross Floor route directions
**Milestone:** M001

## Description

Implement the direction-generation contract for this slice: floor-change instructions must include explicit up/down language (R005), and every generated step must carry floor metadata so section rendering can be derived without extra lookups (dependency for R004).

## Steps

1. Extend `DirectionStep` in `src/client/hooks/useRouteDirections.ts` with `floorId` and `floorNumber`, and add helper logic to resolve floor numbers from `floorMap` with fallback to `floorId`.
2. Update `generateDirections` so floor-change instructions use explicit directional wording (`up`/`down`) and use resolved floor numbers for direction semantics; ensure all pushed steps (including `arrive`) include floor metadata.
3. Expand `src/client/hooks/useRouteDirections.test.ts` to assert explicit up/down wording, per-step floor metadata, and a case where floor IDs are out of order but floor numbers still determine movement direction.
4. Add/update failure-path assertions for missing `floorMap` entries to guarantee readable fallback output (no undefined fragments), then run targeted tests.

## Must-Haves

- [ ] Floor-change instruction strings include explicit `up` or `down` language for stairs/elevator/ramp transitions.
- [ ] Every generated `DirectionStep` includes `floorId` and `floorNumber`.
- [ ] Up/down direction is derived from floor-number semantics when `floorMap` is available.
- [ ] Missing `floorMap` data falls back safely to `floorId` values without crashing or malformed text.

## Verification

- `npm test -- src/client/hooks/useRouteDirections.test.ts`
- `npm test -- src/client/hooks/useRouteDirections.test.ts -t "falls back to floorId when floorMap is missing"`

## Observability Impact

- Signals added/changed: floor metadata is explicit in each generated direction step; floor-change instruction text now encodes movement direction.
- How a future agent inspects this: run `src/client/hooks/useRouteDirections.test.ts` and inspect assertion diffs for instruction text and metadata mismatches.
- Failure state exposed: regressions surface as deterministic assertion failures (`missing up/down`, wrong `floorNumber`, or fallback text breakage).

## Inputs

- `src/client/hooks/useRouteDirections.ts` — existing direction generation logic and `DirectionStep` contract.
- `src/client/hooks/useRouteDirections.test.ts` — baseline tests to extend for R005 and fallback diagnostics.

## Expected Output

- `src/client/hooks/useRouteDirections.ts` — updated floor-aware step contract and up/down floor-change instruction generation.
- `src/client/hooks/useRouteDirections.test.ts` — assertions covering up/down wording, floor-order semantics, and missing-floor-map fallback.
