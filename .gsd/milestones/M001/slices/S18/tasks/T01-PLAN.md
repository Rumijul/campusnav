---
phase: 16-multi-floor-data-model
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/server/db/schema.ts
  - drizzle/0001_multi_floor.sql
autonomous: true
requirements:
  - MFLR-01
  - MFLR-02
  - CAMP-01

must_haves:
  truths:
    - "buildings and floors tables exist in PostgreSQL with correct FK relationships"
    - "nodes table has floor_id FK replacing flat floor integer column, and four nullable connector linkage FK columns"
    - "graphMetadata table is dropped and replaced by floors.updated_at"
    - "The migration SQL runs atomically: creates tables, back-fills floor_id for all 48 existing nodes, then applies NOT NULL constraint"
  artifacts:
    - path: "src/server/db/schema.ts"
      provides: "Drizzle schema definitions for buildings, floors, nodes (modified), edges (unchanged)"
      contains: "buildings pgTable, floors pgTable, AnyPgColumn import, floorId FK on nodes, four connector FK columns"
    - path: "drizzle/0001_multi_floor.sql"
      provides: "Atomic data migration from single-floor to multi-floor schema"
      contains: "CREATE TABLE buildings, CREATE TABLE floors, INSERT seed rows, ALTER TABLE nodes (add columns, UPDATE back-fill, SET NOT NULL, ADD CONSTRAINTS, DROP old columns), DROP TABLE graph_metadata"
  key_links:
    - from: "src/server/db/schema.ts"
      to: "drizzle/0001_multi_floor.sql"
      via: "drizzle-kit generate reads schema.ts snapshot to produce SQL diff"
      pattern: "npx drizzle-kit generate"
    - from: "nodes.floor_id"
      to: "floors.id"
      via: "FK constraint added after back-fill UPDATE"
      pattern: "FOREIGN KEY.*floor_id.*REFERENCES.*floors"
    - from: "nodes.connects_to_node_above_id"
      to: "nodes.id"
      via: "Self-referential FK using AnyPgColumn pattern"
      pattern: "AnyPgColumn.*nodes\\.id"
---

<objective>
Update the Drizzle schema and generate + hand-edit the migration SQL to introduce the multi-floor relational model.

Purpose: Creates the database foundation that MFLR-01, MFLR-02, and CAMP-01 require — buildings and floors as first-class entities, nodes linked to floors via FK instead of a flat integer, and floor connector linkage columns.

Output:
- `src/server/db/schema.ts` — updated with buildings, floors tables; nodes modified; graphMetadata removed
- `drizzle/0001_multi_floor.sql` — atomic migration that transforms the live database without data loss
</objective>

<execution_context>
@C:/Users/admin/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/admin/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md
@.planning/phases/16-multi-floor-data-model/16-CONTEXT.md
@.planning/phases/16-multi-floor-data-model/16-RESEARCH.md

<interfaces>
<!-- Current schema.ts — what is being replaced -->
From src/server/db/schema.ts (CURRENT STATE):
```typescript
import { boolean, integer, pgTable, real, serial, text } from 'drizzle-orm/pg-core'

export const nodes = pgTable('nodes', {
  id: text('id').primaryKey(),
  x: real('x').notNull(),
  y: real('y').notNull(),
  label: text('label').notNull(),
  type: text('type').notNull(),
  searchable: boolean('searchable').notNull(),
  floor: integer('floor').notNull(),      // <-- being replaced by floor_id FK
  roomNumber: text('room_number'),
  description: text('description'),
  buildingName: text('building_name'),    // <-- being removed
  accessibilityNotes: text('accessibility_notes'),
})

export const edges = pgTable('edges', {   // <-- UNCHANGED
  id: text('id').primaryKey(),
  sourceId: text('source_id').notNull(),
  targetId: text('target_id').notNull(),
  standardWeight: real('standard_weight').notNull(),
  accessibleWeight: real('accessible_weight').notNull(),
  accessible: boolean('accessible').notNull(),
  bidirectional: boolean('bidirectional').notNull(),
  accessibilityNotes: text('accessibility_notes'),
})

export const graphMetadata = pgTable('graph_metadata', {  // <-- being DROPPED
  id: serial('id').primaryKey(),
  buildingName: text('building_name').notNull(),
  floor: integer('floor').notNull(),
  lastUpdated: text('last_updated').notNull(),
})
```

<!-- Current migration file for reference on PostgreSQL DDL syntax in use -->
From drizzle/0000_romantic_abomination.sql (existing migration baseline):
```sql
CREATE TABLE "edges" (...);
CREATE TABLE "graph_metadata" (...);
CREATE TABLE "nodes" (...);
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Update schema.ts — add buildings and floors tables, modify nodes, remove graphMetadata</name>
  <files>src/server/db/schema.ts</files>
  <action>
Rewrite src/server/db/schema.ts to reflect the multi-floor schema. The target state is documented in RESEARCH.md "Full updated schema.ts structure (target state)".

Exact changes required:

1. **Add import** for `AnyPgColumn` from `drizzle-orm/pg-core`:
   ```typescript
   import type { AnyPgColumn } from 'drizzle-orm/pg-core'
   import { boolean, integer, pgTable, real, serial, text } from 'drizzle-orm/pg-core'
   ```

2. **Add `buildings` table** (new, before floors):
   ```typescript
   export const buildings = pgTable('buildings', {
     id: serial('id').primaryKey(),
     name: text('name').notNull(),
   })
   ```

3. **Add `floors` table** (new, after buildings):
   ```typescript
   export const floors = pgTable('floors', {
     id: serial('id').primaryKey(),
     buildingId: integer('building_id').notNull().references(() => buildings.id),
     floorNumber: integer('floor_number').notNull(),
     imagePath: text('image_path').notNull(),
     updatedAt: text('updated_at').notNull(), // ISO 8601 string — matches project text convention
   })
   ```

4. **Modify `nodes` table** — replace `floor` + `buildingName` with new FK columns and four connector linkage columns:
   ```typescript
   export const nodes = pgTable('nodes', {
     id: text('id').primaryKey(),
     x: real('x').notNull(),
     y: real('y').notNull(),
     label: text('label').notNull(),
     type: text('type').notNull(),
     searchable: boolean('searchable').notNull(),
     floorId: integer('floor_id').notNull().references(() => floors.id),
     // buildingName REMOVED — derived via floor → building join
     roomNumber: text('room_number'),
     description: text('description'),
     accessibilityNotes: text('accessibility_notes'),
     // Floor connector linkage — nullable on all non-connector nodes
     connectsToFloorAboveId: integer('connects_to_floor_above_id').references(() => floors.id),
     connectsToFloorBelowId: integer('connects_to_floor_below_id').references(() => floors.id),
     connectsToNodeAboveId: text('connects_to_node_above_id').references((): AnyPgColumn => nodes.id),
     connectsToNodeBelowId: text('connects_to_node_below_id').references((): AnyPgColumn => nodes.id),
   })
   ```
   CRITICAL: `connectsToNodeAboveId` and `connectsToNodeBelowId` must be `text` (not `integer`) because `nodes.id` is a `text` primary key.

5. **Keep `edges` table UNCHANGED** — do not touch it.

6. **Remove `graphMetadata` table entirely** — delete the export. The `floors.updatedAt` column replaces it.

After writing schema.ts, verify it compiles (no TypeScript errors) by checking imports resolve correctly. The self-referential FK pattern `references((): AnyPgColumn => nodes.id)` is required to break circular type inference — do not simplify it.
  </action>
  <verify>
    <automated>cd C:/Users/admin/Desktop/projects/campusnav && npx tsc --noEmit --project tsconfig.json 2>&1 | grep "schema.ts" || echo "schema.ts: no type errors"</automated>
  </verify>
  <done>schema.ts exports buildings, floors, nodes (with floorId FK and four connector columns), edges (unchanged). graphMetadata export is gone. File compiles without TypeScript errors.</done>
</task>

<task type="auto">
  <name>Task 2: Generate migration SQL and hand-edit to add data back-fill</name>
  <files>drizzle/0001_multi_floor.sql</files>
  <action>
Run drizzle-kit generate to produce the SQL diff from the schema.ts changes, then hand-edit the generated file to add the data back-fill DML that drizzle-kit cannot infer.

**Step 1 — Generate:**
```bash
cd C:/Users/admin/Desktop/projects/campusnav
npx drizzle-kit generate --name=multi_floor
```
This produces `drizzle/0001_multi_floor.sql`. Review the generated DDL to confirm it contains CREATE TABLE for buildings and floors, and ALTER TABLE for nodes.

**Step 2 — Hand-edit the generated file:**

The generated SQL will have the DDL (CREATE TABLE, ALTER TABLE, ADD CONSTRAINT, DROP COLUMN, DROP TABLE). It will NOT have the data DML (INSERT, UPDATE). The migration must back-fill `floor_id` for the 48 existing nodes before applying the NOT NULL constraint.

Edit the generated SQL file to produce a migration that executes in this safe order:

```sql
--> statement-breakpoint
-- Step 1: Create buildings table
CREATE TABLE "buildings" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL
);
--> statement-breakpoint

-- Step 2: Create floors table
CREATE TABLE "floors" (
  "id" serial PRIMARY KEY NOT NULL,
  "building_id" integer NOT NULL,
  "floor_number" integer NOT NULL,
  "image_path" text NOT NULL,
  "updated_at" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "floors" ADD CONSTRAINT "floors_building_id_fk" FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint

-- Step 3: Insert initial data (before FK constraints on nodes)
INSERT INTO "buildings" ("name") VALUES ('Main Building');
INSERT INTO "floors" ("building_id", "floor_number", "image_path", "updated_at")
  VALUES (1, 1, 'floor-plan.png', to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'));
--> statement-breakpoint

-- Step 4: Add new columns to nodes (nullable first, for back-fill)
ALTER TABLE "nodes"
  ADD COLUMN "floor_id" integer,
  ADD COLUMN "connects_to_floor_above_id" integer,
  ADD COLUMN "connects_to_floor_below_id" integer,
  ADD COLUMN "connects_to_node_above_id" text,
  ADD COLUMN "connects_to_node_below_id" text;
--> statement-breakpoint

-- Step 5: Back-fill floor_id for all existing nodes (all belong to Floor 1)
UPDATE "nodes" SET "floor_id" = 1;
--> statement-breakpoint

-- Step 6: Apply NOT NULL constraint now that all rows are populated
ALTER TABLE "nodes" ALTER COLUMN "floor_id" SET NOT NULL;
--> statement-breakpoint

-- Step 7: Add FK constraints
ALTER TABLE "nodes"
  ADD CONSTRAINT "nodes_floor_id_fk" FOREIGN KEY ("floor_id") REFERENCES "floors"("id") ON DELETE no action ON UPDATE no action,
  ADD CONSTRAINT "nodes_connects_to_floor_above_id_fk" FOREIGN KEY ("connects_to_floor_above_id") REFERENCES "floors"("id") ON DELETE no action ON UPDATE no action,
  ADD CONSTRAINT "nodes_connects_to_floor_below_id_fk" FOREIGN KEY ("connects_to_floor_below_id") REFERENCES "floors"("id") ON DELETE no action ON UPDATE no action,
  ADD CONSTRAINT "nodes_connects_to_node_above_id_fk" FOREIGN KEY ("connects_to_node_above_id") REFERENCES "nodes"("id") ON DELETE no action ON UPDATE no action,
  ADD CONSTRAINT "nodes_connects_to_node_below_id_fk" FOREIGN KEY ("connects_to_node_below_id") REFERENCES "nodes"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint

-- Step 8: Drop old columns from nodes
ALTER TABLE "nodes"
  DROP COLUMN "floor",
  DROP COLUMN "building_name";
--> statement-breakpoint

-- Step 9: Drop graphMetadata table (replaced by floors.updated_at)
DROP TABLE "graph_metadata";
```

IMPORTANT notes:
- The generated SQL from drizzle-kit may differ in exact constraint names or order. Use the generated DDL as the base and APPEND/REORDER the DML steps (INSERT and UPDATE lines) in the correct positions.
- Do NOT discard the drizzle-kit generated metadata files in `drizzle/meta/` — they must stay in sync with the SQL for future `drizzle-kit generate` runs.
- The `updated_at` ISO string uses `to_char(now() AT TIME ZONE 'UTC', ...)` which produces a valid ISO 8601 string without requiring a timestamp column type.
- If drizzle-kit produces different constraint name conventions, keep the generated names and just add the INSERT/UPDATE DML in the correct positions.

**Anti-pattern to avoid:** Do NOT add `NOT NULL` to `floor_id` in the same ALTER TABLE statement that adds the column. PostgreSQL will reject it because existing rows would violate the constraint. The pattern must be: ADD COLUMN (nullable) → UPDATE back-fill → ALTER COLUMN SET NOT NULL → ADD CONSTRAINT.
  </action>
  <verify>
    <automated>ls C:/Users/admin/Desktop/projects/campusnav/drizzle/0001_multi_floor.sql && grep -c "INSERT INTO" C:/Users/admin/Desktop/projects/campusnav/drizzle/0001_multi_floor.sql && grep "UPDATE.*nodes.*SET.*floor_id" C:/Users/admin/Desktop/projects/campusnav/drizzle/0001_multi_floor.sql</automated>
  </verify>
  <done>drizzle/0001_multi_floor.sql exists, contains at least 2 INSERT INTO statements (buildings + floors seed), and contains the UPDATE back-fill for floor_id. The drizzle/meta/ snapshot files are updated by drizzle-kit generate.</done>
</task>

</tasks>

<verification>
After both tasks complete:
1. `npx tsc --noEmit` passes with no errors in schema.ts
2. `drizzle/0001_multi_floor.sql` exists and contains: `CREATE TABLE "buildings"`, `CREATE TABLE "floors"`, `INSERT INTO "buildings"`, `INSERT INTO "floors"`, `UPDATE "nodes" SET "floor_id" = 1`, `ALTER COLUMN "floor_id" SET NOT NULL`, `DROP TABLE "graph_metadata"`
3. The migration SQL drops the old `floor` and `building_name` columns from nodes
4. Self-referential FK columns (`connects_to_node_above_id`, `connects_to_node_below_id`) are `text` type matching `nodes.id`
</verification>

<success_criteria>
- schema.ts: exports buildings, floors, modified nodes, unchanged edges; no graphMetadata
- Migration SQL: handles full schema transition atomically with correct back-fill order
- No TypeScript compilation errors in schema.ts
- drizzle/meta/ snapshot matches the new schema.ts state
</success_criteria>

<output>
After completion, create `.planning/phases/16-multi-floor-data-model/16-01-SUMMARY.md` documenting:
- Exact schema.ts column definitions for buildings, floors, and modified nodes
- Final migration SQL structure (steps and key DML lines)
- Any deviations from planned approach and why
</output>
