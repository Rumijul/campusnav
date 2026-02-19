# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2025-02-18)

**Core value:** Show any student the quickest route from where they are to where they need to be, with wheelchair-accessible alternatives always visible.
**Current focus:** Phase 5 in progress — Search & Location Selection

## Current Position

Phase: 5 of 10 (Search & Location Selection) — IN PROGRESS
Plan: 2 of 3 in current phase
Status: 05-01 complete — useRouteSelection hook and A/B pin markers created
Last activity: 2026-02-19 — Completed 05-01-PLAN.md

Progress: [████▌░░░░░] 45%

## Performance Metrics

**Velocity:**
- Total plans completed: 8
- Average duration: 9 min
- Total execution time: 1.1 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-project-setup-foundation | 2/2 | 27 min | 13 min |
| 02-floor-plan-rendering | 2/2 | 22 min | 11 min |
| 03-graph-data-model-pathfinding-engine | 2/2 | 8 min | 4 min |
| 04-map-landmarks-location-display | 4/4 | ~11 min | ~3 min |
| 05-search-location-selection | 1/3 | 3 min | 3 min |

**Recent Trend:**
- Last 5 plans: 15 min, 5 min, 3 min, 8 min, 3 min, 3 min
- Trend: stable, fast

*Updated after each plan completion*

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

### Pending Todos

None yet.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-02-19
Stopped at: Completed 05-01-PLAN.md — route selection state & A/B pin markers
Resume file: .planning/phases/05-search-location-selection/05-02-PLAN.md
Next action: Execute 05-02 (Search UI with autocomplete, nearest-POI search, compact strip, auto-pan, route trigger)
