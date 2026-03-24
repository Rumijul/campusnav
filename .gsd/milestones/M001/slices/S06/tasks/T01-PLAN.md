---
phase: 05.1-issues-needed-to-be-fixed
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/client/components/DirectionsSheet.tsx
  - src/server/assets/campus-graph.json
autonomous: true
requirements: [FIX-01, FIX-02]

must_haves:
  truths:
    - "After a route is selected and the DirectionsSheet peeks open, the user can still drag/pan the Konva map"
    - "Route lines on the map follow the hallway corridors — no lines cutting through walls"
    - "DirectionsSheet still opens, shows directions, and is fully interactive"
  artifacts:
    - path: "src/client/components/DirectionsSheet.tsx"
      provides: "Drawer.Overlay with pointer-events-none to suppress Vaul backdrop blocking"
      contains: "Drawer.Overlay"
    - path: "src/server/assets/campus-graph.json"
      provides: "Corrected node coordinates aligned to floor plan corridors"
      contains: "junction-a"
  key_links:
    - from: "DirectionsSheet.tsx Drawer.Overlay"
      to: "Konva Stage drag handler"
      via: "pointer-events-none prevents Vaul backdrop intercepting touch/mouse events"
      pattern: "pointer-events-none"
    - from: "campus-graph.json node coords"
      to: "RouteLayer pixel points"
      via: "buildRoutePoints in FloorPlanCanvas multiplies normalized coords × imageRect"
      pattern: "junction-a.*0\\.5.*0\\.5"
---

<objective>
Fix two blockers discovered during Phase 5+6 UAT testing:
1. Vaul's `DirectionsSheet` backdrop (`[data-vaul-overlay]`) blocks all pointer events on the Konva canvas, making the map unpannable when the route sheet is open.
2. The `campus-graph.json` fixture has abstract node positions that don't align with the floor plan's corridor layout, causing route lines to visually cut through walls.

Purpose: Both issues make the core wayfinding experience non-functional — users can't pan the map or trust the route visualization.
Output: Patched `DirectionsSheet.tsx` (Vaul overlay fix) + corrected `campus-graph.json` (corridor-aligned coordinates).
</objective>

<execution_context>
@C:/Users/LENOVO/.config/opencode/get-shit-done/workflows/execute-plan.md
@C:/Users/LENOVO/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md

@src/client/components/DirectionsSheet.tsx
@src/client/components/FloorPlanCanvas.tsx
@src/server/assets/campus-graph.json
@scripts/generate-test-images.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix Vaul backdrop blocking Konva canvas pan/drag</name>
  <files>src/client/components/DirectionsSheet.tsx</files>
  <action>
    Root cause: Vaul 1.1.2 automatically injects a `[data-vaul-overlay]` backdrop element when
    using `Drawer.Portal`. With `snapPoints=[0.35, 0.92]`, Vaul's CSS sets this overlay to
    `opacity: 0` (invisible) but it still covers the full screen and captures ALL pointer events,
    blocking Konva canvas drag/touch handlers.

    Fix: Add `<Drawer.Overlay className="pointer-events-none" />` explicitly inside `Drawer.Portal`,
    immediately before `Drawer.Content`. This overrides Vaul's implicit backdrop with a
    non-blocking one.

    Current code in DirectionsSheet.tsx:
    ```tsx
    <Drawer.Portal>
      {/* Issue 1 fix comment... */}
      <Drawer.Content
        className="fixed inset-x-0 bottom-0 z-50 flex flex-col outline-none pointer-events-none"
    ```

    Updated code:
    ```tsx
    <Drawer.Portal>
      {/* Suppress Vaul's auto-injected backdrop — it blocks Konva canvas pan/touch even at opacity:0 */}
      <Drawer.Overlay className="pointer-events-none" />
      {/* Issue 1 fix: pointer-events-none on wrapper, pointer-events-auto on visible content */}
      <Drawer.Content
        className="fixed inset-x-0 bottom-0 z-50 flex flex-col outline-none pointer-events-none"
    ```

    Do NOT add any background color or opacity to the Drawer.Overlay — it must be fully transparent
    and non-blocking (pointer-events-none only).

    Do NOT change any other part of DirectionsSheet.tsx — only add the Drawer.Overlay line.
  </action>
  <verify>
    Run `npm run build` (or `npx tsc --noEmit`) — must compile with zero TypeScript errors.
    Grep for `Drawer.Overlay` in DirectionsSheet.tsx — must exist.
    Grep for `pointer-events-none` on the Overlay — must be present.
  </verify>
  <done>
    `Drawer.Overlay className="pointer-events-none"` exists in DirectionsSheet.tsx inside
    `Drawer.Portal`, before `Drawer.Content`. Build passes.
  </done>
</task>

<task type="auto">
  <name>Task 2: Realign campus-graph.json node coordinates to floor plan corridors</name>
  <files>src/server/assets/campus-graph.json</files>
  <action>
    Root cause: The campus-graph.json fixture uses abstract normalized coordinates that don't
    match the floor plan image's actual corridor layout. Route lines (tension=0, straight segments)
    visually cut through walls.

    The floor plan SVG (1600×1000) has three main corridors:
    - Main horizontal hallway: y ≈ 0.42–0.58, center y = 0.50
    - Left vertical hallway: x ≈ 0.28–0.36, center x = 0.32
    - Right vertical hallway: x ≈ 0.64–0.72, center x = 0.68

    All junction/hallway nodes MUST be placed on these corridor centerlines so route lines
    pass through hallways, not walls. Room/landmark nodes should be placed at doorway positions
    (touching the nearest corridor).

    Update ALL node `x` and `y` values in campus-graph.json to these corrected coordinates:

    Navigation nodes (CRITICAL — must be on corridor centerlines):
    - junction-a: x=0.50, y=0.50  (center of main hallway — was 0.5, 0.55)
    - junction-b: x=0.50, y=0.32  (main hallway, north branch — was 0.5, 0.35)
    - junction-c: x=0.32, y=0.50  (left hallway meets main hallway — was 0.25, 0.55)
    - hallway-1:  x=0.50, y=0.22  (north T-junction — was 0.5, 0.2)
    - hallway-2:  x=0.68, y=0.50  (right hallway meets main hallway — was 0.75, 0.55)
    - stairs-north: x=0.10, y=0.22  (upper-left, off left hallway — was 0.08, 0.2)
    - ramp-west:  x=0.10, y=0.72  (lower-left, off left hallway — was 0.08, 0.78)

    Entrance/service nodes (place at corridor entry points):
    - entrance-main: x=0.50, y=0.95  (keep — already at bottom center entrance)
    - entrance-side: x=0.92, y=0.50  (fix: right side, on main hallway level — was 0.92, 0.6)

    Elevators (at hallway intersections):
    - elevator-north: x=0.32, y=0.18  (left hallway, upper end — was 0.2, 0.2)
    - elevator-south: x=0.68, y=0.18  (right hallway, upper end — was 0.8, 0.2)

    Restrooms (left cluster, off junction-c):
    - restroom-male:       x=0.14, y=0.42  (was 0.15, 0.5)
    - restroom-female:     x=0.14, y=0.50  (was 0.15, 0.6)
    - restroom-accessible: x=0.14, y=0.58  (was 0.15, 0.7)

    Rooms (at doorway positions touching nearest corridor):
    - room-cs-lab:    x=0.32, y=0.30  (left hallway, upper — was 0.35, 0.3)
    - room-lecture-a: x=0.68, y=0.30  (right hallway, upper — was 0.65, 0.3)
    - room-lecture-b: x=0.68, y=0.40  (right hallway, mid — was 0.65, 0.5)
    - room-office-204: x=0.32, y=0.14 (left hallway, top end — was 0.3, 0.15)
    - room-office-205: x=0.50, y=0.12 (center top — was 0.45, 0.15)
    - room-lounge:    x=0.32, y=0.68  (left hallway, lower south — was 0.35, 0.75)
    - room-print:     x=0.68, y=0.68  (right hallway, lower south — was 0.65, 0.75)
    - room-storage:   x=0.10, y=0.36  (far left — was 0.08, 0.35)

    Landmarks (centered in their areas):
    - landmark-cafeteria: x=0.50, y=0.76 (center-south — was 0.5, 0.75, keep close)
    - landmark-library:   x=0.50, y=0.12 (center-north — was 0.5, 0.15)
    - landmark-info-desk: x=0.50, y=0.88 (near entrance — was 0.5, 0.85)

    IMPORTANT: Only update `x` and `y` fields on each node. Do NOT change any other fields
    (id, label, type, searchable, floor, roomNumber, description, etc.). Do NOT change edges.
    The JSON must remain valid and parseable.
  </action>
  <verify>
    Run: `node -e "const d = require('./src/server/assets/campus-graph.json'); console.log('valid, nodes:', d.nodes.length, 'edges:', d.edges.length)"`
    Must output: `valid, nodes: 25 edges: 30`

    Run: `node -e "const d = require('./src/server/assets/campus-graph.json'); const n = d.nodes.find(x => x.id === 'junction-a'); console.log(n.x, n.y)"`
    Must output: `0.5 0.5`

    Run: `node -e "const d = require('./src/server/assets/campus-graph.json'); const n = d.nodes.find(x => x.id === 'junction-c'); console.log(n.x, n.y)"`
    Must output: `0.32 0.5`
  </verify>
  <done>
    campus-graph.json has 25 nodes and 30 edges. junction-a is at (0.5, 0.5). junction-c is at
    (0.32, 0.5). hallway-2 is at (0.68, 0.5). All navigation nodes sit on the three corridor
    centerlines (y=0.5 for main hallway, x=0.32 for left hallway, x=0.68 for right hallway).
    JSON is valid and parses without errors.
  </done>
</task>

</tasks>

<verification>
After both tasks:
1. TypeScript build passes: `npx tsc --noEmit` exits 0 with no errors
2. Biome lint passes: `npx biome check src/client/components/DirectionsSheet.tsx` exits 0
3. JSON is valid: `node -e "require('./src/server/assets/campus-graph.json')"` exits 0
4. Key node positions verified (junction-a at 0.5,0.5 — junction-c at 0.32,0.5 — hallway-2 at 0.68,0.5)
5. Drawer.Overlay with pointer-events-none exists in DirectionsSheet.tsx
</verification>

<success_criteria>
- `Drawer.Overlay className="pointer-events-none"` is present in DirectionsSheet.tsx inside Drawer.Portal
- All 25 campus-graph.json nodes have updated corridor-aligned coordinates
- Navigation nodes (junctions, hallways) sit on corridor centerlines (y=0.5, x=0.32, or x=0.68)
- TypeScript compiles clean, Biome lint passes, JSON is valid
</success_criteria>

<output>
After completion, create `.planning/phases/05.1-issues-needed-to-be-fixed/05.1-01-SUMMARY.md`
</output>
