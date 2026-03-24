# S07: Route Visualization & Directions — completed 2026 02 20

**Goal:** unit tests prove Route Visualization & Directions — completed 2026-02-20 works
**Demo:** unit tests prove Route Visualization & Directions — completed 2026-02-20 works

## Must-Haves


## Tasks

- [x] **T01: Implement useRouteDirections — a pure step-generation hook that converts a PathResult +…**
  - Implement useRouteDirections — a pure step-generation hook that converts a PathResult + node map into turn-by-turn walking directions with landmark references and time estimates.
- [x] **T02: Build RouteLayer — a Konva canvas component that renders an animated dashed…**
  - Build RouteLayer — a Konva canvas component that renders an animated dashed route line from a list of pixel points.
- [x] **T03: Build DirectionsSheet — the Vaul bottom sheet that displays Standard/Accessible route tabs…**
  - Build DirectionsSheet — the Vaul bottom sheet that displays Standard/Accessible route tabs with step-by-step directions and walking time estimates.
- [x] **T04: Wire RouteLayer, DirectionsSheet, legend, and useRouteDirections into FloorPlanCanvas — making routeResult fully…**
  - Wire RouteLayer, DirectionsSheet, legend, and useRouteDirections into FloorPlanCanvas — making routeResult fully consumed and the route visualization end-to-end complete.
- [x] **T05: Human verification of the complete Route Visualization & Directions feature — all…**
  - Human verification of the complete Route Visualization & Directions feature — all 5 phase success criteria confirmed working on the running dev server.
- [x] **T06: Fix three confirmed UAT gaps in FloorPlanCanvas:**
  - Fix three confirmed UAT gaps in FloorPlanCanvas:
- [x] **T07: Verify and fix two UAT gaps relating to directions content (test 3)…**
  - Verify and fix two UAT gaps relating to directions content (test 3) and accessible tab (test 4).

## Files Likely Touched

- `src/client/hooks/useRouteDirections.ts`
- `src/client/hooks/useRouteDirections.test.ts`
- `src/client/components/RouteLayer.tsx`
- `src/client/components/DirectionsSheet.tsx`
- `src/client/components/FloorPlanCanvas.tsx`
- `src/client/hooks/useMapViewport.ts`
