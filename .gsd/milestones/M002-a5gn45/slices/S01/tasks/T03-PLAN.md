---
estimated_steps: 5
estimated_files: 6
skills_used:
  - vercel-react-native-skills
  - react-best-practices
  - test
---

# T03: Wire live bootstrap into MapViewport pan/zoom/rotate primitives

**Slice:** S01 — Native app runtime + backend graph contract bootstrap
**Milestone:** M002-a5gn45

## Description

Complete the slice demo by wiring real backend data into a map viewport that supports baseline map gestures and diagnosable startup failure states.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| `mapApiClient` bootstrap calls | Transition bootstrap state to `error` with failed phase metadata | Stop waiting and expose timeout phase in startup diagnostics | Treat invalid contract result as unrecoverable bootstrap error |
| Gesture event stream (`pan/pinch/rotate`) | Ignore invalid gesture frame and keep previous stable transform | N/A (event-driven) | Clamp/normalize transform inputs to prevent NaN/drift propagation |

## Load Profile

- **Shared resources**: UI render loop, gesture handler callbacks, bootstrap state transitions.
- **Per-operation cost**: Transform math per gesture frame plus one bootstrap normalization pass per app launch.
- **10x breakpoint**: High-frequency gesture events can cause jank if transform helpers allocate excessively or trigger redundant state commits.

## Negative Tests

- **Malformed inputs**: NaN/Infinity transform values, invalid rotation deltas, missing viewport dimensions.
- **Error paths**: Bootstrap error phase rendering when map or image contract fetch fails.
- **Boundary conditions**: Rotation wraparound at +/-180, min/max zoom clamp, idempotent restart from error to loading.

## Steps

1. Implement transform helpers in `mobile/map/mapTransform.ts` for stable pan/zoom/rotate coordinate mapping anchored to gesture focal points.
2. Add unit tests in `mobile/map/mapTransform.test.ts` that protect against focal drift and angle-wrap regressions.
3. Build `mobile/map/MapViewport.tsx` using transform helpers and composed gesture primitives for pan/pinch/rotate.
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
