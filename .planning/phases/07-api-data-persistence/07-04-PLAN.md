---
phase: 07-api-data-persistence
plan: 04
type: execute
wave: 3
depends_on:
  - 07-02
  - 07-03
files_modified: []
autonomous: false
requirements:
  - ADMN-02

must_haves:
  truths:
    - "Student app loads graph data from server on page load without any login or authentication"
    - "GET /api/map returns full NavGraph JSON from SQLite (not from campus-graph.json file read)"
    - "Loading spinner appears while graph data fetches and disappears when data arrives"
    - "Landmarks appear on the map correctly after data loads from server"
    - "Route calculation still works end-to-end (select A → select B → route draws)"
    - "Restarting the server does not duplicate graph data (idempotent seed)"
  artifacts: []
  key_links:
    - from: "browser"
      to: "http://localhost:3001/api/map"
      via: "useGraphData fetch (no auth headers)"
      pattern: "GET /api/map 200"
---

<objective>
Human verification: confirm the student app works end-to-end with server-persisted data — no hardcoded fallbacks, no authentication required, loading state visible, routing functional.

Purpose: Phase 7 goal is "graph data and floor plan images are persisted on the server and served to the student app." This checkpoint confirms all four success criteria from the roadmap are met.
Output: Human approval or description of issues for gap closure
</objective>

<execution_context>
@C:/Users/admin/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/admin/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Run quality checks and start dev server</name>
  <files></files>
  <action>
Run all quality checks and start the dev server so the human can verify:

1. `npx tsc --noEmit` — zero TypeScript errors
2. `npx biome check .` — zero errors
3. `npm run dev` — both Vite client and Hono server start (client at http://localhost:5173, server at http://localhost:3001)
4. Confirm server terminal shows: migration log + `[seed] Inserted N nodes, M edges`
5. `curl http://localhost:3001/api/map` — returns JSON with nodes, edges, metadata keys

Report results to human before handing off for visual verification.
  </action>
  <verify>
TypeScript and Biome pass with zero errors. Dev server running. curl /api/map returns 200 with NavGraph JSON.
  </verify>
  <done>
All quality checks pass. Server running and serving graph data from SQLite.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 2: Human verification of Phase 7 end-to-end</name>
  <action>Human tests all verification scenarios below on the running dev server at http://localhost:5173.</action>
  <verify>Human confirms all scenarios pass and types "approved".</verify>
  <done>All 6 must-have truths confirmed — Phase 7 verified complete.</done>
  <what-built>
Full Phase 7 implementation:
- SQLite database with nodes, edges, and graph_metadata tables (Drizzle ORM schema)
- Server startup sequence: migrate → seed from campus-graph.json → serve
- GET /api/map handler rewritten to query SQLite (no file read)
- useGraphData: retry logic (3 attempts, 1s delay) + AbortController cleanup
- HTML overlay: animated spinner during load, error message after retry exhaustion
- Double-fetch fix: LandmarkLayer now receives nodes as prop from FloorPlanCanvas
  </what-built>
  <how-to-verify>
Open http://localhost:5173 and test each scenario:

**1. Server startup (check terminal output)**
- Server terminal should show: migration log + `[seed] Inserted N nodes, M edges`
- Restart the server (Ctrl+C then `npm run dev:server`): check for `[seed] Already seeded (N nodes)` — confirms idempotency

**2. GET /api/map is public (no auth required)**
- Open browser DevTools → Network tab
- Refresh the page at http://localhost:5173
- Find the GET /api/map request — HTTP 200 with no auth headers sent
- Response body contains `{"nodes":[...],"edges":[...],"metadata":{...}}`

**3. Loading spinner visible**
- Hard refresh (Ctrl+Shift+R)
- Watch for a brief loading spinner on the map area before landmarks appear
  (Throttle network in DevTools → "Slow 3G" to make it easier to see)

**4. Landmarks appear correctly**
- After loading: room, entrance, restroom, elevator markers appear on the floor plan
- Pan and zoom confirms markers stay aligned with floor plan

**5. Route works end-to-end**
- Search for a start location (e.g. "Main Entrance")
- Search for a destination (e.g. a classroom)
- Route line draws on map, directions sheet opens, tabs switch correctly

**6. Single network request (double-fetch fix)**
- Open DevTools → Network tab → filter by "api/map"
- Reload the page — exactly ONE GET /api/map request appears (not two)
  </how-to-verify>
  <resume-signal>Type "approved" if all scenarios pass, or describe any issues found</resume-signal>
</task>

</tasks>

<verification>
Human confirms all 6 verification items above pass.
</verification>

<success_criteria>
Phase 7 is complete when the human approves all six verification items: server logs migration+seed, GET /api/map is public and returns SQLite data, loading spinner visible, landmarks correct, routing functional, single network request.
</success_criteria>

<output>
After human approval, create `.planning/phases/07-api-data-persistence/07-04-SUMMARY.md` using the summary template.
</output>
