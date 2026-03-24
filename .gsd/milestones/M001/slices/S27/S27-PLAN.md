# S27: Student GPS Dot — Browser Geolocation Powered "you are here" dot with accuracy ring, nearest Node snap, and graceful fallback

**Goal:** Deliver student-facing browser geolocation UX (dot + accuracy ring + nearest-node snap + graceful fallback) while enforcing the override that every work cycle starts with a checkpoint commit before research.
**Demo:** Starting from a committed checkpoint, student mode requests browser geolocation, projects valid coordinates into the active floor map, renders the GPS dot + accuracy ring when confidence is acceptable, offers “Use my location” by nearest walkable-node snap, and falls back to manual start selection with clear messaging when GPS is denied/unavailable.

## Must-Haves

- **R011:** Student sees a “you are here” GPS dot on map when valid bounds are configured.
- **R012:** GPS dot displays an accuracy ring proportional to reported uncertainty.
- **R013:** GPS dot is hidden when reported accuracy exceeds 50 meters.
- **R014:** Student can use current location as route start by snapping to nearest walkable node.
- **R015:** If GPS is unavailable or denied, app shows clear fallback messaging and manual start selection remains fully functional.
- **Override 2026-03-24:** Before any S27 research/implementation step, create a checkpoint commit first.

## Proof Level

- This slice proves: integration
- Real runtime required: no
- Human/UAT required: yes (permission-flow sanity check on mobile browser)

## Verification

- `git log -1 --oneline`
- `npm test -- src/client/hooks/useRouteSelection.test.ts`
- `npm test -- src/client/hooks/useMapViewport.test.ts`
- `npm test -- src/client/components/SelectionMarkerLayer.test.tsx`
- `npm test`

## Observability / Diagnostics

- Runtime signals: geolocation permission state (`granted|prompt|denied`), last GPS fix timestamp, reported `accuracy` meters, nearest-node snap distance.
- Inspection surfaces: Student fallback banner text, route start state after “Use my location”, and development-only console diagnostics for projection/snap status.
- Failure visibility: denied/unsupported geolocation never blocks manual start selection; low-confidence fixes (>50m) suppress dot render and show fallback guidance.
- Redaction constraints: never persist raw user latitude/longitude to backend logs or storage.

## Integration Closure

- Upstream surfaces consumed: `NavFloor.gpsBounds` from S26 map payload, student route-selection flow, and walkable-node graph metadata.
- New wiring introduced in this slice: browser geolocation -> floor-bounds projection -> student marker + accuracy ring -> nearest walkable-node route-start action.
- What remains before the milestone is truly usable end-to-end: none once verification passes and pre-research commit evidence is captured.

## Tasks

- [ ] **T01: Create mandatory pre-research checkpoint commit for S27** `est:0.25h`
  - Why: Override requires commit-first execution so GPS research/implementation starts from a reversible baseline.
  - Files: `.gsd/milestones/M001/slices/S27/S27-PLAN.md`, `.gsd/DECISIONS.md`, `.gsd/OVERRIDES.md`
  - Do: Confirm working tree intent, create checkpoint commit, then begin technical research/implementation.
  - Verify: `git log -1 --oneline`
  - Done when: latest commit exists before any new research artifact or production-code delta.

- [ ] **T02: Implement geolocation projection + dot/accuracy rendering gates** `est:1.5h`
  - Why: R011-R013 require accurate, confidence-aware map visualization tied to configured GPS bounds.
  - Files: `src/client/pages/StudentApp.tsx`, `src/client/components/SelectionMarkerLayer.tsx`, `src/client/hooks/useMapViewport.ts`, `src/shared/types.ts`
  - Do: Add browser geolocation state handling, project lat/lng into normalized map coordinates using floor bounds, render dot + proportional accuracy ring, and hide marker when accuracy exceeds 50m.
  - Verify: `npm test -- src/client/hooks/useMapViewport.test.ts`
  - Done when: valid fixes render on calibrated floors and low-confidence fixes never render misleading markers.

- [ ] **T03: Implement nearest-node snap and fallback UX continuity** `est:1.25h`
  - Why: R014-R015 require students to route from current location without breaking manual workflows when GPS is unavailable.
  - Files: `src/client/hooks/useRouteSelection.ts`, `src/client/hooks/useRouteSelection.test.ts`, `src/client/components/SearchOverlay.tsx`, `src/client/pages/StudentApp.tsx`
  - Do: Add nearest-walkable-node resolution for “Use my location”, wire it into start selection, and show explicit denied/unsupported fallback messaging while manual selection remains available.
  - Verify: `npm test -- src/client/hooks/useRouteSelection.test.ts`
  - Done when: location-based start selection snaps deterministically and fallback messaging preserves full manual routing flow.

- [ ] **T04: Add slice-level regression tests for GPS behavior and fallbacks** `est:1h`
  - Why: Prevent regressions across GPS visibility rules, snap behavior, and continuity fallback messaging.
  - Files: `src/client/pages/StudentApp.gps.test.tsx`, `src/client/hooks/useRouteSelection.test.ts`, `src/client/components/SelectionMarkerLayer.test.tsx`
  - Do: Add focused tests for permission denied, accuracy >50m suppression, nearest-node snap selection, and manual-start fallback; run targeted + full suite.
  - Verify: `npm test -- src/client/pages/StudentApp.gps.test.tsx && npm test`
  - Done when: targeted S27 tests and full regression suite pass.

## Files Likely Touched

- `.gsd/milestones/M001/slices/S27/S27-PLAN.md`
- `src/client/pages/StudentApp.tsx`
- `src/client/components/SelectionMarkerLayer.tsx`
- `src/client/components/SearchOverlay.tsx`
- `src/client/hooks/useRouteSelection.ts`
- `src/client/hooks/useRouteSelection.test.ts`
- `src/client/hooks/useMapViewport.ts`
- `src/client/hooks/useMapViewport.test.ts`
- `src/client/pages/StudentApp.gps.test.tsx`
- `src/client/components/SelectionMarkerLayer.test.tsx`
