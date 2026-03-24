# S27 Research — Student GPS Dot (Browser geolocation + accuracy ring + nearest-node snap + graceful fallback)

**Researched:** 2026-03-24  
**Scope depth:** Targeted (known stack, moderate client integration across map UI + route selection)  
**Confidence:** High

## Active Requirements This Slice Owns / Supports

- **R011** — Show “you are here” GPS dot when bounds are configured.
- **R012** — Show accuracy ring proportional to reported uncertainty.
- **R013** — Hide GPS dot when accuracy is worse than 50m.
- **R014** — “Use my location” sets route start by nearest walkable node snap.
- **R015** — GPS denied/unsupported/unavailable shows clear fallback messaging; manual start selection still works.
- **R022 (process-governance, supporting)** — checkpoint commit required before research/implementation work (per D006 + override).

## Skills Discovered

- **Already installed and directly relevant (in-session):**
  - `react-best-practices`
  - `test`
- **Skill discovery commands run:**
  - `npx skills find "konva"` → no dedicated Konva skill found.
  - `npx skills find "geolocation"` → found community skills; installed `carlheath/ogmios@geolocation-skill` globally.
- **Registry note:** globally installed geolocation skill is not exposed in this session’s `Skill` registry yet, so guidance below follows in-session skills + existing codebase patterns.

### Skill rules applied to this slice

- From `react-best-practices`:
  - `rerender-derived-state-no-effect`: derive GPS visibility/readiness state from current inputs (position, accuracy, bounds) in render/pure helpers; avoid effect-driven sync state.
  - `js-index-maps`: use precomputed maps for repeated lookups (e.g., node id lookups / floor-level candidate scans).
- From `test`:
  - follow existing Vitest conventions in this repo (pure function tests and lightweight component render tests), avoid introducing new test frameworks.

---

## Summary

S27 is primarily **client-side integration**; S26 already delivered the required server/data foundation:

- `NavFloor.gpsBounds?` is present in shared types.
- `GET /api/map` emits `gpsBounds` only for complete tuples (`serializeFloorGpsBounds`).
- Admin calibration flow is already complete and authoritative.

No new schema migration or server endpoint is required for S27.

What is missing today:

1. No browser geolocation hook/state in student UI.
2. No GPS projection math utility (lat/lng -> normalized -> pixel).
3. No GPS dot + accuracy ring rendering layer.
4. No “Use my location” action wired into `useRouteSelection`.
5. No fallback messaging path for denied/unsupported/low-confidence GPS.
6. Planned verification commands reference test files that do not yet exist.

---

## Implementation Landscape (current code seams)

### 1) `src/client/pages/StudentApp.tsx`
- Thin wrapper only (`return <FloorPlanCanvas />`).
- Not the real orchestration seam; most S27 logic belongs in `FloorPlanCanvas` + hooks/components.

### 2) `src/client/components/FloorPlanCanvas.tsx` (primary seam)
- Owns loaded graph, active floor/building, selected start/destination, route triggering, map layers.
- Has everything needed for S27 integration:
  - `activeFloor` (with optional `gpsBounds`),
  - flattened `nodes`,
  - `imageRect` and `stageScale`,
  - `routeSelection` write APIs.
- Existing behavior to preserve:
  - Route auto-triggers when both start/destination are set.
  - Manual tap/search selection flow.

### 3) `src/client/components/SearchOverlay.tsx` (action UX seam)
- Owns search bars and compact route strip.
- Natural location for a **“Use my location”** trigger and fallback messaging text.
- Already supports manual search and nearest-POI from selected start; must remain fully functional when GPS fails (R015).

### 4) `src/client/components/SelectionMarkerLayer.tsx` (marker rendering seam)
- Currently renders only A/B pins.
- Can be extended, but cleaner seam is to add a dedicated GPS marker layer component to avoid coupling route pins and geolocation rendering behavior.

### 5) `src/client/hooks/useRouteSelection.ts` (route-start state seam)
- `setStart(node)` already exists and auto-focuses destination flow.
- S27 can reuse this directly after nearest-node snap; no hook contract changes are strictly required.

### 6) `src/shared/types.ts` + `src/server/index.ts` + `src/server/floorGpsBounds.ts`
- Already compatible with S27 needs.
- Important guarantee from S26: `gpsBounds` is complete-only when present; S27 should treat missing `gpsBounds` as “GPS projection unavailable for this floor”.

### 7) Test baseline reality
- Present: `useMapViewport.test.ts`, route direction tests, admin GPS tests.
- Missing (but listed in S27 plan verification):
  - `src/client/hooks/useRouteSelection.test.ts`
  - `src/client/components/SelectionMarkerLayer.test.tsx`
  - `src/client/pages/StudentApp.gps.test.tsx`

---

## Recommendation

### Recommended architecture (low-risk, testable)

1. **Add pure GPS math helpers first (new shared module)**
   - Suggested file: `src/shared/gps.ts`
   - Suggested helpers:
     - `gpsToNormalized(bounds, lat, lng)` with Y inversion,
     - `isNormalizedInBounds(norm)` (or tolerance-aware variant),
     - `accuracyMetersToPixelRadius(bounds, imageRect, lat, accuracyMeters)`,
     - `findNearestNodeByProjectedDistance(...)` (or client-local equivalent).

2. **Add runtime geolocation hook (new client hook)**
   - Suggested file: `src/client/hooks/useGeolocation.ts`
   - Wrap `navigator.geolocation.watchPosition` with explicit start/stop lifecycle.
   - Do **not** rely on `navigator.permissions.query` for iOS correctness; rely on callback success/error.

3. **Integrate in `FloorPlanCanvas`**
   - Derive GPS render state from: `activeFloor.gpsBounds`, latest geolocation fix, accuracy threshold constant.
   - Render GPS dot + accuracy ring via a dedicated layer.
   - Implement “Use my location” -> nearest node on active floor -> `routeSelection.setStart(...)`.

4. **Wire user-facing fallback messaging in `SearchOverlay` (or equivalent overlay)**
   - Clear messages for unsupported/denied/no-calibration/low-confidence.
   - Never block manual search/tap flow.

### Constants to make explicit (field-tunable)

- `GPS_HIDE_ACCURACY_METERS = 50` (R013 hard requirement).
- `GPS_STALE_FIX_MS` (recommended, e.g., 15_000).
- `GPS_MAX_SNAP_DISTANCE_METERS` (recommended guard for R014 quality, e.g., 30m).

---

## Natural Work Seams (planner task splits)

1. **Process gate (R022)**
   - Capture checkpoint commit evidence before implementation/research continuation (`git log -1 --oneline`).

2. **Pure math + snap helpers (high-risk correctness, easiest to test first)**
   - Projection math (axis inversion), accuracy radius conversion, nearest-node distance metric.

3. **Geolocation runtime hook**
   - start/stop watch lifecycle, error code handling, stale fix handling.

4. **UI integration**
   - GPS layer rendering in canvas,
   - “Use my location” action,
   - fallback messaging while preserving manual flow.

5. **Regression + UAT evidence**
   - targeted unit tests + full suite,
   - mobile permission-path sanity check.

---

## Build / Proof Order

1. **T01 (mandatory):** checkpoint commit evidence for R022/D006.
2. **T02:** implement + test pure projection/snap helpers before UI wiring.
3. **T03:** integrate geolocation runtime hook and visibility gates (`accuracy <= 50m`, bounds configured).
4. **T04:** wire “Use my location” nearest-node snap into route start + fallback messaging.
5. **T05:** run targeted tests + full suite + capture UAT notes.

---

## Verification Plan

### Process governance
- `git log -1 --oneline` (must show checkpoint-first evidence for S27 flow).

### Targeted automated
- `npm test -- src/client/hooks/useMapViewport.test.ts` (regression guard from S23).
- `npm test -- src/client/hooks/useRouteSelection.test.ts` *(new for S27, currently missing)*
- `npm test -- src/client/components/SelectionMarkerLayer.test.tsx` *(new for S27, currently missing)*
- `npm test -- src/client/pages/StudentApp.gps.test.tsx` *(or equivalent GPS helper test file; currently missing)*
- `npm test`

### Manual/UAT (required by slice proof level)
1. On calibrated floor: allow geolocation -> dot visible and ring visible.
2. Simulate low confidence (`accuracy > 50m`) -> dot hidden + clear fallback text.
3. Deny permission -> clear fallback text + manual start/destination search remains usable.
4. Tap “Use my location” with valid fix -> start pin set to nearest walkable node and routing still works.

---

## Risks / Fragile Points

- **Axis inversion bug risk (critical):** wrong Y formula mirrors dot vertically.
  - Must use `normY = 1 - (lat - minLat)/(maxLat - minLat)`.
- **Nearest-node distance distortion:** normalized-space nearest can bias wide maps.
  - Use pixel-space or aspect-corrected distance.
- **iOS geolocation behavior divergence:** permission query APIs are unreliable.
  - Handle runtime error callbacks directly.
- **Accuracy ring UX drift:** constant-screen ring can violate “proportional uncertainty” intent.
  - Base ring radius on meters->pixels conversion.
- **R015 regression risk:** GPS failure states must not lock or replace manual start selection controls.

---

## Planner-ready file shortlist

- `src/client/components/FloorPlanCanvas.tsx` (primary integration)
- `src/client/components/SearchOverlay.tsx` (user action + fallback messaging)
- `src/client/components/SelectionMarkerLayer.tsx` **or** new GPS marker layer file
- `src/client/hooks/useRouteSelection.ts` (likely reuse only; maybe no change)
- `src/client/hooks/useGeolocation.ts` *(new)*
- `src/shared/gps.ts` *(new, recommended)*
- `src/client/hooks/useRouteSelection.test.ts` *(new)*
- `src/client/components/SelectionMarkerLayer.test.tsx` *(new)*
- `src/client/pages/StudentApp.gps.test.tsx` *(new or equivalent targeted GPS test file)*

---

## Forward Intelligence for S27 Executors

- Treat `activeFloor.gpsBounds` as authoritative when present and **do not** attempt to repair malformed tuples client-side.
- Keep all geolocation data ephemeral in client state; do not persist/log raw lat/lng (slice observability redaction constraint).
- Preserve existing route-selection contract: setting start from GPS should flow through existing `routeSelection` APIs so route trigger behavior remains unchanged.
- The current S27 plan’s verification list names test files that do not exist yet; create them or adjust verification commands in the implementation plan before execution.
