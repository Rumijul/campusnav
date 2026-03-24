# S17: PostgreSQL Migration — completed 2026 03 01

**Goal:** unit tests prove PostgreSQL Migration — completed 2026-03-01 works
**Demo:** unit tests prove PostgreSQL Migration — completed 2026-03-01 works

## Must-Haves


## Tasks

- [x] **T01: Replace the SQLite database layer with PostgreSQL. Swap packages, rewrite the three…**
  - Replace the SQLite database layer with PostgreSQL. Swap packages, rewrite the three DB infrastructure files (schema.ts, client.ts, drizzle.config.ts), create Docker and environment config, then regenerate the migration SQL from the updated schema.
- [x] **T02: Convert all server-side database calls from synchronous (better-sqlite3) to async (postgres.js). Rewrite…**
  - Convert all server-side database calls from synchronous (better-sqlite3) to async (postgres.js). Rewrite seed.ts to be an async function, rewrite index.ts startup to await migrate + seed, and update the two routes in index.ts that use direct DB calls (GET /api/map and POST /api/admin/graph).
- [x] **T03: Human-verified end-to-end test of the PostgreSQL migration. Start the Docker database, run…**
  - Human-verified end-to-end test of the PostgreSQL migration. Start the Docker database, run the server, and confirm the full startup sequence (migrate → seed → serve) works correctly against a live PostgreSQL instance.

## Files Likely Touched

- `package.json`
- `src/server/db/schema.ts`
- `src/server/db/client.ts`
- `drizzle.config.ts`
- `drizzle/0000_*.sql`
- `drizzle/meta/_journal.json`
- `drizzle/meta/0000_snapshot.json`
- `docker-compose.yml`
- `.env`
- `.env.example`
- `src/server/db/seed.ts`
- `src/server/index.ts`
