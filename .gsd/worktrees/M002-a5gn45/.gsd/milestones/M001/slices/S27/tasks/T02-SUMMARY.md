---
id: T02
parent: S27
milestone: M001
provides:
  - Runtime geolocation watch-state handling plus confidence-gated GPS marker rendering in the student floor canvas.
key_files:
  - src/client/hooks/useGeolocation.ts
  - src/client/hooks/useGeolocation.test.ts
  - src/client/components/GpsLocationLayer.tsx
  - src/client/components/GpsLocationLayer.test.tsx
  - src/client/components/FloorPlanCanvas.tsx
  - .gsd/milestones/M001/slices/S27/S27-PLAN.md
  - .gsd/KNOWLEDGE.md
key_decisions:
  - Geolocation lifecycle logic is centralized in a pure `startGeolocationWatch` helper that the hook wraps, so subscribe/cleanup and error mapping are deterministic and testable without a DOM harness.
  - `FloorPlanCanvas` enables geolocation only on floors with calibrated GPS bounds and derives marker visibility via shared helpers (`isGpsFixConfident`, `projectLatLngToNormalizedPoint`, `accuracyMetersToMapPixelRadius`) to enforce the ≤50m confidence gate.
patterns_established:
  - For Konva overlay tests in this codebase, inspect returned React element props (ring/dot visibility and sizing) rather than relying on DOM rendering.
observability_surfaces:
  - src/client/hooks/useGeolocation.ts (status enum + latest accuracy snapshot)
  - src/client/hooks/useGeolocation.test.ts (permission-denied/unavailable mapping and watcher teardown)
  - src/client/components/GpsLocationLayer.test.tsx (marker/ring visible vs hidden paths)
  - npm test -- src/client/hooks/useGeolocation.test.ts -t "maps permission denied geolocation errors to explicit status"
duration: 0h43m
verification_result: passed
completed_at: 2026-03-24T22:46:58Z
blocker_discovered: false
---

# T02: Add geolocation runtime hook and render GPS dot + accuracy ring in FloorPlanCanvas

**Added browser geolocation watch-state handling and a confidence-gated GPS dot/ring layer in `FloorPlanCanvas`, backed by focused hook/layer diagnostics.**

## What Happened

I first completed the pre-flight observability requirement by adding an explicit failure-path verification command for permission-denied geolocation status in `S27-PLAN.md`.

I then implemented `useGeolocation` with explicit statuses (`unsupported`, `watching`, `ready`, `permission-denied`, `unavailable`), latest fix/accuracy state, and leak-free teardown via `clearWatch`.

To keep lifecycle behavior testable and deterministic, I introduced `startGeolocationWatch` as a pure adapter-driven helper and covered unsupported, success, denied/unavailable mapping, and idempotent watcher teardown in `useGeolocation.test.ts`.

Next, I added `GpsLocationLayer` as a dedicated non-interactive Konva layer that renders a center dot and proportional accuracy ring, with explicit hidden-path behavior when marker visibility is off or radius is zero.

Finally, I integrated geolocation into `FloorPlanCanvas`: geolocation is enabled only when the active floor has calibrated `gpsBounds`, and marker/ring visibility is derived through shared GPS helpers so low-confidence (>50m) or out-of-bounds fixes never render.

During slice verification I found a quoting bug in the checkpoint command (`awk ... { print $2 }` inside a quoted shell string). I corrected it to `print \$2` in `S27-PLAN.md` and re-ran verification.

## Verification

I ran the T02 focused suites and the full S27 verification matrix.

T02 task checks passed:
- `npm test -- src/client/hooks/useGeolocation.test.ts`
- `npm test -- src/client/components/GpsLocationLayer.test.tsx`

Slice-level matrix results were mostly green, with expected intermediate-task failures for not-yet-created T03 suites (`studentGpsState` and `SearchOverlay.gps`).

For UI/runtime sanity, I also launched the Vite client (`http://127.0.0.1:4173`) and validated via browser assertions that manual search controls remain visible even when map API calls fail locally (client-only run).

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `test -f .gsd/milestones/M001/slices/S27/S27-CHECKPOINT.md` | 0 | ✅ pass | 0.02s |
| 2 | `bash -lc 'hash=$(awk "/^checkpoint_commit:/ { print \$2 }" .gsd/milestones/M001/slices/S27/S27-CHECKPOINT.md); test -n "$hash" && git cat-file -e "${hash}^{commit}"'` | 0 | ✅ pass | 0.04s |
| 3 | `npm test -- src/shared/gps.test.ts` | 0 | ✅ pass | 0.69s |
| 4 | `npm test -- src/shared/gps.test.ts -t "hides low-confidence fixes above 50m"` | 0 | ✅ pass | 0.69s |
| 5 | `npm test -- src/shared/gps.test.ts -t "returns null for out-of-bounds coordinates"` | 0 | ✅ pass | 0.70s |
| 6 | `npm test -- src/client/hooks/useGeolocation.test.ts` | 0 | ✅ pass | 0.68s |
| 7 | `npm test -- src/client/hooks/useGeolocation.test.ts -t "maps permission denied geolocation errors to explicit status"` | 0 | ✅ pass | 0.68s |
| 8 | `npm test -- src/client/components/GpsLocationLayer.test.tsx` | 0 | ✅ pass | 0.73s |
| 9 | `npm test -- src/client/gps/studentGpsState.test.ts` | 1 | ❌ fail | 0.50s |
| 10 | `npm test -- src/client/components/SearchOverlay.gps.test.tsx` | 1 | ❌ fail | 0.51s |
| 11 | `npm test -- src/client/hooks/useMapViewport.test.ts` | 0 | ✅ pass | 0.73s |
| 12 | `npm test` | 0 | ✅ pass | 1.16s |

## Diagnostics

- Hook/runtime signal surface: `useGeolocation` snapshot (`status`, `fix`, `accuracyMeters`).
- Rendering signal surface: `gpsLayerState.visible` in `FloorPlanCanvas`, derived from calibrated bounds + helper confidence gate + projection validity.
- Focused failure-path diagnostics:
  - `npm test -- src/client/hooks/useGeolocation.test.ts -t "maps permission denied geolocation errors to explicit status"`
  - `npm test -- src/shared/gps.test.ts -t "hides low-confidence fixes above 50m"`
  - `npm test -- src/shared/gps.test.ts -t "returns null for out-of-bounds coordinates"`
- Browser inspection surface (local client run): manual search controls remained visible while map API requests failed, supporting graceful fallback visibility behavior.

## Deviations

- I corrected a pre-existing quoting bug in the slice checkpoint verification command (`$2` → `\$2` in `awk`) so the checkpoint-hash check evaluates correctly.

## Known Issues

- `src/client/gps/studentGpsState.test.ts` and `src/client/components/SearchOverlay.gps.test.tsx` are still missing and fail in the slice matrix; this is expected until T03.
- In a client-only browser run (without backend API service), `/api/map` and floor-plan endpoints returned 500/aborted responses; this did not block T02’s hook/layer verification.

## Files Created/Modified

- `src/client/hooks/useGeolocation.ts` — added geolocation watch hook + pure lifecycle helper with explicit status/error mapping.
- `src/client/hooks/useGeolocation.test.ts` — added deterministic watcher lifecycle/error-path tests.
- `src/client/components/GpsLocationLayer.tsx` — added dedicated Konva GPS dot + accuracy-ring layer.
- `src/client/components/GpsLocationLayer.test.tsx` — added marker/ring rendering-path tests.
- `src/client/components/FloorPlanCanvas.tsx` — integrated geolocation-derived marker gating via shared GPS helpers.
- `.gsd/milestones/M001/slices/S27/S27-PLAN.md` — added explicit failure-path verification command, fixed checkpoint awk escaping, and marked T02 complete.
- `.gsd/KNOWLEDGE.md` — added shell quoting gotcha for `awk` field extraction in quoted verification commands.
- `.gsd/milestones/M001/slices/S27/tasks/T02-SUMMARY.md` — recorded T02 execution, evidence, and diagnostics.
