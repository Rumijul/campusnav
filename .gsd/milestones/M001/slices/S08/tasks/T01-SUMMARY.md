---
phase: 07-api-data-persistence
plan: 01
subsystem: database
tags: [drizzle-orm, better-sqlite3, drizzle-kit, sqlite, schema]

# Dependency graph
requires:
  - phase: 03-graph-data-model-pathfinding-engine
    provides: NavNode, NavEdge, NavGraph TypeScript types in src/shared/types.ts
provides:
  - Drizzle ORM schema (nodes, edges, graph_metadata tables) matching NavGraph shape
  - better-sqlite3 + Drizzle DB client singleton (src/server/db/client.ts)
  - drizzle.config.ts at project root for migration CLI
  - Initial SQL migration file in drizzle/ (committed, version-controlled)
  - data/ gitignored (campus.db excluded from VCS)
affects:
  - 07-02-PLAN (seeder + /api/map handler rewrite uses db from client.ts)
  - 07-03-PLAN (client loading UX depends on server returning DB data)

# Tech tracking
tech-stack:
  added:
    - drizzle-orm@0.45.1 (ORM: typed schema, query builder, migrator)
    - better-sqlite3@12.6.2 (synchronous SQLite driver)
    - drizzle-kit@0.31.9 (migration file generation CLI)
    - "@types/better-sqlite3@7.6.13 (TypeScript types for better-sqlite3)"
  patterns:
    - Drizzle table definitions with real/text/integer(boolean) column types
    - DB singleton via mkdirSync + new Database(path) + drizzle(sqlite, schema)
    - ESM __dirname via dirname(fileURLToPath(import.meta.url))
    - Migration-first approach: generate SQL files committed to git

key-files:
  created:
    - src/server/db/schema.ts
    - src/server/db/client.ts
    - drizzle.config.ts
    - drizzle/0000_brief_madame_hydra.sql
    - drizzle/meta/_journal.json
    - drizzle/meta/0000_snapshot.json
  modified:
    - package.json (added four new dependencies)
    - .gitignore (added data/ entry)

key-decisions:
  - "DB file location: data/campus.db at project root (gitignored via data/ entry)"
  - "Migration approach: drizzle-kit generate + migrate (not push) for version-controlled SQL history"
  - "mkdirSync({ recursive: true }) in client.ts ensures data/ dir created on first run without error if existing"
  - "1e10 sentinel for non-accessible edges stored as REAL — never converted to Infinity (JSON cannot serialize Infinity)"
  - "drizzle/ migration folder committed to git; data/ gitignored — standard Drizzle practice"

patterns-established:
  - "Pattern: ESM __dirname via dirname(fileURLToPath(import.meta.url)) — used in client.ts"
  - "Pattern: DB singleton — one better-sqlite3 connection per process, shared across all handlers"
  - "Pattern: boolean columns as integer({ mode: 'boolean' }) — SQLite 0/1, Drizzle auto-converts"

requirements-completed: [ADMN-02]

# Metrics
duration: 2min
completed: 2026-02-20
---

# Phase 7 Plan 01: Install Drizzle ORM + define SQLite schema for campus navigation graph

**Drizzle ORM schema with nodes/edges/graph_metadata tables, better-sqlite3 client singleton, drizzle-kit migration file — database infrastructure layer ready for seeder and handler rewrite**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-02-20T18:52:50Z
- **Completed:** 2026-02-20T18:55:23Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Installed drizzle-orm, better-sqlite3, drizzle-kit, @types/better-sqlite3 (4 packages)
- Defined Drizzle schema in src/server/db/schema.ts with three tables matching NavGraph TypeScript shape exactly
- Created better-sqlite3 + Drizzle DB client singleton in src/server/db/client.ts with mkdirSync data/ guard
- Generated initial SQL migration file via `npx drizzle-kit generate` (drizzle/0000_brief_madame_hydra.sql)
- Added data/ to .gitignore to exclude SQLite database file from version control

## Task Commits

Each task was committed atomically:

1. **Task 1: Install packages and define Drizzle schema** - `e35c915` (feat)
2. **Task 2: Create DB client, drizzle config, generate migration, gitignore DB file** - `4889faa` (feat)

**Plan metadata:** TBD (docs commit)

## Files Created/Modified
- `src/server/db/schema.ts` - Drizzle table definitions: nodes (11 cols), edges (8 cols), graph_metadata (4 cols)
- `src/server/db/client.ts` - better-sqlite3 + Drizzle singleton, mkdirSync data/, exports db
- `drizzle.config.ts` - Drizzle Kit config pointing to schema and ./drizzle output, sqlite dialect
- `drizzle/0000_brief_madame_hydra.sql` - Generated CREATE TABLE SQL for all three tables
- `drizzle/meta/_journal.json` - Drizzle Kit migration journal (tracks applied migrations)
- `drizzle/meta/0000_snapshot.json` - Schema snapshot for Drizzle Kit diff calculations
- `package.json` - Added 4 packages to dependencies/devDependencies
- `.gitignore` - Added data/ entry to exclude campus.db

## Decisions Made
- DB file location: `data/campus.db` at project root, `data/` gitignored — standard practice
- Migration-first: `drizzle-kit generate` creates committed SQL files (not `push` which skips SQL files)
- `mkdirSync({ recursive: true })` in client.ts creates `data/` on first run automatically
- Keep `1e10` sentinel as-is for non-accessible edge weights — do not convert to `Infinity` (JSON.stringify(Infinity) = null)
- `drizzle/` folder committed to git; migration SQL is version-controlled schema history

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required. Database file is auto-created on first server run.

## Next Phase Readiness
- Schema and DB client ready for Plan 02: startup seeder reads campus-graph.json → inserts rows if empty
- Plan 02 will also rewrite GET /api/map handler from readFile to db.select() queries
- Plan 03 adds loading spinner + retry UX on client side
- TypeScript compiles without errors across all new files

---
*Phase: 07-api-data-persistence*
*Completed: 2026-02-20*

## Self-Check: PASSED

All files verified present and all commits confirmed in git history.
- FOUND: src/server/db/schema.ts
- FOUND: src/server/db/client.ts
- FOUND: drizzle.config.ts
- FOUND: drizzle/0000_brief_madame_hydra.sql
- FOUND: 07-01-SUMMARY.md
- FOUND commit: e35c915 (Task 1)
- FOUND commit: 4889faa (Task 2)
