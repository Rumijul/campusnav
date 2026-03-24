# S04: Map Landmarks & Location Display — completed 2026 02 19

**Goal:** unit tests prove Map Landmarks & Location Display — completed 2026-02-19 works
**Demo:** unit tests prove Map Landmarks & Location Display — completed 2026-02-19 works

## Must-Haves


## Tasks

- [x] **T01: Extend the shared NavNodeData type with 4 optional display fields, create a…**
  - Extend the shared NavNodeData type with 4 optional display fields, create a rich 25-node campus-graph.json test fixture, and wire a GET /api/map endpoint on the Hono server.
- [x] **T02: Build the interactive landmark marker system: a data fetch hook, individual counter-scaled…**
  - Build the interactive landmark marker system: a data fetch hook, individual counter-scaled Konva markers with hitFunc tap targets, a filtered landmark layer, and stageScale sync so markers maintain constant screen size during zoom.
- [x] **T03: Install Vaul and build the LandmarkSheet bottom sheet component. Wire it into…**
  - Install Vaul and build the LandmarkSheet bottom sheet component. Wire it into FloorPlanCanvas so tapping a marker opens the sheet with landmark details.
- [x] **T04: Human verification of the complete Phase 4 landmark and location display feature.…**
  - Human verification of the complete Phase 4 landmark and location display feature. Confirms all three requirements (MAP-03, MAP-04, ROUT-07) are met from a user's perspective.

## Files Likely Touched

- `src/shared/types.ts`
- `src/server/index.ts`
- `src/server/assets/campus-graph.json`
- `src/client/hooks/useGraphData.ts`
- `src/client/components/LandmarkMarker.tsx`
- `src/client/components/LandmarkLayer.tsx`
- `src/client/hooks/useMapViewport.ts`
- `src/client/components/FloorPlanCanvas.tsx`
- `src/client/components/LandmarkSheet.tsx`
