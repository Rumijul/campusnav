---
phase: 18-admin-multi-floor-editor
plan: "04"
subsystem: admin-ui
tags: [floor-management, campus-editor, ui-components]
dependency_graph:
  requires: [18-02, 18-03]
  provides: [ManageFloorsModal, EditorToolbar-manage-floors, EditorSidePanel-campus-link, NodeMarkerLayer-campus-entrance-color]
  affects: [MapEditorCanvas, admin-editor-flow]
tech_stack:
  added: []
  patterns: [optional-props-backward-compat, exactOptionalPropertyTypes-safe-conditional-spread, campus-sentinel-color]
key_files:
  created:
    - src/client/components/admin/ManageFloorsModal.tsx
  modified:
    - src/client/components/admin/EditorToolbar.tsx
    - src/client/components/admin/EditorSidePanel.tsx
    - src/client/components/admin/NodeMarkerLayer.tsx
decisions:
  - "ManageFloorsModal uses per-row hidden file inputs tracked via useRef<Map> — avoids naming conflicts for multiple floor replace-image inputs"
  - "exactOptionalPropertyTypes-safe: onUpdateNode called with {} (not { connectsToBuildingId: undefined }) when clearing building link"
  - "CAMPUS_ENTRANCE_COLOR amber (#f59e0b) distinguishes campus entrance bridges from standard entrance green (#22c55e) in NodeMarkerLayer"
metrics:
  duration: "~5 min"
  completed_date: "2026-03-01"
  tasks_completed: 2
  files_modified: 4
---

# Phase 18 Plan 04: ManageFloorsModal and Campus UI Extensions Summary

ManageFloorsModal + EditorToolbar/SidePanel/NodeMarkerLayer campus-aware extensions for floor management (MFLR-04) and campus entrance editing (CAMP-03, CAMP-04).

## What Was Built

**ManageFloorsModal.tsx** (new, 185 lines): Full-screen modal for floor management within a building. Renders a scrollable list of floors sorted by `floorNumber`, each showing the floor label, image preview (`/api/floor-plan/{buildingId}/{floorNumber}`), Replace Image button (triggers hidden file input, POSTs multipart to `/api/admin/floor-plan/{buildingId}/{floorNumber}`), and Delete button (shows confirm dialog if floor has nodes). Add Floor form at the bottom requires both floor number and image before enabling submit; POSTs to `/api/admin/floors` with `buildingId`, `floorNumber`, and `image` fields. All fetches use `credentials: 'include'`. `isSaving` state disables buttons during fetch.

**EditorToolbar.tsx** (extended): Added optional `onManageFloors?: () => void` and `isCampusActive?: boolean` props. "Upload Floor Plan" label becomes "Upload Campus Map" when `isCampusActive`. "Manage Floors" button renders only when `!isCampusActive && onManageFloors`. Fully backward compatible.

**EditorSidePanel.tsx** (extended): Added optional `isCampusActive?: boolean` and `buildings?: NavBuilding[]` props. Added NavBuilding to the import. Renders a "Links to Building" dropdown only when `isCampusActive && selectedNode.type === 'entrance'`. Uses `onUpdateNode(id, val ? { connectsToBuildingId: Number(val) } : {})` — the conditional spread avoids passing `undefined` directly (exactOptionalPropertyTypes safe). Includes helper text indicating whether cross-building pathfinding is enabled.

**NodeMarkerLayer.tsx** (extended): Added `CAMPUS_ENTRANCE_COLOR = '#f59e0b'` constant and optional `isCampusActive?: boolean` prop. Fill color logic: when `isCampusActive && node.type === 'entrance' && node.connectsToBuildingId != null`, uses amber instead of the standard entrance green. All other nodes use unchanged color logic.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Create ManageFloorsModal + extend EditorToolbar | 6a445cb | ManageFloorsModal.tsx (new), EditorToolbar.tsx |
| 2 | Extend EditorSidePanel + NodeMarkerLayer for campus | 5a66020 | EditorSidePanel.tsx, NodeMarkerLayer.tsx |

## Verification

- `npx tsc --noEmit` passes (no errors)
- `ManageFloorsModal.tsx` exists with 185 lines (min_lines: 80 satisfied)
- `EditorToolbar.tsx` contains `onManageFloors` (4 matches)
- `EditorSidePanel.tsx` contains `connectsToBuildingId` (3 matches)
- `NodeMarkerLayer.tsx` contains `CAMPUS_ENTRANCE_COLOR` (2 matches)

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

- ManageFloorsModal.tsx: FOUND
- EditorToolbar.tsx: FOUND with onManageFloors
- EditorSidePanel.tsx: FOUND with connectsToBuildingId
- NodeMarkerLayer.tsx: FOUND with CAMPUS_ENTRANCE_COLOR
- Commits 6a445cb and 5a66020: FOUND
