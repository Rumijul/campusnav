# Phase 5: Search & Location Selection - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can find and select locations through search or map interaction to set route start/destination. This phase delivers: autocomplete search, tap-to-select on map, dropdown selection, and nearest-POI search. Route drawing and directions are Phase 6 — this phase stops at both points being selected and the route triggering automatically.

</domain>

<decisions>
## Implementation Decisions

### Search UI & Placement
- Dual search bars at the top of the screen (From: and To: fields)
- Bars float as an overlay on top of the map — map stays visible underneath
- While typing, suggestions take over the full screen (map hidden) — full-screen suggestion list
- Once both start and destination are selected, search bars collapse to a compact strip showing From → To
- Swap icon between the two bars to reverse start and destination (Google Maps-style)

### Selection Model
- Tap-to-select assignment (start vs destination): Claude's discretion — e.g., fill whichever field is currently active
- Clearing a selection: Claude's discretion — e.g., X button in field
- When a location is selected as start/destination, show only the highlight marker — no detail sheet (departure from Phase 4 bottom sheet behavior)
- Selected start = "A" labeled pin, selected destination = "B" labeled pin (labeled pins, not color-coded)
- When both start and destination are set, map auto-pans/zooms to show both pins in frame
- Route auto-draws as soon as both start and destination are set — no explicit "Get Directions" button
- Brief toast notification when route calculates successfully ("Route calculated"), then route shows
- No-route-found error handling: Claude's discretion

### Autocomplete & Suggestions
- Search triggers after 2+ characters typed
- Suggestions match across: Claude's discretion (name, room number, type all reasonable)
- Maximum 8 suggestions shown
- Each suggestion row displays: name + room number + type icon

### Nearest-POI Search UX
- How to invoke: Claude's discretion
- "Nearest" measured from: Claude's discretion
- Number of results: Claude's discretion
- Which POI types: Claude's discretion

### Claude's Discretion
- Tap-to-select assignment logic (fill active field vs popup)
- How user clears a selected start/destination
- No-route-found error state (toast vs sheet vs inline)
- Autocomplete search fields matched (likely name + room number + type)
- All aspects of nearest-POI UX invocation, reference point, result count, and type list — Claude has full flexibility here as long as it satisfies SRCH-04

</decisions>

<specifics>
## Specific Ideas

- The collapse-to-compact-strip pattern after both selections are made implies the UI should feel progressively focused — big when choosing, minimal when chosen
- Auto-pan to show both pins on selection completion is a key UX moment — should animate smoothly
- The brief toast on route calculation bridges this phase with Phase 6's route visualization

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 05-search-location-selection*
*Context gathered: 2026-02-19*
