---
phase: 16-multi-floor-data-model
plan: 04
type: execute
wave: 4
depends_on:
  - 16-03
files_modified: []
autonomous: false

requirements:
  - MFLR-01
  - MFLR-02
  - CAMP-01

must_haves:
  truths:
    - "Server starts without errors against a fresh Docker PostgreSQL database"
    - "Migration runs and creates buildings, floors tables; drops graphMetadata"
    - "Seed inserts 48 nodes under Main Building / Floor 1"
    - "GET /api/map returns { buildings: [{ floors: [{ nodes: [...48 nodes...], edges: [...] }] }] }"
    - "GET /api/floor-plan/1/1 returns a PNG image (200 OK)"
    - "Server restarts idempotently — seed guard skips insertion on second run"
  artifacts:
    - path: "src/server/index.ts"
      provides: "Running server confirmed to serve multi-floor NavGraph"
    - path: "drizzle/0001_multi_floor.sql"
      provides: "Confirmed migration applied in running PostgreSQL instance"
  key_links:
    - from: "GET /api/map"
      to: "buildings table JOIN floors JOIN nodes"
      via: "Human confirms response JSON has buildings array at root"
      pattern: "curl localhost:3001/api/map | jq .buildings[0].floors[0].nodes | length"
    - from: "migration startup"
      to: "PostgreSQL database"
      via: "Server logs show migration applied then seed inserted 48 nodes"
      pattern: "Inserted 48 nodes"
---

<objective>
Human verification: confirm the migration runs cleanly, the seed populates the database correctly, and the multi-floor API endpoints return the expected data.

Purpose: Plans 01-03 are all code changes. This checkpoint confirms they work end-to-end against a real running database before Phase 17 depends on this foundation.

Output: Human approval signal confirming Phase 16 is complete.
</objective>

<execution_context>
@C:/Users/admin/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/admin/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
</context>

<tasks>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>
Plans 01-03 have completed the following changes:
- schema.ts: added buildings + floors tables; modified nodes table (floor_id FK, connector columns, buildingName removed); graphMetadata removed
- drizzle/0001_multi_floor.sql: migration that creates new tables, inserts Main Building + Floor 1, back-fills floor_id for 48 existing nodes, drops graphMetadata
- types.ts: NavGraph now nested (buildings → floors → nodes/edges); NavNodeData has floorId instead of floor
- campus-graph.json: reformatted to multi-floor nested structure (48 nodes under buildings[0].floors[0])
- seed.ts: reads new JSON format, uses RETURNING to capture floor IDs
- index.ts: GET /api/map returns multi-floor NavGraph; POST /api/admin/graph handles new shape; new GET /api/floor-plan/:buildingId/:floorNumber added
- graph-builder.ts: flattenNavGraph shim added so pathfinding compiles against new NavGraph type
  </what-built>
  <how-to-verify>
1. **Start the server** (ensure Docker PostgreSQL is running):
   ```
   npm run dev
   ```
   Expected server log output:
   - Migration applied (or "Migration already applied" on second run)
   - `[seed] Inserted 48 nodes, X edges` (first run only)
   - `Server running on http://localhost:3001`

2. **Verify GET /api/map returns multi-floor shape:**
   ```
   curl -s http://localhost:3001/api/map | jq '{buildings: (.buildings | length), floors: (.buildings[0].floors | length), nodes: (.buildings[0].floors[0].nodes | length)}'
   ```
   Expected: `{ "buildings": 1, "floors": 1, "nodes": 48 }`

   Also confirm no top-level `nodes`, `edges`, or `metadata` keys:
   ```
   curl -s http://localhost:3001/api/map | jq 'keys'
   ```
   Expected: `["buildings"]`

3. **Verify GET /api/floor-plan/1/1 serves the floor plan image:**
   ```
   curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/floor-plan/1/1
   ```
   Expected: `200`

4. **Verify legacy endpoint still works:**
   ```
   curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/floor-plan/image
   ```
   Expected: `200`

5. **Restart server and confirm idempotent seed:**
   Stop and restart the server. The log should show:
   `[seed] Already seeded (48 nodes) — skipping`
   (Not inserting 48 nodes again)

6. **Verify student map still loads** (no runtime errors):
   Open http://localhost:3001 in a browser. The floor plan and navigation nodes should render. Open browser console — no errors about `navGraph.nodes is undefined` or similar.
  </how-to-verify>
  <resume-signal>Type "approved" if all 6 checks pass. Describe any failures if checks do not pass.</resume-signal>
</task>

</tasks>

<verification>
Human confirms all 6 checks pass.
</verification>

<success_criteria>
- GET /api/map returns `{ buildings: [...] }` with 1 building, 1 floor, 48 nodes
- Server restarts idempotently (seed guard fires on second boot)
- Both old floor plan image endpoint and new parametric endpoint return 200
- Student map renders without console errors
</success_criteria>

<output>
After human approval, create `.planning/phases/16-multi-floor-data-model/16-04-SUMMARY.md` documenting:
- Verification results (which checks passed)
- Any issues found and resolved
- Confirmation that Phase 16 requirements MFLR-01, MFLR-02, CAMP-01 are satisfied
</output>
