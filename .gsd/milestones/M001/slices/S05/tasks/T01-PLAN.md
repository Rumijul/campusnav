---
phase: 05-search-location-selection
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/client/hooks/useRouteSelection.ts
  - src/client/components/SelectionMarkerLayer.tsx
  - src/client/components/FloorPlanCanvas.tsx
  - src/client/components/LandmarkLayer.tsx
autonomous: true
requirements: [SRCH-02]

must_haves:
  truths:
    - "User can tap a landmark marker to set it as start or destination"
    - "Selected start shows an 'A' labeled pin on the map"
    - "Selected destination shows a 'B' labeled pin on the map"
    - "Tapping a landmark when no field is active fills the start slot first"
    - "User can swap start and destination"
    - "User can clear a selected start or destination"
  artifacts:
    - path: "src/client/hooks/useRouteSelection.ts"
      provides: "Route selection state management (start, destination, swap, clear, setFromTap)"
      exports: ["useRouteSelection"]
    - path: "src/client/components/SelectionMarkerLayer.tsx"
      provides: "A/B labeled pin markers for selected start and destination"
      exports: ["SelectionMarkerLayer"]
    - path: "src/client/components/FloorPlanCanvas.tsx"
      provides: "Integrated route selection state with landmark tap wiring"
  key_links:
    - from: "src/client/components/FloorPlanCanvas.tsx"
      to: "src/client/hooks/useRouteSelection.ts"
      via: "useRouteSelection() hook call"
      pattern: "useRouteSelection"
    - from: "src/client/components/LandmarkLayer.tsx"
      to: "src/client/components/FloorPlanCanvas.tsx"
      via: "onSelectNode callback now feeds into route selection"
      pattern: "onSelectNode"
    - from: "src/client/components/SelectionMarkerLayer.tsx"
      to: "src/client/hooks/useRouteSelection.ts"
      via: "Reads start/destination from selection state"
      pattern: "start.*destination"
---

<objective>
Create the route selection state model and A/B pin markers for start/destination on the map.

Purpose: Establishes the core selection data flow that the search UI (Plan 02) and route trigger (Plan 02) depend on. Users can tap landmarks to set start/destination without search — satisfying SRCH-02 (tap-to-select).

Output: `useRouteSelection` hook, `SelectionMarkerLayer` component, updated FloorPlanCanvas with selection state wiring.
</objective>

<execution_context>
@C:/Users/LENOVO/.config/opencode/get-shit-done/workflows/execute-plan.md
@C:/Users/LENOVO/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md

@src/shared/types.ts
@src/client/components/FloorPlanCanvas.tsx
@src/client/components/LandmarkLayer.tsx
@src/client/components/LandmarkMarker.tsx
@src/client/components/LandmarkSheet.tsx
@src/client/hooks/useMapViewport.ts
@src/client/hooks/useGraphData.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: useRouteSelection hook and SelectionMarkerLayer component</name>
  <files>src/client/hooks/useRouteSelection.ts, src/client/components/SelectionMarkerLayer.tsx</files>
  <action>
  Create `src/client/hooks/useRouteSelection.ts`:

  State:
  - `start: NavNode | null` — the selected origin
  - `destination: NavNode | null` — the selected destination
  - `activeField: 'start' | 'destination'` — which field will receive the next selection (starts as 'start')

  Exported functions:
  - `setStart(node: NavNode | null)` — sets start, auto-advances activeField to 'destination'
  - `setDestination(node: NavNode | null)` — sets destination, auto-advances activeField to 'start'
  - `setFromTap(node: NavNode)` — fills whichever field `activeField` points to. If the tapped node is already set as the OTHER field, swap them instead of duplicating. After setting, advance activeField to the other field.
  - `swap()` — swaps start and destination (only if at least one is set)
  - `clearStart()` — clears start, sets activeField to 'start'
  - `clearDestination()` — clears destination, sets activeField to 'destination'
  - `clearAll()` — clears both, resets activeField to 'start'
  - `bothSelected: boolean` — derived: `start !== null && destination !== null`

  Return type: `RouteSelection` (export the interface too for Plan 02 to consume).

  Create `src/client/components/SelectionMarkerLayer.tsx`:

  Props: `start: NavNode | null`, `destination: NavNode | null`, `imageRect`, `stageScale` (same pattern as LandmarkLayer).

  Renders a react-konva `<Layer>` with up to two pin markers:
  - Start pin: labeled "A" — use a Group with a filled Circle (radius 12, fill #22c55e green) + white Text "A" centered inside. Counter-scaled like LandmarkMarker (scaleX/Y = 1/stageScale).
  - Destination pin: labeled "B" — same pattern, Circle fill #ef4444 red, Text "B".
  - Position: same normalized-to-pixel conversion as LandmarkMarker (`imageRect.x + node.x * imageRect.width`).
  - Pins render ABOVE landmark markers (Layer ordering in FloorPlanCanvas will handle this).
  - No click handler on pins — they are display-only indicators.

  IMPORTANT per user decision: These are LABELED pins ("A"/"B"), NOT color-coded markers. The label text must be clearly visible (white, bold, fontSize 14, centered in circle).
  </action>
  <verify>TypeScript compiles: `npx tsc --noEmit`. Biome lint passes: `npx biome check src/client/hooks/useRouteSelection.ts src/client/components/SelectionMarkerLayer.tsx`.</verify>
  <done>useRouteSelection hook exports all state+functions. SelectionMarkerLayer renders A/B pins from start/destination NavNode props. Both files pass TypeScript and Biome checks.</done>
</task>

<task type="auto">
  <name>Task 2: Wire route selection into FloorPlanCanvas and modify landmark tap behavior</name>
  <files>src/client/components/FloorPlanCanvas.tsx, src/client/components/LandmarkLayer.tsx</files>
  <action>
  Update `src/client/components/FloorPlanCanvas.tsx`:

  1. Import and call `useRouteSelection()` to get selection state.
  2. Add `<SelectionMarkerLayer>` AFTER `<LandmarkLayer>` inside Stage (so pins render on top).
  3. Change landmark tap behavior per user decision: when a landmark is tapped, call `setFromTap(node)` instead of `setSelectedNode(node)`. This means tapping a landmark sets it as start or destination — no detail sheet opens.
  4. Keep `selectedNode` state for now but disconnect it from landmark taps. The LandmarkSheet should NOT open when tapping a landmark that gets assigned as start/dest. Set `selectedNode` to null when a node is assigned via `setFromTap`. The LandmarkSheet can still be rendered but will effectively never open in this phase (it may be repurposed in Phase 6 for route info).
  5. Pass `start` and `destination` node IDs to LandmarkLayer so it can visually differentiate selected-as-waypoint nodes from regular landmarks (hide the regular marker when a node is selected as start/dest since the A/B pin replaces it).
  6. Stage onClick (background tap) should NOT clear route selections — only the search bar X buttons will clear selections (Plan 02). Background tap should still dismiss the LandmarkSheet if it were open.

  Update `src/client/components/LandmarkLayer.tsx`:

  1. Add optional prop `hiddenNodeIds?: string[]` — node IDs to exclude from rendering (start/dest nodes will be hidden since SelectionMarkerLayer renders their A/B pins instead).
  2. Filter out nodes whose IDs are in `hiddenNodeIds` before rendering markers.
  </action>
  <verify>TypeScript compiles: `npx tsc --noEmit`. Biome lint passes: `npx biome check src/client/components/FloorPlanCanvas.tsx src/client/components/LandmarkLayer.tsx`. Dev server runs without errors: `npm run dev` (check terminal for compilation errors).</verify>
  <done>Tapping a landmark marker calls setFromTap — sets start (first tap) or destination (second tap). A/B pins appear at selected positions. LandmarkSheet does NOT open on tap. Regular landmark marker hides when its node is selected as start/dest (replaced by A/B pin). Swap/clear functions available in hook for Plan 02's search UI.</done>
</task>

</tasks>

<verification>
- `npx tsc --noEmit` passes with zero errors
- `npx biome check .` passes with zero errors
- `npm run dev` starts without compilation errors
- Tapping a landmark creates an "A" pin (first tap) and "B" pin (second tap) on the map
- A/B pins are counter-scaled (constant screen size during zoom)
- Regular marker disappears when its node is selected as start/dest
</verification>

<success_criteria>
- useRouteSelection hook manages start/destination state with tap assignment, swap, and clear
- SelectionMarkerLayer renders labeled "A" and "B" pins at selected node positions
- Landmark taps feed into route selection (not detail sheet)
- LandmarkLayer hides markers for nodes selected as start/dest
- All TypeScript and Biome checks pass
</success_criteria>

<output>
After completion, create `.planning/phases/05-search-location-selection/05-01-SUMMARY.md`
</output>
