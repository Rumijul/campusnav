---
phase: 19-student-floor-tab-ui
plan: "04"
type: execute
wave: 3
depends_on: ["19-03"]
files_modified: []
autonomous: false
requirements: [MFLR-05, MFLR-06, CAMP-05]

must_haves:
  truths:
    - "On app open, Floor 1 of the first building is active with correct floor plan image shown"
    - "Floor tab strip is visible with building selector and floor tab buttons"
    - "Switching floors loads the correct floor plan image and re-fits to screen"
    - "Floor tab strip disappears when Get Directions is tapped"
    - "Route line shows only the segment on the currently active floor"
    - "Manual floor tab switch after closing sheet shows the new floor's route segment"
    - "Tab strip hidden entirely when only one floor exists (single-floor campus test)"
    - "Dimmed elevator connector tap auto-switches to that connector's floor"
    - "Building selector switches to campus overhead map when Campus selected"
  artifacts: []
  key_links: []
---

<objective>
Human verification of the complete Phase 19 student floor tab UI.

Purpose: Visual and interactive behaviors cannot be verified by automated tests. This checkpoint confirms all locked decisions from CONTEXT.md are working in the browser before the phase is marked complete.
Output: Human approval and phase sign-off.
</objective>

<execution_context>
@C:/Users/admin/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/admin/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/19-student-floor-tab-ui/19-CONTEXT.md
@.planning/phases/19-student-floor-tab-ui/19-RESEARCH.md
@.planning/phases/19-student-floor-tab-ui/19-VALIDATION.md
</context>

<tasks>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>
Complete student floor tab UI:
- FloorTabStrip component (building selector + floor tab buttons) rendered above sheets
- Active floor filtering: active floor nodes at full opacity, adjacent elevator connectors dimmed
- Cross-floor route segment filtering: RouteLayer shows only active floor's route
- Auto-switch to start node's floor when Get Directions triggered
- Tab strip hidden when DirectionsSheet is open
- Tab strip hidden when only one floor total exists
- Dimmed elevator connector tap auto-switches to that floor
- Campus building shown in selector; campus overhead map loads when selected
  </what-built>
  <how-to-verify>
Start the development server:
```
npm run dev
```
Open http://localhost:5173 in the browser (student view).

**Scenario A — Default floor on load:**
1. Open http://localhost:5173
2. Verify: Floor 1 of the first building is active (floor "Floor 1" tab is highlighted blue)
3. Verify: The correct floor plan image is displayed
4. Verify: Floor tab strip is visible at the bottom of the screen

**Scenario B — Manual floor switching:**
1. Tap "Floor 2" tab (requires a building with 2+ floors in the database)
2. Verify: Floor 2 image loads and fits to screen
3. Verify: Only Floor 2 landmarks are visible (Floor 1 landmarks gone)
4. Verify: Floor 2 tab is now highlighted blue
5. Verify: fitToScreen fires — floor plan re-centers in viewport

**Scenario C — Building selector:**
1. Use the building selector dropdown to switch to a different building
2. Verify: Floor tabs update to show new building's floors
3. Verify: First floor of new building becomes active and its image loads
4. If Campus option exists: Select "Campus"
5. Verify: Campus overhead image loads, no floor tabs shown (campus has one map)

**Scenario D — Route computed, auto-switches to start floor:**
1. Select a start node on Floor 2 (search or tap)
2. Select a destination on Floor 3
3. Tap "Get Directions"
4. Verify: Active floor switches to Floor 2 (start node's floor) — Floor 2 tab highlighted
5. Verify: DirectionsSheet opens at bottom
6. Verify: Tab strip is hidden (sheetOpen=true)
7. Verify: Route line shows only the Floor 2 route segment

**Scenario E — Cross-floor route browsing:**
1. With route computed (F2→F3), close the DirectionsSheet using Back arrow
2. Verify: Tab strip reappears
3. Tap "Floor 3" tab
4. Verify: Floor 3 route segment is now visible
5. Verify: Floor 3 landmarks visible

**Scenario F — Dimmed connector tap auto-switches:**
1. On Floor 1 canvas, locate a dimmed elevator marker (appears at 35% opacity)
2. Tap the dimmed elevator
3. Verify: Active floor switches to the elevator's floor (e.g. Floor 2) automatically
4. Verify: Floor 2 image loads and fits to screen
5. Verify: No detail sheet opened (auto-switch taps skip detail sheet)

**Scenario G — Single-floor campus (zero new chrome):**
1. If the campus/building only has one floor total:
2. Verify: Floor tab strip is completely hidden
3. Verify: No building selector visible
4. Verify: App behaves exactly as v1.0

**All scenarios must pass before typing "approved".**
  </how-to-verify>
  <resume-signal>Type "approved" if all scenarios pass, or describe which scenarios failed and what was observed.</resume-signal>
</task>

</tasks>

<verification>
Human approval received for all 7 scenarios (A through G).
</verification>

<success_criteria>
All 9 must-have truths confirmed by human observation in the browser. Phase 19 requirements MFLR-05, MFLR-06, CAMP-05 verified as complete.
</success_criteria>

<output>
After completion, create `.planning/phases/19-student-floor-tab-ui/19-04-SUMMARY.md`
</output>
