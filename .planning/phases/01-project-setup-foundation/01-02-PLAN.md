---
phase: 01-project-setup-foundation
plan: 02
type: execute
wave: 2
depends_on: ["01-01"]
files_modified:
  - campusnav/src/client/main.tsx
  - campusnav/src/client/App.tsx
  - campusnav/src/client/style.css
autonomous: false
requirements: []

must_haves:
  truths:
    - "A Konva canvas renders in the browser showing a hello-world placeholder with shapes and text"
    - "The canvas fills the viewport on both desktop and mobile-sized viewports"
    - "Running `npm run dev` starts both the Vite frontend and Hono backend simultaneously with colored output"
    - "Navigating to localhost:5173 shows the Konva canvas, and /api/health proxies to Hono returning JSON"
    - "All source files pass TypeScript strict mode and Biome checks with zero errors"
  artifacts:
    - path: "campusnav/src/client/main.tsx"
      provides: "React entry point rendering App into #root"
      contains: "createRoot"
    - path: "campusnav/src/client/App.tsx"
      provides: "Hello-world Konva canvas component with Stage, Layer, shapes"
      contains: "Stage"
      min_lines: 20
    - path: "campusnav/src/client/style.css"
      provides: "Tailwind import and viewport reset styles"
      contains: "@import"
  key_links:
    - from: "campusnav/index.html"
      to: "campusnav/src/client/main.tsx"
      via: "Script tag with type=module src"
      pattern: "src/client/main.tsx"
    - from: "campusnav/src/client/main.tsx"
      to: "campusnav/src/client/App.tsx"
      via: "Default import of App component"
      pattern: "import App"
    - from: "campusnav/src/client/App.tsx"
      to: "campusnav/src/shared/types.ts"
      via: "Import shared type to verify @shared alias works from client"
      pattern: "@shared/types"
---

<objective>
Create the React client with a hello-world Konva canvas, wire up the full dev workflow, and verify the complete Phase 1 setup works end-to-end: Vite + Hono dev servers running, Konva rendering, API proxy working, TypeScript and Biome passing.

Purpose: Complete Phase 1 by delivering the visible proof — a working Konva canvas in the browser — and verifying all the infrastructure from Plan 01 works together.
Output: Working `npm run dev` that shows Konva canvas at localhost:5173 and proxies /api to Hono at localhost:3001.
</objective>

<execution_context>
@C:/Users/LENOVO/.config/opencode/get-shit-done/workflows/execute-plan.md
@C:/Users/LENOVO/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/01-project-setup-foundation/01-CONTEXT.md
@.planning/phases/01-project-setup-foundation/01-RESEARCH.md
@.planning/phases/01-project-setup-foundation/01-01-SUMMARY.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create React client with Konva hello-world canvas</name>
  <files>
    campusnav/src/client/main.tsx
    campusnav/src/client/App.tsx
    campusnav/src/client/style.css
  </files>
  <action>
Create the three client files that make up the React SPA entry point.

**`src/client/style.css`:**
```css
@import "tailwindcss";

html, body, #root {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
```

**`src/client/main.tsx`:**
- Import React's `StrictMode` and `createRoot`
- Import `App` component
- Import `./style.css`
- Render `<StrictMode><App /></StrictMode>` into `document.getElementById('root')!`

**`src/client/App.tsx`:**
Create a hello-world Konva canvas that demonstrates the library works:

1. Import `Stage`, `Layer`, `Rect`, `Circle`, `Text` from `react-konva`
2. Import `NavNodeType` from `@shared/types` (to verify the @shared path alias works from client code — use it as a type annotation on a variable)
3. Use `useState` to track window dimensions, with a `useEffect` + `window.addEventListener('resize')` to update on resize. This ensures the Stage fills the viewport responsively.
4. Render a `<Stage>` with `width={dimensions.width}` and `height={dimensions.height}` containing:
   - A `<Layer>` with:
     - A `<Text>` showing "CampusNav" as a title (fontSize 28, bold, positioned near top-left)
     - A `<Text>` showing "Floor Plan Canvas — Hello Konva!" as subtitle
     - A `<Rect>` representing a placeholder floor plan area (large, light gray fill, rounded corners)
     - Several `<Circle>` elements representing placeholder "nodes" (blue dots at various positions)
     - A `<Text>` below saying "Phase 1 Setup Complete ✓" or similar confirmation text
5. The Stage background should be white or very light. Make it visually clear that Konva is working.

Keep the component simple — no state management, no interactivity beyond resize. This is a proof-of-life for Konva rendering.

After writing all files, run `biome format --write src/client/` and `biome check src/client/`.
  </action>
  <verify>
1. `npx tsc --noEmit` — zero errors (includes @shared import from client)
2. `npx biome check .` — zero issues across all source files
3. `npm run build` — Vite build succeeds (produces dist/)
  </verify>
  <done>
Three client files exist: main.tsx (entry), App.tsx (Konva canvas with shapes), style.css (Tailwind + viewport reset). All import correctly, TypeScript compiles, Biome passes, Vite builds.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 2: Verify full Phase 1 dev workflow end-to-end</name>
  <files>campusnav/ (full project verification)</files>
  <action>
Human verification checkpoint. Claude has automated the full Phase 1 setup. User now verifies visually and functionally.

What was built: Complete Phase 1 project setup — campusnav/ with React 19 + Vite frontend, Hono backend, shared TypeScript types (NavNode, NavEdge, NavGraph with normalized coordinates and dual weights), Konva hello-world canvas, Biome linting, and concurrent dev server.
  </action>
  <verify>
1. Open a terminal in the `campusnav/` directory
2. Run `npm run dev` — you should see colored output: blue for "client" (Vite), green for "server" (Hono)
3. Open `http://localhost:5173` in your browser:
   - You should see a Konva canvas with "CampusNav" text, a gray rectangle (placeholder floor plan), and blue dots (placeholder nodes)
   - Resize the browser window — the canvas should resize with it
4. Open browser DevTools → Network tab:
   - Navigate to `http://localhost:5173/api/health` — should return JSON `{ "status": "ok", "timestamp": "..." }` (proves Vite proxy is forwarding to Hono)
5. Check mobile viewport: In DevTools, toggle device toolbar (phone size) — canvas should still render and fill the screen
6. In another terminal in campusnav/:
   - Run `npm run typecheck` — should exit with 0 errors
   - Run `npm run lint` — should exit with 0 issues
  </verify>
  <done>User has visually confirmed Konva canvas renders, dev servers run, API proxy works, and all tooling checks pass. Type "approved" or describe issues.</done>
</task>

</tasks>

<verification>
Phase 1 is complete when ALL of these are true:
1. `npm run dev` starts both Vite (port 5173) and Hono (port 3001) with hot reload
2. Konva canvas renders in browser at localhost:5173 with visible shapes/text
3. `http://localhost:5173/api/health` returns JSON from Hono (proxy works)
4. Canvas fills viewport and resizes on window resize (desktop + mobile)
5. `npm run typecheck` (tsc --noEmit) passes with zero errors
6. `npm run lint` (biome check) passes with zero issues
7. `src/shared/types.ts` exports NavNodeType, NavNodeData, NavEdgeData, NavNode, NavEdge, NavGraph
8. Types use normalized 0-1 coordinates, dual weights, 9-variant NavNodeType union
9. @shared/* path alias works from both client and server code
</verification>

<success_criteria>
- Konva canvas visually renders in browser (desktop and mobile viewports)
- `npm run dev` starts both frontend and backend concurrently
- Vite proxy forwards /api/* to Hono backend
- TypeScript strict mode + Biome lint = zero errors
- Human has verified the visual output in browser
</success_criteria>

<output>
After completion, create `.planning/phases/01-project-setup-foundation/01-02-SUMMARY.md`
</output>
