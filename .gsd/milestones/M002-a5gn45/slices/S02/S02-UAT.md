# S02: Visitor trip setup parity (student scope only) — UAT

**Milestone:** M002-a5gn45
**Written:** 2026-03-30T10:44:49.372Z

# S02 UAT: Visitor Trip Setup Parity

## Preconditions
- App is installed on iOS or Android device (or Expo Go)
- Campus map data is loaded (from API or cached)
- User has NOT logged in (visitor mode)

## Test Cases

### UC-01: Search for destination by building name
1. Launch app → DestinationPicker is displayed
2. Tap search input field
3. Type "Science" or "Lib"
4. Observe filtered results showing matching buildings
**Expected:** Buildings containing the search term appear.

### UC-02: Search for destination by room number
1. Tap search input, type "201" or "101"
**Expected:** Rooms with matching room numbers appear.

### UC-03: Select start location
1. Expand a building → floors → nodes
2. Tap a node (e.g., "Room A")
**Expected:** Start location is recorded.

### UC-04: Select destination location
1. Toggle active field to "Set Destination"
2. Tap a node
**Expected:** Route preview appears when both start and destination are selected.

### UC-05: Swap start and destination
1. Tap swap button
**Expected:** Values exchange; route recomputes.

### UC-06: Clear all selections
1. Tap clear/reset button
**Expected:** Session returns to idle state.

### UC-07: Route preview with floor sections
1. Select reachable start/destination pair
**Expected:** RoutePreview shows direction steps grouped by floor with total distance/time.

### UC-08: No-route state when unreachable
1. Select nodes in disconnected graph components
**Expected:** Session phase is 'no-route'; UI shows "No route found".

### UC-09: Accessible mode filtering
1. Select inter-floor route via stairs
2. Toggle accessible mode ON
**Expected:** Session phase is 'no-route' (stairs blocked).

### UC-10: Floor selector displays correct targets
1. Compute a multi-floor route
**Expected:** Floor buttons show "Bldg X Fl Y" for each floor; active floor highlighted.

### UC-11: Switch floors via floor selector
1. Tap a different floor button
**Expected:** Floor image updates; route overlay shows path for active floor only.

### UC-12: Route path overlay renders
1. Compute a route
**Expected:** Colored dots at path nodes (green=start, red=end, blue=intermediate).

### UC-13: Error state for invalid nodes
1. Set start/destination to node ID not in graph
**Expected:** Session phase is 'error' with descriptive message.

### UC-14–UC-15: Idle state when incomplete selection
1. Set only start (no destination) OR only destination (no start)
**Expected:** Session phase is 'idle'; route preview not shown.

## Edge Cases
- **Empty search**: Returns all searchable nodes grouped by building/floor
- **Stairs excluded**: Non-searchable nodes don't appear in results
- **Case-insensitive**: "lib" matches "Library"
- **Type filter**: typeFilter='room' excludes elevators, stairs, etc.
- **Sorting**: Buildings alphabetically, floors by number, nodes by label
- **Single-node path**: Single green dot rendered at node position
- **Disconnected graph**: PathResult.found = false returned

## Verification Summary
| Check | Status |
|-------|--------|
| TypeScript | ✅ 0 errors |
| Pathfinding tests (10) | ✅ Pass |
| Direction tests (18) | ✅ Pass |
| Section tests (7) | ✅ Pass |
| State machine tests (12) | ✅ Pass |
| React hook tests | ⚠️ Infra issue (jsdom vs react-native) |
| Component tests | ⚠️ Infra issue (jsdom vs react-native) |
