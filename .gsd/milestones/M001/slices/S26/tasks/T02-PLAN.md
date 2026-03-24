---
estimated_steps: 5
estimated_files: 3
skills_used:
  - drizzle-orm
  - test
---

# T02: Implement protected floor GPS bounds update endpoint with deterministic validation diagnostics

**Slice:** S26 — Admin GPS Bounds Configuration — Schema, API endpoint, and admin form for configuring real World lat/lng bounding boxes per floor and campus map
**Milestone:** M001

## Description

Add the authoritative server mutation path for floor GPS bounds. This task introduces a JWT-protected floor-scoped endpoint that accepts full-tuple set/clear operations, enforces ordering rules, and returns deterministic error diagnostics for invalid requests.

## Steps

1. Extend `src/server/floorGpsBounds.ts` with request parsing/validation helpers for full numeric tuple or full-null tuple payloads and stable error-code modeling.
2. Implement floor lookup + typed Drizzle update logic (`update(...).set(...).where(eq(...))`) returning normalized authoritative response data.
3. Add `PUT /api/admin/floors/:id/gps-bounds` route in `src/server/index.ts` under existing JWT admin guard and wire it to the floor GPS bounds service.
4. Ensure failure-path responses use deterministic status/errorCode pairs (invalid JSON/body, incomplete tuple, invalid ordering, floor not found) and do not persist partial state.
5. Extend `src/server/floorGpsBounds.test.ts` for success (set + clear) and failure-path assertions, including explicit invalid range diagnostics.

## Must-Haves

- [ ] Endpoint accepts only complete tuple updates or complete clears; partial null/number mixes are rejected.
- [ ] Validation enforces `minLat < maxLat` and `minLng < maxLng` before any write.
- [ ] Error payloads are deterministic and inspectable (`errorCode`, `error`, status), with no state mutation on rejected requests.

## Verification

- `npm test -- src/server/floorGpsBounds.test.ts`
- `npm test -- src/server/floorGpsBounds.test.ts -t "returns BOUNDS_RANGE_INVALID when min/max ordering is invalid"`

## Observability Impact

- Signals added/changed: `PUT /api/admin/floors/:id/gps-bounds` success (`ok`, `floorId`, `gpsBounds`) and structured failure diagnostics (`errorCode`, `error`).
- How a future agent inspects this: run targeted server test suite and inspect admin network responses for deterministic 4xx/5xx payloads.
- Failure state exposed: invalid ordering/incomplete tuples produce explicit machine-readable errors instead of silent write failures.

## Inputs

- `src/server/floorGpsBounds.ts` — tuple normalization helpers from T01.
- `src/server/index.ts` — route wiring surface with admin JWT middleware.
- `src/server/db/schema.ts` — floor GPS bounds columns and floor identifier source.
- `src/server/floorGpsBounds.test.ts` — baseline tests to extend with endpoint/service mutation behavior.

## Expected Output

- `src/server/floorGpsBounds.ts` — validated mutation service + deterministic error model.
- `src/server/index.ts` — protected `PUT /api/admin/floors/:id/gps-bounds` endpoint.
- `src/server/floorGpsBounds.test.ts` — passing tests for set/clear success and failure diagnostics.
