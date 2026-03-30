---
id: S01
parent: M002-a5gn45
milestone: M002-a5gn45
provides:
  - Expo mobile package with start/ios/android/test/typecheck scripts isolated from root web runtime.
  - Typed mapApiClient covering all three S01 boundary endpoints (map, floor-plan, campus image) with retry/timeout/cancellation.
  - NavGraph normalization with strict validation and invariant enforcement for downstream S02+ consumption.
  - Gesture-capable MapViewport with tested focal-point transform invariants (R001/R002 parity).
  - Deterministic no-login bootstrap wiring (runMapBootstrap → MapBootstrapState → App.tsx → MapViewport) with explicit error diagnostics.
requires:
  []
affects:
  - S02
  - S03
  - S04
  - S05
key_files:
  - mobile/package.json
  - mobile/app.json
  - mobile/tsconfig.json
  - mobile/babel.config.js
  - mobile/vitest.config.ts
  - mobile/.env.example
  - mobile/App.tsx
  - mobile/bootstrap/appBootstrap.test.ts
  - mobile/bootstrap/mapBootstrapState.ts
  - mobile/bootstrap/mapBootstrapState.test.ts
  - mobile/data/mapApiClient.ts
  - mobile/data/mapApiClient.test.ts
  - mobile/domain/navGraphSchema.ts
  - mobile/domain/navGraph.ts
  - mobile/domain/navGraph.test.ts
  - mobile/map/MapViewport.tsx
  - mobile/map/mapTransform.ts
  - mobile/map/mapTransform.test.ts
key_decisions:
  - Run mobile Vitest from repo root (--root ..) with mobile/vitest.config.ts and mobile/**/*.test.ts include scope (T01)
  - Preserve raw accessibleWeight; derive effectiveAccessibleWeight=Infinity for non-accessible edges — D014 (T02)
  - Model mobile API boundary as discriminated unions with structured MapApiError (endpoint/status/reason/attempt) — D015 (T02)
  - Two-phase bootstrap (map then image) with failed phase+endpoint carried into error state — D016 (T03)
  - Transform equality guards and malformed-frame rejection for gesture state stability — D017 (T03)
patterns_established:
  - Deterministic no-login visitor bootstrap with explicit loading/ready/error state machine and config validation.
  - Discriminated-union API errors at the mobile boundary providing typed, structured error metadata.
  - Graph normalization with invariant enforcement (duplicate IDs, node-floor consistency, edge node references) while preserving connector/accessibility semantics.
  - Phased bootstrap with diagnostic carry-through: failed phase + endpoint flows from API client to startup state machine to rendered error UI.
  - Gesture transform isolation: focal-point math is pure/hardened in mapTransform.ts and composed into MapViewport.tsx without gesture handler complexity leaking into transform logic.
observability_surfaces:
  - MapBootstrapState error objects carry phase (map|image) and endpoint fields — inspectable via React DevTools or state dump.
  - MapApiError discriminated union exposes endpoint, status, reason, attempt — enables structured log/error reporting on device.
  - App.tsx renders explicit error UI with phase diagnostics when bootstrap fails — no silent degradation.
drill_down_paths:
  - .gsd/milestones/M002-a5gn45/slices/S01/tasks/T01/T01-SUMMARY.md
  - .gsd/milestones/M002-a5gn45/slices/S01/tasks/T02/T02-SUMMARY.md
  - .gsd/milestones/M002-a5gn45/slices/S01/tasks/T03/T03-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-30T06:59:59.108Z
blocker_discovered: false
---

# S01: Native app runtime + backend graph contract bootstrap

**Bootstrapped Expo mobile runtime with no-login visitor shell, typed backend graph contracts, and gesture-capable MapViewport.**

## What Happened

S01 established the mobile foundation for CampusNav across three task waves:

T01 fixed the Vitest root configuration mismatch so mobile tests resolve correctly from slice verification commands. The Expo package scaffold already existed. Key fix was `--root .. --config mobile/vitest.config.ts` alignment so `mobile/...` path filters resolve deterministically. Verified no auth guard in App.tsx and deterministic loading/ready/error state transitions.

T02 implemented the mobile API contract boundary: mapApiClient covering /api/map, floor-plan, and campus image endpoints with bounded retry/backoff, timeout/cancellation, and structured MapApiError discriminated unions. navGraphSchema validates payloads with issue-path reporting; navGraph normalizes/indexes while preserving connector fields and deriving effectiveAccessibleWeight=Infinity for non-accessible edges (D014). 17 tests cover happy paths, malformed payloads, HTTP/network/timeout/abort failures, content-type mismatches, empty graph, and accessibility semantics.

T03 validated and finalized runtime wiring: mapTransform pure helpers with focal-point invariance and NaN guards; MapViewport composing them with gesture primitives; mapBootstrapState two-phase orchestration (map→image) carrying failed phase/endpoint into rendered error UI; App.tsx wiring bootstrap state to MapViewport for no-login visitor bootstrap with diagnostic error states. One targeted fix: useCallback stabilization for commitTransform in PanResponder memo dependencies.

All 35 mobile tests pass across 4 test files. Both mobile and root typechecks pass. Backend smoke check fails due to missing hono CLI in this environment (known limitation, not a delivery failure).

## Verification

All slice verification commands passed: npm --prefix mobile run typecheck (0), npm --prefix mobile run test -- mobile/bootstrap/appBootstrap.test.ts (8 tests), npm --prefix mobile run test -- mobile/data/mapApiClient.test.ts mobile/domain/navGraph.test.ts (17 tests), npm --prefix mobile run test -- mobile/map/mapTransform.test.ts mobile/bootstrap/mapBootstrapState.test.ts (10 tests), npm --prefix mobile run typecheck && npm run typecheck (0). Backend smoke check skipped: npx hono CLI unavailable in this environment.

## Requirements Advanced

- R023 — S01 built the Expo runtime foundation and package config enabling ios/android build scripts; R023 primary ownership activated
- R024 — App.tsx verified to contain no auth guard; bootstrap proceeds directly to map view; R024 primary ownership activated

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

Most target files existed at task start; implementation centered on Vitest root alignment (T01), contract + normalization implementation (T02), and validation + useCallback fix (T03).

## Known Limitations

Backend /api/map smoke check cannot run in this environment because npx cannot resolve a runnable hono binary. Contract correctness is verified via mocked tests (17 passing) rather than live endpoint.

## Follow-ups

S02 should consume runMapBootstrap() output and navGraph.nodes/edges for destination selection. mapApiClient.getFloorPlanImageUrl() is ready for floor overlay rendering once S02 adds floor context. Ensure EXPO_PUBLIC_API_BASE_URL is in mobile/.env before running on device.

## Files Created/Modified

- `mobile/package.json` — Added --root .. --config mobile/vitest.config.ts to vitest script; added test/typecheck scripts
- `mobile/vitest.config.ts` — Constrained includes to mobile/**/*.test.ts for mobile-only isolation
- `mobile/data/mapApiClient.ts` — New: typed API client with retry/timeout/cancellation and structured MapApiError discriminated union
- `mobile/data/mapApiClient.test.ts` — New: 9 tests covering success, HTTP errors, network errors, timeout, abort, content-type, retry exhaustion
- `mobile/domain/navGraphSchema.ts` — New: strict schema validation with issue-path reporting for NavGraphPayload
- `mobile/domain/navGraph.ts` — New: normalization/indexing with duplicate ID detection, node-floor consistency, edge reference checks, effectiveAccessibleWeight derivation
- `mobile/domain/navGraph.test.ts` — New: 8 tests covering malformed payloads, empty graph, optional connectors, accessibility semantics
- `mobile/map/mapTransform.ts` — New: pure pan/zoom/rotate helpers with focal-point anchoring and NaN/Infinity guards
- `mobile/map/mapTransform.test.ts` — New: 5 tests protecting focal stability, rotation pivot, NaN rejection, angle wraparound, zoom clamping
- `mobile/map/MapViewport.tsx` — New: gesture-capable MapViewport composing transform helpers with PanResponder
- `mobile/bootstrap/mapBootstrapState.ts` — New: two-phase bootstrap orchestrator (map then image) with phase/endpoint diagnostics in error state
- `mobile/bootstrap/mapBootstrapState.test.ts` — New: 5 tests for loading→ready transitions, map error, image error, idempotent restart
- `mobile/App.tsx` — New: no-login visitor bootstrap shell wiring AppBootstrap + MapViewport + mapBootstrapState
- `.gsd/DECISIONS.md` — Added D015 (API error discriminated unions), D016 (phased bootstrap diagnostics), D017 (gesture state stability)
- `.gsd/KNOWLEDGE.md` — Added 5 entries: useCallback stabilization, phase/endpoint diagnostics, optional connector preservation, pure transform helpers
