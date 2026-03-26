---
id: T02
parent: S01
milestone: M002-a5gn45
provides: []
requires: []
affects: []
key_files: ["mobile/data/mapApiClient.ts", "mobile/data/mapApiClient.test.ts", "mobile/domain/navGraphSchema.ts", "mobile/domain/navGraph.ts", "mobile/domain/navGraph.test.ts", ".gsd/KNOWLEDGE.md", ".gsd/milestones/M002-a5gn45/slices/S01/tasks/T02-SUMMARY.md"]
key_decisions: ["Preserve raw backend `accessibleWeight` values while deriving `effectiveAccessibleWeight` as Infinity for non-accessible edges during mobile normalization (D014).", "Model mobile API boundary results as discriminated unions with structured `MapApiError` diagnostics instead of opaque thrown strings."]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Task-level verification passed for new implementation (`mapApiClient` + `navGraph` tests and mobile/root typechecks). Slice-level command coverage was executed; expected intermediate-task failures remain for future T03 tests, and the `npx hono request` smoke command still fails in this environment due missing executable resolution."
completed_at: 2026-03-26T11:55:55.971Z
blocker_discovered: false
---

# T02: Implemented typed mobile map/image API contracts with retry-aware diagnostics and NavGraph schema+normalization invariants.

> Implemented typed mobile map/image API contracts with retry-aware diagnostics and NavGraph schema+normalization invariants.

## What Happened
---
id: T02
parent: S01
milestone: M002-a5gn45
key_files:
  - mobile/data/mapApiClient.ts
  - mobile/data/mapApiClient.test.ts
  - mobile/domain/navGraphSchema.ts
  - mobile/domain/navGraph.ts
  - mobile/domain/navGraph.test.ts
  - .gsd/KNOWLEDGE.md
  - .gsd/milestones/M002-a5gn45/slices/S01/tasks/T02-SUMMARY.md
key_decisions:
  - Preserve raw backend `accessibleWeight` values while deriving `effectiveAccessibleWeight` as Infinity for non-accessible edges during mobile normalization (D014).
  - Model mobile API boundary results as discriminated unions with structured `MapApiError` diagnostics instead of opaque thrown strings.
duration: ""
verification_result: mixed
completed_at: 2026-03-26T11:55:55.972Z
blocker_discovered: false
---

# T02: Implemented typed mobile map/image API contracts with retry-aware diagnostics and NavGraph schema+normalization invariants.

**Implemented typed mobile map/image API contracts with retry-aware diagnostics and NavGraph schema+normalization invariants.**

## What Happened

Implemented the mobile map contract boundary and normalization layer for S01. Added `mapApiClient` endpoints for `/api/map`, `/api/floor-plan/:buildingId/:floorNumber`, and `/api/campus/image` with bounded retry/backoff, timeout/cancellation handling, and typed error metadata (`endpoint`, `status`, `reason`, `attempt`, plus message/details). Added strict `navGraphSchema` validation with issue-path reporting, and `navGraph` normalization/indexing that enforces key invariants (duplicate IDs, node-floor consistency, edge node references) while preserving accessibility semantics through derived effective weights. Added focused tests covering happy paths, malformed payloads, HTTP/network/timeout/abort failures, wrong content-type handling, empty graph boundaries, optional connector fields, and non-accessible edge semantics.

## Verification

Task-level verification passed for new implementation (`mapApiClient` + `navGraph` tests and mobile/root typechecks). Slice-level command coverage was executed; expected intermediate-task failures remain for future T03 tests, and the `npx hono request` smoke command still fails in this environment due missing executable resolution.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm --prefix mobile run typecheck && npm --prefix mobile run test -- mobile/bootstrap/appBootstrap.test.ts` | 0 | ✅ pass | 1761ms |
| 2 | `npm --prefix mobile run test -- mobile/data/mapApiClient.test.ts mobile/domain/navGraph.test.ts` | 0 | ✅ pass | 781ms |
| 3 | `npx hono request src/server/index.ts -P /api/map > /dev/null` | 1 | ❌ fail | 501ms |
| 4 | `npm --prefix mobile run test -- mobile/map/mapTransform.test.ts mobile/bootstrap/mapBootstrapState.test.ts && npm --prefix mobile run typecheck && npm run typecheck` | 1 | ❌ fail | 550ms |
| 5 | `npm --prefix mobile run test -- mobile/data/mapApiClient.test.ts mobile/domain/navGraph.test.ts && npx hono request src/server/index.ts -P /api/map > /dev/null` | 1 | ❌ fail | 1274ms |
| 6 | `npm --prefix mobile run typecheck` | 0 | ✅ pass | 1138ms |
| 7 | `npm run typecheck` | 0 | ✅ pass | 2382ms |


## Deviations

None.

## Known Issues

`npx hono request src/server/index.ts -P /api/map` cannot execute in this environment because `npx` cannot resolve a runnable `hono` binary. Slice-level T03 verification command still fails as expected because T03 test files are not created yet.

## Files Created/Modified

- `mobile/data/mapApiClient.ts`
- `mobile/data/mapApiClient.test.ts`
- `mobile/domain/navGraphSchema.ts`
- `mobile/domain/navGraph.ts`
- `mobile/domain/navGraph.test.ts`
- `.gsd/KNOWLEDGE.md`
- `.gsd/milestones/M002-a5gn45/slices/S01/tasks/T02-SUMMARY.md`


## Deviations
None.

## Known Issues
`npx hono request src/server/index.ts -P /api/map` cannot execute in this environment because `npx` cannot resolve a runnable `hono` binary. Slice-level T03 verification command still fails as expected because T03 test files are not created yet.
