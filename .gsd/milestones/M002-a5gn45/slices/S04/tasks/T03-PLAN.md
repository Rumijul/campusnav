---
estimated_steps: 12
estimated_files: 3
skills_used: []
---

# T03: Accessible mode parity + App.tsx integration

Add accessibleMode boolean prop to LiveGuidanceOverlay, wire all props from App.tsx, and add findNearestNodeOnFloor helper.

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

## Inputs

- `mobile/components/guidance/LiveGuidanceOverlay.tsx`
- `mobile/App.tsx`
- `mobile/domain/navGraph.ts`

## Expected Output

- `mobile/components/guidance/LiveGuidanceOverlay.tsx`
- `mobile/App.tsx`
- `mobile/hooks/findNearestNodeOnFloor.test.ts`

## Verification

npx tsc --noEmit && npx vitest run

## Observability Impact

All guidance state flows through React props. No additional runtime signals beyond existing guidanceState logging from S03.
