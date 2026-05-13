---
id: S27
parent: M001
milestone: M001
provides:
  - Student geolocation runtime integration in map view (`useGeolocation` + `FloorPlanCanvas`) with calibrated-floor projection, confidence gating (<=50m), and dedicated GPS marker/ring rendering.
  - Route-start assist from current position via nearest walkable-node snap (`snapLatLngToNearestWalkableNode`) wired to existing `routeSelection.setStart` flow through `SearchOverlay`.
  - Deterministic fallback UX for unsupported/denied/unavailable/low-confidence/no-nearest states using pure `deriveStudentGpsState`, while manual A/B selection remains intact.
  - Checkpoint-governance proof artifact (`S27-CHECKPOINT.md`) validated by resolvable commit-hash check.
requires:
  - slice: S26
    provides: Complete-only per-floor/campus `gpsBounds` contract in `/api/map` and admin calibration workflow.
affects:
  - milestone: M001
    change: Final active v1.6 slice completed; roadmap now has no remaining unchecked slices.
key_files:
  - .gsd/milestones/M001/slices/S27/S27-CHECKPOINT.md
  - src/shared/gps.ts
  - src/shared/gps.test.ts
  - src/client/hooks/useGeolocation.ts
  - src/client/hooks/useGeolocation.test.ts
  - src/client/components/GpsLocationLayer.tsx
  - src/client/components/GpsLocationLayer.test.tsx
  - src/client/gps/studentGpsState.ts
  - src/client/gps/studentGpsState.test.ts
  - src/client/components/FloorPlanCanvas.tsx
  - src/client/components/SearchOverlay.tsx
  - src/client/components/SearchOverlay.gps.test.tsx
  - .gsd/REQUIREMENTS.md
  - .gsd/DECISIONS.md
  - .gsd/KNOWLEDGE.md
  - .gsd/milestones/M001/M001-ROADMAP.md
  - .gsd/PROJECT.md
key_decisions:
  - D006: enforce checkpoint-before-research sequencing for active slices.
  - D007: centralize "Use my location" readiness + fallback derivation in pure `deriveStudentGpsState`.
  - D008: centralize geolocation watch lifecycle in pure `startGeolocationWatch`; gate marker rendering by calibrated bounds + confidence.
patterns_established:
  - Keep geolocation policy split by responsibility: pure shared GPS math (`src/shared/gps.ts`), runtime watch lifecycle (`useGeolocation`), and UI-state derivation (`studentGpsState`) to maximize testability.
  - For Konva overlay testing, assert React element props directly (ring/dot geometry/visibility) rather than DOM-level canvas inspection.
  - For hook-heavy overlay UI, `renderToStaticMarkup` + explicit text/attribute assertions gives stable fallback/disabled-state coverage.
observability_surfaces:
  - Geolocation runtime snapshots: `status`, latest `fix`, `accuracyMeters` (`src/client/hooks/useGeolocation.ts`).
  - Marker visibility diagnostics: confidence gate + projection validity in `FloorPlanCanvas` (`gpsLayerState.visible`).
  - Fallback/action diagnostics: `deriveStudentGpsState` outputs (`canUseMyLocation`, `fallbackReason`, `fallbackMessage`, `nearestNodeId`).
  - UI surface: SearchOverlay "Use my location" button enabled/disabled state and fallback copy.
  - Test surfaces: `src/shared/gps.test.ts`, `src/client/hooks/useGeolocation.test.ts`, `src/client/components/GpsLocationLayer.test.tsx`, `src/client/gps/studentGpsState.test.ts`, `src/client/components/SearchOverlay.gps.test.tsx`.
drill_down_paths:
  - .gsd/milestones/M001/slices/S27/tasks/T01-SUMMARY.md
  - .gsd/milestones/M001/slices/S27/tasks/T02-SUMMARY.md
  - .gsd/milestones/M001/slices/S27/tasks/T03-SUMMARY.md
duration: ~2h37m task execution + slice closure verification
verification_result: passed
completed_at: 2026-03-25
---

# S27: Student GPS Dot — Browser Geolocation Powered "you are here" dot with accuracy ring, nearest Node snap, and graceful fallback

**Delivered full student-side geolocation assist for CampusNav v1.6: confidence-aware map marker, nearest-node route-start action, and explicit fallback UX that preserves manual routing.**

## What This Slice Actually Delivered

### T01 — Checkpoint evidence + shared GPS foundation
- Confirmed and preserved checkpoint artifact (`S27-CHECKPOINT.md`) with commit hash + timestamp.
- Validated shared deterministic helpers in `src/shared/gps.ts`:
  - bounds calibration + in-bounds checks,
  - lat/lng → normalized map projection with Y-axis inversion,
  - confidence gate (`<=50m`),
  - accuracy-to-pixel ring radius scaling,
  - nearest walkable-node snap constrained by graph connectivity.
- Locked failure-path behavior (out-of-bounds, low-confidence) via focused tests.

### T02 — Runtime geolocation + marker/ring rendering
- Implemented browser geolocation watch lifecycle with explicit statuses:
  - `unsupported`, `watching`, `ready`, `permission-denied`, `unavailable`.
- Centralized subscribe/error/teardown in pure `startGeolocationWatch` for deterministic testing.
- Added `GpsLocationLayer` for non-interactive Konva rendering of:
  - center dot,
  - proportional accuracy ring.
- Wired `FloorPlanCanvas` to only enable geolocation + render marker when:
  - active floor has calibrated `gpsBounds`,
  - fix is projected in-bounds,
  - accuracy is confident (`<=50m`).

### T03 — “Use my location” + graceful fallback UX
- Added pure `deriveStudentGpsState` to map runtime conditions into deterministic UI state.
- Added explicit fallback reasons/messages for:
  - floor not calibrated,
  - geolocation unsupported,
  - permission denied,
  - position unavailable,
  - still locating,
  - low-confidence fix,
  - no nearest walkable node.
- Wired `SearchOverlay` “Use my location” action to `FloorPlanCanvas` handler that sets start via `routeSelection.setStart(nearestNode)`.
- Preserved manual start/destination search and swap/clear controls in all fallback states.
- Stabilized geolocation adapter dependency with memoization in `useGeolocation` to avoid watch restart churn.

## Verification (Slice-Level Matrix)

All S27 plan verification commands were re-run during closure and passed:

1. `test -f .gsd/milestones/M001/slices/S27/S27-CHECKPOINT.md` ✅
2. `bash -lc 'hash=$(awk "/^checkpoint_commit:/ { print \$2 }" .gsd/milestones/M001/slices/S27/S27-CHECKPOINT.md); test -n "$hash" && git cat-file -e "${hash}^{commit}"'` ✅
3. `npm test -- src/shared/gps.test.ts` ✅
4. `npm test -- src/shared/gps.test.ts -t "hides low-confidence fixes above 50m"` ✅
5. `npm test -- src/shared/gps.test.ts -t "returns null for out-of-bounds coordinates"` ✅
6. `npm test -- src/client/hooks/useGeolocation.test.ts` ✅
7. `npm test -- src/client/hooks/useGeolocation.test.ts -t "maps permission denied geolocation errors to explicit status"` ✅
8. `npm test -- src/client/components/GpsLocationLayer.test.tsx` ✅
9. `npm test -- src/client/gps/studentGpsState.test.ts` ✅
10. `npm test -- src/client/components/SearchOverlay.gps.test.tsx` ✅
11. `npm test -- src/client/hooks/useMapViewport.test.ts` ✅
12. `npm test` ✅ (17 files, 144 tests passed)

## Observability / Diagnostics Confirmation

The slice observability contract is present and test-backed:

- **Runtime signals available:** geolocation status + latest accuracy snapshot (`useGeolocation`).
- **Marker visibility diagnostics:** marker/ring hidden on low-confidence or invalid projection paths (`FloorPlanCanvas` + `GpsLocationLayer`).
- **Fallback diagnostics:** explicit `fallbackReason` + `fallbackMessage` via `deriveStudentGpsState`.
- **User-facing inspection surfaces:**
  - SearchOverlay “Use my location” enabled/disabled state.
  - Clear fallback copy while manual controls remain visible.
- **Redaction behavior upheld:** no geolocation raw lat/lng persistence to server/DB/log surfaces was introduced; geolocation data is consumed client-side for projection/snap only.

## Requirements + State Updates Completed

- Updated `.gsd/REQUIREMENTS.md`:
  - **R011, R012, R013, R014, R015, R022** moved from **active → validated** with S27 evidence.
- Updated `.gsd/milestones/M001/M001-ROADMAP.md`:
  - **S27 marked complete**.
- Updated `.gsd/PROJECT.md`:
  - Active milestone checklist now reflects student geolocation assist as complete.
  - GPS constraint wording updated from “No GPS” to optional confidence-gated GPS assist with manual fallback.

## Decisions + Knowledge Captured

- Added **D008** to `.gsd/DECISIONS.md` (geolocation lifecycle + rendering-gate architecture).
- Confirmed **D007** remains the governing decision for UI fallback derivation.
- Added S27 testing patterns to `.gsd/KNOWLEDGE.md`:
  - Konva prop-level overlay assertions.
  - `renderToStaticMarkup` pattern for hook-heavy overlay fallback verification.

## Known Limitations (Intentional)

- This slice provides browser geolocation assist, not high-confidence continuous indoor tracking.
- If a floor lacks calibration, permission is denied, or confidence is poor, the app intentionally falls back to manual start selection.

## Forward Notes for Future Slices

- Reuse `deriveStudentGpsState` for any future GPS-related UI elements to avoid branching drift.
- Keep confidence threshold policy centralized in shared GPS helpers (`isGpsFixConfident`) when extending behavior.
- Preserve complete-only `gpsBounds` contract assumptions from S26; do not introduce partial bound projection paths.
