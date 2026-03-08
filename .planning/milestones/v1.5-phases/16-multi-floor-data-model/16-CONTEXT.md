# Phase 16: Multi-floor Data Model - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Extend the database schema and shared TypeScript types to support multi-floor buildings and multi-building campuses. Each floor becomes a first-class DB entity with its own floor plan image reference. Floor connector nodes (stairs/elevator/ramp) gain cross-floor linkage metadata pointing to specific counterpart nodes on connected floors. Creating/editing floors via admin UI and cross-floor pathfinding are separate phases (18 and 17 respectively).

</domain>

<decisions>
## Implementation Decisions

### Schema design
- Relational approach: add `buildings(id, name)` and `floors(id, building_id, floor_number, image_path)` tables with proper FK relationships
- Buildings table: minimal — id + name only (description/address deferred to a later phase)
- Floors table: `building_id` (FK → buildings), `floor_number` (1-based integer), `image_path` (string)
- Nodes: replace the flat `floor` integer column with a `floor_id` FK referencing `floors.id`; remove flat `buildingName` column (building is now derived transitively via floor → building)

### Floor connector linkage
- Extra columns on the `nodes` table (not a separate table, not JSON)
- `connects_to_floor_above_id` (nullable FK → floors.id) — which floor this connector reaches going up
- `connects_to_floor_below_id` (nullable FK → floors.id) — which floor this connector reaches going down
- `connects_to_node_above_id` (nullable FK → nodes.id) — specific counterpart node on the floor above
- `connects_to_node_below_id` (nullable FK → nodes.id) — specific counterpart node on the floor below
- Only applies to nodes of type `stairs`, `elevator`, `ramp`; nullable on all other node types

### Floor plan image storage
- Claude's Discretion: file naming convention and directory structure for per-floor images
- `floors.image_path` stores a path/filename string; server resolves the actual file relative to `src/server/assets/`
- API endpoint shape for serving per-floor images is Claude's Discretion (backward-compatible approach preferred)
- No thumbnail storage in Phase 16 — skip thumbnails until Phase 18/19 when needed

### Migration strategy
- Drizzle migration script (not wipe-and-reseed): creates `buildings` + `floors` tables, inserts "Main Building" + Floor 1, then updates all 48 existing nodes to have `floor_id` pointing to the new Floor 1 record
- Drop `graphMetadata` table — `floors` table replaces it entirely; add `updated_at` column to `floors`
- Update `campus-graph.json` seed file format to multi-floor: `buildings: [{ id, name, floors: [{ floor_number, image_path, nodes, edges }] }]`
- Update `NavGraph` TypeScript type and `NavNode` to reflect the new multi-floor seed structure

### Claude's Discretion
- File naming convention for per-floor floor plan images (e.g., `floor-plan-{building_id}-{floor_number}.png` or subdirectory)
- API endpoint design for serving per-floor images (backward-compatible with existing client calls preferred)
- How `buildingName` is handled in `NavNodeData` type — derived via join vs kept as a convenience field

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/server/db/schema.ts`: Current schema uses `nodes`, `edges`, `graphMetadata` tables — all need modification
- `src/shared/types.ts`: `NavNodeData`, `NavNode`, `NavGraph`, `NavEdgeData` types — need multi-floor variants
- `src/server/db/seed.ts`: `seedIfEmpty()` reads `campus-graph.json`, inserts nodes/edges/metadata — needs updating for multi-floor seed format
- `src/server/assets/campus-graph.json`: Current single-floor seed (48 nodes, floor: 1, "Main Building") — format to be updated

### Established Patterns
- Drizzle ORM with `pgTable`, `text`, `integer`, `real`, `boolean`, `serial` — same tools for new tables
- `db.select().from(table)` pattern for reads; `db.insert(table).values(...)` for writes
- Node IDs are text strings (e.g., "room-204", "entrance-main"); edge IDs follow same convention
- `floor: number` already exists on `NavNodeData` — this column is being replaced by `floor_id` FK

### Integration Points
- `GET /api/map` (src/server/index.ts:74) — returns `NavGraph`; must be updated to include floor/building context
- `POST /api/admin/graph` (src/server/index.ts:134) — saves entire graph; must handle new schema
- `src/shared/pathfinding/engine.ts` — reads `NavGraph`; Phase 17 will extend this for cross-floor routing
- `src/client/hooks/useGraphData.ts` — fetches NavGraph from API; may need floor selection parameter in Phase 19

</code_context>

<specifics>
## Specific Ideas

- No specific UX references for this phase — it is purely a data layer (schema + types + seed)
- The multi-floor seed format should nest floors under buildings: `{ buildings: [{ id, name, floors: [{ floor_number, image_path, nodes: [...], edges: [...] }] }] }`

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 16-multi-floor-data-model*
*Context gathered: 2026-03-01*
