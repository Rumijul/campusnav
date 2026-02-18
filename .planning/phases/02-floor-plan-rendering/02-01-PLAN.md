---
phase: 02-floor-plan-rendering
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/server/index.ts
  - src/server/assets/floor-plan.png
  - src/server/assets/floor-plan-thumb.jpg
  - src/client/App.tsx
  - src/client/components/FloorPlanCanvas.tsx
  - src/client/components/FloorPlanImage.tsx
  - src/client/components/GridBackground.tsx
  - src/client/hooks/useViewportSize.ts
  - src/client/hooks/useFloorPlanImage.ts
autonomous: true
requirements: [MAP-01]

must_haves:
  truths:
    - "Floor plan image renders on the Konva canvas"
    - "Loading indicator appears while floor plan image is being fetched from server"
    - "Low-res thumbnail replaces loading state, then full image replaces thumbnail (progressive loading)"
    - "Subtle grid pattern is visible behind and around the floor plan"
    - "Floor plan fits viewport on initial load with preserved aspect ratio (letterboxed, not cropped)"
    - "Error message displays when floor plan image fails to load"
  artifacts:
    - path: "src/client/components/FloorPlanCanvas.tsx"
      provides: "Main canvas component with Stage, grid layer, image layer, loading/error states"
      exports: ["default"]
    - path: "src/client/components/FloorPlanImage.tsx"
      provides: "Konva Image with progressive loading and fade-in transition"
      exports: ["default"]
    - path: "src/client/components/GridBackground.tsx"
      provides: "Subtle drafting-table grid pattern background"
      exports: ["default"]
    - path: "src/client/hooks/useViewportSize.ts"
      provides: "Reactive window dimensions hook extracted from Phase 1 App.tsx"
      exports: ["useViewportSize"]
    - path: "src/client/hooks/useFloorPlanImage.ts"
      provides: "Progressive image loading with thumbnail-first strategy"
      exports: ["useFloorPlanImage"]
    - path: "src/server/index.ts"
      provides: "GET /api/floor-plan/image and /api/floor-plan/thumbnail endpoints"
      contains: "/api/floor-plan"
  key_links:
    - from: "src/client/hooks/useFloorPlanImage.ts"
      to: "/api/floor-plan/image"
      via: "use-image hook fetching from API endpoint"
      pattern: "useImage.*floor-plan"
    - from: "src/client/components/FloorPlanCanvas.tsx"
      to: "src/client/components/FloorPlanImage.tsx"
      via: "component composition in Konva Layer"
      pattern: "FloorPlanImage"
    - from: "src/client/App.tsx"
      to: "src/client/components/FloorPlanCanvas.tsx"
      via: "import and render as sole child"
      pattern: "FloorPlanCanvas"
---

<objective>
Render a floor plan image on the Konva canvas with progressive loading, a grid background, and proper loading/error states.

Purpose: This is the visual foundation of the map viewer — getting the floor plan image displayed on screen with a polished loading experience. All interactive behaviors (pan, zoom, touch) are added in Plan 02.

Output: Working floor plan display with server-served images, progressive loading (spinner → thumbnail → full image), grid background, fit-to-screen framing, and error/empty states.
</objective>

<execution_context>
@C:/Users/admin/.config/opencode/get-shit-done/workflows/execute-plan.md
@C:/Users/admin/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@C:/Users/admin/.planning/PROJECT.md
@C:/Users/admin/.planning/ROADMAP.md
@C:/Users/admin/.planning/STATE.md
@C:/Users/admin/.planning/phases/02-floor-plan-rendering/02-RESEARCH.md

@C:/Users/admin/Desktop/projects/campusnav/src/client/App.tsx
@C:/Users/admin/Desktop/projects/campusnav/src/client/main.tsx
@C:/Users/admin/Desktop/projects/campusnav/src/client/style.css
@C:/Users/admin/Desktop/projects/campusnav/src/server/index.ts
@C:/Users/admin/Desktop/projects/campusnav/src/shared/types.ts
@C:/Users/admin/Desktop/projects/campusnav/package.json
@C:/Users/admin/Desktop/projects/campusnav/vite.config.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Serve floor plan images from the Hono backend</name>
  <files>
    src/server/index.ts
    src/server/assets/floor-plan.png
    src/server/assets/floor-plan-thumb.jpg
  </files>
  <action>
  **Install dependency:**
  Run `npm install use-image` in C:\Users\admin\Desktop\projects\campusnav. This is a React hook by the Konva team for loading images into Konva with status tracking.

  **Create test floor plan images:**
  Create `src/server/assets/` directory. Generate two test floor plan images for development:

  - `floor-plan.png` — at least 1600x1000 pixels. Should resemble a basic floor plan with colored rectangles for rooms, lines for hallways, and text labels for room names. Does NOT need to be realistic — basic geometric shapes are fine for development.
  - `floor-plan-thumb.jpg` — ~400px wide thumbnail version of the same image for progressive loading testing.

  Approach (choose the simplest that works):
  a) Install `sharp` as a devDependency (`npm install -D sharp`) and write a Node.js script (`scripts/generate-test-images.ts`) that generates both images programmatically (recommended — sharp can create images from SVG overlays or raw pixel buffers)
  b) Create minimal valid images using Node.js built-in modules (Buffer + zlib for PNG)
  c) Any other method that produces valid browser-renderable image files

  **Add Hono endpoints to `src/server/index.ts`:**

  Import `readFile` from `node:fs/promises`, `resolve` and `dirname` from `node:path`, and `fileURLToPath` from `node:url`.

  Add two GET endpoints (keep the existing `/api/health` endpoint unchanged):

  `GET /api/floor-plan/image`:
  - Resolve path to `assets/floor-plan.png` relative to the current file using `dirname(fileURLToPath(import.meta.url))` + `resolve`
  - Read the file with `readFile`
  - Set response headers: `Content-Type: image/png`, `Cache-Control: public, max-age=3600`
  - Return the raw buffer as the response body via `c.body(buffer)`
  - On file read error (ENOENT): return `c.json({ error: 'Floor plan not found' }, 404)`

  `GET /api/floor-plan/thumbnail`:
  - Same pattern as above but for `assets/floor-plan-thumb.jpg`
  - Set `Content-Type: image/jpeg`

  The Vite proxy from Phase 1 already covers `/api/*` → localhost:3001, so these endpoints will be accessible from the client at `/api/floor-plan/image` automatically.
  </action>
  <verify>
  Start the server: `npx tsx src/server/index.ts`, then:
  - `curl -I http://localhost:3001/api/floor-plan/image` returns 200 with `Content-Type: image/png`
  - `curl -I http://localhost:3001/api/floor-plan/thumbnail` returns 200 with `Content-Type: image/jpeg`
  - `npm run typecheck` passes with zero errors
  </verify>
  <done>Both image endpoints serve valid images with correct Content-Type and Cache-Control headers. `use-image` is installed in package.json dependencies.</done>
</task>

<task type="auto">
  <name>Task 2: Create floor plan canvas with progressive image loading</name>
  <files>
    src/client/hooks/useViewportSize.ts
    src/client/hooks/useFloorPlanImage.ts
    src/client/components/GridBackground.tsx
    src/client/components/FloorPlanImage.tsx
    src/client/components/FloorPlanCanvas.tsx
    src/client/App.tsx
  </files>
  <action>
  Create `src/client/hooks/` and `src/client/components/` directories.

  **1. `src/client/hooks/useViewportSize.ts`** — Extract from existing App.tsx.
  - Custom hook returning `{ width: number, height: number }`
  - Uses `useState({ width: window.innerWidth, height: window.innerHeight })`
  - Uses `useEffect` with `window.addEventListener('resize', handler)` and cleanup
  - This is the exact same pattern currently in App.tsx lines 16-31, extracted into a reusable hook

  **2. `src/client/hooks/useFloorPlanImage.ts`** — Progressive image loading.
  - Import `useImage` from `use-image`
  - Load both URLs concurrently:
    ```
    const [thumb, thumbStatus] = useImage('/api/floor-plan/thumbnail')
    const [full, fullStatus] = useImage('/api/floor-plan/image')
    ```
  - Return an object with:
    - `image`: full if `fullStatus === 'loaded'`, else thumb if `thumbStatus === 'loaded'`, else undefined
    - `isLoading`: `thumbStatus === 'loading' && fullStatus !== 'loaded'` (show spinner)
    - `isFailed`: `thumbStatus === 'failed' && fullStatus === 'failed'` (both failed)
    - `isFullLoaded`: `fullStatus === 'loaded'`

  **3. `src/client/components/GridBackground.tsx`** — Subtle grid pattern.
  - Import `Line` from `react-konva`
  - Props: `{ width: number, height: number }`
  - Generate vertical `Line` elements every 30px across `width`: `points={[x, 0, x, height]}`, stroke="#e2e8f0", strokeWidth=0.5
  - Generate horizontal `Line` elements every 30px across `height`: `points={[0, y, width, y]}`, stroke="#e2e8f0", strokeWidth=0.5
  - Return all lines as a React Fragment
  - This renders on a non-transformed Layer (stays static, doesn't move with pan/zoom)

  **4. `src/client/components/FloorPlanImage.tsx`** — Image rendering with fit-to-screen.
  - Import `Image` from `react-konva` and `Konva` from `konva`
  - Props: `{ image: HTMLImageElement | undefined, isFullLoaded: boolean, viewportWidth: number, viewportHeight: number, onImageRectChange?: (rect: { x: number, y: number, width: number, height: number }) => void }`
  - If no image, return null
  - Calculate fit-to-screen:
    - `scale = Math.min((viewportWidth - 80) / image.naturalWidth, (viewportHeight - 80) / image.naturalHeight)` (40px padding on each side)
    - `x = (viewportWidth - image.naturalWidth * scale) / 2`
    - `y = (viewportHeight - image.naturalHeight * scale) / 2`
    - `scaledWidth = image.naturalWidth * scale`, `scaledHeight = image.naturalHeight * scale`
  - Render `<Image image={image} x={x} y={y} width={scaledWidth} height={scaledHeight} />` with a ref
  - Call `onImageRectChange({ x, y, width: scaledWidth, height: scaledHeight })` via useEffect when dimensions change — Plan 02 needs this for elastic bounds
  - **Fade-in transition:** Use a ref to the Konva Image node. On image change, set node opacity to 0, create a `new Konva.Tween({ node, duration: 0.3, opacity: 1, easing: Konva.Easings.EaseInOut }).play()`. Destroy any previous tween before creating a new one (React strict mode + rapid image swap safety).

  **5. `src/client/components/FloorPlanCanvas.tsx`** — Main canvas container.
  - Uses `useViewportSize()` for `{ width, height }`
  - Uses `useFloorPlanImage()` for `{ image, isLoading, isFailed, isFullLoaded }`
  - Creates `stageRef = useRef<Konva.Stage>(null)` — needed by Plan 02 for pan/zoom
  - Tracks `imageRect` state via useState (updated by FloorPlanImage's onImageRectChange callback)
  - Full-viewport layout — the entire viewport is the map (no header). Per user decisions, this maximizes map space:
    ```tsx
    <div className="relative w-full h-full">
      <Stage ref={stageRef} width={width} height={height}>
        <Layer>  {/* Grid — static background, not transformed */}
          <GridBackground width={width} height={height} />
        </Layer>
        <Layer>  {/* Content — floor plan image */}
          {!isLoading && !isFailed && image && (
            <FloorPlanImage
              image={image}
              isFullLoaded={isFullLoaded}
              viewportWidth={width}
              viewportHeight={height}
              onImageRectChange={setImageRect}
            />
          )}
        </Layer>
        <Layer>  {/* UI overlay — loading/error states */}
          {isLoading && /* centered "Loading floor plan..." text */}
          {isFailed && /* centered "Failed to load floor plan" text */}
        </Layer>
      </Stage>
      {/* ZoomControls will be added here in Plan 02 */}
    </div>
    ```
  - Loading indicator: Konva `Text` centered in viewport, text="Loading floor plan...", fontSize=18, fill="#64748b"
  - Error indicator: Konva `Text` centered in viewport, text="Failed to load floor plan", fontSize=18, fill="#ef4444"
  - These can be inline JSX within FloorPlanCanvas — no need for separate component files

  **6. Update `src/client/App.tsx`:**
  - Remove ALL existing content: the placeholder Konva Stage, PLACEHOLDER_NODES array, title/subtitle text, circles, resize logic
  - Replace with a thin wrapper:
    ```tsx
    import FloorPlanCanvas from './components/FloorPlanCanvas'

    export default function App() {
      return <FloorPlanCanvas />
    }
    ```
  - Remove all unused imports (Circle, Rect, Text, Stage, Layer from react-konva; useState, useEffect from react; NavNodeType from @shared/types)
  </action>
  <verify>
  1. `npm run typecheck` passes with zero errors
  2. `npm run lint` passes with zero issues
  3. `npm run dev` → open http://localhost:5173 → floor plan image visible on subtle grid background
  4. Browser Network tab shows requests to `/api/floor-plan/thumbnail` and `/api/floor-plan/image`
  5. Floor plan is centered and fits viewport without cropping or stretching
  </verify>
  <done>Floor plan image renders on the Konva canvas with progressive loading (spinner → thumbnail → full image), subtle grid background, fit-to-screen with preserved aspect ratio, and loading/error state handling. Canvas is ready for Plan 02 to add interactive pan/zoom/rotation.</done>
</task>

</tasks>

<verification>
- Floor plan image loads and renders on the Konva canvas
- Grid pattern visible behind the floor plan
- Progressive loading works: loading indicator → thumbnail → full image
- Floor plan fits viewport with preserved aspect ratio (letterboxed)
- Error state displays when server is unavailable
- `npm run typecheck` and `npm run lint` pass with zero errors
- Server endpoints return correct Content-Type and Cache-Control headers
</verification>

<success_criteria>
- GET /api/floor-plan/image returns a valid PNG with correct headers
- GET /api/floor-plan/thumbnail returns a valid JPEG with correct headers
- Floor plan image renders centered on the Konva canvas, fit-to-screen with 40px padding
- Grid background visible behind/around the floor plan
- Progressive loading sequence works (loading indicator → thumbnail → full image)
- Fade-in transition when image first appears
- Loading and error states display correctly
- All Phase 1 verification still passes (typecheck, lint, dev server starts)
</success_criteria>

<output>
After completion, create `C:\Users\admin\.planning\phases\02-floor-plan-rendering\02-01-SUMMARY.md`
</output>
