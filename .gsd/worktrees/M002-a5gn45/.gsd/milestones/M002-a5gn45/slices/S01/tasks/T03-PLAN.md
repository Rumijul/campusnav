---
estimated_steps: 5
estimated_files: 6
skills_used:
  - react-best-practices
  - test
---

# T03: Deliver map viewport pan/zoom/rotate primitives and wire live data bootstrap flow

**Slice:** S01 — Native app runtime + backend graph contract bootstrap
**Milestone:** M002-a5gn45

## Description

Complete the slice demo by wiring real backend data into a map viewport that supports baseline map gestures and diagnosable startup failure states.

## Steps

1. Implement transform helpers in `mobile/map/mapTransform.ts` for stable pan/zoom/rotate coordinate mapping anchored to gesture focal points.
2. Add unit tests in `mobile/map/mapTransform.test.ts` that protect against focal drift and angle-wrap regressions.
3. Build `mobile/map/MapViewport.tsx` using the transform helpers and composed gesture primitives for pan/pinch/rotate.
4. Add `mobile/bootstrap/mapBootstrapState.ts` plus tests to orchestrate `mapApiClient` + `navGraph` into explicit `loading/ready/error` startup states.
5. Wire `mobile/App.tsx` to bootstrap state + `MapViewport` so startup renders live backend-backed map content with visible fallback errors.

## Must-Haves

- [ ] `MapViewport` supports baseline pan/zoom/rotate behavior with tested transform invariants.
- [ ] Startup flow uses live backend map contracts and does not regress no-login visitor entry.
- [ ] Startup failure path exposes explicit phase/endpoint diagnostics for future debugging.

## Verification

- `npm --prefix mobile run test -- mobile/map/mapTransform.test.ts mobile/bootstrap/mapBootstrapState.test.ts`
- `npm --prefix mobile run typecheck`
- `npm run typecheck`

## Observability Impact

- Signals added/changed: bootstrap fetch phase (`map`, `image`) and viewport transform state (`scale`, `rotation`, `translation`).
- How a future agent inspects this: `mobile/bootstrap/mapBootstrapState.test.ts`, `mobile/map/mapTransform.test.ts`, and rendered startup status in `mobile/App.tsx`.
- Failure state exposed: startup state carries last failed phase/endpoint so data-load issues localize quickly.

## Inputs

- `mobile/data/mapApiClient.ts` — typed backend fetchers from T02.
- `mobile/domain/navGraph.ts` — normalized graph selectors/indexes from T02.
- `mobile/App.tsx` — bootstrap shell from T01.
- `src/client/hooks/useMapViewport.ts` — existing gesture behavior reference.
- `src/client/hooks/useMapViewport.test.ts` — existing gesture invariant tests to mirror.

## Expected Output

- `mobile/map/mapTransform.ts` — gesture transform helpers.
- `mobile/map/mapTransform.test.ts` — transform invariant regression coverage.
- `mobile/map/MapViewport.tsx` — baseline map interaction component.
- `mobile/bootstrap/mapBootstrapState.ts` — startup orchestration state machine.
- `mobile/bootstrap/mapBootstrapState.test.ts` — startup state transition coverage.
- `mobile/App.tsx` — live-data bootstrap wiring for viewport runtime.
