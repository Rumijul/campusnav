# CampusNav

## What This Is

A web-based campus wayfinding application that helps students find the quickest route between two points on a school campus map. Users select a start and destination by tapping on a 2D floor plan or searching room names, and the app displays both the optimal walking route and a wheelchair-accessible route side by side — with a visual path drawn on the map and step-by-step text directions.

## Core Value

Show any student the quickest route from where they are to where they need to be, with wheelchair-accessible alternatives always visible.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] 2D campus map rendered from uploaded floor plan image
- [ ] Visible landmarks/nodes for classrooms, rooms, offices (tappable, searchable)
- [ ] Hidden navigation nodes for ramps, staircases (admin-only, invisible to users)
- [ ] User selects start/destination by tapping map or searching/selecting from a list
- [ ] Shortest-path routing using graph-based algorithm (Dijkstra/A*)
- [ ] Wheelchair toggle that shows both standard and accessible routes side by side
- [ ] Route display: visual path on map + step-by-step text directions
- [ ] Admin editor: visual drag-and-drop node placement on floor plan + data table view
- [ ] Admin can rename/edit/delete landmarks and nodes
- [ ] Admin can define connections (edges) between nodes with distance/accessibility metadata
- [ ] No login required for students; admin-only authentication for map editing
- [ ] Single floor support (multi-floor deferred)

### Out of Scope

- GPS/live location tracking — deferred to future version
- Real-time navigation (follow-along as you walk) — deferred
- Multi-floor/multi-building support — coming soon but not v1
- Mobile native app — web-first
- Student accounts/login — open access for wayfinding
- AI/ML-based routing — graph-based pathfinding is sufficient and appropriate

## Context

- This is for a specific school institution — the map represents one campus
- A floor plan image already exists and will be used as the map base layer
- The node graph is the core data structure: visible landmarks + hidden navigation nodes connected by weighted edges
- Wheelchair accessibility is a first-class concern, not an afterthought — ramps and stairs are encoded as node metadata so the routing algorithm can include/exclude them
- "Hidden nodes" (ramps, staircases) exist in the graph for pathfinding but are not rendered on the student-facing map
- Admin needs both a visual editor (drag nodes onto the floor plan) and a table/form view for precise data entry

## Constraints

- **Platform**: Web application — must work in modern browsers on both desktop and mobile
- **No GPS**: Users manually select their location; no device location services used
- **Single floor**: v1 covers one floor only; architecture should not prevent multi-floor later
- **Tech stack**: To be determined by research — no hard preferences from user
- **Authentication**: Only needed for admin panel, not for student wayfinding

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Graph-based pathfinding (Dijkstra/A*) over AI/ML | Standard, proven, predictable for indoor routing on a known graph | — Pending |
| Show both routes (standard + wheelchair) side by side | Better UX than a simple toggle — lets users compare | — Pending |
| Hidden navigation nodes for ramps/stairs | Keeps student map clean while giving pathfinder full graph info | — Pending |
| Web app, no native mobile | Simplicity, no install needed, accessible from any device | — Pending |
| Admin-only editing with visual + table editor | Prevents accidental edits; dual editor covers precision and ease of use | — Pending |
| No student login | Reduces friction — open the app, find your route | — Pending |

---
*Last updated: 2025-02-18 after initialization*
