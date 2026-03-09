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
