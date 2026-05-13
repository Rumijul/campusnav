# S27: Student GPS Dot — Browser Geolocation Powered "you are here" dot with accuracy ring, nearest Node snap, and graceful fallback

**Goal:** Deliver student geolocation assistance that projects browser GPS fixes onto calibrated floor maps, renders a confidence-aware location marker, and lets students start routing from their current location without breaking manual routing.
**Demo:** With floor GPS bounds configured, student mode shows a “you are here” dot plus proportional accuracy ring for usable fixes, hides the marker when accuracy is worse than 50m, supports a “Use my location” nearest-node start action, and shows explicit fallback guidance while manual start/destination selection continues to work.

## Must-Haves

- **R011:** Show a student-facing GPS dot when a valid geolocation fix can be projected onto configured floor bounds.
- **R012:** Render an accuracy ring whose radius scales with reported uncertainty.
- **R013:** Suppress GPS marker rendering when reported accuracy is greater than 50 meters.
- **R014:** “Use my location” must snap to the nearest walkable node and set route start through existing route-selection flow.
- **R015:** Unsupported/denied/unavailable/low-confidence geolocation states must show clear fallback messaging while manual start selection remains fully functional.
- **R022:** Capture checkpoint-commit evidence before implementation deep-dive work and keep it in slice artifacts.

## Proof Level

- This slice proves: integration
- Real runtime required: no
- Human/UAT required: no

## Verification

- `test -f .gsd/milestones/M001/slices/S27/S27-CHECKPOINT.md`
- `bash -lc 'hash=$(awk "/^checkpoint_commit:/ { print \$2 }" .gsd/milestones/M001/slices/S27/S27-CHECKPOINT.md); test -n "$hash" && git cat-file -e "${hash}^{commit}"'`
- `npm test -- src/shared/gps.test.ts`
- `npm test -- src/shared/gps.test.ts -t "hides low-confidence fixes above 50m"`
- `npm test -- src/shared/gps.test.ts -t "returns null for out-of-bounds coordinates"`
- `npm test -- src/client/hooks/useGeolocation.test.ts`
- `npm test -- src/client/hooks/useGeolocation.test.ts -t "maps permission denied geolocation errors to explicit status"`
- `npm test -- src/client/components/GpsLocationLayer.test.tsx`
- `npm test -- src/client/gps/studentGpsState.test.ts`
- `npm test -- src/client/components/SearchOverlay.gps.test.tsx`
- `npm test -- src/client/hooks/useMapViewport.test.ts`
- `npm test`

## Observability / Diagnostics

- Runtime signals: geolocation status (`unsupported`, `permission-denied`, `position-ready`, `position-unavailable`), latest reported accuracy meters, and nearest-node snap result (`nodeId` found vs no-candidate).
- Inspection surfaces: student overlay fallback copy, “Use my location” control state, and focused Vitest suites for geolocation hook/state derivation/marker rendering.
- Failure visibility: low-confidence fixes (>50m) produce explicit fallback state and hide marker; denied/unsupported states keep manual search controls visible and interactive.
- Redaction constraints: never persist raw latitude/longitude to server storage, DB rows, or diagnostic logs; only derived UI states and node IDs are test/diagnostic surfaces.

## Integration Closure

- Upstream surfaces consumed: `src/shared/types.ts` (`NavFloor.gpsBounds`), `src/client/components/FloorPlanCanvas.tsx` routing orchestration, `src/client/hooks/useRouteSelection.ts`, and S26 complete-only map payload contract.
- New wiring introduced in this slice: browser `navigator.geolocation.watchPosition` → `src/shared/gps.ts` projection/snap helpers → student GPS marker layer + fallback state derivation → `SearchOverlay` “Use my location” action into `routeSelection.setStart`.
- What remains before the milestone is truly usable end-to-end: nothing for student GPS map assist once verification matrix passes.

## Tasks

- [x] **T01: Capture checkpoint evidence and implement shared GPS projection/snap helpers** `est:1.25h`
  - Why: R022 requires commit-first traceability, and R011–R014 depend on deterministic projection/snap math that can be validated independently of UI wiring.
  - Files: `.gsd/milestones/M001/slices/S27/S27-CHECKPOINT.md`, `src/shared/gps.ts`, `src/shared/gps.test.ts`
  - Do: Create a checkpoint commit before implementation edits and record the commit hash/timestamp in `S27-CHECKPOINT.md`; add pure helpers for bounds projection (including latitude-axis inversion), accuracy-to-pixel radius conversion, and nearest-walkable-node selection; cover edge/failure cases with focused unit tests.
  - Verify: `test -f .gsd/milestones/M001/slices/S27/S27-CHECKPOINT.md && npm test -- src/shared/gps.test.ts`
  - Done when: checkpoint artifact exists with a resolvable commit hash and shared GPS helper tests pass for projection, threshold, and snap behaviors.

- [x] **T02: Add geolocation runtime hook and render GPS dot + accuracy ring in FloorPlanCanvas** `est:1.75h`
  - Why: R011–R013 require real browser geolocation lifecycle handling plus map-layer rendering gates tied to calibrated bounds and confidence threshold.
  - Files: `src/client/hooks/useGeolocation.ts`, `src/client/hooks/useGeolocation.test.ts`, `src/client/components/GpsLocationLayer.tsx`, `src/client/components/GpsLocationLayer.test.tsx`, `src/client/components/FloorPlanCanvas.tsx`
  - Do: Implement a browser geolocation watch hook with explicit success/error status modeling and cleanup; add a dedicated GPS marker/ring Konva layer; integrate helper-based marker derivation into `FloorPlanCanvas` so dot/ring render only on calibrated floors with accuracy ≤50m.
  - Verify: `npm test -- src/client/hooks/useGeolocation.test.ts src/client/components/GpsLocationLayer.test.tsx`
  - Done when: calibrated floors render confidence-aware marker visuals for valid fixes, low-confidence fixes suppress marker rendering, and watch lifecycle tests pass.

- [x] **T03: Wire “Use my location” nearest-node start selection with graceful fallback messaging** `est:1.5h`
  - Why: R014–R015 are completed only when students can start routes from snapped GPS location and still navigate manually when GPS paths fail.
  - Files: `src/client/gps/studentGpsState.ts`, `src/client/gps/studentGpsState.test.ts`, `src/client/components/FloorPlanCanvas.tsx`, `src/client/components/SearchOverlay.tsx`, `src/client/components/SearchOverlay.gps.test.tsx`
  - Do: Add derived student GPS UI-state helpers (button enablement + reasoned fallback text), wire “Use my location” in `SearchOverlay`, snap latest valid fix to nearest walkable node on active floor, and route through `routeSelection.setStart` without regressing manual A/B selection flow.
  - Verify: `npm test -- src/client/gps/studentGpsState.test.ts src/client/components/SearchOverlay.gps.test.tsx src/client/hooks/useMapViewport.test.ts && npm test`
  - Done when: “Use my location” reliably sets start from nearest walkable node for valid fixes, fallback messaging is explicit for denied/unsupported/unavailable/low-confidence states, and full suite remains green.

## Files Likely Touched

- `.gsd/milestones/M001/slices/S27/S27-PLAN.md`
- `.gsd/milestones/M001/slices/S27/S27-CHECKPOINT.md`
- `src/shared/gps.ts`
- `src/shared/gps.test.ts`
- `src/client/hooks/useGeolocation.ts`
- `src/client/hooks/useGeolocation.test.ts`
- `src/client/components/GpsLocationLayer.tsx`
- `src/client/components/GpsLocationLayer.test.tsx`
- `src/client/gps/studentGpsState.ts`
- `src/client/gps/studentGpsState.test.ts`
- `src/client/components/FloorPlanCanvas.tsx`
- `src/client/components/SearchOverlay.tsx`
- `src/client/components/SearchOverlay.gps.test.tsx`
