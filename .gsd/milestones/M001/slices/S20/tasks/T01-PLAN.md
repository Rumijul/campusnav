---
phase: 18-admin-multi-floor-editor
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/server/db/schema.ts
  - src/shared/types.ts
  - drizzle/0002_campus_entrance_bridge.sql
autonomous: true
requirements:
  - MFLR-04
  - CAMP-02
  - CAMP-03
  - CAMP-04

must_haves:
  truths:
    - "nodes table has connects_to_building_id nullable integer column in DB schema"
    - "NavNodeData TypeScript interface includes optional connectsToBuildingId field"
    - "GET /api/map response includes connectsToBuildingId on nodes that have it set"
    - "Drizzle migration SQL file exists and runs without error on server startup"
  artifacts:
    - path: "src/server/db/schema.ts"
      provides: "Drizzle schema with connectsToBuildingId on nodes table"
      contains: "connectsToBuildingId"
    - path: "src/shared/types.ts"
      provides: "NavNodeData with optional connectsToBuildingId field"
      contains: "connectsToBuildingId"
    - path: "drizzle/0002_campus_entrance_bridge.sql"
      provides: "Migration SQL adding connects_to_building_id column"
      contains: "connects_to_building_id"
  key_links:
    - from: "src/server/db/schema.ts"
      to: "drizzle/0002_campus_entrance_bridge.sql"
      via: "npx drizzle-kit generate"
      pattern: "connectsToBuildingId"
    - from: "src/server/index.ts"
      to: "src/shared/types.ts"
      via: "GET /api/map response includes connectsToBuildingId when non-null"
      pattern: "connectsToBuildingId"
---

<objective>
Lay the foundational data contracts for Phase 18: add the campus-to-building bridge foreign key to the database schema and TypeScript types. This plan creates the interface contracts that all subsequent plans depend on.

Purpose: Campus entrance nodes on the campus map need a FK pointing to which building they bridge to (CAMP-04). This field must be in the DB schema, the shared types, and surfaced through GET /api/map before any UI work begins.

Output: Updated schema.ts with connectsToBuildingId, updated types.ts with the field on NavNodeData, a generated Drizzle migration SQL file, and GET /api/map updated to pass the field through.
</objective>

<execution_context>
@C:/Users/admin/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/admin/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/18-admin-multi-floor-editor/18-CONTEXT.md
@.planning/phases/18-admin-multi-floor-editor/18-RESEARCH.md

<interfaces>
<!-- Key types and contracts the executor needs. Extracted from codebase. -->

From src/server/db/schema.ts (current):
```typescript
export const nodes = pgTable('nodes', {
  id: text('id').primaryKey(),
  x: real('x').notNull(),
  y: real('y').notNull(),
  label: text('label').notNull(),
  type: text('type').notNull(),
  searchable: boolean('searchable').notNull(),
  floorId: integer('floor_id').notNull().references(() => floors.id),
  roomNumber: text('room_number'),
  description: text('description'),
  accessibilityNotes: text('accessibility_notes'),
  connectsToFloorAboveId: integer('connects_to_floor_above_id').references(() => floors.id),
  connectsToFloorBelowId: integer('connects_to_floor_below_id').references(() => floors.id),
  connectsToNodeAboveId: text('connects_to_node_above_id').references((): AnyPgColumn => nodes.id),
  connectsToNodeBelowId: text('connects_to_node_below_id').references((): AnyPgColumn => nodes.id),
  // ADD: connectsToBuildingId integer nullable references buildings.id
})
```

From src/shared/types.ts (current NavNodeData — add field at end):
```typescript
export interface NavNodeData {
  x: number; y: number; label: string; type: NavNodeType; searchable: boolean; floorId: number
  roomNumber?: string; description?: string; accessibilityNotes?: string
  connectsToFloorAboveId?: number; connectsToFloorBelowId?: number
  connectsToNodeAboveId?: string; connectsToNodeBelowId?: string
  // ADD: connectsToBuildingId?: number
}
```

Existing drizzle migrations: drizzle/0000_romantic_abomination.sql, drizzle/0001_multi_floor.sql
Next migration must be: drizzle/0002_campus_entrance_bridge.sql
</interfaces>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Add connectsToBuildingId to DB schema and types</name>
  <files>src/server/db/schema.ts, src/shared/types.ts</files>
  <action>
    In src/server/db/schema.ts, add connectsToBuildingId as a nullable integer column on the nodes table that references buildings.id:

    ```typescript
    connectsToBuildingId: integer('connects_to_building_id').references(() => buildings.id),
    ```

    Add it after the connectsToNodeBelowId line. The import for AnyPgColumn is already present — no new imports needed. The buildings table is already defined above nodes in the same file.

    In src/shared/types.ts, add the optional field to NavNodeData interface after connectsToNodeBelowId:

    ```typescript
    /** ID of the building this campus entrance marker bridges to (campus map only, entrance nodes) */
    connectsToBuildingId?: number
    ```

    No other changes to types.ts needed — NavNode extends NavNodeData so it automatically inherits the field.
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>schema.ts contains connectsToBuildingId column referencing buildings.id; types.ts NavNodeData has optional connectsToBuildingId?: number; TypeScript compiles without errors</done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Generate Drizzle migration and update GET /api/map</name>
  <files>drizzle/0002_campus_entrance_bridge.sql, src/server/index.ts</files>
  <action>
    Run drizzle-kit generate to produce the migration SQL file:

    ```bash
    npx drizzle-kit generate
    ```

    This produces drizzle/0002_campus_entrance_bridge.sql (or similar auto-named file). The file will contain:
    ```sql
    ALTER TABLE "nodes" ADD COLUMN "connects_to_building_id" integer REFERENCES "buildings"("id");
    ```

    After generating, verify the file exists and contains the ALTER TABLE statement for connects_to_building_id.

    In src/server/index.ts, update the GET /api/map handler to include connectsToBuildingId in the node mapping (around line 160, in the nodes map inside the buildings map). Add it to the conditional spread pattern matching existing fields:

    ```typescript
    ...(n.connectsToBuildingId != null && { connectsToBuildingId: n.connectsToBuildingId }),
    ```

    Add this line after the connectsToNodeBelowId spread line. Also update POST /api/admin/graph node insert to include connectsToBuildingId:

    ```typescript
    connectsToBuildingId: n.connectsToBuildingId ?? null,
    ```

    Add after connectsToNodeBelowId in the tx.insert(nodes).values({...}) call (around line 243).
  </action>
  <verify>
    <automated>ls drizzle/0002*.sql && grep -l "connects_to_building_id" drizzle/0002*.sql && npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>drizzle/0002_*.sql exists with connects_to_building_id ALTER TABLE; GET /api/map node mapping includes connectsToBuildingId spread; POST /api/admin/graph insert includes connectsToBuildingId: n.connectsToBuildingId ?? null; TypeScript compiles</done>
</task>

</tasks>

<verification>
After both tasks complete:
1. `npx tsc --noEmit` passes with no errors
2. `ls drizzle/` shows 0002_*.sql file
3. `grep "connects_to_building_id" drizzle/0002_*.sql` returns a match
4. `grep "connectsToBuildingId" src/shared/types.ts` returns a match
5. `grep "connectsToBuildingId" src/server/db/schema.ts` returns a match
</verification>

<success_criteria>
- schema.ts nodes table has connectsToBuildingId integer column referencing buildings.id
- types.ts NavNodeData has optional connectsToBuildingId?: number
- Migration SQL file drizzle/0002_*.sql exists with ALTER TABLE adding connects_to_building_id
- GET /api/map passes connectsToBuildingId through when non-null
- POST /api/admin/graph saves connectsToBuildingId when provided
- TypeScript compiles without errors
</success_criteria>

<output>
After completion, create `.planning/phases/18-admin-multi-floor-editor/18-01-SUMMARY.md`
</output>
