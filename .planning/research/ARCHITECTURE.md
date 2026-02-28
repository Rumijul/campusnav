# Architecture Research

**Domain:** Campus indoor wayfinding web app with graph-based pathfinding, admin map editor, and accessibility routing
**Researched:** 2026-02-18
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
  PUBLIC SIDE (Student/Visitor)              ADMIN SIDE (Map Editor)
 ================================          ================================
 |  +--------------------------+|          |  +--------------------------+|
 |  |    Map Viewer (Canvas)   ||          |  |  Map Editor (Canvas)     ||
 |  |  - Floor plan rendering  ||          |  |  - Node drag & drop      ||
 |  |  - Path overlay drawing  ||          |  |  - Edge creation         ||
 |  |  - Pan / Zoom / Tap      ||          |  |  - Node property editing ||
 |  +-----------+--------------+|          |  +-----------+--------------+|
 |              |               |          |              |               |
 |  +-----------v--------------+|          |  +-----------v--------------+|
 |  |   Location Picker /      ||          |  |    Data Table View       ||
 |  |   Search Panel           ||          |  |  - List all nodes/edges  ||
 |  +-----------+--------------+|          |  |  - Filter / bulk edit    ||
 |              |               |          |  +-----------+--------------+|
 |  +-----------v--------------+|          |              |               |
 |  |   Pathfinding Engine     ||          |              |               |
 |  |  - Dijkstra / A*         ||          |              |               |
 |  |  - Standard route        ||          |              |               |
 |  |  - Accessible route      ||          |              |               |
 |  +-----------+--------------+|          |              |               |
 |              |               |          |              |               |
 |  +-----------v--------------+|          |              |               |
 |  |   Directions Generator   ||          |              |               |
 |  |  - Step-by-step text     ||          |              |               |
 |  |  - Visual path on map    ||          |              |               |
 |  +--------------------------+|          |              |               |
 ================================          ================================
              |                                          |
              +------------------+-----------------------+
                                 |
                    +------------v-----------+
                    |     API Layer          |
                    |  - Graph CRUD         |
                    |  - Map data serving   |
                    |  - Admin auth         |
                    +------------+-----------+
                                 |
                    +------------v-----------+
                    |     Data Store         |
                    |  - Graph (nodes/edges) |
                    |  - Floor plan images   |
                    |  - Location metadata   |
                    +------------------------+
```

### Component Responsibilities

| Component                    | Responsibility                                                                                                                            | Typical Implementation                                                                                                                                            |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Map Viewer**               | Renders floor plan image with interactive overlays (paths, markers). Handles pan, zoom, tap-to-select.                                    | HTML5 Canvas via Konva.js (or react-konva). Floor plan as background Image node, path/markers as Shape overlays.                                                  |
| **Map Editor**               | Admin-only canvas with drag-and-drop node placement, edge drawing between nodes, property editing per node/edge.                          | Same Canvas lib (Konva.js) with draggable nodes, click-to-connect edge mode, and a side panel for metadata editing.                                               |
| **Location Picker / Search** | UI panel where users type or select start/destination. Fuzzy search over named locations.                                                 | Text input with filtered dropdown list. Data comes from graph node metadata (room names, building names, landmarks).                                              |
| **Pathfinding Engine**       | Takes a graph + start/end node IDs, returns shortest path for standard route AND accessible route.                                        | Custom Dijkstra/A* implementation OR `ngraph.path` library running client-side against an in-memory graph. Two parallel computations with different edge filters. |
| **Directions Generator**     | Converts a path (ordered node list) into human-readable step-by-step directions + visual overlay.                                         | Processes node sequence: computes turn directions (left/right/straight), distances, landmark references. Outputs structured direction steps.                      |
| **Data Table View**          | Admin tabular view of all nodes and edges. Supports filtering, sorting, bulk property editing.                                            | Standard data table component. Syncs bidirectionally with the canvas editor.                                                                                      |
| **API Layer**                | REST endpoints for CRUD on graph data, serving map data to public users, admin authentication.                                            | Express/Fastify REST API. Endpoints: `GET /api/map` (public), `POST/PUT/DELETE /api/admin/nodes`, `/api/admin/edges`, `POST /api/admin/auth`.                     |
| **Data Store**               | Persists the navigation graph (nodes with coordinates + metadata, edges with weights + accessibility flags), floor plan image references. | SQLite (simplest) or PostgreSQL. Graph stored as two tables: `nodes` and `edges`. Floor plan images as static files. JSON export for client consumption.          |

## Recommended Project Structure

```
src/
├── client/                     # Frontend application
│   ├── components/             # Shared UI components
│   │   ├── MapCanvas.tsx       # Shared canvas rendering (floor plan + overlays)
│   │   ├── SearchPanel.tsx     # Location search/picker
│   │   ├── DirectionsList.tsx  # Step-by-step text directions
│   │   └── RouteComparison.tsx # Side-by-side standard vs accessible route
│   ├── pages/                  # Page-level components
│   │   ├── WayfindingPage.tsx  # Public: the main user-facing page
│   │   ├── AdminEditorPage.tsx # Admin: canvas-based map editor
│   │   ├── AdminTablePage.tsx  # Admin: data table view
│   │   └── AdminLoginPage.tsx  # Admin: authentication
│   ├── core/                   # Core domain logic (runs client-side)
│   │   ├── graph/              # Graph data structure & pathfinding
│   │   │   ├── types.ts        # Node, Edge, Graph type definitions
│   │   │   ├── Graph.ts        # Graph data structure (adjacency list)
│   │   │   ├── pathfinding.ts  # Dijkstra/A* implementation
│   │   │   └── directions.ts   # Path → text directions conversion
│   │   ├── map/                # Map rendering logic
│   │   │   ├── renderer.ts     # Canvas rendering helpers
│   │   │   └── interaction.ts  # Pan, zoom, tap handling
│   │   └── search/             # Fuzzy search over locations
│   │       └── locationSearch.ts
│   ├── admin/                  # Admin-specific components
│   │   ├── NodeEditor.tsx      # Property panel for selected node
│   │   ├── EdgeEditor.tsx      # Property panel for selected edge
│   │   ├── EditorCanvas.tsx    # Canvas with drag-drop editing
│   │   └── DataTable.tsx       # Tabular node/edge editor
│   ├── hooks/                  # React hooks
│   │   ├── useGraph.ts         # Load & manage graph state
│   │   ├── usePathfinding.ts   # Compute routes reactively
│   │   └── useMapInteraction.ts# Pan/zoom state
│   └── api/                    # API client functions
│       └── client.ts           # Fetch wrappers for all endpoints
├── server/                     # Backend application
│   ├── routes/                 # API route handlers
│   │   ├── map.ts              # Public: serve graph data + floor plan
│   │   ├── admin.ts            # Admin: CRUD graph nodes/edges
│   │   └── auth.ts             # Admin: login/session
│   ├── db/                     # Database layer
│   │   ├── schema.ts           # Table definitions
│   │   ├── migrations/         # Schema migrations
│   │   └── queries.ts          # Parameterized queries
│   └── middleware/
│       └── auth.ts             # Admin auth middleware
├── shared/                     # Shared between client & server
│   └── types.ts                # Graph node/edge type definitions
└── public/
    └── floorplans/             # Static floor plan images
```

### Structure Rationale

- **`client/core/`:** Pure domain logic (graph, pathfinding, directions) has ZERO UI dependencies. Can be unit tested independently. This is the most important code in the app.
- **`client/components/` vs `client/admin/`:** Separates public-facing components from admin-only components. Admin code can be code-split and lazy-loaded.
- **`client/pages/`:** Thin page shells that compose components. Keeps routing simple.
- **`shared/types.ts`:** Single source of truth for graph data types used by both client and server. Prevents drift.
- **`server/`:** Intentionally thin. Its job is CRUD + auth + serving data. Pathfinding runs client-side.

## Architectural Patterns

### Pattern 1: Client-Side Pathfinding (Critical Decision)

**What:** Run Dijkstra/A* in the browser, not on the server. Load the full graph into client memory on page load.
**When to use:** When the graph is small enough to fit in browser memory (campus floor plan = hundreds of nodes, not millions).
**Trade-offs:**
- **Pro:** Zero server latency for route computation. Instant re-routing. No server load from pathfinding queries. Works offline after initial load.
- **Pro:** Simpler server — it just serves static graph data.
- **Con:** Initial page load must download the full graph. For a campus floor this is kilobytes, not a concern.
- **Con:** If graph grows to thousands of nodes (multi-building, multi-floor), still fine for client-side.

**Example:**
```typescript
// core/graph/pathfinding.ts
interface PathResult {
  path: GraphNode[];
  totalDistance: number;
  isAccessible: boolean;
}

function findRoute(
  graph: NavigationGraph,
  startId: string,
  endId: string,
  accessibleOnly: boolean
): PathResult {
  // Filter edges: if accessibleOnly, skip edges marked as inaccessible
  // (stairs, narrow passages, etc.)
  const edgeFilter = accessibleOnly
    ? (edge: GraphEdge) => edge.accessible
    : () => true;

  // Run Dijkstra with filtered edges
  return dijkstra(graph, startId, endId, edgeFilter);
}

// Usage: compute both routes simultaneously
const standardRoute = findRoute(graph, start, end, false);
const accessibleRoute = findRoute(graph, start, end, true);
```

**Confidence:** HIGH — for a single-floor campus graph (typically 50-500 nodes), client-side pathfinding is the standard approach. Even multi-floor scenarios with a few thousand nodes are trivially handled client-side.

### Pattern 2: Dual-Graph Model (Standard + Accessible)

**What:** Use a SINGLE graph with accessibility metadata on edges, not two separate graphs. Each edge has an `accessible: boolean` flag (and optionally `accessibilityNotes: string`). Pathfinding filters edges at query time.
**When to use:** Always, for this type of wayfinding app.
**Trade-offs:**
- **Pro:** Single source of truth. Admin edits one graph, not two. No sync issues.
- **Pro:** Edge filtering at pathfind time is trivial and costs almost nothing.
- **Con:** None for this scale.

**Example:**
```typescript
// shared/types.ts
interface GraphNode {
  id: string;
  x: number;              // Position on floor plan (pixels)
  y: number;
  label: string;          // "Room 101", "Main Entrance", etc.
  type: 'room' | 'hallway' | 'entrance' | 'elevator' | 'stairs' | 'restroom' | 'junction';
  searchable: boolean;    // Whether this node appears in user search
  floor: number;          // For future multi-floor support
}

interface GraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  weight: number;          // Distance (pixels or meters)
  accessible: boolean;     // false = stairs, narrow passage, etc.
  accessibilityNotes?: string; // "3 steps", "narrow doorway"
  bidirectional: boolean;  // Almost always true for indoor navigation
}
```

**Confidence:** HIGH — this is the standard pattern in indoor navigation systems. A single graph with attribute-based filtering is universally preferred over maintaining parallel graphs.

### Pattern 3: Canvas Layering for Map Rendering

**What:** Use Konva.js layered canvas architecture. Background layer for floor plan image (static, cached). Overlay layer for paths, markers, highlights (dynamic, redrawn on interaction). Hit-detection layer for tap/click targets.
**When to use:** Any interactive 2D map application.
**Trade-offs:**
- **Pro:** Background layer is cached — no re-rendering when paths change. Smooth performance.
- **Pro:** Konva's built-in hit detection means tap targets can be larger than visual markers.
- **Pro:** Konva supports drag-and-drop natively — critical for admin editor.
- **Con:** Konva adds ~130KB to bundle. Acceptable for this app.

**Example:**
```typescript
// Konva layer structure
// Stage
//   ├── Layer: floorPlan (cached, rarely redrawn)
//   │     └── Image: floor plan PNG/SVG
//   ├── Layer: paths (redrawn on route change)
//   │     ├── Line: standard route (blue)
//   │     └── Line: accessible route (green)
//   └── Layer: markers (redrawn on selection)
//         ├── Circle: start marker
//         ├── Circle: end marker
//         └── Circle[]: named locations (tap targets)
```

**Confidence:** HIGH — Konva.js is the dominant canvas framework for interactive 2D applications in React/web (8.7k+ stars, active development, React/Vue/Svelte integrations). Verified via official docs at konvajs.org.

### Pattern 4: Graph as JSON Export

**What:** Server stores graph in a relational database (nodes + edges tables), but exports a single JSON blob for the client. Client loads this JSON on page load and builds an in-memory graph.
**When to use:** When the graph changes infrequently (admin edits) but is read frequently (every user page load).
**Trade-offs:**
- **Pro:** Client gets a single HTTP request, not N+1 queries. Can be CDN-cached.
- **Pro:** Server can pre-compute the JSON on admin save, not on every request.
- **Con:** Any admin edit invalidates the cache. Fine for this use case — edits are rare.

**Example:**
```typescript
// Server: on admin save, regenerate cached JSON
// GET /api/map → returns:
{
  "floorPlan": "/floorplans/main-building-floor-1.png",
  "nodes": [
    { "id": "n1", "x": 120, "y": 340, "label": "Main Entrance", "type": "entrance", ... },
    { "id": "n2", "x": 250, "y": 340, "label": "Room 101", "type": "room", ... }
  ],
  "edges": [
    { "id": "e1", "sourceId": "n1", "targetId": "n2", "weight": 130, "accessible": true }
  ],
  "metadata": {
    "buildingName": "Main Building",
    "floor": 1,
    "lastUpdated": "2026-02-18T10:00:00Z"
  }
}
```

**Confidence:** HIGH — this is the standard pattern for read-heavy, write-rare data like map configurations.

## Data Flow

### Request Flow: User Finding a Route

```
User taps start location on map (or types in search)
    ↓
[MapCanvas / SearchPanel] → identifies startNodeId
    ↓
User taps destination (or types in search)
    ↓
[MapCanvas / SearchPanel] → identifies endNodeId
    ↓
[usePathfinding hook] calls pathfinding engine (CLIENT-SIDE)
    ↓
[pathfinding.ts] → Dijkstra(graph, start, end, accessible=false) → standardRoute
                 → Dijkstra(graph, start, end, accessible=true)  → accessibleRoute
    ↓
[directions.ts] → converts each route to step-by-step text
    ↓
[RouteComparison] renders both routes side-by-side
[MapCanvas] draws both paths as colored overlays on floor plan
```

### Request Flow: Admin Editing the Map

```
Admin logs in → session token stored
    ↓
[AdminEditorPage] loads graph JSON from API
    ↓
Admin drags node to new position on canvas
    ↓
[EditorCanvas] updates local state (x, y of node)
    ↓
Admin clicks "Save"
    ↓
[API client] → PUT /api/admin/nodes/:id { x, y, ... }
    ↓
[Server] → updates database → regenerates cached JSON export
    ↓
Response confirms save. Public users get updated graph on next load.
```

### State Management

```
[Graph Data Store] (loaded once on page init, immutable during session)
    ↓ (used by)
[usePathfinding] ←→ [start/end selection state]
    ↓ (produces)
[Route State] → { standardPath, accessiblePath, directions }
    ↓ (consumed by)
[MapCanvas overlays] + [DirectionsList] + [RouteComparison]
```

No global state manager needed (no Redux/Zustand). React context or prop drilling is sufficient because:
1. Graph data flows one way: load → use
2. User state is local: selected start/end, active route
3. Admin state is page-scoped: current edits, unsaved changes

**Confidence:** MEDIUM — React context is sufficient for v1. If admin editor gets complex (undo/redo, multi-step operations), consider Zustand later. But premature for single-floor v1.

### Key Data Flows

1. **Graph Loading:** Server DB → JSON export → HTTP GET → client memory → build adjacency list. Happens once on page load (~100ms for a campus-sized graph).
2. **Route Computation:** User selects start+end → pathfinding runs twice (standard + accessible) → results stored in React state → canvas redraws paths + directions panel updates. Happens in <10ms for campus-sized graphs.
3. **Admin Save:** Canvas state → serialize changed nodes/edges → HTTP PUT to server → DB update → cache invalidation → acknowledgment. Happens on explicit save action.
4. **Direction Generation:** Ordered node list → iterate pairs → compute bearing changes → classify as "turn left", "continue straight", "turn right" → attach landmark names from node metadata → output structured direction steps.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users (v1) | Monolith is perfect. Single server, SQLite, client-side pathfinding. JSON export cached as a static file. Zero scaling concerns. |
| 1k-10k concurrent users | Add CDN for floor plan images and graph JSON. Server barely touched — it's just serving static data. Admin writes are rare. |
| 10k+ concurrent, multi-building | Consider pre-generated static JSON per building/floor (build step, not runtime). Still client-side pathfinding. Server remains thin. |

### Scaling Priorities

1. **First bottleneck (won't actually happen for v1):** Floor plan image size. Large high-res images can slow page load. **Fix:** Serve multiple resolution tiers. Use progressive loading.
2. **Second bottleneck (only if multi-floor):** Graph JSON size growing. **Fix:** Partition graph by floor. Load only the relevant floor's graph. Cross-floor routing handled by a lightweight floor-connection graph.

**Confidence:** HIGH — a campus wayfinding app for a single floor will never hit scaling limits. This section exists to prove that architectural decisions don't paint us into a corner.

## Anti-Patterns

### Anti-Pattern 1: Server-Side Pathfinding

**What people do:** Send start/end to server, run Dijkstra server-side, return path.
**Why it's wrong:** Adds latency (round-trip), server load, complexity, and eliminates offline capability. For a graph with <10k nodes, client-side pathfinding runs in microseconds.
**Do this instead:** Load graph JSON on page init, run pathfinding client-side. Server is just a data store.

### Anti-Pattern 2: Two Separate Graphs for Standard vs Accessible

**What people do:** Maintain two independent graph datasets — one for walking, one for wheelchair.
**Why it's wrong:** Sync nightmare. Every admin edit must be applied to both graphs. Bugs when they diverge. Double the storage and complexity.
**Do this instead:** Single graph with `accessible: boolean` on each edge. Filter at pathfinding time. Zero overhead, zero sync issues.

### Anti-Pattern 3: SVG-Based Map Instead of Canvas

**What people do:** Render the floor plan and overlays as SVG elements, manipulate with D3 or direct DOM.
**Why it's wrong for this app:** SVG performance degrades with many elements (nodes, edges, paths). DOM manipulation for dragging nodes is jankier than Canvas. Hit detection requires manual work.
**Do this instead:** Use Konva.js Canvas-based rendering. Built-in drag-and-drop, hit detection, layering, caching. Much smoother for interactive map applications.

*Exception:* If the floor plan itself is an SVG (architect's drawing), render it as an image on the Canvas, not as live SVG DOM elements.

### Anti-Pattern 4: Grid-Based Pathfinding

**What people do:** Overlay a pixel grid on the floor plan and use grid-based A* (like PathFinding.js).
**Why it's wrong:** Grid resolution creates a tradeoff between accuracy and performance. A fine grid (1px) on a 2000x1500 floor plan = 3 million cells. Coarse grid loses path quality. Grid can't represent named locations, accessibility metadata, or weighted connections naturally.
**Do this instead:** Graph-based pathfinding with nodes at meaningful locations (intersections, doorways, destinations). Typically 50-500 nodes for a floor. Orders of magnitude faster and semantically richer.

**Confidence:** HIGH — grid-based pathfinding is designed for games with obstacles, not indoor navigation with named waypoints. Graph-based is the standard for wayfinding systems.

### Anti-Pattern 5: Over-Engineering State Management

**What people do:** Introduce Redux, MobX, or complex state machines for a v1 wayfinding app.
**Why it's wrong:** The data flow is simple: load graph → select points → compute route → display. No complex cross-cutting state concerns. Adding a state management library adds boilerplate and learning curve for no benefit.
**Do this instead:** React hooks + context. `useState` for selections, `useMemo` for computed routes, context for shared graph data.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Floor plan images | Static file serving (CDN-able) | Admin uploads PNG/SVG via admin panel. Stored on disk or object storage. Served as static assets. |
| Admin authentication | Session-based auth (cookie or JWT) | Simple username/password. No OAuth needed for admin-only auth. Single admin account is fine for v1. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Client ↔ Server | REST API (JSON) | `GET /api/map` (public), `POST/PUT/DELETE /api/admin/*` (auth required). No WebSocket needed — data changes are rare. |
| MapCanvas ↔ Pathfinding | Function call (same process) | Pathfinding engine is a pure function imported by the React component. No message passing, no async boundary. |
| Admin Editor ↔ Data Table | Shared state (React context or lifted state) | Both views edit the same in-memory graph. Changes in canvas reflect in table and vice versa. |
| Pathfinding ↔ Directions | Function call | Directions generator takes pathfinding output (node list) as input. Pure data transformation. |

## Build Order (Dependencies Between Components)

The architecture has clear dependency chains that dictate build order:

### Phase Dependencies

```
1. Graph Data Model (types + structure)
   ├── Required by: everything else
   └── No dependencies

2. Pathfinding Engine
   ├── Requires: Graph Data Model
   └── Required by: Wayfinding UI

3. Floor Plan Rendering (Canvas basics)
   ├── Requires: Konva.js setup
   └── Required by: both public UI and admin editor

4. Public Wayfinding UI
   ├── Requires: Graph Model, Pathfinding Engine, Canvas Rendering
   └── This is the MVP

5. Directions Generator
   ├── Requires: Pathfinding Engine (for path output format)
   └── Enhances: Public UI

6. API Layer + Data Store
   ├── Requires: Graph Data Model (shared types)
   └── Required by: Admin Editor (for persistence)

7. Admin Map Editor
   ├── Requires: Canvas Rendering, API Layer, Graph Model
   └── This is the second major deliverable

8. Admin Data Table View
   ├── Requires: API Layer, Graph Model
   └── Complements: Admin Map Editor
```

### Suggested Build Order

1. **Graph Data Model + Pathfinding** — The heart of the app. Can be built and tested entirely without UI. Pure TypeScript, pure functions, pure unit tests.
2. **Canvas Map Rendering** — Floor plan display with pan/zoom. Can verify with static data.
3. **Public Wayfinding Page** — Compose: canvas + location picker + pathfinding + path overlay. This is the MVP.
4. **Directions Generator** — Enhances the MVP with text directions. Purely additive.
5. **API + Database** — Needed before admin editor. Simple CRUD. Can test with curl/Postman.
6. **Admin Editor** — Canvas-based node/edge editing. Most complex UI component.
7. **Admin Data Table** — Alternative admin view. Builds on same data layer.

**Rationale:** Build the core algorithm first (testable in isolation), then the public-facing MVP (delivers value earliest), then the admin tooling (enables ongoing maintenance).

## Sources

- **Konva.js** — Official docs at https://konvajs.org/docs/overview.html — Verified: Canvas framework with layers, drag-and-drop, hit detection, React integration. v10 current. [HIGH confidence]
- **ngraph.path** — GitHub https://github.com/anvaka/ngraph.path — A* and Dijkstra for arbitrary graphs (not grid-based). 3.1k stars. Supports weighted edges, custom distance/heuristic functions, blocked path filtering. [HIGH confidence]
- **ngraph.graph** — GitHub https://github.com/anvaka/ngraph.graph — Graph data structure for JavaScript. 571 stars. Pairs with ngraph.path. [HIGH confidence]
- **PathFinding.js** — GitHub https://github.com/qiao/PathFinding.js — Grid-based pathfinding (8.7k stars). Researched to confirm it's NOT suitable for this use case (grid-based, not graph-based). Last release 2015. [HIGH confidence — confirmed as anti-pattern for this project]
- **@dagrejs/graphlib** — GitHub https://github.com/dagrejs/graphlib — Directed multi-graph library. 1.7k stars. Alternative to ngraph.graph but less actively maintained. [MEDIUM confidence]
- **Client-side pathfinding pattern** — Based on domain analysis: campus floor graphs typically have 50-500 nodes. Dijkstra on 500 nodes completes in <1ms in JavaScript. No server round-trip needed. [HIGH confidence — well-established pattern]
- **Dual-graph (accessibility filtering) pattern** — Standard indoor navigation approach: single graph with edge attributes, filtered at query time. Avoids maintaining parallel graphs. [HIGH confidence — established best practice]

---
*Architecture research for: CampusNav — campus indoor wayfinding web app*
*Researched: 2026-02-18*
