---
estimated_steps: 5
estimated_files: 5
skills_used:
  - react-best-practices
  - test
---

# T02: Add geolocation runtime hook and render GPS dot + accuracy ring in FloorPlanCanvas

**Slice:** S27 — Student GPS Dot — Browser Geolocation Powered "you are here" dot with accuracy ring, nearest Node snap, and graceful fallback
**Milestone:** M001

## Description

Introduce runtime geolocation state handling and GPS marker rendering in the student map. This task wires browser watch-position updates into canvas rendering while enforcing the ≤50m visibility threshold.

## Steps

1. Implement `src/client/hooks/useGeolocation.ts` to wrap `navigator.geolocation.watchPosition` with explicit statuses (`unsupported`, `watching`, `ready`, `permission-denied`, `unavailable`), latest fix data, and cleanup via `clearWatch`.
2. Add `src/client/hooks/useGeolocation.test.ts` covering unsupported browsers, success callback updates, denied/unavailable error mapping, and watcher teardown.
3. Add `src/client/components/GpsLocationLayer.tsx` as a dedicated Konva layer rendering the GPS center dot and proportional accuracy ring based on computed pixel radius.
4. Add `src/client/components/GpsLocationLayer.test.tsx` to assert marker/ring rendering behavior (visible vs hidden paths) using deterministic props.
5. Integrate `useGeolocation` + `src/shared/gps.ts` helpers in `src/client/components/FloorPlanCanvas.tsx` so marker rendering only occurs when active floor has calibrated bounds and reported accuracy is ≤50m.

## Must-Haves

- [ ] Geolocation watcher lifecycle is explicit and leak-free (subscribe on enable, clear on cleanup/unmount).
- [ ] GPS dot/ring rendering is driven by helper-derived state and never shown when accuracy exceeds 50m.
- [ ] Runtime wiring keeps raw lat/lng ephemeral in client state and does not persist/log coordinates.

## Verification

- `npm test -- src/client/hooks/useGeolocation.test.ts`
- `npm test -- src/client/components/GpsLocationLayer.test.tsx`

## Observability Impact

- Signals added/changed: geolocation status enum, latest accuracy meters, and marker-visibility boolean derived from calibrated bounds + threshold.
- How a future agent inspects this: run focused hook/layer Vitest suites and inspect student UI state for marker/ring presence when injecting fixture props.
- Failure state exposed: denied/unsupported/unavailable geolocation states remain explicit rather than silently failing to render.

## Inputs

- `src/shared/gps.ts` — helper contracts from T01 used for projection and radius math.
- `src/client/components/FloorPlanCanvas.tsx` — student canvas orchestration where marker layer is composed.
- `src/client/components/SelectionMarkerLayer.tsx` — existing map marker layering pattern to align z-order and scale behavior.
- `src/shared/types.ts` — floor bounds and node typing for integration contracts.
- `src/client/hooks/useMapViewport.ts` — existing stage/image coordinate context consumed by map layers.

## Expected Output

- `src/client/hooks/useGeolocation.ts` — runtime geolocation watcher hook.
- `src/client/hooks/useGeolocation.test.ts` — watcher lifecycle and error-state tests.
- `src/client/components/GpsLocationLayer.tsx` — dedicated GPS marker + accuracy ring layer.
- `src/client/components/GpsLocationLayer.test.tsx` — rendering tests for visibility and sizing behavior.
- `src/client/components/FloorPlanCanvas.tsx` — integrated geolocation-derived marker rendering logic.
