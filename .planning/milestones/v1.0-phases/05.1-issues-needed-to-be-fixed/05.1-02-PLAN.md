---
phase: 05.1-issues-needed-to-be-fixed
plan: 02
type: execute
wave: 2
depends_on: [05.1-01]
files_modified: []
autonomous: false
requirements: [FIX-01, FIX-02]

must_haves:
  truths:
    - "After selecting a route, map can be panned and zoomed freely while the directions sheet is peeked open"
    - "Route line on map follows hallway corridors — no segments visually cut through walls"
    - "Directions sheet opens, shows directions content, and can be dragged up/down"
  artifacts:
    - path: "src/client/components/DirectionsSheet.tsx"
      provides: "Working Vaul sheet that doesn't block canvas"
    - path: "src/server/assets/campus-graph.json"
      provides: "Corridor-aligned node coordinates"
  key_links:
    - from: "user drag gesture"
      to: "Konva Stage drag handler"
      via: "pointer events pass through DirectionsSheet area"
      pattern: "map responds to drag"
---

<objective>
Human verification that both UAT bugs from Phase 5+6 are resolved:
1. Map panning works after route selection (Vaul overlay fix)
2. Route line follows floor plan corridors (campus-graph coordinate fix)

Purpose: Confirm the fixes work in the actual browser before resuming Phase 6 UAT.
Output: Verified fixes — ready to re-run Phase 6 UAT from test 1.
</objective>

<execution_context>
@C:/Users/LENOVO/.config/opencode/get-shit-done/workflows/execute-plan.md
@C:/Users/LENOVO/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/STATE.md
</context>

<tasks>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 1: Verify pan fix and corridor alignment in browser</name>
  <files>none — verification only</files>
  <action>
    Human verification of two bug fixes from Plan 01.
    Start the app: `npm run dev` then open http://localhost:5173

    **Test A — Map panning after route selection:**
    1. Tap any two visible landmarks on the map (e.g., Main Entrance → CS Lab)
    2. The route is calculated — the directions sheet should peek up from the bottom
    3. While the sheet is showing, try to drag the map (touch/mouse drag on the upper 65% of screen)
    4. Expected: Map pans freely. The sheet doesn't block your drag gesture.
    5. Also try scroll-to-zoom — should still work with sheet open.

    **Test B — Route follows corridors:**
    1. With the route showing, zoom in on the route line
    2. Expected: The blue dashed line passes through the grey hallway areas, not through colored room blocks or walls
    3. Try a different route (e.g., Main Entrance → Library) — route should go up through the central hallway area
    4. Expected: No lines visually cutting through wall areas.

    Type "approved" if both tests pass, or describe remaining issues.
  </action>
  <verify>Human confirms: pan works with sheet open AND route line follows corridors</verify>
  <done>User types "approved" — both pan and corridor-routing are confirmed working</done>
</task>

</tasks>

<verification>
Human approves both Test A (pan works) and Test B (route follows corridors).
</verification>

<success_criteria>
- User confirms map is pannable with directions sheet open
- User confirms route line follows hallway corridors (not through walls)
- Both UAT blockers from Phase 5/6 are resolved
- Ready to resume Phase 6 UAT from test 1
</success_criteria>

<output>
After completion, create `.planning/phases/05.1-issues-needed-to-be-fixed/05.1-02-SUMMARY.md`
</output>
