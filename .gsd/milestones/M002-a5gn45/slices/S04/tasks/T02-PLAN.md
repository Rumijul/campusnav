---
estimated_steps: 12
estimated_files: 4
skills_used: []
---

# T02: Floor-aware guidance state + overlay

Add currentFloorId to GuidanceState, update useGuidanceSession to track floor changes, add floor badge and floor transition banner to LiveGuidanceOverlay, and wire floorId/floorMap props from App.

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

## Inputs

- `mobile/routing/guidanceState.ts`
- `mobile/hooks/useGuidanceSession.ts`
- `mobile/components/guidance/LiveGuidanceOverlay.tsx`
- `mobile/domain/navGraph.ts`

## Expected Output

- `mobile/routing/guidanceState.ts`
- `mobile/hooks/useGuidanceSession.ts`
- `mobile/components/guidance/LiveGuidanceOverlay.tsx`
- `mobile/routing/guidanceState.test.ts`

## Verification

npx tsc --noEmit && npx vitest run

## Observability Impact

console.log('[Guidance] floor-transition') fires on floor boundary crossings. Floor context observable via guidanceState.currentFloorId in React DevTools.
