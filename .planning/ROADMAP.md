# Roadmap: CampusNav

## Milestones

- ✅ **v1.0 MVP** — Phases 1–14.1 (shipped 2026-02-28)
- ✅ **v1.5 General Support Update** — Phases 15–20 (shipped 2026-03-08)
- 🚧 **v1.6 GPS Integration & UX Refinements** — Phases 21–25 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1–14.1) — SHIPPED 2026-02-28</summary>

- [x] Phase 1: Project Setup & Foundation (2/2 plans) — completed 2026-02-18
- [x] Phase 2: Floor Plan Rendering (2/2 plans) — completed 2026-02-18
- [x] Phase 3: Graph Data Model & Pathfinding Engine (2/2 plans) — completed 2026-02-19
- [x] Phase 4: Map Landmarks & Location Display (4/4 plans) — completed 2026-02-19
- [x] Phase 5: Search & Location Selection (3/3 plans) — completed 2026-02-19
- [x] Phase 5.1: Issues needed to be fixed (2/2 plans) — completed 2026-02-20 [INSERTED]
- [x] Phase 6: Route Visualization & Directions (7/7 plans) — completed 2026-02-20
- [x] Phase 7: API & Data Persistence (4/4 plans) — completed 2026-02-22
- [x] Phase 8: Admin Authentication (3/3 plans) — completed 2026-02-21
- [x] Phase 9: Admin Map Editor — Visual (4/4 plans) — completed 2026-02-21
- [x] Phase 10: Admin Map Editor — Management (3/3 plans) — completed 2026-02-21
- [x] Phase 11: Fix Data Tab Visibility (2/2 plans) — completed 2026-02-22
- [x] Phase 12: Retroactive Phase Verifications (3/3 plans) — completed 2026-02-22
- [x] Phase 13: Restore Location Detail View (3/3 plans) — completed 2026-02-27
- [x] Phase 14: Documentation Cleanup (1/1 plan) — completed 2026-02-27
- [x] Phase 14.1: Node Selection Fixes & Admin Room # Edit (3/3 plans) — completed 2026-02-28 [INSERTED]

Full phase details: [.planning/milestones/v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md)

</details>

<details>
<summary>✅ v1.5 General Support Update (Phases 15–20) — SHIPPED 2026-03-08</summary>

- [x] Phase 15: PostgreSQL Migration (3/3 plans) — completed 2026-03-01
- [x] Phase 16: Multi-floor Data Model (4/4 plans) — completed 2026-03-01
- [x] Phase 17: Multi-floor Pathfinding Engine (4/4 plans) — completed 2026-03-01
- [x] Phase 18: Admin Multi-floor Editor (6/6 plans) — completed 2026-03-07
- [x] Phase 19: Student Floor Tab UI (5/5 plans) — completed 2026-03-07
- [x] Phase 20: Deployment (3/3 plans) — completed 2026-03-08

Full phase details: [.planning/milestones/v1.5-ROADMAP.md](milestones/v1.5-ROADMAP.md)

</details>

### 🚧 v1.6 GPS Integration & UX Refinements (In Progress)

**Milestone Goal:** Add GPS-based "you are here" positioning and fix mobile gesture focal points, plus improve multi-floor directions clarity and admin floor-connector workflow.

- [ ] **Phase 21: Touch Gesture Fixes** — Correct pinch-zoom and two-finger rotation to use the touch midpoint as focal/pivot point, with jitter elimination
- [ ] **Phase 22: Multi-floor Direction Dividers** — Add floor-section headers and directional language to cross-floor route directions
- [ ] **Phase 23: Admin Floor-Connector Visual Linking** — Replace manual node ID entry with dropdown-based bidirectional connector linking in the admin editor
- [ ] **Phase 24: Admin GPS Bounds Configuration** — Schema, API endpoint, and admin form for configuring real-world lat/lng bounding boxes per floor and campus map
- [ ] **Phase 25: Student GPS Dot** — Browser Geolocation-powered "you are here" dot with accuracy ring, nearest-node snap, and graceful fallback

## Phase Details

### Phase 21: Touch Gesture Fixes
**Goal**: Students and admins experience correct pinch-to-zoom and two-finger rotation on any rotated canvas angle, without jitter
**Depends on**: Phase 20 (v1.5 shipped baseline)
**Requirements**: TOUCH-01, TOUCH-02, TOUCH-03
**Success Criteria** (what must be TRUE):
  1. Pinching to zoom on a rotated floor plan keeps the map stationary under both fingers — the view does not jump or shift toward the stage origin
  2. Two-finger rotation pivots visibly around the midpoint between both fingers at all canvas rotation angles
  3. A slow pinch gesture that incidentally rotates less than 2 degrees does not apply any rotation — the map stays level during a pure zoom gesture
**Plans**: TBD

### Phase 22: Multi-floor Direction Dividers
**Goal**: Students following a cross-floor route can clearly see which steps belong to each floor, including which direction to travel at each floor transition
**Depends on**: Phase 20 (v1.5 shipped baseline)
**Requirements**: DIR-01, DIR-02
**Success Criteria** (what must be TRUE):
  1. A multi-floor directions list displays a visible floor-section header between the last step on one floor and the first step on the next floor
  2. The floor-transition step includes directional language ("up to Floor 3" or "down to Floor 1") so the student knows which way to go at the connector
**Plans**: TBD

### Phase 23: Admin Floor-Connector Visual Linking
**Goal**: Admins can link floor-connector nodes across floors using a dropdown picker in the editor sidebar, with links saved atomically and removable
**Depends on**: Phase 20 (v1.5 shipped baseline)
**Requirements**: CONN-01, CONN-02, CONN-03
**Success Criteria** (what must be TRUE):
  1. An admin selecting a connector-type node (staircase, elevator, ramp) in the editor sidebar sees a "Floor Connections" section with dropdowns listing compatible nodes on the floor above and below
  2. Saving a connector link causes routing to work correctly in both directions — the linked nodes each reference the other without any manual node ID entry
  3. If admin saves a link and then immediately routes between the two connected floors, the path traverses the linked connector correctly in both upward and downward directions
  4. An admin can remove an existing connector link, and after removal routing no longer uses that connection
**Plans**: TBD

### Phase 24: Admin GPS Bounds Configuration
**Goal**: Admins can set real-world GPS coordinates for each floor and the campus map so the system can transform device GPS positions into canvas coordinates
**Depends on**: Phase 20 (v1.5 shipped baseline)
**Requirements**: GPS-01, GPS-02
**Success Criteria** (what must be TRUE):
  1. An admin opens the Manage Floors interface and sees GPS bounds fields (min/max latitude and longitude) for each floor row and the campus map
  2. An admin enters valid GPS bounds and saves — on the next page load those bounds are present in the API response for that floor
  3. Entering a latitude minimum that is greater than or equal to the latitude maximum shows an inline error message and prevents saving
  4. Entering a longitude minimum that is greater than or equal to the longitude maximum shows an inline error message and prevents saving
**Plans**: TBD

### Phase 25: Student GPS Dot
**Goal**: Students on a GPS-capable device see a "you are here" dot on the floor plan that reflects their real-world position, and can tap one button to use that position as their route start point
**Depends on**: Phase 24 (GPS bounds must be configured in DB before dot can be positioned)
**Requirements**: GPS-03, GPS-04, GPS-05, GPS-06, GPS-07
**Success Criteria** (what must be TRUE):
  1. A student on a campus floor with GPS bounds configured sees a dot on the map canvas representing their current location, positioned relative to the GPS bounding box
  2. The GPS dot is surrounded by an accuracy ring that grows larger when the device reports lower GPS accuracy (e.g., indoors vs. outdoors)
  3. The GPS dot and accuracy ring are hidden when the reported accuracy is worse than 50 meters — no misleading confident dot appears in poor conditions
  4. A student tapping "Use my location" has their route start automatically set to the nearest walkable node on the navigation graph, so they can immediately tap a destination and get directions
  5. A student who denies GPS permission or is on an unsupported device sees a clear message explaining GPS is unavailable, and can still manually select their start point without any broken UI
**Plans**: TBD

## Progress

| Phase                                               | Milestone | Plans Complete | Status      | Completed  |
| --------------------------------------------------- | --------- | -------------- | ----------- | ---------- |
| 1. Project Setup & Foundation                       | v1.0      | 2/2            | Complete    | 2026-02-18 |
| 2. Floor Plan Rendering                             | v1.0      | 2/2            | Complete    | 2026-02-18 |
| 3. Graph Data Model & Pathfinding Engine            | v1.0      | 2/2            | Complete    | 2026-02-19 |
| 4. Map Landmarks & Location Display                 | v1.0      | 4/4            | Complete    | 2026-02-19 |
| 5. Search & Location Selection                      | v1.0      | 3/3            | Complete    | 2026-02-19 |
| 5.1. Issues needed to be fixed (INSERTED)           | v1.0      | 2/2            | Complete    | 2026-02-20 |
| 6. Route Visualization & Directions                 | v1.0      | 7/7            | Complete    | 2026-02-20 |
| 7. API & Data Persistence                           | v1.0      | 4/4            | Complete    | 2026-02-22 |
| 8. Admin Authentication                             | v1.0      | 3/3            | Complete    | 2026-02-21 |
| 9. Admin Map Editor — Visual                        | v1.0      | 4/4            | Complete    | 2026-02-21 |
| 10. Admin Map Editor — Management                   | v1.0      | 3/3            | Complete    | 2026-02-21 |
| 11. Fix Data Tab Visibility                         | v1.0      | 2/2            | Complete    | 2026-02-22 |
| 12. Retroactive Phase Verifications                 | v1.0      | 3/3            | Complete    | 2026-02-22 |
| 13. Restore Location Detail View                    | v1.0      | 3/3            | Complete    | 2026-02-27 |
| 14. Documentation Cleanup                           | v1.0      | 1/1            | Complete    | 2026-02-27 |
| 14.1. Node Selection Fixes & Room # Edit (INSERTED) | v1.0      | 3/3            | Complete    | 2026-02-28 |
| 15. PostgreSQL Migration                            | v1.5      | 3/3            | Complete    | 2026-03-01 |
| 16. Multi-floor Data Model                          | v1.5      | 4/4            | Complete    | 2026-03-01 |
| 17. Multi-floor Pathfinding Engine                  | v1.5      | 4/4            | Complete    | 2026-03-01 |
| 18. Admin Multi-floor Editor                        | v1.5      | 6/6            | Complete    | 2026-03-07 |
| 19. Student Floor Tab UI                            | v1.5      | 5/5            | Complete    | 2026-03-07 |
| 20. Deployment                                      | v1.5      | 3/3            | Complete    | 2026-03-08 |
| 21. Touch Gesture Fixes                             | v1.6      | 0/TBD          | Not started | -          |
| 22. Multi-floor Direction Dividers                  | v1.6      | 0/TBD          | Not started | -          |
| 23. Admin Floor-Connector Visual Linking            | v1.6      | 0/TBD          | Not started | -          |
| 24. Admin GPS Bounds Configuration                  | v1.6      | 0/TBD          | Not started | -          |
| 25. Student GPS Dot                                 | v1.6      | 0/TBD          | Not started | -          |
