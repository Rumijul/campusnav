# Phase 7: API & Data Persistence - Research

**Researched:** 2026-02-20
**Domain:** SQLite persistence with Drizzle ORM + Drizzle Kit; Hono server migration; client fetch behavior
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Schema design:** Relational tables (not a JSON blob column). Separate `nodes` and `edges` tables with typed columns. Server assembles rows into the existing `NavGraph` TypeScript shape before responding. Column layout is inferred from the existing `NavGraph` type in `src/shared/types`. GET /api/map queries both tables and assembles the full graph JSON in server code.
- **Data seeding:** Claude decides the seeding strategy. Likely: auto-seed on startup if tables are empty, reading from existing `campus-graph.json`. Claude decides whether to keep or remove `campus-graph.json` after migration. Claude decides idempotency approach (safe to run multiple times without duplicates).
- **Client fetch behavior:** Show a loading spinner/indicator on the map area while graph data is fetching. On error: retry silently 1–2 times, then show a user-visible error message. Claude decides whether to keep or remove hardcoded client seed data (clean migration preferred). Claude decides client-side caching approach (React state only is acceptable).
- **SQLite tooling:** Use Drizzle ORM (not raw better-sqlite3). Use Drizzle Kit for migrations (tracked in version control, not inline schema creation). Claude decides database file location and naming. Claude decides .gitignore handling for the .db file.

### Claude's Discretion

- Exact column definitions for nodes and edges (infer from NavGraph type)
- Database file location (e.g., `data/campus.db` or similar)
- Whether to gitignore the .db file (standard practice: yes)
- Seeding: auto-seed on startup if empty vs. explicit script
- Idempotency approach for seeding
- Whether to keep campus-graph.json after SQLite migration
- Hardcoded client data: remove or keep as dev fallback
- Client-side caching depth (React state is acceptable)

### Deferred Ideas (OUT OF SCOPE)

- None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ADMN-02 | Student-facing wayfinding requires no login or authentication | GET /api/map is a public endpoint — no auth middleware needed. Hono has no default auth; the pattern is simply "add no auth guard". Client fetches without credentials. The existing endpoint is already public; this requirement is satisfied by architecture (server design + no session/cookie/header requirement). |
</phase_requirements>

---

## Summary

The existing project already has 90% of the wiring in place. The Hono server exposes `GET /api/map` which the client calls via `useGraphData`. Currently the server reads `campus-graph.json` from disk and returns it as JSON. Phase 7 replaces that file read with a Drizzle ORM query against a SQLite database. Everything else — the client hook, the API contract (`NavGraph` type), the Vite proxy, the Hono app structure — stays unchanged.

The stack decision is locked: Drizzle ORM with `better-sqlite3` driver, Drizzle Kit for migrations. This is a well-established pairing with excellent TypeScript support. `better-sqlite3` is a synchronous native module — there are no async patterns, which integrates smoothly with the synchronous migration flow. The only Hono handler for `/api/map` switches from `readFile` to a `db.select()` call that joins nodes and edges, assembles the `NavGraph` shape, and returns it.

The main work surface is: (1) install packages, (2) define schema, (3) generate and apply migration, (4) write a startup seeder that reads `campus-graph.json` once and inserts rows if the tables are empty, (5) rewrite the `/api/map` handler, (6) add loading/retry UX to the client. The floor-plan image endpoints are untouched. No auth is involved at any layer.

**Primary recommendation:** Install `drizzle-orm`, `better-sqlite3`, `@types/better-sqlite3`, and `drizzle-kit`; define schema in `src/server/db/schema.ts`; run `npx drizzle-kit generate` then `npx drizzle-kit migrate` for the migration file; apply it programmatically on server startup via `migrate(db, { migrationsFolder })` from `drizzle-orm/better-sqlite3/migrator`; seed from `campus-graph.json` if tables are empty; rewrite `/api/map` handler to query SQLite.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `drizzle-orm` | latest (^0.38+) | ORM: typed schema, query builder, migrator | Locked decision; excellent TS types; zero-overhead SQL |
| `better-sqlite3` | latest (^11+) | Synchronous SQLite driver for Node.js | Fastest synchronous SQLite for Node; Drizzle officially supports it |
| `drizzle-kit` | latest (^0.30+) | Migration file generation and apply CLI | Locked decision; generates SQL files tracked in version control |
| `@types/better-sqlite3` | latest | TypeScript types for better-sqlite3 | Required since better-sqlite3 ships no built-in types |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Node.js `node:path` / `node:url` | built-in | Resolve DB file path in ESM context | Always — needed for `__dirname` equivalent in ESM |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `better-sqlite3` | `@libsql/client` (libSQL) | libSQL is async, remote-capable; better-sqlite3 is sync, local-only — sync is simpler for this server |
| Drizzle Kit migrations | `drizzle-kit push` | `push` is dev-only; migrations give version-controlled SQL files needed for Phase 9+ admin editor |

**Installation:**
```bash
npm install drizzle-orm better-sqlite3
npm install -D drizzle-kit @types/better-sqlite3
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/server/
├── db/
│   ├── schema.ts        # Drizzle table definitions (nodes, edges, metadata)
│   ├── client.ts        # Database connection singleton (drizzle + better-sqlite3)
│   └── seed.ts          # Startup seeder: reads campus-graph.json → inserts if empty
├── assets/
│   ├── campus-graph.json   # Source of truth for seed data (keep until Phase 9 editor)
│   ├── floor-plan.png
│   └── floor-plan-thumb.jpg
└── index.ts             # Hono app: migrate → seed → serve

drizzle/                 # Generated migration SQL files (committed to git)
drizzle.config.ts        # Drizzle Kit config (project root)
data/
└── campus.db            # SQLite database file (gitignored)
```

### Pattern 1: Schema Definition Matching NavGraph Types

**What:** Define two SQLite tables (`nodes` and `edges`) with column types that match the TypeScript `NavNode` and `NavEdge` interfaces exactly. A separate `graph_metadata` table holds the single-row building metadata.

**When to use:** Always — schema is the single source of truth; types flow from schema using `$inferSelect`.

**Example:**
```typescript
// Source: drizzle-orm docs (https://orm.drizzle.team/docs/get-started/sqlite-new)
// src/server/db/schema.ts
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const nodes = sqliteTable('nodes', {
  id:                text('id').primaryKey(),
  x:                 real('x').notNull(),
  y:                 real('y').notNull(),
  label:             text('label').notNull(),
  type:              text('type').notNull(),           // NavNodeType (text enum)
  searchable:        integer('searchable', { mode: 'boolean' }).notNull(),
  floor:             integer('floor').notNull(),
  roomNumber:        text('room_number'),
  description:       text('description'),
  buildingName:      text('building_name'),
  accessibilityNotes: text('accessibility_notes'),
})

export const edges = sqliteTable('edges', {
  id:                text('id').primaryKey(),
  sourceId:          text('source_id').notNull(),
  targetId:          text('target_id').notNull(),
  standardWeight:    real('standard_weight').notNull(),
  accessibleWeight:  real('accessible_weight').notNull(),
  accessible:        integer('accessible', { mode: 'boolean' }).notNull(),
  bidirectional:     integer('bidirectional', { mode: 'boolean' }).notNull(),
  accessibilityNotes: text('accessibility_notes'),
})

export const graphMetadata = sqliteTable('graph_metadata', {
  id:           integer('id').primaryKey({ autoIncrement: true }),
  buildingName: text('building_name').notNull(),
  floor:        integer('floor').notNull(),
  lastUpdated:  text('last_updated').notNull(),   // ISO 8601 string
})
```

**Key type mappings from NavGraph to SQLite:**
- `number` (x, y, weights) → `real()` — SQLite REAL (8-byte float)
- `string` (id, label, type) → `text()` — SQLite TEXT
- `boolean` (searchable, accessible, bidirectional) → `integer({ mode: 'boolean' })` — SQLite stores 0/1, Drizzle auto-converts to JS boolean
- Optional fields (`roomNumber?`, etc.) → `text()` without `.notNull()` — nullable
- `accessibleWeight: Infinity` (from non-accessible edges) — SQLite REAL stores Infinity natively; JSON serialization of `Infinity` is `null` so **the server must map the SQLite value back correctly** (see Pitfall 2)

### Pattern 2: Database Client Singleton

**What:** Create the better-sqlite3 + Drizzle instance once and export it. `better-sqlite3` is synchronous — `new Database(path)` opens the file immediately.

**When to use:** Always — one connection per process, shared across all handlers.

**Example:**
```typescript
// Source: https://betterstack.com/community/guides/scaling-nodejs/drizzle-orm/
// src/server/db/client.ts
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as schema from './schema'

const __dirname = dirname(fileURLToPath(import.meta.url))
// Place DB in project root /data/ directory, gitignored
const dbPath = resolve(__dirname, '../../../data/campus.db')

const sqlite = new Database(dbPath)
export const db = drizzle(sqlite, { schema })
```

### Pattern 3: Startup Migration + Seed

**What:** On server startup, before `serve()`: (1) apply pending migrations, (2) seed if tables are empty.

**When to use:** Always in this project — guarantees DB is ready before first request.

**Example:**
```typescript
// Source: https://github.com/WiseLibs/better-sqlite3 + drizzle docs
// src/server/index.ts (startup sequence)
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { resolve } from 'node:path'
import { db } from './db/client'
import { seedIfEmpty } from './db/seed'

// 1. Apply any pending migrations (idempotent — skips already-applied ones)
migrate(db, { migrationsFolder: resolve(__dirname, '../../drizzle') })

// 2. Seed from campus-graph.json if tables are empty
await seedIfEmpty()

// 3. Start Hono server
serve({ fetch: app.fetch, port })
```

**Critical note on `migrate` import:** The migrator for better-sqlite3 is imported from `'drizzle-orm/better-sqlite3/migrator'` — not from `drizzle-orm` directly. This is a sub-path export. (Verified: npm unpkg.com/drizzle-orm shows `better-sqlite3/migrator.cjs` exists.)

### Pattern 4: GET /api/map Handler (SQLite Query)

**What:** Query both tables, assemble into `NavGraph` shape, return JSON. This replaces the current `readFile` approach.

**When to use:** The rewritten handler.

**Example:**
```typescript
// src/server/index.ts
import { db } from './db/client'
import { nodes, edges, graphMetadata } from './db/schema'

app.get('/api/map', (c) => {
  try {
    const nodeRows = db.select().from(nodes).all()
    const edgeRows = db.select().from(edges).all()
    const [meta] = db.select().from(graphMetadata).limit(1).all()

    if (!meta) return c.json({ error: 'Graph data not found' }, 404)

    const graph: NavGraph = {
      nodes: nodeRows,           // columns match NavNode fields directly
      edges: edgeRows,           // columns match NavEdge fields directly
      metadata: {
        buildingName: meta.buildingName,
        floor: meta.floor,
        lastUpdated: meta.lastUpdated,
      },
    }
    c.header('Cache-Control', 'public, max-age=60')
    return c.json(graph)
  } catch (err) {
    return c.json({ error: 'Failed to load graph data' }, 500)
  }
})
```

**Note:** `better-sqlite3` queries are **synchronous** — no `await` needed. The Hono handler can be a plain (non-async) function.

### Pattern 5: Seeder (Idempotent Startup)

**What:** Read `campus-graph.json`, insert rows only if the `nodes` table is empty. Uses `onConflictDoNothing` as a belt-and-suspenders guard.

**When to use:** On every startup; cheap check (count query), no-op if already seeded.

**Example:**
```typescript
// src/server/db/seed.ts
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { NavGraph } from '@shared/types'
import { db } from './client'
import { edges, graphMetadata, nodes } from './schema'

const __dirname = dirname(fileURLToPath(import.meta.url))

export function seedIfEmpty(): void {
  const count = db.select().from(nodes).all().length
  if (count > 0) return   // already seeded

  const filePath = resolve(__dirname, '../assets/campus-graph.json')
  const graph: NavGraph = JSON.parse(readFileSync(filePath, 'utf-8'))

  db.insert(nodes).values(graph.nodes).onConflictDoNothing().run()
  db.insert(edges).values(graph.edges).onConflictDoNothing().run()
  db.insert(graphMetadata).values([graph.metadata]).onConflictDoNothing().run()

  console.log(`[seed] Inserted ${graph.nodes.length} nodes, ${graph.edges.length} edges`)
}
```

### Pattern 6: Drizzle Kit Config

**What:** `drizzle.config.ts` at project root tells Drizzle Kit where the schema is and where to write migration SQL files.

**Example:**
```typescript
// drizzle.config.ts (project root)
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/server/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: './data/campus.db',
  },
})
```

### Pattern 7: Client Loading + Retry UX

**What:** The existing `useGraphData` hook already fetches from `/api/map` and surfaces `loading`/`error` states. The UI needs to show a spinner and retry on transient failure.

**Current state:** `useGraphData` returns `{ status: 'loading' | 'loaded' | 'error' }`. `FloorPlanCanvas` renders a text node on load/fail. The CONTEXT.md requires a visible spinner and 1–2 silent retries before showing an error.

**Recommended approach:**
- Add retry logic inside `useGraphData` (retry 1–2 times with a short delay before transitioning to `error`)
- Replace the Konva `Text` loading state with an HTML overlay spinner (the Konva Text approach lacks spinner animation)
- The error state already exists and can be surfaced as a visible message

**Anti-Patterns to Avoid**
- **Async Drizzle with better-sqlite3:** `better-sqlite3` is synchronous. Do not use `await db.select()...` — it returns a value directly (use `.all()`, `.get()`, `.run()`). The async version of Drizzle's API is designed for async drivers (libSQL, Postgres).
- **Using `drizzle-kit push` in place of `migrate`:** `push` is a dev shortcut that bypasses migration files. Since future phases need migrations for schema evolution, always use `generate` + `migrate`.
- **Storing Infinity in JSON:** `JSON.stringify(Infinity)` produces `null`. The campus-graph.json fixture uses `1e10` as a sentinel for non-accessible edges. The seeder should store `1e10` as-is in the REAL column. The `GET /api/map` handler should pass through whatever the DB returns — do not convert `1e10` to `Infinity` during seeding (pathfinding engine normalizes to `Infinity` during `buildGraph`).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Migration tracking | Custom SQL migrations table | Drizzle Kit `migrate()` | Drizzle manages its own `__drizzle_migrations` table; handles ordering, idempotency, checksums |
| Schema-to-type sync | Manual TypeScript interfaces | Drizzle `$inferSelect` / `$inferInsert` | Auto-derived types stay in sync with schema; no drift |
| SQLite connection pooling | Custom pool | `better-sqlite3` singleton | Synchronous SQLite doesn't need pooling; one connection per process is correct |
| Retry logic | Custom exponential backoff | Simple counter in `useGraphData` | 1–2 retries with fixed delay is sufficient; no need for a library |

**Key insight:** Drizzle's migration system is the only correct way to handle schema changes in this project. Once Phase 9 (admin editor) adds columns or tables, having tracked migration files is mandatory.

---

## Common Pitfalls

### Pitfall 1: `__dirname` Undefined in ESM Context

**What goes wrong:** The server already uses `"type": "module"` in `package.json` and ESM imports (`import.meta.url`). `__dirname` is not defined in ESM. If the DB path or migration folder path is constructed incorrectly, the DB opens in the wrong location or migrations are not found.

**Why it happens:** `better-sqlite3` needs an absolute path. Relative paths resolve from the process CWD (wherever `npm run dev:server` runs from), which is usually the project root — but is fragile.

**How to avoid:** Always use `dirname(fileURLToPath(import.meta.url))` to get the directory of the current file, then `resolve()` from there. The existing `src/server/index.ts` already demonstrates this pattern correctly.

**Warning signs:** DB file appears in an unexpected location; `ENOENT` on migrations folder.

### Pitfall 2: `Infinity` in SQLite and JSON Serialization

**What goes wrong:** The campus-graph.json uses `1e10` as a sentinel for non-accessible edge weights. SQLite REAL can store `1e10` fine. But if the seeder converts `1e10` to `Infinity` before inserting, and then the handler reads back `Infinity` and JSON-serializes it, `JSON.stringify(Infinity)` produces `null` — breaking the client.

**Why it happens:** SQLite stores `Infinity` as a valid REAL value, but JSON does not support `Infinity`.

**How to avoid:** Keep `1e10` as `1e10` throughout the DB layer. Never convert to `Infinity` in server code. The pathfinding engine (`buildGraph`) already converts `1e10` to `Infinity` on the client side during graph construction. This is the correct boundary.

**Warning signs:** Client pathfinding engine receives `null` for `accessibleWeight` on stair/ramp edges, causing pathfinding failures.

### Pitfall 3: Migration Folder Path at Runtime

**What goes wrong:** The migration folder path passed to `migrate(db, { migrationsFolder })` must resolve correctly at runtime. When tsx compiles and runs `src/server/index.ts`, `__dirname` of that file is `src/server/`. The `drizzle/` folder is at the project root. Using a relative path like `'./drizzle'` will resolve from CWD (likely correct), but using `resolve(__dirname, './drizzle')` from inside `src/server/index.ts` gives `src/server/drizzle/` (wrong).

**How to avoid:** Use `resolve(__dirname, '../../drizzle')` from `src/server/index.ts` (two levels up to project root, then into `drizzle/`). Or resolve from the project root by using `process.cwd()`.

**Warning signs:** `migrate()` runs but produces no log output; migration SQL is never applied; DB has no tables.

### Pitfall 4: better-sqlite3 Native Module Rebuild

**What goes wrong:** `better-sqlite3` is a native Node.js addon (`.node` file). If the installed binary was built for a different Node.js version than the current runtime, the server crashes on startup with `Error: The module ... was compiled against a different Node.js version`.

**Why it happens:** npm installs a prebuilt binary from the package. If Node.js is upgraded or the project is moved to a different machine, the binary may not match.

**How to avoid:** After installing, verify with `node -e "require('better-sqlite3')"`. If it fails, run `npm rebuild better-sqlite3`. This is a one-time setup concern, not a recurring code issue.

**Warning signs:** Server crashes immediately on startup before any Hono routes are registered.

### Pitfall 5: Biome Linting on Generated Migration Files

**What goes wrong:** Drizzle Kit generates `.sql` files in `drizzle/`. Biome's `files.includes` in the project's `biome.json` covers `**/*.json` — if it also scanned `drizzle/*.sql`, it would warn on SQL syntax. Currently Biome's `includes` is restricted to `.ts`, `.tsx`, `.js`, `.jsx`, `.json`, `.css`, so `.sql` files are already excluded.

**How to avoid:** No action needed; current Biome config does not lint `.sql` files. However, the generated `drizzle/meta/*.json` files will be scanned — they are valid JSON so this is safe.

**Warning signs:** Biome errors on generated files during `npm run lint`.

### Pitfall 6: `useGraphData` Called from Multiple Components

**What goes wrong:** Both `FloorPlanCanvas` and `LandmarkLayer` call `useGraphData()`. Each call creates its own `useState` + `useEffect`, meaning two independent `fetch('/api/map')` requests fire on mount.

**Why it happens:** React hooks have no built-in deduplication. The same hook called in two components = two fetches.

**How to avoid:** Lift the `graphState` from `FloorPlanCanvas` and pass it down as a prop to `LandmarkLayer` (eliminating `LandmarkLayer`'s own `useGraphData()` call). `FloorPlanCanvas` already calls `useGraphData` and holds `graphState`; `LandmarkLayer` should receive the resolved nodes array as a prop, not call the hook itself.

**Warning signs:** Network tab shows two GET /api/map requests on page load.

---

## Code Examples

Verified patterns from official sources:

### Drizzle + better-sqlite3: Full Server Startup Sequence

```typescript
// Source: drizzle-orm docs + betterstack guide (verified)
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'

const sqlite = new Database('./data/campus.db')
const db = drizzle(sqlite, { schema })

// Synchronous — no await needed
migrate(db, { migrationsFolder: './drizzle' })
```

### Schema: boolean columns in SQLite

```typescript
// Source: drizzle-orm/sqlite-core docs
import { integer, sqliteTable } from 'drizzle-orm/sqlite-core'

const table = sqliteTable('table', {
  // SQLite has no boolean type; integer mode auto-converts 0/1 ↔ boolean
  accessible: integer('accessible', { mode: 'boolean' }).notNull(),
})
```

### Schema: real columns for floating-point weights

```typescript
// Source: drizzle-orm docs https://orm.drizzle.team/docs/column-types/sqlite
import { real, sqliteTable } from 'drizzle-orm/sqlite-core'

const table = sqliteTable('table', {
  standardWeight: real('standard_weight').notNull(),
})
```

### Drizzle Kit Config for better-sqlite3 (Node.js server)

```typescript
// Source: drizzle-orm docs (verified)
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/server/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: './data/campus.db',
  },
})
```

### Migration generation and application CLI

```bash
# Generate SQL migration file from schema (run once, commit the output)
npx drizzle-kit generate

# Apply pending migrations to the DB (can also be done at server startup)
npx drizzle-kit migrate
```

### Synchronous query pattern with better-sqlite3

```typescript
// better-sqlite3 is synchronous — use .all() not await
const nodeRows = db.select().from(nodes).all()
const [meta] = db.select().from(graphMetadata).limit(1).all()
```

### Upsert / conflict guard during seeding

```typescript
// Source: drizzle-orm insert docs (verified)
db.insert(nodes)
  .values(graph.nodes)
  .onConflictDoNothing()
  .run()
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Raw `better-sqlite3` SQL strings | Drizzle ORM typed queries | Drizzle stable since 2023 | Type-safe queries, no SQL string building |
| Manual migration tracking | Drizzle Kit `generate` + `migrate` | Drizzle Kit v0.20+ | Migration files in git; `__drizzle_migrations` table auto-managed |
| `drizzle-kit push` (dev-only) | `drizzle-kit generate` + `migrate` | Drizzle Kit v0.22+ | Push skips SQL files; migrate preserves them for CI/prod |

**Deprecated/outdated:**
- `drizzle-kit push` for this project: acceptable in early prototyping but explicitly avoided per user decision (Drizzle Kit migrations required for Phase 9+)
- Reading JSON file directly from disk at request time (current approach): replaced by SQLite query

---

## Open Questions

1. **`useGraphData` double-fetch**
   - What we know: Both `FloorPlanCanvas` and `LandmarkLayer` call `useGraphData()`. This fires two fetches.
   - What's unclear: Whether the planner should fix this in Phase 7 as part of "client migration" or leave it (it worked before since JSON file reads are near-instant; with SQLite it's still sub-millisecond, so impact is negligible).
   - Recommendation: Fix it in Phase 7 — lift graph state into `FloorPlanCanvas` and pass nodes array as prop to `LandmarkLayer`. This is a clean migration and avoids future confusion.

2. **`campus-graph.json` retention after seeding**
   - What we know: User left this to Claude's discretion.
   - What's unclear: Whether to delete it (clean) or keep it as a backup seed source.
   - Recommendation: Keep `campus-graph.json` as the canonical seed source. It doubles as documentation for the data shape and is needed if the DB is ever reset. Do not delete it. Phase 9 (admin editor) will make the DB the source of truth, at which point the JSON file can be retired.

3. **Loading spinner implementation**
   - What we know: User wants a spinner on the map area during data load. Current code uses Konva `Text` for loading state.
   - What's unclear: Whether the spinner should be an HTML overlay or stay in Konva canvas.
   - Recommendation: HTML overlay `div` (same pattern as `SearchOverlay`, `ZoomControls`). Konva cannot natively animate a spinner without manual `requestAnimationFrame` — CSS is far simpler.

---

## Sources

### Primary (HIGH confidence)

- `/drizzle-team/drizzle-orm-docs` (Context7) — schema definition, migration commands, better-sqlite3 driver setup, insert/select patterns, `$inferSelect`
- `https://orm.drizzle.team/docs/get-started/sqlite-new` — official Drizzle SQLite getting started (fetched directly)
- `https://betterstack.com/community/guides/scaling-nodejs/drizzle-orm/` — schema with real/integer/text columns, database client singleton, migration config (fetched directly)

### Secondary (MEDIUM confidence)

- WebSearch: `migrate` import path `'drizzle-orm/better-sqlite3/migrator'` — confirmed by unpkg.com CDN showing `better-sqlite3/migrator.cjs` file exists in drizzle-orm package

### Tertiary (LOW confidence)

- WebSearch: `better-sqlite3` native module rebuild concern — described in multiple GitHub issues; standard known issue, not project-specific

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Drizzle + better-sqlite3 is locked decision; official docs confirm API
- Architecture: HIGH — Existing codebase fully inspected; server/client wiring understood completely
- Pitfalls: HIGH for Pitfalls 1–3 (verified from code inspection + official docs); MEDIUM for Pitfall 4 (well-known native module issue); HIGH for Pitfall 6 (confirmed by reading both `FloorPlanCanvas.tsx` and `LandmarkLayer.tsx`)

**Research date:** 2026-02-20
**Valid until:** 2026-03-22 (Drizzle is stable; 30-day window is conservative)
