# Project Research Summary

**Project:** CampusNav v1.6 — GPS Integration & UX Refinements
**Domain:** Campus indoor wayfinding web app — additive GPS and gesture polish milestone
**Researched:** 2026-03-09
**Confidence:** HIGH

## Executive Summary

CampusNav v1.6 is an additive improvement milestone on top of a fully shipped v1.5 system that already provides multi-floor A* routing, Konva.js canvas with touch gestures, per-floor route visualization, and a complete admin node/edge editor. The five new features — GPS "you are here" dot, admin GPS bounds configuration, pinch-zoom/rotation focal point fixes, multi-floor directions floor dividers, and admin floor-connector visual linking — are all achievable using the existing stack with zero new npm dependencies. The browser Geolocation API, pure math utilities (~35 lines total), Drizzle ORM nullable columns, and React state additions are sufficient for every feature.

The recommended build order is driven by one strict dependency chain: GPS bounds configuration (admin schema and endpoint) must ship before the student-facing GPS dot can function. The other three features — gesture fix, directions dividers, and connector linking UI — are fully independent of GPS and of each other, and can be parallelized. The most architecturally complex feature is GPS end-to-end because it touches schema, API, admin UI, and student UI in sequence; all other features are localized to one to three files each.

The primary risks in this milestone are behavioral rather than architectural. GPS coordinate axis inversion is a silent correctness bug that only manifests on a real device outdoors. The pinch-zoom focal point calculation silently breaks after any stage rotation due to missing inverse transform math. Admin floor-connector linking must write both nodes atomically or it creates one-sided links that produce asymmetric routing. All three risks have clear prevention strategies identified in research — they require deliberate attention during implementation, not architectural changes.

---

## Key Findings

### Recommended Stack

The v1.5 stack is entirely unchanged for v1.6. All five features are delivered using existing packages: the Browser Geolocation API (native, no npm install), pure TypeScript math utilities, Drizzle ORM nullable `real` columns, and existing Konva.js APIs already present in v10.2.0. No coordinate projection library (proj4, Turf.js), gesture library (Hammer.js, @use-gesture/react), or geospatial utility library (geolib) is needed or appropriate.

**Core technologies (unchanged from v1.5):**
- `navigator.geolocation` (browser native): GPS position and accuracy — zero library cost, HTTPS-only (already deployed on Render)
- Drizzle ORM + postgres-js: 4 nullable real columns on the `floors` table — safe ADD COLUMN migration with no data loss
- Konva + react-konva 10.2.0: all required APIs present (`getAbsoluteTransform`, `Transform.invert`, `Transform.point`); no upgrade needed
- React + TypeScript: all new hooks and components follow existing patterns in the codebase
- Zod: GPS bounds validation with cross-field `refine` checks (latMin < latMax, lngMin < lngMax)

**Explicitly excluded packages:** leaflet/mapbox-gl (overengineered for a GPS dot on a static image), proj4/Turf.js (linear interpolation is accurate at campus scale), Hammer.js/@use-gesture/react (conflict with Konva's touch event pipeline), react-use-geolocation (adds no value over a 20-line hook), rbush/kdbush (O(n) scan is faster than index overhead for fewer than 500 nodes per floor), any Konva upgrade (10.2.0 already has all needed APIs).

See [STACK.md](./STACK.md) for full capability-to-solution table and rationale.

### Expected Features

**Must have (table stakes):**
- GPS "you are here" dot visible on campus outdoor map — users trained by Google Maps and MazeMap to expect a real-time location indicator
- GPS dot hides gracefully when accuracy exceeds 50m — indoor GPS is typically 20–50m; a misleading confident dot destroys trust
- GPS permission denied falls back cleanly to manual start selection — approximately 15–30% of users deny on first ask
- GPS snaps to nearest walkable node as route start — raw lat/lng lands on walls; must resolve to the navigation graph
- Admin configures lat/lng bounding box per floor — required for coordinate transform; no GPS feature works without it
- Multi-floor directions show floor-change dividers — flat step list loses users during cross-floor navigation
- Multi-floor directions name the specific connector (stairs/elevator name from DB) — "go to the stairs" is ambiguous in multi-stairwell buildings
- Pinch-to-zoom uses touch midpoint as focal point — current code zooms from origin (0,0), causing map jumps
- Two-finger rotation pivots around touch midpoint — current rotation pivots around stage origin, causing wild map swings

**Should have (differentiators):**
- GPS accuracy ring (uncertainty circle) around the dot — Google Maps visual pattern; helps users judge reliability
- "Use my location" button snaps GPS to start and enables immediate routing — removes mandatory manual start-point selection step
- Floor-transition direction steps include up/down directional language — low cost, meaningful clarity gain
- Admin floor-connector linking via dropdown UI instead of manual node ID entry — reduces admin error; replaces a missing UI (connector IDs currently only settable via JSON import/export)

**Defer to v2+:**
- GPS bounds georeferencing via map-click helper (Leaflet overlay in admin) — high complexity; plain text inputs with bboxfinder.com link is sufficient for v1.6
- Real-time GPS tracking with continuous dot movement — indoor accuracy is insufficient; explicitly out of scope
- Compass-based auto-rotation via DeviceOrientationEvent — iOS permission friction, poor accuracy, disorienting UX
- GPS floor auto-detection from barometric pressure or GPS altitude — requires sensor fusion beyond browser APIs

See [FEATURES.md](./FEATURES.md) for full dependency graph, edge case analysis, and anti-features list.

### Architecture Approach

The v1.6 features integrate cleanly into the existing layered architecture without restructuring any component boundaries. The student side (`FloorPlanCanvas.tsx`) gains a new GPS dot Konva layer and a geolocation hook. The admin side (`ManageFloorsModal.tsx`, `EditorSidePanel.tsx`) gains GPS bounds form fields and a connector picker dropdown. The server (`index.ts`, `schema.ts`) gains four nullable columns and one new PUT endpoint. All GPS coordinate math executes client-side using data already present in the `GET /api/map` payload — no additional round-trips needed. The existing pathfinding engine and graph builder are completely untouched.

**Major components and their v1.6 responsibilities:**
1. `src/client/hooks/useGeolocation.ts` (NEW) — wraps `navigator.geolocation.watchPosition`, returns position + error + isSupported; cleans up `watchId` on unmount
2. `src/client/hooks/useGpsPosition.ts` (NEW) — transforms lat/lng to normalized 0-1 coords using floor `gpsBounds`; computes pixel position for Konva rendering
3. `src/shared/gps.ts` (NEW) — ~20-line `gpsToNormalized` utility with axis-inversion-correct formula; independently unit-testable before any UI integration
4. `src/client/hooks/useMapViewport.ts` (MODIFIED) — `handleTouchMove` only: fix pinch focal point and rotation pivot using `stage.getAbsoluteTransform().copy().invert()`
5. `src/client/hooks/useRouteDirections.ts` (MODIFIED) — add `floorId?: number` to `DirectionStep`; populate in `generateDirections` from `curr.floorId`
6. `src/client/components/DirectionsSheet.tsx` (MODIFIED) — render `FloorSectionHeader` dividers between step groups when `floorId` changes
7. `src/client/components/admin/EditorSidePanel.tsx` (MODIFIED) — add "Floor Connections" section with above/below connector dropdowns for connector-type nodes
8. `src/client/components/admin/ManageFloorsModal.tsx` (MODIFIED) — add GPS bounds config form per floor row
9. `src/server/db/schema.ts` + new Drizzle migration (MODIFIED + NEW) — 4 nullable GPS real columns on `floors`
10. `src/server/index.ts` (MODIFIED) — include `gpsBounds` in GET /api/map response; add `PUT /api/admin/floors/:id/gps-bounds` endpoint

**Unchanged:** pathfinding engine, graph builder, all DB queries (except map serialization), RouteLayer, LandmarkLayer, FloorTabStrip, SearchOverlay, SelectionMarkerLayer.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for full data flow diagrams, anti-patterns, and build order dependency graph.

### Critical Pitfalls

1. **GPS coordinate axis inversion (C-1)** — latitude increases northward but canvas Y increases downward; the naive mapping produces a mirrored dot visible only on a real outdoor device. Prevention: use `normY = 1 - (lat - southLat) / (northLat - southLat)` and unit-test `gpsToNormalized` with the center-of-bounds case before any UI integration.

2. **Pinch-zoom focal point breaks after stage rotation (C-2)** — `pointTo = (center - stage.position) / scale` is only correct when stage rotation is zero; with rotation applied it produces wrong focal coordinates, causing stage jumps on every pinch. Prevention: use `stage.getAbsoluteTransform().copy().invert().point(center)` for all pointer-to-stage coordinate conversions; fix `handleWheel` and `handleTouchMove` simultaneously.

3. **Admin floor-connector one-sided links cause asymmetric routing (M-2)** — saving only the source node's `connectsToNodeAboveId` leaves the target node without `connectsToNodeBelowId`, producing routes that work in one direction but fail in the other with no error message. Prevention: implement a dedicated atomic server endpoint `POST /api/admin/link-connector` that writes both nodes in one DB transaction; design the endpoint before building the UI.

4. **GPS nearest-node snap uses wrong distance metric on non-square floor plans (C-4)** — Euclidean distance in normalized 0-1 space over-weights horizontal distance on wide rectangular floor plans. Prevention: apply aspect-ratio correction (`dx *= imageWidth / imageHeight`) only in the snap function; keep `calculateWeight` unchanged for pathfinding edge weights.

5. **iOS Safari geolocation permission handling is inconsistent (C-6)** — `navigator.permissions.query` may return `"prompt"` even after system-level denial; the `watchPosition` error callback may not fire on some iOS 16.x builds. Prevention: never rely on `permissions.query` for geolocation on iOS; always call `watchPosition` and handle error code 1 (PERMISSION_DENIED) directly; test on a real iOS device before shipping.

See [PITFALLS.md](./PITFALLS.md) for all six critical pitfalls, four moderate pitfalls, four minor pitfalls, and phase-specific warnings.

---

## Implications for Roadmap

Based on combined research, the dependency structure dictates a four-phase grouping. Phases 1 through 3 are fully independent and can run in parallel. Phase 4 (GPS) has a strict internal dependency chain that prevents parallelization.

### Phase 1: Konva Gesture Fix

**Rationale:** The pinch-zoom focal point and rotation pivot bugs affect both the student canvas and the admin editor canvas (which shares `useMapViewport`). Fixing them first unblocks clean mobile testing of all subsequent phases. The fix is isolated to a single function in one file and has zero dependencies on any other v1.6 work.

**Delivers:** Correct pinch-to-zoom (focal point stays under fingers at all rotation angles), correct two-finger rotation (pivots at touch midpoint, not stage origin), and sub-threshold rotation jitter elimination (2-degree threshold).

**Addresses:** "Pinch-zoom focal point" and "rotation pivot" table-stakes requirements from FEATURES.md.

**Avoids:** Pitfall C-2 (rotation-aware focal point via inverse transform matrix), C-3 (verify `Konva.hitOnDragEnabled = true` preserved during refactor), m-4 (rotation jitter threshold guard).

**Files:** `src/client/hooks/useMapViewport.ts` only.

**Research flag:** SKIP — fix code is fully specified in STACK.md and ARCHITECTURE.md; standard affine inverse transform pattern.

### Phase 2: Multi-Floor Directions Dividers

**Rationale:** Purely additive rendering change on data that already flows through the existing pipeline. No schema changes, no new API endpoints, no new files. Highest user-value-to-risk ratio in the milestone.

**Delivers:** Floor-section dividers between direction step groups, specific connector names in transition steps (using the existing `name` field already in DB), up/down directional language ("Take Elevator A up to Floor 3").

**Addresses:** "Floor dividers" and "connector naming" table stakes; "directional language" differentiator from FEATURES.md.

**Avoids:** Pitfall M-1 (spurious floor-change steps on campus-outdoor routes — add node-type guard: only emit floor-change step when `curr.type` is `stairs`, `elevator`, or `ramp`), M-5 (consecutive floor-change steps with zero walking distance — post-process to merge or drop).

**Files:** `src/client/hooks/useRouteDirections.ts`, `src/client/components/DirectionsSheet.tsx`, `src/shared/types.ts` (add `floorId?: number` to `DirectionStep`).

**Research flag:** SKIP — all data already present in pipeline; change is additive; no algorithmic novelty.

### Phase 3: Admin Floor-Connector Visual Linking

**Rationale:** Pure UI addition on top of existing in-memory data. The `navGraph` is already loaded in `MapEditorCanvas.tsx`; `EditorSidePanel` just needs access to adjacent floor nodes via a new prop. This phase replaces a critical gap: there is currently no UI at all for `connectsToNodeAboveId` / `connectsToNodeBelowId` — admins currently rely on JSON import/export to set connector links.

**Delivers:** "Floor Connections" section in `EditorSidePanel` for connector-type nodes with above/below dropdowns; bidirectional link writes via a new atomic server endpoint; "remove link" action; validation rejecting same-floor or cross-building links; persistent pending-link banner during cross-floor linking flow.

**Addresses:** "Admin floor-connector linking UI" differentiator from FEATURES.md.

**Avoids:** Pitfall M-2 (one-sided orphaned links — dedicated atomic endpoint writes both nodes in one DB transaction), M-3 (invalid same-floor or cross-building links — server-side validation on link endpoint), M-4 (stale pending-link UI state during floor switch — persist pending-link state above `useEditorState` in `MapEditorCanvas`), m-3 (linked node on hidden floor — show node ID as read-only even when target floor is not loaded).

**Files:** `src/client/components/admin/EditorSidePanel.tsx`, `src/client/pages/admin/MapEditorCanvas.tsx`, `src/server/index.ts` (new `POST /api/admin/link-connector` atomic endpoint).

**Research flag:** SKIP for UI pattern. CONSIDER designing the pending-link-across-floor-switch state machine before implementing (no direct precedent in existing codebase; mock the UX flow first).

### Phase 4: GPS Bounds + Student GPS Dot

**Rationale:** This is the only phase with strict internal ordering and should be split into three sequential sub-phases. Schema must precede API, API must precede admin form, admin form (with bounds configured in DB) must precede the student GPS dot (which reads bounds from the API response). This is also the only phase that requires real-device testing.

#### Phase 4a: GPS Schema + API Foundation

**Delivers:** 4 nullable GPS real columns on `floors`, Drizzle migration, `gpsBounds?: { minLat, maxLat, minLng, maxLng }` field in `GET /api/map` NavFloor response, `PUT /api/admin/floors/:id/gps-bounds` endpoint, and `src/shared/gps.ts` utility with unit tests.

**Avoids:** Pitfall C-1 (axis inversion — unit-test `gpsToNormalized` with center-of-bounds assertion before any UI integration).

**Files:** `src/server/db/schema.ts`, new Drizzle migration file, `src/shared/types.ts`, `src/server/index.ts`, new `src/shared/gps.ts`.

**Research flag:** SKIP — standard Drizzle nullable column addition; coordinate transform math fully specified in STACK.md and ARCHITECTURE.md.

#### Phase 4b: Admin GPS Bounds Configuration

**Delivers:** GPS bounds form fields per floor row in `ManageFloorsModal.tsx` (4 number inputs for minLat, maxLat, minLng, maxLng with Zod validation), inline form errors for invalid bound order (northLat <= southLat), helper text linking to bboxfinder.com for coordinate lookup, save via PUT endpoint from Phase 4a.

**Avoids:** Pitfall C-1 (validate latMin < latMax and lngMin < lngMax with inline form error — prevents inverted bounds from reaching the DB), m-1 (GPS button is disabled/hidden in student view when `gpsBounds` is null for current floor).

**Files:** `src/client/components/admin/ManageFloorsModal.tsx`.

**Research flag:** SKIP — standard CRUD form pattern on existing modal component.

#### Phase 4c: Student GPS "You Are Here" Dot

**Delivers:** `useGeolocation` hook (watchPosition, cleanup, error codes 1/2/3), `useGpsPosition` hook (lat/lng to normalized to pixel with aspect-ratio correction for snap), GPS dot Konva layer with accuracy circle (counter-scaled like existing `LandmarkMarker` for constant screen size), "Use my location" button that triggers one-shot GPS and sets start point, nearest-node snap with aspect-ratio-corrected Euclidean distance, graceful permission-denied fallback message.

**Addresses:** All GPS table-stakes and differentiators from FEATURES.md.

**Avoids:** Pitfall C-4 (aspect-ratio snap correction — apply to snap only, not to pathfinding weights), C-5 (stale dot — set `timeout` on `watchPosition`; track `lastPositionTimestamp`; dim/hide dot older than 15 seconds), C-6 (iOS Safari — test on real iOS device; never use `permissions.query`; handle PERMISSION_DENIED error code directly), m-1 (only call `watchPosition` after explicit user button tap, never on mount), m-2 (accuracy circle radius capped in screen pixels to avoid filling viewport at high zoom).

**Files:** new `src/client/hooks/useGeolocation.ts`, new `src/client/hooks/useGpsPosition.ts`, `src/client/components/FloorPlanCanvas.tsx`.

**Research flag:** NEEDS ATTENTION — iOS Safari geolocation behavior diverges from spec and requires real-device testing. The 30m snap threshold and 50m hide threshold should be named constants for field calibration after initial ship.

### Phase Ordering Rationale

- Phases 1, 2, and 3 have zero inter-dependencies and are sequenced by descending risk-to-file-count ratio: the gesture fix (Phase 1) improves mobile testability for all subsequent work; directions (Phase 2) is entirely additive; connector linking (Phase 3) introduces the only new server endpoint outside the GPS chain.
- Phase 4 is last because it is the only feature with a multi-layer internal dependency chain; it also carries the highest testing burden (real device required for GPS validation).
- Phase 4c (GPS student dot) is explicitly sequenced after Phase 4b (GPS admin form) because the student dot cannot function without bounds configured in the DB.
- The pathfinding engine and graph builder are untouched throughout — this is the primary risk reduction mechanism for the entire milestone.

### Research Flags

Phases needing special attention during planning or implementation:

- **Phase 4c (GPS student feature):** iOS Safari geolocation behavior diverges from spec in ways that cannot be caught in browser DevTools emulation. This phase must include a real-device test gate before it is considered done. The accuracy thresholds (30m for snap, 50m for hiding the dot) should be implemented as named constants and tuned based on on-campus testing results.
- **Phase 3 (connector linking):** The pending-link-across-floor-switch state machine is the most novel interaction design in the milestone. No direct precedent in the v1.5 codebase. Recommend sketching the state transitions (source selected, floor switched, target selected, link saved, link cancelled) before writing code.

Phases with well-documented patterns that can skip deep research:
- **Phase 1 (gesture fix):** Exact fix code is fully specified in STACK.md and ARCHITECTURE.md; the affine inverse transform pattern is standard.
- **Phase 2 (directions dividers):** Additive field plus conditional rendering; all data already flows through the pipeline.
- **Phase 4a/4b (GPS schema and admin form):** Standard Drizzle ADD COLUMN migration and CRUD form; established patterns throughout the existing codebase.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Zero new dependencies; all existing APIs confirmed present by direct source inspection of v1.5 codebase; official docs consulted for all capabilities |
| Features | HIGH | Table stakes validated against MazeMap, Mappedin, and MDPI peer-reviewed indoor navigation research; anti-features clearly scoped; dependency graph is explicit |
| Architecture | HIGH | Based on direct source code inspection of v1.5 codebase; all integration points identified with specific file and function-level detail; build order follows verified dependency analysis |
| Pitfalls | HIGH | Six critical/moderate pitfalls derived from direct code analysis of the existing system; prevention strategies are concrete and immediately actionable; iOS Safari pitfall sourced from Apple Developer Forums |

**Overall confidence: HIGH**

### Gaps to Address

- **Indoor GPS accuracy threshold tuning:** The 30m snap threshold and 50m hide threshold are well-sourced heuristics (Mappedin SDK reference), but actual performance depends on device hardware, building construction material, and campus geography. Implement as named constants (`GPS_SNAP_THRESHOLD_M`, `GPS_HIDE_THRESHOLD_M`); plan a real-device calibration session after Phase 4c ships.
- **Aspect ratio correction for nearest-node snap:** The aspect-ratio-corrected distance requires the floor plan image pixel dimensions at snap time. Confirm that `imageRect` (already passed to `FloorPlanCanvas`) provides both width and height, or that floor plan image dimensions are available from the `GET /api/map` response; validate before starting Phase 4c.
- **Bidirectional connector link atomicity:** The `POST /api/admin/link-connector` endpoint requires a Drizzle transaction wrapping two UPDATE statements. Verify the Drizzle transaction API (`db.transaction(async tx => {...})`) against the current Drizzle version (v0.45.1) before Phase 3 implementation; it is a standard feature but worth confirming to avoid mid-phase surprises.
- **iOS real-device testing gate:** Cannot be automated in CI. Must be part of Phase 4c definition of done; requires access to a physical iPhone with Safari.

---

## Sources

### Primary (HIGH confidence)
- MDN Web Docs — Geolocation API, watchPosition, GeolocationCoordinates.accuracy, error codes
- Konva.js Official Docs — Multi-touch Scale Stage, Zooming Relative to Pointer, Stage API (`getAbsoluteTransform`, `Transform.invert`, `Transform.point`)
- Direct source code inspection — `useMapViewport.ts`, `useRouteDirections.ts`, `DirectionsSheet.tsx`, `EditorSidePanel.tsx`, `schema.ts`, `server/index.ts`, `graph-builder.ts` (v1.5 codebase)
- MDPI Indoor Navigation Landmark Instructions (2017) — floor-transition step naming patterns (peer-reviewed)
- Apple Developer Forums — iOS Safari geolocation `permissions.query` inconsistency
- Chrome Developers Blog — Geolocation on Secure Contexts Only (HTTPS requirement)
- Konva.js Official Docs — `hitOnDragEnabled` requirement for two-finger gestures on draggable Stage
- longviewcoder.com — rotate-around-arbitrary-pivot Konva math pattern

### Secondary (MEDIUM confidence)
- Mappedin Blue Dot developer docs — 50m accuracy hide threshold; one-shot vs continuous GPS design
- MazeMap Blue Dot Navigation blog — outdoor GPS accuracy discussion; IPS hardware requirement for reliable indoor positioning
- Situm Floor Transition Paths docs — admin staircase/elevator node linking workflow across floors
- NavVis Managing Navigation Graphs — cross-floor node linking editor patterns
- HoloBuilder GPS-enabled floor plans — two-corner georeferencing admin UX pattern
- Konva GitHub Issues #1096 — pinch-zoom jump diagnosis and `hitOnDragEnabled` fix
- Affine transform coordinate mapping (Medium article) — linear interpolation formula for lat/lng to pixel using bounding box
- Pointr: Indoor location in browsers — indoor GPS accuracy discussion

### Tertiary (LOW confidence)
- getAccurateCurrentPosition (GitHub) — pattern for accuracy-threshold polling before accepting a GPS fix; useful reference but a custom hook is preferred over the library itself

---
*Research completed: 2026-03-09*
*Ready for roadmap: yes*

# Architecture Patterns — v1.6 Integration Analysis

**Domain:** Campus indoor wayfinding — GPS integration, mobile gesture fix, multi-floor directions UX, admin floor-connector visual linking
**Researched:** 2026-03-09
**Confidence:** HIGH — based on direct source code inspection of v1.5 codebase

---

## Existing Architecture (v1.5 Baseline)

This section documents what is already in place. All four v1.6 features integrate INTO this structure.

### System Diagram

```
STUDENT SIDE                              ADMIN SIDE
============                              ==========
FloorPlanCanvas.tsx                       MapEditorCanvas.tsx
  ├── useGraphData → GET /api/map           ├── useEditorState (reducer)
  ├── useMapViewport (Konva stage direct)   ├── useMapViewport (same hook)
  ├── useRouteSelection                     ├── EditorSidePanel.tsx
  ├── useRouteDirections                    │     └── node property form
  ├── DirectionsSheet.tsx                   ├── NodeDataTable.tsx
  ├── LandmarkLayer.tsx                     ├── EdgeDataTable.tsx
  ├── RouteLayer.tsx                        ├── ManageFloorsModal.tsx
  ├── SelectionMarkerLayer.tsx              └── EditorToolbar.tsx
  └── FloorTabStrip.tsx
              |
              | GET /api/map (public, no auth)
              | POST /api/admin/* (JWT cookie)
              v
      Hono REST API (src/server/index.ts)
              |
              v
      PostgreSQL via Drizzle ORM
      buildings → floors → nodes / edges

Object storage: Backblaze B2 (S3-compatible)
  - floor-plan-{buildingId}-{floorNumber}.{ext}
  - campus-map.{ext}
```

### Key Invariants (Must Not Break)

| Invariant | Where enforced |
|-----------|---------------|
| Coordinates stored as normalized 0-1 fractions | `NavNodeData.x / .y`, schema `real` columns |
| Konva stage mutations are DIRECT (not React setState) | `useMapViewport.ts` — all viewport ops write directly to `stage` ref |
| Two-pass buildGraph: pass 1 intra-floor, pass 2 inter-floor from `connectsToNodeAboveId` | `graph-builder.ts` |
| `floorNumber=0` sentinel for campus map | `schema.ts`, `server/index.ts` campus upsert |
| JWT in httpOnly cookie named `admin_token` | `server/index.ts` jwt middleware |
| `GET /api/map` fully public, no auth | All student clients call this without credentials |

---

## Feature 1: Pinch-Zoom / Rotation Focal Point Fix

### What is broken

In `useMapViewport.ts` `handleTouchMove`, when two fingers move, the zoom is applied but the stage position does not correctly account for the touch midpoint as the focal center. The current code computes `pointTo` using `stage.scaleX()` at the start of the gesture frame, but the initial frame (`lastDist.current === 0`) returns early WITHOUT setting `lastCenter.current` to the current midpoint — it sets it and then bails out. On the next frame, `lastCenter.current` is used correctly, but the scale application on the first non-bail frame uses `center` as if it is the reference, when the reference is `lastCenter.current`.

The rotation logic is also using `lastAngle.current` correctly — it tracks the delta from the previous frame, which is correct.

The core bug in the zoom focal point: `pointTo` is computed relative to `center` (current touch midpoint in screen coords), not relative to the touch midpoint converted through the CURRENT stage transform. This means when you pinch, the map drifts rather than zooming around the midpoint.

### What changes

**File to modify: `src/client/hooks/useMapViewport.ts`**

Only `handleTouchMove` needs fixing. The fix is:
1. Compute `pointTo` in stage-local coordinates using the CURRENT frame's `center` converted through the inverse of the current stage transform (same pattern as `handleWheel`).
2. Apply new scale, then set stage position to `center - pointTo * newScale + (translationDelta from finger pan)`.

No new files, no new components, no schema changes. Pure bug fix in one function.

### Integration points

| Touch point | File | Change type |
|-------------|------|-------------|
| Touch handler | `src/client/hooks/useMapViewport.ts` | MODIFY `handleTouchMove` only |
| Admin editor | Uses same `useMapViewport` hook — fix applies automatically | NONE |

### Confidence: HIGH
The code is visible and the bug is mechanical. The wheel handler implements the correct focal-point math already — the touch handler just needs the same `pointTo` computation.

---

## Feature 2: Multi-Floor Directions — Floor-Change Dividers

### What exists

`useRouteDirections.ts` (`generateDirections`) already detects floor-change steps:

```ts
if (curr.floorId !== next.floorId) {
  // ... emits a floor-transition DirectionStep
  // icon: 'stairs-up' | 'stairs-down' | 'elevator' | 'ramp'
  // instruction: "Take the stairs to Floor 3"
}
```

`DirectionsSheet.tsx` renders all steps as a flat list of `<StepItem>` components. There is currently NO visual section divider between the per-floor segments of the route.

### What the feature requires

1. The directions list must show a **section header/divider** between segments that belong to different floors. E.g.: a "Floor 2" header row before the steps on Floor 2.
2. The connector step ("Take the stairs to Floor 3") acts as a transition between sections.

### Data already available

`DirectionStep` already carries `isAccessibleSegment`. The floor number is embedded in the instruction text ("Take the stairs to Floor 3") but is not a structured field.

To render section dividers cleanly, the step list needs to know WHICH FLOOR each step belongs to. Two options:

**Option A (recommended):** Add a `floorId?: number` field to `DirectionStep`. `generateDirections` already has access to `curr.floorId` at the moment it emits each step — simply include it. Then `DirectionsSheet` can group steps by floorId and render a "Floor N" divider row whenever `floorId` changes.

**Option B:** Parse floor number from instruction text in `DirectionsSheet`. Fragile — instruction text can change, and it would couple rendering to string parsing.

### What changes

**File: `src/client/hooks/useRouteDirections.ts`**
- Add `floorId?: number` to `DirectionStep` interface
- Populate `floorId` in `generateDirections` from `curr.floorId` for each intermediate step
- Populate `floorId` for the arrive step from `last.floorId`

**File: `src/client/components/DirectionsSheet.tsx`**
- Modify the step list renderer (`StepItem` loop) to detect `floorId` changes and insert a floor section header div before the first step of each new floor
- Section header: e.g. `"Floor 2"` label with a horizontal rule, styled as a divider row

**New sub-component (inline or extracted):** `FloorSectionHeader` — renders the floor label between step groups.

No API changes. No schema changes. No new endpoints.

### Integration points

| Touch point | File | Change type |
|-------------|------|-------------|
| Step type | `src/client/hooks/useRouteDirections.ts` | ADD `floorId` field to `DirectionStep` |
| Direction generation | `src/client/hooks/useRouteDirections.ts` | MODIFY `generateDirections` to populate `floorId` |
| Step rendering | `src/client/components/DirectionsSheet.tsx` | MODIFY step list loop to insert floor dividers |
| Test | `src/client/hooks/useRouteDirections.test.ts` | UPDATE to assert `floorId` on steps |

### Confidence: HIGH
All required data flows through the existing pipeline. The change is additive (new field, new rendering logic). No regressions possible in the pathfinding or graph layers.

---

## Feature 3: GPS Bounds Configuration + "You Are Here" Dot

This is the most architecturally new feature. It touches schema, API, admin UI, and student UI.

### Conceptual model

**GPS bounds per floor:** Admin configures four real-world lat/lng values for each floor plan (or the campus map). These define the bounding box that maps the image corners to real-world coordinates.

```
(minLng, maxLat) ----------- (maxLng, maxLat)   ← image top-left / top-right
       |                              |
       |     floor plan image         |
       |                              |
(minLng, minLat) ----------- (maxLng, minLat)   ← image bottom-left / bottom-right
```

**Coordinate transformation:** Given a GPS point `(lat, lng)`, convert to normalized 0-1:
```
normX = (lng - minLng) / (maxLng - minLng)
normY = (maxLat - lat) / (maxLat - minLat)   // Y is inverted: image Y=0 is top (maxLat)
```

**Nearest-node snap:** Once the user's GPS position is in normalized 0-1 space, find the nearest visible landmark node (Euclidean distance) and offer it as the start location.

### New data: GPS bounds on floors table

**Schema change required.** The `floors` table must gain four new nullable columns:

```sql
ALTER TABLE floors ADD COLUMN gps_min_lat REAL;
ALTER TABLE floors ADD COLUMN gps_max_lat REAL;
ALTER TABLE floors ADD COLUMN gps_min_lng REAL;
ALTER TABLE floors ADD COLUMN gps_max_lng REAL;
```

These are nullable — floors without GPS bounds configured show no GPS feature.

**Drizzle schema (`src/server/db/schema.ts`):** Add four `real()` nullable columns to `floors`.

**Migration:** A new Drizzle migration file must be generated (`drizzle generate`).

### API changes

**Existing `GET /api/map`:** The `NavFloor` serialization must include GPS bounds when present. Add four optional fields to the response:

```ts
// In NavFloor (shared/types.ts)
gpsBounds?: {
  minLat: number
  maxLat: number
  minLng: number
  maxLng: number
}
```

No new endpoint needed — GPS bounds ride the existing `GET /api/map` payload.

**New admin endpoint — `PUT /api/admin/floors/:id/gps-bounds`:**

```
PUT /api/admin/floors/:id/gps-bounds
Body: { minLat, maxLat, minLng, maxLng }
Response: { ok: true }
```

JWT-protected (falls under `/api/admin/*` middleware already in place). Updates the four columns on the specified floor row.

### Admin UI: GPS Bounds Form

**Where to add it:** Inside `ManageFloorsModal.tsx`, per-floor row. Each floor in the list gets an expandable "Configure GPS bounds" section with four number inputs (min/max lat, min/max lng) and a Save button that calls the new endpoint.

**Alternative placement:** In `EditorSidePanel.tsx` as a floor-level panel (not node/edge). This is less discoverable because the side panel only appears when a node/edge is selected.

**Recommended:** Expand `ManageFloorsModal.tsx` — it already has the floor list, each floor has a row, and it handles async API calls. The GPS bounds form fits naturally as a collapsible section per row.

### Student UI: GPS Dot + Nearest-Node Snap

**New hook: `src/client/hooks/useGeolocation.ts`**

```ts
export function useGeolocation(): {
  position: GeolocationCoordinates | null
  error: string | null
  isSupported: boolean
}
```

Calls `navigator.geolocation.watchPosition` for live updates. Returns null when permission denied or unavailable. The hook cleans up the watcher on unmount.

**New hook: `src/client/hooks/useGpsPosition.ts`** (or inline in `FloorPlanCanvas`)

Given:
- Geolocation coordinates
- Active floor's `gpsBounds` (from the NavFloor object in `graphState.data`)
- `imageRect` (the floor plan's pixel rect on the Konva stage)

Computes the normalized 0-1 position of the user, then converts to pixel coords for Konva rendering. Returns `{ normX, normY, pixelX, pixelY }` or `null` when bounds not configured or GPS unavailable.

**Nearest-node snap:**

```ts
function findNearestNode(
  normX: number,
  normY: number,
  nodes: NavNode[],
  activeFloorId: number
): NavNode | null
```

Filters nodes to `activeFloorId` and `searchable: true`, then finds the node with minimum Euclidean distance to `(normX, normY)` in normalized coords. Returns null if no nodes on current floor.

**New Konva layer: GPS Dot**

A new Konva `Circle` (or custom `Group`) rendered on the stage showing the user's position. Uses the Konva `hitOnDragEnabled` pattern already in use. Renders only when GPS is available and floor has bounds configured.

**Placement in `FloorPlanCanvas.tsx`:** Add GPS dot as a new `Layer` between `RouteLayer` and `LandmarkLayer`, so it appears above the route line but below landmark markers.

**"Snap to start" UX:** When GPS position is available and a nearest node is found, show a dismissible banner or button ("Use your location as start") that calls `routeSelection.setFromTap(nearestNode)`. This is additive — user can still manually pick a start.

### New GPS permission handling

GPS requires `navigator.geolocation`. The app must handle:
- Browser API not available (non-HTTPS, old browser): show nothing, no error
- Permission denied: show nothing silently (do not alarm student-facing UX)
- Permission prompt: browser handles natively

### Integration points summary — GPS feature

| Touch point | File | Change type |
|-------------|------|-------------|
| DB schema | `src/server/db/schema.ts` | ADD 4 nullable GPS columns to `floors` |
| Migration | New Drizzle migration file | NEW |
| Shared types | `src/shared/types.ts` | ADD `gpsBounds?` to `NavFloor` |
| GET /api/map | `src/server/index.ts` | MODIFY NavFloor serialization to include gpsBounds |
| New endpoint | `src/server/index.ts` | ADD `PUT /api/admin/floors/:id/gps-bounds` |
| Admin GPS form | `src/client/components/admin/ManageFloorsModal.tsx` | ADD GPS bounds fields per floor row |
| Geolocation hook | `src/client/hooks/useGeolocation.ts` | NEW |
| GPS transform | `src/client/hooks/useGpsPosition.ts` or inline | NEW |
| GPS dot layer | `src/client/components/FloorPlanCanvas.tsx` | ADD Konva Circle layer |
| "Use location" banner | `src/client/components/FloorPlanCanvas.tsx` | ADD conditionally rendered HTML overlay |

### Confidence: HIGH (for architecture). MEDIUM for browser GPS behavior specifics.
The coordinate math is straightforward. The browser Geolocation API is stable since 2013 (MDN, HIGH confidence). The main uncertainty: GPS accuracy on mobile inside buildings is typically 5-30m, which may snap to wrong nodes — this is a UX/data quality concern, not an architectural one.

---

## Feature 4: Admin Visual Floor-Connector Linking

### What the problem is

Currently, linking a staircase/elevator/ramp node to its counterpart on another floor requires the admin to:
1. Know the exact node ID of the node on the other floor
2. Type it manually into a text field (which does not currently exist in the UI — the connector IDs are only set via JSON import/export)

This is the current state: `EditorSidePanel.tsx` does NOT render any UI for `connectsToNodeAboveId / connectsToNodeBelowId`. These fields exist in the DB schema and types, but the admin UI has no way to set them interactively.

### Proposed workflow

When a connector node (type: `stairs`, `elevator`, or `ramp`) is selected in the admin editor:
1. EditorSidePanel shows a "Floor Connections" section
2. A "Link to node above" picker appears — a `<select>` dropdown populated with connector nodes from the floor above
3. A "Link to node below" picker appears — a `<select>` populated with connector nodes from the floor below
4. Selecting a node from the dropdown sets `connectsToNodeAboveId` or `connectsToNodeBelowId` on both nodes (bidirectional link — when you link A to B above, B's `connectsToNodeBelowId` should be set to A)

### What data is needed

The editor already loads the full `NavGraph` (`navGraph` state in `MapEditorCanvas.tsx`). All buildings, floors, and their nodes are available. The side panel needs access to:
- The full `NavGraph` (or at least the adjacent floor's nodes)
- The active floor's `floorNumber` and `buildingId`
- The floor above (if exists) and floor below (if exists), extracted from `navGraph`

**Current `EditorSidePanel` props do NOT include `navGraph`.**

### What changes

**File: `src/client/components/admin/EditorSidePanel.tsx`**

Add props:
- `navGraph: NavGraph | null` — to populate cross-floor node pickers
- `activeFloorId: number | null` — to know which floor is active (already in editor state, needs to be threaded)
- `activeBuildingId: number | 'campus'` — to scope floor lookup

Add a new "Floor Connections" section in the node editing form, visible only when `selectedNode.type === 'stairs' || selectedNode.type === 'elevator' || selectedNode.type === 'ramp'`.

The section contains two dropdowns:
- "Connects to floor above": `<select>` of connector nodes on the floor above (same building). Populated by looking up `navGraph.buildings.find(b => b.id === activeBuildingId)?.floors.find(f => f.floorNumber === activeFloorNumber + 1)?.nodes.filter(n => isConnectorType(n.type))`.
- "Connects to floor below": same pattern for `floorNumber - 1`.

When the admin selects a node from the dropdown, `onUpdateNode` is called with `{ connectsToNodeAboveId: selectedId }`. The reciprocal update (`connectsToNodeBelowId` on the target node) requires either:
- **Option A (recommended):** A second `onUpdateNode` call for the target node in the same handler, dispatching `UPDATE_NODE` for both nodes atomically.
- **Option B:** Server-side enforcement of bidirectionality. Not recommended — adds complexity to the thin CRUD server.

**File: `src/client/pages/admin/MapEditorCanvas.tsx`**

Pass `navGraph`, `activeFloorId`, `activeBuildingId` into `EditorSidePanel`.

**No API changes required.** The existing `POST /api/admin/graph` saves the full graph including connector IDs. The new UI simply populates fields that were previously only settable via import. Graph save is unmodified.

### Visual "link line" enhancement (optional / defer)

A more advanced version would draw a visual indicator line between linked connector nodes across floors (e.g., in a "floor overview" panel). This is higher complexity and should be deferred to a later phase. The dropdown UX described above is sufficient for v1.6.

### Integration points

| Touch point | File | Change type |
|-------------|------|-------------|
| Side panel props | `src/client/components/admin/EditorSidePanel.tsx` | ADD `navGraph`, `activeFloorId`, `activeBuildingId` props |
| Floor connector section | `src/client/components/admin/EditorSidePanel.tsx` | ADD "Floor Connections" section with two dropdowns |
| Bidirectional update | `src/client/components/admin/EditorSidePanel.tsx` | Call `onUpdateNode` TWICE (source + target) on selection |
| Canvas wires props | `src/client/pages/admin/MapEditorCanvas.tsx` | PASS navGraph + floor context to EditorSidePanel |

### Confidence: HIGH
All data is already in-memory in the editor. The change is pure UI addition. The reducer already handles `UPDATE_NODE` for arbitrary node updates.

---

## Component Boundaries: New vs Modified

### New files

| File | Purpose |
|------|---------|
| `src/client/hooks/useGeolocation.ts` | Browser Geolocation API wrapper — watchPosition, cleanup, error handling |
| `src/client/hooks/useGpsPosition.ts` | Transform lat/lng to normalized 0-1 coords given floor gpsBounds |
| New Drizzle migration file | Adds 4 GPS columns to `floors` table |

### Modified files

| File | What changes | Feature |
|------|--------------|---------|
| `src/server/db/schema.ts` | Add 4 nullable GPS real columns to `floors` | GPS |
| `src/shared/types.ts` | Add `gpsBounds?` to `NavFloor`; add `floorId?` to `DirectionStep` | GPS + Directions |
| `src/server/index.ts` | Include GPS bounds in `GET /api/map` serialization; add `PUT /api/admin/floors/:id/gps-bounds` | GPS |
| `src/client/hooks/useRouteDirections.ts` | Add `floorId` to `DirectionStep`; populate in `generateDirections` | Directions |
| `src/client/hooks/useMapViewport.ts` | Fix `handleTouchMove` focal-point calculation | Touch |
| `src/client/components/DirectionsSheet.tsx` | Render floor-section dividers between step groups | Directions |
| `src/client/components/FloorPlanCanvas.tsx` | Add GPS dot layer + geolocation hooks + "use my location" UX | GPS |
| `src/client/components/admin/EditorSidePanel.tsx` | Add floor connector picker UI; add navGraph + floor context props | Connector |
| `src/client/components/admin/ManageFloorsModal.tsx` | Add GPS bounds config per floor | GPS |
| `src/client/pages/admin/MapEditorCanvas.tsx` | Pass navGraph + floor context to EditorSidePanel | Connector |

### Unchanged files

Pathfinding engine, graph builder, all DB queries except GET /api/map serialization, RouteLayer, LandmarkLayer, FloorTabStrip, SearchOverlay, SelectionMarkerLayer.

---

## Data Flow Changes

### GPS: Admin → Student

```
Admin opens ManageFloorsModal
  → enters GPS bounds (minLat, maxLat, minLng, maxLng) for a floor
  → calls PUT /api/admin/floors/:id/gps-bounds
  → server writes 4 columns to floors table
  → next time student loads app: GET /api/map includes gpsBounds on NavFloor
  → useGpsPosition reads floor's gpsBounds
  → browser Geolocation API returns lat/lng
  → transform to normX, normY
  → nearest searchable node on active floor found
  → GPS dot drawn on Konva canvas at (pixelX, pixelY)
  → optional: user taps "Use my location" → routeSelection.setFromTap(nearestNode)
```

### Floor Directions: Pathfinding → Rendering

```
PathfindingEngine.findRoute → PathResult.nodeIds (ordered, may cross floors)
  → generateDirections(nodeIds, nodeMap, mode, floorMap)
  → DirectionStep[] where each step now carries floorId
  → DirectionsSheet renders steps grouped by floorId
  → FloorSectionHeader inserted between groups
```

### Admin Floor Connector: UI → Graph

```
Admin selects a staircase node in EditorSidePanel
  → EditorSidePanel shows "Connects to floor above" dropdown
  → Dropdown populated from navGraph.buildings[].floors[floorAbove].nodes.filter(isConnector)
  → Admin selects target node
  → onUpdateNode(sourceNode.id, { connectsToNodeAboveId: targetId })
  → onUpdateNode(targetNode.id, { connectsToNodeBelowId: sourceNode.id })
  → Both dispatched as UPDATE_NODE to editorReducer
  → Editor state is dirty
  → Admin saves → POST /api/admin/graph with full graph
  → buildGraph pass 2 synthesizes inter-floor edges from connectsToNodeAboveId
  → Routes now cross floors correctly
```

---

## Build Order for v1.6

Dependencies dictate order. Independent features can be parallelized.

### Dependency graph

```
Feature A: Touch fix (useMapViewport)
  → No dependencies on other features. Can be built first, standalone.

Feature B: Directions dividers (useRouteDirections + DirectionsSheet)
  → No dependencies on other features. Can be built standalone.
  → DEPENDS ON: existing DirectionStep type (extend it, don't replace it)

Feature C: Admin floor-connector picker (EditorSidePanel)
  → No dependencies on GPS or directions features.
  → DEPENDS ON: navGraph being passed through (thread prop from MapEditorCanvas)

Feature D: GPS bounds + GPS dot
  → DEPENDS ON: schema migration (must run first)
  → DEPENDS ON: shared types update (NavFloor.gpsBounds)
  → DEPENDS ON: server endpoint (PUT gps-bounds)
  → DEPENDS ON: GPS bounds form in ManageFloorsModal
  → AFTER: schema → API → admin form → student GPS dot
```

### Recommended phase order

**Phase 1 — Touch Fix (standalone, zero risk)**
Fix `handleTouchMove` in `useMapViewport.ts`. Verify on mobile. No dependencies. Unblocks nothing but should ship early — it affects both student and admin canvas.

**Phase 2 — Directions Floor Dividers (standalone, low risk)**
Extend `DirectionStep` with `floorId`, populate in `generateDirections`, render dividers in `DirectionsSheet`. Update tests. No server changes. Can proceed in parallel with Phase 1.

**Phase 3 — Admin Floor-Connector Picker (UI only, medium complexity)**
Thread `navGraph` + floor context into `EditorSidePanel`. Add connector picker section. Handle bidirectional UPDATE_NODE dispatches. No schema or API changes. Requires careful prop threading.

**Phase 4 — GPS Schema + API (blocks student GPS feature)**
Write Drizzle migration. Update `schema.ts`. Update `shared/types.ts` (`NavFloor.gpsBounds`). Update `GET /api/map` serialization. Add `PUT /api/admin/floors/:id/gps-bounds`. This is the prerequisite for all GPS UI.

**Phase 5 — GPS Admin Form (depends on Phase 4)**
Add GPS bounds config UI in `ManageFloorsModal.tsx`. Admin can now store bounds per floor.

**Phase 6 — GPS Student Feature (depends on Phase 4 + 5)**
Implement `useGeolocation`, `useGpsPosition`. Add GPS dot to `FloorPlanCanvas`. Add nearest-node snap + "use my location" UX. Full end-to-end GPS feature complete.

### Summary table

| Phase | Feature | Files | Depends on |
|-------|---------|-------|------------|
| 1 | Touch focal point fix | `useMapViewport.ts` | Nothing |
| 2 | Directions floor dividers | `useRouteDirections.ts`, `DirectionsSheet.tsx` | Nothing |
| 3 | Admin floor-connector picker | `EditorSidePanel.tsx`, `MapEditorCanvas.tsx` | Nothing (navGraph already loaded) |
| 4 | GPS schema + API | `schema.ts`, migration, `types.ts`, `server/index.ts` | Phase 3 (for clean merge), but technically independent |
| 5 | GPS admin form | `ManageFloorsModal.tsx` | Phase 4 |
| 6 | GPS student feature | `useGeolocation.ts`, `useGpsPosition.ts`, `FloorPlanCanvas.tsx` | Phase 4 + 5 |

Phases 1, 2, 3 are fully independent and can be parallelized. Phase 4 must precede Phases 5 and 6. Phase 5 must precede Phase 6 (admin sets bounds before student GPS works).

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Storing GPS bounds on the NavNode (not the floor)
**What:** Attaching GPS-corner nodes to the node graph.
**Why bad:** GPS bounds are a property of the floor IMAGE, not the navigation graph. Mixing concerns complicates the schema and makes bounds editing dependent on the graph editor.
**Instead:** Store GPS bounds on the `floors` table. Independent admin UI in ManageFloorsModal.

### Anti-Pattern 2: Server-side GPS coordinate transformation
**What:** Sending raw lat/lng to server, receiving normalized 0-1 back.
**Why bad:** Adds a round-trip for every GPS position update. Client already has all the data (NavFloor.gpsBounds) needed to do the math locally in <1ms.
**Instead:** Transform client-side in `useGpsPosition`. Server only persists the bounds.

### Anti-Pattern 3: React state for Konva GPS dot position
**What:** Storing GPS dot pixel position in React state and re-rendering the Stage component.
**Why bad:** GPS updates can arrive frequently (1Hz). Forcing React re-renders would drop frames and conflict with the established pattern of direct Konva stage mutations for viewport.
**Instead:** Use a Konva `Circle` ref and call `circle.position({ x, y })` directly when GPS updates arrive, consistent with the `direct stage mutations` pattern for viewport. Only re-render the GPS layer, not the whole Stage.

### Anti-Pattern 4: One-way floor-connector linking (only set connectsToNodeAboveId, not the reciprocal)
**What:** Admin links A → B above, but doesn't update B's `connectsToNodeBelowId`.
**Why bad:** `buildGraph` pass 2 only reads `connectsToNodeAboveId` to synthesize the inter-floor edge. If only `connectsToNodeBelowId` is set (with no `connectsToNodeAboveId` counterpart), the cross-floor edge is never created. The pair must be set bidirectionally.
**Instead:** When admin sets A's `connectsToNodeAboveId = B`, immediately also dispatch `UPDATE_NODE(B.id, { connectsToNodeBelowId: A.id })`.

### Anti-Pattern 5: Parsing floor number from direction instruction text
**What:** Reading "Take the stairs to Floor 3" and extracting "3" with regex in `DirectionsSheet`.
**Why bad:** Couples rendering to instruction string format. Any wording change breaks the parser. The floor ID is available as structured data in `curr.floorId`.
**Instead:** Add `floorId` as a typed field on `DirectionStep` and use it directly.

---

## Scalability Impact of v1.6

| Change | Impact | Mitigation |
|--------|--------|------------|
| 4 new nullable columns on `floors` | Negligible — table has few rows (one per floor) | None needed |
| `gpsBounds` in GET /api/map response | Adds ~100 bytes per floor to JSON payload | None needed at this scale |
| Geolocation watchPosition | Battery drain on mobile | Use `maximumAge: 10000` to throttle GPS queries; stop watcher when user leaves student view |
| GPS dot Konva layer | Extra draw call on GPS update | Use direct Konva node mutation (not React state) to update position without full stage re-render |

---

## Sources

- Direct source code inspection: `src/client/hooks/useMapViewport.ts` (v1.5)
- Direct source code inspection: `src/client/hooks/useRouteDirections.ts` (v1.5)
- Direct source code inspection: `src/client/components/DirectionsSheet.tsx` (v1.5)
- Direct source code inspection: `src/client/components/admin/EditorSidePanel.tsx` (v1.5)
- Direct source code inspection: `src/server/db/schema.ts` (v1.5)
- Direct source code inspection: `src/server/index.ts` (v1.5)
- Direct source code inspection: `src/shared/types.ts` (v1.5)
- Direct source code inspection: `src/shared/pathfinding/graph-builder.ts` (v1.5)
- MDN Web Docs — Geolocation API: `navigator.geolocation.watchPosition` — stable since 2013 [HIGH confidence]
- Konva.js direct node mutation pattern — already used in useMapViewport.ts `handleWheel` [HIGH confidence]

---

*Architecture research for: CampusNav v1.6 — GPS Integration & UX Refinements*
*Researched: 2026-03-09*

# Technology Stack

**Project:** CampusNav v1.6 — GPS Integration & UX Refinements
**Researched:** 2026-03-09
**Supersedes:** v1.0 stack research (2026-02-18) for the new v1.6 features only

---

## What is NOT Changing

The following v1.5 stack is validated and does not need revisiting:

| Technology | Version | Status |
|------------|---------|--------|
| React | ^19.2.4 | Unchanged |
| Vite | ^7.3.1 | Unchanged |
| Hono + @hono/node-server | ^4.11.9 / ^1.19.9 | Unchanged |
| Konva + react-konva | ^10.2.0 / ^19.2.2 | Unchanged (no upgrade needed) |
| Drizzle ORM + drizzle-kit | ^0.45.1 / ^0.31.9 | Unchanged |
| postgres (postgres-js) | ^3.4.8 | Unchanged |
| ngraph.path + ngraph.graph | ^1.6.1 / ^20.1.2 | Unchanged |
| Tailwind CSS | ^4.1.18 | Unchanged |
| React Router | ^7.13.0 | Unchanged |
| Zod | ^4.3.6 | Unchanged |
| Biome | ^2.4.2 | Unchanged |
| TypeScript | ^5.9.3 | Unchanged |

---

## v1.6 Stack Decision: No New Libraries Required

**All four v1.6 features are achievable with the existing stack.** Each feature breaks down as follows:

---

## Feature 1: GPS "You Are Here" Dot + Nearest-Node Snap

### Technology: Browser Geolocation API (native, zero cost)

`navigator.geolocation` is a browser-native API requiring no npm install. It provides
latitude/longitude/accuracy via `watchPosition()` (live updates) and `getCurrentPosition()`
(one-shot). Available in all modern browsers since Chrome 50 (2016).

**Requirements checklist:**
- HTTPS required — the app already deploys on Render over HTTPS. Confidence: HIGH (Chrome Security blog, MDN)
- `position.coords.latitude`, `position.coords.longitude`, `position.coords.accuracy` (meters) — all available
- Permission model: browser shows permission dialog; `PERMISSION_DENIED` error code if refused
- Indoor accuracy with `enableHighAccuracy: true`: typically 5–30m on mobile GPS chip; less indoors

**Custom hook design (no library needed):**

```typescript
// src/client/hooks/useGeolocation.ts — ~40 lines total
export interface GeolocationState {
  position: { lat: number; lng: number; accuracy: number } | null
  error: 'denied' | 'unavailable' | 'timeout' | null
  isWatching: boolean
}

export function useGeolocation(enabled: boolean): GeolocationState {
  // navigator.geolocation.watchPosition internally
  // Cleans up clearWatch(id) on unmount or enabled=false
  // Returns null if permission denied or GPS unavailable
}
```

**Implementation notes:**
- Use `watchPosition` (not `getCurrentPosition`) so the dot updates as user walks
- `enableHighAccuracy: true` activates GPS chip on mobile — slower first fix, more battery, more accurate
- Only snap to nearest node if `coords.accuracy < 30` (meters) — above 30m the dot is too imprecise to be useful for room-level navigation; still show the dot but do not auto-set as start point
- Error handling: `PERMISSION_DENIED (1)` = hide dot silently; `POSITION_UNAVAILABLE (2)` = toast "GPS unavailable"; `TIMEOUT (3)` = retry once

### Technology: Linear interpolation (pure math, no library)

GPS-to-normalized-coordinate conversion is ~15 lines of arithmetic. For campus-scale
distances (hundreds of meters), linear interpolation is accurate to sub-meter precision —
Earth's curvature effect is negligible at this scale. No projection library (proj4, Turf.js)
is needed. Confidence: HIGH.

```typescript
// src/shared/gps.ts — new utility file (~20 lines)
export interface GpsBounds {
  latMin: number; latMax: number
  lngMin: number; lngMax: number
}

export function gpsToNormalized(
  lat: number,
  lng: number,
  bounds: GpsBounds,
): { x: number; y: number } | null {
  if (lat < bounds.latMin || lat > bounds.latMax ||
      lng < bounds.lngMin || lng > bounds.lngMax) {
    return null  // outside the floor plan bounds — GPS not on this floor
  }
  // x = longitude interpolated left-to-right
  const x = (lng - bounds.lngMin) / (bounds.lngMax - bounds.lngMin)
  // y = latitude inverted (lat increases north = up on map = lower y value)
  const y = 1 - (lat - bounds.latMin) / (bounds.latMax - bounds.latMin)
  return { x, y }
}
```

### Technology: O(n) nearest-node scan (pure JS, no library)

With <500 nodes per floor, a linear scan using `Math.hypot` takes under 1ms. No spatial
index (rbush, kdbush) is needed. Confidence: HIGH.

```typescript
// Inline in FloorPlanCanvas.tsx or extracted to gps.ts
function findNearestNode(
  pos: { x: number; y: number },
  nodes: NavNode[],
  maxDistNormalized = 0.1,  // ignore nodes >10% of floor plan away
): NavNode | null {
  let nearest: NavNode | null = null
  let minDist = maxDistNormalized
  for (const node of nodes) {
    const d = Math.hypot(node.x - pos.x, node.y - pos.y)
    if (d < minDist) { minDist = d; nearest = node }
  }
  return nearest
}
```

---

## Feature 2: Admin GPS Bounds Configuration

### Technology: Drizzle ORM — 4 new nullable real columns on `floors`

No new library. Drizzle handles nullable `real` columns natively. Adding nullable columns to
PostgreSQL is safe on existing data — all existing rows default to NULL. Confidence: HIGH.

**Schema change:**

```typescript
// src/server/db/schema.ts — add to existing floors table definition
gpsLatMin: real('gps_lat_min'),   // nullable — null = GPS not configured
gpsLatMax: real('gps_lat_max'),
gpsLngMin: real('gps_lng_min'),
gpsLngMax: real('gps_lng_max'),
```

**Migration command:** `npx drizzle-kit generate` produces 4× `ALTER TABLE floors ADD COLUMN ... REAL` statements. No data loss risk.

**Shared type change:**

```typescript
// src/shared/types.ts — add to NavFloor interface
gpsLatMin?: number
gpsLatMax?: number
gpsLngMin?: number
gpsLngMax?: number
```

**Admin UI:** Input fields for the 4 GPS bounds coordinates per floor, added to
`ManageFloorsModal.tsx`. Zod validation: `z.number().min(-90).max(90)` for lat,
`z.number().min(-180).max(180)` for lng, plus `latMin < latMax` and `lngMin < lngMax` cross-field checks.

---

## Feature 3: Pinch-Zoom Focal Point Fix

### Technology: Math fix to useMapViewport.ts — no library, no Konva upgrade

**Root cause (identified from source inspection of `src/client/hooks/useMapViewport.ts`):**

The zoom portion of `handleTouchMove` (lines 146–162) is correct — it already computes
`pointTo` in stage-local coordinates and adjusts `stage.position()` so the touch center
stays fixed during scale changes.

The rotation portion (line 167) is incorrect:

```typescript
// CURRENT CODE — WRONG:
stage.rotation(stage.rotation() + (angleDiff * 180) / Math.PI)
// This rotates the stage around its (0,0) origin (top-left of canvas),
// not around the touch midpoint. The map swings around the corner.
```

When Konva rotates a Stage, it rotates the canvas DOM element around the stage's own `(x:0,
y:0)` in screen space. To pivot around the touch center, the stage's `x/y` position must be
adjusted to compensate — the same math used for "rotate a node around an arbitrary point."

**Correct fix — rotate around touch midpoint:**

```typescript
// REPLACEMENT for the rotation block in handleTouchMove:
if (lastAngle.current !== null) {
  const angleDiffRad = angle - lastAngle.current
  const angleDiffDeg = (angleDiffRad * 180) / Math.PI

  // Pivot = touch midpoint in screen coordinates
  const pivotX = center.x
  const pivotY = center.y

  // Vector from pivot to current stage origin
  const stageX = stage.x()
  const stageY = stage.y()
  const dx = stageX - pivotX
  const dy = stageY - pivotY

  // Rotate that vector by angleDiffRad to find new stage origin position
  const cos = Math.cos(angleDiffRad)
  const sin = Math.sin(angleDiffRad)

  stage.rotation(stage.rotation() + angleDiffDeg)
  stage.position({
    x: pivotX + dx * cos - dy * sin,
    y: pivotY + dx * sin + dy * cos,
  })
}
```

This is the standard affine "rotate around arbitrary pivot" transform:
`newPoint = pivot + rotate(oldPoint - pivot, angle)`.

**Konva APIs used (all existing in Konva 10.2.0):**
- `stage.rotation()` — get/set rotation in degrees — already used in codebase
- `stage.position()` / `stage.x()` / `stage.y()` — already used in codebase
- `Math.cos` / `Math.sin` — pure JS, no new imports

No Konva version upgrade is needed. Confidence: HIGH — all APIs confirmed present in existing codebase.

**Secondary issue — zoom focal point when stage is rotated:**

The current `pointTo` calculation does not account for stage rotation when computing
local-space coordinates:

```typescript
// CURRENT (slightly wrong when stage is rotated):
const pointTo = {
  x: (center.x - stage.x()) / stage.scaleX(),
  y: (center.y - stage.y()) / stage.scaleY(),
}
```

When `stage.rotation()` is nonzero, the stage coordinate system is rotated relative to screen
space, so simple subtraction/division gives incorrect local coordinates. The fully correct
version uses Konva's own inverse transform matrix:

```typescript
// FULLY CORRECT (handles rotation + scale + position together):
const transform = stage.getAbsoluteTransform().copy().invert()
const localCenter = transform.point({ x: center.x, y: center.y })
// localCenter is now in stage-local coordinates regardless of rotation
```

`stage.getAbsoluteTransform()` returns a `Konva.Transform` (the combined
position + scale + rotation matrix). `.copy().invert()` gives the screen-to-local transform.
`.point()` applies it to a screen-space coordinate.

**Recommendation:** Fix both issues together. The rotation fix is mandatory; the transform
fix makes zoom-while-rotated correct too. Both are in `handleTouchMove`, same file, same PR.

---

## Feature 4: Multi-Floor Directions UX

### Technology: TypeScript/React — no new libraries

Changes to `useRouteDirections.ts` and `DirectionsSheet.tsx` only. The existing `floorMap`
passed into `useRouteDirections` already provides floor metadata for floor-change steps.

---

## Feature 5: Admin Floor-Connector Visual Linking

### Technology: React state + Konva canvas interaction — no new libraries

The admin editor already has the infrastructure (`useEditorState.ts`, `MapEditorCanvas.tsx`,
`NodeMarkerLayer.tsx`) for selecting nodes and displaying connector metadata. This feature
adds a two-step selection UI to visually link two nodes across floors, writing to the
existing `connectsToNodeAboveId` / `connectsToNodeBelowId` fields.

---

## Summary: Stack Additions for v1.6

| Capability | Solution | New Package? |
|------------|----------|-------------|
| GPS position data | `navigator.geolocation` (browser API) | No |
| GPS-to-normalized transform | Custom `src/shared/gps.ts` (~20 lines) | No |
| Nearest-node snap | Inline O(n) scan in `FloorPlanCanvas.tsx` | No |
| GPS bounds storage (DB) | 4 nullable `real` columns via Drizzle ORM | No |
| GPS bounds validation | Existing Zod (cross-field `refine`) | No |
| Pinch-zoom focal point fix | Math fix to `useMapViewport.ts` | No |
| Rotation pivot fix | Math fix to `useMapViewport.ts` | No |
| Multi-floor directions | TypeScript/React logic only | No |
| Admin connector linking | React state + existing Konva APIs | No |

**Zero new npm packages for v1.6.**

---

## Packages to Explicitly NOT Add

| Package | Why Not |
|---------|---------|
| `leaflet` / `mapbox-gl` / `openlayers` | Full tile-server mapping SDKs — vastly overengineered for a GPS dot on a static floor plan image; incompatible coordinate system |
| `proj4` / `@turf/turf` | Coordinate projection libraries — linear interpolation is accurate at campus scale; projection error < 0.1m |
| `hammer.js` | Gesture library — conflicts with Konva's own touch event pipeline; Konva handles raw `TouchEvent` directly and `hitOnDragEnabled = true` already resolves the second-touch issue |
| `@use-gesture/react` | React gesture library — same conflict risk as Hammer.js; the existing direct-Konva-mutation pattern (critical for 60fps) cannot be mixed with React-state-based gesture handlers |
| `react-use-geolocation` | Thin wrapper adding zero value over a custom 20-line hook; introduces a dependency that may not be maintained |
| `geolib` | Geospatial utility library — no spherical math is needed at campus scale; haversine formula is overkill for <1km distances |
| `rbush` / `kdbush` | Spatial indexing — node counts per floor are <500; O(n) scan is faster than index overhead for this size |
| Any Konva upgrade | Konva 10.2.0 already has all needed APIs (`getAbsoluteTransform`, `Transform.invert`, `Transform.point`); upgrading for no reason risks introducing regressions |

---

## Integration Points

| Feature | Files Changed | Notes |
|---------|--------------|-------|
| GPS bounds config (admin) | `schema.ts`, `types.ts`, `ManageFloorsModal.tsx`, server map route | New DB columns + form fields |
| GPS "you are here" | new `src/client/hooks/useGeolocation.ts`, new `src/shared/gps.ts`, `FloorPlanCanvas.tsx` | New hook + utility + Konva Circle layer |
| GPS dot rendering | `FloorPlanCanvas.tsx` — new Konva `Circle` + `Group` in a dedicated `<Layer>` | Counter-scale like `LandmarkMarker` for constant screen size |
| Nearest-node snap | `FloorPlanCanvas.tsx` — calls `routeSelection.setStart()` when GPS node found | Uses existing `useRouteSelection` hook API |
| Pinch-zoom + rotation fix | `src/client/hooks/useMapViewport.ts` — `handleTouchMove` only | ~15 lines changed in one function |
| Multi-floor directions | `src/client/hooks/useRouteDirections.ts`, `src/client/components/DirectionsSheet.tsx` | New step type for floor transitions |
| Admin connector linking | `src/client/pages/admin/MapEditorCanvas.tsx`, `src/client/hooks/useEditorState.ts` | New two-step selection mode |

---

## Confidence Assessment

| Area | Confidence | Source |
|------|------------|--------|
| Browser Geolocation API (no library needed) | HIGH | MDN Web Docs, Chrome Security blog |
| GPS-to-normalized linear interpolation | HIGH | Standard indoor mapping pattern; adequate at campus scale |
| No library needed for nearest-node snap | HIGH | O(n) scan confirmed sufficient for <500 nodes |
| Drizzle nullable real column safety | HIGH | Drizzle ORM docs + standard PostgreSQL ALTER TABLE behavior |
| Konva rotation-around-pivot math | HIGH | Standard affine transform; confirmed in longviewcoder.com + Konva issue #26 |
| `stage.getAbsoluteTransform().copy().invert()` API | HIGH | Confirmed in Konva Stage API docs; used in existing codebase transforms |
| Konva 10.2.0 sufficient (no upgrade) | HIGH | All required APIs present in current codebase |
| Indoor GPS accuracy 5–30m range | MEDIUM | MDN accuracy property docs + LogRocket article; actual performance varies by device/OS |
| 30m accuracy threshold for node snap | MEDIUM | Practical heuristic; exact value should be tunable via config |

---

## Sources

- [Geolocation API — MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)
- [GeolocationCoordinates.accuracy — MDN](https://developer.mozilla.org/en-US/docs/Web/API/GeolocationCoordinates/accuracy)
- [Geolocation: watchPosition() — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/watchPosition)
- [Geolocation API on Secure Contexts Only — Chrome Developers](https://developer.chrome.com/blog/geolocation-on-secure-contexts-only)
- [Multi-touch Canvas Scale with Pinch Zoom — Konva Official](https://konvajs.org/docs/sandbox/Multi-touch_Scale_Stage.html)
- [Zooming Stage Relative to Pointer Position — Konva Official](https://konvajs.org/docs/sandbox/Zooming_Relative_To_Pointer.html)
- [Position vs Offset — Konva Official](https://konvajs.org/docs/posts/Position_vs_Offset.html)
- [Konva.Stage API — Konva Official](https://konvajs.org/api/Konva.Stage.html)
- [Konva — rotate a shape around any point with simple math](https://longviewcoder.com/2020/12/15/konva-rotate-a-shape-around-any-point/)
- [Pinch Zoom jumps randomly — Konva Issue #1096](https://github.com/konvajs/konva/issues/1096)
- [Rotation Origin — Konva Issue #26](https://github.com/konvajs/konva/issues/26)
- [Drizzle ORM PostgreSQL Column Types](https://orm.drizzle.team/docs/column-types/pg)
- [Drizzle ORM Migrations](https://orm.drizzle.team/docs/migrations)
- [What you need to know while using the Geolocation API — LogRocket](https://blog.logrocket.com/what-you-need-know-while-using-geolocation-api/)

# Feature Landscape

**Domain:** Campus wayfinding / indoor navigation web app — v1.6 GPS & UX Refinements
**Researched:** 2026-03-09
**Confidence:** HIGH (GPS/geolocation), HIGH (gesture math), HIGH (directions UX), MEDIUM (admin linking UX patterns)

---

## Scope Note

This file covers **the five new v1.6 features only**. All v1.0 and v1.5 features are already shipped and documented in earlier research. The five features below are additive on top of an existing system that has: multi-floor A* routing, Konva.js canvas with touch gestures, per-floor route visualization, admin node/edge editor, floor connector nodes with `connectsToNodeAboveId`/`connectsToNodeBelowId`, and normalized 0-1 coordinate system.

---

## Table Stakes

Features users expect from each capability area. Missing these = the feature feels broken or incomplete.

| Feature | Why Expected | Complexity | Depends On |
|---------|--------------|------------|------------|
| **GPS "you are here" dot visible on campus map** | Google Maps, Apple Maps, and every campus wayfinding competitor (MazeMap, Mappedin blue dot) trains users to expect a real-time location indicator. Without it, users feel disoriented. | MEDIUM | Browser Geolocation API, GPS bounds stored per floor/campus, nearest-node snap logic |
| **GPS dot hides or degrades gracefully when accuracy is poor** | Indoor GPS via browser geolocation is notoriously inaccurate (20-50m+). Showing a confident dot at ±40m accuracy misleads users. The accuracy circle is the standard pattern (Google Maps light-blue circle). Hide dot when accuracy > 50m. | LOW | `position.coords.accuracy` threshold check |
| **GPS permission denied → clean fallback to manual start selection** | Browsers require explicit user permission. ~15-30% of users deny location on first ask, or have previously denied it. A broken "loading…" state or silent failure destroys trust. The expected pattern is: detect denial → show explanatory message → fall back to manual start-point tap/search. | LOW | Permissions API + existing manual selection flow |
| **Geolocation snaps to nearest walkable node as route start** | Raw lat/lng lands on a wall, courtyard, or area outside the floor plan. Users expect their location to resolve to a sensible start point — the nearest valid node — not an arbitrary canvas coordinate. | MEDIUM | Lat/lng → normalized 0-1 transform + nearest-node distance search over existing graph |
| **Admin can configure lat/lng bounds per floor plan and campus map** | Without a bounding box, lat/lng → canvas coordinate math is impossible. Every geo-referencing workflow (HoloBuilder, QGIS, Mappedin) requires defining at least the two opposite corners of the map with real-world coordinates. | MEDIUM | New `gpsBounds` column on buildings/floors table; admin UI to enter NW + SE corner lat/lng |
| **Multi-floor directions show a visual divider at each floor transition** | Users lose track of which segment of directions applies to which floor when the list is a flat stream. Mappedin, MazeMap, and the MDPI indoor navigation landmark research all use section headers or dividers at floor changes. Users expect "you are now on Floor 3" or a floor label before the next group of steps. | LOW | Existing per-floor route segments; connector node metadata already identifies transition points |
| **Multi-floor directions name the specific connector (stairs/elevator)** | "Go to the stairs" is ambiguous when a building has 4 stairwells. Research on indoor landmark-based instructions (MDPI 2017) shows users navigate better when given specific landmark names: "Take Staircase B to Floor 3" vs "Take stairs to Floor 3." The connector node's `name` field must appear in the step. | LOW | Existing connector node `name` property already in DB schema |
| **Pinch-to-zoom uses the touch midpoint as zoom origin** | When zoom origin is (0,0) or the stage center, the map jumps away from what the user is looking at during pinch. Every correctly-implemented mapping app (Google Maps, Apple Maps, MazeMap, Mappedin web SDK) keeps the content under the fingers stationary during zoom. This is the standard Konva multi-touch scale pattern: compute center between touches, apply scale-relative-to-pointer. | MEDIUM | Konva stage `touchmove`, `getCenter()` helper, stage position + scale simultaneous update |
| **Two-finger rotation pivots around the touch midpoint** | Same principle as pinch-zoom focal point. If rotation pivots around (0,0), the map rotates wildly off screen. Users expect the content between their fingers to stay anchored. Academic research and standard implementations agree: midpoint of the two touch points is the pivot. | MEDIUM | Same gesture handler as pinch-zoom — extend to track rotation angle delta between touchmove events |

---

## Differentiators

Features that go beyond what users expect and create meaningful value.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **GPS accuracy ring (uncertainty circle) on campus dot** | Shows the GPS accuracy radius visually as a semi-transparent circle around the dot, exactly like Google Maps. Users can judge for themselves whether the position is reliable enough to use. Most campus web apps either omit the dot or show it without an accuracy ring. | LOW | Draw a Konva Circle with radius = `accuracy_meters` converted to canvas pixels using the GPS bounds scale; counter-scale like landmark markers |
| **GPS dot auto-snaps to start and re-routes when user taps "use my location"** | Instead of forcing users to always manually set a start point, a single "use my location" button resolves their GPS position, snaps to nearest node, and immediately begins routing to any already-selected destination. MazeMap and Mappedin offer this as a core interaction. | MEDIUM | Ties GPS snap logic to the existing start-point selection state machine |
| **Floor-transition step uses directional language (up/down) + floor number** | "Take Elevator A up to Floor 3" is more useful than "Take Elevator A to Floor 3." The direction (up/down) is derivable from the floor numbers and already-known current floor. Low implementation cost, meaningful clarity gain. | LOW | Compare source and destination floor numbers; prepend "up" or "down" to the step text |
| **Admin floor-connector linking via floor-switcher select UI (no manual ID entry)** | Current system requires admins to manually enter `connectsToNodeAboveId` as a raw node ID. A dropdown or modal that loads the nodes on the adjacent floor and lets admin click the matching node reduces admin error and time. This is the UX pattern used by Situm editor and NavVis graph management tools. | MEDIUM | New UI component in admin editor: "Link to floor above/below" → switch to adjacent floor, click a node; stores the resolved ID |
| **GPS bounds entry with map-click georeferencing helper** | Rather than typing lat/lng coordinates blindly, admin can open a helper modal that shows an OpenStreetMap tile overlay and lets them click to set the NW and SE corners of the floor plan. More discoverable than a text input pair. | HIGH | Requires embedding a lightweight tile map (Leaflet or similar) in admin panel; high complexity for moderate gain |
| **"Located near [connector name]" in GPS snap feedback** | When the GPS dot snaps to a node that is a floor-connector (stair/elevator), display a small indicator: "You appear to be near Staircase A." Helps users confirm the snap makes sense. | LOW | Check snapped node type; if connector, show name in GPS status banner |

---

## Anti-Features

Features to explicitly not build in v1.6.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Real-time GPS tracking (continuous watchPosition updates moving the dot)** | Indoor GPS from a browser is not accurate enough for real-time tracking. A dot that jumps 20-40 meters randomly as the user walks is worse than no dot. Mappedin's own documentation requires dedicated IPS hardware (BLE beacons, WiFi fingerprinting) for reliable real-time blue-dot. The project explicitly lists this as out-of-scope. | One-shot GPS fix on "use my location" button tap. The dot is a start-point setter, not a live tracker. |
| **Compass-based map rotation (device orientation API)** | Requires `DeviceOrientationEvent` which is behind a permission on iOS 13+, has poor accuracy, and causes disorienting map spinning when the user moves slightly. Google Maps makes this opt-in for good reason. | Keep map rotation as a deliberate two-finger gesture only. Do not auto-rotate to match compass. |
| **GPS indoors with floor detection** | Determining which floor the user is on from browser sensors (barometric pressure, GPS altitude) requires sensor fusion and calibration beyond the scope of this milestone. Altitude from GPS is very inaccurate (±15-25m). | GPS dot is only shown on the campus outdoor map. When a user enters a building and selects a floor manually, they are already on the correct floor. No indoor floor auto-detection. |
| **Map tile embedding in main student view** | Adding real-world tile maps (Google Maps, Leaflet OSM) under the campus floor plan for outdoor segments creates licensing complexity, performance overhead, and visual inconsistency. The campus outdoor map is already a hand-drawn overhead image per project spec. | Keep the existing campus overhead image as the outdoor map layer. GPS dot lands on this image. |
| **Admin GPS bounds via copy-paste from Google Maps** | While a Google Maps link parser sounds convenient, Google URL formats change and parsing them is fragile. | Input two fields: NW corner lat/lng and SE corner lat/lng as plain decimals. Provide a bboxfinder.com or OpenStreetMap link in the admin UI hint text so admins can look up coordinates externally. |
| **Inertia/momentum scrolling for pinch-zoom gestures** | Inertia adds animation state, velocity tracking, and deceleration curves. The existing Konva drag implementation handles pan momentum natively for single-finger drag. Adding inertia to pinch-zoom is a high complexity addition for low perceptible value. | Fix the focal point and pivot correctness (which is the actual bug). Don't add inertia on top. |
| **Floor-connector link visualization as animated arrows on the map** | Showing animated "you are connected to Floor 3 via this node" overlays on the student map adds visual clutter and confusion. Connector links are admin metadata. | Floor-transition information belongs in the step-by-step directions list, not the map canvas. |

---

## Feature Dependencies (v1.6 Specific)

```
[GPS "You Are Here" Dot — student view]
    └──requires──> [GPS Bounds configured per floor/campus] (admin feature)
    └──requires──> [Lat/Lng → Normalized 0-1 Transform] (new math utility)
    └──requires──> [Nearest-Node Snap] (distance search over existing graph nodes)
    └──depends on──> [Existing campus map rendering] (dot is drawn on existing Konva stage)

[GPS Bounds Configuration — admin]
    └──requires──> [New gpsBounds schema] (new DB column: northWest: {lat, lng}, southEast: {lat, lng})
    └──depends on──> [Existing buildings/floors entity model]

[Nearest-Node Snap]
    └──requires──> [GPS Bounds configured] (to convert lat/lng to canvas coords)
    └──depends on──> [Existing node graph] (searches over nodes already in DB)

[Multi-Floor Directions — floor-transition step]
    └──requires──> [Existing per-floor route segments] (already computed in v1.5)
    └──requires──> [Connector node name field] (already in DB schema)
    └──enhances──> [Existing step-by-step directions] (adds dividers + transition steps)

[Admin Floor-Connector Linking UI]
    └──requires──> [Existing admin floor tabs and building selector] (already in v1.5)
    └──requires──> [Existing connectsToNodeAboveId/BelowId metadata] (already stored)
    └──replaces──> [Manual node ID entry] (removes the raw ID text input)

[Pinch-Zoom Focal Point Fix]
    └──requires──> [Existing Konva touchmove handler] (refactor of existing code)
    └──requires──> [getCenter() / getDistance() touch helpers] (new math utilities)
    └──is independent of──> [GPS features, directions changes, admin linking]

[Two-Finger Rotation Pivot Fix]
    └──requires──> [Same gesture handler as pinch-zoom fix] (implemented together)
    └──requires──> [Rotation angle delta tracking between touchmove events]
```

### Dependency Notes

- **GPS features form a strict chain**: Bounds must be configured before any GPS dot can appear. Admin configures bounds → student gets dot. Do not ship the student-facing GPS feature in a phase before the admin bounds configuration phase.
- **Directions improvements are independent**: The floor-transition step and divider enhancement only touches the directions rendering logic. It does not depend on GPS or gesture work.
- **Admin connector linking is independent**: It is a pure UI improvement over the existing metadata entry flow. The underlying data model (`connectsToNodeAboveId`) is unchanged.
- **Gesture fix is standalone**: The pinch-zoom and rotation fix is a pure refactor of the existing Konva touch handler. It does not share state with GPS, directions, or admin work.
- **GPS snap uses normalized 0-1 coords**: The lat/lng → canvas coordinate transform produces values in 0-1 space (matching the existing coordinate system). The nearest-node search operates entirely in 0-1 space using Euclidean distance. No pixel coordinates involved.

---

## MVP Recommendation for v1.6

### Build (required for milestone)

1. **Multi-floor directions — floor-transition dividers + connector naming** — Purely additive to existing directions output. No schema changes. Highest user value, lowest risk. Build first.
2. **Admin GPS bounds setup** — New schema + simple admin form (two coordinate pairs). Required blocker for all GPS student features. Must ship before GPS dot.
3. **GPS "you are here" dot — outdoor campus map only** — One-shot geolocation on "use my location" tap, accuracy ring, nearest-node snap as start-point setter, fallback to manual on denial. Scope strictly to the campus outdoor map (floor 0) to avoid indoor accuracy problems.
4. **Pinch-zoom focal point fix** — Touch midpoint as zoom origin. Refactor of existing `touchmove` handler. Independent of all other work.
5. **Two-finger rotation pivot fix** — Extend same gesture handler. Build in same phase as pinch-zoom fix.
6. **Admin floor-connector linking UI** — Replaces manual ID entry with floor-switching select workflow. Admin quality-of-life improvement. Build after GPS and gesture work is stable.

### Defer

- **GPS bounds georeferencing helper** (map-click UI): High complexity, low urgency. Plain text inputs with external tool link is sufficient for v1.6.
- **Real-time GPS tracking**: Explicitly out-of-scope; indoor accuracy insufficient.
- **Compass rotation / device orientation**: Out-of-scope; permission friction + poor accuracy.

---

## Complexity Summary

| Feature | Complexity | Reasoning |
|---------|------------|-----------|
| Multi-floor directions — dividers + connector naming | LOW | Pure rendering change on existing data; connector name is already in DB |
| Admin GPS bounds configuration | LOW-MEDIUM | New DB column + simple admin form (2 lat/lng pairs); CRUD only |
| GPS dot — accuracy ring, one-shot fix, nearest-node snap | MEDIUM | New math utility (lat/lng ↔ 0-1), accuracy ring Konva shape, permission error handling |
| GPS fallback UX on permission denied | LOW | Error code detection + existing manual selection flow |
| Pinch-zoom focal point fix | MEDIUM | Konva multi-touch math: getCenter(), getDistance(), simultaneous scale+position update |
| Two-finger rotation pivot fix | MEDIUM | Extends same handler; angle delta between two touchmove frames; likely coupled with zoom fix |
| Admin floor-connector linking UI | MEDIUM | New modal/panel component; must load adjacent floor nodes; update existing node metadata flow |

---

## Edge Cases by Feature

### GPS "You Are Here"

- **GPS denied on first prompt**: Catch `PositionError.PERMISSION_DENIED` (code 1). Show inline message: "Location access denied — tap the map to set your start point." Do not re-prompt.
- **GPS position times out**: Catch `PositionError.TIMEOUT` (code 3). Show: "Couldn't get your location — tap to set start manually."
- **Accuracy > 50m**: Hide dot. Show: "Location accuracy too low to display." This is the threshold used by Mappedin's blue dot SDK and common in implementations reviewed.
- **GPS position lands outside configured bounds**: The lat/lng is outside the bounding box of the floor plan. Show: "Your location appears to be outside this campus." Do not draw a dot outside the canvas.
- **No GPS bounds configured for a floor**: GPS feature is silently unavailable for that floor. The "use my location" button should be disabled or hidden when `gpsBounds` is null for the current context.
- **User snaps to a node that is far from their actual position**: Snap is best-effort. Don't show distance-to-snapped-node; just use it. The start-point remains tappable for correction.

### Admin GPS Bounds

- **Admin enters lat/lng with incorrect order (S before N or E before W)**: Validate that northWest.lat > southEast.lat and northWest.lng < southEast.lng. Show inline error.
- **Admin saves bounds for a floor that has no nodes yet**: Valid — bounds are independent of nodes. GPS will work once nodes are added.
- **Admin needs to find the correct coordinates**: Add helper text with a link to openstreetmap.org or bboxfinder.com so admin can look up coordinates visually.

### Multi-Floor Directions

- **Route only uses one floor (no floor transition)**: No divider, no transition step. Existing rendering unchanged.
- **Route uses 3+ floors**: One divider + transition step per floor change, not just start and end floors.
- **Connector node has no name set**: Fall back to connector type label: "Take Staircase to Floor N" or "Take Elevator to Floor N." Do not show undefined/null.
- **Accessible and standard routes use different connectors**: Each route's transition steps may name different connectors. This is correct and expected behavior — do not merge them.

### Pinch-Zoom / Rotation Gesture

- **Single finger on canvas during attempted pinch**: Guard: only apply pinch logic when `e.touches.length === 2`. Single-touch remains pan.
- **Rapid pinch reversal direction**: Stable midpoint tracking prevents jump. Compute fresh center and distance on every `touchmove` frame from raw touch positions.
- **Zoom hits min/max scale limits during pinch**: Clamp scale to existing min/max bounds (already enforced). Do not allow stage to invert.
- **Rotation combined with pinch simultaneously**: Both transforms apply in the same `touchmove` handler. Rotation delta + scale delta + position delta applied atomically in one `stage.setAttrs()` call to prevent frame tearing.

### Admin Floor-Connector Linking

- **Admin tries to link a node to itself or to a node on the same floor**: Validate: target node must be on a different floor (specifically the floor above or below). Show error if same floor selected.
- **Linked node is later deleted**: The dangling ID reference must not crash routing. The existing two-pass `buildGraph` should skip `connectsToNodeAboveId` references to non-existent nodes gracefully (this should be verified in implementation).
- **Admin wants to unlink a connector**: Provide a "Remove link" action that clears `connectsToNodeAboveId` / `connectsToNodeBelowId` to null.
- **A staircase spans more than 2 floors**: The existing schema only stores "above" and "below" (two references). Multi-floor spanning staircases require chaining: floor 1 node links to floor 2 node, floor 2 node links to floor 3 node. The linking UI must support editing each floor's node independently.

---

## Sources

- **MDN Geolocation API** — [developer.mozilla.org/en-US/docs/Web/API/Geolocation_API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API) — Standard API, `accuracy` property, error codes. **HIGH confidence** (official spec).
- **MDN Geolocation.watchPosition** — [developer.mozilla.org/en-US/docs/Web/API/Geolocation/watchPosition](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/watchPosition) — `enableHighAccuracy`, `timeout`, `maximumAge` options. **HIGH confidence**.
- **Mappedin Blue Dot developer docs** — [developer.mappedin.com/web-sdk/blue-dot](https://developer.mappedin.com/web-sdk/blue-dot) — Blue dot hidden when accuracy > 50m; accuracy shading option. **MEDIUM confidence** (official SDK docs).
- **MazeMap Blue Dot Navigation blog** — [mazemap.com/post/blue-dot-navigation-part-1-outdoor-positioning](https://www.mazemap.com/post/blue-dot-navigation-part-1-outdoor-positioning) — Outdoor GPS accuracy discussion; transition to indoor IPS. **MEDIUM confidence**.
- **Konva Multi-touch Scale Stage** — [konvajs.org/docs/sandbox/Multi-touch_Scale_Stage.html](https://konvajs.org/docs/sandbox/Multi-touch_Scale_Stage.html) — Official example: getCenter(), getDistance(), simultaneous scale+position update. **HIGH confidence** (official library docs).
- **Konva Zooming Relative to Pointer** — [konvajs.org/docs/sandbox/Zooming_Relative_To_Pointer.html](https://konvajs.org/docs/sandbox/Zooming_Relative_To_Pointer.html) — Focal-point zoom math: mousePointTo formula, scale × position update pattern. **HIGH confidence**.
- **Situm Floor Transition Paths docs** — [situm.com/docs/how-to-create-wayfinding-paths/](https://situm.com/docs/how-to-create-wayfinding-paths/) — Staircase/elevator node linking workflow across floors. **MEDIUM confidence** (competitor product docs).
- **NavVis Managing Navigation Graphs** — [knowledge.navvis.com/docs/managing-navigation-graphs](https://knowledge.navvis.com/docs/managing-navigation-graphs) — Edge creation between floor-level nodes; manual graph editing. **MEDIUM confidence**.
- **MDPI Indoor Navigation Landmark Instructions (2017)** — [mdpi.com/2220-9964/6/6/183](https://www.mdpi.com/2220-9964/6/6/183) — "Use the lift to go to the 2nd floor" as a directional step naming standard. **HIGH confidence** (peer-reviewed research).
- **getAccurateCurrentPosition GitHub** — [github.com/gregsramblings/getAccurateCurrentPosition](https://github.com/gregsramblings/getAccurateCurrentPosition) — Pattern for waiting for accuracy threshold before accepting fix. **MEDIUM confidence**.
- **Mapbox GL JS accuracy threshold issue #9177** — [github.com/mapbox/mapbox-gl-js/issues/9177](https://github.com/mapbox/mapbox-gl-js/issues/9177) — Community pattern: hide dot when accuracy exceeds threshold. **MEDIUM confidence** (real-world implementation pattern).
- **HoloBuilder GPS-enabled floor plans** — [help.holobuilder.com/en/articles/5775768](https://help.holobuilder.com/en/articles/5775768-gps-enabled-floor-plans-how-to-add-gps-coordinates-to-a-sheet-in-the-web-editor) — Two-corner georeferencing workflow (NW + SE corners). **MEDIUM confidence** (competitor admin UX reference).
- **Affine transform coordinate mapping** — [medium.com/@suverov.dmitriy/how-to-convert-latitude-and-longitude-coordinates-into-pixel-offsets](https://medium.com/@suverov.dmitriy/how-to-convert-latitude-and-longitude-coordinates-into-pixel-offsets-8461093cb9f5) — Linear interpolation formula for lat/lng to pixel using bounding box. **MEDIUM confidence**.

---
*Feature research for: CampusNav v1.6 — GPS Integration & UX Refinements*
*Researched: 2026-03-09*

# Domain Pitfalls

**Domain:** Campus wayfinding / indoor navigation — v1.6 feature additions
**Researched:** 2026-03-09
**Confidence:** HIGH (code-level analysis of existing v1.5 codebase + targeted web research)
**Scope:** Pitfalls specific to ADDING GPS positioning, Konva.js touch gesture focal-point fixes, multi-floor direction step generation, and admin floor-connector linking UI to an existing v1.5 system.

---

## Critical Pitfalls

Mistakes that cause rewrites, silent data corruption, or broken routing.

---

### Pitfall C-1: GPS Coordinate Transform Inverts or Offsets the "You Are Here" Dot

**What goes wrong:**
The admin defines GPS bounds as `{ northLat, southLat, westLng, eastLng }` for a floor plan. The client receives a GPS fix and maps it to a normalized 0–1 coordinate. The dot appears in the wrong location — mirrored, offset by a constant, or off by a factor. The bug only appears on device (not in unit tests), and varies by floor orientation.

**Why it happens:**
Three distinct errors are easy to conflate:

1. **Latitude axis inversion.** Latitude increases northward (up on a map), but canvas Y increases downward. The naive mapping `normY = (lat - southLat) / (northLat - southLat)` gives `normY = 1.0` at the north edge and `normY = 0.0` at the south edge — which is inverted relative to the 0-1 coordinate system where `y=0` is the top of the image. The correct mapping is `normY = 1.0 - (lat - southLat) / (northLat - southLat)` (or equivalently `(northLat - lat) / (northLat - southLat)`).

2. **Bounds entered in wrong order.** Admin UI labelled `"North lat" / "South lat"` is easy to fill in backwards (south value in north field), silently swapping the Y axis.

3. **Longitude/Latitude swapped in the bounds struct.** If the DB column order or the admin form submission puts `lat` where `lng` is expected, the dot will appear at a wildly wrong position and the error is invisible until tested on an actual device outdoors.

**Consequences:**
- GPS dot renders in a wall, outside the building, or on the wrong floor entirely.
- Nearest-node snap snaps to the wrong node, placing the student at the wrong start point.
- Bug is device-only (requires real GPS fix); CI never catches it.

**Prevention:**
- Name the transform function explicitly and unit-test it: `gpsToNormalized(lat, lng, bounds)` should return `{ x: 0.5, y: 0.5 }` for the geographic center of the bounds.
- Include a visible sanity-check in the admin GPS-bounds configuration UI: after entering bounds, show a test dot at the building's own approximate center lat/lng and verify it renders in the center of the floor plan.
- Validate that `northLat > southLat` and `eastLng > westLng` on input; return a form error immediately if not.
- Document axis convention in code: `// normY = 0 is TOP of image = NORTH of building`.

**Detection:**
- GPS dot appears at edge of floor plan (likely axis swap or wrong bound order).
- GPS dot is in correct X but wrong Y or vice versa (latitude/longitude swapped).
- Dot position looks correct on desktop (where you entered a test coordinate) but wrong on-device outdoors.

**Phase to address:** GPS bounds configuration (admin) phase. Write `gpsToNormalized` with unit tests before integrating Geolocation API.

---

### Pitfall C-2: Pinch-Zoom Position Calculation Breaks When Stage Has Rotation

**What goes wrong:**
The existing `handleTouchMove` in `useMapViewport.ts` computes the pinch focal point using raw `clientX/clientY` from touch events. When the stage has been rotated by the user (the two-finger rotation gesture is already implemented), the `pointTo` calculation — which converts the touch midpoint from screen space to stage-local space — ignores stage rotation. The formula `(center.x - stage.x()) / stage.scaleX()` only accounts for translation and scale, not rotation. The result: after any rotation, pinch-zoom jumps the stage to a wrong position.

**Why it happens:**
The current code:
```ts
const pointTo = {
  x: (center.x - stage.x()) / stage.scaleX(),
  y: (center.y - stage.y()) / stage.scaleY(),
}
```
This is the correct formula only when `stage.rotation() === 0`. With rotation applied, the stage transform is a combination of translate → scale → rotate, and inverting it requires using the full inverse transform matrix, not just dividing by scale.

**Consequences:**
- After rotating the floor plan, every subsequent pinch-zoom causes the floor plan to jump unpredictably.
- The bug is invisible during desktop testing (mouse wheel zoom ignores rotation because `handleWheel` has the same issue but rotation is rarely applied via mouse).
- On mobile, rotation + zoom is the natural gesture sequence and the bug is immediately visible.

**Prevention:**
Use Konva's built-in transform inversion for all pointer-to-stage conversions:
```ts
const transform = stage.getAbsoluteTransform().copy().invert()
const pointTo = transform.point(center) // correct regardless of rotation/scale/translate
```
This works for `handleWheel` (pointer-centric zoom) and `handleTouchMove` (pinch focal point) equally.

**Detection:**
- Zoom works correctly at `rotation=0`, breaks after any two-finger rotate.
- After rotating 90 degrees, pinch-zoom moves the stage horizontally instead of vertically.

**Phase to address:** Konva gesture focal-point fix phase. Fix `handleWheel` and `handleTouchMove` simultaneously — they share the same math error.

---

### Pitfall C-3: Konva Draggable Stage Fights Two-Finger Gestures, Causing Stage Jump

**What goes wrong:**
When the Stage is `draggable`, Konva handles `touchstart` of the first finger and begins a drag. When the second finger lands, `handleTouchMove` calls `stage.stopDrag()`. But if `Konva.hitOnDragEnabled` is not set, the second touch event is swallowed during drag and `stopDrag` is called too late — after Konva has already translated the stage by the delta of the first finger alone. The result: the stage visibly jumps on every two-finger gesture start.

**Why it happens:**
The existing code already sets `Konva.hitOnDragEnabled = true` at the top of `useMapViewport.ts` for exactly this reason. The pitfall is forgetting to set it when the file is refactored or when a new Stage component is introduced (e.g., an admin canvas that duplicates some of this logic). The `hitOnDragEnabled` flag is a module-level side effect — it must be set once before any Stage is used.

**Consequences:**
- Without the flag, second-touch events are swallowed, so `stage.isDragging()` check in `handleTouchMove` never fires on the first frame of a two-finger gesture.
- Stage jumps by `(firstTouchDelta)` whenever a pinch starts.

**Prevention:**
- Keep `Konva.hitOnDragEnabled = true` at module scope in `useMapViewport.ts`. Do not move it inside the hook body (would re-set on every render but that's not the problem; the problem is forgetting it).
- Add a comment documenting why it exists: `// REQUIRED: Without this, 2nd touch is swallowed during drag; pinch-zoom fails.`
- When creating any new Konva Stage (e.g., for the GPS-bounds admin configuration map), ensure this flag is set.

**Detection:**
- Pinch-zoom starts with a visible jump before settling.
- `stage.isDragging()` is never `true` at the start of `touches.length >= 2` branch.

**Phase to address:** Konva gesture focal-point fix phase — verify this flag is present wherever `useMapViewport` is used.

---

### Pitfall C-4: GPS Nearest-Node Snap Uses Wrong Distance Metric (Mixed Coordinate Spaces)

**What goes wrong:**
The GPS dot is at normalized coordinates `(gpsNormX, gpsNormY)`. The "snap to nearest node" logic computes Euclidean distance between the GPS position and each node in the graph. If the floor plan image is not square (e.g., 1000px wide, 600px tall), a normalized distance of `0.1` represents `100px` horizontally but only `60px` vertically. The nearest-node snap therefore favors nodes that are laterally closer even when a node directly above/below is physically much closer.

**Why it happens:**
The existing `calculateWeight` function computes Euclidean distance in normalized 0–1 space and is used consistently throughout pathfinding. That's correct for edge weights because all edges were also measured in the same space. But GPS snapping is different: the "nearest" node should be the one physically closest to the user's location, which requires accounting for the actual pixel aspect ratio of the floor plan image.

**Consequences:**
- In a building with long hallways (wide floor plan, narrow normalized x-range), the nearest-node snap consistently picks a node in the wrong corridor.
- The error is small enough to be non-obvious in testing but large enough to route the user to the wrong wing.

**Prevention:**
When snapping GPS to nearest node, weight the distance by the image aspect ratio:
```ts
const aspectRatio = imageWidth / imageHeight  // pixels
const dx = (nodeX - gpsNormX) * aspectRatio
const dy = nodeY - gpsNormY
const dist = Math.sqrt(dx * dx + dy * dy)
```
Use this weighted distance only for snapping — not for pathfinding edge weights (which are already consistent in normalized space).

**Detection:**
- In a building that is much wider than tall, the GPS dot appears to snap to a node on the wrong side of a hallway.
- Snapping is correct on square floor plans but wrong on rectangular ones.

**Phase to address:** GPS "you are here" implementation phase. Note in code why aspect-ratio correction is applied only for snapping.

---

### Pitfall C-5: GPS Signal Lost Mid-Session Leaves a Stale "You Are Here" Dot

**What goes wrong:**
`navigator.geolocation.watchPosition` calls the success callback only when a new position is available. If the user walks indoors and GPS signal is lost, no error callback fires immediately — the signal just stops updating. The "you are here" dot freezes at the last known position, which may be 50 meters from the user's actual location, but it continues to appear as authoritative.

**Why it happens:**
Indoor GPS accuracy is 10–50m or worse (often unusable inside buildings). The browser does not call the error callback on signal loss — only on explicit denial or timeout. If `timeout` is not set in the options, `watchPosition` can silently freeze for minutes.

**Consequences:**
- Student believes their dot shows current position and navigates by it — ends up in the wrong place.
- If nearest-node snap runs on stale position, the set start point is wrong for the entire navigation session.

**Prevention:**
- Set a `timeout` on `watchPosition` options (e.g., 10 seconds). When timeout fires, hide the dot rather than leaving it stale.
- Track `lastPositionTimestamp` from `GeolocationPosition.timestamp`. If the last position is older than 15 seconds, dim or remove the dot.
- Show an accuracy radius circle around the dot using `GeolocationCoordinates.accuracy`. When accuracy is > 30m (a typical indoor reading), show a warning: "GPS accuracy is low — position may be approximate."
- Use `getCurrentPosition` first (single fix), then optionally start `watchPosition` — this avoids the common mistake of starting `watchPosition` before the user has granted permission.

**Detection:**
- Dot freezes in one position even as user walks around.
- No visual change when user walks 10 meters.
- Accuracy value from the API exceeds half the building width.

**Phase to address:** GPS "you are here" implementation phase. Implement accuracy display and stale-position hiding before any user testing.

---

### Pitfall C-6: Geolocation Permission Handling Differs Between iOS Safari and Android Chrome

**What goes wrong:**
The app calls `navigator.geolocation.getCurrentPosition` when the student clicks "Use my location." On Android Chrome, permission is requested via a prompt and denied/granted state is persisted per site. On iOS Safari:
- `navigator.permissions.query({ name: 'geolocation' })` returns `"prompt"` even when the user has previously denied (the permission state is inconsistent with the actual system setting).
- If permission was previously denied in iOS Settings, calling `getCurrentPosition` triggers the error callback with code 1 (PERMISSION_DENIED), but `navigator.permissions.query` still reports `"prompt"`.
- There is no way to programmatically re-open the iOS permission dialog once denied at the system level. The user must navigate to Settings manually.

**Why it happens:**
iOS Safari's implementation of the Permissions API does not accurately reflect system-level permission states. This is a known, long-standing divergence from the spec (confirmed by Apple Developer Forum threads as of 2024).

**Consequences:**
- App attempts to query permission state to show "Allow location" vs "Update in Settings" UI — but on iOS, the query result is wrong, so the wrong message is always shown.
- Calling `watchPosition` after a system-level deny on iOS fails silently on some iOS versions (no error callback fires at all on certain iOS 16.x builds).

**Prevention:**
- Do not rely on `navigator.permissions.query` for geolocation on iOS. Instead, always call `getCurrentPosition`/`watchPosition` and handle the error callback (code 1 = denied) to show the correct UI.
- Show a fallback message on PERMISSION_DENIED: "Location access was denied. To enable, go to Settings > Safari > Location and allow this site."
- The GPS feature must be entirely optional and gracefully absent when denied. The student should still be able to set their start point manually by tapping the map.

**Detection:**
- On iOS, "Use my location" shows "Allow location" prompt even after the user has already denied.
- `watchPosition` error callback never fires on iOS after system-level deny.

**Phase to address:** GPS implementation phase. Test on a real iOS device, not just Chrome DevTools emulation, before shipping.

---

## Moderate Pitfalls

Mistakes that degrade correctness or UX but do not cause data loss.

---

### Pitfall M-1: Floor-Change Direction Steps Generated for Every Node, Not Just at the Connector

**What goes wrong:**
The current `generateDirections` in `useRouteDirections.ts` detects a floor change at every step where `curr.floorId !== next.floorId`. On a route that crosses three floors (e.g., Floor 1 → Floor 2 → Floor 3), the route visits: `...floor1node → stairs-floor1 → stairs-floor2 → floor2node... → stairs-floor2b → stairs-floor3 → floor3node...`. A correct implementation should generate exactly two floor-change steps. The pitfall: if there are multiple nodes between the two floors' connector pair (which can happen if the graph has an intermediate campus-outdoor segment or a building-entrance segment), the condition `curr.floorId !== next.floorId` may fire twice in a row or not at all depending on the node layout.

**Why it happens:**
The floor-change detection looks only one step ahead (`curr.floorId !== next.floorId`). On a route that passes through the campus outdoor segment between two buildings, `floorId` changes multiple times rapidly. Each change generates a floor-change step. If `curr` is the outdoor junction node and `next` is floor 1 of Building B, that generates a spurious "Take the stairs to Floor 1" step for a junction that is not a staircase.

**Consequences:**
- Direction steps like "Take the stairs to Floor 0" (the campus map sentinel floor).
- Duplicate "Take the elevator to Floor 2" steps when the route visits multiple consecutive cross-floor nodes.
- A step with `icon: 'stairs-up'` for an `entrance`-type node.

**Prevention:**
- Only generate a floor-change step when `curr.type` is a recognized connector type (`'stairs'`, `'elevator'`, `'ramp'`) AND `curr.floorId !== next.floorId`. This guards against entrance nodes and junction nodes triggering the condition.
- Filter out steps that navigate to the campus overhead floor (`floorNumber === 0`) from the direction text — students do not need "Go to Floor 0." Instead, synthesize an "Exit the building" step.
- Write unit tests covering: same-floor route, one floor-change route, two floor-change route, campus-to-building route.

**Detection:**
- Direction steps mention "Floor 0" or "Campus floor."
- Step list has two consecutive elevator/stairs steps with no walking step between them.
- Route through two buildings shows floor-change steps in unexpected order.

**Phase to address:** Multi-floor directions phase. Add the node-type guard to the floor-change condition before adding floor-change dividers.

---

### Pitfall M-2: Admin Floor-Connector UI Creates One-Sided Links (Orphaned Pairs)

**What goes wrong:**
The floor-connector data model requires a symmetric pair: the stairs node on Floor 1 has `connectsToNodeAboveId` pointing to the stairs node on Floor 2, and that Floor 2 node has `connectsToNodeBelowId` pointing back to the Floor 1 node. The admin linking UI must write both sides atomically. If the admin switches away from Floor 2 before saving, or the save succeeds for Floor 1 but fails for Floor 2 (e.g., validation error on an unrelated field), the pair is broken: the Floor 1 node points to Floor 2, but the Floor 2 node has no back-pointer.

**Why it happens:**
The current save model saves one floor at a time (the admin switches floors and triggers an auto-save of the current floor). If the linking UI spans two floors (linking a node on Floor 1 to a node on Floor 2), both floors must be saved in a single operation. The current `handleSave` in `MapEditorCanvas.tsx` only saves the currently active floor's nodes/edges — it does not save cross-floor connector metadata on nodes from other floors.

**Consequences:**
- `buildGraph`'s Pass 2 only looks at `connectsToNodeAboveId` to synthesize inter-floor edges. A one-sided link (Floor 1 has `connectsToNodeAboveId` but Floor 2 node has no `connectsToNodeBelowId`) means the route can traverse Floor 1 → Floor 2 but the pass-2 deduplication relies on the canonical pair key. If the Floor 2 node also has `connectsToNodeAboveId` pointing somewhere else but not the Floor 1 node, a route can become asymmetric: works up, fails down.
- Admin cannot detect the broken state without reading raw node data.

**Prevention:**
- Implement floor-connector linking as a dedicated API endpoint (`POST /api/admin/link-connector`) that atomically updates both nodes (the Floor 1 node's `connectsToNodeAboveId` and the Floor 2 node's `connectsToNodeBelowId`) in a single DB transaction.
- Do NOT implement cross-floor linking by updating local `state.nodes` on a single floor and relying on per-floor save — the other floor is not in the current editor state.
- After linking, validate the pair in the UI: show a visual indicator on both nodes confirming the round-trip link is intact.

**Detection:**
- Route from Floor 1 to Floor 3 works but route from Floor 3 to Floor 1 fails.
- `connectsToNodeAboveId` is set on the Floor 1 stairs node but `connectsToNodeBelowId` is null on the Floor 2 stairs node.

**Phase to address:** Admin floor-connector linking UI phase. Design the API endpoint before building the UI.

---

### Pitfall M-3: Admin Floor-Connector UI Allows Circular or Cross-Building Links

**What goes wrong:**
The admin selects a Floor 1 stairs node and links it to another Floor 1 node (same floor — not a vertical connector at all). Or: links a Floor 2 node in Building A to a Floor 2 node in Building B (different buildings — only valid for `entrance`-type nodes connecting to the campus graph, not for same-floor-number nodes in different buildings). The UI does not distinguish between these cases.

**Why it happens:**
A "pick a node on another floor" selector that lists all nodes in the building (or all nodes in the system) allows selecting targets that are semantically invalid. Without validation, `buildGraph` will synthesize an inter-floor edge between two Floor 1 nodes (same `floorId`), which the pathfinding engine treats as a free teleport edge — zero discriminating cost, traversed on every route.

**Consequences:**
- A circular link (Floor 1 node A → Floor 1 node B, where A and B are on the same floor) creates an inter-floor edge inside `buildGraph` Pass 2 that incorrectly bypasses real-world pathing.
- A link between same-floor-number nodes in different buildings creates a building-crossing shortcut that doesn't exist physically.

**Prevention:**
- In the floor-connector linking UI, restrict the target node selector to: only nodes on a different floor within the same building, and only nodes of a compatible connector type (`stairs`, `elevator`, `ramp`).
- Validate in the API endpoint: reject a link where `sourceNode.floorId === targetNode.floorId` (same floor), or where `sourceNode.buildingId !== targetNode.buildingId` (unless one is a campus entrance, which is handled separately by `connectsToBuildingId`).
- Show the floor number clearly in the node selector so the admin can see "Floor 2 — Stairwell B" vs "Floor 1 — Stairwell B."

**Detection:**
- Route length is near-zero between two distant nodes (teleport shortcut created by invalid inter-floor edge).
- Admin accidentally created a link between nodes on the same floor.

**Phase to address:** Admin floor-connector linking UI phase. Implement server-side validation before UI validation.

---

### Pitfall M-4: Floor-Connector Linking UI State Is Stale After Floor Switch

**What goes wrong:**
The admin is in the middle of linking a Floor 1 connector node to a Floor 2 node. The UI enters a "pending link" state (source node selected, waiting for user to switch to Floor 2 and click the target). The admin switches to Floor 2. The editor calls `switchFloor` (via `handleFloorSwitch`), which auto-saves Floor 1 and replaces `state.nodes` with Floor 2's nodes. The "pending link" source node ID is still in UI state — but the current floor's nodes no longer include it. If the admin clicks "cancel," the pending state is not cleared, leaving a lingering ghost selection.

**Why it happens:**
The existing editor state machine (`useEditorState`) has `pendingEdgeSourceId` for the in-floor edge drawing mode. A floor-connector linking flow requires an analogous "pending link source" state that persists across floor switches — but floor switching currently clears node selection and resets other transient state. The interaction model of "select source on one floor, switch floor, select target" spans two state snapshots.

**Consequences:**
- User interface shows "linking mode active" with no visible source node highlighted (it's on a different floor).
- Admin confusion about what they were linking.
- If the save triggers during the floor switch, the source node may be saved without the connector fields fully set.

**Prevention:**
- Track the "pending connector link" state at a level above `useEditorState` — in `MapEditorCanvas.tsx` or a dedicated hook — so it persists across floor switches. Store: `{ sourceNodeId, sourceFloorId, sourceBuildingId }`.
- Show a persistent banner: "Linking Stairwell A (Floor 1) → Select the matching node on another floor. Press Escape to cancel."
- Clear the pending link state on Escape, on building switch, and on completed link.
- Disable floor deletion while a pending link is active (prevents the source floor from disappearing during the link flow).

**Detection:**
- "Linking mode" indicator persists after switching floors twice.
- Escape key does not clear the linking mode on Floor 2 because the clear handler only runs on Floor 1's node events.

**Phase to address:** Admin floor-connector linking UI phase. Design the state machine before implementing UI.

---

### Pitfall M-5: Multi-Floor Direction Steps Include the Connector Node as a Turn Step AND as a Floor-Change Step

**What goes wrong:**
Consider the path `...hallway-node → stairs-floor1 → stairs-floor2 → hallway-node...`. The loop in `generateDirections` processes triples `(prev, curr, next)`. When `i` is at `stairs-floor1`: `prev` = hallway, `curr` = stairs-floor1, `next` = stairs-floor2. Since `curr.floorId !== next.floorId`, a floor-change step is generated — correct. But on the previous iteration where `i` is at `hallway-node` before the stairs: `prev` = previous-node, `curr` = hallway-node-before-stairs, `next` = stairs-floor1. Since both are on floor 1, this generates a normal turn step pointing toward the stairs. That is also correct. The bug appears when the node immediately before the stairs IS a connector type itself (e.g., a building entrance that opens into a stairwell): two consecutive floor-change steps are generated with no walking distance between them.

**Why it happens:**
The floor-change detection runs independently for every triple. It does not look back to check whether the previous step was also a floor-change step. On campus-outdoor-to-building routes where the entrance node is at floor 0 (campus) and the first indoor node is at floor 1, the sequence `outdoor-node(floor0) → entrance-node(floor0) → floor1-node` produces a valid transition. But if the admin placed the entrance node at `floor1` instead of `floor0`, it produces two consecutive floor-change-like conditions.

**Prevention:**
- After generating all steps, post-process to merge or drop consecutive floor-change steps with zero walking distance between them.
- Document the expected node sequence for campus-to-building routes in a comment: `campus(floor0) → entrance(floor0) → floor1-node` is the canonical layout.
- Add a test case: route from campus outdoor node through an entrance to Floor 1 of a building — the step list should have exactly one "Enter building" or equivalent transition step, not two.

**Detection:**
- Directions list shows two consecutive non-walking steps: "Enter building" followed immediately by "Take stairs to Floor 1."
- `distanceM` of 0 on a floor-change step.

**Phase to address:** Multi-floor directions phase. Include campus-outdoor-to-building routes in direction step tests.

---

## Minor Pitfalls

Mistakes that cause confusion or polish issues but are straightforward to fix.

---

### Pitfall m-1: GPS Dot Uses watchPosition on Page Load Without User Intent, Triggering Immediate Permission Prompt

**What goes wrong:**
The app starts `watchPosition` on mount (or when the student map loads), triggering the browser's permission prompt before the user has interacted with any GPS feature. On iOS Safari, an unprompted location request on page load is silently blocked in some configurations. On Android Chrome, the popup appears immediately, interrupting the user's initial map orientation.

**Prevention:**
Only call `getCurrentPosition` or `watchPosition` when the user explicitly clicks a "Show my location" button. Never start geolocation on mount. Store the `watchId` returned by `watchPosition` and call `clearWatch(watchId)` when the component unmounts or when the user dismisses the GPS feature.

**Phase to address:** GPS implementation phase.

---

### Pitfall m-2: "You Are Here" Accuracy Circle Is Drawn in Stage Coordinates, Not Screen Coordinates, and Scales with Zoom

**What goes wrong:**
The accuracy radius circle (representing GPS accuracy in meters) is drawn as a Konva shape inside the Stage. Its radius is computed from GPS accuracy in meters, converted to normalized coordinates, then to pixels based on `imageRect`. When the user zooms in, the circle scales up with the stage, making it appear as if accuracy has improved at high zoom.

**Prevention:**
The accuracy circle should be drawn as an HTML overlay element (CSS circle) positioned over the GPS dot using the same coordinate conversion used for the GPS dot's screen position, but at fixed screen-space size (accounting for zoom by dividing the accuracy-in-pixels by the current stage scale). Alternatively, accept the scaling behavior but cap the radius in screen pixels to prevent it from filling the entire viewport.

**Phase to address:** GPS "you are here" implementation phase.

---

### Pitfall m-3: Admin Floor-Connector Visual Linking Is Not Visible When Linked Node Is on a Hidden Floor

**What goes wrong:**
The admin is on Floor 2. A connector node shows a link indicator ("linked to Floor 3, node X"). The admin wants to verify the link — but Floor 3 does not exist yet (it was added to the DB but the admin has not uploaded a floor plan). The node selector for Floor 3 is empty. The admin assumes the link is broken and re-links it, creating a second `connectsToNodeAboveId` write that overwrites the first.

**Prevention:**
When displaying the linked node's identity in the floor-connector UI, always show the linked node ID and floor number even if the target floor is not currently loaded. Indicate if the target node cannot be found in the current `navGraph` (it may be on a floor that hasn't been saved yet). Do not make the link indicator interactive when the target floor is unavailable — show it as read-only until the floor is loaded.

**Phase to address:** Admin floor-connector linking UI phase.

---

### Pitfall m-4: Two-Finger Rotation Is Applied Every Frame in handleTouchMove Without a Threshold, Causing Jitter

**What goes wrong:**
The existing `handleTouchMove` applies rotation on every `touchmove` event based on `angleDiff = angle - lastAngle`. For very small finger movements, `angleDiff` can be sub-1-degree noise (device jitter). Applying this every frame produces a slowly drifting rotation that the user did not intend — the map subtly rotates during a pure pinch-zoom.

**Prevention:**
Apply a rotation threshold: only update `stage.rotation()` when `Math.abs(angleDiff * 180 / Math.PI) > ROTATION_THRESHOLD_DEG` (e.g., 2 degrees per frame). This prevents jitter while preserving responsive intentional rotation.

**Phase to address:** Konva gesture focal-point fix phase.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|----------------|------------|
| GPS bounds admin config | Axis inversion (C-1) | Unit-test `gpsToNormalized` before any UI work |
| GPS "you are here" | Stale dot / accuracy misleading (C-5, m-2) | Implement accuracy radius + stale timeout before user testing |
| GPS permission | iOS Safari denial inconsistency (C-6) | Test on real iOS device; never rely on permissions.query |
| GPS nearest-node snap | Aspect-ratio distance error (C-4) | Add aspect correction in snap function, not in pathfinding |
| Konva pinch-zoom fix | Rotation-aware focal point (C-2) | Use `getAbsoluteTransform().invert()` for all pointer-to-stage math |
| Konva pinch-zoom fix | Stage jump on gesture start (C-3) | Verify `Konva.hitOnDragEnabled = true` in all canvases |
| Konva rotation fix | Sub-threshold rotation jitter (m-4) | Add `> 2 deg` threshold before applying angle delta |
| Multi-floor directions | Duplicate floor-change steps (M-5, M-1) | Add node-type guard + post-processing; test campus-to-building route |
| Admin floor-connector UI | Orphaned one-sided links (M-2) | Atomic server-side link API before building UI |
| Admin floor-connector UI | Invalid same-floor or cross-building links (M-3) | Server-side validation on link API |
| Admin floor-connector UI | UI state stale after floor switch (M-4) | Pending-link state lives above useEditorState; persists across floor switch |

---

## Integration Pitfalls

Mistakes specific to integrating new v1.6 features with the existing v1.5 architecture.

| Integration Point | Mistake | Correct Approach |
|-------------------|---------|-----------------|
| GPS → normalized coordinates | Using `calculateWeight` (normalized Euclidean) for nearest-node snap | Use aspect-ratio-corrected distance for snap only; keep `calculateWeight` for pathfinding |
| GPS dot → Konva Stage | Drawing dot as a Konva shape inside Stage | Dot is easier as an HTML absolute-positioned element; avoids coordinate transform complexity for the accuracy circle |
| GPS permission → app state | Starting `watchPosition` on mount or in `useEffect` with empty deps | Only start after user explicit action; store `watchId` ref; `clearWatch` on unmount |
| Floor-connector link → save flow | Saving connector fields in per-floor save (only saves active floor) | Dedicated `/api/admin/link-connector` that writes both nodes atomically |
| Multi-floor directions → `floorMap` | Passing `floorMap` to `generateDirections` but it's empty because `graphState` is not yet `loaded` | Gate the directions call on `graphState.status === 'loaded'`; `floorMap` should never be empty when routes exist |
| Rotation pivot fix → `handleWheel` | Fixing pinch only, not wheel zoom | Both `handleWheel` and `handleTouchMove` use the same focal-point formula; fix both at the same time |

---

## Sources

- `src/client/hooks/useMapViewport.ts` — existing pinch-zoom and rotation implementation (code analysis, HIGH confidence)
- `src/client/hooks/useRouteDirections.ts` — existing floor-change step generation (code analysis, HIGH confidence)
- `src/shared/pathfinding/graph-builder.ts` — Pass 2 inter-floor edge synthesis logic (code analysis, HIGH confidence)
- `src/server/db/schema.ts` — connector fields schema: `connectsToNodeAboveId`, `connectsToNodeBelowId` (code analysis, HIGH confidence)
- `src/client/pages/admin/MapEditorCanvas.tsx` — per-floor save flow; floor switch auto-save (code analysis, HIGH confidence)
- MDN Geolocation API: [GeolocationCoordinates.accuracy](https://developer.mozilla.org/en-US/docs/Web/API/GeolocationCoordinates/accuracy) (HIGH confidence)
- MDN Geolocation: [watchPosition](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/watchPosition) — `timeout` option and behavior (HIGH confidence)
- Pointr: [Indoor location in browsers — explained](https://www.pointr.tech/blog/dispelling-web-based-bluedot-myth) — indoor GPS accuracy ceiling ~10m (MEDIUM confidence)
- Konva GitHub Issues: [Pinch Zoom jumps randomly #1096](https://github.com/konvajs/konva/issues/1096) — focal point calculation with draggable stage (MEDIUM confidence)
- Konva GitHub Issues: [Zooming stage relative to pointer position does not work in Safari #1044](https://github.com/konvajs/konva/issues/1044) — Safari-specific pointer position issue (MEDIUM confidence)
- Konva Docs: [Multi-touch Scale Stage](https://konvajs.org/docs/sandbox/Multi-touch_Scale_Stage.html) — `hitOnDragEnabled` requirement (HIGH confidence)
- Konva GitHub Issues: [Konva 4.0.0 breaks touch stage.getPointerPosition() #733](https://github.com/konvajs/konva/issues/733) — `setPointersPositions` workaround (MEDIUM confidence)
- Apple Developer Forums: [HTML Geolocation API does not work](https://developer.apple.com/forums/thread/751189) — iOS Safari permissions.query inconsistency (HIGH confidence)
- WebSearch: `watchPosition` battery drain optimization — `timeout` option, `clearWatch` on backgrounding (MEDIUM confidence)

---
*Pitfalls research for: CampusNav v1.6 GPS integration and UX refinements*
*Researched: 2026-03-09*