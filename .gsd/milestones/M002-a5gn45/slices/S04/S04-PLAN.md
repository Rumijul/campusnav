# S04: Visitor-first live UX + floor-safe accessible parity

**Goal:** Heading-aware map rotation, floor-aware guidance overlay, and accessible mode parity are wired end-to-end in App.tsx, with floor context tracked in guidance state.
**Demo:** After this: After this: a first-time visitor can follow clear heading-aware live guidance across outdoor/indoor transitions in both standard and accessible modes.

## Tasks
- [x] **T01: Heading-aware map rotation wired end-to-end: headingRotationDeg field added to MapTransform, applyHeadingRotation helper added, MapViewport applies cumulative rotateZ, MapViewportFloor passes headingDegrees, App.tsx wires smoothedHeadingDegrees from useCurrentPosition with phase-gated activation during active guidance.** — Extend MapTransform with headingRotationDeg field, add applyHeadingRotation() pure helper, propagate headingDegrees prop through MapViewport → MapViewportFloor → App.tsx wiring.

Steps:
1. Read mobile/map/mapTransform.ts — extend MapTransform interface with headingRotationDeg: number field (default 0).
2. Add pure function applyHeadingRotation(existing: MapTransform, headingDegrees: number | null): MapTransform. When headingDegrees is null, returns existing unchanged. When non-null, returns existing with headingRotationDeg = headingDegrees.
3. Read mobile/map/MapViewport.tsx — add optional headingRotationDeg?: number prop. In the Image transform array, change rotateZ from `${transform.rotationDeg}deg` to `${transform.rotationDeg + (headingRotationDeg ?? 0)}deg`. When headingRotationDeg is non-null, this applies cumulative rotation (manual + heading).
4. Read mobile/map/MapViewportFloor.tsx — add optional headingDegrees?: number | null prop. Pass it to MapViewport as headingRotationDeg.
5. Read mobile/App.tsx — extract smoothedHeadingDegrees from useCurrentPosition return. Pass headingDegrees={smoothedHeadingDegrees} to MapViewportFloor. When guidanceState.phase === 'idle', pass null (heading rotation only during active guidance).
6. Run npx tsc --noEmit to verify 0 TypeScript errors.
  - Estimate: 1h
  - Files: mobile/map/mapTransform.ts, mobile/map/MapViewport.tsx, mobile/map/MapViewportFloor.tsx, mobile/App.tsx
  - Verify: npx tsc --noEmit
- [ ] **T02: Floor-aware guidance state + overlay** — Add currentFloorId to GuidanceState, update useGuidanceSession to track floor changes, add floor badge and floor transition banner to LiveGuidanceOverlay, and wire floorId/floorMap props from App.

Steps:
1. Read mobile/routing/guidanceState.ts — add currentFloorId: number | null to the GuidanceState interface.
2. Read mobile/hooks/useGuidanceSession.ts — after the existing snappedRecord = graph.nodeById.get(snappedNodeId) lookup, add currentFloorId field to the state snapshot. Track previousFloorId via useRef<number | null>(null). When currentFloorId !== previousFloorId.current, log console.log('[Guidance] floor-transition', { from: previousFloorId.current, to: currentFloorId }) and update previousFloorId.current. In startGuidance and confirmPosition, also initialize/update currentFloorId.
3. Read mobile/components/guidance/LiveGuidanceOverlay.tsx — extend LiveGuidanceOverlayProps:
   - floorId?: number | null
   - floorMap?: Map<number, NormalizedFloorRecord> (import from mobile/domain/navGraph)
   In LowConfidenceBanner: add floor context text "You are on Floor N" using floorMap lookup.
   Add FloorBadge sub-component: View with floor label. Show it in GuidingCard stepRow next to the step icon.
   Add FloorTransitionBanner: use useRef<number | null>(null) to track prevFloorId. When props.floorId differs from prevFloorId.current and both are non-null, render a temporary full-width banner "Now on Floor N" for 2500ms using setTimeout then return to normal card. Import useRef/useState from react (already imported).
4. Add floor-tracker unit tests to mobile/routing/guidanceState.test.ts: test that deriveFloorContext (helper) returns correct floorId from a GuidanceState snapshot, and that floor transition fires only when floorId changes.
5. Run npx tsc --noEmit.
  - Estimate: 1.5h
  - Files: mobile/routing/guidanceState.ts, mobile/hooks/useGuidanceSession.ts, mobile/components/guidance/LiveGuidanceOverlay.tsx, mobile/routing/guidanceState.test.ts
  - Verify: npx tsc --noEmit && npx vitest run
- [ ] **T03: Accessible mode parity + App.tsx integration** — Add accessibleMode boolean prop to LiveGuidanceOverlay, wire all props from App.tsx, and add findNearestNodeOnFloor helper.

Steps:
1. Read mobile/components/guidance/LiveGuidanceOverlay.tsx — add accessibleMode: boolean to LiveGuidanceOverlayProps. In GuidingCard, when accessibleMode === true:
   - If activeStep?.icon === 'elevator' OR activeStep?.icon === 'ramp', render the stepIconContainer with backgroundColor: '#facc15' (amber highlight) instead of '#1e3a5f'
   - Append ' (accessible)' to the instruction text
2. Read mobile/App.tsx — wire all the remaining pieces:
   a. Derive currentFloorId: look up guidanceState.snappedNodeId in graph.nodeById and read record.floorId
   b. Pass accessibleMode state as accessibleMode prop to LiveGuidanceOverlay
   c. Pass floorId={currentFloorId} and floorMap={graph.floorById} to LiveGuidanceOverlay
   d. Add findNearestNodeOnFloor(graph: NormalizedNavGraph, floorId: number, fromPosition: {x,y}): string helper. Iterate graph.nodeById, filter by floorId, return node.id with minimum Euclidean distance to fromPosition. Use for floor button onFloorChange: when floor changes via MapViewportFloor buttons, call confirmPosition(nearestNodeOnFloor).
3. Add unit tests for findNearestNodeOnFloor in a new file mobile/hooks/findNearestNodeOnFloor.test.ts.
4. Run npx tsc --noEmit && npx vitest run.
  - Estimate: 1h
  - Files: mobile/components/guidance/LiveGuidanceOverlay.tsx, mobile/App.tsx, mobile/hooks/findNearestNodeOnFloor.test.ts
  - Verify: npx tsc --noEmit && npx vitest run
