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
