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
