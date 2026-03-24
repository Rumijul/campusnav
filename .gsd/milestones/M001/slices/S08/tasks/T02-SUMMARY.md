---
phase: 07-api-data-persistence
plan: 02
subsystem: api
tags: [drizzle-orm, better-sqlite3, sqlite, hono, seed, migration]

# Dependency graph
requires:
  - phase: 07-01
    provides: Drizzle schema (nodes/edges/graph_metadata), better-sqlite3 DB client singleton, SQL migration files
provides:
  - Idempotent startup seeder (src/server/db/seed.ts) reads campus-graph.json and inserts into SQLite on first run
  - Rewritten GET /api/map handler querying SQLite via Drizzle (synchronous, no auth)
  - Server startup sequence: migrate() then seedIfEmpty() before first request
affects:
  - 07-03-PLAN (client loading UX can now rely on DB-backed server response)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Synchronous Drizzle better-sqlite3 pattern: .all(), .run() (no await)
    - Idempotent seeder: count check before insert, onConflictDoNothing() belt-and-suspenders
    - Startup sequence: migrate then seedIfEmpty at module top-level (synchronous, before Hono routes)
    - Optional field spread: ...(field != null && { field }) — no spurious undefined keys in NavGraph response

key-files:
  created:
    - src/server/db/seed.ts
  modified:
    - src/server/index.ts

key-decisions:
  - "GET /api/map is a plain synchronous handler — better-sqlite3 is synchronous, no async/await needed"
  - "Nullable optional NavGraph fields use spread pattern ...(field != null && { field }) to preserve exact type shape"
  - "1e10 sentinel preserved through full DB round-trip — stored as REAL in SQLite, returned as 10000000000 in JSON (never Infinity)"
  - "migrate() called at module top-level with resolve(__dirname, '../../drizzle') — two levels up from src/server/"
  - "campus-graph.json kept in place as canonical seed source — seeder reads it, does not delete it"

patterns-established:
  - "Pattern: Module-level startup sequence (migrate → seedIfEmpty) runs synchronously before Hono app definition"
  - "Pattern: onConflictDoNothing() on all three insert statements for idempotency"

requirements-completed: [ADMN-02]

# Metrics
duration: 5min
completed: 2026-02-21
---

# Phase 7 Plan 02: Startup seeder + SQLite-backed /api/map handler

**Idempotent campus-graph.json seeder populating SQLite on first server start, plus GET /api/map rewritten from file reads to Drizzle queries returning live NavGraph JSON**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-02-20T18:58:03Z
- **Completed:** 2026-02-20T19:03:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created src/server/db/seed.ts with idempotent seedIfEmpty() that reads campus-graph.json and inserts all nodes, edges, and metadata only when the nodes table is empty
- Rewrote GET /api/map from readFile(campus-graph.json) to synchronous Drizzle SELECT queries against SQLite
- Added migrate() + seedIfEmpty() startup sequence at module top-level so DB is always ready before first request
- Verified 1e10 accessibleWeight values survive the DB round-trip (returned as 10000000000 in JSON — never null or Infinity)
- Confirmed idempotency: second server start logs "[seed] Already seeded (25 nodes) — skipping"

## Task Commits

Each task was committed atomically:

1. **Task 1: Write idempotent startup seeder** - `fdf9125` (feat)
2. **Task 2: Rewrite server startup and /api/map handler to use SQLite** - `905e255` (feat)

**Plan metadata:** TBD (docs commit)

## Files Created/Modified
- `src/server/db/seed.ts` - Idempotent seeder: reads campus-graph.json, inserts nodes/edges/graphMetadata if nodes table is empty; onConflictDoNothing() guard
- `src/server/index.ts` - Added migrate+seedIfEmpty startup sequence; rewrote /api/map to use Drizzle db.select() queries (synchronous, no async)

## Decisions Made
- GET /api/map handler is a plain (non-async) function — better-sqlite3 is fully synchronous, no await needed, simpler code
- Optional NavGraph fields use spread pattern `...(field != null && { field })` — preserves exact NavGraph TypeScript shape without undefined keys polluting JSON
- 1e10 is stored and returned as-is — the pathfinding engine (buildGraph) handles Infinity conversion on the client side; server stores and returns the raw sentinel
- `resolve(__dirname, '../../drizzle')` — from src/server/, two levels up reaches project root where drizzle/ lives

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - database auto-seeded on first server start from campus-graph.json.

## Next Phase Readiness
- Server now serves NavGraph from SQLite — GET /api/map returns live DB data on every request
- Plan 03 can add client-side loading UX (spinner, retry) knowing the server endpoint is stable
- TypeScript compiles with zero errors across all modified files
- Idempotency verified: repeated server starts do not duplicate data

---
*Phase: 07-api-data-persistence*
*Completed: 2026-02-21*

## Self-Check: PASSED

All files verified present and all commits confirmed in git history.
- FOUND: src/server/db/seed.ts
- FOUND: src/server/index.ts
- FOUND: .planning/phases/07-api-data-persistence/07-02-SUMMARY.md
- FOUND commit: fdf9125 (Task 1 - idempotent startup seeder)
- FOUND commit: 905e255 (Task 2 - server rewrite with SQLite /api/map)
