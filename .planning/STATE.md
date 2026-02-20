# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2025-02-18)

**Core value:** Show any student the quickest route from where they are to where they need to be, with wheelchair-accessible alternatives always visible.
**Current focus:** Phase 7 IN PROGRESS — Plan 01 complete; DB schema + client ready; Plan 02 next

## Current Position

Phase: 07 of 10 (API & Data Persistence) — IN PROGRESS
Plan: 1 of 4 in current phase (Plan 01 complete)
Status: Phase 07-01 complete — Drizzle schema, DB client, migration file, .gitignore all done
Last activity: 2026-02-20 — Completed 07-01-PLAN.md (Drizzle ORM setup + SQLite schema)

Progress: [████████░░] 72%

## Performance Metrics

**Velocity:**
- Total plans completed: 12
- Average duration: 7 min
- Total execution time: 1.3 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-project-setup-foundation | 2/2 | 27 min | 13 min |
| 02-floor-plan-rendering | 2/2 | 22 min | 11 min |
| 03-graph-data-model-pathfinding-engine | 2/2 | 8 min | 4 min |
| 04-map-landmarks-location-display | 4/4 | ~11 min | ~3 min |
| 05-search-location-selection | 3/3 | 17 min | 6 min |
| 05.1-issues-needed-to-be-fixed | 2/2 | ~29 min | ~15 min |
| 06-route-visualization-directions | 7/7 | ~29 min | ~4 min |

**Recent Trend:**
- Last 5 plans: 5 min, 3 min, 8 min, 3 min, 3 min, 14 min, 4 min
- Trend: stable

*Updated after each plan completion*
| Phase 06-route-visualization-directions P01 | 4 min | 2 tasks | 2 files |
| Phase 06-route-visualization-directions P04 | 2 min | 1 task | 1 file |
| Phase 05.1-issues-needed-to-be-fixed P01 | 4 min | 2 tasks | 4 files |
| Phase 05.1-issues-needed-to-be-fixed P02 | ~25 min | 3 tasks | 3 files |
| Phase 06-route-visualization-directions P06 | 3 min | 5 tasks | 2 files |
| Phase 06-route-visualization-directions P07 | 15 min | 2 tasks | 2 files |
| Phase 07-api-data-persistence P01 | 2 min | 2 tasks | 8 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: 10 phases derived from 25 v1 requirements; comprehensive depth
- [Roadmap]: Phases 2 & 3 can execute in parallel (both depend only on Phase 1)
- [Roadmap]: Student wayfinding (Phases 2-6) before admin tooling (Phases 7-10) per research recommendation
- [Research]: Client-side pathfinding; server is thin CRUD layer only
- [Research]: Normalized 0-1 coordinates to prevent pixel-drift pitfall
- [01-01]: Single-project flat layout (src/client, src/server, src/shared) over monorepo
- [01-01]: npm as package manager — zero setup, universal compatibility
- [01-01]: Biome 2.4 for linting+formatting — single tool replacing ESLint+Prettier
- [01-01]: Dual edge weights (standardWeight + accessibleWeight) for accessibility routing
- [Phase 01-02]: Viewport dimensions tracked via useState + window resize listener so Konva Stage fills screen
- [Phase 01-02]: Biome config uses negated includes (!dist, !node_modules) per v2.2+ syntax to exclude build artifacts
- [02-01]: Sharp + SVG overlay for programmatic test floor plan image generation
- [02-01]: useMemo for fit-to-screen rect to satisfy hooks-at-top-level lint rule
- [02-01]: onImageRectChange callback for FloorPlanImage → FloorPlanCanvas communication
- [02-02]: Direct Konva stage mutation (not React setState) for all viewport interactions — 60fps performance
- [02-02]: Instant wheel zoom (no Tween) to prevent stacked animation jitter; animated Tween for button zoom
- [02-02]: Konva.hitOnDragEnabled = true at module scope for multi-touch pinch during drag
- [02-02]: HTML overlay for ZoomControls — stays fixed outside Konva transform space
- [03-01]: Normalize accessibleWeight to Infinity for non-accessible edges during buildGraph construction
- [03-01]: Use 1e10 as sentinel value in JSON fixtures for non-accessible edge weights
- [03-02]: Pathfinders created once in constructor, reused per query — avoids per-call overhead
- [03-02]: Reverse ngraph.path output for source-first node ordering
  - [03-02]: Frozen NOT_FOUND constant spread for immutable failure responses
  - [04-01]: stairs and ramp moved to 'Invisible to students' in NavNodeType — routing infrastructure only, not student destinations
  - [04-01]: GET /api/map mirrors floor-plan route pattern; Cache-Control max-age=60 for near-real-time admin edits
  - [04-01]: campus-graph.json fixture covers all 9 NavNodeType values for downstream filtering test coverage
- [Phase 04]: LandmarkLayer owns its own Layer — cleaner encapsulation, rendered directly in Stage without wrapper
- [Phase 04]: onScaleChange callback pattern in useMapViewport — thin event bridge to React state preserving 60fps direct Konva mutations
- [Phase 04]: Counter-scaling via Group scaleX/Y=1/stageScale for constant screen-pixel markers during zoom
- [Phase 04-03]: modal=false on Vaul Drawer.Root — keeps Konva map interactive while sheet is peeked; no overlay blocking canvas
- [Phase 04-04]: Human approved all 7 must-have truths — landmark display complete; use-image was pre-existing missing dep fixed with npm install
- [Phase 05-01]: Landmark tap feeds into route selection via setFromTap instead of opening detail sheet — LandmarkSheet removed from render tree
- [Phase 05-01]: A/B pins use counter-scaled Groups matching LandmarkMarker pattern for zoom consistency
- [Phase 05-01]: hiddenNodeIds filtering in LandmarkLayer prevents duplicate markers at selected positions
- [Phase 05-01]: Background tap does NOT clear route selections — only search bar X buttons will clear (Plan 02)
- [Phase 05-02]: setActiveField added to RouteSelection interface — SearchOverlay needs explicit control of which field receives selections
- [Phase 05-02]: Konva.Tween (0.4s, EaseInOut) for auto-pan with 15% bounding-box padding
- [Phase 05-02]: Biome a11y compliance — compact strip uses sibling button elements, no role="button" on divs, no nested buttons
- [Phase 05-02]: routeResult state stored but not consumed — Phase 6 will render route path overlay
- [Phase 05-03]: Human approved all 8 must-have truths — search & location selection complete; no gap closure needed
- [Phase 06-02]: Konva.Animation with dashOffset imperative mutation (not React setState) for 60fps-safe route line animation
- [Phase 06-02]: tension=0 on Konva Line — ensures straight segments through node waypoints, not spline interpolation
- [Phase 06-01]: Screen-space bearing: atan2(dx,-dy) gives clockwise-from-north in canvas coords (y-down)
- [Phase 06-01]: generateDirections exported as pure function for direct unit testing without React wrapper
- [Phase 06-04]: RouteLayer sits inside Stage between FloorPlanImage Layer and LandmarkLayer — canvas-space positioning
- [Phase 06-04]: buildRoutePoints uses useCallback (not useMemo) since it's a function; activeRoutePoints uses useMemo for the computed array
- [Phase 06-04]: Sheet auto-opens at 35% peek on route computed; back arrow closes fully; clearing selections also closes
- [Phase 05.1-02]: Vaul v1.1.2 replaced with custom CSS bottom sheet — modal={false}+snapPoints was fundamentally broken; custom height-transition sheet has zero pointer-event conflicts
- [Phase 05.1-02]: handleSheetBack calls routeSelection.clearAll() — back = exit route mode entirely (SUPERSEDED by 06-06: back now only closes sheet)
- [Phase 05.1-02]: SearchOverlay sheetOpen prop collapses compact strip to pill — prevents screen-space conflict with directions sheet
- [Phase 05.1-02]: Clear (✕) button in compact strip — direct route discard without entering search UI
- [Phase 06-06]: routeVisible state decoupled from sheetOpen — back arrow closes sheet while route line stays visible
- [Phase 06-06]: handleSheetBack calls setSheetOpen(false) not clearAll() — back = hide sheet, X = exit route mode
- [Phase 06-06]: useMapViewport: preventDefault only on touches.length >= 2 to unblock single-finger canvas pan after route
- [Phase 06-07]: onOpenSheet/hasRoute props bridge FloorPlanCanvas sheet state to SearchOverlay tap target — compact strip reopens sheet when route available
- [Phase 06-07]: Canvas legend moved to bottom-left (left-3) to eliminate overlap with ZoomControls at bottom-right
- [Phase 07-01]: DB file at data/campus.db (project root), gitignored via data/ entry
- [Phase 07-01]: Migration-first approach — drizzle-kit generate creates committed SQL files (not push)
- [Phase 07-01]: mkdirSync({ recursive: true }) in client.ts auto-creates data/ on first run
- [Phase 07-01]: 1e10 sentinel for non-accessible edges stored as REAL — never Infinity (JSON.stringify(Infinity) = null)

### Pending Todos

None yet.

### Roadmap Evolution

- Phase 5.1 inserted after Phase 5: Issues needed to be fixed (URGENT) — COMPLETE

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-02-20
Stopped at: Completed 07-01-PLAN.md — Drizzle schema, DB client singleton, migration file, .gitignore updated
Resume file: None
Next action: Execute 07-02-PLAN.md (startup seeder + /api/map handler rewrite)
