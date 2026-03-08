---
phase: 15-postgresql-migration
plan: 01
subsystem: database
tags: [postgres, drizzle-orm, drizzle-kit, docker, pg-core, postgresql]

# Dependency graph
requires:
  - phase: 07-api-data-persistence
    provides: SQLite schema (nodes, edges, graph_metadata) and drizzle ORM client being replaced
provides:
  - postgres-js driver wired into drizzle with same `db` export name
  - pg-core schema (pgTable, boolean, serial) replacing sqlite-core
  - Fresh PostgreSQL DDL migration in drizzle/0000_romantic_abomination.sql
  - docker-compose.yml with postgres:16 local dev service
  - .env.example documenting DATABASE_URL for new contributors
affects: [15-02, routes, seed, admin-map-editor]

# Tech tracking
tech-stack:
  added: [postgres@^3.4.8, drizzle-orm/postgres-js, drizzle-orm/pg-core]
  patterns: [postgres-js connection pool (max=5) with SSL toggle on NODE_ENV=production, drizzle-orm({ client, schema }) constructor for postgres-js]

key-files:
  created: [docker-compose.yml, .env.example, drizzle/0000_romantic_abomination.sql, drizzle/meta/_journal.json, drizzle/meta/0000_snapshot.json]
  modified: [src/server/db/schema.ts, src/server/db/client.ts, drizzle.config.ts, package.json, package-lock.json]

key-decisions:
  - "postgres-js chosen (not pg/node-postgres) — native ESM, promise-based, matches Neon serverless connection model"
  - "ssl: process.env.NODE_ENV === 'production' ? 'require' : false — enables local Docker dev without TLS while enforcing SSL on Neon"
  - "Pool max=5 — conservative default; Neon free tier limits concurrent connections"
  - "db export name unchanged from SQLite version — all downstream imports remain valid without modification"
  - "drizzle-kit generate only (not push) — committed SQL files maintain migration history for Neon deploy"
  - "Downstream errors (seed.ts, index.ts) deferred to Plan 02 — SQLite sync APIs (.all, .run, .transaction) replaced with async patterns in next plan"

patterns-established:
  - "PostgreSQL drizzle client: postgres(DATABASE_URL, { ssl, max }) + drizzle({ client, schema }) — standard pattern for Plans 02+"
  - "boolean() for boolean columns — no integer(mode:'boolean') SQLite workaround needed"
  - "serial() for auto-increment primary keys — replaces integer().primaryKey({ autoIncrement: true })"

requirements-completed: [INFR-01]

# Metrics
duration: 3min
completed: 2026-03-01
---

# Phase 15 Plan 01: PostgreSQL Migration — DB Layer Summary

**Replaced SQLite (better-sqlite3) with PostgreSQL (postgres-js + drizzle pg-core): new schema, client, config, Docker service, and freshly generated PostgreSQL DDL migration.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-01T04:24:47Z
- **Completed:** 2026-03-01T04:26:51Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Swapped `better-sqlite3` out and `postgres@^3.4.8` in; removed `@types/better-sqlite3` from devDependencies
- Rewrote all three DB infrastructure files (schema.ts, client.ts, drizzle.config.ts) for PostgreSQL with zero downstream import changes (`db` export preserved)
- Created docker-compose.yml (postgres:16, port 5432), updated .env with DATABASE_URL, created .env.example
- Cleared stale SQLite DDL and regenerated clean PostgreSQL migration (boolean columns, serial primary key, double-quoted identifiers)

## Task Commits

Each task was committed atomically:

1. **Task 1: Swap packages, rewrite schema.ts and client.ts, update drizzle.config.ts** - `8139d46` (feat)
2. **Task 2: Create docker-compose.yml, .env, .env.example, then clear and regenerate migrations** - `afc235e` (feat)

## Files Created/Modified
- `src/server/db/schema.ts` — Rewrote: sqliteTable→pgTable, integer({mode:'boolean'})→boolean(), integer autoIncrement→serial()
- `src/server/db/client.ts` — Rewrote: postgres-js driver with SSL toggle, max=5 pool, same `db` export
- `drizzle.config.ts` — Updated: dialect sqlite→postgresql, dbCredentials.url→DATABASE_URL env var
- `package.json` — Added postgres@^3.4.8, removed better-sqlite3 and @types/better-sqlite3
- `docker-compose.yml` — Created: postgres:16 service, campusnav user/db/password, port 5432, named volume
- `.env` — Added DATABASE_URL=postgresql://campusnav:campusnav@localhost:5432/campusnav (existing secrets preserved)
- `.env.example` — Created: safe placeholder documentation for all four required env vars
- `drizzle/0000_romantic_abomination.sql` — Generated: PostgreSQL DDL (CREATE TABLE with boolean, serial, double-quoted identifiers)
- `drizzle/meta/_journal.json` — Generated: drizzle-kit migration journal
- `drizzle/meta/0000_snapshot.json` — Generated: schema snapshot for drift detection

## Decisions Made
- **postgres-js over pg:** Native ESM, promise-based, matches Neon serverless model (no callback API needed)
- **SSL toggle:** `ssl: NODE_ENV === 'production' ? 'require' : false` enables local Docker dev without TLS while enforcing SSL on Neon
- **Pool max=5:** Conservative default; Neon free tier limits concurrent connections
- **Export name unchanged:** `db` stays same — all `import { db } from './db/client'` downstream imports work without modification
- **generate not push:** Migration-first approach preserves committed SQL history for reproducible deploys
- **Downstream deferred to Plan 02:** seed.ts and index.ts still use SQLite sync APIs (.all, .run, .transaction) — those errors are expected and planned for Plan 02

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

TypeScript errors appeared in `seed.ts` and `index.ts` after the DB layer swap (SQLite sync APIs `.all()`, `.run()`, `.transaction()` not available on PostgreSQL Drizzle). These are expected and planned — the plan explicitly defers route/seed rewrites to Plan 02. The DB infrastructure files (schema.ts, client.ts, drizzle.config.ts) themselves compile cleanly.

## User Setup Required

To use the local development environment with PostgreSQL:

1. Ensure Docker Desktop is running
2. Run: `docker compose up -d`
3. The application will connect to `postgresql://campusnav:campusnav@localhost:5432/campusnav`

For Neon cloud deployment, set `DATABASE_URL` to the Neon connection string (Plan 02 will cover migration application at startup).

## Next Phase Readiness
- PostgreSQL DB layer is fully installed; `db` export ready for async queries
- Migration SQL is valid PostgreSQL DDL; can be applied with `drizzle-kit migrate` or at startup
- Docker + .env enables local developer to run `docker compose up -d` and connect immediately
- Plan 02 can safely rewrite server startup (migrate-on-start), routes (async queries), and seed (async insert patterns)

---
*Phase: 15-postgresql-migration*
*Completed: 2026-03-01*
