# M001: CampusNav v1.6 GPS Integration & UX Refinements

**Vision:** A web-based campus wayfinding application that helps students find the quickest route between two points on a school campus map.

## Success Criteria

- Students can read cross-floor routes with clear floor section dividers and directional floor-change language.
- Admins can visually link floor connectors across floors without manual node-ID entry.
- Admins can configure per-floor and campus GPS bounds in the editor.
- Students can use browser geolocation for a "you are here" dot and nearest-node route start, with graceful fallback when GPS is unavailable.
- Remaining active slices start with a checkpoint commit before research/deep-dive work begins (override 2026-03-24).

## Slices

- [x] **S01: Project Setup & Foundation — completed 2026 02 18** `risk:medium` `depends:[]`
  > After this: unit tests prove Project Setup & Foundation — completed 2026-02-18 works
- [x] **S02: Floor Plan Rendering — completed 2026 02 18** `risk:medium` `depends:[S01]`
  > After this: unit tests prove Floor Plan Rendering — completed 2026-02-18 works
- [x] **S03: Graph Data Model & Pathfinding Engine — completed 2026 02 19** `risk:medium` `depends:[S02]`
  > After this: unit tests prove Graph Data Model & Pathfinding Engine — completed 2026-02-19 works
- [x] **S04: Map Landmarks & Location Display — completed 2026 02 19** `risk:medium` `depends:[S03]`
  > After this: unit tests prove Map Landmarks & Location Display — completed 2026-02-19 works
- [x] **S05: Search & Location Selection — completed 2026 02 19** `risk:medium` `depends:[S04]`
  > After this: unit tests prove Search & Location Selection — completed 2026-02-19 works
- [x] **S06: Issues needed to be fixed — completed 2026 02 20 [INSERTED]** `risk:medium` `depends:[S05]`
  > After this: unit tests prove Issues needed to be fixed — completed 2026-02-20 [INSERTED] works
- [x] **S07: Route Visualization & Directions — completed 2026 02 20** `risk:medium` `depends:[S06]`
  > After this: unit tests prove Route Visualization & Directions — completed 2026-02-20 works
- [x] **S08: API & Data Persistence — completed 2026 02 22** `risk:medium` `depends:[S07]`
  > After this: unit tests prove API & Data Persistence — completed 2026-02-22 works
- [x] **S09: Admin Authentication — completed 2026 02 21** `risk:medium` `depends:[S08]`
  > After this: unit tests prove Admin Authentication — completed 2026-02-21 works
- [x] **S10: Admin Map Editor — Visual — completed 2026 02 21** `risk:medium` `depends:[S09]`
  > After this: unit tests prove Admin Map Editor — Visual — completed 2026-02-21 works
- [x] **S11: Admin Map Editor — Management — completed 2026 02 21** `risk:medium` `depends:[S10]`
  > After this: unit tests prove Admin Map Editor — Management — completed 2026-02-21 works
- [x] **S12: Fix Data Tab Visibility — completed 2026 02 22** `risk:medium` `depends:[S11]`
  > After this: unit tests prove Fix Data Tab Visibility — completed 2026-02-22 works
- [x] **S13: Retroactive Phase Verifications — completed 2026 02 22** `risk:medium` `depends:[S12]`
  > After this: unit tests prove Retroactive Phase Verifications — completed 2026-02-22 works
- [x] **S14: Restore Location Detail View — completed 2026 02 27** `risk:medium` `depends:[S13]`
  > After this: unit tests prove Restore Location Detail View — completed 2026-02-27 works
- [x] **S15: Documentation Cleanup — completed 2026 02 27** `risk:medium` `depends:[S14]`
  > After this: unit tests prove Documentation Cleanup — completed 2026-02-27 works
- [x] **S16: Node Selection Fixes & Admin Room # Edit — completed 2026 02 28 [INSERTED]** `risk:medium` `depends:[S15]`
  > After this: unit tests prove Node Selection Fixes & Admin Room # Edit — completed 2026-02-28 [INSERTED] works
- [x] **S17: PostgreSQL Migration — completed 2026 03 01** `risk:medium` `depends:[S16]`
  > After this: unit tests prove PostgreSQL Migration — completed 2026-03-01 works
- [x] **S18: Multi Floor Data Model — completed 2026 03 01** `risk:medium` `depends:[S17]`
  > After this: unit tests prove Multi-floor Data Model — completed 2026-03-01 works
- [x] **S19: Multi Floor Pathfinding Engine — completed 2026 03 01** `risk:medium` `depends:[S18]`
  > After this: unit tests prove Multi-floor Pathfinding Engine — completed 2026-03-01 works
- [x] **S20: Admin Multi Floor Editor — completed 2026 03 07** `risk:medium` `depends:[S19]`
  > After this: unit tests prove Admin Multi-floor Editor — completed 2026-03-07 works
- [x] **S21: Student Floor Tab UI — completed 2026 03 07** `risk:medium` `depends:[S20]`
  > After this: unit tests prove Student Floor Tab UI — completed 2026-03-07 works
- [x] **S22: Deployment — completed 2026 03 08** `risk:medium` `depends:[S21]`
  > After this: unit tests prove Deployment — completed 2026-03-08 works
- [x] **S23: Touch Gesture Fixes** `risk:medium` `depends:[S22]`
  > After this: Create the failing test scaffold that defines expected behavior for all three gesture fixes before any production code is written.
- [x] **S24: Multi Floor Direction Dividers — Add floor Section headers and directional language to cross Floor route directions — completed 2026 03 24** `risk:medium` `depends:[S23]`
  > After this: unit tests prove Multi-floor Direction Dividers — Add floor-section headers and directional language to cross-floor route directions works
- [x] **S25: Admin Floor Connector Visual Linking — Replace manual node ID entry with dropdown Based bidirectional connector linking in the admin editor — completed 2026 03 24** `risk:medium` `depends:[S24]`
  > After this: unit tests prove Admin Floor-Connector Visual Linking — Replace manual node ID entry with dropdown-based bidirectional connector linking in the admin editor works
- [x] **S26: Admin GPS Bounds Configuration — Schema, API endpoint, and admin form for configuring real World lat/lng bounding boxes per floor and campus map — completed 2026 03 24** `risk:medium` `depends:[S25]`
  > After this: unit tests prove Admin GPS Bounds Configuration — Schema, API endpoint, and admin form for configuring real-world lat/lng bounding boxes per floor and campus map works
- [ ] **S27: Student GPS Dot — Browser Geolocation Powered "you are here" dot with accuracy ring, nearest Node snap, and graceful fallback** `risk:medium` `depends:[S26]`
  > After this: unit tests prove Student GPS Dot — Browser Geolocation-powered "you are here" dot with accuracy ring, nearest-node snap, and graceful fallback works, and execution evidence shows the pre-research checkpoint commit required by D006.
