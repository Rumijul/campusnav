---
phase: 09-admin-map-editor-visual
plan: 03
subsystem: ui
tags: [react, konva, react-konva, tailwind, admin, editor, edges, side-panel]

# Dependency graph
requires:
  - phase: 09-admin-map-editor-visual-02
    provides: MapEditorCanvas component, NodeMarkerLayer, EditorToolbar, useEditorState hook
  - phase: 09-admin-map-editor-visual-01
    provides: useEditorState hook (useReducer + undo/redo), CREATE_EDGE/SELECT_EDGE/SET_PENDING_EDGE_SOURCE actions
provides:
  - EdgeLayer component — color-coded edge rendering (green/grey/blue) + rubber-band preview line
  - EditorSidePanel component — OSM-style property editor for selected node or edge
  - Updated MapEditorCanvas — full edge creation two-click flow, cursor tracking, side panel wired
affects: [09-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Rubber-band preview with listening={false} to avoid intercepting edge clicks during creation
    - hitStrokeWidth=10 on edge lines — wider hit area than visual strokeWidth=2
    - HTML overlay side panel (absolute right-0 top-0) inside relative container — same pattern as SearchOverlay/ZoomControls
    - htmlFor+id label associations for Biome a11y compliance (noLabelWithoutControl rule)
    - exactOptionalPropertyTypes-safe field updates — pass string values directly, never string|undefined

key-files:
  created:
    - src/client/components/admin/EdgeLayer.tsx
    - src/client/components/admin/EditorSidePanel.tsx
  modified:
    - src/client/pages/admin/MapEditorCanvas.tsx

key-decisions:
  - "EdgeLayer sits between floor plan Layer and NodeMarkerLayer — edges render under nodes for clean visual hierarchy"
  - "Rubber-band preview Line has listening={false} — critical to prevent it from intercepting click events on nodes and canvas"
  - "Read-only display rows (Category, Connection) use span instead of label — no associated input, avoids Biome noLabelWithoutControl violation"
  - "Pass string values directly to onUpdateNode/onUpdateEdge for optional fields — exactOptionalPropertyTypes:true forbids string|undefined assignments to Partial<NavNode>"

requirements-completed: [EDIT-04, EDIT-05]

# Metrics
duration: 4min
completed: 2026-02-21
---

# Phase 9 Plan 03: Edge Creation + Properties Side Panel Summary

**EdgeLayer (color-coded edge rendering + rubber-band preview) + EditorSidePanel (OSM-style node/edge property editor) + MapEditorCanvas two-click edge creation flow with cursor tracking**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-21T06:19:12Z
- **Completed:** 2026-02-21T06:23:31Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created `EdgeLayer` — Konva Layer that renders all edges as color-coded lines (green for accessible, grey for non-accessible, blue for selected) with wide hit areas (`hitStrokeWidth=10`) and a dashed rubber-band preview line (`listening=false`) that follows the cursor during edge creation
- Created `EditorSidePanel` — HTML overlay panel with node editing form (name, type dropdown with optgroup landmark/navigation separation, category display, room number, description) and edge editing form (source->target display, distance weight input, wheelchair accessible toggle with 1e10 sentinel for non-accessible, accessibility notes); all changes apply immediately (OSM-style)
- Updated `MapEditorCanvas` — two-click edge creation in `add-edge` mode (first click sets pending source with visual marker, second click creates edge with auto-calculated normalized-coordinate distance); cursor position tracking via `onMouseMove` for rubber-band; `EdgeLayer` rendered between floor plan and node layers; `EditorSidePanel` mounted as absolute HTML overlay; Escape and empty canvas click cancel pending edge creation; `handleEdgeClick` dispatches `SELECT_EDGE`

## Task Commits

Each task was committed atomically:

1. **Task 1: Create EdgeLayer with edge rendering and rubber-band preview** - `55814ad` (feat)
2. **Task 2: Create EditorSidePanel and wire edge creation + side panel into MapEditorCanvas** - `a37b739` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/client/components/admin/EdgeLayer.tsx` — Konva Layer; edge lines color-coded by accessible/selected state; hitStrokeWidth=10 for wide click targets; rubber-band Line with listening=false; returns null when imageRect is null
- `src/client/components/admin/EditorSidePanel.tsx` — HTML overlay (absolute right-0 top-0, w-72, h-full, overflow-y-auto); node form with htmlFor/id label pairs; edge form with checkbox for accessible toggle; uses span (not label) for read-only rows to satisfy Biome a11y rules
- `src/client/pages/admin/MapEditorCanvas.tsx` — Added EdgeLayer import + render between floor plan and nodes; EditorSidePanel as HTML overlay with pointer-events wrapper; handleMouseMove for cursor tracking; handleNodeClick extended for add-edge two-click flow; handleEdgeClick; selectedEdgeWithNames computed for side panel; cursorCanvasPos state; Escape key also clears cursorCanvasPos

## Decisions Made
- `EdgeLayer` rendered between floor plan Layer and `NodeMarkerLayer` — ensures nodes always appear on top of edges for clean visual hierarchy and click priority
- Rubber-band preview `Line` has `listening={false}` — prevents the preview line from intercepting click events during the edge creation flow (CRITICAL for correct behavior)
- Read-only display rows (`Category` in node form, `Connection` in edge form) use `<span>` instead of `<label>` — no associated input element means using `<label>` would trigger Biome's `noLabelWithoutControl` a11y rule
- Optional field updates pass string values directly (never `string | undefined`) — `exactOptionalPropertyTypes: true` in tsconfig forbids assigning `string | undefined` to optional fields typed as `string` in `Partial<NavNode>` / `Partial<NavEdge>`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] exactOptionalPropertyTypes TS errors for optional field updates**
- **Found during:** Task 2 (TypeScript check)
- **Issue:** `onUpdateNode(id, { roomNumber: e.target.value || undefined })` produces `string | undefined` which is incompatible with `Partial<NavNode>` under `exactOptionalPropertyTypes: true`
- **Fix:** Changed all optional field onChange handlers to pass the string value directly (e.g. `{ roomNumber: e.target.value }`); empty string is valid storage — never pass `undefined`
- **Files modified:** src/client/components/admin/EditorSidePanel.tsx
- **Commit:** a37b739 (Task 2 commit)

**2. [Rule 2 - A11y] Missing label associations triggered Biome noLabelWithoutControl**
- **Found during:** Task 2 (biome check)
- **Issue:** `<label>` elements without matching `htmlFor`/`id` on inputs violated Biome's `lint/a11y/noLabelWithoutControl` rule; read-only display rows using `<label>` had no associated input at all
- **Fix:** Added `htmlFor` + `id` pairs to all label+input/select/textarea combinations; converted read-only display rows to use `<span>` instead of `<label>`
- **Files modified:** src/client/components/admin/EditorSidePanel.tsx
- **Commit:** a37b739 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (Rule 1 - TypeScript type errors, Rule 2 - A11y compliance)
**Impact on plan:** Necessary for correctness and accessibility. Both fixes improve code quality without behavioral changes.

## Issues Encountered
- Pre-existing CRLF line ending format errors in project — same pre-existing issue noted in Plan 01 and 02. All new files pass `npx biome check` cleanly after `npx biome format --write`.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- All five EDIT requirements (EDIT-01 through EDIT-05) are now functional in the admin map editor
- `EdgeLayer`, `EditorSidePanel`, and updated `MapEditorCanvas` are ready for Plan 04 (if any remaining editor work) or final UAT
- Undo/redo covers all new actions: edge creation, node property edits, edge property edits, accessibility toggles

## Self-Check: PASSED

- src/client/components/admin/EdgeLayer.tsx: FOUND
- src/client/components/admin/EditorSidePanel.tsx: FOUND
- src/client/pages/admin/MapEditorCanvas.tsx: FOUND
- .planning/phases/09-admin-map-editor-visual/09-03-SUMMARY.md: FOUND
- Commit 55814ad: FOUND
- Commit a37b739: FOUND

---
*Phase: 09-admin-map-editor-visual*
*Completed: 2026-02-21*
