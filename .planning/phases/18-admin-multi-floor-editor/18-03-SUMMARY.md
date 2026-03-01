---
phase: 18-admin-multi-floor-editor
plan: "03"
subsystem: admin-editor
tags: [multi-floor, editor-state, undo-history, floor-switching, campus-context]
dependency_graph:
  requires: [18-01]
  provides: [switchFloor, switchToCampus, activeBuildingId, activeFloorId, floorSnapshots]
  affects: [MapEditorCanvas.tsx, future floor-switcher UI]
tech_stack:
  added: []
  patterns: [reducer-extension, helper-wrapper-with-history-reset, snapshot-cache]
key_files:
  created: []
  modified:
    - src/client/hooks/useEditorState.ts
decisions:
  - "[Phase 18-03]: activeBuildingId defaults to 1 (Main Building) — first floor load will always set activeFloorId; null is correct pre-load sentinel"
  - "[Phase 18-03]: switchFloor and switchToCampus are helper wrappers (not raw dispatch) because history refs live outside reducer — dispatch alone cannot reset history"
  - "[Phase 18-03]: SWITCH_BUILDING clears nodes/edges to [] — building switch means no floor loaded yet; loading is triggered by the UI selecting a floor"
  - "[Phase 18-03]: floorSnapshots cache keyed by DB floor id (number) — prevents re-fetch when user returns to a previously loaded floor"
metrics:
  duration: "~1 min"
  completed_date: "2026-03-01"
  tasks_completed: 1
  files_modified: 1
requirements_satisfied: [MFLR-04, CAMP-02, CAMP-03, CAMP-04]
---

# Phase 18 Plan 03: Extend useEditorState for Multi-Floor Context Summary

**One-liner:** Extended useEditorState with activeBuildingId/activeFloorId tracking, SWITCH_FLOOR/SWITCH_TO_CAMPUS/SWITCH_BUILDING actions, floor snapshot cache, and history-resetting switchFloor/switchToCampus helpers.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Extend EditorState and add multi-floor actions | bb9fb15 | src/client/hooks/useEditorState.ts |

## What Was Built

Extended `useEditorState.ts` with multi-floor editing context. The extension is fully backward compatible — all existing fields, action types, reducer cases, and hook return values are preserved exactly. Only additions were made:

**EditorState additions:**
- `activeBuildingId: number | 'campus'` — tracks which building (or campus) is in focus
- `activeFloorId: number | null` — null when campus context active or no floor loaded yet
- `floorSnapshots: Record<number, { nodes: NavNode[]; edges: NavEdge[] }>` — cache keyed by floor DB id
- `campusSnapshot: { nodes: NavNode[]; edges: NavEdge[] } | null` — campus graph cache

**EditorAction additions:**
- `SWITCH_FLOOR` — loads floor nodes/edges, updates activeFloorId, caches in floorSnapshots
- `SWITCH_TO_CAMPUS` — loads campus nodes/edges, sets activeBuildingId='campus', caches in campusSnapshot
- `SWITCH_BUILDING` — changes active building, clears nodes/edges, resets floor selection

**Hook additions:**
- `switchFloor(floorId, nodes, edges)` — dispatches SWITCH_FLOOR + resets undo history
- `switchToCampus(nodes, edges)` — dispatches SWITCH_TO_CAMPUS + resets undo history

History reset is critical: undo history is stored in refs outside the reducer, so plain dispatch cannot reset it. The helper wrappers set `history.current = [newState]` and `historyStep.current = 0` directly.

## Verification Results

All 5 verification checks passed:
1. `npx tsc --noEmit` — clean (no errors)
2. `grep "activeBuildingId"` — found in type, initialState, and all 3 reducer cases
3. `grep "SWITCH_FLOOR"` — found in union type AND reducer case
4. `grep "switchFloor"` — found in hook return
5. `grep "floorSnapshots"` — found in type, initialState, and reducer cases

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- File exists: src/client/hooks/useEditorState.ts — FOUND
- Commit bb9fb15 exists — FOUND
- TypeScript compiles without errors — CONFIRMED
