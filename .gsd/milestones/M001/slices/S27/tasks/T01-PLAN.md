---
estimated_steps: 4
estimated_files: 3
skills_used:
  - test
  - react-best-practices
---

# T01: Capture checkpoint evidence and implement shared GPS projection/snap helpers

**Slice:** S27 — Student GPS Dot — Browser Geolocation Powered "you are here" dot with accuracy ring, nearest Node snap, and graceful fallback
**Milestone:** M001

## Description

Satisfy the process-governance gate first, then build the pure GPS math foundation for projection, accuracy scaling, and nearest-node snapping. This task creates the reusable helper contract that all runtime/UI wiring will consume.

## Steps

1. Create a checkpoint commit before implementation edits and write `.gsd/milestones/M001/slices/S27/S27-CHECKPOINT.md` with `checkpoint_commit`, timestamp, and one-line intent note.
2. Add `src/shared/gps.ts` helpers for bounds-aware lat/lng projection to normalized coordinates (with Y-axis inversion), in-bounds checks, and accuracy-meter to map-pixel radius conversion.
3. Add nearest-walkable-node helper logic in `src/shared/gps.ts` using floor-scoped node/edge inputs so snapping is deterministic and graph-consistent.
4. Add `src/shared/gps.test.ts` coverage for projection correctness, >50m confidence gating helpers, and nearest-node selection edge cases (no candidates, tie ordering, out-of-bounds fix).

## Must-Haves

- [ ] `.gsd/milestones/M001/slices/S27/S27-CHECKPOINT.md` exists and records a resolvable Git commit hash created before S27 implementation edits.
- [ ] Shared GPS helpers are pure/deterministic and enforce the same coordinate semantics for every consumer.
- [ ] Unit tests cover both success and failure-path math behaviors needed by downstream UI/runtime tasks.

## Verification

- `test -f .gsd/milestones/M001/slices/S27/S27-CHECKPOINT.md`
- `bash -lc 'hash=$(awk "/^checkpoint_commit:/ { print $2 }" .gsd/milestones/M001/slices/S27/S27-CHECKPOINT.md); test -n "$hash" && git cat-file -e "${hash}^{commit}"'`
- `npm test -- src/shared/gps.test.ts`

## Inputs

- `.gsd/REQUIREMENTS.md` — active requirement targets for R011–R015 and R022.
- `.gsd/DECISIONS.md` — D005/D006 constraints to keep helper logic pure and process gate explicit.
- `.gsd/milestones/M001/slices/S27/S27-PLAN.md` — slice contract and verification matrix.
- `src/shared/types.ts` — `NavFloorGpsBounds`, `NavNode`, and floor metadata contracts.
- `src/shared/pathfinding/graph-builder.ts` — existing distance-calculation semantics to stay aligned with route graph behavior.

## Expected Output

- `.gsd/milestones/M001/slices/S27/S27-CHECKPOINT.md` — checkpoint commit evidence for R022.
- `src/shared/gps.ts` — pure projection, accuracy, and nearest-node helpers.
- `src/shared/gps.test.ts` — passing unit coverage for helper correctness and edge cases.

## Observability Impact

- Signals introduced/clarified: deterministic helper outputs for projection validity, confidence gating (`<=50m` vs `>50m`), and nearest-node snap resolution (`nodeId` selected vs `null`).
- Inspection path for future tasks: `src/shared/gps.test.ts` assertions become the canonical diagnostic surface for out-of-bounds fixes, low-confidence suppression, and no-candidate snap outcomes.
- Failure visibility: helpers return explicit null/false outcomes for unusable fixes so UI layers can expose fallback copy without logging raw latitude/longitude.
