# S03 Research: Real-time Guidance Core (Confidence + Reroute Engine)

## Requirements This Slice Owns

- **R026** — Foreground real-time guidance across outdoor and indoor route segments
- **R027** — Confidence-gated guidance contract (explicit fallback when confidence insufficient)
- **R028** — Off-route reroute within 5–10 seconds
- **R029** — Heading-aware map behavior during live guidance

## What Exists

### Routing Core (S02 — consumed by S03)

| File | What it provides |
|---|---|
| `mobile/routing/routeSessionState.ts` | `computeRouteSession` pure function; discriminated union `RouteSessionState` with phases `idle | computing | ready | no-route | error`; `useRouteSession` hook |
| `mobile/routing/pathfindingEngine.ts` | `MobilePathfindingEngine` with `findRoute(fromId, toId, mode)` → `PathResult { found, nodeIds, segments, totalDistance }`. Can recompute from any node ID — used for reroute |
| `mobile/domain/navGraph.ts` | `NormalizedNavGraph`, `DirectionsResult`, `DirectionStep`, `StepIcon`, `NormalizedNodeRecord` |
| `mobile/routing/generateDirections.ts` | `generateDirections(nodeIds, nodeMap, mode, floorMap)` → `DirectionsResult`. Pure, testable |
| `mobile/routing/directionSections.ts` | `groupDirectionSections` for floor-grouped display |
| `mobile/hooks/useRouteSelection.ts` | `useRouteSelection` — start/dest node state |
| `mobile/components/route/RoutePreview.tsx` | Floor-grouped direction preview UI |
| `mobile/components/route/RoutePathOverlay.tsx` | View-based polyline route overlay |
| `mobile/map/MapViewportFloor.tsx` | Floor-aware map viewport with floor switcher |

### GPS Core (shared — consumed by S03)

| File | What it provides |
|---|---|
| `src/shared/gps.ts` | `isGpsFixConfident(accuracyMeters, maxAccuracyMeters?)` — returns true when finite, non-negative, ≤ threshold (default 50m); `projectLatLngToNormalizedPoint(lat, lng, bounds)` → `NormalizedPoint | null`; `snapLatLngToNearestWalkableNode(latitude, longitude, bounds, nodes, edges)` → `SnapGpsToNodeResult | null`; `isGpsBoundsCalibrated`; `isLatLngWithinBounds` |
| `src/shared/types.ts` | `NavFloorGpsBounds { minLat, maxLat, minLng, maxLng }`; `NavNode { id, x, y, label, type, floorId, ...connectsToFloorAboveId, ... }` |

### Bearing Math (web port already done)

The web `useRouteDirections.ts` has `bearing(ax, ay, bx, by)` using `atan2(dx, -dy)` (screen-space: 0°=north, 90°=east) and `normalizeDelta(delta)` → range [-180, 180]. This pattern should be ported to a shared guidance utility.

## What S03 Must Build

### 1. Guidance State Machine (`mobile/routing/guidanceState.ts`)

A pure discriminated union replacing the static `RouteSessionReadyState` with live progression state:

```
GuidancePhase =
  | 'idle'            — no active guidance (route computed but not started)
  | 'low-confidence'  — GPS fix unreliable, explicit user prompt shown
  | 'guiding'         — actively advancing through route steps
  | 'rerouting'       — recomputing path after off-route detection
  | 'arrived'         — destination reached

GuidanceState {
  phase: GuidancePhase
  route: RouteSessionReadyState          — snapshot of the route we're following
  currentStepIndex: number              — which DirectionStep is active
  snappedPosition: NormalizedPoint       — user's current map-space position
  heading: number | null                — device heading degrees (0-360)
  headingConfidence: number | null       — heading accuracy in degrees
  positionConfidence: 'high' | 'medium' | 'low' | 'none'
  lastFixTimestamp: number
  offRouteDetectedAt: number | null     — for reroute timer tracking
  rerouteResult: PathResult | null     — result of last reroute computation
}
```

Key decisions:
- **Confidence levels**: Derived from `isGpsFixConfident` + heading sensor quality. `high` = confident GPS + stable heading; `medium` = confident GPS only; `low` = marginal accuracy; `none` = no fix.
- **Step advancement**: Compare `snappedPosition` against the polyline segment from `path.nodeIds[currentStepIndex]` to `path.nodeIds[currentStepIndex+1]`. Advance when user crosses a perpendicular threshold near the next waypoint.
- **Reroute trigger**: `isOffRoute(snappedPosition, currentStepIndex, path)` — true when position is > threshold distance from the current planned segment. Threshold: ~0.05 in normalized units (≈ 2.5m on a 50m-unit campus). Must hold for 2+ consecutive fixes before triggering.
- **Reroute computation**: Call `MobilePathfindingEngine.findRoute(snappedNodeId, destination.id, mode)` — reuse existing engine, no new dependency.

### 2. Position + Heading Hook (`mobile/hooks/useCurrentPosition.ts`)

React hook wrapping React Native's Geolocation API (via `expo-location` or raw `navigator.geolocation`):

```typescript
interface PositionFix {
  latitude: number
  longitude: number
  accuracyMeters: number
  headingDegrees: number | null    // from GPS (may be null when stationary)
  timestamp: number
}

interface HeadingData {
  headingDegrees: number           // 0-360, magnetic north
  accuracyDegrees: number           // heading accuracy
}

interface UseCurrentPositionOptions {
  updateIntervalMs?: number        // default: 2000
  maxAccuracyMeters?: number        // passed to isGpsFixConfident
}
```

Behavior:
- Subscribe to `navigator.geolocation.watchPosition` (or `expo-location.watchPositionAsync`)
- Subscribe to heading via `expo-sensors` magnetometer or `navigator.compass` — use heading only when accuracy is ≤ 15° to avoid magnetic interference noise
- Apply simple exponential moving average to heading (α=0.3) to reduce jitter
- Return `{ position, heading, isConfident, isHeadingValid }`

Note: React Native's raw Geolocation API is available via `import { Geolocation } from 'react-native'` (no extra package needed for basic GPS). For compass heading, `expo-sensors` is the standard approach. The hook should accept a `HeadingReader` interface to keep it testable without native modules.

### 3. Guidance Session Hook (`mobile/hooks/useGuidanceSession.ts`)

Wires together:
- `useRouteSession` (from S02) — provides the computed route
- `useCurrentPosition` — provides live position fixes
- `GuidanceState` machine — advances steps, detects off-route, triggers reroute

```typescript
interface UseGuidanceSessionProps {
  graph: NormalizedNavGraph
  route: RouteSessionReadyState           // from useRouteSession
  updateIntervalMs?: number
  offRouteThreshold?: number              // normalized units, default 0.05
  rerouteConfirmFixes?: number            // consecutive off-route fixes needed, default 2
}

interface UseGuidanceSessionResult {
  guidanceState: GuidanceState
  startGuidance: () => void               // begin live guidance from current position
  stopGuidance: () => void                // pause/quit guidance
  confirmPosition: (nodeId: string) => void  // user confirms their location manually
}
```

Behavior:
- On `startGuidance`: snap current GPS fix to nearest walkable node using `snapLatLngToNearestWalkableNode` + `isGpsFixConfident`
- If snap is low-confidence: transition to `low-confidence` phase, show prompt, don't auto-advance
- On each position update: check off-route, advance step, update `snappedPosition`
- On off-route detection: start reroute timer; if confirmed after N fixes, call `findRoute(currentNodeId, destination.id, mode)`, transition to `rerouting`, then back to `guiding` with new path
- Debounce reroute: only recompute A* once per 5-second cooldown even if multiple off-route fixes detected
- Log phase transitions for observability

### 4. Guidance UI Components

#### `mobile/components/guidance/LiveGuidanceOverlay.tsx`
Overlays on the map viewport when guidance is active:
- Current step instruction card (big text, icon, distance remaining)
- Mini-map showing route progress (simplified polyline, current position dot)
- "Low confidence" banner when `phase === 'low-confidence'`
- "Recalculating route..." when `phase === 'rerouting'`
- "You've arrived!" when `phase === 'arrived'`

#### `mobile/components/guidance/ConfidenceIndicator.tsx`
Small indicator showing current position confidence:
- Green dot: high confidence
- Yellow dot: medium
- Orange dot: low
- Red dot with icon: no GPS fix
- Clicking reveals confidence details

### 5. Heading-Aware Map Support

S04 needs heading data to rotate the map. S03 should provide:
- `useCurrentPosition` hook exposing `headingDegrees` and `headingAccuracyDegrees`
- A `HeadingDisplayMode: 'fixed' | 'follow-heading'` state (S04 decides which mode the map uses)
- The `bearing(ax, ay, bx, by)` utility function for computing bearing between waypoints

## Natural Seams

### S03 → S04 boundary:
S03 provides:
- `useGuidanceSession` hook → guidance state contract
- `useCurrentPosition` hook → live position and heading
- `LiveGuidanceOverlay` placeholder UI (S04 enhances with floor-aware overlays, accessible mode parity)
- `ConfidenceIndicator` component

S04 consumes:
- `guidanceState.phase`, `currentStepIndex`, `snappedPosition` to drive live step card
- `headingDegrees` for heading-aware map rotation
- `positionConfidence` for confidence banner
- `DirectionStep` progression for floor transition handling

### S03 ↔ S02 boundary:
S03 starts from `RouteSessionReadyState { path, directions }` — no new graph contract needed. S03 does not modify `routeSessionState.ts`.

## Implementation Order (for executor)

1. **`mobile/routing/guidanceState.ts`** — Pure state machine types and pure helper functions (`isOffRoute`, `advanceStep`, `deriveConfidence`). No React. Fully unit-testable.
2. **`mobile/hooks/useCurrentPosition.ts`** — GPS + heading subscription. Keep it thin; mocking interface for testability.
3. **`mobile/hooks/useGuidanceSession.ts`** — Assembles guidance state machine from position updates + route session.
4. **`mobile/components/guidance/LiveGuidanceOverlay.tsx`** — Guidance UI overlay.
5. **`mobile/components/guidance/ConfidenceIndicator.tsx`** — Confidence dot indicator.
6. **`mobile/hooks/useGuidanceSession.test.ts`** — Unit tests for guidance state machine.
7. **Update `mobile/App.tsx`** — Add guidance start/stop buttons; show `LiveGuidanceOverlay` when guidance is active.
8. **Add `bearing` utility to `mobile/domain/navGraph.ts`** — Port from web `useRouteDirections.ts` bearing function.

## Key Risks

1. **Indoor GPS jitter**: Indoors, GPS accuracy can degrade to 30–100m. A user standing still might appear to wander. Mitigation: exponential moving average on position, confidence gating with fallback prompts.
2. **Magnetometer interference**: Building steel causes heading drift. Mitigation: only trust heading when accuracy ≤ 15°, provide manual rotation fallback.
3. **Off-route false positives**: GPS noise can trigger false reroutes. Mitigation: require 2+ consecutive off-route fixes before reroute, minimum time window.
4. **Reroute while on stairs/elevator**: User mid-floor-transition when reroute fires. Mitigation: check if current step is a floor-change; defer reroute until after transition node is reached.
5. **Route recomputation on large indoor graphs**: A* is fast (~1-5ms for typical campus graphs) but could be slower during reroute under stress. Mitigation: `findRoute` is already synchronous and bounded.

## Verification Strategy

- Unit tests for `guidanceState` pure functions: off-route detection, step advancement, confidence derivation
- Unit tests for `useGuidanceSession` logic with mocked `useCurrentPosition`
- TypeScript: 0 errors
- Route recomputation tested against `pathfindingEngine.test.ts` fixture data
- Confidence gating tested against `src/shared/gps.ts` fixture data

## Relevant Libraries

- `react-native` — raw `Geolocation` API for GPS (no extra package)
- `expo-sensors` — magnetometer for heading (already in expo dependency tree if expo-location is used)
- `expo-location` — enhanced GPS with `watchPositionAsync` and background support options
- No new routing dependencies — reuse `MobilePathfindingEngine`
- No new map dependencies — reuse existing `MapViewportFloor` + `RoutePathOverlay`

No web search needed — all required APIs and patterns are established in the existing codebase.
