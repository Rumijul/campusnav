# S25 Research — Admin Floor Connector Visual Linking

**Researched:** 2026-03-24  
**Scope depth:** Targeted (existing stack, moderate cross-floor editor + persistence integration)  
**Confidence:** High

## Active Requirements This Slice Owns

- **R006 — Admin can link a floor-connector node to corresponding nodes above/below using dropdown UI (no manual node-ID entry).**
- **R007 — Saving a connector link writes both sides atomically to avoid one-sided cross-floor links.**
- **R008 — Admin can remove existing connector links between nodes.**

## Skills Discovered

- **Already installed and directly relevant (in-session):**
  - `react-best-practices`
  - `test`
- **Skill discovery commands run:**
  - `npx skills find "drizzle orm"` → found community skills; installed `bobmatnyc/claude-mpm-skills@drizzle-orm` globally.
  - `npx skills find "konva"` → no dedicated skill found.
- **Note:** the globally installed `drizzle-orm` skill is not exposed via the current session Skill registry yet, so implementation guidance below uses in-session skills + codebase patterns.

### Skill rules applied to this slice

- From `react-best-practices`:
  - `rerender-derived-state-no-effect`: derive connector candidate lists from current props/state via pure computation (`useMemo` if needed), not effect-driven local state.
  - `js-index-maps`: build maps (nodeId→node, floorId→floor) for repeated lookups during candidate/validation logic.
- From `test`:
  - follow existing Vitest style and file conventions (`*.test.ts`), prefer pure-function tests where possible, and avoid introducing new test frameworks.

---

## Summary

S25 is not blocked by schema. The connector linkage fields already exist end-to-end in types, DB, and map API:

- `NavNode` already carries `connectsToFloorAboveId`, `connectsToFloorBelowId`, `connectsToNodeAboveId`, `connectsToNodeBelowId` (`src/shared/types.ts`).
- DB already has nullable connector FK columns (`src/server/db/schema.ts`).
- `GET /api/map` already serializes those fields (`src/server/index.ts`).
- Import/export already accepts these fields (`src/client/utils/importExport.ts`).

What is missing is the admin workflow:

1. **No connector-link UI exists** in `EditorSidePanel.tsx`.
2. Current node edit callback updates only the selected node on the active floor.
3. Cross-floor reciprocal node updates are not naturally handled by the current side-panel path.

Key architectural constraint:

- `MapEditorCanvas.handleSave()` serializes **active floor** from `state.nodes/state.edges`, and all other floors from `navGraph`. So if a link action modifies a target node on another floor, that reciprocal change must either:
  - be patched into `navGraph` before save, or
  - be persisted through a dedicated server endpoint/transaction.

This is the central seam for delivering R007 robustly.

---

## Implementation Landscape (files that matter)

### 1) `src/client/components/admin/EditorSidePanel.tsx` (UI seam)

Current behavior:
- Node form covers name/type/building-link/category/room#/description.
- No floor-connector controls.

Needed for S25:
- Add a **Floor Connections** section (only for connector node types: `stairs`, `elevator`, `ramp`).
- Above/below dropdowns with explicit unlink option.
- Show existing link IDs/readable labels so admins can audit/remove links.

### 2) `src/client/pages/admin/MapEditorCanvas.tsx` (data + orchestration seam)

Current behavior:
- Holds `navGraph` (all buildings/floors) and `state` (active floor only).
- Passes `onUpdateNode` to side panel, which updates active-floor node only.

Needed for S25:
- Derive candidate nodes from `navGraph` (adjacent floor, same building, connector types).
- Provide side panel with connector candidates + selected link values.
- Add link/unlink handlers that preserve reciprocal consistency.

Important constraint:
- `loadNavGraph()` currently reinitializes first non-campus building/floor; avoid calling it as a generic “refresh after link” helper unless refactored.

### 3) `src/server/index.ts` (atomic persistence seam)

Current behavior:
- Has full graph replace endpoint (`POST /api/admin/graph`) and floor/image endpoints.
- No dedicated connector link endpoint.

Needed for S25 (recommended):
- Add protected endpoint for connector link/unlink transaction, e.g. `POST /api/admin/link-connector`.
- Validate source/target constraints.
- Update both sides atomically (including unlink/relink cleanup).

### 4) `src/shared/pathfinding/graph-builder.ts` + related tests (behavioral dependency)

Current behavior:
- Inter-floor edges are synthesized from `connectsToNodeAboveId` only.
- Reciprocal `connectsToNodeBelowId` is not used for edge synthesis but still required for data integrity/UI and R007.

Implication:
- One-sided data can silently route in some cases, but is still inconsistent and must be prevented.

### 5) `src/client/hooks/useFloorFiltering.ts` (secondary dependency)

Current behavior:
- Dimmed adjacent-floor elevators rely on `connectsToFloorAboveId/connectsToFloorBelowId`.

Implication:
- Link/unlink logic should keep floor ID fields in sync with node ID fields (not just node IDs).

---

## Natural Work Seams (for task decomposition)

1. **Candidate resolution + validation helpers (pure logic)**
   - Inputs: selected node, active floor, building floors/nodes.
   - Outputs: above/below dropdown options, validation state.
   - Good place for high-value unit tests.

2. **Side panel rendering**
   - Present connector controls only when node type is connector.
   - Keep section isolated from existing node form fields.

3. **Persistence strategy**
   - Recommended: dedicated atomic endpoint for link/unlink.
   - Alternative: local dual-floor patch + full graph save.

4. **Reciprocal cleanup rules**
   - Re-linking must clear stale previous counterparts.
   - Unlink must clear both sides.

---

## Recommendation

### Preferred approach (lowest correctness risk for R007)

Implement a dedicated transactional endpoint and call it from connector UI actions:

- `POST /api/admin/link-connector`
  - Body: `{ sourceNodeId, direction: 'above' | 'below', targetNodeId: string | null }`
  - `targetNodeId: null` means unlink.

Server-side rules:

1. Source must exist and be connector type (`stairs|elevator|ramp`).
2. If target provided:
   - target exists,
   - target is connector type (prefer same type as source),
   - target is in same building,
   - target floor differs from source floor,
   - direction matches floor ordering (`above`/`below`).
3. Transaction behavior:
   - clear old reciprocal pair if source already linked,
   - clear target’s previous reciprocal if target already linked to another source,
   - set both sides (`source.above/below` + `target.below/above`) including floor ID fields,
   - return updated source/target payload for client patching.

Why this is preferred:
- Guarantees R007 at write time.
- Avoids brittle cross-floor local patching requirements in the editor state model.

### Alternative (more coupled to editor state)

Patch both active-floor state and off-floor `navGraph` locally, then rely on existing `POST /api/admin/graph` full save transaction. This can work, but is easier to regress because off-floor reciprocal state must be kept correct until save.

---

## Build / Proof Order

1. **Define pure connector helper logic + tests first (RED→GREEN)**
   - candidate selection and floor-direction validation.
   - avoids UI-first trial-and-error.

2. **Implement server atomic link/unlink endpoint**
   - include reciprocal cleanup on relink/unlink.
   - keep write path deterministic.

3. **Wire `MapEditorCanvas` orchestration**
   - compute candidates from `navGraph`.
   - pass handlers/data into `EditorSidePanel`.

4. **Add `EditorSidePanel` Floor Connections UI**
   - connector-only section.
   - dropdowns + unlink actions + inline validation feedback.

5. **Regression + full-suite pass**
   - ensure existing route/pathfinding and floor filtering behaviors remain green.

---

## Verification Plan

### Automated (expected)

- `npm test -- src/shared/__tests__/graph-builder.test.ts`
- `npm test -- src/client/hooks/useFloorFiltering.test.ts`
- `npm test -- src/client/components/admin/connectorLinking.test.ts` *(new)*
- `npm test -- src/server/connectorLinking.test.ts` *(new, if server helper extracted)*
- `npm test`

### Manual admin smoke checks (required for this slice)

1. Select connector node (e.g., stairs on Floor 1) → Floor Connections section appears.
2. Above dropdown lists only valid candidates from upper floor (same building, connector-type constrained).
3. Link action updates both nodes (source above + target below).
4. Re-link to a different target clears old reciprocal link.
5. Unlink clears both sides.
6. Invalid same-floor/cross-building selections are blocked with clear error text.

---

## Risks / Fragile Points to Watch

- `graph-builder` only reads `connectsToNodeAboveId`; if UI sets only below-side fields, inter-floor edges will not synthesize for that pair.
- Elevator dimming logic depends on `connectsToFloorAboveId/connectsToFloorBelowId`; missing floor-ID updates causes subtle student-map inconsistencies.
- `MapEditorCanvas.loadNavGraph()` currently reinitializes editor context; avoid using it as a naive “post-link refresh” without refactor.

---

## Planner-ready file shortlist

- `src/client/components/admin/EditorSidePanel.tsx`
- `src/client/pages/admin/MapEditorCanvas.tsx`
- `src/server/index.ts`
- `src/shared/types.ts` *(likely no schema changes; only if helper types are added)*
- `src/client/components/admin/connectorLinking.test.ts` *(new)*
- `src/server/connectorLinking.test.ts` *(new if pure server helper extracted)*
