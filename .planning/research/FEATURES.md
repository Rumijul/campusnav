# Feature Research

**Domain:** Campus wayfinding / indoor navigation web app
**Researched:** 2026-02-18
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete or unusable.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Interactive 2D floor plan map** | Core of any wayfinding app. Users need to see where they are and where things are. Every competitor (Mappedin, MazeMap, ArcGIS Indoors) has this as the foundation. | MEDIUM | Pan, zoom, tap-to-select locations on a rendered floor plan. This is the canvas everything else lives on. |
| **Location search (by name/keyword)** | Users won't tap-hunt for "Room 204B." Mappedin highlights "search that drives discovery" as a core feature. MazeMap has search prominent on every map. | MEDIUM | Autocomplete/fuzzy search over room names, building names, POI categories. Must be fast (<200ms perceived). |
| **Tap-to-select start/destination on map** | Alternative to search for users who know roughly where something is. All competitors support click/tap selection. | LOW | Click a room/POI on the map to set it as start or destination. Visual feedback (highlight, pin). |
| **Visual route path on map** | The literal point of a wayfinding app. Mappedin, MazeMap, ArcGIS Indoors all draw routes on the map. Without this, there's no product. | MEDIUM | Draw a clear, colored polyline along the computed path from start to destination. Must be visually distinct from the floor plan. |
| **Step-by-step text directions** | Mappedin: "Directions that make sense — clear, step-by-step guidance with familiar landmarks." This bridges the gap between seeing a path and knowing what to do. | MEDIUM | "Turn left at the elevator. Walk 50m to Room 204B." Ordered list of human-readable instructions derived from the path. |
| **Shortest path computation (Dijkstra/A*)** | Without shortest-path, routes would be arbitrary. Graph-based pathfinding is standard across all indoor navigation products. | MEDIUM | Core algorithm. Weights represent real walking distances/times. Must run client-side in <100ms for a single floor. |
| **Wheelchair-accessible route option** | Mappedin: "Barrier-free navigation — routes prioritize elevators, ensuring everyone navigates independently." MazeMap's accessibility blog emphasizes accessible wayfinding. ADA/WCAG compliance increasingly expected. | MEDIUM | Separate graph edges that exclude stairs and obstacles. Must be explicitly offered, not hidden behind settings. |
| **Side-by-side route comparison (standard + accessible)** | This is CampusNav's explicit core value. Showing both routes simultaneously rather than toggling is the design intent. Competitors typically offer a toggle/filter; showing both is better UX for awareness. | MEDIUM | Two routes rendered simultaneously with distinct colors. Summary stats (distance, time) for each. This makes accessibility visible, not an afterthought. |
| **Location details panel** | Mappedin: "Descriptions, contact info, photos, links — everything visitors need." When you tap a room, you need to know what it is. | LOW | Room name, number, type (lecture hall, restroom, office), floor, optional description. Appears on click/search selection. |
| **Admin authentication** | Admin-only editing requires auth. Standard security practice. No student-facing login needed per project spec. | LOW | Simple auth for admin routes. JWT or session-based. Single admin role is sufficient for v1. |
| **Admin map editor (node/edge placement)** | Mappedin has a full "Editor" product. MazeMap has "Map Editor." ArcGIS has "Floor Plan Editor." Admins need to build the navigation graph without writing code. | HIGH | Drag-and-drop node placement on floor plan image. Edge creation between nodes. Set node types (room, hallway, entrance, stairs, elevator). This is the most complex UI in the app. |
| **Admin data table view** | Complement to visual editor. Admins need to bulk-view/edit node metadata (names, types, accessibility flags) without clicking each one on the map. | MEDIUM | Sortable, filterable table of all nodes/locations. Inline editing of properties. Syncs with map view. |
| **Mobile-responsive web UI** | Students use phones. MazeMap and Mappedin both emphasize mobile-first wayfinding. A web app that doesn't work on mobile is useless for the core use case (student walking around campus checking phone). | MEDIUM | Responsive design that works on phone-size screens. Touch-friendly controls. Map gestures (pinch-zoom, pan). |

### Differentiators (Competitive Advantage)

Features that set CampusNav apart. Not required for basic function, but create significant value.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Always-visible accessibility** | CampusNav's core differentiator. Most competitors (Mappedin, MazeMap) offer accessible routes as an option/toggle you have to find. CampusNav shows the wheelchair-accessible alternative *alongside* the standard route by default. This makes accessibility awareness the norm, not an afterthought. | LOW (once routing exists) | Design decision, not a separate feature. Both routes computed and shown simultaneously. Color-coded. Always on, no toggle needed. |
| **Zero-friction student access** | No login, no app download, no setup. Just open a URL and navigate. Competitors require app installs (MazeMap mobile) or enterprise platform access (ArcGIS). A web URL is the lowest barrier to entry. | LOW | Already the architecture choice (web app). Reinforce by avoiding any student-facing auth or onboarding flow. |
| **Route time estimates** | Mappedin mentions "getting travelers to gates on time." Showing estimated walking time (standard speed + reduced mobility speed) for both routes gives actionable info. | LOW | Simple calculation: distance / walking speed. Use 1.4 m/s standard, 0.8 m/s reduced mobility. Display "~3 min" next to each route. |
| **Shareable route URLs** | Students can share "how to get to Room 204B from the main entrance" via URL. No competitor in the campus space makes this seamless for web. | LOW | Encode start/destination in URL params. Reconstruct route on page load. Deep-linkable routes. |
| **Category-based POI filtering** | Filter map to show only restrooms, elevators, exits, vending machines, etc. Mappedin has location categories. Useful for quick "where's the nearest restroom?" queries. | LOW | Filter buttons or checkboxes that show/hide POI types on the map. Simple boolean filtering on node type. |
| **Nearest-X search** | "Find nearest restroom/exit/elevator from my selected location." Goes beyond search-by-name to spatial queries. | MEDIUM | Given a start point, find closest node of type X using graph distances. Return sorted list. |
| **Keyboard navigation & screen reader support** | Mappedin emphasizes WCAG 2.1 AA compliance and screen reader compatibility. For a campus accessibility product, the web app itself must be accessible. | MEDIUM | ARIA labels, keyboard-navigable search and directions, skip-nav links, high-contrast mode. The app about accessibility must itself be accessible. |
| **Print-friendly directions** | Students can print step-by-step directions. Simple but surprisingly useful for visitors, orientation events, and students who prefer paper. | LOW | CSS print stylesheet. Format directions as a clean numbered list with start/end. Exclude map chrome. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems in this context.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Real-time GPS/indoor positioning (blue dot)** | "Show me where I am on the map right now." Users expect GPS-like experience from Google Maps. | Indoor positioning requires hardware infrastructure (BLE beacons, WiFi fingerprinting) that campuses don't have. Even Mappedin and ArcGIS sell IPS as a separate, expensive add-on. Without it, a "current location" feature would be inaccurate and frustrating. The project explicitly excludes GPS. | Manual start point selection: "I'm at [X]" tap or search. Users know which room they're in/near. For v1, this is sufficient and honest. |
| **Multi-floor navigation** | "Navigate from Floor 1 to Floor 3." Seems essential. | Massively increases complexity: floor transitions, elevator/stair connections, multi-layer map rendering, floor picker UI. ArcGIS Indoors calls this a major feature. Project spec says single floor v1. Adding multi-floor prematurely would delay core value delivery. | Build single-floor with extensible data model (floor field on nodes). Add multi-floor in v2 when the graph model and UI are proven. |
| **3D map rendering** | "3D maps look impressive." MazeMap and ArcGIS offer 3D. | 3D adds enormous rendering complexity, performance issues on mobile, and doesn't improve wayfinding on a single floor. 2D top-down is actually clearer for navigation — it's what every major mapping product defaults to. | High-quality 2D floor plan with clear visual hierarchy. 2D is faster, clearer, and more accessible. |
| **Student accounts/login** | "Track favorites, save frequent routes, personalize." | Adds auth complexity, privacy concerns (tracking student movement), GDPR/FERPA compliance burden, and delays core feature delivery. For a "just get me there" tool, login is friction. Project spec explicitly says no student login. | Shareable URLs for bookmarking. Browser localStorage for recently searched locations (no server-side storage). |
| **Real-time crowd density / occupancy** | MazeMap offers heatmaps. Seems useful for "avoid crowded areas." | Requires IoT sensors, real-time data infrastructure, ongoing maintenance. Way beyond scope of a wayfinding app. Adds no value without sensor hardware. | Not applicable for v1. If ever needed, could integrate as a data overlay in future. |
| **Space/room booking** | MazeMap offers space booking as a feature. | Entirely separate product domain (calendar integration, conflict resolution, notifications). Would split focus from the core wayfinding value. | Link to existing campus booking system from the location details panel if a URL is available. |
| **Turn-by-turn real-time navigation** | Google Maps-style "in 20 meters, turn right" with position tracking. | Requires real-time positioning (see GPS anti-feature above). Without knowing where the user is, turn-by-turn is impossible. Step-by-step text directions achieve the same goal for a "read before you walk" use case. | Step-by-step directions shown all at once. User reads the full route, then walks. Works without any positioning hardware. |
| **Multi-language support** | Mappedin supports 40+ languages. | Significant translation effort. For a single-campus deployment, the user base is typically single-language or bilingual at most. Adds complexity to every UI string and every POI name. | English-only for v1. Design with i18n-ready string extraction so translation is possible later without rewriting. |
| **Timetable / schedule integration** | MazeMap integrates with university timetable systems. | Requires integration with specific campus scheduling APIs (varies by institution). Adds coupling to external systems that may be unreliable or undocumented. | Show room information and let students mentally connect it with their schedule. A "next class: Room 204B" feature can be a v2+ integration. |

## Feature Dependencies

```
[Floor Plan Rendering (interactive map)]
    └──requires──> [Admin Map Editor] (editor creates what the map displays)
                       └──requires──> [Floor Plan Image Upload] (editor needs a base image)

[Visual Route Path]
    └──requires──> [Graph Data Model] (routes are computed on a graph)
                       └──requires──> [Admin Node/Edge Editor] (graph is built by admin)

[Shortest Path Computation]
    └──requires──> [Graph Data Model]

[Wheelchair-Accessible Route]
    └──requires──> [Shortest Path Computation] + [Accessibility Flags on Edges/Nodes]

[Side-by-Side Route Comparison]
    └──requires──> [Shortest Path (standard)] + [Wheelchair-Accessible Route]

[Step-by-Step Text Directions]
    └──requires──> [Visual Route Path] (directions derived from same path data)

[Location Search]
    └──requires──> [Location Data] (names, types populated via admin editor)

[Tap-to-Select on Map]
    └──requires──> [Floor Plan Rendering]

[Location Details Panel]
    └──requires──> [Location Data]

[Shareable Route URLs]
    └──requires──> [Routing System] (needs start/destination to encode)

[Nearest-X Search]
    └──requires──> [Shortest Path Computation] + [Location Categories/Types]

[Admin Data Table]
    └──enhances──> [Admin Map Editor] (alternative view of same data)

[Route Time Estimates]
    └──enhances──> [Visual Route Path] (adds time info to existing routes)

[Print-Friendly Directions]
    └──enhances──> [Step-by-Step Text Directions]

[Category POI Filtering]
    └──enhances──> [Floor Plan Rendering] + [Location Categories/Types]
```

### Dependency Notes

- **Everything depends on the Admin Editor building the graph**: The entire user-facing experience is blank without admin-created floor plan data, nodes, and edges. The editor must come first or in parallel with the map renderer.
- **Routing depends on Graph Data Model**: All pathfinding, accessible routing, and directions flow from the navigation graph. The graph schema (nodes with types, edges with weights and accessibility flags) is the foundational data model.
- **Accessible routing requires explicit edge/node attributes**: Each edge needs `wheelchair_accessible: boolean` (at minimum). Nodes like stairs need to be tagged so the accessible-routing algorithm can exclude them.
- **Side-by-side comparison is a presentation feature**: Once both route types can be computed, showing them together is a UI/rendering concern, not an algorithm concern.
- **Shareable URLs are nearly free**: Once routing works with start/destination IDs, encoding them in URL params is trivial.

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [ ] **Interactive floor plan map** — The canvas. Without it, nothing else matters.
- [ ] **Admin floor plan image upload** — Admin needs to set the base map image.
- [ ] **Admin node/edge editor (drag-and-drop)** — Build the navigation graph visually on the floor plan.
- [ ] **Admin data table view** — Bulk view/edit node metadata alongside the visual editor.
- [ ] **Admin authentication** — Protect the editor. Simple login.
- [ ] **Location search** — Find rooms by name/number with autocomplete.
- [ ] **Tap-to-select start/destination** — Click on the map to set routing endpoints.
- [ ] **Shortest path computation** — Dijkstra/A* on the navigation graph.
- [ ] **Wheelchair-accessible shortest path** — Same algorithm, graph filtered to exclude non-accessible edges.
- [ ] **Visual route paths on map (both routes)** — Two color-coded paths rendered simultaneously.
- [ ] **Step-by-step text directions** — Human-readable turn-by-turn list for both routes.
- [ ] **Route time estimates** — Walking time for standard and accessible routes.
- [ ] **Location details panel** — Room name, type, info on tap/search.
- [ ] **Mobile-responsive design** — Must work on phone screens (primary student use case).

### Add After Validation (v1.x)

Features to add once core is working and deployed.

- [ ] **Shareable route URLs** — Trigger: students want to send directions to friends or bookmark routes.
- [ ] **Category-based POI filtering** — Trigger: map gets busy with many POIs and users want to filter.
- [ ] **Nearest-X search** — Trigger: "where's the nearest restroom?" is a common user query pattern.
- [ ] **Print-friendly directions** — Trigger: orientation events or visitor use cases emerge.
- [ ] **Keyboard navigation & screen reader support (WCAG AA)** — Trigger: should be addressed early, but can be iteratively improved post-launch. Start with semantic HTML, enhance with ARIA.
- [ ] **Admin: bulk import/export (JSON/CSV)** — Trigger: admin has too many nodes to create one-by-one.

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Multi-floor navigation** — Why defer: Single floor first. Needs floor picker UI, cross-floor transitions, multi-layer rendering. Design data model to be floor-aware from day one so migration isn't painful.
- [ ] **Multi-building / outdoor campus map** — Why defer: MazeMap's biggest feature is indoor+outdoor. But outdoor adds a completely different map layer (satellite/street tiles). Out of scope until single-building is proven.
- [ ] **i18n / multi-language** — Why defer: Extract strings into a locale file from day one, but don't build the translation infrastructure until there's demand.
- [ ] **Timetable integration** — Why defer: Campus-specific API, high coupling, low certainty of API availability.
- [ ] **Admin: multiple admin roles/permissions** — Why defer: Single admin role works for v1. RBAC adds complexity without clear benefit at launch scale.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Interactive floor plan map | HIGH | MEDIUM | P1 |
| Admin map editor (node/edge) | HIGH | HIGH | P1 |
| Admin data table view | MEDIUM | MEDIUM | P1 |
| Location search | HIGH | MEDIUM | P1 |
| Tap-to-select on map | HIGH | LOW | P1 |
| Shortest path (Dijkstra/A*) | HIGH | MEDIUM | P1 |
| Wheelchair-accessible route | HIGH | MEDIUM | P1 |
| Side-by-side route display | HIGH | LOW | P1 |
| Visual route path on map | HIGH | MEDIUM | P1 |
| Step-by-step text directions | HIGH | MEDIUM | P1 |
| Route time estimates | MEDIUM | LOW | P1 |
| Location details panel | MEDIUM | LOW | P1 |
| Admin authentication | MEDIUM | LOW | P1 |
| Mobile-responsive design | HIGH | MEDIUM | P1 |
| Shareable route URLs | MEDIUM | LOW | P2 |
| Category POI filtering | MEDIUM | LOW | P2 |
| Nearest-X search | MEDIUM | MEDIUM | P2 |
| Print-friendly directions | LOW | LOW | P2 |
| Keyboard/screen reader (WCAG) | HIGH | MEDIUM | P2 |
| Admin bulk import/export | LOW | MEDIUM | P2 |
| Multi-floor navigation | HIGH | HIGH | P3 |
| Multi-building/outdoor | MEDIUM | HIGH | P3 |
| Multi-language (i18n) | LOW | MEDIUM | P3 |
| Timetable integration | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Mappedin | MazeMap | ArcGIS Indoors | CampusNav (Our Approach) |
|---------|----------|---------|----------------|--------------------------|
| Interactive indoor map | Yes (2D/3D, multi-floor) | Yes (2D/3D, multi-floor) | Yes (2D/3D, floor-aware) | 2D single floor. Simpler, faster, focused. |
| Search/discovery | Advanced search with product/store search | Room/POI search with autocomplete | POI search via Viewer/Mobile apps | Name/keyword search with autocomplete. No product catalogs. |
| Step-by-step directions | Yes, with landmarks | Yes | Yes, turn-by-turn | Yes, derived from graph path. Plain-language steps. |
| Accessible routing | Toggle for elevator-prioritized routes | Accessible wayfinding mentioned | Accessible route option | **Both routes shown simultaneously by default.** No toggle needed. Accessibility is always visible. |
| Indoor positioning | Optional add-on (BLE/WiFi) | Optional add-on | Optional add-on (ArcGIS IPS) | None. Manual "I'm at X" selection. Honest about limitations. |
| Admin/map editor | Full editor product | Map Editor tool | Floor Plan Editor, ArcGIS Pro | Drag-and-drop node editor on floor plan + data table. Purpose-built for graph creation. |
| Multi-floor | Yes | Yes | Yes | No (v1). Data model supports it for v2. |
| Mobile support | Native apps + web | Native apps + web | Native apps + web viewers | Web-only, mobile-responsive. Zero install friction. |
| Auth required | Enterprise accounts | Enterprise/institutional | Enterprise platform | No student auth. Admin-only auth. Minimal friction. |
| Pricing | Enterprise SaaS | Enterprise SaaS | Enterprise GIS licensing | Free / self-hosted. Ideal for single-campus deployments. |
| WCAG compliance | 2.1 AA | Mentioned (accessible wayfinding) | Enterprise-level accessibility | Target WCAG 2.1 AA for the web app itself. |
| Analytics | Yes (navigation patterns) | Heatmaps, user analytics | Space analytics, dashboards | Not in v1. Could add lightweight route analytics later. |
| Language support | 40+ languages | Multi-language | Multi-language | English only v1. i18n-ready string architecture. |

## Sources

- **Mappedin** — [mappedin.com/wayfinding](https://www.mappedin.com/wayfinding/) — Enterprise wayfinding features, accessibility, multi-channel. Fetched 2026-02-18. **MEDIUM confidence** (marketing page, but detailed feature descriptions).
- **MazeMap** — [mazemap.com](https://www.mazemap.com/) and [mazemap.com/industries/educational-institutions](https://www.mazemap.com/industries/educational-institutions) — Campus-specific wayfinding, education use cases, accessibility blog. Fetched 2026-02-18. **MEDIUM confidence** (marketing page with real university testimonials).
- **MazeMap Accessibility Blog** — [mazemap.com/post/campus-accessibility-plan](https://www.mazemap.com/post/campus-accessibility-plan) — Detailed campus accessibility strategies. **MEDIUM confidence**.
- **ArcGIS Indoors** — [esri.com/en-us/arcgis/products/arcgis-indoors/overview](https://www.esri.com/en-us/arcgis/products/arcgis-indoors/overview) — Enterprise indoor GIS: floor-aware maps, turn-by-turn, space management, Rutgers University case study. Fetched 2026-02-18. **HIGH confidence** (official product page from Esri).
- **Domain knowledge** — Graph-based pathfinding (Dijkstra/A*), WCAG 2.1 AA standards, responsive web design patterns. **HIGH confidence** (well-established CS/web standards).

---
*Feature research for: Campus wayfinding / indoor navigation web app*
*Researched: 2026-02-18*
