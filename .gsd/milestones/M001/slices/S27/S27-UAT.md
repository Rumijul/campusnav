# S27: Student GPS Dot — Browser Geolocation Powered "you are here" dot with accuracy ring, nearest Node snap, and graceful fallback — UAT

**Milestone:** M001  
**Slice:** S27  
**Written:** 2026-03-25

## UAT Type

- UAT mode: artifact-driven integration verification
- Why this is sufficient: S27 proof level is integration (`real runtime: no`, `human/UAT: no`) and has explicit unit/integration diagnostics for geolocation runtime state, projection/snap math, marker rendering, and fallback UX continuity.

## Preconditions

1. Working directory is project root (`C:\Users\admin\Desktop\projects\campusnav`).
2. Dependencies are installed (`node_modules` present).
3. Required S27 artifacts exist:
   - `.gsd/milestones/M001/slices/S27/S27-CHECKPOINT.md`
   - `src/shared/gps.ts`
   - `src/client/hooks/useGeolocation.ts`
   - `src/client/components/GpsLocationLayer.tsx`
   - `src/client/gps/studentGpsState.ts`
   - `src/client/components/SearchOverlay.tsx`
4. Vitest is runnable via `npm test`.

## Smoke Test

1. Run:
   - `npm test -- src/shared/gps.test.ts src/client/hooks/useGeolocation.test.ts src/client/components/GpsLocationLayer.test.tsx src/client/gps/studentGpsState.test.ts src/client/components/SearchOverlay.gps.test.tsx`
2. **Expected:** All suites pass, proving geolocation math, runtime status mapping, marker/ring rendering, fallback derivation, and overlay UX integration are coherent.

## Test Cases

### 1) Checkpoint governance evidence exists and resolves

1. Run: `test -f .gsd/milestones/M001/slices/S27/S27-CHECKPOINT.md`
2. Run: `bash -lc 'hash=$(awk "/^checkpoint_commit:/ { print \$2 }" .gsd/milestones/M001/slices/S27/S27-CHECKPOINT.md); test -n "$hash" && git cat-file -e "${hash}^{commit}"'`
3. **Expected:**
   - Checkpoint file exists.
   - Commit hash field is non-empty and resolves to a real commit object.

### 2) GPS projection respects calibrated bounds and lat-axis inversion

1. Run: `npm test -- src/shared/gps.test.ts`
2. Verify assertions include:
   - corner projection (`maxLat/minLng -> {x:0,y:0}`, `minLat/maxLng -> {x:1,y:1}`),
   - midpoint projection (`0.5,0.5`),
   - out-of-bounds returns `null`.
3. **Expected:** Projection logic is deterministic and rejects out-of-bounds coordinates.

### 3) Confidence gate suppresses low-quality fixes (>50m)

1. Run: `npm test -- src/shared/gps.test.ts -t "hides low-confidence fixes above 50m"`
2. **Expected:**
   - Accuracy `<=50` is accepted.
   - Accuracy `>50` is rejected.

### 4) Accuracy ring scales with uncertainty

1. Run: `npm test -- src/shared/gps.test.ts`
2. Inspect `accuracyMetersToMapPixelRadius` assertions.
3. **Expected:** Radius increases linearly with accuracy (e.g., 20m approx 2× 10m for fixed map size); invalid dimensions/bounds return 0.

### 5) Geolocation runtime statuses map correctly

1. Run: `npm test -- src/client/hooks/useGeolocation.test.ts`
2. Run: `npm test -- src/client/hooks/useGeolocation.test.ts -t "maps permission denied geolocation errors to explicit status"`
3. **Expected:**
   - Missing API -> `unsupported`.
   - First emission -> `watching`.
   - Success -> `ready` with fix payload.
   - Error code `1` -> `permission-denied`.
   - Other errors -> `unavailable`.
   - `clearWatch` executes exactly once on teardown.

### 6) GPS layer renders dot/ring only when visible and meaningful

1. Run: `npm test -- src/client/components/GpsLocationLayer.test.tsx`
2. **Expected:**
   - `visible=false` returns `null`.
   - `visible=true` + positive radius renders ring + center dot.
   - zero radius renders center dot only.

### 7) “Use my location” fallback state derivation is explicit and complete

1. Run: `npm test -- src/client/gps/studentGpsState.test.ts`
2. **Expected:**
   - Explicit fallback reasons/messages are produced for:
     - floor-not-calibrated,
     - geolocation-unsupported,
     - permission-denied,
     - position-unavailable,
     - low-confidence,
     - no-nearest-node.
   - Ready/confident + nearest node produces `canUseMyLocation=true` and null fallback.

### 8) Search overlay keeps manual routing controls available under fallback

1. Run: `npm test -- src/client/components/SearchOverlay.gps.test.tsx`
2. **Expected:**
   - Permission-denied path shows explicit fallback text and disabled `Use my location` action.
   - Ready path enables `Use my location`.
   - Manual controls remain visible (`Search start location...`, `Search destination...`, swap action) even when fallback message is shown.

### 9) Nearest-node route-start wiring is present in integration path

1. Run:
   - `rg -n "snapLatLngToNearestWalkableNode|handleUseMyLocation|routeSelection.setStart" src/client/components/FloorPlanCanvas.tsx`
   - `rg -n "Use my location|onUseMyLocation" src/client/components/SearchOverlay.tsx`
2. **Expected:**
   - Canvas computes nearest walkable-node snap from geolocation fix.
   - `handleUseMyLocation` routes through `routeSelection.setStart(nearestNode)`.
   - Overlay button dispatches `onUseMyLocation` and is gated by derived GPS readiness state.

### 10) Regression safety across related viewport + full app tests

1. Run: `npm test -- src/client/hooks/useMapViewport.test.ts`
2. Run: `npm test`
3. **Expected:**
   - Viewport interaction tests still pass.
   - Full suite passes with no regressions.

## Edge Cases

### Edge Case A — Unsupported geolocation API

1. Validate with `useGeolocation.test.ts` unsupported scenario.
2. **Expected:** status is `unsupported`; SearchOverlay fallback instructs manual start selection.

### Edge Case B — Permission denied by browser

1. Validate with filtered hook test + SearchOverlay GPS test.
2. **Expected:** explicit permission-denied fallback copy, `Use my location` disabled.

### Edge Case C — Accuracy above threshold

1. Validate with:
   - `npm test -- src/shared/gps.test.ts -t "hides low-confidence fixes above 50m"`
   - `npm test -- src/client/gps/studentGpsState.test.ts`
2. **Expected:** marker hidden and fallback text instructs manual selection.

### Edge Case D — GPS coordinate outside floor bounds

1. Validate with:
   - `npm test -- src/shared/gps.test.ts -t "returns null for out-of-bounds coordinates"`
2. **Expected:** projection returns `null`; no marker or nearest-node selection is produced.

### Edge Case E — No nearest walkable node candidate

1. Validate with `studentGpsState.test.ts` no-nearest scenario.
2. **Expected:** explicit `no-nearest-node` fallback and disabled `Use my location` action.

## Failure Signals

- Checkpoint artifact missing or hash is not resolvable.
- Any S27 verification suite fails.
- Overlay hides manual start/destination controls while fallback state is active.
- Low-confidence fixes still render marker/ring or allow use-location action.
- Full suite regression (`npm test`) after S27 integration.

## Not Proven By This UAT

- Real-device geolocation hardware behavior across browsers (not required by slice proof level).
- Indoor high-confidence live tracking (explicitly out of scope).
- Automatic floor inference from device sensors (deferred requirement area).

## Tester Notes

- Keep this slice verified primarily via deterministic Vitest suites in this worktree environment.
- If optional manual runtime checks are done outside this harness, confirm the same states visually:
  - confident fix -> dot/ring + enabled `Use my location`,
  - denied/unsupported/unavailable/low-confidence -> explicit fallback + manual controls still usable.
