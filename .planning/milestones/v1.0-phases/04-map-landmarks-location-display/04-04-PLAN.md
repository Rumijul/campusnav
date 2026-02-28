---
phase: 04-map-landmarks-location-display
plan: 04
type: execute
wave: 4
depends_on: [04-03]
files_modified: []
autonomous: false
requirements: [MAP-03, MAP-04, ROUT-07]

must_haves:
  truths:
    - "Colored landmark circles are visible on the floor plan canvas"
    - "Hidden nav nodes (junction, hallway, stairs, ramp) have NO visible markers"
    - "Markers maintain constant screen size during zoom"
    - "Tapping a landmark opens a bottom sheet with name and type visible"
    - "Dragging the sheet up reveals full landmark details"
    - "Sheet dismisses via swipe down, close button, and tapping map background"
    - "Map is pannable/zoomable while the sheet is peeked"
  artifacts: []
  key_links: []
---

<objective>
Human verification of the complete Phase 4 landmark and location display feature. Confirms all three requirements (MAP-03, MAP-04, ROUT-07) are met from a user's perspective.

Purpose: Claude cannot verify visual appearance, touch/drag physics, or multi-modal dismissal. Human confirmation gates progression to Phase 5.

Output: Approved or issues list.
</objective>

<execution_context>
@C:/Users/LENOVO/.config/opencode/get-shit-done/workflows/execute-plan.md
@C:/Users/LENOVO/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
</context>

<tasks>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 1: Human verification of landmark rendering and bottom sheet interaction</name>
  <action>Run `npm run dev`, open http://localhost:5173. Verify all landmark and location display behaviors described in how-to-verify.</action>
  <verify>See how-to-verify steps below.</verify>
  <done>All 7 must-have truths confirmed: markers visible, hidden nodes absent, counter-scaling works, sheet opens/expands/dismisses, map interactive while peeked.</done>
  <what-built>
Complete landmark and location display system:
- 18 visible landmark markers (colored circles) on the floor plan canvas
- 7 hidden navigation nodes (junction, hallway, stairs, ramp) — NOT rendered
- Counter-scaled markers (constant screen size at all zoom levels)
- Color-coded by type: blue=room, green=entrance, purple=elevator, amber=restroom, red=landmark
- Labels appear on selected markers and at zoom ≥ 2×
- Bottom sheet (Vaul) slides up on landmark tap
- Peek state (15% height): name + type visible
- Expanded state (90% height): name, room number, type, description, floor, building, accessibility notes
- Three dismissal methods: swipe down, close button, tap map background
- Map remains interactive (pan/zoom) while sheet is peeked
  </what-built>
  <how-to-verify>
1. Run `npm run dev` and open http://localhost:5173 in a browser

2. **MAP-03 — Visible landmarks:**
   - Verify colored circles appear overlaid on the floor plan image
   - Count approximately 18 markers (CS Lab, Lecture Hall A/B, Faculty Offices, Main/Side Entrance, Elevators, Restrooms, Cafeteria, Library, Info Desk, Student Lounge, Print Room, Storage Room)
   - Verify different types show different colors (rooms = blue, entrances = green, etc.)

3. **MAP-04 — Hidden nav nodes:**
   - Verify NO markers appear for junction, hallway, stairs, or ramp nodes
   - The total visible marker count should be 18, not 25

4. **Zoom behavior:**
   - Scroll/pinch to zoom in — markers should stay approximately the same screen size (not grow with zoom)
   - Scroll to zoom out — markers should remain visible (not shrink to invisibility)
   - Zoom to 2× or higher — verify labels appear below markers
   - Zoom below 2× — verify labels disappear

5. **ROUT-07 — Landmark detail:**
   - Click/tap any landmark marker — bottom sheet should slide up from the bottom
   - In peek state: verify landmark name and type are visible in the sheet
   - Drag the sheet upward — it should expand to show full details
   - In expanded state: verify room number, description, building name, floor number, and accessibility notes are shown

6. **Dismissal methods:**
   - With sheet peeked: swipe it downward — should dismiss
   - Open another landmark: click the × close button — should dismiss
   - Open another landmark: click/tap the map background (outside markers) — should dismiss

7. **Map interaction while sheet is open:**
   - With sheet peeked, try panning the map — should work (not blocked)
   - With sheet peeked, try zooming — should work (not blocked)

8. **Mobile / touch (if available):**
   - Test landmark tap on a touch device or device simulation in browser DevTools
   - Verify touch tap targets are large enough (markers should register taps near their edges)
  </how-to-verify>
  <resume-signal>Type "approved" if everything looks correct, or describe any issues found</resume-signal>
</task>

</tasks>

<verification>
Human verification is the verification for this plan.
</verification>

<success_criteria>
All 7 must-have truths confirmed by human:
1. Colored landmark circles visible on floor plan
2. Hidden nav nodes NOT visible
3. Markers maintain constant screen size during zoom
4. Tapping opens sheet with name + type
5. Expanding reveals full details
6. All 3 dismissal methods work
7. Map interactive while sheet is peeked
</success_criteria>

<output>
After completion, create `.planning/phases/04-map-landmarks-location-display/04-04-SUMMARY.md`
</output>
