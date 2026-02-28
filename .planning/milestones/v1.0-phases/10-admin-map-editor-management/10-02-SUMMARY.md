---
phase: 10-admin-map-editor-management
plan: 02
subsystem: ui
tags: [react, typescript, papaparse, zod, table, import-export, inline-edit]

# Dependency graph
requires:
  - phase: 10-admin-map-editor-management
    plan: 01
    provides: DELETE_NODE/DELETE_EDGE reducer cases, useEditorState hook
  - phase: 09-admin-map-editor-visual
    provides: useEditorState hook, MapEditorCanvas, EditorToolbar
provides:
  - Data tab with sortable/filterable NodeDataTable and EdgeDataTable
  - Inline name/type editing in NodeDataTable (blur or Enter commits)
  - Inline accessible checkbox in EdgeDataTable (saves immediately)
  - Import/export for JSON (campus-graph.json) and CSV (nodes.csv + edges.csv)
  - Map/Data tab switcher that keeps Konva canvas mounted-but-hidden
  - PapaParse + Zod validation for all import paths
affects: [10-admin-map-editor-management]

# Tech tracking
tech-stack:
  added:
    - papaparse ^5.5.3 — CSV parsing for nodes/edges import
    - "@types/papaparse" ^5.5.2 — TypeScript types for papaparse
  patterns:
    - hidden-not-unmounted pattern for tab switching — className=hidden on wrapper divs preserves Konva canvas state and undo history
    - Centralized import/export module (importExport.ts) — all six functions in one file, no logic scattered in components
    - Zod schema validation for all import paths — navNodeSchema, navEdgeSchema, navGraphSchema gate both JSON and CSV imports
    - Row `if (!row) continue` guard after array index access to satisfy noUncheckedIndexedAccess TypeScript rule
    - biome-ignore for td/span onClick a11y — stop-propagation tds and inline-edit spans in admin-only table UI

key-files:
  created:
    - src/client/utils/importExport.ts
    - src/client/components/admin/DataTabToolbar.tsx
    - src/client/components/admin/NodeDataTable.tsx
    - src/client/components/admin/EdgeDataTable.tsx
  modified:
    - src/client/pages/admin/MapEditorCanvas.tsx

key-decisions:
  - "hidden-not-unmounted for tab switching — Konva Stage wrapper gets className=hidden (not removed from DOM) so pan/zoom state, Konva layer refs, and undo history all persist when switching to Data tab"
  - "importExport.ts is a single utility module — all six functions live there with no import/export logic in DataTabToolbar or table components"
  - "Zod validates every import — navGraphSchema for JSON, navNodeSchema/navEdgeSchema per-row for CSV; all errors collected and displayed inline below the import buttons"
  - "CSV header detection heuristic for nodes vs edges — firstLine.includes('label') && firstLine.includes('type') distinguishes nodes.csv from edges.csv so a single Import CSV button handles both"
  - "accessibleWeight set to 1e10 when accessible=false toggled via EdgeDataTable checkbox — consistent with existing 1e10 sentinel pattern established in Phase 03-01"
  - "UPDATE_NODE/UPDATE_EDGE dispatcher uses 'changes' key (not 'updates') to match existing EditorAction union types"

patterns-established:
  - "hidden-not-unmounted tab pattern: wrap each panel in a div with className={activeTab !== 'X' ? 'hidden' : 'flex-1 ...'} — both panels stay mounted, only CSS visibility changes"
  - "Centralized utility module pattern: all import/export logic in one file with clear section comments; components import functions, not raw logic"

requirements-completed: [EDIT-07, EDIT-08]

# Metrics
duration: 5min
completed: 2026-02-21
---

# Phase 10 Plan 02: Data Tab, Tables, Import/Export Summary

**Data tab with sortable/filterable node and edge tables (inline editing, row deletion, row selection sync) and full JSON/CSV import/export via PapaParse + Zod validation**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-21T12:19:28Z
- **Completed:** 2026-02-21T12:24:20Z
- **Tasks:** 2
- **Files created:** 4
- **Files modified:** 1

## Accomplishments

- PapaParse installed; importExport.ts provides all six functions (exportJson, exportNodesCsv, exportEdgesCsv, handleJsonImport, parseNodesCsv, parseEdgesCsv) plus readFileAsText helper
- Zod schemas (navNodeSchema, navEdgeSchema, navGraphSchema) validate all import data before dispatch; invalid files show all errors inline — graph is never modified on failure
- DataTabToolbar provides Nodes/Edges sub-tab switcher, Import JSON/CSV buttons, Export JSON/CSV buttons, collapsible error display
- NodeDataTable: sortable by Name/Type/Floor, filterable by text and type, inline Name editing (input on click, commits on blur/Enter), inline Type editing (dropdown on click), Delete button, row selection sync
- EdgeDataTable: sortable by Source/Distance/Accessible, filterable by source or target name, inline Accessible checkbox (saves immediately with 1e10 sentinel for inaccessible), Delete button, row selection sync
- Map/Data tab switcher in MapEditorCanvas uses className=hidden (not unmounting) — Konva canvas, undo history, and pan/zoom state all persist across tab switches
- All table mutations dispatch recordHistory() — all inline edits and deletes are undoable via Ctrl+Z

## Task Commits

Each task was committed atomically:

1. **Task 1: Install PapaParse + build importExport utility + DataTabToolbar** - `992ddcb` (feat)
2. **Task 2: Build NodeDataTable + EdgeDataTable + wire tab switcher in MapEditorCanvas** - `0ce77df` (feat)

## Files Created/Modified

- `src/client/utils/importExport.ts` - All import/export logic; six exported functions + readFileAsText
- `src/client/components/admin/DataTabToolbar.tsx` - Sub-tab switcher, import/export buttons, error display
- `src/client/components/admin/NodeDataTable.tsx` - Sortable/filterable node table with inline Name/Type editing and Delete
- `src/client/components/admin/EdgeDataTable.tsx` - Sortable/filterable edge table with inline Accessible checkbox and Delete
- `src/client/pages/admin/MapEditorCanvas.tsx` - Added Map/Data tab switcher, wired DataTabToolbar + NodeDataTable + EdgeDataTable

## Decisions Made

- hidden-not-unmounted for tab switching — Konva Stage wrapper gets `className=hidden` (not removed from DOM) so pan/zoom state, Konva layer refs, and undo history all persist when switching to Data tab.
- importExport.ts is a single utility module — all six functions live there with no import/export logic scattered in DataTabToolbar or table components.
- Zod validates every import — navGraphSchema for JSON, navNodeSchema/navEdgeSchema per-row for CSV; all errors collected and displayed inline below the import buttons.
- CSV header detection heuristic — `firstLine.includes('label') && firstLine.includes('type')` distinguishes nodes.csv from edges.csv, so a single Import CSV button handles both file types.
- accessibleWeight set to 1e10 when accessible toggled false — consistent with 1e10 sentinel established in Phase 03-01.
- UPDATE_NODE/UPDATE_EDGE dispatcher uses `changes` key (not `updates`) to match existing EditorAction union types from useEditorState.ts.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript error: `row` possibly undefined from array index access**
- **Found during:** Task 1 (tsc check)
- **Issue:** `noUncheckedIndexedAccess` TypeScript flag means `result.data[i]` returns `T | undefined`; the plan's template code used the value directly without a null guard
- **Fix:** Added `if (!row) continue` after each `const row = result.data[i]` line in parseNodesCsv and parseEdgesCsv
- **Files modified:** src/client/utils/importExport.ts
- **Commit:** Included in `992ddcb`

**2. [Rule 1 - Bug] Biome lint violations on Task 1 files (import ordering, string concatenation, bracket key access, formatting)**
- **Found during:** Task 1 (biome check)
- **Issue:** 25+ biome rule violations: `useLiteralKeys` (bracket vs dot access), `useTemplate` (string concat vs template literal), `organizeImports`, and formatter violations
- **Fix:** Applied `npx biome check --write` and `--unsafe` to auto-fix all violations
- **Files modified:** src/client/utils/importExport.ts, src/client/components/admin/DataTabToolbar.tsx
- **Commit:** Included in `992ddcb`

**3. [Rule 1 - Bug] EdgeDataTable imported as default but exported as named**
- **Found during:** Task 2 (tsc check)
- **Issue:** Import statement used `import EdgeDataTable from ...` but the component is a named export `export function EdgeDataTable`
- **Fix:** Changed to `import { EdgeDataTable } from ...`
- **Files modified:** src/client/pages/admin/MapEditorCanvas.tsx
- **Commit:** Included in `0ce77df`

**4. [Rule 1 - Bug] Biome a11y lint violations on table cell onClick handlers**
- **Found during:** Task 2 (biome check)
- **Issue:** `<td onClick>` for stopPropagation and `<span onClick>` for inline edit triggers triggered `useKeyWithClickEvents` and `noStaticElementInteractions` rules
- **Fix:** Added `biome-ignore` comments with rationale (stop-propagation tds have interactive children that handle keyboard; inline-edit spans activate proper input/select on click)
- **Files modified:** src/client/components/admin/NodeDataTable.tsx, src/client/components/admin/EdgeDataTable.tsx
- **Commit:** Included in `0ce77df`

---

**Total deviations:** 4 auto-fixed (Rules 1 — TypeScript noUncheckedIndexedAccess, biome lint/format, default vs named import, biome a11y)
**Impact on plan:** All deviations were minor correctness/style fixes. No scope creep, no behavioral change. Plan objectives achieved exactly as specified.

## Issues Encountered

- `rtk tsc` and `rtk lint` commands not available in shell environment — used `npx tsc --noEmit` and `npx biome check` directly as equivalent alternatives. Both pass with zero errors.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- EDIT-07 complete: admin can view/edit/delete nodes and edges via tabular Data view
- EDIT-08 complete: admin can export graph as JSON or CSV; import JSON/CSV with full Zod validation and error display
- Phase 10 is now complete (Plan 01: deletion, Plan 02: data tables + import/export, Plan 03: if any)
- All Phase 10 requirements (EDIT-06, EDIT-07, EDIT-08) verified

---
*Phase: 10-admin-map-editor-management*
*Completed: 2026-02-21*

## Self-Check: PASSED

- FOUND: src/client/utils/importExport.ts
- FOUND: src/client/components/admin/DataTabToolbar.tsx
- FOUND: src/client/components/admin/NodeDataTable.tsx
- FOUND: src/client/components/admin/EdgeDataTable.tsx
- FOUND: .planning/phases/10-admin-map-editor-management/10-02-SUMMARY.md
- FOUND commit: 992ddcb (feat(10-02): install PapaParse + build importExport utility + DataTabToolbar)
- FOUND commit: 0ce77df (feat(10-02): build NodeDataTable, EdgeDataTable, wire tab switcher in MapEditorCanvas)
