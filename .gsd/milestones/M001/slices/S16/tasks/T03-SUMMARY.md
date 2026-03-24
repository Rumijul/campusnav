---
phase: 14.1-node-selection-fixes-and-admin-room-number-edit
plan: 03
subsystem: ui
tags: [react, typescript, biome, admin, search, inline-edit]

# Dependency graph
requires:
  - phase: 10-admin-map-editor-management
    provides: NodeDataTable with label/type inline editing pattern
  - phase: 05-search-location-selection
    provides: SearchOverlay result list with roomNumber display
provides:
  - NodeDataTable Room # column with inline editing (Enter/Escape/blur)
  - SearchOverlay showing "Room 204 · room" with conditional separator
affects: [admin-map-editor, student-search]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "exactOptionalPropertyTypes-safe optional field clearing via conditional spread ({} vs { field: value })"
    - "Escape key cancel for inline edit inputs"

key-files:
  created: []
  modified:
    - src/client/components/admin/NodeDataTable.tsx
    - src/client/components/SearchOverlay.tsx

key-decisions:
  - "exactOptionalPropertyTypes requires conditional spread to clear optional fields: onUpdateNode(id, trimmed === '' ? {} : { roomNumber: trimmed }) — cannot pass roomNumber: undefined directly"
  - "Room # column header left without sort handler — consistent with CONTEXT.md decision that room numbers are not sortable or filterable"
  - "Escape key added to roomNumber inline edit but not label edit — additive improvement without breaking label pattern"
  - "SearchOverlay: gap-1 + items-center for 'Room 204 · room' tighter grouping vs gap-2 for raw number display"

patterns-established:
  - "Inline edit cells: biome-ignore comments on td (useKeyWithClickEvents) + span (useKeyWithClickEvents + noStaticElementInteractions)"
  - "Optional field clearing: conditional spread {} vs { field: trimmed } to satisfy exactOptionalPropertyTypes"

requirements-completed: [FIX-05]

# Metrics
duration: 3min
completed: 2026-02-27
---

# Phase 14.1 Plan 03: Admin Room # Inline Edit and Search Room Display Summary

**Room # column in NodeDataTable now supports inline editing with Enter/Escape/blur, and SearchOverlay results display "Room 204 · room" with conditional dot separator instead of bare numbers.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-27T19:36:36Z
- **Completed:** 2026-02-27T19:39:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- NodeDataTable Room # cell is now inline-editable (click to enter edit mode, Enter/blur to commit, Escape to cancel)
- Empty input clears room number stored as undefined (not empty string) — correctly removes field from node
- SearchOverlay results show "Room 204 · room" with a middle dot separator when room number is present; no orphan separator when absent
- TypeScript and Biome both pass with zero errors on modified files

## Task Commits

Each task was committed atomically:

1. **Task 1: Add roomNumber inline editing to NodeDataTable** - `e3452a8` (feat)
2. **Task 2: Improve room number secondary text in SearchOverlay results** - `59ff6c5` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `src/client/components/admin/NodeDataTable.tsx` - Extended editingCell type to include 'roomNumber'; extended commitEdit with roomNumber branch using conditional spread for exactOptionalPropertyTypes; replaced static Room # td with full inline-edit cell
- `src/client/components/SearchOverlay.tsx` - Replaced bare roomNumber span with "Room {n} · type" pattern using conditional Fragment

## Decisions Made

- **exactOptionalPropertyTypes workaround:** TypeScript `exactOptionalPropertyTypes: true` disallows passing `roomNumber: undefined` in a Partial<NavNode>. Fixed by conditional spread: `trimmed === '' ? {} : { roomNumber: trimmed }`. This correctly removes the field when empty rather than setting it to undefined.
- **Escape cancel scope:** Added Escape key handler to Room # input only (not to existing label input). This is additive — the label cell had no Escape handler and that was not part of this plan's scope to change.
- **Biome CRLF fix included in Task 2 commit:** NodeDataTable was saved with CRLF line endings after the Write tool, causing a biome format error. Fixed with `biome format --write` before committing Task 2.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed exactOptionalPropertyTypes TypeScript error in commitEdit roomNumber branch**
- **Found during:** Task 1 (Add roomNumber inline editing to NodeDataTable) — TypeScript check
- **Issue:** `onUpdateNode(node.id, { roomNumber: editValue.trim() === '' ? undefined : editValue.trim() })` — TypeScript rejects `string | undefined` as `roomNumber` value because `exactOptionalPropertyTypes: true` makes optional properties truly optional (not `string | undefined`)
- **Fix:** Changed to `onUpdateNode(node.id, trimmed === '' ? {} : { roomNumber: trimmed })` — conditional spread omits the key entirely when clearing
- **Files modified:** src/client/components/admin/NodeDataTable.tsx
- **Verification:** `npx tsc --noEmit` passes with zero errors
- **Committed in:** e3452a8 (Task 1 commit)

**2. [Rule 3 - Blocking] Fixed CRLF line endings in NodeDataTable after Write tool**
- **Found during:** Task 2 verification — biome format error on NodeDataTable
- **Issue:** Write tool saved file with CRLF line endings; biome requires LF
- **Fix:** `npx @biomejs/biome format --write src/client/components/admin/NodeDataTable.tsx`
- **Files modified:** src/client/components/admin/NodeDataTable.tsx
- **Verification:** `npx @biomejs/biome check` on both files passes with no errors
- **Committed in:** 59ff6c5 (Task 2 commit, staged alongside SearchOverlay changes)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Both required for TypeScript and Biome compliance. No scope creep.

## Issues Encountered

None beyond the auto-fixed TypeScript/formatting issues above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Room # editing fully functional in NodeDataTable
- Search results show "Room {n} · type" for all nodes with room numbers
- Phase 14.1 complete — all 3 plans delivered

---
*Phase: 14.1-node-selection-fixes-and-admin-room-number-edit*
*Completed: 2026-02-27*
