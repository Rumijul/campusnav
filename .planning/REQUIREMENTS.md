# Requirements: CampusNav

**Defined:** 2025-02-18
**Core Value:** Show any student the quickest route from where they are to where they need to be, with wheelchair-accessible alternatives always visible.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Map & Rendering

- [x] **MAP-01**: User can view a 2D floor plan rendered from an uploaded image with pan and zoom controls
- [x] **MAP-02**: User can interact with the map on mobile devices using touch gestures (pinch-zoom, drag-pan, tap-select)
- [x] **MAP-03**: User can see visible landmarks/nodes on the map for classrooms, rooms, offices, and other points of interest
- [x] **MAP-04**: Map hides navigation-only nodes (ramps, staircases, hallway junctions) from the student view

### Search & Selection

- [x] **SRCH-01**: User can search for rooms/locations by name or keyword with autocomplete suggestions
- [x] **SRCH-02**: User can tap/click on a location on the map to set it as start or destination
- [x] **SRCH-03**: User can select start and destination from a searchable dropdown list
- [x] **SRCH-04**: User can find the nearest point of interest by type (e.g., nearest restroom, exit, elevator) from a selected location

### Routing & Directions

- [x] **ROUT-01**: App computes the shortest path between two points using graph-based pathfinding (Dijkstra/A*)
- [x] **ROUT-02**: App computes a wheelchair-accessible shortest path that excludes stairs and non-accessible edges
- [x] **ROUT-03**: App displays both standard and wheelchair-accessible routes simultaneously with distinct color coding
- [x] **ROUT-04**: App draws visual route paths on the floor plan map from start to destination
- [x] **ROUT-05**: App provides step-by-step text directions with landmark references (e.g., "Turn left at the cafeteria")
- [x] **ROUT-06**: App shows estimated walking time for both standard and wheelchair-accessible routes
- [x] **ROUT-07**: User can tap a location to see its details (name, room number, type, description)

### Admin — Authentication

- [x] **ADMN-01**: Admin can log in with credentials to access the map editor
- [x] **ADMN-02**: Student-facing wayfinding requires no login or authentication

### Admin — Map Editor

- [x] **EDIT-01**: Admin can upload a floor plan image as the map base layer
- [x] **EDIT-02**: Admin can place visible landmark nodes on the floor plan via drag-and-drop
- [x] **EDIT-03**: Admin can place hidden navigation nodes (ramps, stairs, hallway junctions) via drag-and-drop
- [x] **EDIT-04**: Admin can create edges (connections) between nodes with distance/weight metadata
- [x] **EDIT-05**: Admin can mark edges as wheelchair-accessible or not
- [x] **EDIT-06**: Admin can rename, edit properties of, and delete any node
- [ ] **EDIT-07**: Admin can view and edit all nodes in a sortable, filterable data table
- [ ] **EDIT-08**: Admin can import and export graph data in JSON or CSV format

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Sharing & Accessibility

- **SHAR-01**: User can share a route via URL that reconstructs the route on page load
- **SHAR-02**: App supports keyboard navigation and screen reader use (WCAG 2.1 AA)
- **SHAR-03**: User can print step-by-step directions via a print-friendly layout

### Map Enhancements

- **MAPH-01**: User can filter visible POIs by category (restrooms, elevators, offices, etc.)
- **MAPH-02**: App supports multi-floor navigation with floor picker and cross-floor transitions

### Admin Enhancements

- **ADME-01**: Admin can manage multiple admin accounts with role-based permissions

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| GPS / indoor positioning | Requires hardware infrastructure (BLE beacons, WiFi) not available. Manual location selection sufficient for v1 |
| Real-time turn-by-turn navigation | Requires live positioning. Step-by-step directions serve the same purpose for "read then walk" use case |
| 3D map rendering | Adds enormous rendering complexity without improving single-floor wayfinding. 2D is clearer |
| Student accounts / login | Adds friction, privacy concerns (FERPA), and delays core delivery. Open access is a feature |
| Real-time crowd density / occupancy | Requires IoT sensors and real-time infrastructure. No sensor hardware available |
| Space / room booking | Entirely separate product domain. Link to existing campus booking system instead |
| Multi-building / outdoor campus map | Requires satellite/street tile layer. Out of scope until single building is proven |
| Timetable / schedule integration | Campus-specific API, high coupling, low certainty of API availability |
| Multi-language (i18n) | Single-campus deployment. Design with i18n-ready string extraction for future |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| MAP-01 | Phase 2: Floor Plan Rendering | Complete |
| MAP-02 | Phase 2: Floor Plan Rendering | Complete |
| MAP-03 | Phase 4: Map Landmarks & Location Display | Complete |
| MAP-04 | Phase 4: Map Landmarks & Location Display | Complete |
| SRCH-01 | Phase 5: Search & Location Selection | Complete |
| SRCH-02 | Phase 5: Search & Location Selection | Complete |
| SRCH-03 | Phase 5: Search & Location Selection | Complete |
| SRCH-04 | Phase 5: Search & Location Selection | Complete |
| ROUT-01 | Phase 3: Graph Data Model & Pathfinding Engine | Complete |
| ROUT-02 | Phase 3: Graph Data Model & Pathfinding Engine | Complete |
| ROUT-03 | Phase 6: Route Visualization & Directions | Complete |
| ROUT-04 | Phase 6: Route Visualization & Directions | Complete |
| ROUT-05 | Phase 6: Route Visualization & Directions | Complete |
| ROUT-06 | Phase 6: Route Visualization & Directions | Complete |
| ROUT-07 | Phase 4: Map Landmarks & Location Display | Complete |
| ADMN-01 | Phase 8: Admin Authentication | Complete |
| ADMN-02 | Phase 7: API & Data Persistence | Complete |
| EDIT-01 | Phase 9: Admin Map Editor — Visual | Complete |
| EDIT-02 | Phase 9: Admin Map Editor — Visual | Complete |
| EDIT-03 | Phase 9: Admin Map Editor — Visual | Complete |
| EDIT-04 | Phase 9: Admin Map Editor — Visual | Complete |
| EDIT-05 | Phase 9: Admin Map Editor — Visual | Complete |
| EDIT-06 | Phase 10: Admin Map Editor — Management | Complete |
| EDIT-07 | Phase 10: Admin Map Editor — Management | Pending |
| EDIT-08 | Phase 10: Admin Map Editor — Management | Pending |

**Coverage:**
- v1 requirements: 25 total
- Mapped to phases: 25
- Unmapped: 0 ✓

---
*Requirements defined: 2025-02-18*
*Last updated: 2026-02-18 after roadmap creation*
