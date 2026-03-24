---
phase: 15-postgresql-migration
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - package.json
  - src/server/db/schema.ts
  - src/server/db/client.ts
  - drizzle.config.ts
  - drizzle/0000_*.sql
  - drizzle/meta/_journal.json
  - drizzle/meta/0000_snapshot.json
  - docker-compose.yml
  - .env
  - .env.example
autonomous: true
requirements: [INFR-01]

must_haves:
  truths:
    - "`postgres` package appears in package.json dependencies; `better-sqlite3` and `@types/better-sqlite3` are absent"
    - "schema.ts imports from `drizzle-orm/pg-core` and uses `pgTable`, `boolean()`, `serial()` — no sqlite-core imports remain"
    - "client.ts exports `db` using `drizzle-orm/postgres-js` and `postgres` — no `better-sqlite3` imports remain"
    - "drizzle.config.ts has `dialect: 'postgresql'` and `dbCredentials.url: process.env.DATABASE_URL!`"
    - "drizzle/ folder contains freshly generated PostgreSQL DDL (`CREATE TABLE \"nodes\"` with `boolean` and `serial` columns)"
    - "docker-compose.yml exists at project root with a `postgres:16` service on port 5432"
    - ".env exists with `DATABASE_URL=postgresql://campusnav:campusnav@localhost:5432/campusnav`; .env.example documents the variable"
  artifacts:
    - src/server/db/schema.ts
    - src/server/db/client.ts
    - drizzle.config.ts
    - docker-compose.yml
    - .env.example
  key_links:
    - client.ts exports `db` with the same name — all downstream route imports (`import { db } from './db/client'`) are unchanged
    - drizzle/ migration folder contains valid PostgreSQL DDL that the postgres-js migrator can apply at startup
---

<objective>
Replace the SQLite database layer with PostgreSQL. Swap packages, rewrite the three DB infrastructure files (schema.ts, client.ts, drizzle.config.ts), create Docker and environment config, then regenerate the migration SQL from the updated schema.

Purpose: Establishes PostgreSQL as the database engine, enabling cloud-hosted deployment on Neon (INFR-01). All downstream code (routes, seed) remains untouched until Plan 02.
Output: Installable postgres.js client, pg-core schema, fresh PostgreSQL migration SQL, local Docker dev stack.
</objective>

<execution_context>
@C:/Users/LENOVO/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/LENOVO/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/ROADMAP.md
@.planning/phases/15-postgresql-migration/15-CONTEXT.md
@.planning/phases/15-postgresql-migration/15-RESEARCH.md

<interfaces>
<!-- Current files being replaced — read before rewriting -->

Current src/server/db/schema.ts (SQLite — REPLACE entirely):
```typescript
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const nodes = sqliteTable('nodes', {
  id: text('id').primaryKey(),
  x: real('x').notNull(),
  y: real('y').notNull(),
  label: text('label').notNull(),
  type: text('type').notNull(),
  searchable: integer('searchable', { mode: 'boolean' }).notNull(),
  floor: integer('floor').notNull(),
  roomNumber: text('room_number'),
  description: text('description'),
  buildingName: text('building_name'),
  accessibilityNotes: text('accessibility_notes'),
})

export const edges = sqliteTable('edges', {
  id: text('id').primaryKey(),
  sourceId: text('source_id').notNull(),
  targetId: text('target_id').notNull(),
  standardWeight: real('standard_weight').notNull(),
  accessibleWeight: real('accessible_weight').notNull(),
  accessible: integer('accessible', { mode: 'boolean' }).notNull(),
  bidirectional: integer('bidirectional', { mode: 'boolean' }).notNull(),
  accessibilityNotes: text('accessibility_notes'),
})

export const graphMetadata = sqliteTable('graph_metadata', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  buildingName: text('building_name').notNull(),
  floor: integer('floor').notNull(),
  lastUpdated: text('last_updated').notNull(),
})
```

Current src/server/db/client.ts (SQLite — REPLACE entirely):
```typescript
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as schema from './schema'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dbDir = resolve(__dirname, '../../../data')
const dbPath = resolve(dbDir, 'campus.db')
mkdirSync(dbDir, { recursive: true })
const sqlite = new Database(dbPath)
export const db = drizzle(sqlite, { schema })
```

Current drizzle.config.ts (SQLite — UPDATE):
```typescript
import { defineConfig } from 'drizzle-kit'
export default defineConfig({
  schema: './src/server/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: { url: './data/campus.db' },
})
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Swap packages, rewrite schema.ts and client.ts, update drizzle.config.ts</name>
  <files>package.json, src/server/db/schema.ts, src/server/db/client.ts, drizzle.config.ts</files>
  <action>
**Step 1 — Package swap:**
Run in the project root:
```bash
npm install postgres
npm uninstall better-sqlite3
npm uninstall --save-dev @types/better-sqlite3
```
Verify package.json shows `"postgres"` in dependencies and no `better-sqlite3` or `@types/better-sqlite3` entries remain.

**Step 2 — Rewrite src/server/db/schema.ts** (full replacement):
```typescript
import { boolean, integer, pgTable, real, serial, text } from 'drizzle-orm/pg-core'

export const nodes = pgTable('nodes', {
  id: text('id').primaryKey(),
  x: real('x').notNull(),
  y: real('y').notNull(),
  label: text('label').notNull(),
  type: text('type').notNull(),
  searchable: boolean('searchable').notNull(),
  floor: integer('floor').notNull(),
  roomNumber: text('room_number'),
  description: text('description'),
  buildingName: text('building_name'),
  accessibilityNotes: text('accessibility_notes'),
})

export const edges = pgTable('edges', {
  id: text('id').primaryKey(),
  sourceId: text('source_id').notNull(),
  targetId: text('target_id').notNull(),
  standardWeight: real('standard_weight').notNull(),
  accessibleWeight: real('accessible_weight').notNull(),
  accessible: boolean('accessible').notNull(),
  bidirectional: boolean('bidirectional').notNull(),
  accessibilityNotes: text('accessibility_notes'),
})

export const graphMetadata = pgTable('graph_metadata', {
  id: serial('id').primaryKey(),
  buildingName: text('building_name').notNull(),
  floor: integer('floor').notNull(),
  lastUpdated: text('last_updated').notNull(),
})
```
Key changes: `sqliteTable` → `pgTable`, `integer({ mode: 'boolean' })` → `boolean()`, `integer().primaryKey({ autoIncrement: true })` → `serial().primaryKey()`.

**Step 3 — Rewrite src/server/db/client.ts** (full replacement):
```typescript
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const client = postgres(process.env.DATABASE_URL!, {
  ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
  max: 5,
})
export const db = drizzle({ client, schema })
```
Remove: all `better-sqlite3` imports, `mkdirSync`, `dbDir`/`dbPath` path logic — no local file directory needed for PostgreSQL.
The export name `db` stays identical so all downstream `import { db } from './db/client'` imports remain unchanged.

**Step 4 — Update drizzle.config.ts** (full replacement):
```typescript
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/server/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
```
Change: `dialect: 'sqlite'` → `dialect: 'postgresql'`, `dbCredentials.url` from file path → `process.env.DATABASE_URL!`.
  </action>
  <verify>
    <automated>rtk npm run typecheck 2>&1 | head -30</automated>
  </verify>
  <done>TypeScript compiles without errors on schema.ts and client.ts. No `better-sqlite3` imports remain anywhere in src/server/db/. `postgres` appears in package.json dependencies.</done>
</task>

<task type="auto">
  <name>Task 2: Create docker-compose.yml, .env, .env.example, then clear and regenerate migrations</name>
  <files>docker-compose.yml, .env, .env.example, drizzle/0000_*.sql, drizzle/meta/_journal.json, drizzle/meta/0000_snapshot.json</files>
  <action>
**Step 1 — Create docker-compose.yml at project root:**
```yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: campusnav
      POSTGRES_PASSWORD: campusnav
      POSTGRES_DB: campusnav
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

**Step 2 — Create/update .env at project root:**
Add or update the `DATABASE_URL` line. Preserve any existing lines (JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD_HASH). The `DATABASE_URL` line should be:
```
DATABASE_URL=postgresql://campusnav:campusnav@localhost:5432/campusnav
```
If .env already exists, add this line if not present; do not overwrite other secrets.

**Step 3 — Create .env.example at project root** (full content, no real secrets):
```
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=your-jwt-secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD_HASH=your-bcrypt-hash
```

**Step 4 — Clear old SQLite migration artifacts:**
Delete the entire `drizzle/` folder contents (the SQLite DDL is invalid PostgreSQL syntax and must not be reused):
```bash
rm -rf drizzle/
```

**Step 5 — Regenerate PostgreSQL migration:**
The `dev:server` script loads .env via `--env-file`, but drizzle-kit reads DATABASE_URL from the environment. Run with DATABASE_URL explicitly:
```bash
DATABASE_URL=postgresql://campusnav:campusnav@localhost:5432/campusnav npx drizzle-kit generate
```
If drizzle-kit cannot connect to generate (it only reads schema, not connects for `generate`), the command should succeed without a live DB. If it requires a live connection, start Docker first:
```bash
docker compose up -d
DATABASE_URL=postgresql://campusnav:campusnav@localhost:5432/campusnav npx drizzle-kit generate
```

**Step 6 — Verify migration output:**
Open the newly generated SQL file in `drizzle/`. Confirm it contains:
- `CREATE TABLE "nodes"` with `boolean` columns (not `integer`)
- `CREATE TABLE "graph_metadata"` with `id serial PRIMARY KEY` or equivalent (not `AUTOINCREMENT`)
- Double-quoted identifiers (PostgreSQL style), NOT backtick-quoted (SQLite style)

The old `drizzle/0000_brief_madame_hydra.sql` with backticks and `AUTOINCREMENT` must be gone.
  </action>
  <verify>
    <automated>ls drizzle/ && grep -i "boolean\|serial" drizzle/*.sql | head -10</automated>
  </verify>
  <done>drizzle/ folder contains a freshly generated .sql file with PostgreSQL DDL (boolean columns, serial primary key, double-quoted identifiers). docker-compose.yml exists at project root. .env contains DATABASE_URL. .env.example is committed-safe (no real secrets).</done>
</task>

</tasks>

<verification>
After both tasks complete:
1. `package.json` has `postgres` in dependencies and no `better-sqlite3`/`@types/better-sqlite3` entries
2. `src/server/db/schema.ts` uses only `drizzle-orm/pg-core` imports — zero sqlite-core references
3. `src/server/db/client.ts` uses `postgres` and `drizzle-orm/postgres-js` — zero better-sqlite3 references
4. `drizzle.config.ts` has `dialect: 'postgresql'`
5. New migration SQL file in `drizzle/` uses PostgreSQL syntax
6. `docker-compose.yml` exists at project root
7. `.env` has `DATABASE_URL` pointing to localhost PostgreSQL
8. TypeScript compiles without errors (`npm run typecheck`)
</verification>

<success_criteria>
The PostgreSQL DB layer is fully installed and configured. The `db` export from client.ts is ready to receive async queries. The migration SQL is valid PostgreSQL DDL. Docker + .env enables a local developer to run `docker compose up -d` and connect immediately. Plan 02 can now safely rewrite the async server startup and routes.
</success_criteria>

<output>
After completion, create `.planning/phases/15-postgresql-migration/15-01-SUMMARY.md` using the summary template.
</output>
