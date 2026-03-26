# S01: Native app runtime + backend graph contract bootstrap

**Goal:** Establish the mobile foundation for CampusNav with an Expo-based iOS/Android runtime that launches without sign-in, consumes live backend graph/image contracts, and exposes baseline map pan/zoom/rotate primitives over normalized campus/floor coordinates.
**Demo:** After this: After this: iOS and Android app shells launch on-device, load live CampusNav graph/image data, and support baseline map interaction primitives.

## Tasks
- [x] **T01: Aligned mobile Vitest root/filter execution and validated the no-login Expo bootstrap harness for deterministic startup states.** — Create the native runtime baseline so later tasks can implement contracts and interactions on top of a real, testable app shell.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| Expo/Metro startup tooling | Surface deterministic startup error state and stop bootstrap | Fail startup check after bounded wait and show retry prompt | Treat invalid config shape as startup configuration failure |
| `EXPO_PUBLIC_API_BASE_URL` configuration | Render missing-config diagnostic state; never attempt relative API URLs | N/A (static config read) | Reject invalid URL format and mark bootstrap as blocked |

## Load Profile

- **Shared resources**: Metro bundler process, JS runtime initialization, startup state reducer.
- **Per-operation cost**: single bootstrap state computation per launch; no network calls yet.
- **10x breakpoint**: hot-reload/startup loops could mask deterministic state transitions if initialization is not idempotent.

## Negative Tests

- **Malformed inputs**: missing `EXPO_PUBLIC_API_BASE_URL`, non-URL base value.
- **Error paths**: startup state transitions to `error` when config validation fails.
- **Boundary conditions**: repeated bootstrap invocation remains idempotent and does not regress to auth-required state.

## Steps

1. Create an Expo TypeScript package in `mobile/` with scripts for `start`, `ios`, `android`, `typecheck`, and `test`.
2. Add runtime env wiring for `EXPO_PUBLIC_API_BASE_URL` and document it in `mobile/.env.example`.
3. Implement `mobile/App.tsx` as a no-login visitor bootstrap shell with explicit loading/error placeholders and no authentication guard.
4. Configure mobile-local Vitest and add deterministic bootstrap tests.

## Must-Haves

- [ ] Native runtime scripts exist and execute from `mobile/package.json` without touching root web runtime scripts.
- [ ] App bootstrap path contains no authentication gate and exposes deterministic startup states (`loading`, `ready`, `error`).
- [ ] Mobile-local tests run in isolation and become the base verification surface for subsequent S01 tasks.
  - Estimate: 2h
  - Files: mobile/package.json, mobile/app.json, mobile/tsconfig.json, mobile/babel.config.js, mobile/App.tsx, mobile/vitest.config.ts, mobile/bootstrap/appBootstrap.test.ts, mobile/.env.example
  - Verify: npm --prefix mobile run typecheck && npm --prefix mobile run test -- mobile/bootstrap/appBootstrap.test.ts
- [x] **T02: Implemented typed mobile map/image API contracts with retry-aware diagnostics and NavGraph schema+normalization invariants.** — Define the mobile boundary contracts that S02+ will consume by making backend fetch behavior and graph normalization explicit, typed, and test-covered.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| `GET /api/map` | Return structured client error with endpoint/status/reason | Retry with bounded backoff, then return timeout-classified error | Fail schema parse and return contract-validation error |
| Floor/campus image endpoints | Return explicit image fetch error metadata for bootstrap diagnostics | Abort request and surface timeout classification in bootstrap phase | Reject unexpected content-type and fail with typed contract error |

## Load Profile

- **Shared resources**: backend read endpoints, mobile fetch retry queue, in-memory normalized indexes.
- **Per-operation cost**: one map payload request plus optional image metadata request per bootstrap; O(nodes + edges) normalization.
- **10x breakpoint**: repeated retries and large graph payloads can increase bootstrap latency and memory if normalization does not stream/index efficiently.

## Negative Tests

- **Malformed inputs**: invalid JSON map payload, missing `buildings`, wrong floor/node field types.
- **Error paths**: HTTP 404/500, network timeout, aborted request.
- **Boundary conditions**: empty buildings list, optional connector fields absent, non-accessible edge weight semantics preserved.

## Steps

1. Implement `mobile/data/mapApiClient.ts` typed contract functions for `/api/map`, floor-plan image URLs, and campus image URL resolution.
2. Add retry/cancellation behavior and a structured API error object containing endpoint/status/reason/attempt.
3. Implement `mobile/domain/navGraphSchema.ts` and `mobile/domain/navGraph.ts` to validate/normalize payloads into lookup maps while preserving connector/accessibility semantics.
4. Add focused tests for success/failure/retry/normalization invariants and backend contract smoke checks.

## Must-Haves

- [ ] Client contract covers all S01 boundary-map endpoints and exposes typed responses/errors.
- [ ] Normalization preserves `NavGraph` invariants (optional connector fields, floor metadata, accessibility semantics).
- [ ] Contract and normalization failure paths are explicitly test-covered, not inferred.
  - Estimate: 2h
  - Files: mobile/data/mapApiClient.ts, mobile/data/mapApiClient.test.ts, mobile/domain/navGraphSchema.ts, mobile/domain/navGraph.ts, mobile/domain/navGraph.test.ts
  - Verify: npm --prefix mobile run test -- mobile/data/mapApiClient.test.ts mobile/domain/navGraph.test.ts && npx hono request src/server/index.ts -P /api/map > /dev/null
- [ ] **T03: Wire live bootstrap into MapViewport pan/zoom/rotate primitives** — Complete the slice demo by wiring real backend data into a map viewport that supports baseline map gestures and diagnosable startup failure states.

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| `mapApiClient` bootstrap calls | Transition bootstrap state to `error` with failed phase metadata | Stop waiting and expose timeout phase in startup diagnostics | Treat invalid contract result as unrecoverable bootstrap error |
| Gesture event stream (`pan/pinch/rotate`) | Ignore invalid gesture frame and keep previous stable transform | N/A (event-driven) | Clamp/normalize transform inputs to prevent NaN/drift propagation |

## Load Profile

- **Shared resources**: UI render loop, gesture handler callbacks, bootstrap state transitions.
- **Per-operation cost**: transform math per gesture frame plus one bootstrap normalization pass per app launch.
- **10x breakpoint**: high-frequency gesture events can cause jank if transform helpers allocate excessively or trigger redundant state commits.

## Negative Tests

- **Malformed inputs**: NaN/Infinity transform values, invalid rotation deltas, missing viewport dimensions.
- **Error paths**: bootstrap error phase rendering when map or image contract fetch fails.
- **Boundary conditions**: rotation wraparound at +/-180, min/max zoom clamp, idempotent restart from error to loading.

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
  - Estimate: 2.5h
  - Files: mobile/map/mapTransform.ts, mobile/map/mapTransform.test.ts, mobile/map/MapViewport.tsx, mobile/bootstrap/mapBootstrapState.ts, mobile/bootstrap/mapBootstrapState.test.ts, mobile/App.tsx
  - Verify: npm --prefix mobile run test -- mobile/map/mapTransform.test.ts mobile/bootstrap/mapBootstrapState.test.ts && npm --prefix mobile run typecheck && npm run typecheck
