---
id: T02
parent: S25
milestone: M001
provides:
  - Connector-only floor-linking candidate derivation (same building, adjacent floor, connector types) for Above/Below dropdown controls.
  - Admin side-panel Floor Connections UI with explicit unlink affordances and inline backend validation diagnostics.
  - Client-side connector patch application that syncs `/api/admin/connectors/link` `updatedNodes` into both active-floor editor state and cached multi-floor `navGraph`.
key_files:
  - src/client/components/admin/connectorLinking.ts
  - src/client/pages/admin/MapEditorCanvas.tsx
  - src/client/components/admin/EditorSidePanel.tsx
  - src/client/components/admin/connectorLinking.test.ts
  - src/client/components/admin/EditorSidePanel.connector.test.tsx
  - src/client/hooks/useEditorState.ts
key_decisions:
  - Added a `REPLACE_NODES` reducer action so server-driven unlink patches can clear optional connector fields without lossy partial-merge semantics.
patterns_established:
  - Treat connector link/unlink as server-authoritative: update local editor state only from backend `updatedNodes` patches to avoid one-sided UI drift.
observability_surfaces:
  - `EditorSidePanel` now renders inline connector API diagnostics (`errorCode: error`) from `/api/admin/connectors/link` failures.
  - Targeted client tests validate candidate filtering, unlink/patch behavior, and connector-only control visibility.
duration: 2h 00m
verification_result: passed
completed_at: 2026-03-24
blocker_discovered: false
---

# T02: Wire connector dropdown UX into the admin side panel and editor state

**Added connector-only Above/Below dropdown linking with explicit unlink, backend-driven state patching, and inline validation diagnostics in the admin editor.**

## What Happened

Implemented `src/client/components/admin/connectorLinking.ts` with pure helpers to:

- derive valid Above/Below candidates using map-based floor/building lookups,
- restrict candidates to adjacent floors in the same building and connector node types,
- apply backend `updatedNodes` patches to both active-floor node arrays and the full cached `navGraph` while correctly clearing optional connector fields on unlink.

Updated `MapEditorCanvas` to:

- compute connector candidate context for the currently selected node,
- call `POST /api/admin/connectors/link` for Above/Below link/unlink actions,
- surface backend validation failures as inline side-panel error text,
- apply returned node patches to both local active-floor state and cached multi-floor graph state.

Extended `EditorSidePanel` to:

- render a connector-only **Floor Connections** section,
- show Above/Below dropdowns with explicit **Unlink** options,
- display inline connector-link API errors.

Added regression tests:

- `connectorLinking.test.ts` for candidate derivation and graph patch behavior,
- `EditorSidePanel.connector.test.tsx` for connector section rendering and visibility safeguards,
- plus existing floor filtering regression in task verification command.

## Must-Have Coverage

- [x] Connector nodes (`stairs`, `elevator`, `ramp`) show dropdown-based above/below linking controls; non-connector nodes do not.
- [x] Dropdown options are restricted to valid reciprocal candidates (same building + adjacent floor + connector type) and include unlink capability.
- [x] Failed link requests show inline diagnostics and do not desynchronize displayed connector linkage state.

## Verification

Executed both task-level and slice-level verification commands. All checks passed, including full-suite `npm test`.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm test -- src/client/components/admin/connectorLinking.test.ts` | 0 | ✅ pass | 185ms |
| 2 | `npm test -- src/client/components/admin/EditorSidePanel.connector.test.tsx src/client/hooks/useFloorFiltering.test.ts` | 0 | ✅ pass | 353ms |
| 3 | `npm test -- src/server/connectorLinking.test.ts` | 0 | ✅ pass | 528ms |
| 4 | `npm test -- src/client/components/admin/EditorSidePanel.connector.test.tsx` | 0 | ✅ pass | 247ms |
| 5 | `npm test -- src/server/connectorLinking.test.ts -t "returns LINK_VALIDATION_ERROR when direction/floor pairing is invalid"` | 0 | ✅ pass | 525ms |
| 6 | `npm test` | 0 | ✅ pass | 793ms |
| 7 | `npm test -- src/client/components/admin/connectorLinking.test.ts src/client/components/admin/EditorSidePanel.connector.test.tsx src/client/hooks/useFloorFiltering.test.ts` | 0 | ✅ pass | 244ms |

## Diagnostics

- Runtime surface: `/api/admin/connectors/link` now feeds inline `EditorSidePanel` connector error text with backend `errorCode` + `error` payloads.
- State inspection: successful calls patch `updatedNodes` into active-floor editor nodes and `navGraph` cache via `connectorLinking.ts` helpers.
- Automated inspection: run
  - `npm test -- src/client/components/admin/connectorLinking.test.ts`
  - `npm test -- src/client/components/admin/EditorSidePanel.connector.test.tsx`
  - `npm test -- src/server/connectorLinking.test.ts`

## Deviations

- Added `REPLACE_NODES` to `useEditorState` (not explicitly listed in the plan) to support lossless server patch application when connector fields must be cleared.

## Known Issues

- None.

## Files Created/Modified

- `src/client/components/admin/connectorLinking.ts` — new candidate derivation and `updatedNodes` patch helpers.
- `src/client/pages/admin/MapEditorCanvas.tsx` — connector API wiring, error handling, and local/cached graph synchronization.
- `src/client/components/admin/EditorSidePanel.tsx` — connector-only Floor Connections dropdown UI with unlink and inline errors.
- `src/client/components/admin/connectorLinking.test.ts` — unit tests for candidate filtering and patch semantics.
- `src/client/components/admin/EditorSidePanel.connector.test.tsx` — side-panel connector rendering and visibility tests.
- `src/client/hooks/useEditorState.ts` — `REPLACE_NODES` reducer action for server-driven node replacement.
- `.gsd/KNOWLEDGE.md` — added connector-field clearing gotcha/pattern for future agents.
- `.gsd/milestones/M001/slices/S25/S25-PLAN.md` — marked T02 complete.
