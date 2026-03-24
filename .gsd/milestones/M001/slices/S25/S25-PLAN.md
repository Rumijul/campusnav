# S25: Admin Floor Connector Visual Linking — Replace manual node ID entry with dropdown Based bidirectional connector linking in the admin editor

**Goal:** Admins can create and remove cross-floor connector links from dropdown controls in the map editor, with reciprocal connector metadata kept consistent across floors.
**Demo:** Selecting a `stairs`/`elevator`/`ramp` node in the admin editor shows Above/Below dropdowns (no manual node ID input), and link/unlink actions update both sides atomically so no one-sided connector pair is persisted.

## Must-Haves

- **R006:** Connector nodes expose dropdown-based above/below link controls with valid adjacent-floor candidates only (same building, connector types only), replacing manual node-ID workflows.
- **R007:** Connector link writes are atomic and reciprocal (`source` + counterpart + stale-link cleanup) so one-sided cross-floor links cannot be saved.
- **R008:** Admins can remove existing connector links; unlink clears both sides (`above/below` node IDs and floor IDs).

## Proof Level

- This slice proves: integration
- Real runtime required: no
- Human/UAT required: no

## Verification

- `npm test -- src/server/connectorLinking.test.ts`
- `npm test -- src/client/components/admin/connectorLinking.test.ts`
- `npm test -- src/client/components/admin/EditorSidePanel.connector.test.tsx`
- `npm test -- src/server/connectorLinking.test.ts -t "returns LINK_VALIDATION_ERROR when direction/floor pairing is invalid"`
- `npm test`

## Observability / Diagnostics

- Runtime signals: `/api/admin/connectors/link` returns structured JSON (`ok`, `updatedNodes`) on success and (`errorCode`, `error`) on validation failures.
- Inspection surfaces: Vitest assertions in `src/server/connectorLinking.test.ts`; admin browser network response for `/api/admin/connectors/link`; inline connector-link error text in `EditorSidePanel`.
- Failure visibility: invalid same-floor/cross-building/wrong-direction requests fail with deterministic error codes and no local state mutation.
- Redaction constraints: diagnostics expose only node IDs/floor IDs and validation reasons; no auth tokens or PII in payloads.

## Integration Closure

- Upstream surfaces consumed: `src/shared/types.ts` connector fields, `src/server/db/schema.ts` connector FK columns, `src/client/pages/admin/MapEditorCanvas.tsx` editor state/save flow.
- New wiring introduced in this slice: `EditorSidePanel` connector dropdown action → `MapEditorCanvas` async handler → `POST /api/admin/connectors/link` → local `navGraph` + active-floor node patch.
- What remains before the milestone is truly usable end-to-end: nothing for connector linking; downstream milestone work continues in S26/S27 (GPS scope).

## Tasks

- [x] **T01: Add atomic connector link/unlink service and protected admin endpoint** `est:1.5h`
  - Why: R007/R008 require a single write path that always updates both sides and exposes explicit failure diagnostics instead of allowing asymmetric connector states.
  - Files: `src/server/index.ts`, `src/server/connectorLinking.ts`, `src/server/connectorLinking.test.ts`
  - Do: Implement a transactional connector-linking service for link/relink/unlink (`above`/`below`) with same-building + adjacent-floor direction validation, stale reciprocal cleanup, and structured error codes; wire it into a new JWT-protected `POST /api/admin/connectors/link` route.
  - Verify: `npm test -- src/server/connectorLinking.test.ts`
  - Done when: backend tests cover link, relink, unlink, and invalid-direction failure paths, and the endpoint returns deterministic success/error payloads.
- [x] **T02: Wire connector dropdown UX into the admin side panel and editor state** `est:2h`
  - Why: R006 requires usable dropdown-based linking in the editor, and R008 requires an unlink affordance with immediate reciprocal state sync in the UI.
  - Files: `src/client/pages/admin/MapEditorCanvas.tsx`, `src/client/components/admin/EditorSidePanel.tsx`, `src/client/components/admin/connectorLinking.ts`, `src/client/components/admin/connectorLinking.test.ts`, `src/client/components/admin/EditorSidePanel.connector.test.tsx`
  - Do: Add connector candidate derivation helpers (map-based lookups), pass above/below option sets + link handlers from `MapEditorCanvas`, render connector-only Floor Connections dropdowns with unlink option in `EditorSidePanel`, call `/api/admin/connectors/link`, patch returned node updates into active-floor state and `navGraph`, and surface inline validation errors.
  - Verify: `npm test -- src/client/components/admin/connectorLinking.test.ts src/client/components/admin/EditorSidePanel.connector.test.tsx src/client/hooks/useFloorFiltering.test.ts`
  - Done when: connector nodes can be linked/unlinked from dropdowns without manual IDs, UI reflects reciprocal updates from server responses, and regression tests pass.

## Files Likely Touched

- `src/server/index.ts`
- `src/server/connectorLinking.ts`
- `src/server/connectorLinking.test.ts`
- `src/client/pages/admin/MapEditorCanvas.tsx`
- `src/client/components/admin/EditorSidePanel.tsx`
- `src/client/components/admin/connectorLinking.ts`
- `src/client/components/admin/connectorLinking.test.ts`
- `src/client/components/admin/EditorSidePanel.connector.test.tsx`
