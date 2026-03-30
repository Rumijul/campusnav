# S04 Research: Visitor-first live UX + floor-safe accessible parity

## Slice Scope

S04 extends S03's guidance core with three missing pieces:
1. **Heading-aware map rotation** — map canvas rotates to face the direction of travel (maps-like behavior)
2. **Floor-aware guidance** — guidance state tracks current floor, overlay shows floor context and floor-transition events
3. **Accessible mode parity** — LiveGuidanceOverlay renders accessible step markers matching RoutePreview parity

S03 explicitly deferred: floor transitions, heading map rotation, and accessible step instructions. All three are S04 scope.

---

## Requirements Coverage

| ID | Class | My role | What S04 must deliver |
|----|-------|---------|-----------------------|
| R029 | quality-attribute | primary | Map rotates to reflect heading during guidance mode |
| R030 | failure-visibility | primary | Floor context tracked; wrong-floor prevented; floor transitions explicit |
| R031 | primary-user-loop | primary | Accessible mode renders correct step icons + instruction modifiers in overlay |
| R026 | primary-user-loop | supporting | Floor transition phase/events in guidance loop |
| R027 | continuity | supporting | Low-confidence banner preserves floor context via confirmPosition |
| R028 | quality-attribute | supporting | Reroute resets floor context correctly |

---

## Existing Deliverables (S03)

- `guidanceState.ts`: `GuidanceState`, `ConfidenceLevel`, `GuidancePhase`, `deriveConfidence`, `isOffRoute`, `shouldAdvanceStep`, `deriveNextPhase`, `getActiveStep` — **no floorId field yet**
- `useGuidanceSession.ts`: `useGuidanceSession` — already finds `snappedRecord = graph.nodeById.get(snappedNodeId)` and reads `record.floorId` for floor bounds lookup; **floorId not persisted to guidanceState**
- `useCurrentPosition.ts`: returns `smoothedHeadingDegrees: number | null` and `heading: HeadingData | null` — already computed, ready to pass to map
- `LiveGuidanceOverlay.tsx`: 5-phase (idle/low-confidence/guiding/rerouting/arrived) — **no floor badge, no floor transition announcement**
- `ConfidenceIndicator.tsx`: colored dot — works, no changes needed
- `App.tsx`: `guidanceState` from `useGuidanceSession`, `startGuidance`, `stopGuidance`, `confirmPosition` already wired — **smoothedHeadingDegrees not passed to map viewport**
- `routing/index.ts`: exports `bearing`, `normalizeDelta`, guidance types

## Existing Deliverables (S02)

- `generateDirections.ts`: `DirectionStep.isAccessibleSegment`, `DirectionStep.floorId`, `DirectionStep.floorNumber` — all available for overlay to consume
- `navGraph.ts`: `normalizeNavGraph` with `floorById: Map<floorId, NormalizedFloorRecord>` — used for floor name lookups
- `RoutePreview.tsx`: already renders floor-section badges and accessible amber highlighting — S04 overlay must match this

---

## Implementation Plan

### T01 — Heading-aware map rotation

**Risk:** Low. Pure extension of existing MapTransform.

**What to change:**

`mobile/map/mapTransform.ts` — Add `headingRotationDeg` to `MapTransform` interface. Add `applyHeadingRotation(existing: MapTransform, headingDegrees: number): MapTransform` pure function.

`mobile/map/MapViewport.tsx` — Accept optional `headingRotationDeg?: number` prop. When provided, apply it to the `mapImage` transform array alongside `rotationDeg` (cumulative: `rotationDeg + headingRotationDeg`). Existing rotation buttons still control `rotationDeg` for manual rotation; heading mode sets `headingRotationDeg` separately and resets when guidance stops.

`mobile/map/MapViewportFloor.tsx` — Accept optional `headingDegrees?: number | null` prop and forward to `MapViewport`. When `headingDegrees` is non-null and `guidanceActive === true`, apply heading rotation.

`mobile/map/MapViewportFloor.tsx` — Also accept `onFloorChange?: (floorId: number) => void` so `App.tsx` can respond to floor transitions detected from position updates.

**Verification:** `npx tsc --noEmit`; heading rotation applies correct CSS transform; manual rotation still works independently.

### T02 — Floor-aware guidance state

**Risk:** Low. Small additive change to GuidanceState + useGuidanceSession.

**What to change:**

`mobile/routing/guidanceState.ts` — Add `currentFloorId: number | null` field to `GuidanceState` interface. This is the floor the user's snapped position belongs to.

`mobile/hooks/useGuidanceSession.ts` — In `processFix`, after determining `snappedNodeId`, look up `snappedRecord.floorId` from `graph.nodeById` and set `currentFloorId`. Add a `floorChanged` flag when `currentFloorId !== previousFloorId` and log `console.log('[Guidance] floor-transition', { from: previousFloorId, to: newFloorId })`. Expose `currentFloorId` in the returned `guidanceState`.

In `startGuidance`, also initialize `currentFloorId` from the first snapped node.

In `confirmPosition`, after looking up `nodeRecord.floorId`, update `currentFloorId`.

Add `previousFloorId` tracking via a `useRef<number | null>` inside the hook.

**Verification:** 10–15 new tests in `guidanceState.test.ts` (deriveFloorContext helpers) and `useGuidanceSession.test.ts` (floor context preserved, floor transition detected).

### T03 — Floor-aware LiveGuidanceOverlay

**Risk:** Medium. Component rendering change; existing tests blocked by Vite 7 TSX bug.

**What to change:**

`mobile/components/guidance/LiveGuidanceOverlay.tsx` — Extend `LiveGuidanceOverlayProps`:
- `floorId?: number | null` — current floorId from guidanceState
- `floorMap?: Map<number, NormalizedFloorRecord>` — for floor label lookup
- `onFloorTransition?: (newFloorId: number) => void` — optional callback

In `GuidingCard`:
- Show a floor badge (e.g., "Floor 2") using floorMap lookup when `floorId != null`
- Show floor transition pill: when `floorId` differs from the previous render (track via `useRef`), display a brief full-width banner "Now on Floor N" for 2–3 seconds

In `LowConfidenceBanner`:
- Show current floor context so user knows what floor they're guessing on

Add `FloorBadge` sub-component: `{ floorNumber: number, floorName?: string } → View with floor label`.

**Floor transition detection in overlay:** The overlay itself tracks `prevFloorId` via `useRef` inside each card component. When `props.floorId !== null && prevFloorId.current !== null && props.floorId !== prevFloorId.current`, render a `FloorTransitionBanner` for 2.5 seconds then show the normal guiding card.

**Verification:** `npx tsc --noEmit`; manual inspection that floor badge renders and transition banner appears.

### T04 — Accessible mode parity in LiveGuidanceOverlay

**Risk:** Low. Matches existing RoutePreview pattern.

**What to change:**

`mobile/components/guidance/LiveGuidanceOverlay.tsx` — Add `accessibleMode: boolean` to props. In `GuidingCard`:
- Show `♿` icon when `activeStep?.isAccessibleSegment === true` OR when `accessibleMode === true && (step.icon === 'elevator' || step.icon === 'ramp')`
- When `accessibleMode && activeStep?.icon === 'elevator'`, append " (accessible)" to instruction text
- Highlight the step icon container with amber (`#facc15`) background when accessible

**Verification:** Instruction text includes "accessible" qualifier in accessible mode; icons are amber-highlighted.

### T05 — App.tsx wiring + floor safe end-to-end

**Risk:** Medium. Cross-cutting integration.

**What to change:**

`mobile/App.tsx`:
- Extract `smoothedHeadingDegrees` from `useCurrentPosition` result and pass to `MapViewportFloor` as `headingDegrees` prop
- Pass `accessibleMode` state down to `LiveGuidanceOverlay` as `accessibleMode` prop
- Derive `currentFloorId` from `guidanceState.snappedNodeId` using `graph.nodeById` lookup
- Pass `floorId={currentFloorId}` and `floorMap={graph.floorById}` to `LiveGuidanceOverlay`
- Connect `onFloorChange` from `MapViewportFloor` to call `confirmPosition` with the nearest node on the new floor (TBD: nearest node lookup by floor — can use `findNearestNodeOnFloor` helper)

Add `findNearestNodeOnFloor(graph, floorId)` helper: iterates `graph.nodeById`, filters by floorId, returns node with minimum Euclidean distance to `snappedPosition`. Used when user manually switches floor via `MapViewportFloor` floor buttons during guidance.

**Verification:** `npx tsc --noEmit`; heading rotation active during guidance; floor badge shows correct floor; floor change via floor buttons resets guidance floor context.

---

## Key Implementation Decisions

### headingRotationDeg as separate from rotationDeg
MapViewport already has `rotationDeg` controlled by the rotation ↺/↻ buttons. Adding `headingRotationDeg` as a separate additive field avoids coupling heading mode to manual rotation state. The actual CSS `rotateZ` becomes `rotationDeg + (headingRotationDeg ?? 0)`.

### floorId in guidanceState vs. derived at render time
Computing `currentFloorId` inside `processFix` (within the ref callback) and committing it to `guidanceState` is the right approach because: (a) it ensures the floor context is reactive to React DevTools, (b) the overlay can consume it directly without needing a graph reference, (c) reroute preserves floor context as the snapped node changes.

### Floor transition detection in the overlay vs. the hook
The overlay tracks `prevFloorId` via `useRef` to detect transitions locally. This avoids adding a new `phase` or event to the guidance state machine — keeping phase transitions purely about guidance confidence/reroute. Floor transitions are UI-layer events, not phase transitions.

---

## What NOT to Build

- No background orientation lock (deferred, R012/D012)
- No voice prompts (deferred, R035)
- No haptic feedback (deferred, R036)
- No floor inference from sensors (deferred, R017)
- No auto-switching of map floor from position (S04 floor context is for guidance overlay only; manual floor switching still works via MapViewportFloor buttons)
- No changes to guidanceState phase transitions for floor — floor tracking is additive state, not a phase change

---

## Verification Strategy

1. `npx tsc --noEmit` — 0 TypeScript errors across all mobile files
2. `npx vitest run` — existing 119 tests still pass; new tests added for floor context and heading rotation helpers
3. Manual checklist:
   - Map rotates with heading during active guidance (headingDegrees non-null)
   - Floor badge shows "Floor N" in guiding card
   - Floor transition banner appears briefly when snapped floor changes
   - Low-confidence banner shows current floor context
   - Accessible mode: elevator steps show `♿` icon and "(accessible)" modifier
   - Manual rotation ↺/↻ buttons still work independently of heading mode
   - Floor switcher buttons during guidance update guidance floor context

---

## Skills Discovered

No React Native-specific skills found in available ecosystem. The codebase already uses React Native; the implementation approach uses established React Native patterns (PanResponder for gestures, StyleSheet transforms, useRef for high-frequency state, useCallback for stable callbacks). No new library research needed.
