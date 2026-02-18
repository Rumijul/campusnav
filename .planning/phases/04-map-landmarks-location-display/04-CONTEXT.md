# Phase 4: Map Landmarks & Location Display - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Render visible landmarks (classrooms, offices, rooms, POIs) as interactive markers on the floor plan canvas. Hide navigation-only nodes (ramps, staircases, hallway junctions) from the student-facing map. Show landmark details in a bottom sheet on tap. Search and route selection are separate phases (5 and 6).

</domain>

<decisions>
## Implementation Decisions

### Marker appearance
- Filled circles with text label — clean, map-like style
- Labels appear on hover (desktop) or tap (mobile) only — not always visible
- Different types of landmarks (classroom, office, restroom, etc.) should be visually distinguishable

### Detail display on tap
- Bottom sheet that slides up from the bottom of the screen (Google Maps style)
- Starts as a small peek showing name + type; user can drag up to see full details
- Full detail view includes: name, room number, type (classroom/office/etc.), description, floor, building, and accessibility notes
- Dismissal via all methods: tap outside the sheet, swipe down, or close button

### Zoom-level behavior
- Marker label auto-show on zoom, marker scaling, clustering, and tap target sizing are all Claude's discretion — pick what works best for a campus map with 15-30 landmarks

### Test map data
- 15-30 landmarks covering full campus variety: classrooms, offices, restrooms, exits, stairs, elevators, cafeteria
- Include hidden navigation nodes (hallway junctions, staircase nodes, ramp nodes) to verify they're properly hidden from students
- Data served from the Hono API server (static JSON endpoint for now, building toward Phase 7's real persistence)

### Claude's Discretion
- Marker color scheme by landmark type (color-coding approach and palette)
- Selected marker visual treatment (highlight, scale, color change)
- Whether labels auto-appear at high zoom levels or stay hover/tap-only at all zoom levels
- Marker scaling behavior (fixed screen size vs scale with map)
- Clustering behavior at low zoom levels (cluster badges vs show all)
- Tap target sizing on mobile (enlarged hit areas vs match visible size)
- Loading state while graph data is being fetched from API

</decisions>

<specifics>
## Specific Ideas

- Bottom sheet interaction modeled after Google Maps — peek first, drag up for full details
- Markers should feel like a real campus map — filled circles, not flashy icons
- Navigation nodes (ramps, stairs, hallway junctions) must be completely invisible to students but present in the graph data

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-map-landmarks-location-display*
*Context gathered: 2026-02-19*
