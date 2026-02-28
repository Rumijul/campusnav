---
phase: 13-restore-location-detail
plan: 03
type: execute
wave: 3
depends_on:
  - 13-02
files_modified: []
autonomous: false
requirements:
  - ROUT-07

must_haves:
  truths:
    - "Tapping a landmark shows a bottom sheet with the landmark's name and type visible at peek height"
    - "Pulling up the detail sheet reveals additional fields: roomNumber, description, buildingName, floor, accessibilityNotes"
    - "The detail sheet close button dismisses the sheet"
    - "After dismissing the detail sheet, tapping the same landmark reopens it"
    - "Tapping a landmark to set A, then tapping another landmark to set B — detail sheet closes and DirectionsSheet opens"
    - "With DirectionsSheet open, the map canvas above the sheet is still pannable and zoomable"
    - "The canvas legend repositions upward when the detail sheet is open"
---

<objective>
Human verification that ROUT-07 is fully working: detail sheet opens on landmark tap, coexists with route selection, is dismissible, and does not block map interaction.

Purpose: Confirms all three ROADMAP success criteria for Phase 13 are satisfied in the live browser.
Output: Human approval or issue report for gap closure
</objective>

<execution_context>
@C:/Users/admin/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/admin/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
</context>

<tasks>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 1: Human verification of location detail sheet and route selection coexistence</name>
  <action>Run `npm run dev`, open http://localhost:5173. Execute all 7 verification steps below to confirm ROUT-07 is working correctly alongside the Phase 5 route selection flow.</action>
  <verify>See how-to-verify steps below.</verify>
  <done>All 7 must-have truths confirmed: detail sheet opens on tap, fields visible, close button works, drag-down dismisses, route selection still assigns pins and opens DirectionsSheet, canvas pans above sheet, legend repositions.</done>
  <what-built>
LocationDetailSheet component (Plan 01) wired into FloorPlanCanvas via dual-action tap handler (Plan 02). Tapping a landmark now opens a bottom sheet showing location details AND assigns the route selection pin (A or B). The detail sheet auto-closes when a route is computed. The DirectionsSheet (directions panel) renders above the detail sheet in z-order.
  </what-built>
  <how-to-verify>
Start the app: `npm run dev` — open http://localhost:5173

**Test 1: Detail sheet opens on tap**
1. Tap any labeled landmark on the map (classroom, office, entrance, etc.)
2. Expected: A bottom sheet peeks up at the bottom showing the landmark's name and type
3. Confirm the name matches the landmark you tapped

**Test 2: Detail sheet content**
1. With the detail sheet open, drag it upward
2. Expected: Sheet expands to ~75% of the screen height
3. Confirm any available fields are visible (Room number, Description, Building, Floor, Accessibility notes — shown only if present for that landmark)

**Test 3: Dismiss via close button**
1. Tap the x button in the top-right of the detail sheet
2. Expected: Sheet disappears
3. Tap the same landmark again — sheet reopens

**Test 4: Dismiss via drag-down**
1. Open the detail sheet by tapping a landmark
2. Drag the sheet handle downward
3. Expected: Sheet collapses and closes

**Test 5: Route selection still works (CRITICAL)**
1. Tap landmark A — detail sheet opens, A pin appears on map
2. Tap landmark B — detail sheet closes automatically, B pin appears on map
3. Expected: DirectionsSheet opens with the route between A and B
4. Confirm route is still visible and directions are shown

**Test 6: Canvas pan above detail sheet**
1. Open the detail sheet by tapping a landmark (peek height visible)
2. Pan the map canvas in the area above the sheet
3. Expected: Map pans freely without interference from the sheet

**Test 7: Legend repositions**
1. Ensure a route is active so the legend is visible
2. Open the detail sheet — legend should move upward
3. Close the detail sheet — legend drops back to default position

Report any issues that occur during these steps.
  </how-to-verify>
  <resume-signal>Type "approved" if all 7 tests pass, or describe which tests failed and what happened</resume-signal>
</task>

</tasks>

<verification>
Human tester confirms all 7 verification steps pass in live browser.
</verification>

<success_criteria>
All three ROADMAP Phase 13 success criteria confirmed:
1. Tapping a landmark shows a detail panel with name, roomNumber, type, description, buildingName, accessibilityNotes
2. The detail panel does not interfere with tap-to-select-route-pin behavior (Phase 5 flow works)
3. Detail panel is dismissible (x button and drag-down both work) and does not block map canvas
</success_criteria>

<output>
After completion, create `.planning/phases/13-restore-location-detail/13-03-SUMMARY.md`
</output>
