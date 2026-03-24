---
phase: 15-postgresql-migration
plan: 02
type: execute
wave: 2
depends_on: [15-01]
files_modified:
  - src/server/db/seed.ts
  - src/server/index.ts
autonomous: true
requirements: [INFR-01]

must_haves:
  truths:
    - "seed.ts exports `async function seedIfEmpty(): Promise<void>` — synchronous `.all()` and `.run()` calls are gone"
    - "index.ts uses `await migrate(...)` with a dedicated `{ max: 1 }` migration client that is closed after migration completes"
    - "index.ts imports `migrate` from `drizzle-orm/postgres-js/migrator` — the better-sqlite3/migrator import is gone"
    - "GET /api/map route uses `await db.select().from(nodes)` (not `.all()`) — all three DB queries are awaited"
    - "POST /api/admin/graph route uses `await db.transaction(async (tx) => { ... })` — `db.$client.transaction()` is gone"
    - "All `.run()` calls inside POST /api/admin/graph are replaced with `await tx.insert(...)`/`await tx.delete(...)`"
    - "Server starts without TypeScript errors and without runtime crashes when DATABASE_URL is set"
  artifacts:
    - src/server/db/seed.ts
    - src/server/index.ts
  key_links:
    - seedIfEmpty is called with `await` in index.ts startup sequence
    - The migrate() call uses a separate short-lived connection (max: 1), not the main db pool
    - All route handlers that previously used synchronous db calls now await them
---

<objective>
Convert all server-side database calls from synchronous (better-sqlite3) to async (postgres.js). Rewrite seed.ts to be an async function, rewrite index.ts startup to await migrate + seed, and update the two routes in index.ts that use direct DB calls (GET /api/map and POST /api/admin/graph).

Purpose: postgres.js returns Promises — every db call must be awaited or the server crashes at runtime. This plan completes the migration so the full server is PostgreSQL-compatible.
Output: Async seed.ts, async startup in index.ts, async route handlers, Drizzle `db.transaction()` replacing `db.$client.transaction()`.
</objective>

<execution_context>
@C:/Users/LENOVO/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/LENOVO/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/15-postgresql-migration/15-CONTEXT.md
@.planning/phases/15-postgresql-migration/15-RESEARCH.md

<interfaces>
<!-- Current files to rewrite — exact content for reference -->

Current src/server/db/seed.ts (synchronous — REWRITE to async):
```typescript
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { NavGraph } from '@shared/types'
import { db } from './client'
import { edges, graphMetadata, nodes } from './schema'

const __dirname = dirname(fileURLToPath(import.meta.url))

export function seedIfEmpty(): void {
  const existing = db.select().from(nodes).all()         // ← .all() must become await
  if (existing.length > 0) {
    console.log(`[seed] Already seeded (${existing.length} nodes) — skipping`)
    return
  }

  const filePath = resolve(__dirname, '../assets/campus-graph.json')
  const graph: NavGraph = JSON.parse(readFileSync(filePath, 'utf-8'))

  db.insert(nodes).values([...]).onConflictDoNothing().run()   // ← .run() must become await
  db.insert(edges).values([...]).onConflictDoNothing().run()   // ← .run() must become await
  db.insert(graphMetadata).values([...]).onConflictDoNothing().run() // ← .run() must become await

  console.log(`[seed] Inserted ${graph.nodes.length} nodes, ${graph.edges.length} edges`)
}
```

Current src/server/index.ts startup + affected routes (key sections):
```typescript
// STARTUP — currently synchronous:
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'   // ← change import path
migrate(db, { migrationsFolder: resolve(__dirname, '../../drizzle') })  // ← must await
seedIfEmpty()                                                           // ← must await

// GET /api/map — currently synchronous:
app.get('/api/map', (c) => {
  const nodeRows = db.select().from(nodes).all()     // ← .all() → await
  const edgeRows = db.select().from(edges).all()     // ← .all() → await
  const metaRows = db.select().from(graphMetadata).limit(1).all() // ← .all() → await
  ...
})

// POST /api/admin/graph — currently uses db.$client raw transaction:
app.post('/api/admin/graph', async (c) => {
  const sqlite = db.$client                      // ← REMOVE
  const txn = sqlite.transaction(() => {         // ← REMOVE
    db.delete(graphMetadata).run()               // ← must become await tx.delete(...)
    db.delete(edges).run()                       // ← must become await tx.delete(...)
    db.delete(nodes).run()                       // ← must become await tx.delete(...)
    for (const n of graph.nodes) {
      db.insert(nodes).values({...}).run()       // ← must become await tx.insert(...)
    }
    for (const e of graph.edges) {
      db.insert(edges).values({...}).run()       // ← must become await tx.insert(...)
    }
    if (graph.metadata) {
      db.insert(graphMetadata).values({...}).run() // ← must become await tx.insert(...)
    }
  })
  txn()                                          // ← REMOVE; use db.transaction() instead
})
```

New Drizzle transaction API (postgres-js adapter):
```typescript
await db.transaction(async (tx) => {
  await tx.delete(graphMetadata)
  await tx.delete(edges)
  await tx.delete(nodes)
  for (const n of graph.nodes) {
    await tx.insert(nodes).values({ ... })
  }
  for (const e of graph.edges) {
    await tx.insert(edges).values({ ... })
  }
  if (graph.metadata) {
    await tx.insert(graphMetadata).values({ ... })
  }
})
```

New startup pattern (async migrate with dedicated client):
```typescript
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

const migrationClient = postgres(process.env.DATABASE_URL!, { max: 1 })
await migrate(drizzle(migrationClient), { migrationsFolder: resolve(__dirname, '../../drizzle') })
await migrationClient.end()
await seedIfEmpty()
```
The project uses `"type": "module"` in package.json — top-level `await` is valid in ESM.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Rewrite seed.ts to async — replace .all() and .run() with awaited queries</name>
  <files>src/server/db/seed.ts</files>
  <action>
Rewrite `src/server/db/seed.ts` completely. The logic stays identical — only the async/await mechanics change.

Key changes:
1. `export function seedIfEmpty(): void` → `export async function seedIfEmpty(): Promise<void>`
2. `db.select().from(nodes).all()` → `await db.select().from(nodes)`
3. `return` inside early-exit branch becomes `return` after the await check (requires function to be async)
4. All three `.run()` calls removed; queries are awaited directly: `await db.insert(nodes).values([...]).onConflictDoNothing()`

Full rewrite:
```typescript
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { NavGraph } from '@shared/types'
import { db } from './client'
import { edges, graphMetadata, nodes } from './schema'

const __dirname = dirname(fileURLToPath(import.meta.url))

export async function seedIfEmpty(): Promise<void> {
  // Cheap count check — no-op if already seeded
  const existing = await db.select().from(nodes)
  if (existing.length > 0) {
    console.log(`[seed] Already seeded (${existing.length} nodes) — skipping`)
    return
  }

  const filePath = resolve(__dirname, '../assets/campus-graph.json')
  const graph: NavGraph = JSON.parse(readFileSync(filePath, 'utf-8'))

  // Map NavNode fields to schema column names
  await db
    .insert(nodes)
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

  await db
    .insert(edges)
    .values(
      graph.edges.map((e) => ({
        id: e.id,
        sourceId: e.sourceId,
        targetId: e.targetId,
        standardWeight: e.standardWeight,
        accessibleWeight: e.accessibleWeight, // Keep 1e10 as-is — DO NOT convert to Infinity
        accessible: e.accessible,
        bidirectional: e.bidirectional,
        accessibilityNotes: e.accessibilityNotes ?? null,
      })),
    )
    .onConflictDoNothing()

  await db
    .insert(graphMetadata)
    .values([{
      buildingName: graph.metadata.buildingName,
      floor: graph.metadata.floor,
      lastUpdated: graph.metadata.lastUpdated,
    }])
    .onConflictDoNothing()

  console.log(`[seed] Inserted ${graph.nodes.length} nodes, ${graph.edges.length} edges`)
}
```
  </action>
  <verify>
    <automated>rtk npm run typecheck 2>&1 | head -20</automated>
  </verify>
  <done>seed.ts has `async function seedIfEmpty(): Promise<void>`. No `.all()` or `.run()` calls exist anywhere in the file. TypeScript compiles without errors.</done>
</task>

<task type="auto">
  <name>Task 2: Rewrite index.ts — async startup, postgres-js migrator, async route handlers, db.transaction()</name>
  <files>src/server/index.ts</files>
  <action>
Update `src/server/index.ts` in three areas. Do NOT change anything else in the file (floor plan upload route, auth routes, JWT middleware, serve-static, port).

**Area 1 — Imports at top of file:**
- Change: `import { migrate } from 'drizzle-orm/better-sqlite3/migrator'`
- To: `import { migrate } from 'drizzle-orm/postgres-js/migrator'`
- Add: `import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js'`
- Add: `import postgres from 'postgres'`
(These are needed for the dedicated migration client)

**Area 2 — Startup block (replace the synchronous migrate/seed with async):**
Replace:
```typescript
// ── Startup: migrate then seed ──────────────────────────────────────────────
// migrate() is synchronous with better-sqlite3; applies only pending migrations
migrate(db, { migrationsFolder: resolve(__dirname, '../../drizzle') })
seedIfEmpty()
// ────────────────────────────────────────────────────────────────────────────
```
With:
```typescript
// ── Startup: migrate then seed ──────────────────────────────────────────────
// postgres-js migrator is async — use a dedicated short-lived connection (max: 1)
const migrationClient = postgres(process.env.DATABASE_URL!, { max: 1 })
await migrate(drizzlePg(migrationClient), { migrationsFolder: resolve(__dirname, '../../drizzle') })
await migrationClient.end()
await seedIfEmpty()
// ────────────────────────────────────────────────────────────────────────────
```
Top-level `await` is valid because package.json has `"type": "module"` (ESM).

**Area 3a — GET /api/map route (make async, await all db calls):**
Replace the handler signature and internal db calls:
```typescript
// Change: (c) => { ... }
// To: async (c) => { ... }
app.get('/api/map', async (c) => {
  try {
    const nodeRows = await db.select().from(nodes)
    const edgeRows = await db.select().from(edges)
    const metaRows = await db.select().from(graphMetadata).limit(1)
    const meta = metaRows[0]
    // ... rest of handler body unchanged (building the NavGraph object and returning c.json(graph))
  } catch (_err) {
    return c.json({ error: 'Failed to load graph data' }, 500)
  }
})
```
Also remove the comment `// better-sqlite3 is synchronous — no await needed` — it is no longer true.

**Area 3b — POST /api/admin/graph route (replace db.$client transaction with db.transaction()):**
The handler is already `async`. Replace the entire transaction block:

Remove these lines:
```typescript
// Use the raw better-sqlite3 connection for synchronous transaction
const sqlite = db.$client
const txn = sqlite.transaction(() => {
  db.delete(graphMetadata).run()
  db.delete(edges).run()
  db.delete(nodes).run()
  for (const n of graph.nodes) {
    db.insert(nodes).values({...}).run()
  }
  for (const e of graph.edges) {
    db.insert(edges).values({...}).run()
  }
  if (graph.metadata) {
    db.insert(graphMetadata).values({...}).run()
  }
})
txn()
```

Replace with:
```typescript
await db.transaction(async (tx) => {
  // Delete all existing data
  await tx.delete(graphMetadata)
  await tx.delete(edges)
  await tx.delete(nodes)

  // Insert nodes
  for (const n of graph.nodes) {
    await tx.insert(nodes).values({
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
    })
  }

  // Insert edges
  for (const e of graph.edges) {
    await tx.insert(edges).values({
      id: e.id,
      sourceId: e.sourceId,
      targetId: e.targetId,
      standardWeight: e.standardWeight,
      accessibleWeight: e.accessibleWeight, // 1e10 for non-accessible (never Infinity)
      accessible: e.accessible,
      bidirectional: e.bidirectional,
      accessibilityNotes: e.accessibilityNotes ?? null,
    })
  }

  // Insert metadata
  if (graph.metadata) {
    await tx.insert(graphMetadata).values({
      buildingName: graph.metadata.buildingName,
      floor: graph.metadata.floor,
      lastUpdated: graph.metadata.lastUpdated,
    })
  }
})
```
Also update the comment on the route from `// SQLite` to `// PostgreSQL`:
`* Replaces the entire navigation graph in SQLite atomically.` → `* Replaces the entire navigation graph in PostgreSQL atomically.`
  </action>
  <verify>
    <automated>rtk npm run typecheck 2>&1 | head -30</automated>
  </verify>
  <done>index.ts: migrate import is from `drizzle-orm/postgres-js/migrator`, startup block uses top-level await, GET /api/map is async and uses await, POST /api/admin/graph uses `db.transaction(async tx => ...)` with no `.run()` calls and no `db.$client` reference. TypeScript compiles without errors.</done>
</task>

</tasks>

<verification>
After both tasks complete, run a final search for synchronous anti-patterns:
```bash
grep -rn "\.all()\|\.run()\|db\.\$client\|better-sqlite3" src/server/
```
Result must be empty — no hits. If any remain, fix them before marking this plan complete.

Also confirm:
```bash
grep -n "async function seedIfEmpty\|Promise<void>" src/server/db/seed.ts
grep -n "await migrate\|drizzle-orm/postgres-js/migrator" src/server/index.ts
grep -n "db\.transaction" src/server/index.ts
```
All three greps should return matching lines.
</verification>

<success_criteria>
The entire server codebase is now PostgreSQL-compatible. Zero synchronous better-sqlite3 API calls remain. `npm run typecheck` passes. The server is ready to start against a live PostgreSQL instance — which is verified by the human checkpoint in Plan 03.
</success_criteria>

<output>
After completion, create `.planning/phases/15-postgresql-migration/15-02-SUMMARY.md` using the summary template.
</output>
