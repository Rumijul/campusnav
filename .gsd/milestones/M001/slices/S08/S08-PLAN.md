# S08: API & Data Persistence — completed 2026 02 22

**Goal:** unit tests prove API & Data Persistence — completed 2026-02-22 works
**Demo:** unit tests prove API & Data Persistence — completed 2026-02-22 works

## Must-Haves


## Tasks

- [x] **T01: Install Drizzle ORM + better-sqlite3, define the SQLite schema matching the NavGraph…**
  - Install Drizzle ORM + better-sqlite3, define the SQLite schema matching the NavGraph TypeScript shape, create the DB client singleton, generate the initial migration file, and gitignore the database file.
- [x] **T02: Write the startup seeder that populates SQLite from campus-graph.json on first run…**
  - Write the startup seeder that populates SQLite from campus-graph.json on first run, and rewrite the GET /api/map handler to query SQLite via Drizzle instead of reading a JSON file.
- [x] **T03: Add retry logic + HTML loading spinner to useGraphData, and fix the…**
  - Add retry logic + HTML loading spinner to useGraphData, and fix the double-fetch by lifting graph state into FloorPlanCanvas and passing the nodes array as a prop to LandmarkLayer (eliminating LandmarkLayer's own useGraphData call).
- [x] **T04: Human verification: confirm the student app works end-to-end with server-persisted data —…**
  - Human verification: confirm the student app works end-to-end with server-persisted data — no hardcoded fallbacks, no authentication required, loading state visible, routing functional.

## Files Likely Touched

- `src/server/db/schema.ts`
- `src/server/db/client.ts`
- `drizzle.config.ts`
- `.gitignore`
- `src/server/db/seed.ts`
- `src/server/index.ts`
- `src/client/hooks/useGraphData.ts`
- `src/client/components/FloorPlanCanvas.tsx`
- `src/client/components/LandmarkLayer.tsx`
