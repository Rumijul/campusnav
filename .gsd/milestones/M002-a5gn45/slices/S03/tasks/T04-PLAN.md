---
estimated_steps: 63
estimated_files: 2
skills_used: []
---

# T04: Implement useGuidanceSession orchestrator hook

Create the guidance session hook in `mobile/hooks/useGuidanceSession.ts` that wires together `useRouteSession` (from S02), `useCurrentPosition` (T03), and the guidance state machine (T02) into a live guidance loop.

Steps:
1. Create `mobile/hooks/useGuidanceSession.ts`.

2. Define **UseGuidanceSessionProps**:
   ```typescript
   interface UseGuidanceSessionProps {
     graph: NormalizedNavGraph
     route: RouteSessionReadyState  // from useRouteSession (S02)
     updateIntervalMs?: number      // passed to useCurrentPosition, default 2000
     offRouteThreshold?: number      // normalized units, default 0.05
     rerouteConfirmFixes?: number   // consecutive off-route fixes needed, default 2
     rerouteCooldownMs?: number     // minimum ms between reroutes, default 5000
     maxAccuracyMeters?: number     // passed to useCurrentPosition, default 50
   }
   ```

3. Define **UseGuidanceSessionResult**:
   ```typescript
   interface UseGuidanceSessionResult {
     guidanceState: GuidanceState
     startGuidance: () => void
     stopGuidance: () => void
     confirmPosition: (nodeId: string) => void
   }
   ```

4. Implement the hook:

   a. **State**: `useRef` for mutable guidance state (updated on each position fix without re-render cycles). `useState` for the guidanceState snapshot for React rendering.

   b. **Position subscription**: Call `useCurrentPosition` with the configured options. Use `useEffect` to react to position changes.

   c. **On each position update**:
      - Skip if guidance not started (phase === 'idle')
      - Project lat/lng to normalized point using `projectLatLngToNormalizedPoint` with floor's GPS bounds
      - Snap to nearest walkable node using `snapLatLngToNearestWalkableNode`
      - If snap fails (no walkable nodes): transition to 'low-confidence'
      - Derive confidence level using `deriveConfidence(positionFix, headingData)`
      - If not confident: transition to 'low-confidence', skip step advancement
      - If confident:
        - Check if off-route using `isOffRoute(snappedPosition, state.currentStepIndex, route.path, offRouteThreshold)`
        - Increment offRouteFixCount if off-route, reset to 0 if on-route
        - If offRouteFixCount >= rerouteConfirmFixes AND cooldown elapsed: trigger reroute
        - Check if should advance step: `shouldAdvanceStep(snappedPosition, state.currentStepIndex, route.path)`
        - Advance currentStepIndex if shouldAdvanceStep returns true
        - Check arrival: if currentStepIndex >= route.path.nodeIds.length → phase = 'arrived'
      - Log phase transition if phase changed (console.group with phase name)

   d. **Reroute flow**:
      - Create `MobilePathfindingEngine(graph)` instance
      - Call `findRoute(snappedNodeId, route.destination.id, route.routeMode)`
      - If found: set `rerouteResult = newPathResult`; update `route.path` snapshot; transition to 'guiding'
      - If not found: stay in 'low-confidence' (user must manually pick a new destination)

   e. **startGuidance**: Initialize state from current position (snap to node, derive confidence, set phase). Log 'guidance-started'.

   f. **stopGuidance**: Reset phase to 'idle', reset all counters. Log 'guidance-stopped'.

   g. **confirmPosition**: User taps a node on the map to assert their location. Snap to that node, reset offRouteFixCount, re-derive confidence.

   h. **Floor bounds**: Get bounds for the current floor from `graph.floorById.get(currentFloorId)?.floor.gpsBounds`.

5. Create `mobile/hooks/useGuidanceSession.test.ts`:
   - Mock PositionReader that emits a sequence of fixes (confident, then off-route, then back on route)
   - Mock HeadingReader that emits stable heading
   - Test: startGuidance snaps to nearest node and transitions to 'guiding' phase
   - Test: off-route fix count accumulates and triggers rerouting after rerouteConfirmFixes
   - Test: reroute cooldown prevents duplicate reroute calls within 5s
   - Test: step advancement when position crosses waypoint threshold
   - Test: arrival detected when currentStepIndex reaches end
   - Test: stopGuidance resets phase to 'idle'
   - Test: low-confidence phase when GPS fix is not confident

6. Run `npm test -- --run mobile/hooks/useGuidanceSession.test.ts` and verify tests pass.
7. Verify TypeScript: 0 errors.

## Inputs

- `mobile/routing/guidanceState.ts`
- `mobile/routing/pathfindingEngine.ts`
- `mobile/hooks/useCurrentPosition.ts`
- `src/shared/gps.ts`

## Expected Output

- `mobile/hooks/useGuidanceSession.ts`
- `mobile/hooks/useGuidanceSession.test.ts`

## Verification

`npm test -- --run mobile/hooks/useGuidanceSession.test.ts` passes with 0 TypeScript errors

## Observability Impact

Phase transitions logged via console.group with phase name, snappedNodeId, currentStepIndex. A future agent can read these logs to understand guidance session state.
