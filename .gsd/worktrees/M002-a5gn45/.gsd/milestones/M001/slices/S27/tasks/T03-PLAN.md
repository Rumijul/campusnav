---
estimated_steps: 5
estimated_files: 5
skills_used:
  - react-best-practices
  - test
---

# T03: Wire “Use my location” nearest-node start selection with graceful fallback messaging

**Slice:** S27 — Student GPS Dot — Browser Geolocation Powered "you are here" dot with accuracy ring, nearest Node snap, and graceful fallback
**Milestone:** M001

## Description

Complete student-facing behavior by connecting valid geolocation fixes to route-start snapping and exposing clear fallback guidance when GPS cannot be used. Manual route entry must remain fully intact.

## Steps

1. Add `src/client/gps/studentGpsState.ts` pure derivation helpers for action readiness/fallback messaging from geolocation status, floor calibration presence, and accuracy threshold.
2. Add `src/client/gps/studentGpsState.test.ts` to lock behavior for denied/unsupported/unavailable/low-confidence/no-calibration states and “ready to use location” state.
3. Extend `src/client/components/FloorPlanCanvas.tsx` to compute nearest walkable node from the latest valid fix and expose an `onUseMyLocation` callback that sets start through `routeSelection.setStart`.
4. Extend `src/client/components/SearchOverlay.tsx` UI with a “Use my location” action and fallback text rendering while preserving existing manual A/B search controls.
5. Add `src/client/components/SearchOverlay.gps.test.tsx` assertions for fallback copy, action availability, and manual-control continuity; run targeted + full regression matrix.

## Must-Haves

- [ ] “Use my location” snaps to nearest walkable node on the active floor and sets route start via existing route-selection APIs.
- [ ] GPS fallback states are explicit and user-readable without blocking manual start/destination search.
- [ ] Regression checks confirm prior map interaction behavior remains intact after GPS integration.

## Verification

- `npm test -- src/client/gps/studentGpsState.test.ts`
- `npm test -- src/client/components/SearchOverlay.gps.test.tsx`
- `npm test -- src/client/hooks/useMapViewport.test.ts`
- `npm test`

## Observability Impact

- Signals added/changed: explicit fallback reason state and use-location action enable/disable state in search overlay.
- How a future agent inspects this: inspect `SearchOverlay` rendered fallback/action text and run focused Vitest suites for state-derivation plus overlay behavior.
- Failure state exposed: every non-ready geolocation condition maps to a distinct fallback message while manual controls remain interactable.

## Inputs

- `src/shared/gps.ts` — nearest-node and projection helpers from T01.
- `src/client/hooks/useGeolocation.ts` — runtime status/fix source from T02.
- `src/client/components/FloorPlanCanvas.tsx` — map orchestration and route-selection wiring.
- `src/client/components/SearchOverlay.tsx` — route entry UX surface.
- `src/client/hooks/useRouteSelection.ts` — start/destination update contract to preserve.

## Expected Output

- `src/client/gps/studentGpsState.ts` — derived GPS fallback/action readiness helpers.
- `src/client/gps/studentGpsState.test.ts` — deterministic state derivation coverage.
- `src/client/components/FloorPlanCanvas.tsx` — nearest-node snap callback wiring for location-based start.
- `src/client/components/SearchOverlay.tsx` — “Use my location” action and fallback messaging UI.
- `src/client/components/SearchOverlay.gps.test.tsx` — overlay behavior regression tests for GPS + manual continuity.
