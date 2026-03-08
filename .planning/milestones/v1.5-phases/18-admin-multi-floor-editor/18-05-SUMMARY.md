---
phase: 18-admin-multi-floor-editor
plan: "05"
subsystem: admin-ui
tags: [multi-floor, campus-mode, building-selector, floor-tabs, MapEditorCanvas, integration]
dependency_graph:
  requires: [18-02, 18-03, 18-04]
  provides: [MapEditorCanvas-multi-floor, building-selector, floor-tabs, campus-empty-state, ManageFloorsModal-integration]
  affects: [admin-editor-flow, MapEditorCanvas.tsx]
tech_stack:
  added: []
  patterns: [NavGraph-state-with-callback, derived-helpers-from-state, context-aware-save, campus-sentinel-routing]
key_files:
  created: []
  modified:
    - src/client/pages/admin/MapEditorCanvas.tsx
decisions:
  - "loadNavGraph wrapped in useCallback and called from useEffect — enables re-call after ManageFloorsModal operations (add/delete/replace image)"
  - "handleFloorSwitch auto-saves silently before switching floor using isSavingFloor guard — fire-and-forget pattern keeps UX responsive"
  - "Manage Floors button delegated to EditorToolbar (via onManageFloors prop) only — removed from floor tab row to avoid two buttons with identical action in adjacent visual positions"
  - "handleSave context-aware: campus mode patches campusBuilding floors[0]; building mode maps updated floor into full NavGraph before POST"
  - "handleFileChange routes to /api/admin/campus/image when isCampusActive, per-floor /api/admin/floor-plan/{buildingId}/{floorNumber} otherwise"
  - "Node placement uses state.activeFloorId ?? 1 — fallback to 1 ensures backward compat when no floor loaded yet"
  - "ManageFloorsModal import uses default import (not named) matching actual export in ManageFloorsModal.tsx"
metrics:
  duration: "~3 min"
  completed_date: "2026-03-01"
  tasks_completed: 2
  files_modified: 1
requirements_satisfied: [MFLR-04, CAMP-02, CAMP-03, CAMP-04]
---

# Phase 18 Plan 05: MapEditorCanvas Multi-Floor Wiring Summary

Full multi-floor editor wiring in MapEditorCanvas: building selector dropdown, sorted floor tabs, auto-save on floor switch, campus mode with empty-state prompt, ManageFloorsModal integration, context-aware save/upload, and correct node floorId assignment.

## What Was Built

**MapEditorCanvas.tsx** — complete multi-floor integration (232 net lines added, 667 total):

- **NavGraph state**: `navGraph` state variable holds the full `NavGraph` from `GET /api/map`. `loadNavGraph` is a `useCallback` that fetches and stores the graph, auto-selects the first non-Campus building + first floor on load, and is re-called after ManageFloorsModal operations.

- **Derived helpers**: `isCampusActive` (boolean), `nonCampusBuildings` (NavBuilding[]), `activeBuilding` (NavBuilding | undefined), `sortedFloors` (NavFloor[] sorted by floorNumber) — all derived from `navGraph` + `state.activeBuildingId/activeFloorId`.

- **handleBuildingSwitch**: On "campus" selection, calls `switchToCampus` with campus building's nodes/edges and sets URL to `/api/campus/image`. On building selection, calls `switchFloor` with the first floor's data.

- **handleFloorSwitch**: Guards against switching to already-active floor. When `state.isDirty && !isCampusActive`, auto-saves current floor silently (fire-and-forget with `isSavingFloor` guard). Then calls `switchFloor` and updates `floorPlanUrl`.

- **Building selector + floor tab row**: Rendered only on Map tab. `<select>` with Campus option + all non-campus buildings. Floor `<button>` elements sorted by `floorNumber`, active tab highlighted blue, disabled during auto-save. No separate Manage Floors button — EditorToolbar handles it via `onManageFloors` prop.

- **ManageFloorsModal integration**: Mounted at JSX root level when `manageFloorsOpen && activeBuilding`. `onFloorAdded`/`onFloorDeleted` close modal + reload navGraph. `onFloorImageReplaced` reloads navGraph without closing.

- **Campus empty state**: `{isCampusActive && !image}` overlay centered in map panel with "Upload campus map to begin" text + click handler triggering `handleUploadClick`.

- **Fixed node floorId**: `floorId: state.activeFloorId ?? 1` replaces hardcoded `floorId: 1`.

- **Fixed handleSave**: Campus path patches `campusBuilding.floors[0]` with current nodes/edges. Building path maps the full `navGraph.buildings` array, updating only the active building's active floor — preserves all other floors' data.

- **Fixed handleFileChange**: Routes to `/api/admin/campus/image` when `isCampusActive`, calls `loadNavGraph()` after to refresh IDs. Otherwise routes to `/api/admin/floor-plan/{activeBuildingId}/{floorNumber}`.

- **New props passed**: `EditorToolbar` receives `isCampusActive` + `onManageFloors`. `EditorSidePanel` receives `isCampusActive` + `buildings`. `NodeMarkerLayer` receives `isCampusActive`.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Add NavGraph state, building selector row, floor tab row | 4390f4b | MapEditorCanvas.tsx |
| 2 | Fix node floorId, handleSave, handleFileChange, pass new props | 4390f4b | MapEditorCanvas.tsx |

*Tasks 1 and 2 committed together as a single atomic change to the same file — splitting would have produced a broken intermediate state.*

## Verification

- `npx tsc --noEmit` passes (no errors)
- `grep "activeBuildingId|activeFloorId|switchFloor|isCampusActive"` — multiple matches in MapEditorCanvas.tsx
- `grep "ManageFloorsModal"` — 2 matches (import line 11, JSX usage line 655)
- `grep "api/admin/campus/image"` — 1 match (line 380)
- `grep "floorId: state.activeFloorId"` — 1 match (line 210)
- File length: 667 lines (min_lines: 300 satisfied)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] ManageFloorsModal default import (not named)**
- **Found during:** Task 1 implementation
- **Issue:** Plan specified `import { ManageFloorsModal }` (named import) but `ManageFloorsModal.tsx` uses `export default function ManageFloorsModal` (default export)
- **Fix:** Used `import ManageFloorsModal from '../../components/admin/ManageFloorsModal'`
- **Files modified:** MapEditorCanvas.tsx (import line 11)
- **Commit:** 4390f4b

**2. [Rule 1 - Bug] SWITCH_BUILDING dispatched before switchFloor in loadNavGraph**
- **Found during:** Task 1 implementation
- **Issue:** Plan specified `switchFloor` then `dispatch SWITCH_BUILDING`, but `switchFloor` in useEditorState derives `activeBuildingId` from `state.activeBuildingId` at call time — dispatching SWITCH_BUILDING first ensures the snapshot is stored under the correct building context
- **Fix:** Reordered to `dispatch SWITCH_BUILDING` first, then `switchFloor`
- **Files modified:** MapEditorCanvas.tsx (loadNavGraph callback)
- **Commit:** 4390f4b

## Self-Check: PASSED

- MapEditorCanvas.tsx: FOUND (667 lines)
- Commit 4390f4b: FOUND
- TypeScript compiles without errors: CONFIRMED
- All 5 verification grep patterns: CONFIRMED
