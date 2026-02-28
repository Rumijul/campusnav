---
phase: 01-project-setup-foundation
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - campusnav/package.json
  - campusnav/vite.config.ts
  - campusnav/tsconfig.json
  - campusnav/biome.json
  - campusnav/index.html
  - campusnav/.gitignore
  - campusnav/src/shared/types.ts
  - campusnav/src/server/index.ts
autonomous: true
requirements: []

must_haves:
  truths:
    - "Running `npm install` in campusnav/ succeeds and installs all Phase 1 dependencies"
    - "TypeScript strict mode compiles with zero errors across all source files"
    - "Shared types (NavNode, NavEdge, NavGraph) are importable from both client and server paths via @shared/* alias"
    - "Hono server starts on port 3001 and responds to GET /api/health with JSON"
    - "Biome lint and format checks pass with zero errors on all source files"
  artifacts:
    - path: "campusnav/package.json"
      provides: "Project manifest with all Phase 1 dependencies and dev scripts"
      contains: "concurrently"
    - path: "campusnav/vite.config.ts"
      provides: "Vite config with React plugin, Tailwind plugin, path aliases, and API proxy"
      contains: "proxy"
    - path: "campusnav/tsconfig.json"
      provides: "TypeScript config with strict mode, path aliases, and ES2022 target"
      contains: "strict"
    - path: "campusnav/src/shared/types.ts"
      provides: "Core navigation graph type definitions"
      exports: ["NavNodeType", "NavNodeData", "NavEdgeData", "NavNode", "NavEdge", "NavGraph"]
    - path: "campusnav/src/server/index.ts"
      provides: "Hono API server with health endpoint"
      contains: "serve"
  key_links:
    - from: "campusnav/tsconfig.json"
      to: "campusnav/vite.config.ts"
      via: "Path aliases (@shared/*) must be configured in both files identically"
      pattern: "@shared"
    - from: "campusnav/src/server/index.ts"
      to: "campusnav/vite.config.ts"
      via: "Server port (3001) must match Vite proxy target port"
      pattern: "3001"
---

<objective>
Scaffold the CampusNav project from scratch: create the project directory, install all Phase 1 dependencies, configure build tooling (Vite, TypeScript, Biome, Tailwind), define the core navigation graph types, and create the Hono API server skeleton.

Purpose: Establish the foundation that every subsequent plan and phase builds on — correct dependency versions, strict TypeScript, shared type system, and working backend.
Output: A `campusnav/` project with working `npm install`, passing `tsc --noEmit`, passing `biome check`, and a running Hono health endpoint.
</objective>

<execution_context>
@C:/Users/LENOVO/.config/opencode/get-shit-done/workflows/execute-plan.md
@C:/Users/LENOVO/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/research/SUMMARY.md
@.planning/phases/01-project-setup-foundation/01-CONTEXT.md
@.planning/phases/01-project-setup-foundation/01-RESEARCH.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create project directory, install dependencies, and configure tooling</name>
  <files>
    campusnav/package.json
    campusnav/vite.config.ts
    campusnav/tsconfig.json
    campusnav/biome.json
    campusnav/index.html
    campusnav/.gitignore
  </files>
  <action>
Create the `campusnav/` directory under the current working directory (C:\Users\LENOVO\campusnav).

1. **Initialize project:**
   ```
   mkdir campusnav && cd campusnav && npm init -y
   ```
   Update `package.json` name to "campusnav", set `"type": "module"`.

2. **Install production dependencies (exact versions matter):**
   ```
   npm install react@19 react-dom@19 react-konva@19 konva@10 hono @hono/node-server zod tailwindcss @tailwindcss/vite
   ```
   CRITICAL: Verify react-konva resolves to 19.x (not 18.x) with `npm ls react-konva`. If 18.x, explicitly install `react-konva@19`.

3. **Install dev dependencies:**
   ```
   npm install -D typescript @types/react @types/react-dom @types/node vite @vitejs/plugin-react @biomejs/biome concurrently tsx vitest
   ```

4. **Create `vite.config.ts`** per RESEARCH.md Pattern 1:
   - Plugins: `react()`, `tailwindcss()`
   - Resolve aliases: `@shared` → `src/shared`, `@client` → `src/client`
   - Server proxy: `/api` → `http://localhost:3001`
   - Port: 5173 (default)

5. **Create `tsconfig.json`** per RESEARCH.md Pattern 2:
   - Target: ES2022, Module: ESNext, ModuleResolution: bundler
   - Strict: true + noUncheckedIndexedAccess + noUnusedLocals + noUnusedParameters + exactOptionalPropertyTypes
   - JSX: react-jsx
   - Paths: `@shared/*` → `src/shared/*`, `@client/*` → `src/client/*`
   - Include: `["src"]`
   - Types: `["node"]` (for server code, Vite strips from client bundle)

6. **Create `biome.json`** per RESEARCH.md:
   - Import organizing enabled
   - Linter recommended rules enabled
   - Formatter: spaces, indent 2, line width 100
   - JavaScript: single quotes, semicolons as needed
   - Ignore: node_modules, dist, *.d.ts

7. **Create `index.html`** (Vite entry):
   - Meta viewport for mobile
   - Title: "CampusNav"
   - Script src: `/src/client/main.tsx`
   - Root div with id="root"

8. **Create `.gitignore`:**
   - node_modules, dist, .env, *.local, .DS_Store

9. **Update `package.json` scripts:**
   ```json
   {
     "dev": "concurrently -n client,server -c blue,green \"npm run dev:client\" \"npm run dev:server\"",
     "dev:client": "vite",
     "dev:server": "tsx watch src/server/index.ts",
     "build": "tsc --noEmit && vite build",
     "lint": "biome check .",
     "lint:fix": "biome check --write .",
     "format": "biome format --write .",
     "typecheck": "tsc --noEmit",
     "test": "vitest"
   }
   ```

IMPORTANT: After creating all files, run `biome format --write .` to ensure all generated files match Biome's formatting rules. Then run `biome check .` to verify zero lint errors.
  </action>
  <verify>
Run these commands in the campusnav/ directory:
1. `npm ls react-konva` — must show 19.x
2. `npm ls react` — must show 19.x
3. `npx tsc --noEmit` — must exit 0 (may need Task 2 files first, but config itself should be valid)
4. `npx biome check biome.json vite.config.ts` — must pass
  </verify>
  <done>
campusnav/ directory exists with package.json (all Phase 1 deps installed), vite.config.ts (React + Tailwind + proxy), tsconfig.json (strict mode + aliases), biome.json (lint + format), index.html (Vite entry), .gitignore. `npm ls react-konva` shows 19.x. All config files pass Biome check.
  </done>
</task>

<task type="auto">
  <name>Task 2: Define core TypeScript types for the navigation graph</name>
  <files>
    campusnav/src/shared/types.ts
  </files>
  <action>
Create `campusnav/src/shared/types.ts` with the navigation graph type definitions from RESEARCH.md.

The types serve TWO purposes:
1. **Data shape for ngraph.graph** — `NavNodeData` is the `.data` field of ngraph graph nodes, `NavEdgeData` is the `.data` field of ngraph graph links. These are what ngraph's `addNode(id, data)` and `addLink(from, to, data)` accept.
2. **Serialization shape for API** — `NavNode` (extends NavNodeData + id), `NavEdge` (extends NavEdgeData + id/sourceId/targetId), and `NavGraph` (container) are what the API sends and the client loads.

Define these types exactly:

**NavNodeType** (union type):
- `'room'` — Classroom, office, lab (searchable, visible)
- `'entrance'` — Building entrance/exit (searchable, visible)
- `'elevator'` — Elevator (searchable, visible, accessibility waypoint)
- `'stairs'` — Stairwell (visible but navigation waypoint)
- `'ramp'` — Ramp (visible, accessibility waypoint)
- `'restroom'` — Restroom (searchable, visible)
- `'junction'` — Hallway intersection (INVISIBLE to students, navigation only)
- `'hallway'` — Mid-hallway point (INVISIBLE to students, navigation only)
- `'landmark'` — Named landmark like cafeteria, library (searchable, visible)

**NavNodeData** (interface — ngraph node .data):
- `x: number` — Normalized 0.0-1.0 (percentage of floor plan width)
- `y: number` — Normalized 0.0-1.0 (percentage of floor plan height)
- `label: string` — Display name for search and directions
- `type: NavNodeType` — Node classification
- `searchable: boolean` — Whether it appears in student search
- `floor: number` — Floor number (1 for Phase 1, enables multi-floor later)

**NavEdgeData** (interface — ngraph link .data):
- `standardWeight: number` — Walking cost for standard route
- `accessibleWeight: number` — Walking cost for wheelchair route (Infinity for non-accessible)
- `accessible: boolean` — Whether this edge is wheelchair-traversable
- `bidirectional: boolean` — Whether edge can be traversed both ways
- `accessibilityNotes?: string` — Optional admin notes ("3 steps", "narrow doorway")

**NavNode** (interface, extends NavNodeData):
- `id: string` — Unique node identifier

**NavEdge** (interface, extends NavEdgeData):
- `id: string` — Unique edge identifier
- `sourceId: string` — Source node ID
- `targetId: string` — Target node ID

**NavGraph** (interface — API response / JSON blob):
- `nodes: NavNode[]`
- `edges: NavEdge[]`
- `metadata: { buildingName: string; floor: number; lastUpdated: string }`

Add JSDoc comments explaining:
- That coordinates are NORMALIZED (0.0-1.0), converted to pixels only at render time
- That NavNodeData/NavEdgeData are the `.data` fields for ngraph.graph
- That NavNode/NavEdge/NavGraph are the serialization format for API transport
- Which node types are visible vs invisible to students
- That standardWeight vs accessibleWeight enables dual routing

Export all types.

After writing, run `biome format --write campusnav/src/shared/types.ts` and then `biome check campusnav/src/shared/types.ts` to ensure compliance.
  </action>
  <verify>
1. `npx tsc --noEmit` in campusnav/ — compiles with zero errors
2. `npx biome check src/shared/types.ts` — passes
3. All 6 types are exported: NavNodeType, NavNodeData, NavEdgeData, NavNode, NavEdge, NavGraph
  </verify>
  <done>
`src/shared/types.ts` exists with all 6 exported types. Types use normalized 0-1 coordinates, dual weights (standardWeight + accessibleWeight), NavNodeType union with 9 variants, and JSDoc comments. TypeScript compiles with zero errors. Biome check passes.
  </done>
</task>

<task type="auto">
  <name>Task 3: Create Hono API server with health endpoint</name>
  <files>
    campusnav/src/server/index.ts
  </files>
  <action>
Create `campusnav/src/server/index.ts` with a minimal Hono API server.

The server should:
1. Import `serve` from `@hono/node-server` and `Hono` from `hono`
2. Create a Hono app instance
3. Add a `GET /api/health` route that returns `{ status: 'ok', timestamp: new Date().toISOString() }`
4. Start serving on port 3001 with a console.log confirming the port
5. Import `NavGraph` type from `@shared/types` to verify that the path alias works from server code (use it in a type annotation or comment — it just needs to compile)

Keep it minimal — this is a skeleton. Future phases add real endpoints.

After writing, run `biome format --write campusnav/src/server/index.ts` and then `biome check campusnav/src/server/index.ts`.
  </action>
  <verify>
1. `npx tsc --noEmit` — compiles with zero errors (including the @shared import)
2. `npx biome check src/server/index.ts` — passes
3. Start the server: `npx tsx src/server/index.ts` — should print port message
4. `curl http://localhost:3001/api/health` — should return JSON with status "ok"
5. Stop the server after verification
  </verify>
  <done>
`src/server/index.ts` exists with Hono app serving on port 3001. GET /api/health returns `{ status: 'ok', timestamp: '...' }`. Server imports `@shared/types` successfully, proving path alias works for server code. TypeScript compiles, Biome passes.
  </done>
</task>

</tasks>

<verification>
After all 3 tasks complete:
1. `npm ls react-konva` shows 19.x, `npm ls react` shows 19.x
2. `npx tsc --noEmit` exits 0 (zero errors, strict mode)
3. `npx biome check .` exits 0 (zero lint/format issues)
4. `npx tsx src/server/index.ts` starts Hono on port 3001 and `curl /api/health` returns JSON
5. All 6 shared types compile and are importable via `@shared/types` from server code
</verification>

<success_criteria>
- campusnav/ directory exists with all config files
- All Phase 1 dependencies installed (react@19, react-konva@19, konva@10, hono, vite, biome, etc.)
- TypeScript strict mode compiles with zero errors
- Biome check passes with zero issues
- Hono health endpoint responds with JSON
- Shared types defined with normalized coordinates and dual weights
- Path aliases (@shared/*) resolve correctly
</success_criteria>

<output>
After completion, create `.planning/phases/01-project-setup-foundation/01-01-SUMMARY.md`
</output>
