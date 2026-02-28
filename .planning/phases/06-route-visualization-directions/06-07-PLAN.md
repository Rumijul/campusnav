---
phase: 06-route-visualization-directions
plan: 07
type: execute
wave: 5
depends_on:
  - 06-06
files_modified:
  - src/client/components/FloorPlanCanvas.tsx
autonomous: false
gap_closure: true
requirements:
  - ROUT-03
  - ROUT-04

must_haves:
  truths:
    - "Step-by-step directions are visible in the sheet — each step has an icon, instruction, and time estimate"
    - "The Accessible tab is visible and tappable when a route uses inaccessible edges (stairs)"
    - "Tapping Accessible tab changes route line from blue to green with updated directions"
  artifacts:
    - path: "src/client/components/FloorPlanCanvas.tsx"
      provides: "Verified step display and accessible tab"
---

<objective>
Verify and fix two UAT gaps relating to directions content (test 3) and accessible tab (test 4).

**Root cause analysis (from code review):**

**Test 4 — Accessible tab "not working/seen":**
27 of 30 edges in campus-graph.json are `accessible: true`. For most route pairs, the standard and accessible algorithms find the SAME path → `routesIdentical=true` → Case 2 (single chip, no tabs). The accessible tab only appears when the standard route traverses inaccessible edges (stairs-north) while the accessible route avoids them.

The code is CORRECT. The tab IS implemented. The issue is the test route chosen by the user didn't involve stairs-north. To demonstrate the feature, the route must be: `room-storage` → `elevator-north` (or vice versa). Standard takes `room-storage → stairs-north → elevator-north` (weight 0.27); accessible takes the long corridor path (weight 1.17). These ARE different routes → two tabs appear.

**Test 3 — Step list "not working/seen":**
The step list is rendered in `<div className="flex-1 overflow-y-auto">` inside the peek-height sheet (260px). At peek height, the header takes ~82px, leaving ~178px for content. Tabs take ~60px, one step takes ~56px → SHOULD be visible without expanding.

The issue may be:
a) The user tested a route where `standard.found=false` → "No route found" message
b) The user didn't realize they need to drag/expand the sheet to see more steps
c) The directions (useRouteDirections) generates very few steps for straight-line routes

Fix: This plan's task is human verification with a SPECIFIC test route that:
- Demonstrates accessible tab (room-storage → elevator-north)
- Verifies step list is populated and visible
</objective>

<context>
@.planning/PROJECT.md
@.planning/STATE.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Start dev server</name>
  <files></files>
  <action>
1. `npx tsc --noEmit` — confirm TypeScript clean (after 06-06 fixes)
2. `npm run dev` — start Vite + Hono dev server at http://localhost:5173

Report the server URL to the user.
  </action>
  <verify>
Dev server running. TypeScript clean.
  </verify>
  <done>
Dev server started, ready for human verification.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 2: Verify accessible tab and step list with specific test routes</name>
  <action>Human tests the two specific scenarios below on the running dev server.</action>
  <verify>Human confirms accessible tab shows for the stairs route, and step list is visible.</verify>
  <done>Both scenarios verified.</done>
  <what-built>
Phase 6 route visualization with Standard/Accessible tabs, step-by-step directions, animated route line, legend, and back-arrow navigation.
  </what-built>
  <how-to-verify>
Open http://localhost:5173 and test these two specific scenarios:

**Scenario A — Accessible tab (requires stairs route):**
1. In the search bar, set start: **"Room Storage"** (type "storage" to find it)
2. Set destination: **"Elevator North"** (type "elevator north")
3. Verify: TWO tabs appear in the sheet — "Standard" (blue) and "Accessible" (green)
4. Standard tab should be active. The route line is BLUE.
5. Tap the "Accessible" tab.
6. Verify: the route line changes to GREEN
7. Verify: the step list updates to show a longer path (via corridors instead of stairs)

Why this route: Storage→ElevatorNorth standard path goes through inaccessible stairs (weight 0.27). Accessible path goes through corridors (weight 1.17). These are different paths → two tabs appear.

**Scenario B — Step list:**
1. Set start: **"Main Entrance"** (type "entrance")
2. Set destination: **"Library"** (type "library")
3. Verify: DirectionsSheet opens automatically
4. Verify: In the sheet, you can see at least one step with a direction icon, instruction text, and time estimate
5. Drag the sheet up to see the full step list
6. Verify: the last step says "Arrive at Library"

**Scenario C — Back arrow (from 06-06 fix):**
7. While the sheet is open, tap the ← back arrow in the sheet header
8. Verify: sheet closes, the compact A→B strip reappears at the top
9. Verify: the route line (blue) is STILL VISIBLE on the map

Report: "approved" if all three scenarios work, or describe specific failures.
  </how-to-verify>
  <resume-signal>Type "approved" or describe issues found</resume-signal>
</task>

</tasks>

<verification>
Human approves all three scenarios above.
</verification>

<success_criteria>
- Accessible tab appears for room-storage → elevator-north route
- Tapping accessible tab changes line to green with longer corridor directions
- Step list visible in peek mode with icon, instruction, time
- Back arrow closes sheet while keeping route visible
</success_criteria>

<output>
If approved: create `06-07-SUMMARY.md`, update STATE.md to mark Phase 6 complete.
If issues: document specific failures as new gaps and route to additional fix plan.
</output>
