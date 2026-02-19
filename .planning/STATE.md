# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2025-02-18)

**Core value:** Show any student the quickest route from where they are to where they need to be, with wheelchair-accessible alternatives always visible.
**Current focus:** Phase 4 executing — Map Landmarks & Location Display

## Current Position

Phase: 4 of 10 (Map Landmarks & Location Display) — IN PROGRESS
Plan: 1 of TBD in current phase
Status: 04-01 complete — types, fixture, and /api/map endpoint done
Last activity: 2026-02-19 — Completed 04-01 (NavNodeData display fields + GET /api/map)

Progress: [████░░░░░░] 35%

## Performance Metrics

**Velocity:**
- Total plans completed: 6
- Average duration: 10 min
- Total execution time: 1.0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-project-setup-foundation | 2/2 | 27 min | 13 min |
| 02-floor-plan-rendering | 2/2 | 22 min | 11 min |
| 03-graph-data-model-pathfinding-engine | 2/2 | 8 min | 4 min |
| 04-map-landmarks-location-display | 1/TBD | ~8 min | ~8 min |

**Recent Trend:**
- Last 5 plans: 7 min, 15 min, 5 min, 3 min, 8 min
- Trend: stable

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

### Pending Todos

None yet.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-02-19
Stopped at: Completed 04-01-PLAN.md
Resume file: .planning/phases/04-map-landmarks-location-display/04-01-SUMMARY.md
