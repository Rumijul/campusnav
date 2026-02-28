---
phase: 04-map-landmarks-location-display
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/shared/types.ts
  - src/server/index.ts
  - src/server/assets/campus-graph.json
autonomous: true
requirements: [MAP-03, MAP-04]

must_haves:
  truths:
    - "GET /api/map returns valid JSON matching NavGraph shape"
    - "NavNodeData has 4 new optional fields: roomNumber, description, buildingName, accessibilityNotes"
    - "campus-graph.json includes 15-30 visible landmark nodes (rooms, entrances, elevators, restrooms, landmarks)"
    - "campus-graph.json includes hidden navigation nodes (junction, hallway, stairs, ramp) to test filtering"
    - "All visible nodes include populated roomNumber/description for detail display"
  artifacts:
    - path: "src/server/assets/campus-graph.json"
      provides: "Test NavGraph fixture with 15-30 landmarks + hidden nav nodes"
      contains: "nodes"
    - path: "src/shared/types.ts"
      provides: "Extended NavNodeData with display fields"
      exports: ["NavNodeData", "NavNode", "NavGraph", "NavNodeType"]
    - path: "src/server/index.ts"
      provides: "GET /api/map route serving campus-graph.json"
      contains: "api/map"
  key_links:
    - from: "src/server/index.ts"
      to: "src/server/assets/campus-graph.json"
      via: "readFile in GET /api/map handler"
      pattern: "campus-graph\\.json"
    - from: "src/server/assets/campus-graph.json"
      to: "src/shared/types.ts"
      via: "JSON shape matches NavGraph interface"
      pattern: "nodes.*edges.*metadata"
---

<objective>
Extend the shared NavNodeData type with 4 optional display fields, create a rich 25-node campus-graph.json test fixture, and wire a GET /api/map endpoint on the Hono server.

Purpose: All downstream plans (marker rendering, bottom sheet) depend on these types and data. The API endpoint is the delivery mechanism; the fixture proves MAP-04 filtering works by including hidden nav nodes.

Output: Extended types.ts, campus-graph.json (25 nodes: 18 visible + 7 hidden), working GET /api/map endpoint.
</objective>

<execution_context>
@C:/Users/LENOVO/.config/opencode/get-shit-done/workflows/execute-plan.md
@C:/Users/LENOVO/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@src/shared/types.ts
@src/server/index.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Extend NavNodeData and create campus-graph.json fixture</name>
  <files>src/shared/types.ts, src/server/assets/campus-graph.json</files>
  <action>
**Part A — Extend NavNodeData in src/shared/types.ts:**

Add 4 optional fields to the `NavNodeData` interface, after the existing `floor` field:

```typescript
/** Room/office number identifier (e.g. "204", "A-102") */
roomNumber?: string
/** Human-readable description shown in location detail sheet */
description?: string
/** Building name for multi-building campuses */
buildingName?: string
/** Accessibility information shown in detail sheet */
accessibilityNotes?: string
```

Also update the `NavNodeType` JSDoc comment: the line that says `stairs — navigation waypoint, visible on map but not searchable` should be corrected to: `stairs — stairwell navigation waypoint, HIDDEN from student map (routing infrastructure only)`. Move `stairs` to the "Invisible to students" section. Also move `ramp` to the "Invisible to students" section and remove it from the "Visible to students" section (per CONTEXT.md: ramps are hidden from student view — they exist for routing only).

**Part B — Create src/server/assets/campus-graph.json:**

Create a 25-node NavGraph fixture representing a single-floor campus building. The fixture MUST:
- Have exactly 25 nodes and edges connecting them as a plausible floor plan graph
- Include these **18 visible nodes** (type in VISIBLE_NODE_TYPES):
  - 5× `room` nodes: CS Lab (room-cs-lab), Lecture Hall A (room-lecture-a), Lecture Hall B (room-lecture-b), Faculty Office 204 (room-office-204), Faculty Office 205 (room-office-205)
  - 2× `entrance` nodes: Main Entrance (entrance-main), Side Entrance (entrance-side)
  - 2× `elevator` nodes: Elevator North (elevator-north), Elevator South (elevator-south)
  - 3× `restroom` nodes: Restroom Male (restroom-male), Restroom Female (restroom-female), Restroom Accessible (restroom-accessible)
  - 3× `landmark` nodes: Cafeteria (landmark-cafeteria), Library (landmark-library), Info Desk (landmark-info-desk)
  - 3× `room` nodes for extras: Student Lounge (room-lounge), Print Room (room-print), Storage Room (room-storage)
- Include these **7 hidden navigation nodes** (type in HIDDEN_NODE_TYPES):
  - 3× `junction` nodes: junction-a, junction-b, junction-c
  - 2× `hallway` nodes: hallway-1, hallway-2
  - 1× `stairs` node: stairs-north
  - 1× `ramp` node: ramp-west

All nodes must have:
- `id`: string matching the names above
- `x`, `y`: normalized 0.0–1.0 coordinates that form a plausible floor plan layout
- `label`: human-readable name
- `type`: NavNodeType value
- `searchable`: true for visible nodes, false for hidden
- `floor`: 1 for all nodes

Visible nodes must also include non-empty `roomNumber`, `description`, `buildingName: "Science Building"`, and where applicable `accessibilityNotes`.

Edges: Create ~30 edges connecting nodes in a plausible hallway network. Use realistic `standardWeight` values (0.05–0.3 Euclidean-ish distance), `accessibleWeight` same as standard for flat paths or 1e10 for stairs, `accessible` true/false accordingly, `bidirectional: true` for all edges.

`metadata`: `{ buildingName: "Science Building", floor: 1, lastUpdated: "2026-02-19T00:00:00.000Z" }`
  </action>
  <verify>Run `npx tsc --noEmit` — no TypeScript errors. Check `src/server/assets/campus-graph.json` exists and `node -e "const g = JSON.parse(require('fs').readFileSync('src/server/assets/campus-graph.json','utf8')); console.log('nodes:', g.nodes.length, 'edges:', g.edges.length)"` shows 25 nodes and expected edge count.</verify>
  <done>NavNodeData has 4 new optional fields. campus-graph.json has 25 nodes (18 visible + 7 hidden) with all required fields. TypeScript compiles cleanly.</done>
</task>

<task type="auto">
  <name>Task 2: Add GET /api/map endpoint to Hono server</name>
  <files>src/server/index.ts</files>
  <action>
Add a `GET /api/map` route to `src/server/index.ts`, following the exact same pattern as the existing `/api/floor-plan/image` route.

The route should:
1. Import `NavGraph` from `@shared/types` — it's already imported as a type; ensure the import is `import type { NavGraph }` (already present).
2. Remove the placeholder `_graphTypeCheck` lines (lines 56-57) — the real import now serves the type check purpose.
3. Add the route before `const port = 3001`:

```typescript
/** Serve the navigation graph as JSON for client-side pathfinding and map rendering. */
app.get('/api/map', async (c) => {
  try {
    const filePath = resolve(__dirname, 'assets/campus-graph.json')
    const raw = await readFile(filePath, 'utf-8')
    const graph: NavGraph = JSON.parse(raw)
    c.header('Cache-Control', 'public, max-age=60')
    return c.json(graph)
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException).code
    if (code === 'ENOENT') {
      return c.json({ error: 'Graph data not found' }, 404)
    }
    return c.json({ error: 'Failed to load graph data' }, 500)
  }
})
```

Note: `readFile` already accepts a second `'utf-8'` argument — it's already imported from `node:fs/promises`.
  </action>
  <verify>Start the server with `npm run server` (or `npx tsx src/server/index.ts`) and in a separate terminal run `curl http://localhost:3001/api/map` — response should be JSON with `nodes`, `edges`, `metadata` fields. Then run `npx tsc --noEmit` and `npx biome check .` — both pass clean.</verify>
  <done>GET /api/map returns the full NavGraph JSON. TypeScript and lint pass. Placeholder _graphTypeCheck lines removed.</done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` — zero errors
2. `npx biome check .` — zero errors/warnings
3. `curl http://localhost:3001/api/map` — returns JSON `{ nodes: [...], edges: [...], metadata: {...} }` with 25 nodes
4. `node -e "const g = require('./src/server/assets/campus-graph.json'); const hidden = g.nodes.filter(n => ['junction','hallway','stairs','ramp'].includes(n.type)); const visible = g.nodes.filter(n => !['junction','hallway','stairs','ramp'].includes(n.type)); console.log('visible:', visible.length, 'hidden:', hidden.length)"` — shows visible: 18, hidden: 7
5. `node -e "const g = require('./src/server/assets/campus-graph.json'); const missing = g.nodes.filter(n => !['junction','hallway','stairs','ramp'].includes(n.type) && !n.roomNumber); console.log('visible nodes missing roomNumber:', missing.map(n => n.id))"` — empty array
</verification>

<success_criteria>
- NavNodeData has roomNumber?, description?, buildingName?, accessibilityNotes? optional fields
- campus-graph.json has 25 nodes: 18 visible (rooms, entrances, elevators, restrooms, landmarks) + 7 hidden (junctions, hallway, stairs, ramp)
- GET /api/map returns valid NavGraph JSON
- TypeScript compiles, Biome lint passes
</success_criteria>

<output>
After completion, create `.planning/phases/04-map-landmarks-location-display/04-01-SUMMARY.md`
</output>
