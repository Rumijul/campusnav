---
phase: 07-api-data-persistence
verified: 2026-02-22T00:00:00Z
status: passed
score: 6/6 must-haves verified
re_verification: false
gaps: []
human_verification:
  - test: "Load map at http://localhost:5173 and observe loading spinner"
    expected: "Brief animated spinner appears over map area, then disappears when landmarks render"
    why_human: "Visual appearance of spinner and landmark markers cannot be confirmed programmatically"
  - test: "Select start node, select destination, confirm route draws"
    expected: "Route line appears on map, directions sheet opens with step-by-step instructions"
    why_human: "End-to-end routing interaction requires visual confirmation — already approved by human in 07-04 UAT"
---

# Phase 7: API & Data Persistence Verification Report

**Phase Goal:** Graph data and floor plan images are persisted on the server and served to the student app — no hardcoded fallbacks, SQLite-backed API, loading state visible, routing functional.
**Verified:** 2026-02-22
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Student app loads graph data from server on page load without any login or authentication | VERIFIED | `GET /api/map` is a plain Hono GET handler with no auth middleware. CSRF middleware passes GET/HEAD through immediately (line 5 of csrf middleware: `isSafeMethodRe = /^(GET\|HEAD)$/`). No JWT guard on `/api/map`. |
| 2 | GET /api/map returns full NavGraph JSON from SQLite (not from campus-graph.json file read) | VERIFIED | `src/server/index.ts` lines 73-75 call `db.select().from(nodes).all()`, `db.select().from(edges).all()`, `db.select().from(graphMetadata).limit(1).all()`. No `readFileSync` or `readFile` call exists in the `/api/map` handler. |
| 3 | Loading spinner appears while graph data fetches and disappears when data arrives | VERIFIED | `FloorPlanCanvas.tsx` lines 261-268: HTML overlay `<div>` with `animate-spin` class conditionally rendered when `graphState.status === 'loading'`. |
| 4 | Landmarks appear on the map correctly after data loads from server | VERIFIED | `FloorPlanCanvas.tsx` derives `nodes` from `graphState` (line 67-70), passes `nodes={nodes}` prop to `<LandmarkLayer>` (line 317). `LandmarkLayer` filters and renders `LandmarkMarker` for each visible node. Chain is complete and wired. |
| 5 | Route calculation still works end-to-end (select A, select B, route draws) | VERIFIED | `FloorPlanCanvas.tsx` lines 90-93: `PathfindingEngine` is memoized from `graphState.data` when loaded. `engine.findRoute()` called at lines 186 and 191. Graph data now comes from SQLite but pathfinding engine is unchanged. |
| 6 | Restarting the server does not duplicate graph data (idempotent seed) | VERIFIED | `seed.ts` line 12-16: queries `db.select().from(nodes).all()` before inserting; returns early if `existing.length > 0`. Plus `onConflictDoNothing()` at lines 40, 56, 65 as belt-and-suspenders guard. |

**Score: 6/6 truths verified**

---

### Required Artifacts

| Artifact | Expected | Exists | Lines | Status | Details |
|----------|----------|--------|-------|--------|---------|
| `src/server/db/schema.ts` | Drizzle table definitions for nodes, edges, graph_metadata | Yes | 33 | VERIFIED | Exports `nodes`, `edges`, `graphMetadata` with correct column types matching NavGraph TypeScript types. All nullable fields correctly omit `.notNull()`. |
| `src/server/db/client.ts` | better-sqlite3 + Drizzle singleton, exports `db` | Yes | 17 | VERIFIED | Imports `better-sqlite3`, uses `mkdirSync` to create `data/` dir, exports `db = drizzle(sqlite, { schema })`. |
| `drizzle.config.ts` | Drizzle Kit configuration at project root | Yes | 10 | VERIFIED | Points `schema` to `./src/server/db/schema.ts`, `out` to `./drizzle`, dialect `sqlite`. |
| `drizzle/` | Generated SQL migration file | Yes | — | VERIFIED | Contains `0000_brief_madame_hydra.sql` with all three table CREATE statements matching schema. |
| `src/server/db/seed.ts` | Idempotent startup seeder | Yes | 69 | VERIFIED | Exports `seedIfEmpty()` that checks node count before inserting, uses `onConflictDoNothing()` on all three tables. |
| `src/server/index.ts` | Rewritten /api/map handler + startup migrate+seed | Yes | 237 | VERIFIED | Runs `migrate()` then `seedIfEmpty()` at module level before serving. `/api/map` queries SQLite via Drizzle — no file read. |
| `src/client/hooks/useGraphData.ts` | Graph data fetcher with retry logic | Yes | 52 | VERIFIED | Exports `useGraphData()` with `fetchWithRetry()` implementing 3 attempts with 1s delay, `AbortController` cleanup. |
| `src/client/components/FloorPlanCanvas.tsx` | HTML spinner overlay, nodes prop to LandmarkLayer | Yes | 419 | VERIFIED | Lines 261-278: loading and error overlays. Line 317: `nodes={nodes}` prop passed to `<LandmarkLayer>`. |
| `src/client/components/LandmarkLayer.tsx` | Accepts nodes prop, no internal useGraphData call | Yes | 53 | VERIFIED | Props interface includes `nodes: NavNode[]`. No import of `useGraphData`. Pure display component. |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/server/db/client.ts` | `src/server/db/schema.ts` | `import * as schema from './schema'` | WIRED | Line 6 of client.ts: `import * as schema from './schema'`; used in `drizzle(sqlite, { schema })`. |
| `drizzle.config.ts` | `src/server/db/schema.ts` | `schema: './src/server/db/schema.ts'` | WIRED | drizzle.config.ts line 4 points schema to correct path. Migration SQL confirms tables were generated from this schema. |
| `src/server/index.ts` | `drizzle/` migrations | `migrate(db, { migrationsFolder })` | WIRED | Line 21: `migrate(db, { migrationsFolder: resolve(__dirname, '../../drizzle') })`. Path resolves correctly from `src/server/` two levels up to project root `drizzle/`. |
| `src/server/index.ts` | `src/server/db/seed.ts` | `seedIfEmpty()` call on startup | WIRED | Line 15: `import { seedIfEmpty } from './db/seed'`. Line 22: `seedIfEmpty()` called at module level before first request. |
| `src/server/index.ts` | `src/server/db/schema.ts` | `db.select().from(nodes)` | WIRED | Lines 14, 73-75: imports `nodes`, `edges`, `graphMetadata` from schema; all three used in `/api/map` handler. |
| `FloorPlanCanvas.tsx` | `src/client/hooks/useGraphData.ts` | `const graphState = useGraphData()` | WIRED | Line 9: import; Line 57: `const graphState = useGraphData()`. State used at lines 67-93, 261-278. |
| `FloorPlanCanvas.tsx` | `src/client/components/LandmarkLayer.tsx` | `nodes={nodes}` prop | WIRED | Line 316-317: `<LandmarkLayer nodes={nodes} ...>`. `nodes` array derived from `graphState` at line 67-70. |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| ADMN-02 | 07-01, 07-02, 07-03, 07-04 | Student-facing wayfinding requires no login or authentication | SATISFIED | GET /api/map has no auth middleware. CSRF middleware passes GET through. JWT guard at line 122 of index.ts applies only to `/api/admin/*` routes. Student app fetch in `useGraphData.ts` sends plain GET with no auth headers. Human-verified in 07-UAT.md: all 6 tests passed. |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/client/components/LandmarkLayer.tsx` | 32 | `return null` | Info | Guard clause — returns nothing when `imageRect === null` (image not yet loaded). Correct behavior, not a stub. |

No blocker or warning anti-patterns found.

---

### CSRF Middleware Analysis

The server at line 28 registers `app.use(csrf())` globally before all routes. This was investigated to confirm it does not block `/api/map`.

Hono's `csrf()` middleware (from `node_modules/hono/dist/middleware/csrf/index.js`) uses the check:

```
if (!isSafeMethodRe.test(c.req.method) && isRequestedByFormElementRe.test(...) && ...)
```

where `isSafeMethodRe = /^(GET|HEAD)$/`. Since `GET /api/map` is a safe method, the condition short-circuits immediately and the middleware calls `next()` without blocking. The CSRF protection only fires for state-changing methods (POST/PUT/DELETE/PATCH) with form content-types lacking same-origin headers. **GET /api/map is unaffected.**

---

### Human Verification Required

Items listed in frontmatter were already confirmed by human reviewer during 07-04 UAT (07-UAT.md shows all 6 tests passed). The two items below are noted as human-dependent for completeness but are already resolved.

#### 1. Loading spinner visual appearance

**Test:** Load http://localhost:5173 on a throttled connection
**Expected:** Animated blue spinner with "Loading map data..." text appears over the map area, then disappears when landmarks render
**Why human:** Visual animation and rendering cannot be verified programmatically
**UAT result:** Passed (07-UAT.md test 3)

#### 2. Route calculation end-to-end

**Test:** Select a start location, select a destination, observe route
**Expected:** Blue route line draws on map, directions sheet opens with step-by-step instructions
**Why human:** Interactive sequence requires a running browser session
**UAT result:** Passed (07-UAT.md test 5)

---

### Gaps Summary

No gaps found. All 6 observable truths are verified against the codebase. All 9 required artifacts exist with substantive content. All 7 key links are wired. Requirement ADMN-02 is satisfied. No blocker anti-patterns detected.

Notable additions beyond Plan 02's scope (added in subsequent phases, visible in current index.ts): CSRF middleware, JWT guard for `/api/admin/*` routes, `POST /api/admin/graph`, and `POST /api/admin/floor-plan` endpoints. These are Phase 8-10 additions layered on top of Phase 7's public `/api/map` endpoint. They do not break Phase 7's goal — the public endpoint remains unprotected and functional.

---

_Verified: 2026-02-22_
_Verifier: Claude (gsd-verifier)_
