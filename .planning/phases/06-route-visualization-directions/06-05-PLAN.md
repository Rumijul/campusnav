---
phase: 06-route-visualization-directions
plan: 05
type: execute
wave: 4
depends_on:
  - 06-04
files_modified: []
autonomous: false
requirements:
  - ROUT-03
  - ROUT-04
  - ROUT-05
  - ROUT-06

must_haves:
  truths:
    - "After selecting start + destination, an animated dashed blue line appears on the map along the route path"
    - "The DirectionsSheet opens automatically (peeked) with step-by-step directions visible"
    - "Tapping the 'Accessible' tab changes the route line to green and shows accessible directions"
    - "Each step in the sheet shows an icon, instruction text, and estimated time"
    - "Total walking time for the active route is displayed in the sheet header"
    - "The canvas legend is visible showing blue=Standard and green=Accessible"
    - "Pressing the back arrow in the sheet returns to the compact A→B strip (sheet closes)"
    - "When start or destination is cleared, the route line and sheet both disappear"
    - "If standard and accessible routes are identical, a single 'Standard (accessible)' tab/label is shown"
  artifacts:
    - path: "src/client/components/RouteLayer.tsx"
      provides: "Animated dashed route line"
    - path: "src/client/hooks/useRouteDirections.ts"
      provides: "Step generation hook"
    - path: "src/client/components/DirectionsSheet.tsx"
      provides: "Directions bottom sheet with tabs"
    - path: "src/client/components/FloorPlanCanvas.tsx"
      provides: "All components wired together"
  key_links:
    - from: "src/client/components/FloorPlanCanvas.tsx"
      to: "src/client/components/RouteLayer.tsx"
      via: "RouteLayer rendered in Stage"
      pattern: "RouteLayer"
    - from: "src/client/components/FloorPlanCanvas.tsx"
      to: "src/client/components/DirectionsSheet.tsx"
      via: "DirectionsSheet rendered as HTML sibling"
      pattern: "DirectionsSheet"
---

<objective>
Human verification of the complete Route Visualization & Directions feature — all 5 phase success criteria confirmed working on the running dev server.

Purpose: Gate progression to Phase 7 on human-confirmed visual and functional correctness.
Output: Phase 6 verified complete or gap closure plan created.
</objective>

<execution_context>
@C:/Users/admin/.config/opencode/get-shit-done/workflows/execute-plan.md
@C:/Users/admin/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Run final checks and start dev server</name>
  <files></files>
  <action>
Run all quality checks and start the dev server so human can verify:

1. `npx vitest run src/client/hooks/useRouteDirections.test.ts` — all tests pass
2. `npx tsc --noEmit` — zero TypeScript errors
3. `npx biome check .` — zero errors (warnings on pre-existing CRLF files are acceptable)
4. `npm run dev` — dev server starts (Vite + Hono)

Report results to human before checkpoint.
  </action>
  <verify>
All three CLI commands exit 0. Dev server running at http://localhost:5173.
  </verify>
  <done>
Quality checks pass, dev server running.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 2: Human verification of route visualization and directions</name>
  <action>Human tests all 6 scenarios listed below on the running dev server at http://localhost:5173.</action>
  <verify>Human confirms all scenarios pass and types "approved".</verify>
  <done>All 9 must-have truths confirmed — Phase 6 verified complete.</done>
  <what-built>
Complete Phase 6 feature: animated route lines on canvas (blue=standard, green=accessible), DirectionsSheet with Standard/Accessible tabs, step-by-step directions with icons and time, canvas legend, back arrow to return to pin selection.
  </what-built>
  <how-to-verify>
Open http://localhost:5173 and test the following scenarios:

**Scenario 1 — Basic route display:**
1. Select a start location (tap a landmark or search)
2. Select a destination (tap another landmark or search)
3. Verify: an animated dashed BLUE line appears on the map connecting start to destination
4. Verify: the DirectionsSheet peeks up from the bottom automatically
5. Verify: the sheet shows "Standard" tab active, walking time in header, step list below

**Scenario 2 — Step-by-step directions:**
6. Drag the sheet up to see the full step list
7. Verify: each step has an icon (arrow direction), instruction text, and a short time estimate
8. Verify: the last step says "Arrive at [destination name]"

**Scenario 3 — Tab switching:**
9. Tap the "Accessible" tab in the sheet header
10. Verify: the route line on the map changes to GREEN
11. Verify: the sheet step list updates to show accessible directions
12. Verify: the walking time in the header updates

**Scenario 4 — Legend:**
13. Verify: a small legend pill is visible on the map (bottom-right) showing blue=Standard, green=Accessible

**Scenario 5 — Back / dismiss:**
14. Tap the back arrow (←) in the sheet header
15. Verify: the sheet closes and the compact A→B strip reappears at the top
16. Verify: the route line remains visible on the map (route not cleared — only sheet closed)
17. Tap the X on the start field in the compact strip
18. Verify: route line disappears, sheet stays closed

**Scenario 6 — Edge cases (if reachable in test graph):**
19. If the accessible route tab is disabled (grayed): hover/long-press to verify tooltip "No accessible route available"
20. If routes are identical: verify only one "Standard (accessible)" label is shown (no second tab)

**Pass criteria:** All scenarios work as described. Report "approved" if all pass, or describe specific issues if any fail.
  </how-to-verify>
  <resume-signal>Type "approved" or describe issues found</resume-signal>
</task>

</tasks>

<verification>
Human approves all 9 must-have truths listed in frontmatter.
</verification>

<success_criteria>
- Human confirms animated route line visible on map
- Human confirms DirectionsSheet opens with step-by-step directions and walking time
- Human confirms tab switching changes route color and step list
- Human confirms legend visible
- Human confirms back arrow returns to compact strip
- Human confirms clearing start/destination removes route line
</success_criteria>

<output>
After human approval, create `.planning/phases/06-route-visualization-directions/06-05-SUMMARY.md` and update STATE.md to mark Phase 6 complete.

If issues found: create gap closure plans (06-06-PLAN.md etc.) addressing specific failures.
</output>
