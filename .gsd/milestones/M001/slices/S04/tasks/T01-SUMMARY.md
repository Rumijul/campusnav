---
phase: 04-map-landmarks-location-display
plan: 01
subsystem: api
tags: [hono, typescript, json, navgraph, campus-graph, types]

# Dependency graph
requires:
  - phase: 03-graph-data-model-pathfinding-engine
    provides: NavNodeData, NavEdgeData, NavGraph types and pathfinding engine
provides:
  - NavNodeData extended with 4 display fields (roomNumber, description, buildingName, accessibilityNotes)
  - campus-graph.json test fixture with 25 nodes (18 visible + 7 hidden)
  - GET /api/map endpoint returning NavGraph JSON
affects:
  - 04-02-marker-rendering
  - 04-03-bottom-sheet
  - 04-04-location-search

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "NavNodeData display fields are optional to keep backward compat with existing graph fixtures"
    - "Hidden nav nodes (junction/hallway/stairs/ramp) use searchable: false to filter from student view"
    - "1e10 sentinel for non-accessible edge weights in JSON (normalised to Infinity in buildGraph)"

key-files:
  created:
    - src/server/assets/campus-graph.json
  modified:
    - src/shared/types.ts
    - src/server/index.ts

key-decisions:
  - "stairs and ramp moved to 'Invisible to students' section in NavNodeType JSDoc — ramps are routing infrastructure only, not searchable destinations"
  - "25-node fixture covers all required NavNodeType values to enable downstream map/marker tests"
  - "GET /api/map mirrors /api/floor-plan/image pattern for consistency; Cache-Control: max-age=60"

patterns-established:
  - "Hono route pattern: readFile → parse → set Cache-Control → c.json()"
  - "All visible nodes include buildingName field so detail sheet can show it without extra lookups"

requirements-completed: [MAP-03, MAP-04]

# Metrics
duration: 8min
completed: 2026-02-19
---

# Phase 4 Plan 01: Types, Fixture & API Endpoint Summary

**Extended NavNodeData with 4 display fields, created 25-node Science Building campus-graph.json fixture, and wired GET /api/map on Hono server**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-02-19T03:26:08Z
- **Completed:** 2026-02-19T03:34:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- NavNodeData now has `roomNumber?`, `description?`, `buildingName?`, `accessibilityNotes?` for rich location detail display
- campus-graph.json fixture: 18 visible (rooms, entrances, elevators, restrooms, landmarks) + 7 hidden (junctions, hallways, stairs, ramp) nodes with 30 edges
- GET /api/map returns full NavGraph JSON; placeholder `_graphTypeCheck` lines removed

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend NavNodeData and create campus-graph.json fixture** - `aa8493e` (feat)
2. **Task 2: Add GET /api/map endpoint to Hono server** - `263388c` (feat)

## Files Created/Modified

- `src/shared/types.ts` — Added 4 optional display fields to NavNodeData; updated NavNodeType JSDoc to move stairs/ramp to hidden section
- `src/server/assets/campus-graph.json` — 25-node NavGraph fixture for Science Building (18 visible + 7 hidden nodes, 30 edges)
- `src/server/index.ts` — Added GET /api/map route; removed placeholder _graphTypeCheck lines

## Decisions Made

- **stairs and ramp are routing infrastructure only**: Moved to "Invisible to students" section in NavNodeType JSDoc. The CONTEXT.md specifies ramps are hidden from student view (they exist only for accessible routing). Stairs similarly are routing waypoints, not destinations.
- **campus-graph.json fixture covers all 9 NavNodeType values**: Ensures downstream marker rendering (04-02) and filtering tests have full coverage.
- **Cache-Control: max-age=60**: Graph data changes rarely (admin-driven), 1-minute cache avoids stale data on edits while reducing server load.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None — TypeScript compiled cleanly (excluding pre-existing `use-image` type declaration gap unrelated to this plan). Biome lint passed with zero warnings.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All downstream plans (04-02 marker rendering, 04-03 bottom sheet, 04-04 search) have the types and API endpoint they need
- campus-graph.json fixture includes both visible and hidden nodes enabling MAP-04 filtering verification
- No blockers

## Self-Check: PASSED

- ✅ `src/shared/types.ts` — exists on disk
- ✅ `src/server/assets/campus-graph.json` — exists on disk
- ✅ `src/server/index.ts` — exists on disk
- ✅ `04-01-SUMMARY.md` — exists on disk
- ✅ Commit `aa8493e` — verified in git log
- ✅ Commit `263388c` — verified in git log
- ✅ Commit `8633e5b` — verified in git log

---
*Phase: 04-map-landmarks-location-display*
*Completed: 2026-02-19*
