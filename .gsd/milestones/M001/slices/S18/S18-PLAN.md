# S18: Multi Floor Data Model — completed 2026 03 01

**Goal:** unit tests prove Multi-floor Data Model — completed 2026-03-01 works
**Demo:** unit tests prove Multi-floor Data Model — completed 2026-03-01 works

## Must-Haves


## Tasks

- [x] **T01: Update the Drizzle schema and generate + hand-edit the migration SQL to…**
  - Update the Drizzle schema and generate + hand-edit the migration SQL to introduce the multi-floor relational model.
- [x] **T02: Update the shared TypeScript types to the multi-floor shape, reformat the seed…**
  - Update the shared TypeScript types to the multi-floor shape, reformat the seed data file, and update the seeder to write buildings → floors → nodes → edges in dependency order.
- [x] **T03: Update the API handlers in index.ts to serve the new multi-floor NavGraph…**
  - Update the API handlers in index.ts to serve the new multi-floor NavGraph shape, and add a flattenNavGraph shim to graph-builder.ts so the pathfinding engine compiles against the new NavGraph type without cross-floor logic changes (that is Phase 17's work).
- [x] **T04: Human verification: confirm the migration runs cleanly, the seed populates the database…**
  - Human verification: confirm the migration runs cleanly, the seed populates the database correctly, and the multi-floor API endpoints return the expected data.

## Files Likely Touched

- `src/server/db/schema.ts`
- `drizzle/0001_multi_floor.sql`
- `src/shared/types.ts`
- `src/server/assets/campus-graph.json`
- `src/server/db/seed.ts`
- `src/server/index.ts`
- `src/shared/pathfinding/graph-builder.ts`
