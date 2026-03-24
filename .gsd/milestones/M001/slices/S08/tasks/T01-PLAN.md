---
phase: 07-api-data-persistence
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/server/db/schema.ts
  - src/server/db/client.ts
  - drizzle.config.ts
  - .gitignore
autonomous: true
requirements:
  - ADMN-02

must_haves:
  truths:
    - "Drizzle schema defines nodes, edges, and graph_metadata tables matching the NavGraph TypeScript type exactly"
    - "Database client singleton is created with better-sqlite3 + Drizzle ORM and exported for use by server handlers"
    - "drizzle.config.ts exists at project root pointing schema at src/server/db/schema.ts and output at ./drizzle"
    - "data/campus.db is gitignored; drizzle/ migration folder is committed"
  artifacts:
    - path: "src/server/db/schema.ts"
      provides: "Drizzle table definitions for nodes, edges, graph_metadata"
      min_lines: 40
    - path: "src/server/db/client.ts"
      provides: "better-sqlite3 + Drizzle singleton, exports db"
      min_lines: 10
    - path: "drizzle.config.ts"
      provides: "Drizzle Kit configuration"
      min_lines: 8
    - path: "drizzle/"
      provides: "Generated SQL migration file (0000_initial.sql or similar)"
  key_links:
    - from: "src/server/db/client.ts"
      to: "src/server/db/schema.ts"
      via: "import * as schema from './schema'"
      pattern: "import.*schema"
    - from: "drizzle.config.ts"
      to: "src/server/db/schema.ts"
      via: "schema: './src/server/db/schema.ts'"
      pattern: "schema.*server/db/schema"
---

<objective>
Install Drizzle ORM + better-sqlite3, define the SQLite schema matching the NavGraph TypeScript shape, create the DB client singleton, generate the initial migration file, and gitignore the database file.

Purpose: All subsequent Phase 7 work (seeder, /api/map handler rewrite, client verification) depends on the schema and DB client existing.
Output: src/server/db/schema.ts, src/server/db/client.ts, drizzle.config.ts, drizzle/ migration folder, .gitignore update
</objective>

<execution_context>
@C:/Users/admin/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/admin/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@src/shared/types.ts
@src/server/index.ts
@.planning/phases/07-api-data-persistence/07-RESEARCH.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Install packages and define Drizzle schema</name>
  <files>
    src/server/db/schema.ts
    package.json
    package-lock.json
  </files>
  <action>
Install the four required packages:
```
npm install drizzle-orm better-sqlite3
npm install -D drizzle-kit @types/better-sqlite3
```

After installation, create `src/server/db/` directory and write `src/server/db/schema.ts` with three Drizzle table definitions that exactly mirror the NavGraph TypeScript types from `src/shared/types.ts`:

```typescript
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const nodes = sqliteTable('nodes', {
  id:                 text('id').primaryKey(),
  x:                  real('x').notNull(),
  y:                  real('y').notNull(),
  label:              text('label').notNull(),
  type:               text('type').notNull(),                          // NavNodeType string enum
  searchable:         integer('searchable', { mode: 'boolean' }).notNull(),
  floor:              integer('floor').notNull(),
  roomNumber:         text('room_number'),                             // nullable
  description:        text('description'),                             // nullable
  buildingName:       text('building_name'),                           // nullable
  accessibilityNotes: text('accessibility_notes'),                     // nullable
})

export const edges = sqliteTable('edges', {
  id:                 text('id').primaryKey(),
  sourceId:           text('source_id').notNull(),
  targetId:           text('target_id').notNull(),
  standardWeight:     real('standard_weight').notNull(),
  accessibleWeight:   real('accessible_weight').notNull(),             // stored as 1e10 for non-accessible (never Infinity — JSON cannot serialize Infinity)
  accessible:         integer('accessible', { mode: 'boolean' }).notNull(),
  bidirectional:      integer('bidirectional', { mode: 'boolean' }).notNull(),
  accessibilityNotes: text('accessibility_notes'),                     // nullable
})

export const graphMetadata = sqliteTable('graph_metadata', {
  id:           integer('id').primaryKey({ autoIncrement: true }),
  buildingName: text('building_name').notNull(),
  floor:        integer('floor').notNull(),
  lastUpdated:  text('last_updated').notNull(),                        // ISO 8601 string
})
```

Key type mapping rules (from RESEARCH.md):
- `number` fields → `real()` (x, y, weights)
- `string` fields → `text()`
- `boolean` fields → `integer({ mode: 'boolean' })` — SQLite has no native boolean; Drizzle auto-converts 0/1
- Optional/nullable fields → omit `.notNull()`
- NavNode.roomNumber maps to column `room_number` (snake_case per convention), but the Drizzle field name stays camelCase for TypeScript compatibility
  </action>
  <verify>
Run `npm ls drizzle-orm better-sqlite3 drizzle-kit` — all three should appear without errors.
Check `src/server/db/schema.ts` exists and has all three table exports: `nodes`, `edges`, `graphMetadata`.
Run `npx tsc --noEmit` — zero TypeScript errors on schema.ts.
  </verify>
  <done>
drizzle-orm, better-sqlite3, drizzle-kit, @types/better-sqlite3 appear in package.json.
src/server/db/schema.ts exports nodes, edges, graphMetadata tables with correct column types.
TypeScript compiles schema.ts without errors.
  </done>
</task>

<task type="auto">
  <name>Task 2: Create DB client, drizzle config, generate migration, gitignore DB file</name>
  <files>
    src/server/db/client.ts
    drizzle.config.ts
    .gitignore
    drizzle/
  </files>
  <action>
**A. Create `src/server/db/client.ts`** — the better-sqlite3 + Drizzle singleton:

```typescript
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as schema from './schema'

const __dirname = dirname(fileURLToPath(import.meta.url))
// DB lives in /data/campus.db at project root (two levels up from src/server/db/)
const dbDir = resolve(__dirname, '../../../data')
const dbPath = resolve(dbDir, 'campus.db')

// Ensure /data/ directory exists (first run)
mkdirSync(dbDir, { recursive: true })

const sqlite = new Database(dbPath)
export const db = drizzle(sqlite, { schema })
```

Using `mkdirSync({ recursive: true })` ensures the `data/` directory is created on first run without throwing if it already exists.

**B. Create `drizzle.config.ts`** at project root:

```typescript
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

**C. Generate migration file** — run from project root:
```
npx drizzle-kit generate
```
This creates `drizzle/` directory with a SQL migration file (e.g. `0000_initial.sql`) and `drizzle/meta/` metadata. Commit these files — they are version-controlled schema history.

**D. Update `.gitignore`** — add two lines:
```
data/
drizzle/meta/_journal.json
```
Wait — actually `data/` should be gitignored (contains the .db file), but `drizzle/` must NOT be gitignored (migration files are committed). Add only:
```
data/
```
Append `data/` to the existing `.gitignore`. The `drizzle/` folder is committed as-is.
  </action>
  <verify>
- `src/server/db/client.ts` exists and exports `db`
- `drizzle.config.ts` exists at project root
- `drizzle/` directory exists and contains at least one `.sql` file after running `npx drizzle-kit generate`
- `.gitignore` contains `data/`
- Run `npx tsc --noEmit` — zero TypeScript errors on client.ts
- Run `node -e "import('./src/server/db/client.ts')"` or verify server starts without crashing (will be tested fully in Plan 02)
  </verify>
  <done>
drizzle.config.ts exists at project root.
src/server/db/client.ts exports `db` as Drizzle instance.
drizzle/ migration folder exists with SQL file.
data/ is listed in .gitignore.
TypeScript compiles without errors.
  </done>
</task>

</tasks>

<verification>
After both tasks complete:
1. `npm ls drizzle-orm better-sqlite3 drizzle-kit @types/better-sqlite3` shows all four packages
2. `src/server/db/schema.ts` — three table exports matching NavGraph types
3. `src/server/db/client.ts` — exports `db`, uses `mkdirSync` to create `data/`, resolves DB path via `import.meta.url`
4. `drizzle.config.ts` — points to schema and `./drizzle` output
5. `drizzle/` contains at least one `.sql` migration file
6. `.gitignore` contains `data/`
7. `npx tsc --noEmit` passes (zero errors)
</verification>

<success_criteria>
Drizzle schema, DB client singleton, migration file, and .gitignore are in place. The database infrastructure layer is ready for Plan 02 (seeder + server handler rewrite).
</success_criteria>

<output>
After completion, create `.planning/phases/07-api-data-persistence/07-01-SUMMARY.md` using the summary template.
</output>
