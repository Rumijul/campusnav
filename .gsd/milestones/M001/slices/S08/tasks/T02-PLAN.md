---
phase: 07-api-data-persistence
plan: 02
type: execute
wave: 2
depends_on:
  - 07-01
files_modified:
  - src/server/db/seed.ts
  - src/server/index.ts
autonomous: true
requirements:
  - ADMN-02

must_haves:
  truths:
    - "Server starts up, runs migrations, and seeds from campus-graph.json if tables are empty — all synchronously before first request"
    - "GET /api/map queries SQLite via Drizzle and returns the full NavGraph JSON with nodes, edges, and metadata"
    - "GET /api/map requires no authentication — plain public GET endpoint, no headers/cookies/sessions required"
    - "Seeder is idempotent — running server multiple times does not duplicate data"
    - "1e10 accessible weight values are stored and returned as-is (never converted to Infinity, which JSON cannot serialize)"
  artifacts:
    - path: "src/server/db/seed.ts"
      provides: "Idempotent startup seeder: reads campus-graph.json, inserts if nodes table is empty"
      min_lines: 20
    - path: "src/server/index.ts"
      provides: "Rewritten /api/map handler using Drizzle; startup migrate + seed sequence"
      min_lines: 30
  key_links:
    - from: "src/server/index.ts"
      to: "drizzle/migrations"
      via: "migrate(db, { migrationsFolder })"
      pattern: "migrate\\(db"
    - from: "src/server/index.ts"
      to: "src/server/db/seed.ts"
      via: "seedIfEmpty() call on startup"
      pattern: "seedIfEmpty"
    - from: "src/server/index.ts"
      to: "src/server/db/schema.ts"
      via: "db.select().from(nodes)"
      pattern: "db\\.select\\(\\)\\.from"
---

<objective>
Write the startup seeder that populates SQLite from campus-graph.json on first run, and rewrite the GET /api/map handler to query SQLite via Drizzle instead of reading a JSON file.

Purpose: Completes the server-side migration from file-based to database-backed graph data. The student app will now fetch live data from SQLite on every page load.
Output: src/server/db/seed.ts (idempotent seeder), src/server/index.ts (rewritten /api/map + startup sequence)
</objective>

<execution_context>
@C:/Users/admin/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/admin/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@src/server/index.ts
@src/server/db/schema.ts
@src/shared/types.ts
@.planning/phases/07-api-data-persistence/07-01-SUMMARY.md
@.planning/phases/07-api-data-persistence/07-RESEARCH.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Write idempotent startup seeder</name>
  <files>
    src/server/db/seed.ts
  </files>
  <action>
Create `src/server/db/seed.ts`. The seeder reads `campus-graph.json` once on startup and inserts rows only if the `nodes` table is empty. Uses `onConflictDoNothing()` as a belt-and-suspenders guard against duplicates.

```typescript
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { NavGraph } from '@shared/types'
import { db } from './client'
import { edges, graphMetadata, nodes } from './schema'

const __dirname = dirname(fileURLToPath(import.meta.url))

export function seedIfEmpty(): void {
  // Cheap count check — no-op if already seeded
  const existing = db.select().from(nodes).all()
  if (existing.length > 0) {
    console.log(`[seed] Already seeded (${existing.length} nodes) — skipping`)
    return
  }

  const filePath = resolve(__dirname, '../assets/campus-graph.json')
  const graph: NavGraph = JSON.parse(readFileSync(filePath, 'utf-8'))

  // Map NavNode fields to schema column names
  // NavNode has camelCase fields; schema columns are snake_case but Drizzle
  // accepts the JS camelCase property names defined in schema.ts
  db.insert(nodes)
    .values(
      graph.nodes.map((n) => ({
        id: n.id,
        x: n.x,
        y: n.y,
        label: n.label,
        type: n.type,
        searchable: n.searchable,
        floor: n.floor,
        roomNumber: n.roomNumber ?? null,
        description: n.description ?? null,
        buildingName: n.buildingName ?? null,
        accessibilityNotes: n.accessibilityNotes ?? null,
      })),
    )
    .onConflictDoNothing()
    .run()

  db.insert(edges)
    .values(
      graph.edges.map((e) => ({
        id: e.id,
        sourceId: e.sourceId,
        targetId: e.targetId,
        standardWeight: e.standardWeight,
        accessibleWeight: e.accessibleWeight,   // Keep 1e10 as-is — DO NOT convert to Infinity (JSON cannot serialize Infinity)
        accessible: e.accessible,
        bidirectional: e.bidirectional,
        accessibilityNotes: e.accessibilityNotes ?? null,
      })),
    )
    .onConflictDoNothing()
    .run()

  db.insert(graphMetadata)
    .values([{
      buildingName: graph.metadata.buildingName,
      floor: graph.metadata.floor,
      lastUpdated: graph.metadata.lastUpdated,
    }])
    .onConflictDoNothing()
    .run()

  console.log(`[seed] Inserted ${graph.nodes.length} nodes, ${graph.edges.length} edges`)
}
```

Key decisions (from CONTEXT.md + RESEARCH.md):
- Keep `campus-graph.json` in place — it remains the canonical seed source; do not delete it
- Do NOT convert `accessibleWeight: 1e10` to `Infinity` — the pathfinding engine (`buildGraph`) handles this conversion on the client side; server stores and returns `1e10` as-is
- Use synchronous `better-sqlite3` API (`.run()`, `.all()`) — no `await`
  </action>
  <verify>
- `src/server/db/seed.ts` exists and exports `seedIfEmpty`
- `npx tsc --noEmit` passes (zero TypeScript errors on seed.ts)
- Function imports correctly from `./client` and `./schema`
  </verify>
  <done>
src/server/db/seed.ts exports seedIfEmpty() that reads campus-graph.json and inserts rows only when nodes table is empty, with onConflictDoNothing() guard.
  </done>
</task>

<task type="auto">
  <name>Task 2: Rewrite server startup and /api/map handler to use SQLite</name>
  <files>
    src/server/index.ts
  </files>
  <action>
Rewrite `src/server/index.ts` to:
1. Apply pending Drizzle migrations on startup (synchronous, idempotent)
2. Call `seedIfEmpty()` on startup
3. Replace the `GET /api/map` handler's file-read with a Drizzle SQLite query

**Critical path note (from RESEARCH.md Pitfall 3):** The `drizzle/` folder is at project root. `src/server/index.ts` is two levels deep. Use `resolve(__dirname, '../../drizzle')` to get the correct absolute path.

Replace the entire file content:

```typescript
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { serve } from '@hono/node-server'
import type { NavGraph } from '@shared/types'
import { Hono } from 'hono'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { db } from './db/client'
import { edges, graphMetadata, nodes } from './db/schema'
import { seedIfEmpty } from './db/seed'
import { readFile } from 'node:fs/promises'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Startup: migrate then seed ──────────────────────────────────────────────
// migrate() is synchronous with better-sqlite3; applies only pending migrations
migrate(db, { migrationsFolder: resolve(__dirname, '../../drizzle') })
seedIfEmpty()
// ────────────────────────────────────────────────────────────────────────────

const app = new Hono()

/** Health check endpoint — verifies the server is running. */
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

/** Serve the full-resolution floor plan PNG. */
app.get('/api/floor-plan/image', async (c) => {
  try {
    const filePath = resolve(__dirname, 'assets/floor-plan.png')
    const buffer = await readFile(filePath)
    c.header('Content-Type', 'image/png')
    c.header('Cache-Control', 'public, max-age=3600')
    return c.body(buffer)
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException).code
    if (code === 'ENOENT') {
      return c.json({ error: 'Floor plan not found' }, 404)
    }
    return c.json({ error: 'Failed to read floor plan' }, 500)
  }
})

/** Serve the low-resolution floor plan thumbnail JPEG. */
app.get('/api/floor-plan/thumbnail', async (c) => {
  try {
    const filePath = resolve(__dirname, 'assets/floor-plan-thumb.jpg')
    const buffer = await readFile(filePath)
    c.header('Content-Type', 'image/jpeg')
    c.header('Cache-Control', 'public, max-age=3600')
    return c.body(buffer)
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException).code
    if (code === 'ENOENT') {
      return c.json({ error: 'Floor plan thumbnail not found' }, 404)
    }
    return c.json({ error: 'Failed to read floor plan thumbnail' }, 500)
  }
})

/** Serve the navigation graph as JSON — queries SQLite via Drizzle. No auth required. */
app.get('/api/map', (c) => {
  try {
    // better-sqlite3 is synchronous — no await needed
    const nodeRows = db.select().from(nodes).all()
    const edgeRows = db.select().from(edges).all()
    const metaRows = db.select().from(graphMetadata).limit(1).all()
    const meta = metaRows[0]

    if (!meta) return c.json({ error: 'Graph data not found' }, 404)

    const graph: NavGraph = {
      nodes: nodeRows.map((n) => ({
        id: n.id,
        x: n.x,
        y: n.y,
        label: n.label,
        type: n.type as NavGraph['nodes'][number]['type'],
        searchable: n.searchable,
        floor: n.floor,
        ...(n.roomNumber != null && { roomNumber: n.roomNumber }),
        ...(n.description != null && { description: n.description }),
        ...(n.buildingName != null && { buildingName: n.buildingName }),
        ...(n.accessibilityNotes != null && { accessibilityNotes: n.accessibilityNotes }),
      })),
      edges: edgeRows.map((e) => ({
        id: e.id,
        sourceId: e.sourceId,
        targetId: e.targetId,
        standardWeight: e.standardWeight,
        accessibleWeight: e.accessibleWeight,   // 1e10 is safe in JSON; Infinity is not
        accessible: e.accessible,
        bidirectional: e.bidirectional,
        ...(e.accessibilityNotes != null && { accessibilityNotes: e.accessibilityNotes }),
      })),
      metadata: {
        buildingName: meta.buildingName,
        floor: meta.floor,
        lastUpdated: meta.lastUpdated,
      },
    }

    c.header('Cache-Control', 'public, max-age=60')
    return c.json(graph)
  } catch (_err) {
    return c.json({ error: 'Failed to load graph data' }, 500)
  }
})

const port = 3001
console.log(`Server running on http://localhost:${port}`)
serve({ fetch: app.fetch, port })
```

Notes:
- `/api/map` handler is a plain (non-async) function — `better-sqlite3` is synchronous
- Nullable optional fields are spread only when non-null to preserve exact NavGraph shape (no spurious `undefined` keys)
- `type` cast via `as NavGraph['nodes'][number]['type']` since SQLite returns `text` (string), but the type needs `NavNodeType`
- The `readFile` import stays for floor-plan endpoints which remain async file reads
  </action>
  <verify>
1. `npx tsc --noEmit` passes (zero TypeScript errors)
2. Start server: `npm run dev:server` — verify startup console shows:
   - Migration log (or "No pending migrations" if already applied)
   - `[seed] Inserted N nodes, M edges` (first run) or `[seed] Already seeded` (subsequent runs)
   - `Server running on http://localhost:3001`
3. `curl http://localhost:3001/api/map` returns JSON with `nodes`, `edges`, `metadata` fields
4. Response contains no `null` for accessibleWeight on non-accessible edges (they should be `10000000000` / `1e10`)
5. `curl http://localhost:3001/api/health` returns `{"status":"ok",...}`
  </verify>
  <done>
Server starts with migrate+seed sequence logged to console.
GET /api/map returns full NavGraph JSON from SQLite (not file read).
GET /api/map requires no authentication headers — plain public GET.
Idempotency confirmed: restarting server logs "Already seeded" on second run.
  </done>
</task>

</tasks>

<verification>
After both tasks complete:
1. Server starts without errors: `npm run dev:server`
2. Console shows migration + seed logs
3. `curl http://localhost:3001/api/map | head -c 500` shows JSON with nodes array
4. `data/campus.db` file exists on disk (SQLite database created)
5. `npx tsc --noEmit` — zero errors
6. Restarting server does not duplicate data (idempotent seed check)
</verification>

<success_criteria>
The server reads graph data from SQLite. GET /api/map is a public endpoint requiring no authentication. The startup sequence (migrate → seed → serve) ensures the database is always ready before the first request.
</success_criteria>

<output>
After completion, create `.planning/phases/07-api-data-persistence/07-02-SUMMARY.md` using the summary template.
</output>
