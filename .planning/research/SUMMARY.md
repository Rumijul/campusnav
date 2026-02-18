# Project Research Summary

**Project:** CampusNav
**Domain:** Campus indoor wayfinding web application
**Researched:** 2026-02-18
**Confidence:** HIGH

## Executive Summary

CampusNav is a campus indoor wayfinding web application — a well-understood product category with clear patterns from enterprise competitors (Mappedin, MazeMap, ArcGIS Indoors). The expert approach is: render an uploaded floor plan on an interactive HTML5 Canvas, overlay a graph-based navigation network (nodes at intersections/rooms, weighted edges along corridors), run Dijkstra/A* client-side for instant route computation, and provide both visual paths and human-readable step-by-step directions. CampusNav's differentiator is always-visible side-by-side standard + wheelchair-accessible routes, making accessibility a default rather than a hidden toggle.

The recommended architecture is a React SPA with Konva.js for canvas rendering, ngraph.path for graph-based pathfinding (running entirely in the browser), a lightweight Hono API for graph CRUD and admin auth, and SQLite for storage. This stack is deliberately simple — a campus floor graph has ~100-500 nodes, making client-side pathfinding trivially fast (<1ms) and eliminating the need for server-side computation, WebSockets, or complex infrastructure. The server's only job is persisting graph data and serving it as a single JSON blob on page load.

The primary risks are foundational data model mistakes that become expensive to fix later: using pixel coordinates instead of normalized (0-1) coordinates (breaks on any image/viewport change), omitting accessibility metadata on edges from day one (forces a migration of every edge later), and building the admin editor without graph connectivity validation (students silently get no-route errors). All three must be addressed in the first phase. Secondary risks are mobile rendering performance (floor plan images are large) and generating human-readable directions (requires proper node labeling and turn-angle calculations, not just node IDs).

## Key Findings

### Recommended Stack

A modern TypeScript SPA stack optimized for interactive 2D graphics and graph operations. Every technology was chosen with specific rationale for this domain — no generic "pick React because it's popular" decisions. All versions verified against npm registry on 2026-02-18.

**Core technologies:**
- **React 19 + TypeScript 5.9 + Vite 7.3**: SPA foundation — declarative UI, compile-time type safety for graph data structures, sub-second HMR for canvas-heavy development
- **Konva 10 + react-konva 19**: 2D canvas rendering — built-in pan/zoom, drag-and-drop, hit detection, layering. Powers both the student map viewer AND admin node editor with one library
- **ngraph.graph + ngraph.path**: Graph data structure + pathfinding — A*/Dijkstra on arbitrary weighted graphs, supports edge filtering for accessible routing, handles 264K nodes in ~44ms (campus needs <500)
- **Hono 4.11**: Lightweight TypeScript-first API server — built-in JWT middleware, CORS, typed routes with end-to-end type safety via `hc` client
- **SQLite via better-sqlite3 + Drizzle ORM**: Zero-config, single-file database — ideal for read-heavy/write-rare campus graph data (~5 tables). Schema-as-code with auto-generated migrations
- **Zustand 5**: Client state — selected nodes, current route, zoom level, editor tool mode. Works outside React render cycle (critical for canvas event handlers)
- **TanStack Query 5**: Server state — graph data fetching, caching, admin mutations
- **Tailwind CSS 4 + Zod 4**: Utility CSS for non-canvas UI; shared validation schemas between client and server

**Critical version constraint:** react-konva@19.x must be used with React 19 (major version tracks React). Do NOT mix react-konva 18 with React 19.

**Key architecture decision:** Pathfinding runs 100% client-side. Server sends full graph JSON (~50-100KB) on initial load, client caches with TanStack Query, pathfinder runs in <1ms. No server compute needed.

See [STACK.md](./STACK.md) for full version matrix, alternatives considered, and "What NOT to Use" list.

### Expected Features

**Must have (table stakes — P1):**
- Interactive 2D floor plan map (pan, zoom, tap-to-select)
- Location search with autocomplete/fuzzy matching
- Shortest path computation (Dijkstra/A* on navigation graph)
- Wheelchair-accessible shortest path (same algorithm, filtered edges)
- Side-by-side dual route display (standard + accessible, color-coded)
- Visual route paths on map + step-by-step text directions
- Route time estimates (standard speed + reduced mobility speed)
- Location details panel (room name, type, info on tap)
- Admin authentication (JWT, single admin role)
- Admin drag-and-drop map editor (node placement, edge creation on floor plan)
- Admin data table view (bulk view/edit node metadata)
- Mobile-responsive design (touch gestures, phone-sized screens)

**Should have (differentiators — P2):**
- Shareable route URLs (encode start/destination in URL params)
- Category-based POI filtering (show only restrooms, elevators, etc.)
- Nearest-X search (find closest restroom/exit from current location)
- Keyboard navigation & screen reader support (WCAG 2.1 AA)
- Print-friendly directions (CSS print stylesheet)
- Admin bulk import/export (JSON/CSV)

**Defer (v2+):**
- Multi-floor navigation (extensible data model from day one, but no UI)
- Multi-building / outdoor campus map
- i18n / multi-language (extract strings early, translate later)
- Timetable/schedule integration

**Anti-features (explicitly avoid):**
- GPS/indoor positioning (requires hardware infrastructure CampusNav doesn't have)
- 3D rendering (adds complexity, no wayfinding benefit for single floor)
- Student accounts/login (friction with no benefit)
- Real-time collaboration / WebSockets (unnecessary for rare admin edits)

See [FEATURES.md](./FEATURES.md) for full competitor analysis, dependency graph, and prioritization matrix.

### Architecture Approach

A clean client-heavy SPA architecture where the server is a thin CRUD layer and all intelligence (pathfinding, direction generation, search) runs in the browser. The system has two distinct frontends — a public student map viewer and an admin map editor — sharing the same canvas library (Konva), graph data model, and API layer.

**Major components:**
1. **Map Viewer (Canvas)** — Renders floor plan image with path overlays, markers, and tap-to-select. Pan/zoom via Konva Stage. Student-facing.
2. **Map Editor (Canvas)** — Admin-only canvas with draggable nodes, click-to-connect edge creation, and property editing sidepanel. Most complex UI.
3. **Pathfinding Engine** — Pure TypeScript module using ngraph.path. Takes graph + start/end + accessible flag, returns path + distance. Runs twice per route request (standard + accessible).
4. **Directions Generator** — Converts ordered node list into human-readable steps. Uses node labels, types, and angle calculations for turn directions.
5. **Search / Location Picker** — Fuzzy search over node labels with autocomplete dropdown. References graph node IDs directly.
6. **API Layer (Hono)** — `GET /api/map` (public, serves graph JSON), `POST/PUT/DELETE /api/admin/*` (auth required), `POST /api/admin/auth` (login).
7. **Data Store (SQLite)** — Two core tables: `nodes` and `edges`. Floor plan images as static files. Graph exported as single JSON blob, cacheable.

**Key patterns:**
- Client-side pathfinding (no server compute for routes)
- Single graph with edge-level accessibility metadata (not two separate graphs)
- Canvas layering: background (floor plan, cached) → paths (redrawn on route change) → markers (redrawn on selection)
- Graph as JSON export: server pre-computes JSON on admin save, client loads single blob

See [ARCHITECTURE.md](./ARCHITECTURE.md) for full component diagram, data flows, project structure, and anti-patterns.

### Critical Pitfalls

1. **Pixel-coordinate drift** — Storing node positions as raw pixel values breaks on any floor plan image change, viewport resize, or mobile rendering. **Prevent:** Use normalized 0.0-1.0 coordinates (percentage of image dimensions). Convert to pixels only at render time. Must be in v1 data model.

2. **Missing accessibility metadata on edges** — A single `weight` field per edge makes accessible routing impossible without a data migration. **Prevent:** Design edge schema from day one with `accessible: boolean`, `standardWeight`, and `accessibleWeight`. This is CampusNav's core differentiator — it cannot be an afterthought.

3. **Disconnected graph / orphan nodes** — Admin accidentally creates unreachable nodes or splits the graph. Students get silent "no route" failures. **Prevent:** Validate graph connectivity on save (BFS from any node). Validate accessible subgraph separately. Highlight orphans in editor.

4. **Floor plan renders poorly on mobile** — Large floor plan images (2-5MB) are slow to load; custom pan/zoom is buggy with touch events; path overlay drifts after zoom transforms. **Prevent:** Use Konva's built-in pan/zoom (Stage draggable + scaleX/scaleY). Optimize images (WebP, multiple resolutions). Test on real phones from day one.

5. **Nonsensical text directions** — Directions say "Go to Node 47" instead of "Turn left at the elevator." **Prevent:** Require `label` and `type` fields on nodes from day one. Implement angle-based turn detection. Collapse straight segments. Use real distance estimates with a calibration scale factor.

See [PITFALLS.md](./PITFALLS.md) for full pitfall analysis, recovery strategies, technical debt patterns, and phase-to-pitfall mapping.

## Implications for Roadmap

Based on combined research across all four files, the following phase structure is recommended. The ordering follows the architecture's dependency chain and front-loads the most critical pitfall prevention.

### Phase 1: Foundation — Data Model, Graph Engine & Floor Plan Rendering
**Rationale:** Everything depends on the graph data model (types, normalized coordinates, accessibility metadata) and the canvas rendering foundation. Architecture research explicitly identifies this as the dependency root. Three of the five critical pitfalls (coordinate drift, missing accessibility metadata, mobile rendering) must be prevented here.
**Delivers:** Graph TypeScript types (Node, Edge with dual weights + accessibility flags, normalized coordinates), pathfinding engine (ngraph.path integration with edge filtering), floor plan canvas rendering with pan/zoom (Konva Stage), and basic route visualization (two colored paths on canvas).
**Features addressed:** Interactive floor plan map, shortest path computation, wheelchair-accessible routing, visual route paths, side-by-side route display
**Pitfalls prevented:** Pixel-coordinate drift (normalized coords), missing accessibility metadata (dual-weight edges), floor plan mobile rendering (Konva built-in pan/zoom)
**Stack elements:** React, TypeScript, Vite, Konva/react-konva, ngraph.graph, ngraph.path, Zustand

### Phase 2: Student Wayfinding Experience
**Rationale:** Once the graph engine and canvas rendering work, the student-facing UI can be composed on top. This delivers the core user value — the actual wayfinding product. Architecture research recommends delivering public-facing MVP before admin tooling.
**Delivers:** Complete student-facing wayfinding page: location search with autocomplete, tap-to-select on map, route comparison panel (standard vs accessible with time estimates), step-by-step text directions, location details panel, mobile-responsive layout.
**Features addressed:** Location search, tap-to-select, step-by-step directions, route time estimates, location details panel, mobile-responsive design
**Pitfalls prevented:** Nonsensical directions (node labels/types + angle-based turns), fuzzy search (not exact match), tap coordinates after zoom (Konva coordinate transforms)
**Stack elements:** React Router, Tailwind CSS, Zod (shared validation), TanStack Query (graph data fetching)

### Phase 3: API & Data Persistence
**Rationale:** Before building the admin editor, the backend CRUD layer must exist. Architecture research identifies the API as a prerequisite for admin features. This is intentionally thin — just graph data persistence, floor plan image serving, and admin auth.
**Delivers:** Hono REST API (`GET /api/map`, admin CRUD endpoints), SQLite database with Drizzle schema (nodes, edges, floor_plans tables), admin JWT authentication, floor plan image upload/serving, graph JSON export (pre-computed on save).
**Features addressed:** Admin authentication, data persistence layer
**Pitfalls prevented:** Admin editor accessible without auth (auth middleware from day one), no input validation (Zod schemas + coordinate range validation)
**Stack elements:** Hono, @hono/node-server, better-sqlite3, Drizzle ORM, drizzle-kit, Zod

### Phase 4: Admin Map Editor
**Rationale:** The admin editor is the most complex UI component (identified in both architecture and features research). It requires the canvas foundation from Phase 1, the API from Phase 3, and benefits from the patterns proven in the student UI (Phase 2). Building it last among core features ensures the data model and rendering are stable.
**Delivers:** Canvas-based drag-and-drop node editor, click-to-connect edge creation, node/edge property editing sidepanel, data table view (sortable, filterable, inline editing), graph connectivity validation on save (BFS), accessible subgraph validation, orphan node highlighting, admin undo capability, graph export/backup.
**Features addressed:** Admin map editor (node/edge placement), admin data table view, admin floor plan image upload
**Pitfalls prevented:** Disconnected graph / orphan nodes (BFS validation on save), no admin undo (accidental deletion recovery), admin produces broken graph (connectivity + accessible subgraph validation)
**Stack elements:** Konva (drag-and-drop, Transformer), TanStack Query (mutations), Zustand (editor tool mode state)

### Phase 5: Polish & Differentiators
**Rationale:** Once all core features are functional, add the low-cost differentiators that increase product quality and competitive positioning. These are all additive — they enhance existing functionality without changing architecture.
**Delivers:** Shareable route URLs (URL params encoding), category-based POI filtering, nearest-X search, print-friendly directions (CSS print stylesheet), WCAG 2.1 AA improvements (ARIA labels, keyboard navigation, screen reader support).
**Features addressed:** Shareable URLs, POI filtering, nearest-X search, print directions, accessibility (WCAG), admin bulk import/export
**Pitfalls prevented:** None new — this phase benefits from all prior pitfall prevention

### Phase Ordering Rationale

- **Dependency-driven:** The architecture research's build order analysis shows a clear chain: Graph Model → Pathfinding → Canvas → Student UI → API → Admin Editor. The phases follow this exactly.
- **Value-first:** The student wayfinding experience (Phase 2) is prioritized before admin tooling (Phase 4) because it delivers user value. During development, graph data can be seeded via scripts or JSON files — the admin editor isn't needed for the student MVP to work.
- **Pitfall front-loading:** All three foundational pitfalls (coordinates, accessibility schema, mobile rendering) are addressed in Phase 1 before any feature code is written. This prevents the most expensive rework.
- **Complexity isolation:** The admin editor (highest complexity feature per FEATURES.md) is isolated in Phase 4, after the canvas, data model, and API patterns are all proven. This reduces integration risk.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1 (Foundation):** Needs research on ngraph.path API specifics — how to implement edge filtering for accessible routes, how to construct the graph from JSON, exact Konva Stage pan/zoom configuration for mobile touch events.
- **Phase 4 (Admin Editor):** Most complex UI in the app. Needs research on Konva drag-and-drop patterns, Transformer for node resizing, click-to-connect edge creation UX, and BFS connectivity validation implementation.

Phases with standard patterns (likely can skip deep research):
- **Phase 2 (Student UI):** Standard React component composition, search/autocomplete patterns, responsive design with Tailwind — well-documented.
- **Phase 3 (API):** Standard CRUD API with Hono, SQLite + Drizzle, JWT auth — extremely well-documented, established patterns.
- **Phase 5 (Polish):** URL encoding, CSS print stylesheets, ARIA labels — standard web development.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified against npm registry. Compatibility matrix confirmed. Konva + ngraph.path are well-suited and actively maintained. |
| Features | HIGH | Feature set validated against three enterprise competitors (Mappedin, MazeMap, ArcGIS Indoors). Clear table-stakes vs differentiators. Dependency graph is logical. |
| Architecture | HIGH | Client-side pathfinding for small graphs is an established pattern. Component boundaries are clean. Build order follows dependency analysis. |
| Pitfalls | HIGH | Pitfalls are domain-specific and actionable. Coordinate normalization, accessibility-first data model, and graph validation are well-established best practices in indoor navigation. |

**Overall confidence:** HIGH

### Gaps to Address

- **Direction generation algorithm:** The angle-based turn detection and segment collapsing logic needs detailed implementation research during Phase 2 planning. The concept is well-understood but the specific thresholds and edge cases (U-turns, slight curves, hallway junctions with multiple exits) need experimentation.
- **Floor plan image optimization pipeline:** Research identified the need for WebP conversion and multiple resolutions, but the exact pipeline (build-time vs upload-time processing, image dimension limits, compression settings) needs specification during Phase 3/4 planning.
- **Distance calibration:** Converting pixel/normalized distances to real-world meters requires a scale factor. How the admin sets this (known hallway length, two-point calibration) needs UX research during Phase 4 planning.
- **Hidden navigation nodes:** PROJECT.md specifies nodes for ramps/stairs should be invisible to students but exist in the graph. The exact rendering logic (which node types to show/hide) and admin editor UX for this distinction needs definition.
- **Undo/redo in admin editor:** Identified as critical in pitfalls research but implementation approach (command pattern, state snapshots, Zustand middleware) is unresearched.

## Sources

### Primary (HIGH confidence)
- npm registry — All 20+ package versions verified directly (React, Konva, ngraph, Hono, SQLite, Drizzle, Zustand, TanStack Query, Zod, Vite, etc.)
- ngraph.path GitHub README — A*/NBA*/Dijkstra API, performance benchmarks (264K nodes / 733K edges in ~44ms)
- Konva.js official docs — Canvas layers, drag-and-drop, hit detection, React integration
- ArcGIS Indoors product page — Enterprise indoor wayfinding features, Rutgers University case study
- WCAG 2.1 W3C documentation — Accessibility standards
- Graph theory fundamentals — Dijkstra's algorithm, BFS connectivity, graph data structures

### Secondary (MEDIUM confidence)
- Mappedin marketing pages — Wayfinding features, accessibility emphasis, step-by-step directions
- MazeMap marketing pages — Campus wayfinding features, education use cases, accessibility blog
- Wayfinding UX research — Lynch (1960), Passini (1984), Arthur & Passini (1992) via Wikipedia
- Fuse.js — Fuzzy search library recommendation (from general knowledge, not verified for this project)

### Tertiary (LOW confidence)
- None — all research areas had strong primary or secondary sources

---
*Research completed: 2026-02-18*
*Ready for roadmap: yes*
