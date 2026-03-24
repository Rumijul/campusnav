---
estimated_steps: 5
estimated_files: 5
skills_used:
  - react-best-practices
  - test
---

# T02: Wire connector dropdown UX into the admin side panel and editor state

**Slice:** S25 — Admin Floor Connector Visual Linking — Replace manual node ID entry with dropdown Based bidirectional connector linking in the admin editor
**Milestone:** M001

## Description

Deliver the admin-facing connector linking experience. This task adds dropdown candidate computation, side-panel controls for above/below linking (with unlink), and client-side state synchronization from the atomic backend response.

## Steps

1. Add `src/client/components/admin/connectorLinking.ts` with pure helpers that derive above/below candidate lists from `navGraph` using map-based lookups (same building, adjacent floor, connector node types) and patch `updatedNodes` payloads back into `navGraph`/active-floor nodes.
2. Update `src/client/pages/admin/MapEditorCanvas.tsx` to compute connector context for the selected node, call `POST /api/admin/connectors/link` for link/unlink actions, and apply returned node patches to both local active-floor state and cached multi-floor graph state.
3. Extend `src/client/components/admin/EditorSidePanel.tsx` props and rendering with a connector-only “Floor Connections” section that includes Above/Below dropdowns, explicit unlink option, and inline error text from failed API calls.
4. Add `src/client/components/admin/connectorLinking.test.ts` for candidate filtering + graph patch logic and `src/client/components/admin/EditorSidePanel.connector.test.tsx` for connector-section rendering/option visibility safeguards.
5. Run targeted client tests plus floor-connector regression checks to ensure adjacent-floor elevator behavior remains intact.

## Must-Haves

- [ ] Connector nodes (`stairs`, `elevator`, `ramp`) show dropdown-based above/below linking controls; non-connector nodes do not.
- [ ] Dropdown options are restricted to valid reciprocal candidates (same building + adjacent floor + connector type) and include unlink capability.
- [ ] Failed link requests show inline diagnostics and do not desynchronize displayed connector linkage state.

## Verification

- `npm test -- src/client/components/admin/connectorLinking.test.ts`
- `npm test -- src/client/components/admin/EditorSidePanel.connector.test.tsx src/client/hooks/useFloorFiltering.test.ts`

## Observability Impact

- Signals added/changed: side-panel connector error state mirrors backend `errorCode/error` responses.
- How a future agent inspects this: run the targeted Vitest files and inspect the connector section + network response in admin editor devtools.
- Failure state exposed: invalid selections surface actionable inline error text while previously-saved link values remain unchanged.

## Inputs

- `src/client/pages/admin/MapEditorCanvas.tsx` — existing selected-node handling and side-panel callback wiring.
- `src/client/components/admin/EditorSidePanel.tsx` — node property panel to extend with floor-connection controls.
- `src/shared/types.ts` — connector fields and node types used by candidate derivation and display.
- `src/server/connectorLinking.ts` — response contract (`updatedNodes`, `errorCode`) introduced by T01.

## Expected Output

- `src/client/components/admin/connectorLinking.ts` — candidate derivation and graph patch helpers.
- `src/client/components/admin/connectorLinking.test.ts` — unit tests for candidate rules and reciprocal patch behavior.
- `src/client/components/admin/EditorSidePanel.tsx` — connector dropdown/unlink UI with inline validation feedback.
- `src/client/components/admin/EditorSidePanel.connector.test.tsx` — rendering tests for floor-connection controls.
- `src/client/pages/admin/MapEditorCanvas.tsx` — endpoint integration + state synchronization wiring.
