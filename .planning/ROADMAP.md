# Roadmap: CampusNav

## Milestones

- ✅ **v1.0 MVP** — Phases 1–14.1 (shipped 2026-02-28)
- 🔄 **v1.5 General Support Update** — Phases 15–20 (in progress)

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

<details open>
<summary>🔄 v1.5 General Support Update (Phases 15–20) — IN PROGRESS</summary>

- [x] Phase 15: PostgreSQL Migration (3 plans)
 (completed 2026-03-01)
- [x] Phase 16: Multi-floor Data Model (4 plans) — completed 2026-03-01
  Plans:
  - [x] 16-01-PLAN.md — Schema + Migration (buildings/floors tables, nodes FK columns, drizzle migration SQL)
  - [x] 16-02-PLAN.md — Types + Seed (NavGraph nested type, campus-graph.json reformatted, seed.ts updated)
  - [x] 16-03-PLAN.md — API + Pathfinding compatibility (GET /api/map, POST /api/admin/graph, flattenNavGraph shim)
  - [x] 16-04-PLAN.md — Human verification (end-to-end: migration, seed, API response shape)
- [x] Phase 17: Multi-floor Pathfinding Engine (4 plans)
 (completed 2026-03-01)
  Plans:
  - [ ] 17-01-PLAN.md — TDD: Cross-floor edge synthesis in buildGraph (remove flattenNavGraph shim)
  - [ ] 17-02-PLAN.md — TDD: Cross-floor A* heuristic + pathfinding tests
  - [ ] 17-03-PLAN.md — TDD: Floor-change direction steps in generateDirections
  - [ ] 17-04-PLAN.md — Wire: FloorPlanCanvas floorMap + useRouteDirections call sites
- [x] Phase 18: Admin Multi-floor Editor (6 plans) (completed 2026-03-07)
  Plans:
  - [ ] 18-01-PLAN.md — DB schema migration + types extension (connectsToBuildingId)
  - [ ] 18-02-PLAN.md — Server routes (floors CRUD, campus image upload/serve)
  - [ ] 18-03-PLAN.md — useEditorState multi-floor extension (SWITCH_FLOOR, SWITCH_TO_CAMPUS)
  - [ ] 18-04-PLAN.md — ManageFloorsModal + EditorToolbar + EditorSidePanel + NodeMarkerLayer
  - [ ] 18-05-PLAN.md — MapEditorCanvas full rewire (building selector, floor tabs, auto-save, campus mode)
  - [ ] 18-06-PLAN.md — Human verification checkpoint
- [x] Phase 19: Student Floor Tab UI (5 plans) (completed 2026-03-07)
  Plans:
  - [x] 19-00-PLAN.md — Wave 0: useFloorFiltering.test.ts stub (TDD RED state)
  - [x] 19-01-PLAN.md — TDD: useFloorFiltering pure functions + useFloorPlanImage parameterization
  - [x] 19-02-PLAN.md — Components: LandmarkMarker dimmed support + FloorTabStrip HTML overlay
  - [x] 19-03-PLAN.md — Wire: FloorPlanCanvas full multi-floor state, filtering, auto-switch
  - [x] 19-04-PLAN.md — Human verification checkpoint (7 browser scenarios — APPROVED)
- [ ] Phase 20: Deployment (— plans)

</details>

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
| 15. PostgreSQL Migration                            | 3/3       | Complete       | 2026-03-01  | —          |
| 16. Multi-floor Data Model                          | 4/4       | Complete       | 2026-03-01  | 2026-03-01 |
| 17. Multi-floor Pathfinding Engine                  | 4/4       | Complete       | 2026-03-01  | —          |
| 18. Admin Multi-floor Editor                        | 5/6 | Complete    | 2026-03-07 | —          |
| 19. Student Floor Tab UI                            | 5/5 | Complete    | 2026-03-07 | 2026-03-07 |
| 20. Deployment                                      | v1.5      | 0/—            | Not started | —          |
