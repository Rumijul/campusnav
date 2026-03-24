---
phase: 15-postgresql-migration
plan: 03
type: execute
wave: 3
depends_on: [15-01, 15-02]
files_modified: []
autonomous: false
requirements: [INFR-01]

must_haves:
  truths:
    - "Docker PostgreSQL container starts successfully with `docker compose up -d`"
    - "`npm run dev:server` starts without crash — migration runs, seed runs, server listens on port 3001"
    - "GET http://localhost:3001/api/health returns `{\"status\":\"ok\"}` — server is live"
    - "GET http://localhost:3001/api/map returns a JSON object with `nodes`, `edges`, and `metadata` arrays — seeded data is queryable"
    - "Server console shows `[seed] Inserted N nodes, M edges` on first run, then `[seed] Already seeded` on restart — idempotent seed works"
    - "No `.all()` or `.run()` runtime errors appear in the server console"
  artifacts: []
  key_links:
    - Docker container provides the DATABASE_URL target that the server connects to on startup
    - The migrate() call at startup creates the tables before seed runs — sequence is correct
---

<objective>
Human-verified end-to-end test of the PostgreSQL migration. Start the Docker database, run the server, and confirm the full startup sequence (migrate → seed → serve) works correctly against a live PostgreSQL instance.

Purpose: Code review alone cannot prove the database connection, migration, and seed work — a live integration test is required. This checkpoint provides that guarantee before Phase 16.
Output: Confirmed working PostgreSQL-backed server.
</objective>

<execution_context>
@C:/Users/LENOVO/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/LENOVO/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/15-postgresql-migration/15-CONTEXT.md
</context>

<tasks>

<task type="checkpoint:human-verify">
  <name>Task 1: Start Docker PostgreSQL + run server + verify API endpoints</name>
  <files></files>
  <action>
**Step 1 — Start the Docker PostgreSQL container:**
```bash
docker compose up -d
```
Wait ~5 seconds for PostgreSQL to initialize. Verify the container is running:
```bash
docker compose ps
```
Expected: postgres container shows status `running` or `healthy`.

**Step 2 — Start the dev server:**
```bash
npm run dev:server
```
Watch the console output. Expected startup sequence:
1. No TypeScript or import errors
2. Migration runs (drizzle-kit applies the new PostgreSQL DDL — no output or a brief log)
3. `[seed] Inserted N nodes, M edges` — initial seed from campus-graph.json
4. `Server running on http://localhost:3001`

**Step 3 — Verify the health endpoint:**
Open a new terminal:
```bash
curl http://localhost:3001/api/health
```
Expected: `{"status":"ok","timestamp":"..."}` with HTTP 200.

**Step 4 — Verify the map data endpoint:**
```bash
curl http://localhost:3001/api/map | head -c 500
```
Expected: JSON with `nodes` array, `edges` array, `metadata` object. At least 40+ nodes should be present (matching campus-graph.json).

**Step 5 — Verify idempotent seed:**
Stop the server (Ctrl+C), then restart with `npm run dev:server`.
Expected: Console now shows `[seed] Already seeded (N nodes) — skipping` — NOT a second round of inserts.

**If any step fails:**
- Connection refused on startup → check DATABASE_URL in .env matches docker-compose service credentials
- `relation "nodes" does not exist` → migration did not run; check that `await migrate(...)` and `await migrationClient.end()` are both in index.ts
- `TypeError: db.select(...).from(...).all is not a function` → a `.all()` call was missed in Plan 02; grep for `.all()` in src/server/ and fix
- Docker container not starting → check port 5432 is not already in use: `lsof -i :5432`
  </action>
  <verify>
    <automated>curl -s http://localhost:3001/api/health</automated>
  </verify>
  <done>All five steps above pass: Docker container running, server starts cleanly with seed output, /api/health returns 200, /api/map returns seeded graph data, restart shows "Already seeded" idempotency confirmation.</done>
</task>

</tasks>

<verification>
The PostgreSQL migration is complete when the human confirms all five steps in Task 1 pass without errors. The key integration points proven:

1. Connection: postgres.js client connects to Docker PostgreSQL via DATABASE_URL
2. Migration: drizzle-orm/postgres-js/migrator creates tables successfully
3. Seed: seedIfEmpty() inserts all nodes/edges/metadata from campus-graph.json
4. Idempotency: second server start skips seed correctly
5. API: GET /api/map serves the seeded graph data as JSON

INFR-01 is satisfied: the application database has been migrated from SQLite to PostgreSQL, ready for cloud-hosted deployment on Neon.
</verification>

<success_criteria>
- `curl http://localhost:3001/api/health` returns `{"status":"ok",...}`
- `curl http://localhost:3001/api/map` returns JSON with nodes/edges/metadata
- Server restart shows `[seed] Already seeded` (no duplicate inserts)
- Zero runtime errors in server console
- Phase 15 PostgreSQL Migration: COMPLETE — INFR-01 satisfied
</success_criteria>

<output>
After completion, create `.planning/phases/15-postgresql-migration/15-03-SUMMARY.md` using the summary template.
</output>
