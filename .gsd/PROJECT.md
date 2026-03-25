# CampusNav

## What This Is

A web-based campus wayfinding application that helps students find the quickest route between two points on a school campus map. Users select a start and destination by tapping on a 2D floor plan or searching room names, and the app displays both the optimal walking route and a wheelchair-accessible route simultaneously — with animated visual paths drawn on the map and step-by-step text directions. An admin map editor lets staff build and maintain the navigation graph visually without coding.

## Core Value

Show any student the quickest route from where they are to where they need to be, with wheelchair-accessible alternatives always visible.

## Requirements

### Validated

- ✓ 2D campus map rendered from uploaded floor plan image with pan/zoom — v1.0
- ✓ Mobile touch gestures (pinch-zoom, drag-pan, tap-select) — v1.0
- ✓ Visible landmark nodes (classrooms, rooms, offices, POIs) tappable and searchable — v1.0
- ✓ Hidden navigation nodes (ramps, staircases) invisible to students but used for routing — v1.0
- ✓ User selects start/destination by tapping map or searching/selecting from a list — v1.0
- ✓ Shortest-path routing using A* (standard + wheelchair-accessible modes) — v1.0
- ✓ Both routes displayed simultaneously with color coding, animated path, step-by-step directions and time estimates — v1.0
- ✓ Landmark detail sheet (name, room number, type, description, accessibility notes) on tap — v1.0
- ✓ Admin visual drag-and-drop node/edge placement on floor plan + data table view — v1.0
- ✓ Admin can rename/edit properties/delete landmarks and nodes — v1.0
- ✓ Admin can define connections (edges) with distance/accessibility metadata — v1.0
- ✓ No login required for students; admin-only JWT authentication for map editing — v1.0
- ✓ Single floor support — v1.0
- ✓ Each building floor has its own uploaded floor plan image and node graph — v1.5
- ✓ Staircase/elevator/ramp nodes are marked as floor connectors (link floor N to floor N+1) — v1.5
- ✓ Routes auto-path across floors using accessible floor connectors where required — v1.5
- ✓ Per-floor route visualization — student sees each floor's map segment of the route — v1.5
- ✓ Student can manually switch floors to browse the map — v1.5
- ✓ Admin supports multiple buildings — each building has multiple floors — v1.5
- ✓ Campus outdoor map — admin uploads a hand-drawn overhead campus image — v1.5
- ✓ Admin places outdoor path nodes and building entrance nodes on campus map — v1.5
- ✓ Building entrances connect outdoor graph to each building's floor 1 graph — v1.5
- ✓ Routes spanning buildings show campus outdoor map segment + building floor segments — v1.5
- ✓ Full deployment to free always-on hosting (Render + Neon PostgreSQL + Backblaze B2) — v1.5

### Completed in v1.6 (Milestone M001)

- [x] Multi-floor directions show floor section dividers and explicit up/down floor-change language
- [x] Admin can visually link floor-connector nodes across floors without manually entering node IDs
- [x] Admin can configure real-world GPS bounds (lat/lng) for each floor plan and the campus map
- [x] App uses browser Geolocation to show a GPS "you are here" dot, accuracy ring, and nearest-node snap as an optional start point with graceful fallback
- [x] Pinch-to-zoom uses the touch midpoint as the zoom focal point; two-finger rotation pivots around the touch midpoint

### Out of Scope

- GPS/live location tracking — requires hardware infrastructure (BLE beacons, WiFi), not available
- Real-time turn-by-turn navigation — requires live positioning; step-by-step directions serve the "read then walk" use case
- 3D map rendering — adds enormous rendering complexity without improving single-floor wayfinding; 2D is clearer
- Student accounts/login — reduces friction; privacy concerns (FERPA); open access is a feature
- Real-time crowd density/occupancy — requires IoT sensors and real-time infrastructure
- Space/room booking — entirely separate product domain
- Multi-building/outdoor campus map — requires satellite/street tile layer; single building first
- Timetable/schedule integration — campus-specific API, high coupling, low certainty
- Multi-language (i18n) — single-campus deployment; design already uses string extraction for future
- Mobile native app — web-first; PWA sufficient

## Context

Shipped v1.5 with ~8,937 LOC TypeScript. Live at https://campusnav-hbm3.onrender.com.

**Tech stack:** React 19 SPA, Vite, Hono (Node), Konva.js, Drizzle ORM, PostgreSQL (postgres-js + Neon), ngraph.path (A*), Biome, Tailwind CSS, React Router v6, JWT (httpOnly cookie), CSRF, @aws-sdk/client-s3 (Backblaze B2 image storage).

**Architecture patterns established:**
- Normalized 0-1 coordinates for floor plan positioning (prevents pixel-drift on different image sizes)
- Direct Konva stage mutations (not React setState) for all viewport interactions — 60fps performance
- Client-side pathfinding; server is thin CRUD layer only
- Counter-scaled marker Groups for constant screen-pixel landmark sizes during zoom
- Custom CSS bottom sheets (not Vaul) — Vaul's modal=false+snapPoints was fundamentally broken with Konva event propagation
- Two-pass buildGraph: pass 1 intra-floor edges, pass 2 synthesizes inter-floor links from connectsToNodeAboveId
- floorSnapshots cache keyed by DB floor ID — prevents re-fetch when admin returns to previously loaded floor
- ResizeObserver on canvas container div for dynamic Stage dimensions (not hardcoded windowHeight − 52)

**Known tech debt from v1.0 (still outstanding):**
- NodeDataTable roomNumber "clear to undefined" path dispatches `{}` instead of `{ roomNumber: undefined }` — admin cannot clear a previously-set room number via data table
- LandmarkSheet.tsx is dead code (never imported — superseded by Phase 5 route pins + Phase 13 LocationDetailSheet)

**Known tech debt from v1.5:**
- Phase 18 ROADMAP listed 5/6 plans; 18-06 was a human-verify checkpoint (all 6 complete, minor display inconsistency in progress table)

## Constraints

- **Platform**: Web application — must work in modern browsers on both desktop and mobile
- **GPS assist**: Browser geolocation is optional and confidence-gated (<=50m); manual start selection remains fully supported fallback.
- **Multi-floor**: v1.5 ships multi-floor; architecture uses buildings/floors entity model
- **Tech stack**: React + Hono + Konva.js + PostgreSQL (established in v1.0, DB upgraded v1.5)
- **Authentication**: Only needed for admin panel, not for student wayfinding
- **Coordinate system**: Normalized 0-1 — do not switch to pixel coordinates
- **Image storage**: Backblaze B2 (S3-compatible) for floor plan and campus images in production
- **Execution protocol (override 2026-03-24)**: For active milestone work, create a checkpoint commit before any research/deep-dive activity

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Graph-based pathfinding (ngraph A*) over AI/ML | Standard, proven, predictable for indoor routing on a known graph | ✓ Good — sub-50ms, dual-mode (standard + accessible) works correctly |
| Show both routes (standard + wheelchair) side by side | Better UX than a simple toggle — lets users compare | ✓ Good — color-coded animated lines + tabbed directions sheet |
| Hidden navigation nodes for ramps/stairs | Keeps student map clean while giving pathfinder full graph info | ✓ Good — 9 NavNodeType values, invisible nodes route-only |
| Web app, no native mobile | Simplicity, no install needed, accessible from any device | ✓ Good — Konva canvas with touch gestures works well on mobile |
| Admin-only editing with visual + table editor | Prevents accidental edits; dual editor covers precision and ease of use | ✓ Good — undo/redo, data tables, import-export all shipped |
| No student login | Reduces friction — open the app, find your route | ✓ Good — GET /api/map is fully public; JWT only on /api/admin/* |
| Normalized 0-1 coordinates | Prevents pixel-drift when floor plan image changes size | ✓ Good — consistent across all zoom levels |
| Direct Konva stage mutation (not React setState) for viewport | 60fps pan/zoom without re-render overhead | ✓ Good — smooth performance confirmed by human UAT |
| Custom CSS bottom sheets instead of Vaul | Vaul modal=false+snapPoints fundamentally broken with Konva pointer events | ✓ Good — custom height-transition sheets have zero pointer-event conflicts |
| httpOnly cookie for JWT (not Authorization header) | XSS-safe; browser handles automatically | ✓ Good — admin auth secure and transparent to students |
| Decimal phase numbering for insertions (5.1, 14.1) | Clear insertion semantics without renumbering subsequent phases | ✓ Good — two insertions executed cleanly (5.1: UAT fixes, 14.1: UX improvements) |
| Client-side pathfinding only | Server remains thin CRUD; pathfinding is fast enough in-browser | ✓ Good — no latency on route computation |
| postgres-js over pg/node-postgres | Native ESM, promise-based, matches Neon serverless connection model | ✓ Good — clean async/await, no callback API |
| Two-pass buildGraph for cross-floor edges | Pass 1 intra-floor, Pass 2 synthesizes inter-floor from node metadata — no JSON-stored inter-floor edges | ✓ Good — inter-floor links derived, not duplicated in DB |
| Zero A* heuristic for cross-floor node pairs | Euclidean x,y across floors is inadmissible; 0 is conservative, inter-floor edge costs provide signal | ✓ Good — correct admissible heuristic, paths route correctly |
| floorNumber=0 sentinel for campus overhead map | Distinguishes campus from building floors (which start at 1); avoids nullable floor number column | ✓ Good — clean separation, no special-case joins needed |
| Backblaze B2 over Cloudflare R2 | No credit card required; S3-compatible drop-in — same @aws-sdk/client-s3 client | ✓ Good — zero code change, all 7 smoke tests passed |
| ResizeObserver for canvas dimensions | Replaces hardcoded windowHeight−52 — fixes canvas stretch when multiple toolbar rows present | ✓ Good — confirmed in Phase 18 human verification |
| Optimistic floor list updates in admin editor | Replace full refetch with local state patch after floor add/delete — eliminates update lag | ✓ Good — instant UI response, confirmed in human verification |
| Commit-before-research execution order for active slices | Mandatory checkpoint commit before research keeps diffs reversible and traceable in auto-mode loops | ✅ Enforced and validated in S27 via checkpoint artifact + hash resolvability checks (D006, R022) |

## Current Milestone: none (awaiting next roadmap plan)

M001 is closed from a delivery standpoint. Next milestone planning has not started yet.

## Last Milestone: v1.6 GPS Integration & UX Refinements — CLOSED 2026-03-25

**Delivered:**
- Touch gesture fixes (midpoint-stable pinch, midpoint rotation pivot, strict >2° rotation dead-zone)
- Cross-floor directions with floor-section headers and explicit up/down floor-change language
- Admin connector dropdown linking with atomic reciprocal link/unlink writes
- Admin per-floor + campus GPS bounds configuration (schema/API/UI)
- Student geolocation assist (GPS dot, accuracy ring, nearest-node start, explicit fallback)
- Checkpoint-before-research governance enforcement for active slices

**Closeout verification status:**
- Functional verification: ✅ pass (`npm test` → 17 files, 144 tests)
- Code-change verification: ✅ pass (non-`.gsd/` diff present: 11 implementation files vs `origin/master` merge-base; `main` ref not present in this repo)
- Auditability verification: ⚠️ needs-attention (missing slice-level summaries `S01-S22`)

## Previous Milestone: v1.5 General Support Update — SHIPPED 2026-03-08

Multi-floor, multi-building campus navigation system deployed on Render + Neon + Backblaze B2.
Live URL: https://campusnav-hbm3.onrender.com

---
*Last updated: 2026-03-25 during M001 milestone final closeout verification (summary + requirements audit + project-state update)*
