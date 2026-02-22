# CampusNav

A web-based campus wayfinding application. Students find the quickest route between two points on a 2D floor plan — by tapping the map or searching room names — and get both a standard route and a wheelchair-accessible route displayed side by side, with a visual path drawn on the map and step-by-step directions.

No login required for students. Admin-only authentication protects the map editor.

---

## Features

**Student (public)**
- Interactive 2D floor plan with pan and zoom
- Tap a landmark or search by room name to set start/destination
- Shortest-path routing (Dijkstra/A* via ngraph.path, runs client-side)
- Standard and wheelchair-accessible routes displayed simultaneously
- Visual route drawn on the map + step-by-step text directions

**Admin (authenticated)**
- JWT login — no student accounts
- Visual drag-and-drop node placement on the floor plan
- Two-click edge creation between nodes with distance and accessibility metadata
- Upload a new floor plan image
- Node and edge data table for precise editing
- Save/export graph data; changes reflect on student view on next load

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend framework | React 19 + TypeScript |
| Build tool | Vite 7 |
| Canvas / map rendering | Konva 10 + react-konva |
| Pathfinding | ngraph.graph + ngraph.path (client-side) |
| Styling | Tailwind CSS 4 |
| Client routing | React Router 7 |
| Client state | Zustand 5 |
| Server state / fetching | TanStack Query 5 |
| Validation | Zod 4 |
| API server | Hono 4 (Node.js via @hono/node-server) |
| Database | SQLite via better-sqlite3 |
| ORM / migrations | Drizzle ORM + drizzle-kit |
| Auth | JWT + bcryptjs |
| Linting / formatting | Biome |
| Testing | Vitest |

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Install

```bash
npm install
```

### Environment

Create a `.env` file in the project root:

```env
JWT_SECRET=your-secret-here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-password-here
```

### Run (development)

```bash
npm run dev
```

This starts both the Vite dev server (client) and the Hono API server concurrently.

- Client: `http://localhost:5173`
- API: `http://localhost:3000`
- Admin panel: `http://localhost:5173/admin`

---

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start client + server in watch mode |
| `npm run dev:client` | Vite dev server only |
| `npm run dev:server` | Hono API server only (tsx watch) |
| `npm run build` | Type-check + production build |
| `npm start` | Run production server |
| `npm run lint` | Biome check |
| `npm run lint:fix` | Biome check with auto-fix |
| `npm run format` | Biome format |
| `npm run typecheck` | TypeScript type-check only |
| `npm test` | Vitest |

---

## Architecture

```
Browser (SPA)                     Node.js Server
─────────────────────────         ──────────────────────
React + Konva canvas              Hono API
  └─ floor plan rendering           └─ GET  /api/map          (public)
  └─ landmark markers                └─ POST /api/admin/login
  └─ route path drawing              └─ POST /api/admin/graph  (JWT)
                                     └─ POST /api/admin/floor-plan (JWT)
ngraph.path (pathfinding)
  └─ loads graph from API        SQLite (better-sqlite3 + Drizzle)
  └─ runs A* in browser            └─ nodes table
  └─ computes 2 routes             └─ edges table
     (standard + accessible)       └─ settings (floor plan path)
```

Pathfinding runs entirely in the browser. The API serves graph data as JSON on load (~50–100 KB); the client caches it with TanStack Query. No pathfinding requests hit the server.

---

## Project Structure

```
src/
  client/          # React SPA
    components/    # Canvas layers, search, directions panel, admin editor
    hooks/         # useGraphData, useRouteSelection, useEditorState, ...
    lib/           # PathfindingEngine, graph utilities
    pages/         # StudentView, AdminLogin, AdminEditor
    store/         # Zustand stores
  server/          # Hono API
    db/            # Drizzle schema, migrations, seed
    routes/        # /api/map, /api/admin/*
    assets/        # Floor plan image storage
  shared/          # Zod schemas shared between client and server
```

---

## Scope (v1)

- Single floor only (multi-floor architecture is graph-extensible, deferred to v2)
- No GPS or live location tracking
- No student accounts
- Web-first; no native mobile app
