---
id: S25
parent: M001
milestone: M001
provides:
  - Admin connector nodes now use dropdown-based Above/Below linking (with Unlink) instead of manual node-ID entry.
  - A protected transactional connector-link endpoint guarantees reciprocal link/relink/unlink updates and stale-link cleanup in one write path.
  - Server-authoritative `updatedNodes` patching keeps active-floor editor state and cached multi-floor `navGraph` synchronized.
requires:
  - slice: S24
    provides: Stable multi-floor graph/floor metadata and admin editor baseline used to derive adjacent-floor connector candidates.
affects:
  - S26
  - S27
key_files:
  - src/server/connectorLinking.ts
  - src/server/index.ts
  - src/server/connectorLinking.test.ts
  - src/client/components/admin/connectorLinking.ts
  - src/client/components/admin/EditorSidePanel.tsx
  - src/client/components/admin/EditorSidePanel.connector.test.tsx
  - src/client/pages/admin/MapEditorCanvas.tsx
  - src/client/hooks/useEditorState.ts
  - src/client/components/admin/connectorLinking.test.ts
  - .gsd/REQUIREMENTS.md
  - .gsd/DECISIONS.md
  - .gsd/KNOWLEDGE.md
  - .gsd/milestones/M001/M001-ROADMAP.md
  - .gsd/PROJECT.md
key_decisions:
  - D002: implement connector linking through dedicated protected endpoint `POST /api/admin/connectors/link` with transactional reciprocal writes.
  - D003: treat connector updates as server-authoritative and apply full-node replacement (`REPLACE_NODES`) instead of partial merges.
patterns_established:
  - Validate connector links by graph semantics (same building, adjacent floor, direction-consistent, connector-only) before any writes.
  - Represent connector mutations as transactional patch sets that include source, counterpart, and stale-link cleanup nodes.
  - Apply backend `updatedNodes` patches to both active-floor state and cached graph state to avoid UI/data drift.
observability_surfaces:
  - `POST /api/admin/connectors/link` success payload: `{ ok: true, updatedNodes }`.
  - `POST /api/admin/connectors/link` validation payload: `{ errorCode, error }` with deterministic 4xx codes.
  - `EditorSidePanel` inline connector diagnostics (`connectorLinkError`) rendered as alert text.
  - `npm test -- src/server/connectorLinking.test.ts`
  - `npm test -- src/client/components/admin/connectorLinking.test.ts`
  - `npm test -- src/client/components/admin/EditorSidePanel.connector.test.tsx`
  - `npm test -- src/server/connectorLinking.test.ts -t "returns LINK_VALIDATION_ERROR when direction/floor pairing is invalid"`
  - `npm test`
drill_down_paths:
  - .gsd/milestones/M001/slices/S25/tasks/T01-SUMMARY.md
  - .gsd/milestones/M001/slices/S25/tasks/T02-SUMMARY.md
duration: 3h 20m
verification_result: passed
completed_at: 2026-03-24
---

# S25: Admin Floor Connector Visual Linking — Replace manual node ID entry with dropdown Based bidirectional connector linking in the admin editor

**Shipped end-to-end admin floor-connector visual linking: connector nodes now link/unlink through Above/Below dropdowns, and every connector write is atomically reciprocal with deterministic validation feedback.**

## What Happened

S25 completed the connector-link workflow across backend integrity, UI controls, and local editor synchronization.

- **T01 (server integrity path):** added `linkConnectorNodes` transactional logic and protected `POST /api/admin/connectors/link`. The service validates request shape and connector compatibility (same building, adjacent floors, direction correctness, connector types only), then applies source + counterpart + stale-link cleanup updates as one transaction.
- **T02 (admin editor UX + state wiring):** removed manual connector-ID entry behavior in favor of connector-only Above/Below dropdown controls with explicit Unlink affordances in `EditorSidePanel`.
- **State consistency closure:** `MapEditorCanvas` now calls the connector endpoint and applies server `updatedNodes` to both active floor nodes and cached `navGraph`. `useEditorState` gained `REPLACE_NODES` so unlink responses can truly clear optional connector fields.
- **Requirements closure:** R006, R007, and R008 were moved from Active to Validated with test-backed proof in `.gsd/REQUIREMENTS.md`.

## Verification

All slice-plan verification commands passed during closure:

- `npm test -- src/server/connectorLinking.test.ts` ✅
- `npm test -- src/client/components/admin/connectorLinking.test.ts` ✅
- `npm test -- src/client/components/admin/EditorSidePanel.connector.test.tsx` ✅
- `npm test -- src/server/connectorLinking.test.ts -t "returns LINK_VALIDATION_ERROR when direction/floor pairing is invalid"` ✅
- `npm test` ✅

Observability surfaces were confirmed through these checks:

- server success/failure payload contract is enforced in route/service code and exercised by connector-link tests,
- inline connector validation diagnostics are rendered in `EditorSidePanel` and asserted in `EditorSidePanel.connector.test.tsx`,
- invalid link attempts remain non-mutating (snapshot equality assertions in server tests).

## New Requirements Surfaced

- none

## Deviations

One intentional implementation deviation from the original file list: `src/client/hooks/useEditorState.ts` was extended with `REPLACE_NODES` to support lossless server-driven unlink/relink patches. This was necessary to avoid stale optional connector fields after unlink operations.

## Known Limitations

- No live browser UAT was executed in this worktree; closure remained artifact-driven because this environment has known Vite runtime instability under Node v25.
- Endpoint behavior is strongly covered by service-level tests and route contract inspection, but not by a dedicated HTTP integration test that boots the full authenticated server stack.

## Follow-ups

- Add a future server integration test for `/api/admin/connectors/link` at the HTTP layer (JWT-protected request/response contract) when stable runtime harness support is available.
- S26 should reuse the same server-authoritative patching pattern for any cross-floor metadata writes to prevent local optimistic drift.

## Files Created/Modified

- `src/server/connectorLinking.ts` — added transactional link/relink/unlink service, validation, structured error model, and request parsing.
- `src/server/index.ts` — added protected `POST /api/admin/connectors/link` route returning deterministic success/error payloads.
- `src/server/connectorLinking.test.ts` — added atomic reciprocity, relink cleanup, unlink cleanup, and invalid non-mutating regression coverage.
- `src/client/components/admin/connectorLinking.ts` — added candidate derivation + server patch application helpers.
- `src/client/pages/admin/MapEditorCanvas.tsx` — wired connector endpoint calls, inline error handling, and patch sync into editor state and cached graph.
- `src/client/components/admin/EditorSidePanel.tsx` — added connector-only Floor Connections dropdown UI with Unlink options and inline diagnostics.
- `src/client/components/admin/connectorLinking.test.ts` — added unit tests for candidate filtering and node/graph patch behavior.
- `src/client/components/admin/EditorSidePanel.connector.test.tsx` — added side-panel rendering tests for connector controls and error text.
- `src/client/hooks/useEditorState.ts` — added `REPLACE_NODES` reducer action for server-authoritative node replacement.
- `.gsd/REQUIREMENTS.md` — moved R006/R007/R008 to validated with explicit proof.
- `.gsd/DECISIONS.md` — recorded D003 state-application decision.
- `.gsd/KNOWLEDGE.md` — captured server-authoritative connector patching guidance.
- `.gsd/milestones/M001/M001-ROADMAP.md` — marked S25 complete.
- `.gsd/PROJECT.md` — updated active milestone state to reflect connector-link completion.
- `.gsd/milestones/M001/slices/S25/S25-UAT.md` — replaced placeholder with concrete S25 UAT script.

## Forward Intelligence

### What the next slice should know
- `POST /api/admin/connectors/link` is now the only authoritative connector mutation path. Use returned `updatedNodes` for local state updates; do not infer reciprocal patches client-side.

### What's fragile
- Optional connector fields (`connectsTo*`) are fragile under partial merges — merge-based updates can leave stale links after unlink/relink cleanup.

### Authoritative diagnostics
- `src/server/connectorLinking.test.ts` is the strongest signal for atomic reciprocity and non-mutating failure behavior.
- `src/client/components/admin/EditorSidePanel.connector.test.tsx` is the fastest signal for UI regressions (dropdown visibility, Unlink affordance, inline error rendering).
- `src/client/components/admin/connectorLinking.test.ts` is the authoritative signal for candidate filtering and patch application semantics.

### What assumptions changed
- Assumption: connector metadata can be edited locally and persisted later via general graph save.
- Reality: connector link integrity requires an immediate transactional server write path and server-authoritative local patching to avoid one-sided states.
