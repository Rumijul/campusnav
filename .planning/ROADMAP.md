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

- [x] Phase 15: PostgreSQL Migration (3 plans) (completed 2026-03-01)
- [ ] Phase 16: Multi-floor Data Model (4 plans)
  Plans:
  - [ ] 16-01-PLAN.md — Schema + Migration (buildings/floors tables, nodes FK columns, drizzle migration SQL)
  - [ ] 16-02-PLAN.md — Types + Seed (NavGraph nested type, campus-graph.json reformatted, seed.ts updated)
  - [ ] 16-03-PLAN.md — API + Pathfinding compatibility (GET /api/map, POST /api/admin/graph, flattenNavGraph shim)
  - [ ] 16-04-PLAN.md — Human verification (end-to-end: migration, seed, API response shape)
- [ ] Phase 17: Multi-floor Pathfinding Engine (— plans)
- [ ] Phase 18: Admin Multi-floor Editor (— plans)
- [ ] Phase 19: Student Floor Tab UI (— plans)
- [ ] Phase 20: Deployment (— plans)

</details>

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Project Setup & Foundation | v1.0 | 2/2 | Complete | 2026-02-18 |
| 2. Floor Plan Rendering | v1.0 | 2/2 | Complete | 2026-02-18 |
| 3. Graph Data Model & Pathfinding Engine | v1.0 | 2/2 | Complete | 2026-02-19 |
| 4. Map Landmarks & Location Display | v1.0 | 4/4 | Complete | 2026-02-19 |
| 5. Search & Location Selection | v1.0 | 3/3 | Complete | 2026-02-19 |
| 5.1. Issues needed to be fixed (INSERTED) | v1.0 | 2/2 | Complete | 2026-02-20 |
| 6. Route Visualization & Directions | v1.0 | 7/7 | Complete | 2026-02-20 |
| 7. API & Data Persistence | v1.0 | 4/4 | Complete | 2026-02-22 |
| 8. Admin Authentication | v1.0 | 3/3 | Complete | 2026-02-21 |
| 9. Admin Map Editor — Visual | v1.0 | 4/4 | Complete | 2026-02-21 |
| 10. Admin Map Editor — Management | v1.0 | 3/3 | Complete | 2026-02-21 |
| 11. Fix Data Tab Visibility | v1.0 | 2/2 | Complete | 2026-02-22 |
| 12. Retroactive Phase Verifications | v1.0 | 3/3 | Complete | 2026-02-22 |
| 13. Restore Location Detail View | v1.0 | 3/3 | Complete | 2026-02-27 |
| 14. Documentation Cleanup | v1.0 | 1/1 | Complete | 2026-02-27 |
| 14.1. Node Selection Fixes & Room # Edit (INSERTED) | v1.0 | 3/3 | Complete | 2026-02-28 |
| 15. PostgreSQL Migration | 3/3 | Complete    | 2026-03-01 | — |
| 16. Multi-floor Data Model | 3/4 | In Progress|  | — |
| 17. Multi-floor Pathfinding Engine | v1.5 | 0/— | Not started | — |
| 18. Admin Multi-floor Editor | v1.5 | 0/— | Not started | — |
| 19. Student Floor Tab UI | v1.5 | 0/— | Not started | — |
| 20. Deployment | v1.5 | 0/— | Not started | — |
