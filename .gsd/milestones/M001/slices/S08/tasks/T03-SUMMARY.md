---
phase: 07-api-data-persistence
plan: 03
subsystem: ui
tags: [react, typescript, fetch, retry, loading-state]

# Dependency graph
requires:
  - phase: 07-01
    provides: Drizzle schema, DB client, SQLite migration — GET /api/map now returns DB-backed data
provides:
  - useGraphData with 1-2 retry attempts before error state, AbortController cleanup
  - HTML spinner overlay on map area while graph data loads
  - HTML error overlay on map area after retries exhausted
  - LandmarkLayer as pure display component receiving nodes prop from FloorPlanCanvas
  - Single GET /api/map request on page load (double-fetch eliminated)
affects: [08-admin-map-editor, any feature adding graph-data consumers]

# Tech tracking
tech-stack:
  added: []
  patterns: [AbortController for fetch cancellation, retry loop with fixed delay, prop-lifting to eliminate duplicate hook calls]

key-files:
  created: []
  modified:
    - src/client/hooks/useGraphData.ts
    - src/client/components/FloorPlanCanvas.tsx
    - src/client/components/LandmarkLayer.tsx

key-decisions:
  - "AbortController replaces cancelled boolean — cleaner fetch abort on unmount, signal threads through retry loop"
  - "Fixed 1s delay between retries (no exponential backoff) — sufficient at campus-app scale"
  - "HTML overlay (not Konva Text) for graph loading/error states — z-10 + pointer-events-none keeps canvas pannable during load"
  - "LandmarkLayer lifted to pure display component — nodes passed as prop from FloorPlanCanvas, eliminating second useGraphData call"

patterns-established:
  - "Prop-lifting pattern: when two components need the same data, lift the hook call to the nearest common ancestor and pass data as props"
  - "HTML overlay pattern: use absolute-positioned divs with z-10 + pointer-events-none for non-blocking loading states over Konva canvas"

requirements-completed: [ADMN-02]

# Metrics
duration: 5min
completed: 2026-02-21
---

# Phase 07 Plan 03: API & Data Persistence — Loading State + Double-Fetch Fix Summary

**useGraphData with AbortController-based retry (3 attempts, 1s delay), HTML spinner overlay on map, and LandmarkLayer refactored to pure prop-driven component eliminating duplicate GET /api/map**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-02-20T18:54:46Z
- **Completed:** 2026-02-20T18:59:17Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- useGraphData now retries the fetch up to 2 times (3 total attempts) with a 1-second fixed delay before transitioning to error state
- HTML overlay spinner appears on the map area while graph data is loading; HTML error message appears after all retries exhausted
- Double-fetch eliminated: LandmarkLayer no longer calls useGraphData internally — it receives nodes as a prop from FloorPlanCanvas, ensuring exactly one GET /api/map fires on page load

## Task Commits

Each task was committed atomically:

1. **Task 1: Add retry logic to useGraphData** - `7521bb3` (feat)
2. **Task 2: Fix double-fetch, add HTML spinner overlay** - `51bc2d0` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/client/hooks/useGraphData.ts` — Rewritten with `fetchWithRetry` (3 attempts, 1s delay, AbortController signal threading)
- `src/client/components/LandmarkLayer.tsx` — Removed internal `useGraphData` call; now accepts `nodes: NavNode[]` as prop; pure display component
- `src/client/components/FloorPlanCanvas.tsx` — Added `nodes={nodes}` prop to `<LandmarkLayer />`; added HTML loading overlay and HTML error overlay for graph data states

## Decisions Made

- AbortController replaces the `cancelled` boolean flag — the signal threads through `fetchWithRetry`, allowing proper fetch abort (not just ignoring the response) on component unmount
- Fixed 1-second delay between retries — no exponential backoff needed at campus-app scale; keeps the retry window short for transient errors
- HTML overlays (not Konva Text) chosen for graph loading/error states — `z-10` + `pointer-events-none` classes keep the canvas pannable/zoomable while data is loading
- LandmarkLayer converted to a pure display component by lifting the `useGraphData` call up to FloorPlanCanvas — the nodes array was already derived in FloorPlanCanvas via `useMemo`, so lifting requires no duplicate computation

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Graph data loading states are complete and production-quality
- The client makes a single fetch, handles retries gracefully, and surfaces errors clearly to users
- Ready for Phase 07-04 (admin API endpoints) or any downstream phase that consumes graph data

---
*Phase: 07-api-data-persistence*
*Completed: 2026-02-21*
