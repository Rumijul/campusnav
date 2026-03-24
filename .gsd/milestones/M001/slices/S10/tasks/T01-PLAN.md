---
phase: 09-admin-map-editor-visual
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/client/hooks/useEditorState.ts
  - src/server/index.ts
autonomous: true
requirements: [EDIT-01, EDIT-04, EDIT-05]

must_haves:
  truths:
    - "useEditorState hook manages nodes, edges, mode, selection, and undo/redo history"
    - "POST /api/admin/graph saves a full NavGraph to SQLite (replace all)"
    - "POST /api/admin/floor-plan accepts image upload and writes to server assets"
  artifacts:
    - path: "src/client/hooks/useEditorState.ts"
      provides: "Editor state management with useReducer + undo/redo refs"
      exports: ["useEditorState"]
    - path: "src/server/index.ts"
      provides: "Admin graph save + floor plan upload endpoints"
      contains: "/api/admin/graph"
  key_links:
    - from: "src/client/hooks/useEditorState.ts"
      to: "@shared/types"
      via: "NavNode, NavEdge, NavGraph imports"
      pattern: "import.*NavNode.*NavEdge.*from.*@shared/types"
    - from: "src/server/index.ts"
      to: "src/server/db/schema.ts"
      via: "Drizzle delete+insert for graph save"
      pattern: "db\\.delete.*db\\.insert"
---

<objective>
Create the editor state management hook and admin API endpoints that all editor UI components depend on.

Purpose: Establish the data layer (client-side state + server persistence) before building any visual components. The useEditorState hook is the single source of truth for all editor interactions, and the API endpoints enable Save and Upload functionality.

Output:
- `src/client/hooks/useEditorState.ts` — useReducer-based editor state with mode, selection, undo/redo
- Two new admin API endpoints in `src/server/index.ts` — POST /api/admin/graph + POST /api/admin/floor-plan
</objective>

<execution_context>
@C:/Users/LENOVO/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/LENOVO/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/09-admin-map-editor-visual/09-RESEARCH.md
@src/shared/types.ts
@src/server/index.ts
@src/server/db/schema.ts
@src/server/db/client.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create useEditorState hook with useReducer, mode switching, selection, and undo/redo</name>
  <files>src/client/hooks/useEditorState.ts</files>
  <action>
Create `src/client/hooks/useEditorState.ts` that exports a `useEditorState` hook managing all editor state via `useReducer`. This hook is consumed by every editor UI component.

**EditorMode type:** `'select' | 'add-node' | 'add-edge'`

**EditorState shape:**
```typescript
type EditorState = {
  nodes: NavNode[]
  edges: NavEdge[]
  mode: EditorMode
  selectedNodeId: string | null
  selectedEdgeId: string | null
  pendingEdgeSourceId: string | null
  isDirty: boolean  // true when unsaved changes exist
}
```

**EditorAction union type — actions the reducer handles:**
- `LOAD_GRAPH` — { nodes, edges } — loads initial graph from server, resets dirty
- `SET_MODE` — { mode } — switches editor mode; clears selection and pendingEdge
- `PLACE_NODE` — { node: NavNode } — adds a new node to the array, sets isDirty
- `MOVE_NODE` — { id, x, y } — updates a node's normalized coordinates, sets isDirty
- `UPDATE_NODE` — { id, changes: Partial<NavNode> } — updates node properties (name, type, etc), sets isDirty
- `SELECT_NODE` — { id: string | null } — sets selectedNodeId, clears selectedEdgeId
- `SET_PENDING_EDGE_SOURCE` — { id: string | null } — sets pendingEdgeSourceId for edge creation
- `CREATE_EDGE` — { edge: NavEdge } — adds a new edge, clears pendingEdgeSourceId, sets isDirty
- `UPDATE_EDGE` — { id, changes: Partial<NavEdge> } — updates edge properties (accessible, weight override), sets isDirty
- `SELECT_EDGE` — { id: string | null } — sets selectedEdgeId, clears selectedNodeId
- `MARK_SAVED` — resets isDirty to false

**Reducer function:** Standard switch-case returning new state. Use immutable spread patterns. When SET_MODE is dispatched, always clear selectedNodeId, selectedEdgeId, and pendingEdgeSourceId — mode switching should start clean.

**Undo/Redo — use refs (not state) per Konva official docs pattern:**
```typescript
const history = useRef<EditorState[]>([initialState])
const historyStep = useRef<number>(0)
```

Create a `recordHistory` function that:
1. Slices history to current step (discards redo future on new action)
2. Pushes current state snapshot
3. Increments historyStep
4. Cap history at 50 entries max (shift oldest when exceeded)

Create `handleUndo` and `handleRedo` that:
1. Check bounds (step > 0 for undo, step < length-1 for redo)
2. Adjust historyStep
3. Dispatch a special `RESTORE_SNAPSHOT` action with the historical state

Add a `RESTORE_SNAPSHOT` action to the reducer that replaces nodes/edges from the snapshot.

**Hook return value:**
```typescript
{
  state: EditorState,
  dispatch: React.Dispatch<EditorAction>,
  recordHistory: () => void,  // call AFTER dispatching a state-changing action
  handleUndo: () => void,
  handleRedo: () => void,
  canUndo: boolean,
  canRedo: boolean,
}
```

**Important:** `canUndo` and `canRedo` must be derived from refs but need to trigger re-renders. Store a `historyLength` and `currentStep` in a simple useState that gets updated whenever recordHistory/undo/redo is called. This lets React re-render button disabled states.

**ID generation helper (exported):**
```typescript
export function generateNodeId(type: string, label: string): string {
  const slug = label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  return `${type}-${slug || 'node'}-${Date.now()}`
}

export function generateEdgeId(sourceId: string, targetId: string): string {
  return `edge-${sourceId}-${targetId}-${Date.now()}`
}
```

**Distance calculation helper (exported):**
```typescript
export function calcDistance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2)
}
```

Import NavNode, NavEdge, NavGraph from `@shared/types`. Use type-only imports where possible.
  </action>
  <verify>
Run `npx tsc --noEmit` — zero TypeScript errors.
Run `npx biome check src/client/hooks/useEditorState.ts` — zero lint/format errors (run `--write` first if needed).
  </verify>
  <done>
useEditorState hook exports correctly; all EditorAction types compile; undo/redo refs + state tracking compile; helper functions exported.
  </done>
</task>

<task type="auto">
  <name>Task 2: Add POST /api/admin/graph and POST /api/admin/floor-plan endpoints</name>
  <files>src/server/index.ts</files>
  <action>
Add two new admin API endpoints to `src/server/index.ts`. These go AFTER the existing JWT guard line (`app.use('/api/admin/*', jwt(...))`) so they are automatically protected.

**Endpoint 1: POST /api/admin/graph**

Receives a full NavGraph JSON body and replaces all DB content in a transaction.

```typescript
app.post('/api/admin/graph', async (c) => {
  try {
    const graph = await c.req.json() as NavGraph
    // Basic validation: must have nodes array and edges array
    if (!Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) {
      return c.json({ error: 'Invalid graph data' }, 400)
    }

    // Use the raw better-sqlite3 connection for transaction
    const sqlite = db.$client  // access underlying better-sqlite3 Database instance
    const txn = sqlite.transaction(() => {
      // Delete all existing data
      db.delete(graphMetadata).run()
      db.delete(edges).run()
      db.delete(nodes).run()

      // Insert nodes
      if (graph.nodes.length > 0) {
        for (const n of graph.nodes) {
          db.insert(nodes).values({
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
          }).run()
        }
      }

      // Insert edges
      if (graph.edges.length > 0) {
        for (const e of graph.edges) {
          db.insert(edges).values({
            id: e.id,
            sourceId: e.sourceId,
            targetId: e.targetId,
            standardWeight: e.standardWeight,
            accessibleWeight: e.accessibleWeight, // 1e10 for non-accessible (never Infinity)
            accessible: e.accessible,
            bidirectional: e.bidirectional,
            accessibilityNotes: e.accessibilityNotes ?? null,
          }).run()
        }
      }

      // Insert metadata
      if (graph.metadata) {
        db.insert(graphMetadata).values({
          buildingName: graph.metadata.buildingName,
          floor: graph.metadata.floor,
          lastUpdated: graph.metadata.lastUpdated,
        }).run()
      }
    })
    txn()  // execute the transaction

    return c.json({ ok: true })
  } catch (err) {
    console.error('Graph save failed:', err)
    return c.json({ error: 'Failed to save graph' }, 500)
  }
})
```

**Important:** Use `db.$client` (Drizzle's underlying better-sqlite3 Database) for the `.transaction()` wrapper. Drizzle ORM's own `.transaction()` API is async but better-sqlite3 is synchronous — use the raw driver's synchronous transaction API for atomicity.

**Endpoint 2: POST /api/admin/floor-plan**

Receives a multipart form upload and writes the image to the server assets directory.

```typescript
import { writeFile } from 'node:fs/promises'
// (readFile is already imported at the top)
```

Add the `writeFile` import alongside the existing `readFile` import at the top of the file.

```typescript
app.post('/api/admin/floor-plan', async (c) => {
  try {
    const body = await c.req.parseBody()
    const file = body['image']
    if (!file || !(file instanceof File)) {
      return c.json({ error: 'No image file provided' }, 400)
    }
    if (!file.type.startsWith('image/')) {
      return c.json({ error: 'File must be an image' }, 400)
    }
    const buffer = Buffer.from(await file.arrayBuffer())
    const dest = resolve(__dirname, 'assets/floor-plan.png')
    await writeFile(dest, buffer)
    return c.json({ ok: true })
  } catch (err) {
    console.error('Floor plan upload failed:', err)
    return c.json({ error: 'Failed to upload floor plan' }, 500)
  }
})
```

**CSRF note:** Both endpoints are POST requests on `/api/admin/*`. The global `csrf()` middleware validates the Origin header. The client MUST use `credentials: 'include'` on fetch calls. This works automatically in dev (same origin).

**Do NOT set Content-Type header manually for multipart uploads on the client side — let the browser set it with the boundary parameter.**

Delete the existing placeholder `/api/admin/ping` endpoint since it was only for testing JWT guard.
  </action>
  <verify>
Run `npx tsc --noEmit` — zero TypeScript errors.
Run `npx biome check src/server/index.ts` — zero lint/format errors (run `--write` first if needed).
Start the dev server with `npm run dev` and verify it starts without crashes.
Test the graph save endpoint:
```bash
# Get a valid JWT cookie first (login), then:
curl -X POST http://localhost:3001/api/admin/graph \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3001" \
  --cookie "admin_token=<jwt>" \
  -d '{"nodes":[],"edges":[],"metadata":{"buildingName":"Test","floor":1,"lastUpdated":"2026-01-01T00:00:00Z"}}'
```
Should return `{"ok":true}`.
  </verify>
  <done>
POST /api/admin/graph saves full graph to SQLite atomically (transaction-wrapped delete+insert). POST /api/admin/floor-plan accepts image upload and writes to assets. Both endpoints are JWT-protected. Server starts without errors.
  </done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` passes with zero errors across all files
2. `npx biome check .` passes with zero errors
3. useEditorState hook can be imported and provides state, dispatch, undo/redo, and helpers
4. Server starts without crashes after adding new endpoints
5. POST /api/admin/graph with valid JWT returns 200 and persists data to SQLite
6. POST /api/admin/floor-plan with valid JWT and image file returns 200
</verification>

<success_criteria>
- useEditorState hook compiles and exports all required types, actions, and helper functions
- Both admin endpoints are JWT-protected and functional
- Graph save uses SQLite transaction for atomicity
- Floor plan upload validates MIME type and writes to server assets
- No regressions in existing student-facing or auth endpoints
</success_criteria>

<output>
After completion, create `.planning/phases/09-admin-map-editor-visual/09-01-SUMMARY.md`
</output>
