---
status: testing
phase: 05-search-location-selection
source: [05-01-SUMMARY.md, 05-02-SUMMARY.md, 05-03-SUMMARY.md]
started: 2026-02-20T00:00:00Z
updated: 2026-02-20T00:00:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

number: 2
name: A/B Pins Stay Consistent During Zoom
expected: |
  With A and B pins placed, zoom in and out using scroll wheel or pinch gesture. The "A" and "B" labels and circle markers stay the same visual size on screen — they don't grow or shrink with the map zoom. Their positions stay correctly anchored to their landmarks.
awaiting: user response

## Tests

### 1. Tap a Landmark to Select It
expected: Tap any visible landmark on the map. Instead of opening a detail sheet, the landmark becomes your start point (A pin). A green circle labeled "A" appears at that location. The landmark marker itself disappears (replaced by the A pin). Tapping a second landmark sets it as the destination — a red "B" pin appears there.
result: issue
reported: "when i select a route, it doesn't let me move the screen. route looks off — should be a straight line but curves/goes through walls"
severity: blocker

### 2. A/B Pins Stay Consistent During Zoom
expected: With A and B pins placed, zoom in and out using scroll wheel or pinch gesture. The "A" and "B" labels and circle markers stay the same visual size on screen — they don't grow or shrink with the map zoom. Their positions stay correctly anchored to their landmarks.
result: [pending]

### 3. Autocomplete Search — Typing Updates Suggestions
expected: Tap the search bar (From field). Type at least 2 characters (e.g. "lab" or "room"). A list of up to 8 matching suggestions appears below the input, showing location names with colored type indicators. The list updates as you type more characters.
result: [pending]

### 4. Select a Location from Search Suggestions
expected: After suggestions appear, tap one of them. The search bar fills with that location's name, and the corresponding A pin (green) appears on the map at that location. The suggestion panel closes.
result: [pending]

### 5. Nearest POI Quick-Filter Buttons
expected: With a start location set (A pin), tap one of the quick-filter buttons (e.g. "Nearest Restroom", "Nearest Elevator", or "Nearest Entrance"). The nearest matching location is automatically set as the destination (B pin) and the map pans to frame both pins.
result: [pending]

### 6. Compact Strip Collapses Search UI
expected: Once both start and destination are selected, the full search overlay collapses into a compact strip showing the two selected location names side by side (e.g. "Room A → Room B"). The map remains interactive behind it.
result: [pending]

### 7. Swap Button Exchanges Start and Destination
expected: In either the full search view or compact strip, there is a swap/reverse button. Tapping it exchanges the start and destination — the A and B pins swap positions on the map, and the labels in the search bars swap accordingly.
result: [pending]

### 8. Auto-Pan Frames Both Pins After Selection
expected: After both start and destination are set (either by tap or search), the map automatically pans and zooms so that both the A pin and B pin are visible on screen simultaneously with some padding around them. The animation is smooth (not an instant jump).
result: [pending]

### 9. Route Auto-Trigger Toast
expected: When both start and destination are selected, a brief notification/toast appears (e.g. "Route calculated" or similar) and then automatically disappears after a few seconds. This confirms that pathfinding ran in the background.
result: [pending]

### 10. Clear Selection with X Buttons
expected: In the search bar, there is an X (clear) button for each field. Tapping the X on the start field removes the A pin from the map and clears that search input. Tapping the X on the destination field removes the B pin. The landmark markers reappear at the cleared positions.
result: [pending]

## Summary

total: 10
passed: 0
issues: 1
pending: 9
skipped: 0

## Gaps

- truth: "Map remains pannable and zoomable after selecting a route; route follows graph edges (not a straight line)"
  status: failed
  reason: "User reported: when i select a route, it doesn't let me move the screen. route looks off — should be a straight line but curves/goes through walls"
  severity: blocker
  test: 1
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""
