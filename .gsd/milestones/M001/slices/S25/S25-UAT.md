# S25: Admin Floor Connector Visual Linking — Replace manual node ID entry with dropdown Based bidirectional connector linking in the admin editor — UAT

**Milestone:** M001
**Written:** 2026-03-24

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: S25 proof level is integration with explicit automated verification targets, and this worktree environment has known Vite runtime instability; test surfaces fully cover connector filtering, reciprocal write integrity, unlink behavior, and diagnostics.

## Preconditions

- Dependencies are installed and tests can run via `npm test`.
- S25 server/client connector files exist:
  - `src/server/connectorLinking.ts`
  - `src/server/index.ts`
  - `src/client/components/admin/connectorLinking.ts`
  - `src/client/components/admin/EditorSidePanel.tsx`
  - `src/client/pages/admin/MapEditorCanvas.tsx`

## Smoke Test

1. Run `npm test -- src/server/connectorLinking.test.ts src/client/components/admin/connectorLinking.test.ts src/client/components/admin/EditorSidePanel.connector.test.tsx`
2. **Expected:** All three suites pass, confirming backend atomic linking + client dropdown/candidate wiring are functioning together.

## Test Cases

### 1. Connector candidate dropdowns are constrained to valid adjacent-floor connector nodes

1. Run `npm test -- src/client/components/admin/connectorLinking.test.ts`
2. Inspect the `deriveConnectorCandidates` assertions in the test output context.
3. **Expected:**
   - `above` and `below` options contain only connector nodes (`stairs`/`elevator`/`ramp`) on the immediately adjacent floor.
   - Cross-building and same-floor options are excluded.
   - Non-connector source nodes produce empty candidate lists.

### 2. Connector UI renders dropdown-based Above/Below linking and explicit unlink affordance

1. Run `npm test -- src/client/components/admin/EditorSidePanel.connector.test.tsx`
2. Confirm connector-node scenario includes `Floor Connections`, `Above`, `Below`, and `Unlink`.
3. Confirm non-connector scenario omits connector controls entirely.
4. **Expected:** Connector editing is dropdown-only (no manual node-ID entry path), with unlink options visible and non-connectors protected from accidental connector-link UI.

### 3. Link + relink operations update both sides atomically and clean stale reciprocal links

1. Run `npm test -- src/server/connectorLinking.test.ts -t "links source and target connectors atomically"`
2. Run `npm test -- src/server/connectorLinking.test.ts -t "relinks and clears stale reciprocal links for both displaced connectors"`
3. **Expected:**
   - Success payload is `{ ok: true, updatedNodes }`.
   - Source and target reciprocal fields are both written.
   - Relink clears stale reciprocal references from displaced nodes in the same transaction path.

### 4. Unlink clears both sides and validation failures are deterministic + non-mutating

1. Run `npm test -- src/server/connectorLinking.test.ts -t "unlinks and clears both sides of an existing connector pair"`
2. Run `npm test -- src/server/connectorLinking.test.ts -t "returns LINK_VALIDATION_ERROR when direction/floor pairing is invalid"`
3. **Expected:**
   - Unlink sets both sides’ directional connector node/floor fields to `null`.
   - Invalid direction pairing fails with `LINK_VALIDATION_ERROR` and leaves snapshot state unchanged.

### 5. Full regression safety for the slice

1. Run `npm test`
2. **Expected:** Full suite passes with no regressions across routing, admin editor, and connector linking codepaths.

## Edge Cases

### Cross-building or same-floor connector targets

1. Run `npm test -- src/server/connectorLinking.test.ts`
2. **Expected:** Validation fails with deterministic `LINK_VALIDATION_ERROR` and no connector-state mutation.

### Inline connector diagnostics visibility

1. Run `npm test -- src/client/components/admin/EditorSidePanel.connector.test.tsx -t "renders floor connection dropdowns with unlink and inline connector error for connector nodes"`
2. **Expected:** Side panel renders inline error text like `LINK_VALIDATION_ERROR: ...` when the connector-link handler reports failure.

## Failure Signals

- Connector dropdown options include same-floor, cross-building, or non-connector nodes.
- Non-connector node types display Floor Connections controls.
- Link/relink updates only one side of the connector pair.
- Unlink leaves stale `connectsTo*` fields on either node.
- Invalid direction/same-floor/cross-building requests mutate node linkage state.
- Any required slice verification command fails.

## Not Proven By This UAT

- Live browser interaction against a running dev server in this worktree (artifact-driven mode used due known runtime instability).
- End-to-end JWT-authenticated HTTP call against `/api/admin/connectors/link` with a live database transaction harness.
- GPS bounds and geolocation behavior (S26/S27 scope).

## Notes for Tester

- Prefer these test commands over local browser runtime in this worktree environment.
- If validating outside the worktree in a stable runtime environment, do an optional manual smoke flow: select connector node → choose Above/Below target → verify reciprocal link update persists after reload → choose Unlink and verify both sides clear.
