# Phase 1: Project Setup & Foundation - Research

**Researched:** 2026-02-18
**Domain:** Project scaffolding, dev tooling, TypeScript data model, Konva canvas setup
**Confidence:** HIGH

## Summary

Phase 1 scaffolds the CampusNav project from zero: a React 19 + Vite 7 SPA frontend, a Hono 4 API backend, shared TypeScript types, a hello-world Konva canvas, and a working lint/format/typecheck pipeline. The key decisions are (1) project structure — a flat single-project layout with `src/client`, `src/server`, `src/shared` folders is simplest for this scale; (2) dev workflow — `concurrently` running Vite dev server and a tsx-watched Hono server with Vite proxy forwarding `/api` requests; (3) data model — TypeScript types for `NavNode`, `NavEdge`, and `NavGraph` designed to map directly onto ngraph.graph's `addNode(id, data)` / `addLink(from, to, data)` API with normalized 0-1 coordinates and dual weights.

The biggest risk in this phase is getting the React 19 + react-konva 19 compatibility right (react-konva@19.x must be used with React 19, not react-konva@18.x). The second risk is over-engineering the project structure — npm workspaces add complexity that isn't needed when a simple `src/shared/` folder achieves type sharing between client and server via path aliases.

**Primary recommendation:** Use a single-project flat structure with `concurrently` for dev, npm as package manager, and Biome for linting+formatting (single tool, zero config for TS+React).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Project folder and repo name: `campusnav` (lowercase)

### Claude's Discretion
- Monorepo vs single project structure
- Package manager choice (npm, pnpm, or bun)
- Dev server configuration (single vs multi-terminal)
- Node data shape (fields, types, metadata — informed by research: normalized 0-1 coordinates, node types, accessibility flags)
- Edge data shape (weight, accessible weight, bidirectional — informed by research: dual weights for accessibility routing)
- Coordinate system design (research strongly recommends normalized 0-1 coordinates over pixel coordinates)
- Linting and formatting configuration
- Testing framework choice

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

## Standard Stack

### Core (Phase 1 Only — What Gets Installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react | 19.2.x | UI framework | Locked decision from stack research |
| react-dom | 19.2.x | React DOM renderer | Required peer for React 19 |
| react-konva | 19.2.x | React bindings for Konva canvas | **Must** be v19.x to match React 19. Verified via npm peerDependencies. |
| konva | 10.2.x | 2D canvas library | Paired with react-konva |
| hono | 4.11.x | API server framework | TypeScript-first, lightweight |
| @hono/node-server | 1.19.x | Node.js adapter for Hono | Required to run Hono on Node.js |
| zod | 4.3.x | Schema validation | Shared validation between client/server (Phase 1: type definitions only) |
| typescript | 5.9.x | Type checking | Strict mode, project backbone |
| vite | 7.3.x | Build tool / dev server | Frontend dev server with HMR |
| @vitejs/plugin-react | latest | React support for Vite | Required for JSX transform, Fast Refresh |
| tailwindcss | 4.1.x | Utility CSS | CSS-first config in v4 |
| @tailwindcss/vite | latest | Tailwind Vite plugin | TW v4 uses Vite plugin, not PostCSS |

### Dev Dependencies (Phase 1)

| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| @biomejs/biome | 2.x | Linting + formatting | Single tool replacing ESLint + Prettier |
| concurrently | latest | Run multiple dev processes | Runs Vite + Hono dev server simultaneously |
| tsx | latest | TypeScript execution | Runs Hono server in dev with watch mode |
| @types/react | latest | React type definitions | |
| @types/react-dom | latest | React DOM type definitions | |
| vitest | 4.0.x | Testing framework | Shares Vite config, native TS support |

### Deferred Libraries (NOT Phase 1)

| Library | Phase | Why Deferred |
|---------|-------|-------------|
| ngraph.graph, ngraph.path | Phase 3 | Pathfinding engine — types defined now, library installed when needed |
| better-sqlite3, drizzle-orm | Phase 7 | Database — not needed until API persistence |
| zustand | Phase 2+ | State management — not needed for hello world |
| @tanstack/react-query | Phase 7+ | Server state — not needed until API exists |
| react-router | Phase 2+ | Routing — single page in Phase 1 |
| use-image | Phase 2 | Floor plan image loading |

### Installation Commands

```bash
# Create project
mkdir campusnav && cd campusnav
npm init -y

# Core frontend
npm install react@19 react-dom@19 react-konva@19 konva@10

# Backend
npm install hono @hono/node-server

# Shared
npm install zod

# CSS
npm install tailwindcss @tailwindcss/vite

# Dev dependencies
npm install -D typescript @types/react @types/react-dom
npm install -D vite @vitejs/plugin-react
npm install -D @biomejs/biome
npm install -D concurrently tsx
npm install -D vitest
```

## Architecture Patterns

### Recommended Project Structure (Single Project, Flat Layout)

```
campusnav/
├── public/
│   └── floorplans/          # Static floor plan images (placeholder in Phase 1)
├── src/
│   ├── client/              # React SPA
│   │   ├── App.tsx          # Root component with hello-world Konva canvas
│   │   ├── main.tsx         # Vite entry point, renders <App />
│   │   └── style.css        # Tailwind @import
│   ├── server/              # Hono API
│   │   └── index.ts         # Hono app with hello world route
│   └── shared/              # Shared between client & server
│       └── types.ts         # NavNode, NavEdge, NavGraph type definitions
├── index.html               # Vite HTML entry point
├── vite.config.ts           # Vite config with React plugin, Tailwind, proxy
├── tsconfig.json            # Shared TS config (strict mode)
├── tsconfig.client.json     # Client-specific TS config (extends base)
├── tsconfig.server.json     # Server-specific TS config (extends base)
├── biome.json               # Biome linting + formatting config
├── package.json             # Scripts, dependencies
└── .gitignore
```

### Why Single Project (NOT Monorepo)

**Recommendation: Single project with `src/shared/` folder.** Confidence: HIGH.

| Approach | Complexity | Type Sharing | Tooling | Verdict |
|----------|-----------|--------------|---------|---------|
| **Single project** (recommended) | LOW — one `package.json`, one `node_modules` | Direct imports from `src/shared/` via TS path aliases | Single Vite config, single Biome config | ✅ Best for this scale |
| npm workspaces | MEDIUM — multiple `package.json`, hoisted `node_modules` | Requires building `shared` package or TS project references | Each workspace needs its own config or shared presets | ❌ Overkill for 2-person project |
| pnpm workspaces | MEDIUM-HIGH — same as npm workspaces plus pnpm-specific quirks | Same as above | Same as above | ❌ Overkill |
| Turborepo | HIGH — adds build orchestration layer | Same as workspaces | Turbo config + workspace configs | ❌ Way overkill |

**Rationale:** The client and server share only type definitions (in Phase 1) and later Zod schemas. A `src/shared/` folder with TypeScript path aliases (`@shared/*`) gives identical type sharing without any monorepo tooling. Both `vite.config.ts` and `tsconfig.json` can resolve `@shared/*` to `src/shared/*`. This is the pattern used by most small-to-medium full-stack Vite projects.

### Pattern 1: Dev Server with Concurrently + Vite Proxy

**What:** Run two processes — Vite dev server (port 5173) for the React SPA, and tsx watching the Hono server (port 3001) — coordinated by `concurrently`. Vite's built-in proxy forwards `/api/*` requests to the Hono server.

**Why not `@hono/vite-dev-server`?** That plugin is designed for Hono-served HTML apps (SSR pattern) where Hono serves the HTML and Vite provides HMR. Our app is a React SPA served by Vite, with Hono as a separate API. The plugin would require restructuring Hono to serve the React app, which conflicts with our SPA architecture. The proxy approach keeps them cleanly separated.

**Configuration:**

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'src/shared'),
      '@client': resolve(__dirname, 'src/client'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
```

```jsonc
// package.json scripts
{
  "scripts": {
    "dev": "concurrently -n client,server -c blue,green \"npm run dev:client\" \"npm run dev:server\"",
    "dev:client": "vite",
    "dev:server": "tsx watch src/server/index.ts",
    "build": "tsc -b && vite build",
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "format": "biome format --write .",
    "typecheck": "tsc --noEmit",
    "test": "vitest"
  }
}
```

```typescript
// src/server/index.ts
import { serve } from '@hono/node-server'
import { Hono } from 'hono'

const app = new Hono()

app.get('/api/health', (c) => c.json({ status: 'ok' }))

const port = 3001
console.log(`Server running on http://localhost:${port}`)
serve({ fetch: app.fetch, port })
```

**Confidence:** HIGH — this is the standard pattern for Vite SPA + separate API server. Vite's proxy is well-documented and battle-tested. `concurrently` has 4M+ weekly npm downloads.

### Pattern 2: TypeScript Path Aliases for Shared Code

**What:** Use `compilerOptions.paths` in tsconfig.json and `resolve.alias` in vite.config.ts to enable `@shared/types` imports from both client and server code.

```jsonc
// tsconfig.json (base)
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@shared/*": ["src/shared/*"],
      "@client/*": ["src/client/*"]
    }
  },
  "include": ["src"]
}
```

**Note on tsconfig splitting:** A single `tsconfig.json` with `"include": ["src"]` works for Phase 1 since we only need type checking. If client/server need different `lib` or `types` settings later, extend with `tsconfig.client.json` / `tsconfig.server.json` that use `"extends": "./tsconfig.json"`. For now, keep it simple.

**Confidence:** HIGH — TypeScript path aliases with Vite resolve.alias is the standard approach.

### Anti-Patterns to Avoid

- **Don't install ALL libraries upfront:** Only install what Phase 1 needs. Installing ngraph, drizzle, better-sqlite3, etc. adds unused dependencies and potential version conflicts.
- **Don't use `@hono/vite-dev-server` for a SPA + API setup:** That plugin is for Hono-served apps, not for a Vite SPA with a separate Hono API.
- **Don't create a monorepo for shared types:** A `src/shared/` folder with path aliases is sufficient.
- **Don't use ESLint + Prettier when Biome does both:** Biome is faster, zero-dependency, and handles both linting and formatting in one tool.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Run multiple dev processes | Custom shell scripts | `concurrently` npm package | Handles process coordination, colored output, exit codes |
| API proxy in development | Custom middleware | Vite's built-in `server.proxy` | Battle-tested, handles WebSocket, configurable |
| TypeScript execution for dev server | Custom build step | `tsx` (or `ts-node`) | Zero-config TS execution with watch mode, fast esbuild-based |
| Linting + formatting | ESLint + Prettier (two tools, many plugins) | Biome (single tool) | Single binary, no plugin ecosystem to manage, handles both jobs |
| React HMR | Custom HMR handler | `@vitejs/plugin-react` | Provides Fast Refresh out of the box |

## TypeScript Data Model

### ngraph.graph API Shape (Critical for Type Design)

**Source:** ngraph.graph `index.d.ts` (verified from GitHub, HIGH confidence)

ngraph.graph uses a generic type system:

```typescript
// How ngraph.graph works:
import createGraph from 'ngraph.graph'

// Create a typed graph:
const graph = createGraph<NodeData, LinkData>()

// Add nodes: graph.addNode(id: string | number, data?: NodeData)
graph.addNode('n1', { x: 0.5, y: 0.3, label: 'Main Entrance', ... })

// Add links: graph.addLink(from: NodeId, to: NodeId, data?: LinkData)  
graph.addLink('n1', 'n2', { standardWeight: 45, accessibleWeight: 60, ... })

// Node structure returned:
// { id: NodeId, data: NodeData, links: Set<Link> | null }

// Link structure returned:
// { id: LinkId, fromId: NodeId, toId: NodeId, data: LinkData }
```

**Key insight:** ngraph stores our custom data in `node.data` and `link.data`. Our TypeScript types define the shape of these `data` fields, NOT the full ngraph node/link objects.

### ngraph.path API Shape (Critical for Weight Functions)

**Source:** ngraph.path `index.d.ts` (verified from GitHub, HIGH confidence)

```typescript
import { aStar, nba } from 'ngraph.path'

const pathFinder = nba(graph, {
  // Distance function receives full Node objects with .data
  distance(fromNode, toNode, link) {
    // link.data contains our edge data (weights)
    return link.data.standardWeight  // or link.data.accessibleWeight
  },
  
  // Heuristic for A* — uses node coordinates for estimation
  heuristic(fromNode, toNode) {
    const dx = fromNode.data.x - toNode.data.x
    const dy = fromNode.data.y - toNode.data.y
    return Math.sqrt(dx * dx + dy * dy)
  },
  
  // Blocked function — filter out inaccessible edges
  blocked(fromNode, toNode, link) {
    return !link.data.accessible  // true = blocked
  }
})

const path = pathFinder.find('n1', 'n2') // Returns Node[] (array of ngraph nodes)
```

### Recommended Type Definitions

```typescript
// src/shared/types.ts

// ============================================================
// Node Types
// ============================================================

/** 
 * Types of navigation nodes on the floor plan.
 * 'landmark' nodes are visible to students (rooms, entrances, POIs).
 * Other types are navigation-only (invisible on student map).
 */
export type NavNodeType =
  | 'room'           // Classroom, office, lab — searchable destination
  | 'entrance'       // Building entrance/exit — searchable
  | 'elevator'       // Elevator — accessibility waypoint
  | 'stairs'         // Stairwell — navigation waypoint
  | 'ramp'           // Ramp — accessibility waypoint
  | 'restroom'       // Restroom — searchable POI
  | 'junction'       // Hallway intersection — invisible navigation node
  | 'hallway'        // Mid-hallway point — invisible navigation node
  | 'landmark'       // Named landmark (cafeteria, library) — searchable

/**
 * Data stored on each graph node.
 * These are the `.data` field of ngraph.graph Node objects.
 * 
 * Coordinates are NORMALIZED (0.0 to 1.0) representing percentage
 * of floor plan image width/height. Convert to pixels only at render time.
 */
export interface NavNodeData {
  /** Normalized x position (0.0 = left edge, 1.0 = right edge) */
  x: number
  /** Normalized y position (0.0 = top edge, 1.0 = bottom edge) */
  y: number
  /** Display label for directions and search ("Room 204", "Main Entrance") */
  label: string
  /** Node classification — determines visibility and search behavior */
  type: NavNodeType
  /** Whether this node appears in student search results */
  searchable: boolean
  /** Floor number (for future multi-floor support) */
  floor: number
}

// ============================================================
// Edge Types
// ============================================================

/**
 * Data stored on each graph edge (link).
 * These are the `.data` field of ngraph.graph Link objects.
 * 
 * Every edge has TWO weights to enable dual routing:
 * - standardWeight: cost for standard (walking) route
 * - accessibleWeight: cost for wheelchair-accessible route
 *   (may be higher if accessible path is longer, e.g. ramp vs stairs)
 */
export interface NavEdgeData {
  /** 
   * Walking distance/cost for standard route.
   * Unit: Euclidean distance in normalized coordinates (computed from node positions).
   * Can be manually overridden by admin for non-straight paths.
   */
  standardWeight: number
  /**
   * Distance/cost for wheelchair-accessible route.
   * Same as standardWeight for accessible paths.
   * Higher than standardWeight if accessible path is longer (e.g., ramp).
   * Set to Infinity (or very large number) for non-accessible edges (stairs).
   */
  accessibleWeight: number
  /** Whether this edge is traversable by wheelchair */
  accessible: boolean
  /** Whether this edge can be traversed in both directions */
  bidirectional: boolean
  /** Optional notes for admin ("3 steps", "narrow doorway", "automatic door") */
  accessibilityNotes?: string
}

// ============================================================
// Graph Container Type (for serialization/API transport)
// ============================================================

/**
 * Serialized node for JSON transport (API responses, storage).
 * Combines the node ID with its data.
 */
export interface NavNode extends NavNodeData {
  /** Unique identifier for this node */
  id: string
}

/**
 * Serialized edge for JSON transport (API responses, storage).
 * Combines the edge endpoints with its data.
 */
export interface NavEdge extends NavEdgeData {
  /** Unique identifier for this edge */
  id: string
  /** Source node ID */
  sourceId: string
  /** Target node ID */
  targetId: string
}

/**
 * Complete graph data as JSON — returned by GET /api/map.
 * Client loads this on page init and builds an ngraph.graph instance.
 */
export interface NavGraph {
  nodes: NavNode[]
  edges: NavEdge[]
  metadata: {
    buildingName: string
    floor: number
    lastUpdated: string  // ISO 8601
  }
}
```

### How Types Map to ngraph.graph

```typescript
// Loading NavGraph JSON into ngraph.graph:
import createGraph from 'ngraph.graph'
import type { NavNodeData, NavEdgeData, NavGraph } from '@shared/types'

function buildGraph(data: NavGraph) {
  const graph = createGraph<NavNodeData, NavEdgeData>()
  
  for (const node of data.nodes) {
    const { id, ...nodeData } = node
    graph.addNode(id, nodeData)  // nodeData matches NavNodeData
  }
  
  for (const edge of data.edges) {
    const { id, sourceId, targetId, ...edgeData } = edge
    graph.addLink(sourceId, targetId, edgeData)  // edgeData matches NavEdgeData
  }
  
  return graph
}
```

**Confidence:** HIGH — type shapes verified against ngraph.graph and ngraph.path TypeScript definitions from GitHub.

## Konva + React 19 Setup

### Verified: react-konva 19.x + React 19

**Source:** Konva official docs at konvajs.org/docs/react/index.html (verified via web fetch)

react-konva tracks React's major version: react-konva@19.x is built for React 19. The official installation is:

```bash
npm install react-konva konva
```

When React 19 is installed, npm will resolve react-konva@19.x automatically via peer dependencies.

### Hello World Canvas Component

```typescript
// src/client/App.tsx
import { Stage, Layer, Rect, Circle, Text } from 'react-konva'

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Stage width={window.innerWidth} height={window.innerHeight}>
        <Layer>
          <Text text="CampusNav - Hello Konva!" fontSize={24} x={20} y={20} />
          <Rect
            x={100}
            y={100}
            width={200}
            height={150}
            fill="#e2e8f0"
            stroke="#64748b"
            strokeWidth={2}
            cornerRadius={8}
          />
          <Circle x={200} y={175} radius={30} fill="#3b82f6" />
          <Text text="Floor Plan Area" fontSize={14} x={130} y={270} fill="#64748b" />
        </Layer>
      </Stage>
    </div>
  )
}

export default App
```

### Konva Gotchas for Phase 1

1. **Stage sizing:** `Stage` requires explicit `width` and `height` props (numbers, not CSS). For responsive behavior, listen to `window.resize` and update Stage dimensions. In Phase 1, `window.innerWidth/innerHeight` is sufficient.

2. **Mobile viewport:** Konva's `Stage` renders a `<canvas>` element. On mobile, ensure the parent div fills the viewport and the Stage dimensions match. Use `<meta name="viewport" content="width=device-width, initial-scale=1.0">` in index.html.

3. **No SSR:** react-konva uses `<canvas>` which is browser-only. No SSR issues since we're a Vite SPA (no server rendering), but `window` must exist when Stage renders.

4. **react-konva version mismatch:** If `npm install react-konva` installs v18.x instead of v19.x, explicitly install `react-konva@19`.

**Confidence:** HIGH — verified from official Konva docs and npm registry.

## Linting & Formatting: Biome

### Recommendation: Biome 2.x (NOT ESLint + Prettier)

**Source:** Biome v2 release blog (biomejs.dev/blog/biome-v2/, verified via web fetch)

| Criteria | Biome 2.x | ESLint 9 + Prettier 3 |
|----------|-----------|----------------------|
| Setup complexity | Single `biome.json` | `eslint.config.mjs` + `.prettierrc` + `@typescript-eslint` + `eslint-plugin-react` + `eslint-config-prettier` |
| Speed | Native Rust binary, ~100x faster than ESLint | JavaScript-based, slower |
| Formatting | Built-in (Prettier-compatible output) | Requires separate Prettier install |
| TypeScript support | Built-in, no plugins | Requires `@typescript-eslint/parser` + `@typescript-eslint/eslint-plugin` |
| React support | Built-in JSX/TSX rules | Requires `eslint-plugin-react`, `eslint-plugin-react-hooks` |
| Import sorting | Built-in (v2 revamped) | Requires `eslint-plugin-import` or separate tool |
| Type-aware rules | v2 adds type inference (no TS compiler needed) | Requires `typescript-eslint` with `parserOptions.project` |

**Why Biome wins for this project:**
1. Single tool, single config file — fewer things to break
2. Dramatically faster — relevant when linting on save
3. v2 is stable (released June 2025), with React/TS support built in
4. No "plugin compatibility matrix" headaches

### Biome Configuration

```jsonc
// biome.json
{
  "$schema": "https://biomejs.dev/schemas/2.0.0/schema.json",
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "semicolons": "asNeeded"
    }
  },
  "files": {
    "ignore": ["node_modules", "dist", "*.d.ts"]
  }
}
```

**Confidence:** HIGH — Biome 2.x verified as stable release (June 2025), TypeScript and React support confirmed.

## Tailwind CSS 4 Setup

**Source:** tailwindcss.com/docs/installation/using-vite (verified via web fetch)

Tailwind v4 uses a Vite plugin (NOT PostCSS config):

```typescript
// In vite.config.ts — already shown above
import tailwindcss from '@tailwindcss/vite'
// Add to plugins array: tailwindcss()
```

```css
/* src/client/style.css */
@import "tailwindcss";
```

No `tailwind.config.js` needed in v4 — it's CSS-first. Custom theme values use CSS `@theme` directive.

**Confidence:** HIGH — verified from official Tailwind docs.

## Common Pitfalls

### Pitfall 1: react-konva Version Mismatch
**What goes wrong:** Installing react-konva@18.x with React 19, causing runtime errors about incompatible React internals.
**Why it happens:** npm may resolve an older version if react-konva@19 isn't explicitly requested or if there's a cached resolution.
**How to avoid:** Explicitly install `react-konva@19`. Verify after install: `npm ls react-konva` should show 19.x.
**Warning signs:** Runtime error: "Cannot read properties of undefined" in react-konva internals.

### Pitfall 2: Vite Proxy Not Forwarding to Hono
**What goes wrong:** `/api/*` requests return 404 or Vite's own 404 page instead of reaching Hono.
**Why it happens:** Proxy target port mismatch, Hono not running, or proxy path doesn't match.
**How to avoid:** Ensure Hono runs on the exact port specified in Vite proxy config (3001). Test with `curl http://localhost:3001/api/health` directly.
**Warning signs:** Browser network tab shows 404 from Vite (HTML response), not from Hono (JSON response).

### Pitfall 3: TypeScript Path Aliases Not Resolving
**What goes wrong:** Imports like `@shared/types` work in IDE but fail at build/runtime.
**Why it happens:** Path aliases must be configured in BOTH `tsconfig.json` (for type checking) AND `vite.config.ts` (for bundling). Forgetting either one causes half-broken behavior.
**How to avoid:** Always configure aliases in both files. Test by importing a shared type in both client and server code.
**Warning signs:** IDE shows no errors, but `vite build` or `tsx` fails with "Cannot find module".

### Pitfall 4: Biome Conflicts with Existing ESLint Config
**What goes wrong:** If ESLint config files exist, editor extensions may run both ESLint and Biome, causing duplicate/conflicting fixes.
**Why it happens:** VS Code may have both ESLint and Biome extensions active.
**How to avoid:** Don't install ESLint at all. Only install the Biome VS Code extension. Add `"editor.defaultFormatter": "biomejs.biome"` to `.vscode/settings.json`.

### Pitfall 5: `tsx watch` Missing Node.js Built-in Types
**What goes wrong:** TypeScript errors in server code for `process`, `Buffer`, etc.
**Why it happens:** Server code needs `@types/node` but the base tsconfig may not include `"types": ["node"]`.
**How to avoid:** Install `@types/node` as dev dependency. In tsconfig for server, ensure `"types": ["node"]` is included. For Phase 1's single tsconfig, this can be added globally since Vite strips it from client bundles.

## Code Examples

### Complete `index.html` (Vite Entry)

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CampusNav</title>
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/client/main.tsx"></script>
  </body>
</html>
```

### Complete `src/client/main.tsx`

```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './style.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

### Complete `src/client/style.css`

```css
@import "tailwindcss";

/* Reset for full-viewport canvas */
html, body, #root {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| ESLint + Prettier (two tools) | Biome 2.x (single tool) | Biome v2 stable: June 2025 | Simpler config, faster, type-aware linting without TS compiler |
| Tailwind v3 (`tailwind.config.js` + PostCSS) | Tailwind v4 (CSS-first + Vite plugin) | TW v4: 2025 | No config file needed, `@tailwindcss/vite` plugin |
| Create React App | Vite 7 with `@vitejs/plugin-react` | CRA deprecated ~2023, Vite dominant since | Faster dev server, ESM-native |
| Express.js | Hono 4.x | Hono gained major adoption 2024-2025 | TypeScript-first, Web Standards API, lighter |
| Prettier semicolons/quotes debates | Biome's built-in formatter with same options | N/A | Single config source for both lint and format |

**Deprecated/outdated:**
- **Create React App (CRA):** Officially deprecated. Don't use.
- **react-konva@18.x with React 19:** Will cause runtime errors. Must use react-konva@19.x.
- **Tailwind v3 PostCSS setup:** Still works but v4 Vite plugin is recommended for new projects.
- **ESLint legacy config (`.eslintrc`):** ESLint 9 uses flat config (`eslint.config.mjs`). But we're not using ESLint anyway.

## Open Questions

1. **npm vs pnpm as package manager**
   - What we know: Both work. pnpm is faster and uses less disk space. npm is more universal.
   - Recommendation: **Use npm.** It's the default, zero setup, and the project is small enough that pnpm's performance advantage is negligible. Avoids requiring contributors to install pnpm.

2. **Biome 2.x stability for production use**
   - What we know: Biome v2 was released June 2025 (8 months ago). v2.4 is current. Major companies use it.
   - What's unclear: Edge cases with react-konva JSX may exist.
   - Recommendation: Use Biome. If any react-konva-specific lint issues arise, suppress individual rules. This is unlikely to be a problem.

3. **tsx vs @hono/node-server for dev watching**
   - What we know: `tsx watch` re-runs the entire file on change. `@hono/vite-dev-server` provides HMR-like behavior but is designed for Hono-served apps.
   - Recommendation: Use `tsx watch` for simplicity. The server is small and restarts are fast (<1s). If hot reload becomes important later, investigate `@hono/vite-dev-server` with adapter.

## Sources

### Primary (HIGH confidence)
- **ngraph.graph TypeScript definitions** — `index.d.ts` fetched from GitHub (raw.githubusercontent.com). Verified generic `Graph<NodeData, LinkData>` API, `addNode(id, data)`, `addLink(from, to, data)` signatures, `Node.data` and `Link.data` access patterns.
- **ngraph.path TypeScript definitions** — `index.d.ts` fetched from GitHub. Verified `PathFinderOptions` with `distance`, `heuristic`, `blocked` callbacks receiving `Node` and `Link` objects.
- **ngraph.graph README** — GitHub README (github.com/anvaka/ngraph.graph). API examples for `addNode`, `addLink`, `forEachNode`, `forEachLinkedNode`.
- **ngraph.path README** — GitHub README (github.com/anvaka/ngraph.path). Weighted graph example, A* heuristic example, `blocked()` function for edge filtering.
- **Konva React integration docs** — konvajs.org/docs/react/index.html. Verified `Stage`, `Layer`, `Rect`, `Circle`, `Text` components, basic setup example with `react-konva`.
- **Hono Node.js getting started** — hono.dev/docs/getting-started/nodejs. Verified `@hono/node-server` `serve()` API, port configuration.
- **@hono/vite-dev-server README** — GitHub raw README. Verified it's designed for Hono-served apps (fetch-based), not for SPA + separate API pattern.
- **Vite server proxy docs** — vite.dev/config/server-options.html. Verified `server.proxy` configuration format.
- **Tailwind CSS v4 Vite installation** — tailwindcss.com/docs/installation/using-vite. Verified `@tailwindcss/vite` plugin pattern, no config file needed.
- **Biome v2 release blog** — biomejs.dev/blog/biome-v2/. Verified: type inference, monorepo support, import organizer, v2 stable June 2025.

### Secondary (MEDIUM confidence)
- **STACK.md from project research** — Version numbers for all libraries, verified against npm registry.
- **ARCHITECTURE.md from project research** — Project structure pattern, client/server separation, shared types.
- **PITFALLS.md from project research** — Normalized coordinates, dual weights, accessibility metadata.

### Tertiary (LOW confidence)
- None. All critical claims verified against primary sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified against npm registry and official docs
- Architecture (project structure): HIGH — standard Vite SPA pattern, well-documented
- Dev server setup: HIGH — Vite proxy docs verified, concurrently is battle-tested
- TypeScript data model: HIGH — type shapes verified against ngraph.graph/path TypeScript definitions
- Konva setup: HIGH — verified from official konvajs.org docs
- Linting (Biome): HIGH — v2 stable since June 2025, confirmed React+TS support
- Tailwind v4: HIGH — verified from official docs

**Research date:** 2026-02-18
**Valid until:** 2026-03-18 (30 days — stable ecosystem, slow-moving dependencies)
