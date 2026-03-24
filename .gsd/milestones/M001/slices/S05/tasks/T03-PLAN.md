---
phase: 05-search-location-selection
plan: 03
type: execute
wave: 3
depends_on: ["05-02"]
files_modified: []
autonomous: false
requirements: [SRCH-01, SRCH-02, SRCH-03, SRCH-04]

must_haves:
  truths:
    - "User can type a room name and see autocomplete suggestions updating as they type"
    - "User can tap a landmark on the map to set it as start or destination"
    - "User can select start and destination from search without using the map"
    - "User can find nearest POI by type from a selected location"
    - "Selected start and destination are highlighted with distinct A/B labeled pins"
    - "Search bars collapse to compact strip when both are selected"
    - "Map auto-pans to show both pins"
    - "Route auto-triggers with toast confirmation"
  artifacts: []
  key_links: []
---

<objective>
Human verification of the complete search and location selection feature.

Purpose: Confirm all 5 success criteria from the roadmap are met through hands-on testing. Visual/interactive behaviors (search UX, tap targets, auto-pan animation, toast timing, compact strip transition) cannot be verified by automated tests alone.

Output: Human approval or issue list for gap closure.
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
@.planning/phases/05-search-location-selection/05-02-SUMMARY.md
</context>

<tasks>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 1: Verify complete search and location selection feature</name>
  <action>Run `npm run dev`, open http://localhost:5173. Verify all search and location selection behaviors described in how-to-verify.</action>
  <verify>See how-to-verify steps below.</verify>
  <done>All 8 must-have truths confirmed: autocomplete search, tap-to-select, search-only selection, nearest POI, A/B pins, compact strip, auto-pan, route trigger with toast.</done>
  <what-built>
  Complete search and location selection system:
  - Dual search bars (From/To) floating above the map
  - Autocomplete suggestions with type icons, names, and room numbers
  - Full-screen suggestion overlay while typing
  - Tap-to-select on map landmarks (A/B pin assignment)
  - Nearest-POI quick-filter search (nearest restroom, elevator, etc.)
  - Compact strip collapse after both selections
  - Swap button to reverse start/destination
  - Clear (X) buttons on each field
  - Auto-pan/zoom to frame both A and B pins
  - Route auto-calculation with toast notification
  </what-built>
  <how-to-verify>
  Start the dev server if not running: `npm run dev`
  Open http://localhost:5173 in browser.

  **Test 1: Tap-to-select (SRCH-02)**
  1. Tap any landmark marker on the map
  2. Verify: "A" labeled green pin appears at that location
  3. Verify: The original landmark marker disappears (replaced by A pin)
  4. Tap a DIFFERENT landmark marker
  5. Verify: "B" labeled red pin appears at that location
  6. Verify: Both A and B pins are visible, counter-scaled during zoom
  7. Verify: Map auto-pans/zooms to show both pins

  **Test 2: Search autocomplete (SRCH-01)**
  1. Tap the "From:" search field
  2. Type "lab" (or any 2+ character query matching a node label)
  3. Verify: Full-screen suggestion overlay appears
  4. Verify: Suggestions show type icon + name + room number
  5. Verify: Max 8 suggestions shown
  6. Verify: Suggestions update as you continue typing
  7. Tap a suggestion
  8. Verify: Field is filled, suggestions dismiss

  **Test 3: Dropdown selection without map (SRCH-03)**
  1. Clear all selections (X buttons)
  2. Use ONLY the search fields to set start and destination
  3. Verify: Both can be set entirely via search without tapping the map
  4. Verify: A and B pins appear at correct positions

  **Test 4: Nearest POI (SRCH-04)**
  1. Set a start location (via search or tap)
  2. Tap the "To:" search field
  3. Verify: Nearest-POI quick-filter buttons are visible (e.g., "Nearest Restroom")
  4. Tap a quick-filter button
  5. Verify: Results show nearest locations of that type, sorted by distance

  **Test 5: Compact strip + swap (user decisions)**
  1. Set both start and destination
  2. Verify: Search bars collapse to compact strip showing "A: [name] → B: [name]"
  3. Verify: Swap button (⇅) is visible
  4. Tap swap
  5. Verify: Start and destination labels reverse, A and B pins swap positions on map
  6. Tap the compact strip
  7. Verify: Expands back to full search bars

  **Test 6: Route trigger + toast**
  1. Set both start and destination
  2. Verify: Toast "Route calculated" appears briefly at bottom of screen
  3. Verify: Toast auto-dismisses after ~3 seconds

  **Test 7: Mobile (if available)**
  1. Open on mobile device or Chrome DevTools mobile emulation
  2. Verify: Search bars are usable on small screens
  3. Verify: Full-screen suggestions fill the viewport
  4. Verify: Touch gestures (tap, swipe) work correctly
  </how-to-verify>
  <resume-signal>Type "approved" or describe issues</resume-signal>
</task>

</tasks>

<verification>
All 5 roadmap success criteria verified by human:
1. Autocomplete search with live-updating suggestions (SRCH-01)
2. Tap-to-select on map (SRCH-02)
3. Searchable dropdown selection without map (SRCH-03)
4. Nearest POI search by type (SRCH-04)
5. Distinct A/B pin markers on map
</verification>

<success_criteria>
Human approves all 7 test scenarios or provides specific issues for gap closure.
</success_criteria>

<output>
After completion, create `.planning/phases/05-search-location-selection/05-03-SUMMARY.md`
</output>
