---
id: T03
parent: S27
milestone: M001
provides:
  - Nearest-node “Use my location” route-start selection plus explicit, confidence-aware GPS fallback UI state for student routing.
key_files:
  - src/client/gps/studentGpsState.ts
  - src/client/gps/studentGpsState.test.ts
  - src/client/components/FloorPlanCanvas.tsx
  - src/client/components/SearchOverlay.tsx
  - src/client/components/SearchOverlay.gps.test.tsx
  - src/client/hooks/useGeolocation.ts
  - .gsd/milestones/M001/slices/S27/S27-PLAN.md
  - .gsd/KNOWLEDGE.md
key_decisions:
  - Centralized SearchOverlay geolocation readiness/fallback branching in pure `deriveStudentGpsState` so button enablement and fallback copy remain deterministic and testable.
  - Stabilized internally resolved geolocation adapter in `useGeolocation` with `useMemo` to avoid repeated watch-session churn in browser runs.
patterns_established:
  - For hook-driven UI components that are hard to mount in this test setup, use `renderToStaticMarkup` plus explicit text/attribute assertions for deterministic coverage.
observability_surfaces:
  - `studentGpsState` output (`canUseMyLocation`, `fallbackReason`, `fallbackMessage`, `nearestNodeId`)
  - `SearchOverlay` rendered “Use my location” control state (enabled/disabled) and fallback copy
  - Focused suites: `src/client/gps/studentGpsState.test.ts`, `src/client/components/SearchOverlay.gps.test.tsx`
  - Browser assertions against local UI text/control visibility on `http://localhost:5173`
duration: 1h26m
verification_result: passed
completed_at: 2026-03-24T22:59:01Z
blocker_discovered: false
---

# T03: Wire “Use my location” nearest-node start selection with graceful fallback messaging

**Added nearest-node “Use my location” start selection with centralized GPS fallback derivation and SearchOverlay messaging while keeping manual A/B routing controls fully usable.**

## What Happened

I added a new pure derivation module at `src/client/gps/studentGpsState.ts` that maps floor-calibration presence, geolocation status, confidence threshold (50m), and nearest-node availability into deterministic UI state (`canUseMyLocation` + explicit fallback reason/message).

I added `src/client/gps/studentGpsState.test.ts` to lock denied/unsupported/unavailable/low-confidence/no-calibration/no-nearest and ready-to-use behaviors.

I updated `FloorPlanCanvas` to:
- compute nearest walkable node for the active floor using `snapLatLngToNearestWalkableNode`,
- expose `handleUseMyLocation` that calls `routeSelection.setStart(nearestNode)`, and
- pass derived GPS state + callback into `SearchOverlay`.

I updated `SearchOverlay` to render a dedicated “Use my location” action and fallback text while preserving existing manual start/destination controls and swap/clear behaviors.

I added `src/client/components/SearchOverlay.gps.test.tsx` to assert fallback copy, action availability/disabled state, and manual-control continuity.

During browser verification I observed repeated geolocation-watch churn noise, so I made a targeted runtime stabilization in `src/client/hooks/useGeolocation.ts` by memoizing the resolved browser geolocation adapter before effect dependency usage.

### Must-have coverage
- **R014 (snap + setStart):** Implemented in `FloorPlanCanvas` via `nearestGpsNodeMatch` + `handleUseMyLocation -> routeSelection.setStart(...)`.
- **R015 (explicit fallback + manual continuity):** Implemented via `deriveStudentGpsState` + `SearchOverlay` fallback rendering; manual A/B controls remain present and interactive.
- **Regression safety:** Focused suites + full `npm test` pass.

## Verification

Ran required T03 checks, slice-focused GPS checks, full suite, and browser assertions for the user-visible overlay state.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `test -f .gsd/milestones/M001/slices/S27/S27-CHECKPOINT.md` | 0 | ✅ pass | 0.01s |
| 2 | `bash -lc 'hash=$(awk "/^checkpoint_commit:/ { print \$2 }" .gsd/milestones/M001/slices/S27/S27-CHECKPOINT.md); test -n "$hash" && git cat-file -e "${hash}^{commit}"'` | SKIP | ⚠️ skipped (no-git execution constraint) | — |
| 3 | `bash -lc 'hash=$(awk "/^checkpoint_commit:/ { print \$2 }" .gsd/milestones/M001/slices/S27/S27-CHECKPOINT.md); test -n "$hash"'` | 0 | ✅ pass | 0.03s |
| 4 | `npm test -- src/shared/gps.test.ts` | 0 | ✅ pass | 0.17s |
| 5 | `npm test -- src/shared/gps.test.ts -t "hides low-confidence fixes above 50m"` | 0 | ✅ pass | 0.17s |
| 6 | `npm test -- src/shared/gps.test.ts -t "returns null for out-of-bounds coordinates"` | 0 | ✅ pass | 0.16s |
| 7 | `npm test -- src/client/hooks/useGeolocation.test.ts` | 0 | ✅ pass | 0.15s |
| 8 | `npm test -- src/client/hooks/useGeolocation.test.ts -t "maps permission denied geolocation errors to explicit status"` | 0 | ✅ pass | 0.15s |
| 9 | `npm test -- src/client/components/GpsLocationLayer.test.tsx` | 0 | ✅ pass | 0.17s |
| 10 | `npm test -- src/client/gps/studentGpsState.test.ts` | 0 | ✅ pass | 0.18s |
| 11 | `npm test -- src/client/components/SearchOverlay.gps.test.tsx` | 0 | ✅ pass | 0.24s |
| 12 | `npm test -- src/client/hooks/useMapViewport.test.ts` | 0 | ✅ pass | 0.19s |
| 13 | `npm test` | 0 | ✅ pass | 0.78s |
| 14 | `browser_assert(text/selector checks for Use my location + fallback + manual controls)` | 0 | ✅ pass | 0.30s |

## Diagnostics

- Primary runtime inspection surface: `SearchOverlay` row containing `Use my location` button and fallback copy.
- Derived-state inspection surface: `deriveStudentGpsState(...)` output (`fallbackReason`, `canUseMyLocation`, `nearestNodeId`).
- Focused diagnostics:
  - `npm test -- src/client/gps/studentGpsState.test.ts`
  - `npm test -- src/client/components/SearchOverlay.gps.test.tsx`
  - `npm test -- src/client/hooks/useGeolocation.test.ts -t "maps permission denied geolocation errors to explicit status"`
- Browser checks confirmed overlay text + control visibility with mocked map payload and unavailable geolocation fallback.

## Deviations

- Added a small runtime stabilization in `useGeolocation` (memoized adapter resolution) after browser diagnostics showed repeated watch churn/noisy update-depth errors in local dev verification.
- For the checkpoint resolvability command, I did not execute `git cat-file` due the explicit no-git execution constraint in this task prompt; I ran the hash-extraction/non-empty validation variant and recorded the skip.

## Known Issues

- `npm run typecheck` still reports pre-existing unrelated TS errors in admin/shared files (`connectorLinking.ts`, `ManageFloorsModal.tsx`, `MapEditorCanvas.tsx`, and existing strict-null complaints in `src/shared/gps.ts`); this baseline issue predates T03 changes.
- Local browser dev verification with mocked map data still surfaces repeated style HMR and proxy-noise console spam in this environment; explicit overlay assertions still passed.

## Files Created/Modified

- `src/client/gps/studentGpsState.ts` — added pure geolocation-to-overlay state derivation (enablement + explicit fallback reason/message).
- `src/client/gps/studentGpsState.test.ts` — added deterministic derivation coverage for all required fallback/ready states.
- `src/client/components/FloorPlanCanvas.tsx` — wired nearest-node GPS snapping and `onUseMyLocation -> routeSelection.setStart` callback; passed derived GPS UI state into overlay.
- `src/client/components/SearchOverlay.tsx` — added “Use my location” action row and fallback copy rendering while preserving manual controls.
- `src/client/components/SearchOverlay.gps.test.tsx` — added overlay behavior assertions for fallback copy, action availability, and manual continuity.
- `src/client/hooks/useGeolocation.ts` — memoized resolved browser geolocation adapter to stabilize watch effect dependencies.
- `.gsd/milestones/M001/slices/S27/S27-PLAN.md` — marked T03 as complete.
- `.gsd/KNOWLEDGE.md` — recorded geolocation-adapter memoization gotcha for future agents.
- `.gsd/DECISIONS.md` — appended D007 for centralized student GPS UI-state derivation strategy.
