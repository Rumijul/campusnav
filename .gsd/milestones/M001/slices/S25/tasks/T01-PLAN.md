---
estimated_steps: 4
estimated_files: 3
skills_used:
  - test
---

# T01: Add atomic connector link/unlink service and protected admin endpoint

**Slice:** S25 — Admin Floor Connector Visual Linking — Replace manual node ID entry with dropdown Based bidirectional connector linking in the admin editor
**Milestone:** M001

## Description

Create the server-side contract that enforces reciprocal cross-floor connector integrity. This task introduces one transactional write path for link/relink/unlink and exposes structured validation failures so the client can diagnose and display actionable errors.

## Steps

1. Create `src/server/connectorLinking.ts` with connector-type guards, request parsing helpers, and a transaction function that validates source/target compatibility (same building, opposite floor direction, connector-only) and computes reciprocal updates.
2. Implement link/relink/unlink persistence logic that updates both source and counterpart rows together, including `connectsToNodeAboveId`/`connectsToNodeBelowId` and `connectsToFloorAboveId`/`connectsToFloorBelowId`, while clearing stale prior counterparts.
3. Wire a new JWT-protected `POST /api/admin/connectors/link` route in `src/server/index.ts` that calls the service and returns `{ ok: true, updatedNodes }` on success or `{ errorCode, error }` with stable 4xx statuses on validation failures.
4. Add `src/server/connectorLinking.test.ts` covering happy-path link, relink cleanup, unlink cleanup, and invalid target scenarios (same floor, wrong direction, cross-building) that must not mutate state.

## Must-Haves

- [ ] One call can never persist only one side of a connector pair; reciprocal node + floor fields are always updated in the same transaction.
- [ ] Relinking a connector clears old reciprocal references from both formerly-linked nodes.
- [ ] Validation failures return deterministic `errorCode` values and leave connector linkage unchanged.

## Verification

- `npm test -- src/server/connectorLinking.test.ts`
- `npm test -- src/server/connectorLinking.test.ts -t "returns LINK_VALIDATION_ERROR when direction/floor pairing is invalid"`

## Observability Impact

- Signals added/changed: structured API failures from `/api/admin/connectors/link` (`errorCode`, `error`) and success payloads containing `updatedNodes`.
- How a future agent inspects this: run `npm test -- src/server/connectorLinking.test.ts`; inspect `/api/admin/connectors/link` response payload in network logs during admin linking actions.
- Failure state exposed: invalid direction/same-floor/cross-building requests are explicit 4xx responses instead of silent one-sided writes.

## Inputs

- `src/server/index.ts` — existing admin route composition and JWT guard.
- `src/server/db/schema.ts` — node/floor connector columns and FK relationships.
- `src/shared/types.ts` — connector field/type contracts used by server request/response logic.

## Expected Output

- `src/server/connectorLinking.ts` — transactional connector link/unlink service + validation helpers.
- `src/server/index.ts` — new `POST /api/admin/connectors/link` endpoint wired to the service.
- `src/server/connectorLinking.test.ts` — unit tests for atomic link/relink/unlink + failure diagnostics.
