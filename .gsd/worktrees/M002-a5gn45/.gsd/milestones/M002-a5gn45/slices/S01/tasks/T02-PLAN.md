---
estimated_steps: 4
estimated_files: 5
skills_used:
  - hono
  - react-best-practices
  - test
---

# T02: Implement typed map API client and mobile NavGraph normalization contract

**Slice:** S01 — Native app runtime + backend graph contract bootstrap
**Milestone:** M002-a5gn45

## Description

Define the mobile boundary contracts that S02+ will consume by making backend fetch behavior and graph normalization explicit, typed, and test-covered.

## Steps

1. Implement `mobile/data/mapApiClient.ts` typed contract functions for `/api/map`, floor-plan image URLs, and campus image URL resolution.
2. Add retry/cancellation behavior and a structured API error object containing endpoint/status/reason/attempt.
3. Implement `mobile/domain/navGraph.ts` and `mobile/domain/navGraphSchema.ts` to validate/normalize payloads into lookup maps while preserving connector/accessibility semantics.
4. Add focused tests for success/failure/retry/normalization invariants and include backend contract smoke checks via Hono request.

## Must-Haves

- [ ] Client contract covers all S01 boundary-map endpoints and exposes typed responses/errors.
- [ ] Normalization preserves `NavGraph` invariants (optional connector fields, floor metadata, accessibility semantics).
- [ ] Contract and normalization failure paths are explicitly test-covered, not inferred.

## Verification

- `npm --prefix mobile run test -- mobile/data/mapApiClient.test.ts mobile/domain/navGraph.test.ts`
- `npx hono request src/server/index.ts -P /api/map > /dev/null`

## Observability Impact

- Signals added/changed: typed API error payload (`endpoint`, `status`, `reason`, `attempt`) and schema-normalization failure reason.
- How a future agent inspects this: focused suites `mobile/data/mapApiClient.test.ts` and `mobile/domain/navGraph.test.ts`.
- Failure state exposed: endpoint or schema regressions return explicit diagnosable error objects consumable by app bootstrap UI.

## Inputs

- `mobile/package.json` — runtime/test dependencies and scripts from T01.
- `mobile/vitest.config.ts` — mobile-local test harness from T01.
- `src/server/index.ts` — authoritative `/api/map` and map-image route contracts.
- `src/shared/types.ts` — canonical `NavGraph` and connector optional-field semantics.
- `src/shared/pathfinding/graph-builder.ts` — accessibility/connector invariant behavior to preserve.

## Expected Output

- `mobile/data/mapApiClient.ts` — typed map and image endpoint contract functions.
- `mobile/data/mapApiClient.test.ts` — fetch success/retry/failure/cancellation tests.
- `mobile/domain/navGraph.ts` — normalized graph adapter/selectors.
- `mobile/domain/navGraphSchema.ts` — schema guards for map payload validation.
- `mobile/domain/navGraph.test.ts` — invariant tests for normalization correctness.
