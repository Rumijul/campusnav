# Roadmap: CampusNav

## Overview

CampusNav delivers a campus wayfinding web app in 10 phases, progressing from project scaffolding through interactive floor plan rendering, graph-based pathfinding, student-facing wayfinding UX, backend persistence, and finally a full admin map editor. The architecture front-loads the data model and rendering foundation (preventing the three most expensive pitfalls identified in research), delivers the complete student wayfinding experience before admin tooling, and isolates the complex admin editor into focused phases after all supporting infrastructure is proven.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Project Setup & Foundation** - Scaffold the monorepo, configure tooling, define core TypeScript types for the graph data model
- [x] **Phase 2: Floor Plan Rendering** - Interactive 2D floor plan canvas with pan, zoom, and mobile touch gestures (completed 2026-02-18)
- [ ] **Phase 3: Graph Data Model & Pathfinding Engine** - Build the in-memory graph structure and pathfinding with accessibility-aware edge filtering
- [x] **Phase 4: Map Landmarks & Location Display** - Render visible landmarks on the map, hide navigation-only nodes, show location details on tap (completed 2026-02-19)
- [x] **Phase 5: Search & Location Selection** - Autocomplete search, tap-to-select, dropdown selection, and nearest-POI search (completed 2026-02-19)
- [x] **Phase 5.1: Issues needed to be fixed** - Urgent fixes discovered mid-milestone (INSERTED) (completed 2026-02-20)
- [ ] **Phase 6: Route Visualization & Directions** - Draw dual-route paths on the map with color coding, step-by-step text directions, and time estimates
- [ ] **Phase 7: API & Data Persistence** - Hono REST API, SQLite database, graph JSON serving, and open student access (no login required)
- [ ] **Phase 8: Admin Authentication** - Admin login with JWT, protected admin routes, unauthenticated student access confirmed
- [ ] **Phase 9: Admin Map Editor — Visual** - Floor plan upload, drag-and-drop node placement, edge creation with accessibility metadata
- [ ] **Phase 10: Admin Map Editor — Management** - Node editing/deletion, sortable data table view, JSON/CSV import and export

## Phase Details

### Phase 1: Project Setup & Foundation
**Goal**: A working development environment with the core TypeScript types that every subsequent phase builds on
**Depends on**: Nothing (first phase)
**Requirements**: (none — infrastructure phase enabling all requirements)
**Success Criteria** (what must be TRUE):
  1. Running `npm run dev` starts both the React frontend and Hono backend with hot reload
  2. Core TypeScript types (Node, Edge, Graph) are defined with normalized 0-1 coordinates and dual accessibility weights
  3. A "hello world" Konva canvas renders in the browser on both desktop and mobile viewports
  4. Linting, formatting, and TypeScript strict mode pass with zero errors
**Plans**: 2 plans

Plans:
- [ ] 01-01-PLAN.md — Scaffold project, install deps, configure tooling, define shared types, create Hono server
- [ ] 01-02-PLAN.md — Create React client with Konva hello-world canvas, verify full dev workflow end-to-end

### Phase 2: Floor Plan Rendering
**Goal**: Users can view and navigate an interactive 2D floor plan image in their browser
**Depends on**: Phase 1
**Requirements**: MAP-01, MAP-02
**Success Criteria** (what must be TRUE):
  1. User can see a floor plan image rendered on the Konva canvas that fills the viewport
  2. User can pan the floor plan by clicking and dragging on desktop
  3. User can zoom in and out of the floor plan using scroll wheel on desktop
  4. User can pan by dragging and zoom by pinch gesture on mobile/touch devices
  5. Floor plan stays crisp and responsive during pan/zoom operations without lag or drift
**Plans**: 2 plans

Plans:
- [ ] 02-01-PLAN.md — Serve floor plan images from API + progressive floor plan canvas rendering with grid background
- [ ] 02-02-PLAN.md — Interactive pan/zoom/rotation/touch gestures + zoom controls with elastic bounds

### Phase 3: Graph Data Model & Pathfinding Engine
**Goal**: The app can compute shortest paths and wheelchair-accessible paths on a navigation graph
**Depends on**: Phase 1
**Requirements**: ROUT-01, ROUT-02
**Success Criteria** (what must be TRUE):
  1. Given a graph with nodes and weighted edges, the pathfinding engine returns the shortest path between any two connected nodes
  2. Given the same graph with some edges marked as non-accessible, the engine returns the shortest wheelchair-accessible path that avoids those edges
  3. If no path exists (disconnected graph), the engine returns a clear "no route found" result instead of crashing
  4. Pathfinding completes in under 50ms for a graph of 500 nodes (verified by test)
**Plans**: 2 plans

Plans:
- [ ] 03-01-PLAN.md — Pathfinding types, graph builder, test fixture, and builder tests
- [ ] 03-02-PLAN.md — Pathfinding engine with dual-mode A* (TDD: tests first, then implementation)

### Phase 4: Map Landmarks & Location Display
**Goal**: Users can see meaningful locations on the map and tap them to view details
**Depends on**: Phase 2, Phase 3
**Requirements**: MAP-03, MAP-04, ROUT-07
**Success Criteria** (what must be TRUE):
  1. Visible landmarks (classrooms, offices, rooms, POIs) appear as labeled markers on the floor plan
  2. Navigation-only nodes (ramps, staircases, hallway junctions) are NOT visible on the student-facing map
  3. User can tap/click a landmark to see its details (name, room number, type, description) in a panel or tooltip
  4. Landmarks are positioned correctly on the floor plan and stay aligned during pan/zoom
**Plans**: 4 plans

Plans:
- [ ] 04-01-PLAN.md — Extend NavNodeData types, create campus-graph.json fixture (25 nodes), add GET /api/map endpoint
- [ ] 04-02-PLAN.md — useGraphData hook, LandmarkMarker + LandmarkLayer components, stageScale sync, FloorPlanCanvas landmark integration
- [ ] 04-03-PLAN.md — Install Vaul, LandmarkSheet bottom sheet component, wire into FloorPlanCanvas
- [ ] 04-04-PLAN.md — Human verification: landmark rendering, hidden nodes, bottom sheet interaction

### Phase 5: Search & Location Selection
**Goal**: Users can find and select locations through search or map interaction to set route start/destination
**Depends on**: Phase 4
**Requirements**: SRCH-01, SRCH-02, SRCH-03, SRCH-04
**Success Criteria** (what must be TRUE):
  1. User can type a room name or keyword and see autocomplete suggestions that update as they type
  2. User can tap/click a location on the map to set it as the start or destination point
  3. User can select start and destination from a searchable dropdown list without using the map
  4. User can search for the nearest point of interest by type (e.g., nearest restroom, nearest exit) from a selected location
  5. Selected start and destination are visually highlighted on the map with distinct markers
**Plans**: 3 plans

Plans:
- [ ] 05-01-PLAN.md — Route selection state (useRouteSelection hook), A/B labeled pin markers, tap-to-select wiring
- [ ] 05-02-PLAN.md — Search UI with autocomplete, nearest-POI search, compact strip, auto-pan, route trigger
- [ ] 05-03-PLAN.md — Human verification: search, tap-to-select, nearest POI, compact strip, auto-pan

### Phase 05.1: Issues needed to be fixed (INSERTED)

**Goal:** Fix two UAT blockers — Vaul backdrop blocks Konva canvas pan after route selection, and campus-graph node coordinates don't align with floor plan corridors causing routes to visually cut through walls
**Depends on:** Phase 5
**Requirements**: FIX-01 (map pan unblocked after route selection), FIX-02 (route line follows floor plan corridors)
**Success Criteria** (what must be TRUE):
  1. After selecting a route and the directions sheet peeks open, the map can still be panned and zoomed freely
  2. Route lines follow the hallway corridors of the floor plan image — no lines cut through walls
**Plans:** 2 plans

Plans:
- [x] 05.1-01-PLAN.md — Fix Vaul overlay blocking canvas pan (DirectionsSheet.tsx) + realign campus-graph.json node coordinates to corridor centerlines
- [x] 05.1-02-PLAN.md — Human verification: map pans with sheet open, route follows corridors

### Phase 6: Route Visualization & Directions
**Goal**: Users can see their route drawn on the map and read step-by-step walking directions
**Depends on**: Phase 5, Phase 3
**Requirements**: ROUT-03, ROUT-04, ROUT-05, ROUT-06
**Success Criteria** (what must be TRUE):
  1. After selecting start and destination, both standard and wheelchair-accessible routes are drawn on the map simultaneously
  2. The two routes are visually distinct with different color coding and a legend explaining which is which
  3. Step-by-step text directions are displayed with landmark references (e.g., "Turn left at the cafeteria")
  4. Estimated walking time is shown for both the standard route and the wheelchair-accessible route
  5. If only one route exists (e.g., standard and accessible routes are the same), the display handles this gracefully
**Plans**: 5 plans

Plans:
- [ ] 06-01-PLAN.md — useRouteDirections hook: turn-by-turn step generation with landmark references and time estimates (TDD)
- [ ] 06-02-PLAN.md — RouteLayer: animated dashed Konva route line (blue/green per mode)
- [ ] 06-03-PLAN.md — DirectionsSheet: Vaul bottom sheet with Standard/Accessible tabs, step list, time estimates
- [ ] 06-04-PLAN.md — FloorPlanCanvas wiring: RouteLayer + DirectionsSheet integration, legend, activeMode control
- [ ] 06-05-PLAN.md — Human verification: animated route line, directions sheet, tab switching, legend, back arrow

### Phase 7: API & Data Persistence
**Goal**: Graph data and floor plan images are persisted on the server and served to the student app
**Depends on**: Phase 1
**Requirements**: ADMN-02
**Success Criteria** (what must be TRUE):
  1. The student-facing app loads graph data from the server API on page load without any login or authentication
  2. Graph data (nodes, edges, metadata) is stored in SQLite and served as a JSON blob via GET endpoint
  3. Floor plan image is served as a static file from the server
  4. The app works end-to-end with server-persisted data instead of hardcoded/seed data
**Plans**: 4 plans

Plans:
- [ ] 07-01-PLAN.md — Drizzle schema, DB client singleton, drizzle.config.ts, migration generation, .gitignore update
- [ ] 07-02-PLAN.md — Idempotent startup seeder + rewrite GET /api/map handler to query SQLite
- [ ] 07-03-PLAN.md — useGraphData retry logic, HTML loading spinner overlay, fix double-fetch (LandmarkLayer nodes prop)
- [ ] 07-04-PLAN.md — Human verification: server startup, public API, spinner, landmarks, routing, single fetch

### Phase 8: Admin Authentication
**Goal**: Only authenticated admins can access the map editor; students use the app without any login
**Depends on**: Phase 7
**Requirements**: ADMN-01
**Success Criteria** (what must be TRUE):
  1. Admin can log in with email/password credentials and receive a session/token
  2. Unauthenticated users are redirected to a login page when trying to access admin routes
  3. Student-facing wayfinding pages remain fully accessible without any login prompt
  4. Admin session persists across browser refreshes (token stored securely)
**Plans**: TBD

Plans:
- [ ] 08-01: TBD
- [ ] 08-02: TBD

### Phase 9: Admin Map Editor — Visual
**Goal**: Admin can build the navigation graph visually by uploading a floor plan and placing nodes and edges on it
**Depends on**: Phase 8, Phase 4
**Requirements**: EDIT-01, EDIT-02, EDIT-03, EDIT-04, EDIT-05
**Success Criteria** (what must be TRUE):
  1. Admin can upload a floor plan image that becomes the base layer for editing
  2. Admin can place visible landmark nodes on the floor plan by dragging and dropping
  3. Admin can place hidden navigation nodes (ramps, stairs, hallway junctions) on the floor plan by dragging and dropping
  4. Admin can create connections (edges) between two nodes by clicking them sequentially, with distance/weight auto-calculated or manually set
  5. Admin can mark any edge as wheelchair-accessible or not-accessible during creation or editing
**Plans**: TBD

Plans:
- [ ] 09-01: TBD
- [ ] 09-02: TBD
- [ ] 09-03: TBD
- [ ] 09-04: TBD

### Phase 10: Admin Map Editor — Management
**Goal**: Admin can manage all graph data through editing, tabular views, and bulk import/export
**Depends on**: Phase 9
**Requirements**: EDIT-06, EDIT-07, EDIT-08
**Success Criteria** (what must be TRUE):
  1. Admin can rename, edit properties of, and delete any node from the visual editor or table view
  2. Admin can view all nodes and edges in a sortable, filterable data table with inline editing
  3. Admin can export the complete graph data as JSON or CSV for backup or migration
  4. Admin can import graph data from JSON or CSV to populate or update the map
  5. Changes made in the data table are reflected on the visual map editor and vice versa
**Plans**: TBD

Plans:
- [ ] 10-01: TBD
- [ ] 10-02: TBD
- [ ] 10-03: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 5.1 → 6 → 7 → 8 → 9 → 10
Note: Phases 2 and 3 can execute in parallel (both depend only on Phase 1).

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Project Setup & Foundation | 0/2 | Not started | - |
| 2. Floor Plan Rendering | 2/2 | Complete   | 2026-02-18 |
| 3. Graph Data Model & Pathfinding Engine | 1/2 | In progress | - |
| 4. Map Landmarks & Location Display | 4/4 | Complete   | 2026-02-19 |
| 5. Search & Location Selection | 3/3 | Complete   | 2026-02-19 |
| 5.1. Issues needed to be fixed (INSERTED) | 2/2 | Complete   | 2026-02-20 |
| 6. Route Visualization & Directions | 6/7 | In Progress|  |
| 7. API & Data Persistence | 3/4 | In Progress|  |
| 8. Admin Authentication | 0/2 | Not started | - |
| 9. Admin Map Editor — Visual | 0/4 | Not started | - |
| 10. Admin Map Editor — Management | 0/3 | Not started | - |
