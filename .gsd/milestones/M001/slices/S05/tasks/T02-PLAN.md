---
phase: 05-search-location-selection
plan: 02
type: execute
wave: 2
depends_on: ["05-01"]
files_modified:
  - src/client/hooks/useLocationSearch.ts
  - src/client/components/SearchOverlay.tsx
  - src/client/components/FloorPlanCanvas.tsx
  - src/client/hooks/useRouteSelection.ts
autonomous: true
requirements: [SRCH-01, SRCH-03, SRCH-04]

must_haves:
  truths:
    - "User can type a room name or keyword and see autocomplete suggestions that update as they type"
    - "User can select start and destination from a searchable dropdown list without using the map"
    - "User can search for the nearest point of interest by type from a selected location"
    - "Selected start and destination are visually highlighted on the map with distinct markers"
    - "Search bars collapse to a compact strip showing From-To when both are selected"
    - "Swap icon reverses start and destination"
    - "Map auto-pans to show both pins when both start and destination are set"
    - "Route auto-triggers when both start and destination are selected"
  artifacts:
    - path: "src/client/hooks/useLocationSearch.ts"
      provides: "Fuzzy location search with autocomplete and nearest-POI search"
      exports: ["useLocationSearch"]
    - path: "src/client/components/SearchOverlay.tsx"
      provides: "Dual search bars, full-screen suggestions, compact strip, swap, nearest-POI"
      exports: ["SearchOverlay"]
    - path: "src/client/components/FloorPlanCanvas.tsx"
      provides: "SearchOverlay integrated, auto-pan on both selected, route trigger"
  key_links:
    - from: "src/client/components/SearchOverlay.tsx"
      to: "src/client/hooks/useLocationSearch.ts"
      via: "useLocationSearch() for autocomplete results"
      pattern: "useLocationSearch"
    - from: "src/client/components/SearchOverlay.tsx"
      to: "src/client/hooks/useRouteSelection.ts"
      via: "RouteSelection state for setting start/dest from search"
      pattern: "RouteSelection"
    - from: "src/client/components/FloorPlanCanvas.tsx"
      to: "src/client/components/SearchOverlay.tsx"
      via: "Renders SearchOverlay as HTML sibling above Stage"
      pattern: "SearchOverlay"
    - from: "src/client/components/FloorPlanCanvas.tsx"
      to: "src/shared/pathfinding/engine.ts"
      via: "Creates PathfindingEngine and triggers route calculation"
      pattern: "PathfindingEngine"
---

<objective>
Build the search UI with autocomplete, nearest-POI search, and wire the complete selection-to-route-trigger flow.

Purpose: Delivers the full search experience (SRCH-01, SRCH-03, SRCH-04) — users can find locations by typing, select from suggestions, search nearest POI, and see the map respond with auto-pan and route calculation. This completes the Phase 5 functional requirements.

Output: `useLocationSearch` hook, `SearchOverlay` component (dual search bars + suggestions + compact strip + nearest-POI), updated FloorPlanCanvas with auto-pan and route trigger.
</objective>

<execution_context>
@C:/Users/LENOVO/.config/opencode/get-shit-done/workflows/execute-plan.md
@C:/Users/LENOVO/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/05-search-location-selection/05-01-SUMMARY.md

@src/shared/types.ts
@src/shared/pathfinding/engine.ts
@src/shared/pathfinding/types.ts
@src/client/components/FloorPlanCanvas.tsx
@src/client/hooks/useRouteSelection.ts
@src/client/hooks/useGraphData.ts
@src/client/hooks/useMapViewport.ts
@src/client/components/LandmarkLayer.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: useLocationSearch hook and SearchOverlay component</name>
  <files>src/client/hooks/useLocationSearch.ts, src/client/components/SearchOverlay.tsx</files>
  <action>
  Create `src/client/hooks/useLocationSearch.ts`:

  Input: `nodes: NavNode[]` (the full node list from useGraphData).
  State: `query: string`, `results: NavNode[]`.

  Exported functions:
  - `search(query: string)` — filters nodes where `searchable === true` and matches query (case-insensitive) against `label`, `roomNumber`, and `type`. Returns max 8 results. Only triggers when query length >= 2 (per user decision). Returns empty array for shorter queries.
  - `searchNearest(fromNode: NavNode, poiType: NavNodeType)` — finds all visible nodes of the given type, sorts by Euclidean distance from `fromNode` (using normalized x,y coordinates), returns top 5 results. Use `calculateWeight` from `@shared/pathfinding/graph-builder` for distance.
  - `clearSearch()` — resets query and results.

  Matching strategy (Claude's discretion): substring match on `label` and `roomNumber`, exact prefix match on `type` (so typing "rest" matches type "restroom"). Order results: exact label prefix matches first, then substring matches.

  Create `src/client/components/SearchOverlay.tsx`:

  This is an HTML overlay (NOT Konva) — rendered as a sibling div to the Stage, positioned above the map using absolute/fixed positioning + z-index (same pattern as ZoomControls and LandmarkSheet).

  Props: `selection: RouteSelection` (the full return from useRouteSelection), `nodes: NavNode[]` (for search), `onRouteTrigger: () => void` (callback when both selected).

  **States:**
  - `mode: 'expanded' | 'compact'` — expanded shows full search bars, compact shows From-To strip
  - `focusedField: 'start' | 'destination' | null` — which search input is actively being typed in
  - `showSuggestions: boolean` — whether the full-screen suggestion overlay is visible

  **Layout — Expanded mode (default, when not both selected):**
  - Two input fields stacked vertically at top of screen:
    - "From:" field — placeholder "Search start location..." — shows `selection.start?.label` when set
    - "To:" field — placeholder "Search destination..." — shows `selection.destination?.label` when set
  - Swap icon button between the two fields (Google Maps style ⇅ icon) — calls `selection.swap()`
  - Each field has an X clear button on the right when it has a value — calls `selection.clearStart()` or `selection.clearDestination()`
  - Background: white/semi-transparent with shadow, rounded corners, padding. Use Tailwind.
  - z-index above the map but below full-screen suggestions.

  **Layout — Full-screen suggestions (when an input is focused and query.length >= 2):**
  - Takes over full screen (white background, position fixed inset-0, z-50)
  - Shows the focused input at top with a back arrow/cancel button
  - Below input: suggestion list (max 8 items)
  - Each suggestion row: type icon (small colored dot matching LandmarkMarker TYPE_COLORS) + `label` (bold) + `roomNumber` (gray, if exists) + type label (small, gray)
  - Tapping a suggestion: calls `selection.setStart(node)` or `selection.setDestination(node)` depending on `focusedField`, hides suggestions, unfocuses input
  - "Nearest" section below suggestions (Claude's discretion for invoking nearest-POI per user decision):
    - Show a row of POI type quick-filter buttons ("Nearest Restroom", "Nearest Elevator", "Nearest Entrance") when `selection.start` is set and the focused field is 'destination'
    - Tapping a quick-filter calls `searchNearest(selection.start, type)` and shows results as suggestions
    - This satisfies SRCH-04: nearest POI by type from a selected location

  **Layout — Compact strip (when both start and destination are set):**
  - Single row: "A: {start.label} → B: {dest.label}" with a swap button and expand button
  - Tapping the strip expands back to full search bars
  - Compact strip floats at top of screen, minimal height, semi-transparent background

  When a suggestion is selected and `selection.bothSelected` becomes true:
  - Switch to compact mode
  - Call `onRouteTrigger()` callback

  IMPORTANT: Use standard HTML/React (not Konva) for all search UI. Tailwind for styling. The search overlay must NOT interfere with Konva canvas touch/pointer events when not actively receiving input.

  Keyboard handling: Escape closes suggestions and unfocuses. Clicking/tapping outside suggestions area also closes.
  </action>
  <verify>TypeScript compiles: `npx tsc --noEmit`. Biome lint passes: `npx biome check src/client/hooks/useLocationSearch.ts src/client/components/SearchOverlay.tsx`.</verify>
  <done>useLocationSearch provides autocomplete (2+ chars, max 8 results, matches label/roomNumber/type) and searchNearest (by POI type, sorted by distance, top 5). SearchOverlay renders dual search bars, full-screen suggestions with type icons, compact strip, swap button, clear buttons, and nearest-POI quick-filter buttons. All TypeScript and Biome checks pass.</done>
</task>

<task type="auto">
  <name>Task 2: Integrate SearchOverlay, auto-pan, and route trigger into FloorPlanCanvas</name>
  <files>src/client/components/FloorPlanCanvas.tsx, src/client/hooks/useRouteSelection.ts</files>
  <action>
  Update `src/client/components/FloorPlanCanvas.tsx`:

  1. Import `SearchOverlay` and render it as the FIRST child of the outer `<div>` wrapper (above Stage in DOM = visually on top of map). Pass `selection` (from useRouteSelection), `nodes` (from useGraphData when loaded), and `onRouteTrigger` callback.

  2. Implement auto-pan when both start and destination are set (per user decision: "map auto-pans/zooms to show both pins in frame"):
     - When `selection.bothSelected` transitions from false to true, compute a bounding box containing both start and destination nodes (with padding).
     - Use the Konva stage ref to animate (Konva.Tween, duration 0.4s, EaseInOut) the stage position and scale so both pins are visible with ~15% padding on all sides.
     - Helper function: `fitToBounds(nodeA: NavNode, nodeB: NavNode)` — converts normalized coords to pixel coords using imageRect, computes required scale and position, applies via Tween.

  3. Implement route trigger when both are selected (per user decision: "Route auto-draws as soon as both start and destination are set"):
     - Create the PathfindingEngine from the loaded NavGraph (memoize with useMemo).
     - When `onRouteTrigger` fires (or when `selection.bothSelected` becomes true from tap), call `engine.findRoute(start.id, destination.id, 'standard')` and `engine.findRoute(start.id, destination.id, 'accessible')`.
     - Store the PathResult(s) in state: `routeResult: { standard: PathResult; accessible: PathResult } | null`.
     - Show a brief toast notification "Route calculated" using a simple auto-dismissing div (3 seconds, bottom of screen, Tailwind styled). No external toast library — just a div with setTimeout to hide.
     - If no route found (both `.found === false`): show toast "No route found" in red/warning style (Claude's discretion for error handling per user decision).
     - The actual route LINE drawing is Phase 6 — this phase only computes and stores the result + shows the toast. The `routeResult` state will be consumed by Phase 6's route visualization layer.

  4. Pass `activeField` from selection to LandmarkLayer so that landmark markers show a subtle visual hint of which field is active (optional — e.g., a slight pulse or different cursor). This is discretionary — skip if it adds complexity without clear UX benefit.

  Update `src/client/hooks/useRouteSelection.ts` (minor):
  - Add `setActiveField(field: 'start' | 'destination')` to allow the search overlay to explicitly set which field is active when user focuses an input. Export it in the RouteSelection interface.
  </action>
  <verify>TypeScript compiles: `npx tsc --noEmit`. Biome lint passes: `npx biome check src/client/components/FloorPlanCanvas.tsx src/client/hooks/useRouteSelection.ts`. Dev server runs: `npm run dev` — verify in terminal that compilation succeeds with no errors.</verify>
  <done>SearchOverlay renders above the map with dual search bars. Selecting both start+destination via search or tap causes: (1) map auto-pans to show both pins, (2) PathfindingEngine computes route, (3) toast shows "Route calculated" or "No route found", (4) search bars collapse to compact strip. Route result stored in state for Phase 6 consumption.</done>
</task>

</tasks>

<verification>
- `npx tsc --noEmit` passes with zero errors
- `npx biome check .` passes with zero errors
- `npm run dev` starts without compilation errors
- Typing 2+ characters in a search field shows autocomplete suggestions
- Selecting a suggestion from the list sets it as start or destination
- Full-screen suggestion overlay appears when typing, dismisses on selection/escape
- Swap button reverses start and destination labels
- X button clears a field
- Nearest-POI quick-filter buttons appear when start is set and destination field is focused
- Compact strip appears when both are selected
- Map auto-pans/zooms to frame both A and B pins
- Toast "Route calculated" appears briefly after both are selected
</verification>

<success_criteria>
- Autocomplete search works with 2+ chars, matching label/roomNumber/type, max 8 results (SRCH-01, SRCH-03)
- Nearest-POI search available by type from selected location (SRCH-04)
- Search bars collapse to compact strip on both-selected
- Auto-pan frames both pins with smooth animation
- Route computed via PathfindingEngine and result stored in state
- Toast confirms route calculation
- All TypeScript and Biome checks pass
</success_criteria>

<output>
After completion, create `.planning/phases/05-search-location-selection/05-02-SUMMARY.md`
</output>
