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

### Active

<!-- v1.5 scope — multi-floor, multi-building, hosted deployment -->

- [ ] Each building floor has its own uploaded floor plan image and node graph
- [ ] Staircase/elevator/ramp nodes are marked as floor connectors (link floor N to floor N+1)
- [ ] Routes auto-path across floors using accessible floor connectors where required
- [ ] Per-floor route visualization — student sees each floor's map segment of the route
- [ ] Student can manually switch floors to browse the map
- [ ] Admin supports multiple buildings — each building has multiple floors
- [ ] Campus outdoor map — admin uploads a hand-drawn overhead campus image
- [ ] Admin places outdoor path nodes and building entrance nodes on campus map
- [ ] Building entrances connect outdoor graph to each building's floor 1 graph
- [ ] Routes spanning buildings show campus outdoor map segment + building floor segments
- [ ] Full deployment to free always-on hosting (frontend CDN + API + cloud DB)

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

Shipped v1.0 with ~6,865 LOC TypeScript (React 19 + Hono + Konva.js + Drizzle/SQLite).

**Tech stack:** React 19 SPA, Vite, Hono (Node), Konva.js, Drizzle ORM, SQLite (better-sqlite3), ngraph.path (A*), Biome, Tailwind CSS, React Router v6, JWT (httpOnly cookie), CSRF.

**Architecture patterns established:**
- Normalized 0-1 coordinates for floor plan positioning (prevents pixel-drift on different image sizes)
- Direct Konva stage mutations (not React setState) for all viewport interactions — 60fps performance
- Client-side pathfinding; server is thin CRUD layer only
- Counter-scaled marker Groups for constant screen-pixel landmark sizes during zoom
- Custom CSS bottom sheets (not Vaul) — Vaul's modal=false+snapPoints was fundamentally broken with Konva event propagation

**Known tech debt from v1.0:**
- Phase 13 has no VERIFICATION.md (ROUT-07 partially documented — integration-confirmed wired)
- NodeDataTable roomNumber "clear to undefined" path dispatches `{}` instead of `{ roomNumber: undefined }` — admin cannot clear a previously-set room number via data table
- LandmarkSheet.tsx is dead code (never imported — superseded by Phase 5 route pins + Phase 13 LocationDetailSheet)
- REQUIREMENTS.md stats footer was cosmetically stale (corrected in archive)

## Constraints

- **Platform**: Web application — must work in modern browsers on both desktop and mobile
- **No GPS**: Users manually select their location; no device location services used
- **Single floor**: v1 covers one floor only; architecture does not prevent multi-floor later
- **Tech stack**: React + Hono + Konva.js + SQLite (established in v1.0)
- **Authentication**: Only needed for admin panel, not for student wayfinding
- **Coordinate system**: Normalized 0-1 — do not switch to pixel coordinates

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

## Current Milestone: v1.5 General Support Update

**Goal:** Extend CampusNav from single-floor/single-building to a full multi-floor, multi-building campus navigation system, and deploy on free always-on hosting.

**Target features:**
- Multi-floor navigation with per-floor images and auto-routed staircase/elevator transitions
- Multi-building support with hand-drawn campus overhead map and outdoor path routing
- Free always-on deployment (frontend + API + database)

---
*Last updated: 2026-02-28 after v1.5 milestone start*
