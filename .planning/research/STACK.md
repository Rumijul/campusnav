# Stack Research

**Domain:** Campus indoor wayfinding web application
**Researched:** 2026-02-18
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| React | 19.2.x | UI framework | Declarative component model maps perfectly to interactive map + admin editor UIs. react-konva provides first-class React bindings for canvas rendering. Dominant ecosystem ensures library compatibility. |
| TypeScript | 5.9.x | Type safety | Graph data structures (nodes, edges, weights) and pathfinding algorithms are error-prone without types. TS catches coordinate/ID mismatches at compile time that would be runtime bugs in JS. |
| Vite | 7.3.x | Build tool / dev server | Sub-second HMR for the canvas-heavy app. Native ESM, no config needed for React+TS. Dramatically faster than webpack/Next.js dev server for a SPA. |
| Konva + react-konva | 10.2.x / 19.2.x | 2D canvas rendering | Purpose-built for interactive 2D graphics with React. Built-in drag-and-drop, hit detection, layering, zoom/pan (Stage draggable + scaleX/Y), image rendering, shape primitives (Line, Circle, Rect, Text, Arrow). Covers both the student floor plan viewer AND the admin drag-and-drop node editor with one library. 82K+ weekly npm downloads for the pathfinding lib and Konva is battle-tested. |
| ngraph.graph + ngraph.path | 20.1.x / 1.6.x | Graph data structure + pathfinding | Purpose-built graph library with A*, NBA* (bidirectional optimal A*), Dijkstra, and A*-greedy. Supports weighted edges, custom distance/heuristic functions, oriented graphs, and blocked paths. Handles 264K nodes / 733K edges in ~44ms (NBA*). Perfect for campus wayfinding: model hallways as weighted edges, intersections as nodes, add wheelchair-accessible weights as alternate edge costs. Separation of graph (ngraph.graph) from pathfinding (ngraph.path) is clean architecture. |
| Hono | 4.11.x | API server | Lightweight, TypeScript-first web framework. Built-in JWT middleware for admin auth, CORS, validation. Runs on Node.js via @hono/node-server. ~14KB, fast startup. Typed routes share types with the React frontend (end-to-end type safety via hc client). Far simpler than Express for a focused API. |
| SQLite via better-sqlite3 | 12.6.x | Database | Synchronous, zero-config, single-file database. Perfect for a campus app: the graph data (nodes, edges, floor plan metadata) is modest in size, read-heavy (students querying routes), write-rare (admin edits). No database server to manage. File-based = trivially portable. |
| Drizzle ORM + drizzle-kit | 0.45.x / 0.31.x | Database ORM + migrations | TypeScript-first, SQL-like query builder. Schema-as-code with auto-generated migrations. Lightweight (no heavy runtime like Prisma). Works perfectly with better-sqlite3. Type-safe queries prevent SQL injection and column name typos. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Zustand | 5.0.x | Client state management | For map interaction state: selected nodes, current route, zoom level, pan offset, editor tool mode. Minimal boilerplate, works outside React components (useful for canvas event handlers). |
| @tanstack/react-query | 5.90.x | Server state / data fetching | For fetching graph data, floor plan images, location lists from the API. Handles caching, background refetch, loading/error states. Admin editor uses mutations for saving graph edits. |
| Zod | 4.3.x | Schema validation | Validate API request/response bodies (shared between Hono server + React client). Validate admin editor inputs (node coordinates, edge weights). Single source of truth for data shapes. |
| use-image | 1.1.x | Image loading for Konva | React hook that loads floor plan images for use with Konva's `<Image>` component. Handles loading states cleanly. From the Konva team. |
| React Router | 7.13.x | Client-side routing | Route between student view (`/`), admin login (`/admin/login`), admin editor (`/admin/editor`). SPA mode only -- no SSR needed. |
| Tailwind CSS | 4.1.x | Utility CSS | For the non-canvas UI: search bars, location lists, step-by-step directions panel, admin controls, login form. v4 is CSS-first (no config file), works with Vite out of the box. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Vitest | 4.0.x | Unit/integration testing | Same config as Vite, fast, native TS support. Test pathfinding algorithms, graph operations, API routes. |
| TypeScript | 5.9.x | Type checking | Strict mode. Graph types are the backbone of correctness. |
| ESLint | 9.x | Linting | Flat config. @typescript-eslint for TS rules. |
| Prettier | 3.x | Formatting | Consistent code style. |

## Installation

```bash
# Core frontend
npm install react react-dom react-konva konva use-image
npm install react-router zustand @tanstack/react-query
npm install tailwindcss

# Pathfinding engine (runs client-side)
npm install ngraph.graph ngraph.path

# Validation (shared frontend + backend)
npm install zod

# Backend
npm install hono @hono/node-server
npm install drizzle-orm better-sqlite3

# Dev dependencies
npm install -D typescript @types/react @types/react-dom @types/better-sqlite3
npm install -D vite @vitejs/plugin-react
npm install -D vitest
npm install -D drizzle-kit
npm install -D eslint prettier
npm install -D @tailwindcss/vite
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Konva + react-konva | Fabric.js | If you need advanced image manipulation (cropping, filters on photos). For our use case (interactive shapes on a floor plan), Konva's React integration and simpler API win. Fabric.js lacks official React bindings and has a more complex object model. |
| Konva + react-konva | SVG (raw or react-svg-pan-zoom) | If your floor plan has <500 elements and you want DOM-based accessibility/SEO. Canvas (Konva) is better when rendering hundreds of nodes/edges with pan/zoom on mobile -- no DOM node overhead. |
| Konva + react-konva | PixiJS (react-pixi) | If you need WebGL-level performance (10K+ animated sprites). Overkill for a floor plan with ~100-500 static shapes. PixiJS is game-oriented, not editor-oriented. |
| ngraph.path | pathfinding (npm) | If you need a grid-based pathfinder (roguelike games). pathfinding@0.4.18 is grid-only, 10 years unmaintained. ngraph.path works with arbitrary graphs (our hallway network is a graph, not a grid). |
| ngraph.path | Custom Dijkstra/A* | If the graph is trivially small (<20 nodes). But even then, ngraph.path is well-tested and the API is clean. Don't reinvent pathfinding. |
| Hono | Express.js | If you need vast middleware ecosystem or are already familiar. But Express is untyped, heavier, and its ecosystem is stale. Hono is the modern TypeScript-first choice. |
| Hono | Next.js API routes | If you want SSR for the student-facing pages. But this app is a SPA (canvas-heavy, no SEO needs, no server rendering of routes). Next.js adds complexity with no benefit here. |
| SQLite + better-sqlite3 | PostgreSQL | If you expect multi-server deployments or concurrent admin editors. For a single-campus app with one admin, SQLite is simpler, faster for reads, and zero-ops. |
| Drizzle ORM | Prisma | If you prefer a more opinionated ORM with GUI tools. But Prisma has a heavy binary runtime, slower cold starts, and is overkill for ~5 tables. Drizzle is lighter and more SQL-transparent. |
| Zustand | Redux Toolkit | If you need devtools time-travel for debugging complex state. But our state is straightforward (selected node, current path, zoom). Zustand's minimal API is better here. |
| Zustand | React Context | If state is only needed in a small subtree. But canvas event handlers run outside React's render cycle -- Zustand's `getState()` works there, Context doesn't. |
| Vite | Next.js | If you need SSR/ISR, file-based routing, or serverless deployment. This is a canvas SPA -- none of those apply. Vite is simpler and faster for pure SPAs. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Leaflet / Mapbox GL | These are geographic map libraries. They expect lat/lng coordinates, tile servers, and real-world geography. A campus floor plan is a custom image with pixel coordinates. Forcing Leaflet to work with a floor plan image is a common mistake that leads to coordinate system hell. | Konva with floor plan as background `<Image>`. Pan/zoom via Stage `draggable` + `scaleX`/`scaleY`. |
| D3.js (for rendering) | D3 is brilliant for data visualization but creates SVG/DOM elements. For an interactive editor with drag-and-drop on 100+ nodes, DOM-per-element causes performance issues on mobile. D3's imperative API also clashes with React's declarative model. | Konva for rendering. You *could* use D3's math utilities (d3-scale, d3-zoom) but react-konva already handles zoom/pan. |
| Three.js / React Three Fiber | 3D rendering library. The project is explicitly 2D floor plans. Three.js adds enormous complexity (camera, lighting, materials) for zero benefit. | Konva for 2D canvas. |
| Socket.io / WebSockets | Real-time sync is unnecessary. Students read routes (GET). Admin saves edits (POST/PUT). No collaboration, no live updates needed. WebSockets add server complexity for nothing. | Standard REST API via Hono. |
| Firebase / Supabase | BaaS platforms add vendor lock-in and cost for a simple CRUD + graph storage use case. The data model (graph nodes/edges) doesn't fit well into Firebase's document model. | SQLite + Hono API. Self-hosted, free, simple. |
| pathfinding npm package | Grid-based only (2D grid of walkable/blocked cells). Campus hallways are a graph (corridors with varying lengths, intersections at arbitrary angles). Grid-based pathfinding would require rasterizing the floor plan -- lossy, memory-heavy, and inaccurate for non-rectangular corridors. Last published 10 years ago. | ngraph.path with ngraph.graph -- true graph-based pathfinding. |
| Next.js | Adds SSR, file-based routing, and server components. A canvas-heavy SPA with admin auth doesn't benefit from SSR. Next.js's app router adds learning overhead and build complexity. The floor plan canvas cannot be server-rendered. | Vite + React Router for the SPA, Hono for the API as a separate process. |

## Stack Patterns by Variant

**If scaling to multi-floor (future v2):**
- Add a `floor` field to nodes/edges in the graph
- Add "floor transition" edges (elevators/stairs) with special metadata
- Use Konva Layer switching per floor in the UI
- No stack changes needed -- ngraph handles it naturally as one connected graph

**If adding real-time collaborative editing (unlikely but possible):**
- Add Hono WebSocket support (`hono/ws`)
- Use Y.js for conflict-free state sync
- Replace SQLite with PostgreSQL for concurrent writes
- Stack change: moderate (add Y.js + ws, swap DB)

**If deploying as a static site with no server:**
- Pre-compute graph data as JSON files
- Remove Hono/SQLite/Drizzle entirely
- Pathfinding runs 100% client-side (ngraph.path in browser)
- Admin editor writes JSON files (or use a separate admin tool)
- This is viable for v1 MVP if you want zero ops

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| react@19.2.x | react-konva@19.2.x | react-konva 19.x is specifically built for React 19. The major version tracks React's major version. Do NOT use react-konva 18.x with React 19. |
| konva@10.2.x | react-konva@19.2.x | react-konva 19.x supports konva ^10.0.0. Verified in peerDependencies. |
| react@19.2.x | react-router@7.13.x | React Router 7.x supports React 18+. |
| react@19.2.x | zustand@5.0.x | Zustand 5.x supports React 18+. |
| react@19.2.x | @tanstack/react-query@5.90.x | TanStack Query 5.x supports React 18+. |
| drizzle-orm@0.45.x | drizzle-kit@0.31.x | drizzle-kit is the migration CLI companion for drizzle-orm. Keep them updated together. |
| drizzle-orm@0.45.x | better-sqlite3@12.6.x | Drizzle has first-class better-sqlite3 driver support. |
| hono@4.11.x | @hono/node-server@1.19.x | Node adapter for running Hono on Node.js. Required since Hono targets Web Standards by default. |
| vite@7.3.x | vitest@4.0.x | Vitest 4.x supports Vite 6+ and 7+. Shares Vite config. |
| tailwindcss@4.1.x | @tailwindcss/vite | TW v4 uses a Vite plugin instead of PostCSS config. |

## Key Architecture Decision: Client-Side Pathfinding

The pathfinding engine (ngraph.graph + ngraph.path) runs **entirely in the browser**, not on the server. Rationale:

1. **Performance**: ngraph.path solves paths in <1ms for campus-sized graphs (~500 nodes). No network round-trip latency.
2. **Offline potential**: Once graph data is loaded, pathfinding works without connectivity.
3. **Server simplicity**: The API is just CRUD for graph data + admin auth. No compute-heavy pathfinding endpoint.
4. **Dual paths**: Computing both standard and wheelchair-accessible routes simultaneously is trivial client-side (run pathfinder twice with different edge weights). Would be wasteful as two API calls.

The server sends the full graph on initial load (~50-100KB JSON for a campus). The client caches it with TanStack Query.

## Sources

- npm registry: `react@19.2.4` — verified latest version (HIGH confidence)
- npm registry: `konva@10.2.0` — verified latest version (HIGH confidence)
- npm registry: `react-konva@19.2.2` — verified latest, peer deps confirm React 19 + Konva 10 compat (HIGH confidence)
- npm registry: `ngraph.path@1.6.1` — verified latest, graph-based A*/NBA*/Dijkstra (HIGH confidence)
- npm registry: `ngraph.graph@20.1.2` — verified latest, companion to ngraph.path (HIGH confidence)
- npm registry: `hono@4.11.9` — verified latest, TS-first web framework (HIGH confidence)
- npm registry: `@hono/node-server@1.19.9` — Node.js adapter for Hono (HIGH confidence)
- npm registry: `better-sqlite3@12.6.2` — verified latest (HIGH confidence)
- npm registry: `drizzle-orm@0.45.1` — verified latest (HIGH confidence)
- npm registry: `drizzle-kit@0.31.9` — verified latest (HIGH confidence)
- npm registry: `zustand@5.0.11` — verified latest (HIGH confidence)
- npm registry: `@tanstack/react-query@5.90.21` — verified latest (HIGH confidence)
- npm registry: `zod@4.3.6` — verified latest, v4 is current stable (HIGH confidence)
- npm registry: `react-router@7.13.0` — verified latest (HIGH confidence)
- npm registry: `tailwindcss@4.1.18` — verified latest, v4 CSS-first (HIGH confidence)
- npm registry: `vite@7.3.1` — verified latest (HIGH confidence)
- npm registry: `vitest@4.0.18` — verified latest (HIGH confidence)
- npm registry: `typescript@5.9.3` — verified latest (HIGH confidence)
- npm registry: `use-image@1.1.4` — verified latest, from Konva team (HIGH confidence)
- npm registry: `pathfinding@0.4.18` — verified: grid-only, last published 10 years ago (HIGH confidence, confirmed NOT suitable)
- GitHub: ngraph.path README — A*/NBA*/Dijkstra API, performance benchmarks on NYC road graph (HIGH confidence)
- Konva official docs: react-konva getting started, drag-and-drop, transformer — confirmed drag-and-drop and interactive editing capabilities (HIGH confidence)

---
*Stack research for: CampusNav — campus indoor wayfinding web application*
*Researched: 2026-02-18*
