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
