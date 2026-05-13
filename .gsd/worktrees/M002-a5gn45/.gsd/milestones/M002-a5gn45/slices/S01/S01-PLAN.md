# S01: Native app runtime + backend graph contract bootstrap

**Goal:** Establish the mobile foundation for CampusNav with an Expo-based iOS/Android runtime that launches without sign-in, consumes live backend graph/image contracts, and exposes baseline map pan/zoom/rotate primitives over normalized campus/floor coordinates.
**Demo:** After this: iOS and Android app shells launch on-device, load live CampusNav graph/image data, and support baseline map interaction primitives.

## Must-Haves

- **R023:** A dedicated `mobile/` native runtime package exists with install/run scripts for iOS + Android (`start`, `ios`, `android`) plus local `typecheck`/`test` verification commands.
- **R024:** App launch remains visitor-first (no auth gate) and enters a no-login bootstrap flow that loads map graph/image data from backend read APIs.
- `mobile/data/mapApiClient.ts` defines the typed contract for `/api/map`, `/api/floor-plan/:buildingId/:floorNumber`, and `/api/campus/image`, including structured failure metadata.
- `mobile/domain/navGraph.ts` normalizes backend payloads into lookup-friendly mobile selectors while preserving connector/floor/accessibility invariants.
- `mobile/map/MapViewport.tsx` provides baseline pan/zoom/rotate interaction primitives with tested transform math and stable coordinate mapping.

## Proof Level

- This slice proves: integration
- Real runtime required: yes
- Human/UAT required: no

## Verification

- `npm --prefix mobile run typecheck`
- `npm --prefix mobile run test -- mobile/bootstrap/appBootstrap.test.ts mobile/data/mapApiClient.test.ts mobile/domain/navGraph.test.ts mobile/map/mapTransform.test.ts mobile/bootstrap/mapBootstrapState.test.ts`
- `npm --prefix mobile run test -- mobile/data/mapApiClient.test.ts -t "surfaces endpoint and status on request failure"`
- `npx hono request src/server/index.ts -P /api/map > /dev/null`
- `npx hono request src/server/index.ts -P /api/campus/image > /dev/null`
- `npm run typecheck`

## Observability / Diagnostics

- Runtime signals: mobile bootstrap state transitions (`idle`, `loading`, `ready`, `error`), contract fetch phase (`map`, `floor-image`, `campus-image`), and structured API failure metadata (`endpoint`, `status`, `reason`, `attempt`).
- Inspection surfaces: focused mobile Vitest suites (`appBootstrap`, `mapApiClient`, `navGraph`, `mapTransform`, `mapBootstrapState`) plus app-shell startup state rendering.
- Failure visibility: startup failures expose the last failed phase/endpoint and user-visible fallback state instead of silent blank-map behavior.
- Redaction constraints: diagnostics must never expose raw secret values or auth tokens; only endpoint paths/status codes and derived state are logged/tested.

## Integration Closure

- Upstream surfaces consumed: `src/server/index.ts` read APIs (`/api/map`, `/api/floor-plan/:buildingId/:floorNumber`, `/api/campus/image`) and `src/shared/types.ts` `NavGraph` semantics.
- New wiring introduced in this slice: `mobile/App.tsx` bootstrap → `mobile/data/mapApiClient.ts` fetch contracts → `mobile/domain/navGraph.ts` normalization → `mobile/map/MapViewport.tsx` interaction layer.
- What remains before the milestone is truly usable end-to-end: trip setup parity, live foreground progression, confidence gating, reroute engine behavior, and visitor guidance UX polish (S02–S05).

## Tasks

- [ ] **T01: Scaffold Expo mobile runtime with no-login bootstrap shell and task-local test harness** `est:2h`
  - Why: Retire the highest S01 risk first by proving a runnable native shell and executable mobile-local test surface.
  - Files: `mobile/package.json`, `mobile/app.json`, `mobile/tsconfig.json`, `mobile/babel.config.js`, `mobile/App.tsx`, `mobile/vitest.config.ts`, `mobile/bootstrap/appBootstrap.test.ts`, `mobile/.env.example`
  - Do: Create an Expo TypeScript `mobile/` package with `start/ios/android/typecheck/test` scripts, add `EXPO_PUBLIC_API_BASE_URL` env wiring and docs, implement a no-login bootstrap shell with explicit loading/error states, and add initial app bootstrap tests.
  - Verify: `npm --prefix mobile run typecheck && npm --prefix mobile run test -- mobile/bootstrap/appBootstrap.test.ts`
  - Done when: `mobile/` can be type-checked/tested independently and app bootstrap exposes deterministic visitor-first startup states without authentication.

- [ ] **T02: Implement typed map API client and mobile NavGraph normalization contract** `est:2h`
  - Why: S02+ depends on a stable mobile contract seam that mirrors backend graph/image APIs and preserves routing invariants.
  - Files: `mobile/data/mapApiClient.ts`, `mobile/data/mapApiClient.test.ts`, `mobile/domain/navGraph.ts`, `mobile/domain/navGraph.test.ts`, `mobile/domain/navGraphSchema.ts`
  - Do: Implement typed map/image fetchers with retry/cancel/error metadata, build graph normalization/selectors preserving connector and accessibility semantics, and add invariant/error-path tests plus backend contract smoke coverage.
  - Verify: `npm --prefix mobile run test -- mobile/data/mapApiClient.test.ts mobile/domain/navGraph.test.ts && npx hono request src/server/index.ts -P /api/map > /dev/null`
  - Done when: mobile contract/domain modules pass focused tests and consume live backend map payloads with explicit diagnosable failure reasons.

- [ ] **T03: Deliver map viewport pan/zoom/rotate primitives and wire live data bootstrap flow** `est:2.5h`
  - Why: The slice demo is only true once the app shell renders live backend data and supports baseline interaction primitives on-device.
  - Files: `mobile/map/mapTransform.ts`, `mobile/map/mapTransform.test.ts`, `mobile/map/MapViewport.tsx`, `mobile/bootstrap/mapBootstrapState.ts`, `mobile/bootstrap/mapBootstrapState.test.ts`, `mobile/App.tsx`
  - Do: Add tested transform helpers, implement `MapViewport` gesture primitives, build startup orchestration state that combines `mapApiClient` + `navGraph`, and wire `App.tsx` to render live map data with explicit error fallback.
  - Verify: `npm --prefix mobile run test -- mobile/map/mapTransform.test.ts mobile/bootstrap/mapBootstrapState.test.ts && npm --prefix mobile run typecheck && npm run typecheck`
  - Done when: app bootstrap renders live map payloads through `MapViewport`, supports baseline pan/zoom/rotate behavior, and exposes deterministic failure states covered by tests.

## Files Likely Touched

- `mobile/package.json`
- `mobile/app.json`
- `mobile/tsconfig.json`
- `mobile/babel.config.js`
- `mobile/.env.example`
- `mobile/vitest.config.ts`
- `mobile/App.tsx`
- `mobile/bootstrap/appBootstrap.test.ts`
- `mobile/data/mapApiClient.ts`
- `mobile/data/mapApiClient.test.ts`
- `mobile/domain/navGraph.ts`
- `mobile/domain/navGraph.test.ts`
- `mobile/domain/navGraphSchema.ts`
- `mobile/map/mapTransform.ts`
- `mobile/map/mapTransform.test.ts`
- `mobile/map/MapViewport.tsx`
- `mobile/bootstrap/mapBootstrapState.ts`
- `mobile/bootstrap/mapBootstrapState.test.ts`
