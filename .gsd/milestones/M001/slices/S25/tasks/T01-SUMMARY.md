---
id: T01
parent: S25
milestone: M001
provides:
  - Transactional connector link/relink/unlink backend path that enforces reciprocal above/below metadata integrity.
  - JWT-protected POST /api/admin/connectors/link endpoint with structured success and deterministic 4xx validation failures.
  - Server-side regression tests for happy paths plus non-mutating invalid scenarios.
key_files:
  - src/server/connectorLinking.ts
  - src/server/index.ts
  - src/server/connectorLinking.test.ts
  - .gsd/KNOWLEDGE.md
key_decisions:
  - Implemented the D002 endpoint strategy with a store/transaction abstraction so rollback semantics can be unit-tested without a live DB.
patterns_established:
  - Build server write-path logic behind an injected transaction store interface to test atomic cleanup behavior deterministically.
observability_surfaces:
  - POST /api/admin/connectors/link -> { ok: true, updatedNodes } on success.
  - POST /api/admin/connectors/link -> { errorCode, error } on validation failures.
  - src/server/connectorLinking.test.ts assertions for LINK_VALIDATION_ERROR and unchanged state snapshots.
duration: 1h 20m
verification_result: passed
completed_at: 2026-03-24
blocker_discovered: false
---

# T01: Add atomic connector link/unlink service and protected admin endpoint

**Added a transactional connector linking backend with reciprocal stale-link cleanup, a protected `/api/admin/connectors/link` endpoint, and rollback-safe server tests.**

## What Happened

Implemented `src/server/connectorLinking.ts` as the atomic source of truth for connector link/relink/unlink behavior. The service now:

- validates request shape (`sourceNodeId`, `direction`, optional/null `targetNodeId`),
- enforces connector-only linking (`stairs`/`elevator`/`ramp`),
- enforces same-building + adjacent-floor + direction/floor pairing correctness,
- performs source/counterpart/stale-counterpart updates in one transaction,
- returns deterministic error codes via `ConnectorLinkingError`.

Wired `POST /api/admin/connectors/link` in `src/server/index.ts` (JWT-protected under `/api/admin/*`) to return:

- success: `{ ok: true, updatedNodes }`
- failure: `{ errorCode, error }` with stable 4xx statuses for validation/not-found paths.

Added `src/server/connectorLinking.test.ts` with in-memory transactional store tests covering link, relink cleanup, unlink cleanup, wrong-direction, same-floor, cross-building, and non-connector target rejection with state rollback assertions.

## Must-Have Coverage

- [x] One call can never persist only one side of a connector pair; reciprocal node + floor fields are updated together in a single transaction path.
- [x] Relinking clears old reciprocal references from both formerly linked/displaced nodes.
- [x] Validation failures return deterministic `errorCode` values (`LINK_VALIDATION_ERROR`, etc.) and leave linkage state unchanged.

## Verification

Task-level verification commands passed. Slice-level verification was also executed: backend checks passed; client connector test files are not present until T02, so those two checks currently fail with “No test files found” (expected at this intermediate point).

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm test -- src/server/connectorLinking.test.ts` | 0 | ✅ pass | 611ms |
| 2 | `npm test -- src/client/components/admin/connectorLinking.test.ts` | 1 | ❌ fail (test file not created yet; planned for T02) | n/a (vitest exited early) |
| 3 | `npm test -- src/client/components/admin/EditorSidePanel.connector.test.tsx` | 1 | ❌ fail (test file not created yet; planned for T02) | n/a (vitest exited early) |
| 4 | `npm test -- src/server/connectorLinking.test.ts -t "returns LINK_VALIDATION_ERROR when direction/floor pairing is invalid"` | 0 | ✅ pass | 601ms |
| 5 | `npm test` | 0 | ✅ pass | 664ms |

## Diagnostics

- Success inspection surface: call `/api/admin/connectors/link` with valid payload and inspect `ok` + `updatedNodes` in response JSON.
- Failure inspection surface: invalid same-floor/cross-building/wrong-direction payloads return `{ errorCode: "LINK_VALIDATION_ERROR", error }`.
- Automated inspection: `npm test -- src/server/connectorLinking.test.ts` exercises successful linking and non-mutating failure scenarios.

## Deviations

None.

## Known Issues

- Slice-level client verification commands for `src/client/components/admin/connectorLinking.test.ts` and `src/client/components/admin/EditorSidePanel.connector.test.tsx` fail because those tests are intentionally introduced in T02.

## Files Created/Modified

- `src/server/connectorLinking.ts` — new transactional connector linking service, validation helpers, request parsing, and structured error model.
- `src/server/index.ts` — new protected `POST /api/admin/connectors/link` route wiring to the service and stable JSON error/success responses.
- `src/server/connectorLinking.test.ts` — unit tests for atomic link/relink/unlink and invalid non-mutating scenarios.
- `.gsd/KNOWLEDGE.md` — added Hono status-typing gotcha for strict TypeScript route handlers.
- `.gsd/milestones/M001/slices/S25/S25-PLAN.md` — marked T01 as complete.
