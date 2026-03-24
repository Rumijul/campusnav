---
phase: 04-map-landmarks-location-display
plan: 02
subsystem: ui
tags: [react-konva, konva, landmarks, markers, counter-scaling, viewport, floor-plan]

# Dependency graph
requires:
  - phase: 04-map-landmarks-location-display
    provides: GET /api/map endpoint returning NavGraph JSON with 25 nodes (18 visible + 7 hidden)
provides:
  - useGraphData hook fetching /api/map with cancel-on-unmount state machine
  - LandmarkMarker component — counter-scaled Konva Group with Circle + hitFunc tap target
  - LandmarkLayer component — filtered layer showing only 5 visible node types
  - stageScale sync in useMapViewport via onScaleChange callback
  - selectedNode state in FloorPlanCanvas ready for Plan 03 bottom sheet
affects:
  - 04-03-bottom-sheet (reads selectedNode from FloorPlanCanvas)
  - 04-04-location-search (uses LandmarkLayer/marker infrastructure)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Counter-scaling: Group scaleX/scaleY = 1/stageScale keeps markers at constant screen pixels"
    - "hitFunc enlarged tap target (2.5× radius) for mobile accessibility"
    - "useGraphData cancel-on-unmount pattern via cancelled flag in useEffect cleanup"
    - "onScaleChange optional callback in useMapViewport — thin event bridge to React state without full state lift"
    - "LandmarkLayer owns its own <Layer> — rendered directly inside Stage without extra wrapper"

key-files:
  created:
    - src/client/hooks/useGraphData.ts
    - src/client/components/LandmarkMarker.tsx
    - src/client/components/LandmarkLayer.tsx
  modified:
    - src/client/hooks/useMapViewport.ts
    - src/client/components/FloorPlanCanvas.tsx

key-decisions:
  - "LandmarkLayer renders its own <Layer> rather than wrapping in FloorPlanCanvas — cleaner encapsulation"
  - "onScaleChange callback pattern (not lifting full viewport state) — preserves 60fps direct Konva mutations"
  - "isLabelVisible = selected OR scale >= 2.0 — progressive disclosure reduces visual clutter at normal zoom"
  - "hitFunc 2.5x radius for accessible tap targets on mobile without visually enlarging the circle"

patterns-established:
  - "Counter-scaling pattern: Group scaleX={1/stageScale} for constant-screen-size Konva elements"
  - "Thin callback bridge: onScaleChange? in viewport hook notifies React state without full state lift"

requirements-completed: [MAP-03, MAP-04]

# Metrics
duration: 3min
completed: 2026-02-19
---

# Phase 4 Plan 02: Landmark Markers Summary

**Counter-scaled Konva landmark markers (5 types, 18 visible nodes) with useGraphData fetch hook, LandmarkLayer filtering, and stageScale sync via onScaleChange callback**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-02-19T03:32:08Z
- **Completed:** 2026-02-19T03:35:11Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- useGraphData hook fetches /api/map with cancel-on-unmount, returns typed NavGraph state machine (loading/loaded/error)
- LandmarkMarker renders counter-scaled Konva Group (scaleX/Y = 1/stageScale) with enlarged hitFunc tap target (2.5× radius) and optional label at zoom ≥ 2×
- LandmarkLayer filters 25 nodes to 5 visible types (room, entrance, elevator, restroom, landmark) = 18 markers shown, 7 hidden nav nodes excluded
- useMapViewport extended with optional onScaleChange callback called after wheel/pinch/button/fitToScreen scale changes
- FloorPlanCanvas wired: selectedNode + stageScale state, LandmarkLayer inside Stage, Stage onClick deselects

## Task Commits

Each task was committed atomically:

1. **Task 1: useGraphData, LandmarkMarker, LandmarkLayer** - `3d274d4` (feat)
2. **Task 2: stageScale sync + FloorPlanCanvas wiring** - `63aceea` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/client/hooks/useGraphData.ts` — Fetch hook for GET /api/map; NavGraph state machine with cancel-on-unmount
- `src/client/components/LandmarkMarker.tsx` — Single counter-scaled marker: circle + hitFunc + optional label
- `src/client/components/LandmarkLayer.tsx` — Filtered landmark layer; owns its own react-konva Layer
- `src/client/hooks/useMapViewport.ts` — Added onScaleChange optional callback to options + all zoom paths
- `src/client/components/FloorPlanCanvas.tsx` — Added selectedNode/stageScale state; wired LandmarkLayer + onClick dismiss

## Decisions Made

- **LandmarkLayer owns its own Layer**: Cleaner encapsulation — LandmarkLayer is a self-contained Konva subtree. FloorPlanCanvas renders `<LandmarkLayer />` directly in Stage, no wrapping Layer needed.
- **onScaleChange callback pattern**: Preserves the Phase 2 decision to use direct Konva mutations (no React state) for 60fps viewport performance. onScaleChange is a thin one-way notification bridge only.
- **isLabelVisible = selected OR scale >= 2.0**: Progressive disclosure pattern — labels only appear when the user has zoomed in enough to read them or explicitly selected a node.
- **hitFunc 2.5× radius**: Enlarges the invisible tap target for mobile accessibility without changing the visual circle size.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None — TypeScript compiled cleanly (only pre-existing `use-image` type declaration gap from Phase 2, unrelated to this plan). Biome lint passed zero warnings across all 28 files.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `selectedNode` state in FloorPlanCanvas is ready for Plan 03's `<LandmarkSheet>` component
- `setSelectedNode` reference available in FloorPlanCanvas scope for Plan 03 to add `onClose={() => setSelectedNode(null)}`
- All 18 visible landmark markers render with correct type colors; 7 hidden nav nodes produce no markers
- No blockers

## Self-Check: PASSED

- ✅ `src/client/hooks/useGraphData.ts` — exists on disk
- ✅ `src/client/components/LandmarkMarker.tsx` — exists on disk
- ✅ `src/client/components/LandmarkLayer.tsx` — exists on disk
- ✅ `src/client/hooks/useMapViewport.ts` — exists on disk
- ✅ `src/client/components/FloorPlanCanvas.tsx` — exists on disk
- ✅ `04-02-SUMMARY.md` — exists on disk
- ✅ Commit `3d274d4` — verified in git log
- ✅ Commit `63aceea` — verified in git log

---
*Phase: 04-map-landmarks-location-display*
*Completed: 2026-02-19*
