---
phase: 15-postgresql-migration
plan: "02"
subsystem: database
tags: [postgres, drizzle-orm, postgres-js, migration, async, seed]

# Dependency graph
requires:
  - phase: 15-01
    provides: PostgreSQL Drizzle client, schema, and migration files replacing SQLite
provides:
  - Async seed.ts with seedIfEmpty(): Promise<void>
  - Async startup in index.ts (dedicated migration client, top-level await)
  - Async GET /api/map route handler
  - Async POST /api/admin/graph route using db.transaction()
affects: [15-03, server startup, admin graph save, student map load]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Dedicated short-lived postgres({ max: 1 }) migration client, closed after migrate()
    - Top-level await for ESM module startup sequence (migrate -> seed)
    - db.transaction(async tx => {...}) replacing db.$client.transaction() synchronous API

key-files:
  created: []
  modified:
    - src/server/db/seed.ts
    - src/server/index.ts

key-decisions:
  - "Top-level await used for migrate/seed startup — valid in ESM (package.json type=module)"
  - "Dedicated postgres({ max: 1 }) migration client closed after migration completes — prevents connection pool overhead during startup"
  - "db.transaction(async tx => {...}) replaces db.$client.transaction() — Drizzle ORM API used instead of raw postgres.js client"
  - "GET /api/map made async — db.select() calls awaited directly without .all()"

patterns-established:
  - "Async route pattern: app.get('/api/map', async (c) => { const rows = await db.select()... })"
  - "Drizzle transaction pattern: await db.transaction(async (tx) => { await tx.delete/insert... })"

requirements-completed: [INFR-01]

# Metrics
duration: 3min
completed: 2026-03-01
---

# Phase 15 Plan 02: PostgreSQL Migration — Async Server Rewrites Summary

**All server DB calls converted from synchronous better-sqlite3 (.all/.run) to async postgres.js (await) — seed, startup, and both affected routes fully PostgreSQL-compatible**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-01T04:30:02Z
- **Completed:** 2026-03-01T04:33:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Rewrote `seed.ts` to `async function seedIfEmpty(): Promise<void>` — all `.all()` and `.run()` calls replaced with `await db.select/insert`
- Rewrote `index.ts` startup to use a dedicated `postgres({ max: 1 })` migration client with `await migrate()` and `await seedIfEmpty()` via top-level await (ESM)
- Converted `GET /api/map` from synchronous to `async (c) =>` with `await db.select()` for all three queries
- Replaced `db.$client.transaction()` synchronous SQLite API in `POST /api/admin/graph` with `await db.transaction(async (tx) => {...})` Drizzle ORM pattern

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite seed.ts to async** - `a97d63c` (feat)
2. **Task 2: Rewrite index.ts — async startup, postgres-js migrator, async routes, db.transaction()** - `94e7394` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/server/db/seed.ts` - Converted to async; `export async function seedIfEmpty(): Promise<void>`; all `.run()` and `.all()` removed
- `src/server/index.ts` - migrate import changed to `drizzle-orm/postgres-js/migrator`; startup uses top-level `await`; GET /api/map is async; POST /api/admin/graph uses `db.transaction()`

## Decisions Made
- Top-level await in index.ts is valid because `package.json` has `"type": "module"` (ESM) — no IIFE wrapper needed
- Dedicated `postgres({ max: 1 })` migration client avoids consuming the main connection pool during startup; it is `.end()`-ed immediately after migration
- `db.transaction(async tx => {...})` is the correct Drizzle ORM async transaction API for postgres-js; `db.$client.transaction()` was the SQLite-specific sync API

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None — no external service configuration required beyond what was set up in Plan 01.

## Next Phase Readiness
- The entire server codebase is now PostgreSQL-compatible with zero synchronous better-sqlite3 API calls remaining
- `npm run typecheck` passes cleanly
- Ready for Plan 03: human checkpoint to start the server against a live PostgreSQL instance and verify end-to-end connectivity

---
*Phase: 15-postgresql-migration*
*Completed: 2026-03-01*
