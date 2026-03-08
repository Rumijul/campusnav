# Milestones

## v1.5 General Support Update (Shipped: 2026-03-08)

**Phases completed:** 6 phases, 25 plans
**Timeline:** 2026-03-01 → 2026-03-08 (8 days)
**Lines of code:** ~8,937 TypeScript (up from ~6,865 at v1.0)

**Delivered:** Extended CampusNav from single-floor/single-building to a full multi-floor, multi-building campus navigation system deployed on free always-on hosting.

**Key accomplishments:**
1. SQLite → PostgreSQL migration — full async rewrite (postgres-js + Drizzle ORM), verified live against Docker container; INFR-01 satisfied
2. Multi-floor data model — buildings/floors as first-class entities, per-floor nav graphs, floor-connector node metadata (connectsToNodeAboveId/BelowId)
3. Cross-floor A* pathfinding — two-pass buildGraph synthesizes inter-floor links; zero-heuristic for cross-floor pairs preserves admissibility; wheelchair routes prefer accessible connectors
4. Admin multi-floor editor — building selector, floor tabs, Manage Floors modal, campus overhead map upload, campus entrance node linking with amber marker; MFLR-04, CAMP-02–04 satisfied
5. Student floor tab UI — FloorTabStrip, per-floor route filtering, auto-floor-switch on Get Directions, dimmed adjacent-floor elevator markers (TDD: RED→GREEN); MFLR-05, MFLR-06, CAMP-05 satisfied
6. Production deployment — CampusNav live at https://campusnav-hbm3.onrender.com (Render + Neon PostgreSQL + Backblaze B2), all 7 smoke tests passed; DEPL-01–03 satisfied

**Git range:** feat(15-01) swap SQLite → feat(20) switch image storage to Backblaze B2
**Tag:** v1.5

---

## v1.0 MVP (Shipped: 2026-02-28)

**Phases completed:** 16 phases, 48 plans
**Timeline:** 2026-02-18 → 2026-02-28 (10 days)
**Commits:** 183
**Lines of code:** ~6,865 TypeScript

**Delivered:** A fully functional campus wayfinding web app with interactive floor plan rendering, dual-mode graph pathfinding, student-facing search and routing UX, and a visual admin map editor with SQLite persistence.

**Key accomplishments:**
1. Dual-mode A* pathfinding engine (standard + wheelchair-accessible routes) using ngraph with normalized 0-1 coordinate system and sub-50ms performance
2. Interactive Konva.js floor plan canvas with 60fps pan/zoom, pinch-to-zoom on mobile, and counter-scaled landmark markers that stay crisp at any zoom level
3. Full student wayfinding UX — autocomplete search, tap-to-select route pins, animated route visualization, step-by-step directions with time estimates, and landmark detail sheet
4. Visual admin map editor — drag-and-drop node/edge placement on floor plan, accessibility marking, OSM-style property editor, undo/redo, sortable data tables, and JSON/CSV import-export
5. SQLite persistence via Drizzle ORM with idempotent seeder, Hono REST API, and JWT-secured admin routes (httpOnly cookie, CSRF protection, rate limiting)
6. All 25 v1 requirements verified across 4 complete E2E flows — open access for students, protected routes for admins, full CRUD for map data

**Git range:** Initial scaffold → chore(state): phase 14.1 closed
**Tag:** v1.0

---
