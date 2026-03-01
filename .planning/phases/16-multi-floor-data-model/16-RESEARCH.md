# Phase 16: Multi-floor Data Model - Research

**Researched:** 2026-03-01
**Domain:** PostgreSQL schema design, Drizzle ORM migrations, TypeScript type evolution
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Schema design:**
- Relational approach: add `buildings(id, name)` and `floors(id, building_id, floor_number, image_path)` tables with proper FK relationships
- Buildings table: minimal — id + name only (description/address deferred to a later phase)
- Floors table: `building_id` (FK → buildings), `floor_number` (1-based integer), `image_path` (string)
- Nodes: replace the flat `floor` integer column with a `floor_id` FK referencing `floors.id`; remove flat `buildingName` column (building is now derived transitively via floor → building)

**Floor connector linkage:**
- Extra columns on the `nodes` table (not a separate table, not JSON)
- `connects_to_floor_above_id` (nullable FK → floors.id) — which floor this connector reaches going up
- `connects_to_floor_below_id` (nullable FK → floors.id) — which floor this connector reaches going down
- `connects_to_node_above_id` (nullable FK → nodes.id) — specific counterpart node on the floor above
- `connects_to_node_below_id` (nullable FK → nodes.id) — specific counterpart node on the floor below
- Only applies to nodes of type `stairs`, `elevator`, `ramp`; nullable on all other node types

**Floor plan image storage:**
- `floors.image_path` stores a path/filename string; server resolves the actual file relative to `src/server/assets/`
- No thumbnail storage in Phase 16 — skip thumbnails until Phase 18/19 when needed

**Migration strategy:**
- Drizzle migration script (not wipe-and-reseed): creates `buildings` + `floors` tables, inserts "Main Building" + Floor 1, then updates all 48 existing nodes to have `floor_id` pointing to the new Floor 1 record
- Drop `graphMetadata` table — `floors` table replaces it entirely; add `updated_at` column to `floors`
- Update `campus-graph.json` seed file format to multi-floor: `buildings: [{ id, name, floors: [{ floor_number, image_path, nodes, edges }] }]`
- Update `NavGraph` TypeScript type and `NavNode` to reflect the new multi-floor seed structure

### Claude's Discretion
- File naming convention for per-floor floor plan images (e.g., `floor-plan-{building_id}-{floor_number}.png` or subdirectory)
- API endpoint design for serving per-floor images (backward-compatible with existing client calls preferred)
- How `buildingName` is handled in `NavNodeData` type — derived via join vs kept as a convenience field

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope
</user_constraints>

---

## Summary

Phase 16 is a pure data-layer migration: no new UI, no new routes beyond an optional image-serving endpoint. The work has three tightly coupled concerns that must execute in order — schema changes, seed data format update, and TypeScript type alignment.

The hardest technical challenge is the **self-referential foreign key** on `nodes.connects_to_node_above_id` and `connects_to_node_below_id`, which reference `nodes.id` within the same table. Drizzle ORM supports this pattern via `AnyPgColumn` with a deferred callback (`references((): AnyPgColumn => nodes.id)`). This is well-documented and verified in Context7. The cross-table FK (`nodes.floor_id → floors.id`) is straightforward.

The migration must be a **data migration**, not a wipe-and-reseed. The existing 48 nodes must be updated in-place to point to a newly inserted Floor 1 record. Drizzle ORM's `migrate()` function at startup applies SQL files in order, so the migration SQL must be written carefully: create new tables first, insert seed rows, then alter `nodes` to add new columns and back-fill `floor_id`. The `graphMetadata` table must be dropped as part of the same migration.

**Primary recommendation:** Write a single Drizzle migration SQL file that handles the full schema transition atomically. Update `schema.ts` to reflect the new shape, then update `types.ts` and `campus-graph.json` last. The `GET /api/map` endpoint must be updated to JOIN across buildings/floors and return a multi-floor `NavGraph` shape the client and pathfinding engine can consume.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MFLR-01 | Each building floor is a first-class data entity with its own floor plan image reference and node graph | `floors` table schema pattern; `image_path` string column; updated `NavGraph` type nesting floors under buildings |
| MFLR-02 | Floor connector nodes (staircase/elevator/ramp) carry floor-linkage metadata (which floor above/below they connect to) | Self-referential FK pattern via `AnyPgColumn`; four nullable FK columns on `nodes` table |
| CAMP-01 | Multi-building data model stores buildings as parent entities, each containing one or more floors | `buildings` table as parent; `floors.building_id` FK; transitive derivation of building from node via floor |
</phase_requirements>

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| drizzle-orm | ^0.45.1 (already installed) | Schema definition, query builder, migration runner | Already the project ORM; `pgTable`, `integer`, `text`, `serial`, `boolean`, `real` all available |
| drizzle-kit | ^0.31.9 (already installed) | Generate SQL migration files from schema diff | Already configured; generates committed SQL files under `drizzle/` |
| postgres (postgres-js) | ^3.4.8 (already installed) | PostgreSQL driver | Already the project driver post Phase 15; migration client pattern already established |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| AnyPgColumn (drizzle-orm/pg-core) | same as drizzle-orm | Type token for self-referential FK | Required for `connects_to_node_above_id` and `connects_to_node_below_id` which reference `nodes.id` |
| timestamp (drizzle-orm/pg-core) | same as drizzle-orm | `updated_at` column on `floors` | Replacing `graphMetadata.lastUpdated` which was a plain `text` ISO string; `timestamp` is more semantically correct |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Extra columns on `nodes` for connector linkage | Separate `connector_links` join table | Join table is more normalized but adds complexity for Phase 17 pathfinding; extra columns are simpler and already decided |
| `text` for `updated_at` (matching current `graphMetadata`) | `timestamp` with timezone | `timestamp` is better practice for PostgreSQL; `text` would require string parsing; timestamp is the right call |

**Installation:** No new packages needed. All libraries are already installed.

---

## Architecture Patterns

### Recommended Project Structure

The file changes are scoped to:

```
src/
├── server/
│   ├── db/
│   │   ├── schema.ts          # Add buildings + floors tables; modify nodes table
│   │   └── seed.ts            # Update to read new multi-floor campus-graph.json format
│   ├── assets/
│   │   └── campus-graph.json  # Update to multi-floor nested format
│   └── index.ts               # Update GET /api/map to JOIN and return multi-floor NavGraph
├── shared/
│   └── types.ts               # Add Floor, Building types; update NavGraph, NavNodeData
drizzle/
└── 0001_multi_floor.sql       # New migration file (generated by drizzle-kit generate)
```

### Pattern 1: Drizzle Foreign Key with Cross-Table Reference

**What:** Standard FK column that references another table's primary key.
**When to use:** `floors.building_id → buildings.id`; `nodes.floor_id → floors.id`; `nodes.connects_to_floor_above_id → floors.id`.

```typescript
// Source: https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/indexes-constraints.mdx

import { integer, pgTable, serial, text } from 'drizzle-orm/pg-core'

export const buildings = pgTable('buildings', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
})

export const floors = pgTable('floors', {
  id: serial('id').primaryKey(),
  buildingId: integer('building_id').notNull().references(() => buildings.id),
  floorNumber: integer('floor_number').notNull(),
  imagePath: text('image_path').notNull(),
  updatedAt: text('updated_at').notNull(), // ISO 8601 — matches existing project convention
})
```

### Pattern 2: Self-Referential Foreign Key (AnyPgColumn)

**What:** A column in a table that references the primary key of the same table. Requires `AnyPgColumn` to break the TypeScript circular type inference.
**When to use:** `nodes.connects_to_node_above_id → nodes.id` and `nodes.connects_to_node_below_id → nodes.id`.

```typescript
// Source: https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/indexes-constraints.mdx

import type { AnyPgColumn } from 'drizzle-orm/pg-core'
import { integer, pgTable, text } from 'drizzle-orm/pg-core'

export const nodes = pgTable('nodes', {
  id: text('id').primaryKey(),
  // ... other columns ...
  floorId: integer('floor_id').notNull().references(() => floors.id),
  // Self-referential FKs — nullable (only set on stairs/elevator/ramp)
  connectsToNodeAboveId: text('connects_to_node_above_id').references((): AnyPgColumn => nodes.id),
  connectsToNodeBelowId: text('connects_to_node_below_id').references((): AnyPgColumn => nodes.id),
  // Floor FKs for connector nodes
  connectsToFloorAboveId: integer('connects_to_floor_above_id').references(() => floors.id),
  connectsToFloorBelowId: integer('connects_to_floor_below_id').references(() => floors.id),
})
```

**Important:** `connectsToNodeAboveId` and `connectsToNodeBelowId` must be `text` (matching `nodes.id` which is `text`). The floor connector FK columns use `integer` (matching `floors.id` which is `serial` = `integer`).

### Pattern 3: Data Migration SQL — Create, Back-fill, Alter

**What:** When a migration both creates new tables and modifies existing ones with data back-fill, the SQL must run in a safe order.
**When to use:** This phase requires exactly this: create `buildings` + `floors`, insert the initial "Main Building" / Floor 1 records, then alter `nodes` to add `floor_id` and populate it, then drop `graphMetadata`.

```sql
-- Safe order for this migration:

-- 1. Create new tables (no deps yet)
CREATE TABLE "buildings" (...);
CREATE TABLE "floors" (...);

-- 2. Insert seed data (before FK constraints on nodes are added)
INSERT INTO "buildings" (name) VALUES ('Main Building');
INSERT INTO "floors" (building_id, floor_number, image_path, updated_at)
  VALUES (1, 1, 'floor-plan.png', now()::text);

-- 3. Add new columns to nodes (nullable initially for back-fill)
ALTER TABLE "nodes"
  ADD COLUMN "floor_id" integer,
  ADD COLUMN "connects_to_floor_above_id" integer,
  ADD COLUMN "connects_to_floor_below_id" integer,
  ADD COLUMN "connects_to_node_above_id" text,
  ADD COLUMN "connects_to_node_below_id" text;

-- 4. Back-fill floor_id for all existing nodes
UPDATE "nodes" SET "floor_id" = 1;

-- 5. Now apply NOT NULL constraint (safe because all rows populated)
ALTER TABLE "nodes" ALTER COLUMN "floor_id" SET NOT NULL;

-- 6. Add FK constraints
ALTER TABLE "nodes"
  ADD CONSTRAINT "nodes_floor_id_fk" FOREIGN KEY ("floor_id") REFERENCES "floors"("id"),
  ADD CONSTRAINT "nodes_connects_to_floor_above_id_fk" FOREIGN KEY ("connects_to_floor_above_id") REFERENCES "floors"("id"),
  ADD CONSTRAINT "nodes_connects_to_floor_below_id_fk" FOREIGN KEY ("connects_to_floor_below_id") REFERENCES "floors"("id"),
  ADD CONSTRAINT "nodes_connects_to_node_above_id_fk" FOREIGN KEY ("connects_to_node_above_id") REFERENCES "nodes"("id"),
  ADD CONSTRAINT "nodes_connects_to_node_below_id_fk" FOREIGN KEY ("connects_to_node_below_id") REFERENCES "nodes"("id");

-- 7. Drop old columns from nodes
ALTER TABLE "nodes"
  DROP COLUMN "floor",
  DROP COLUMN "building_name";

-- 8. Drop graphMetadata table (replaced by floors.updated_at)
DROP TABLE "graph_metadata";
```

**Critical insight:** Step 3 adds columns as nullable, step 4 back-fills, step 5 applies NOT NULL. Attempting to add a NOT NULL column without a default to a table with existing rows will fail in PostgreSQL.

### Pattern 4: drizzle-kit generate Workflow

**What:** After updating `schema.ts`, run `drizzle-kit generate` to produce the SQL diff file. Then manually review and potentially hand-edit the generated SQL to add the data back-fill steps that drizzle-kit cannot infer.
**When to use:** Every schema change in this project.

```bash
# After editing src/server/db/schema.ts:
npx drizzle-kit generate --name=multi_floor

# Review generated drizzle/0001_multi_floor.sql
# Hand-edit to add INSERT seed rows and UPDATE back-fill (drizzle-kit generates DDL only)
# Migration runs automatically on next server startup via migrate() in index.ts
```

**Important:** drizzle-kit generates DDL (CREATE TABLE, ALTER TABLE) but does NOT generate DML (INSERT, UPDATE). The back-fill `UPDATE "nodes" SET "floor_id" = 1` must be added manually to the generated SQL file.

### Pattern 5: Updated NavGraph Type — Multi-floor Shape

**What:** The `NavGraph` type must evolve from a flat single-floor shape to a multi-floor nested structure that matches the new seed format and what `GET /api/map` returns.

```typescript
// NEW types to add to src/shared/types.ts

export interface NavBuilding {
  id: number
  name: string
  floors: NavFloor[]
}

export interface NavFloor {
  id: number
  floorNumber: number
  imagePath: string
  updatedAt: string
  nodes: NavNode[]
  edges: NavEdge[]
}

// UPDATED NavGraph
export interface NavGraph {
  buildings: NavBuilding[]
  // nodes and edges are now nested under floors — top-level removed
}

// UPDATED NavNodeData — floor_id replaces floor, buildingName removed
export interface NavNodeData {
  x: number
  y: number
  label: string
  type: NavNodeType
  searchable: boolean
  floorId: number           // replaces: floor: number
  // buildingName removed — derived transitively via floor → building
  roomNumber?: string
  description?: string
  accessibilityNotes?: string
  // New connector linkage fields (nullable on non-connector nodes)
  connectsToFloorAboveId?: number
  connectsToFloorBelowId?: number
  connectsToNodeAboveId?: string
  connectsToNodeBelowId?: string
}
```

**Note on buildingName in NavNodeData:** The Context says this is Claude's discretion. The recommendation is to **remove it** from `NavNodeData` entirely. Building name is now derivable from `NavBuilding.name` via the `NavGraph.buildings` structure. Keeping it as a convenience field would require duplication that could drift. Phase 17 (pathfinding) accesses `NavGraph` directly and can walk `buildings[].floors[].nodes[]` — no need for denormalized `buildingName` on each node.

### Pattern 6: Updated campus-graph.json Seed Format

```json
{
  "buildings": [
    {
      "id": 1,
      "name": "Main Building",
      "floors": [
        {
          "floorNumber": 1,
          "imagePath": "floor-plan.png",
          "nodes": [
            {
              "id": "room-new-node-1771677125414",
              "x": 0.9327003751002229,
              "y": 0.20166337728180692,
              "label": "Private Area Entrance",
              "type": "entrance",
              "searchable": true
            }
          ],
          "edges": [
            {
              "id": "edge-...",
              "sourceId": "...",
              "targetId": "...",
              "standardWeight": 0.05,
              "accessibleWeight": 0.05,
              "accessible": true,
              "bidirectional": true
            }
          ]
        }
      ]
    }
  ]
}
```

Note that `floor` and `buildingName` fields are dropped from individual node objects in the seed — they are implicit from nesting position. The `id` on buildings and floors in the seed JSON does not need to match the database serial IDs exactly — the seeder inserts buildings/floors and uses the returned IDs when inserting nodes.

### Pattern 7: Updated seed.ts — Multi-floor Seed Reader

```typescript
// Conceptual update to seedIfEmpty() in src/server/db/seed.ts

type SeedFloor = {
  floorNumber: number
  imagePath: string
  nodes: Omit<NavNode, 'floor' | 'buildingName'>[]
  edges: NavEdge[]
}
type SeedBuilding = { id: number; name: string; floors: SeedFloor[] }
type SeedGraph = { buildings: SeedBuilding[] }

// Seeder inserts buildings → floors (capturing returned IDs) → nodes → edges
// Uses RETURNING clause or serial sequence to get floor IDs for FK population
```

**Key consideration for seed.ts:** When inserting floors, the seeder needs the auto-generated `id` (serial) from the `floors` table to set `floor_id` on the node rows. Drizzle supports `db.insert(floors).values(...).returning()` to get the inserted IDs back.

```typescript
// Pattern: insert with RETURNING to get generated serial IDs
const [floor] = await db.insert(floors).values({
  buildingId: building.id,
  floorNumber: f.floorNumber,
  imagePath: f.imagePath,
  updatedAt: new Date().toISOString(),
}).returning({ id: floors.id })

// Then use floor.id when inserting nodes
```

### Pattern 8: Updated GET /api/map Response

The `GET /api/map` handler in `src/server/index.ts` currently queries `nodes`, `edges`, and `graphMetadata` separately. After Phase 16 it must:

1. Query `buildings`, `floors`, `nodes`, `edges`
2. Assemble the nested `NavGraph` structure (buildings → floors → nodes/edges)
3. Return the new `NavGraph` shape

The pathfinding engine (`src/shared/pathfinding/engine.ts`) receives `NavGraph` and calls `buildGraph(navGraph)`. Phase 17 will update the pathfinding engine for cross-floor routing. For Phase 16, the engine's constructor signature takes `NavGraph` — this type shape change means the engine will need at minimum a superficial update to compile (it currently accesses `navGraph.nodes` and `navGraph.edges` at the top level). This is a **downstream impact** to note for the plan: the pathfinding engine must be updated to compile against the new `NavGraph` type even if cross-floor logic is deferred to Phase 17.

### Pattern 9: Image-Serving Endpoint — Claude's Discretion Recommendation

Current endpoint: `GET /api/floor-plan/image` (serves `assets/floor-plan.png` — hardcoded).

**Recommendation:** Add a new parametric endpoint `GET /api/floor-plan/:buildingId/:floorNumber` that reads `floors.image_path` from the database and serves the file relative to `src/server/assets/`. Keep the old `GET /api/floor-plan/image` working (backward compatibility) — it can become an alias for building 1, floor 1.

**File naming convention recommendation:** Use `floor-plan-b{buildingId}-f{floorNumber}.png` stored flat in `src/server/assets/`. Example: `floor-plan-b1-f1.png`. This is flat (no subdirectories), easy to glob, and avoids path separator issues on Windows. The existing `floor-plan.png` file becomes the Floor 1 image; the migration can set `imagePath = 'floor-plan.png'` for the initial floor record and a symlink/copy is unnecessary — the endpoint just reads whatever `floors.image_path` says.

### Anti-Patterns to Avoid

- **Adding `floor_id NOT NULL` in a single ALTER TABLE without back-fill first:** PostgreSQL rejects adding a NOT NULL column to a populated table without a DEFAULT. Must add nullable, back-fill, then set NOT NULL.
- **Using `integer` for `connectsToNodeAboveId` / `connectsToNodeBelowId`:** Node IDs are `text` primary keys (e.g., `"room-204"`). These FK columns must also be `text`.
- **Dropping `floor` column before adding `floor_id`:** The migration must add and populate `floor_id` before dropping the old `floor` column. Reversing this order causes a data loss window.
- **Nesting edges at the floor level in the seed JSON but emitting them flat in the API response:** Keep edges at the floor level consistently — both in the seed and in the API response shape. Phase 17 pathfinding needs to know which floor an edge belongs to for cross-floor routing.
- **Forgetting to update `POST /api/admin/graph`:** This endpoint does a full replace of the graph. It currently handles `graphMetadata`. After Phase 16 it must handle the new `NavGraph` shape. Leaving it unupdated will break the admin editor.
- **Using the drizzle-kit generated SQL as-is without adding DML:** drizzle-kit generates DDL only. The back-fill UPDATE and INSERT seed rows must be manually added to the migration file.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Self-referential FK type inference | Custom type casting | `AnyPgColumn` from `drizzle-orm/pg-core` | TypeScript circular inference requires this specific escape hatch; hand-rolling causes incorrect inferred types |
| Getting inserted serial IDs back | SELECT after INSERT | `.returning()` in Drizzle insert | Atomic — avoids race condition between INSERT and SELECT; Drizzle's `.returning()` maps directly to PostgreSQL RETURNING clause |
| Migration file generation | Hand-write full SQL diff | `drizzle-kit generate` then manually add DML | drizzle-kit handles the snapshot diffing and constraint ordering; only the data back-fill lines need manual addition |

---

## Common Pitfalls

### Pitfall 1: NOT NULL column added to populated table without DEFAULT

**What goes wrong:** `ALTER TABLE "nodes" ADD COLUMN "floor_id" integer NOT NULL` fails with `ERROR: column "floor_id" of relation "nodes" contains null values` when rows already exist.
**Why it happens:** PostgreSQL enforces NOT NULL immediately; existing rows get NULL which violates the constraint.
**How to avoid:** Add column without NOT NULL, run UPDATE to back-fill, then `ALTER COLUMN SET NOT NULL`. This is the standard pattern for zero-downtime migrations.
**Warning signs:** Migration SQL file adds `floor_id integer NOT NULL` in a single statement without a DEFAULT or subsequent UPDATE.

### Pitfall 2: Self-referential FK using wrong type

**What goes wrong:** `connectsToNodeAboveId: integer('connects_to_node_above_id')` — using `integer` for a FK that points to `nodes.id` which is `text`.
**Why it happens:** Reflex to use `integer` for FK columns (because `floors.id` is `serial`/integer). `nodes.id` is `text`, not serial.
**How to avoid:** Match the FK column type to the referenced column type: `nodes.id` is `text('id').primaryKey()`, so `connectsToNodeAboveId` must be `text(...)`.
**Warning signs:** TypeScript compile error in schema.ts, or PostgreSQL error `foreign key constraint ... is of incompatible type`.

### Pitfall 3: Seed.ts reading old flat NavGraph format

**What goes wrong:** After updating `campus-graph.json` to the nested multi-floor format, the old `seedIfEmpty()` tries to read `graph.nodes` and `graph.edges` at the top level — both are `undefined`. All 0 nodes get inserted, and subsequent `GET /api/map` returns empty data.
**Why it happens:** `seed.ts` is updated after the JSON but the destructuring path is wrong.
**How to avoid:** Update `campus-graph.json` and `seed.ts` together in the same plan task. Verify the seed produces the correct node count (48) on first run.
**Warning signs:** Server log shows `[seed] Inserted 0 nodes, 0 edges` instead of 48.

### Pitfall 4: GET /api/map returns old flat NavGraph shape while client expects new shape

**What goes wrong:** After updating `NavGraph` type in `types.ts`, the `GET /api/map` handler still builds the old `{ nodes, edges, metadata }` shape. TypeScript catches this if the return type is explicitly typed; if not, it compiles but the client gets the wrong shape at runtime.
**Why it happens:** `index.ts` has the graph assembly code that's easy to miss when updating types.
**How to avoid:** Explicitly type the `graph` constant in `GET /api/map` as `NavGraph` so TypeScript enforces the new shape:
```typescript
const graph: NavGraph = { buildings: [...] }
```
**Warning signs:** TypeScript error in `index.ts`, or client-side errors when trying to iterate `navGraph.buildings`.

### Pitfall 5: Forgetting POST /api/admin/graph receives and saves NavGraph

**What goes wrong:** The admin editor still sends the old `{ nodes, edges, metadata }` shape. `POST /api/admin/graph` tries to read `graph.nodes` and `graph.edges` directly — they're undefined on the new shape. The save operation inserts 0 nodes.
**Why it happens:** `POST /api/admin/graph` is less visible than `GET /api/map` — it's only exercised by the admin UI, not the student view.
**How to avoid:** Include `POST /api/admin/graph` in the same plan task that updates `GET /api/map`. Both handlers must change together.
**Warning signs:** Admin save operation returns `{ ok: true }` but database is empty afterward.

### Pitfall 6: Pathfinding engine does not compile after NavGraph type change

**What goes wrong:** `src/shared/pathfinding/engine.ts` calls `buildGraph(navGraph)` which calls `graph-builder.ts` which iterates `navGraph.nodes` and `navGraph.edges`. After the type change, these top-level arrays no longer exist on `NavGraph`. TypeScript errors prevent the build.
**Why it happens:** The pathfinding engine is a downstream consumer of `NavGraph` that is easy to overlook in a schema-focused phase.
**How to avoid:** After updating `NavGraph` in `types.ts`, check `src/shared/pathfinding/graph-builder.ts` and `engine.ts` for usages of `navGraph.nodes` and `navGraph.edges`. A minimal shim that flattens the multi-floor structure into the flat arrays these functions expect is sufficient for Phase 16 — the real cross-floor logic comes in Phase 17.
**Warning signs:** `tsc --noEmit` fails in CI with errors in `graph-builder.ts`.

### Pitfall 7: drizzle-kit snapshot drift — schema.ts and generated SQL out of sync

**What goes wrong:** Developer edits `schema.ts`, then manually edits the generated SQL rather than re-running `drizzle-kit generate`. The `drizzle/meta/*.json` snapshot no longer matches the actual SQL. Future `drizzle-kit generate` calls produce incorrect diffs.
**Why it happens:** The data back-fill DML tempts developers to edit the SQL file first rather than letting drizzle-kit generate it.
**How to avoid:** Always run `drizzle-kit generate` after finishing `schema.ts` edits. Then append the hand-written DML (INSERT seed, UPDATE back-fill) to the bottom of the generated SQL file without touching the DDL drizzle-kit generated.
**Warning signs:** `drizzle-kit generate` on the next schema change produces a migration that tries to recreate tables that already exist.

---

## Code Examples

Verified patterns from official sources and existing codebase:

### Drizzle `.returning()` after INSERT

```typescript
// Source: drizzle-orm-docs — used to get auto-generated serial IDs
const [inserted] = await db
  .insert(buildings)
  .values({ name: 'Main Building' })
  .returning({ id: buildings.id })
// inserted.id is the generated serial value
```

### AnyPgColumn for self-referential FK

```typescript
// Source: https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/indexes-constraints.mdx
import type { AnyPgColumn } from 'drizzle-orm/pg-core'
import { text, pgTable } from 'drizzle-orm/pg-core'

export const nodes = pgTable('nodes', {
  id: text('id').primaryKey(),
  connectsToNodeAboveId: text('connects_to_node_above_id')
    .references((): AnyPgColumn => nodes.id),
  connectsToNodeBelowId: text('connects_to_node_below_id')
    .references((): AnyPgColumn => nodes.id),
})
```

### Full updated schema.ts structure (target state)

```typescript
// src/server/db/schema.ts — target state after Phase 16
import type { AnyPgColumn } from 'drizzle-orm/pg-core'
import { boolean, integer, pgTable, real, serial, text } from 'drizzle-orm/pg-core'

export const buildings = pgTable('buildings', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
})

export const floors = pgTable('floors', {
  id: serial('id').primaryKey(),
  buildingId: integer('building_id').notNull().references(() => buildings.id),
  floorNumber: integer('floor_number').notNull(),
  imagePath: text('image_path').notNull(),
  updatedAt: text('updated_at').notNull(), // ISO 8601 — consistent with existing text convention
})

export const nodes = pgTable('nodes', {
  id: text('id').primaryKey(),
  x: real('x').notNull(),
  y: real('y').notNull(),
  label: text('label').notNull(),
  type: text('type').notNull(),
  searchable: boolean('searchable').notNull(),
  floorId: integer('floor_id').notNull().references(() => floors.id), // replaces: floor integer
  // buildingName column REMOVED — derived via floor → building join
  roomNumber: text('room_number'),
  description: text('description'),
  accessibilityNotes: text('accessibility_notes'),
  // Floor connector linkage — nullable on non-connector nodes
  connectsToFloorAboveId: integer('connects_to_floor_above_id').references(() => floors.id),
  connectsToFloorBelowId: integer('connects_to_floor_below_id').references(() => floors.id),
  connectsToNodeAboveId: text('connects_to_node_above_id').references((): AnyPgColumn => nodes.id),
  connectsToNodeBelowId: text('connects_to_node_below_id').references((): AnyPgColumn => nodes.id),
})

export const edges = pgTable('edges', {
  // Unchanged from Phase 15
  id: text('id').primaryKey(),
  sourceId: text('source_id').notNull(),
  targetId: text('target_id').notNull(),
  standardWeight: real('standard_weight').notNull(),
  accessibleWeight: real('accessible_weight').notNull(),
  accessible: boolean('accessible').notNull(),
  bidirectional: boolean('bidirectional').notNull(),
  accessibilityNotes: text('accessibility_notes'),
})

// graphMetadata table REMOVED — replaced by floors.updated_at
```

### Pathfinding engine shim — flatten multi-floor NavGraph for Phase 16 compatibility

```typescript
// In src/shared/pathfinding/graph-builder.ts or engine.ts
// Minimal shim to keep Phase 16 compiling without full Phase 17 cross-floor logic

function flattenNavGraph(navGraph: NavGraph): { nodes: NavNode[]; edges: NavEdge[] } {
  const nodes: NavNode[] = []
  const edges: NavEdge[] = []
  for (const building of navGraph.buildings) {
    for (const floor of building.floors) {
      nodes.push(...floor.nodes)
      edges.push(...floor.edges)
    }
  }
  return { nodes, edges }
}
```

This shim lets the engine continue to work single-floor while Phase 17 extends it properly.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `graphMetadata` table for building/floor context | `floors` table with `updated_at`; building context in `buildings` table | Phase 16 | Removes artificial metadata table; floor context now first-class |
| `nodes.floor: integer` (flat floor number) | `nodes.floor_id: integer` FK → `floors.id` | Phase 16 | Enables relational join to get floor image path and building name |
| `nodes.buildingName: text` (denormalized) | Building name derived via `node → floor → building` join | Phase 16 | Eliminates data duplication; single source of truth |
| `NavGraph = { nodes, edges, metadata }` (flat) | `NavGraph = { buildings: [{ floors: [{ nodes, edges }] }] }` (nested) | Phase 16 | Enables Phase 17 cross-floor pathfinding; Phase 19 floor tab UI |

**No deprecated libraries:** All libraries in use are current as of 2026-03-01. drizzle-orm 0.45.x is actively maintained.

---

## Open Questions

1. **Edges — which floor do they belong to?**
   - What we know: The current schema has no `floor_id` on edges. All 48 nodes are Floor 1 and all edges connect Floor 1 nodes, so for Phase 16 this is fine.
   - What's unclear: When Phase 17 adds cross-floor edges (connecting a stair node on Floor 1 to a stair node on Floor 2), where do those edges live in the `NavGraph` structure? They span two floors.
   - Recommendation: For Phase 16, nest edges under the floor that contains their source node. Document this assumption clearly. Phase 17 will need to decide how to represent cross-floor edges — likely a separate `crossFloorEdges` array at the building level, but that is Phase 17's concern.

2. **Edges table — no `floor_id` column on edges?**
   - What we know: The CONTEXT.md makes no mention of adding `floor_id` to `edges`. Edges connect nodes; nodes now have `floor_id`.
   - What's unclear: Should edges have an explicit `floor_id` column for query efficiency, or is the floor derivable from source/target node?
   - Recommendation: Skip adding `floor_id` to `edges` in Phase 16. It is derivable via `sourceId → nodes.floor_id`. Phase 17 can add it if query performance requires it.

3. **`updated_at` column type — `text` vs `timestamp`?**
   - What we know: Existing codebase uses `text` for `graphMetadata.lastUpdated` (ISO 8601 string). This is a project convention.
   - What's unclear: The schema would benefit from `timestamp with time zone` for proper PostgreSQL semantics, but switching conventions mid-project adds inconsistency.
   - Recommendation: Keep `text` for `floors.updated_at` to match the existing project convention. Document the field as ISO 8601. A global convention change can be a separate cleanup phase.

---

## Validation Architecture

> `workflow.nyquist_validation` is not present in `.planning/config.json` — skip this section.

*(Config file has keys: mode, depth, parallelization, commit_docs, model_profile, workflow.research, workflow.plan_check, workflow.verifier — no `nyquist_validation` key. Section skipped.)*

---

## Sources

### Primary (HIGH confidence)
- `/drizzle-team/drizzle-orm-docs` (Context7) — self-referential FK pattern with `AnyPgColumn`, `.returning()` after INSERT, `drizzle-kit generate` workflow, nullable FK columns
- `src/server/db/schema.ts` (project file, direct read) — exact current column definitions, types, and imports
- `src/shared/types.ts` (project file, direct read) — exact current `NavGraph`, `NavNodeData`, `NavNode` shape
- `src/server/db/seed.ts` (project file, direct read) — exact current seeder logic and `campus-graph.json` consumption pattern
- `src/server/index.ts` (project file, direct read) — exact current `GET /api/map` and `POST /api/admin/graph` handler implementations
- `drizzle/0000_romantic_abomination.sql` (project file, direct read) — current migration state; confirms PostgreSQL DDL syntax in use
- `package.json` (project file, direct read) — exact library versions: drizzle-orm 0.45.1, drizzle-kit 0.31.9, postgres 3.4.8

### Secondary (MEDIUM confidence)
- PostgreSQL documentation behavior: NOT NULL constraint on ALTER TABLE with existing rows — well-known behavior, verified by drizzle-kit migration patterns showing DEFAULT or two-step approach

### Tertiary (LOW confidence)
- None — all findings verified against project files or Context7

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in project; versions confirmed from package.json
- Architecture: HIGH — schema patterns verified via Context7 drizzle-orm docs; migration pattern verified via existing drizzle SQL file; current code fully read
- Pitfalls: HIGH — derived from direct inspection of existing code paths that will break; PostgreSQL NOT NULL behavior is well-known

**Research date:** 2026-03-01
**Valid until:** 2026-04-01 (drizzle-orm is stable; 30-day window)
