---
phase: 09-admin-map-editor-visual
plan: 01
subsystem: ui
tags: [react, konva, hooks, useReducer, hono, sqlite, drizzle, admin, editor]

# Dependency graph
requires:
  - phase: 08-admin-authentication
    provides: JWT guard on /api/admin/* routes (all admin endpoints auto-protected)
  - phase: 07-api-data-persistence
    provides: Drizzle ORM + SQLite schema (nodes, edges, graphMetadata tables)
provides:
  - useEditorState hook — single source of truth for all editor UI components
  - POST /api/admin/graph — atomic SQLite graph replacement via transaction
  - POST /api/admin/floor-plan — image upload writing to server assets
affects: [09-02, 09-03, 09-04, future admin UI components]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - useReducer for complex editor state with action union types
    - Ref-based undo/redo stack (not useState) per Konva docs pattern
    - Lightweight useState counter to trigger re-renders for canUndo/canRedo
    - better-sqlite3 synchronous transaction via db.$client for atomic graph replace

key-files:
  created:
    - src/client/hooks/useEditorState.ts
  modified:
    - src/server/index.ts

key-decisions:
  - "Undo/redo history stored in useRef (not useState) — avoids double renders; lightweight historyInfo useState triggers re-renders only for button disabled states"
  - "db.$client accesses underlying better-sqlite3 Database for synchronous .transaction() API — Drizzle's own transaction is async but better-sqlite3 is sync-only"
  - "RESTORE_SNAPSHOT action replaces full state snapshot — enables clean undo/redo without partial state merging"
  - "Removed GET /api/admin/ping placeholder — real admin endpoints make it obsolete"

patterns-established:
  - "EditorAction union type: discriminated union with literal type field for exhaustive reducer switch"
  - "SET_MODE clears all selection state — mode switching starts clean every time"
  - "history.current sliced to current step before push — new action discards redo future"
  - "History capped at 50 entries with Array.shift() to bound memory"

requirements-completed: [EDIT-01, EDIT-04, EDIT-05]

# Metrics
duration: 4min
completed: 2026-02-21
---

# Phase 9 Plan 01: Admin Map Editor Data Layer Summary

**useEditorState hook (useReducer + ref-based undo/redo) + POST /api/admin/graph (SQLite transaction) + POST /api/admin/floor-plan (multipart upload)**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-21T06:05:36Z
- **Completed:** 2026-02-21T06:09:45Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created `useEditorState` hook as single source of truth for all editor UI components — manages nodes, edges, mode, selection, pending edge source, dirty flag, and 50-entry undo/redo stack
- Added `POST /api/admin/graph` endpoint that atomically replaces the entire NavGraph in SQLite using better-sqlite3's synchronous `.transaction()` wrapper
- Added `POST /api/admin/floor-plan` endpoint accepting multipart image uploads with MIME type validation, writing to `assets/floor-plan.png`
- Removed placeholder `GET /api/admin/ping` endpoint

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useEditorState hook** - `cfbda64` (feat)
2. **Task 2: Add POST /api/admin/graph and POST /api/admin/floor-plan endpoints** - `aff354a` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/client/hooks/useEditorState.ts` — useReducer-based editor state with EditorState, EditorAction union, undo/redo refs, and exported helpers (generateNodeId, generateEdgeId, calcDistance)
- `src/server/index.ts` — Added writeFile import, POST /api/admin/graph (transaction-wrapped), POST /api/admin/floor-plan (multipart upload); removed /api/admin/ping

## Decisions Made
- Undo/redo stored in `useRef` (not `useState`) per Konva docs — avoids double-renders on every history push. A lightweight `historyInfo` useState tracks step/length for `canUndo`/`canRedo` re-render triggering.
- `db.$client` used to access the underlying better-sqlite3 Database instance for synchronous `.transaction()` — Drizzle ORM's transaction API is async but better-sqlite3 is sync-only.
- `RESTORE_SNAPSHOT` action replaces the full nodes/edges snapshot from history — simpler than per-field merge and correct for undo/redo semantics.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed unused NavGraph import and added null guards for history array access**
- **Found during:** Task 1 (TypeScript check)
- **Issue:** `NavGraph` was imported but unused (TS6196); `history.current[step]` could be `undefined` when bounds check was at edge (TS2322)
- **Fix:** Removed `NavGraph` from import; added `if (!snapshot) return` guards before each `dispatch` call
- **Files modified:** src/client/hooks/useEditorState.ts
- **Verification:** `npx tsc --noEmit` passes with zero errors
- **Committed in:** cfbda64 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - TypeScript type errors)
**Impact on plan:** Necessary for correctness. Null guards prevent silent runtime failures on undo/redo at history boundaries.

## Issues Encountered
- Pre-existing CRLF line ending format errors across many files reported by `npx biome check .` — these are out-of-scope pre-existing issues unrelated to this plan's changes. Both modified files (`useEditorState.ts`, `index.ts`) pass `npx biome check` cleanly.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `useEditorState` hook is ready for consumption by editor UI components (canvas, node palette, properties panel, toolbar)
- Both admin API endpoints are JWT-protected and functional
- Graph save uses SQLite transaction for atomic replace-all semantics
- Floor plan upload validates MIME type and writes to the same path served by `GET /api/floor-plan/image`

---
*Phase: 09-admin-map-editor-visual*
*Completed: 2026-02-21*
