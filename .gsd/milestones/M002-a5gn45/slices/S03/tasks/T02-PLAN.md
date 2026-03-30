---
estimated_steps: 45
estimated_files: 2
skills_used: []
---

# T02: Implement guidance state machine with pure helper functions

Create the core guidance state machine in `mobile/routing/guidanceState.ts`. This is a pure TypeScript module with no React dependencies — fully unit-testable.

Steps:
1. Create `mobile/routing/guidanceState.ts` with:

   a. **ConfidenceLevel type**: `'high' | 'medium' | 'low' | 'none'`

   b. **GuidancePhase type**: `'idle' | 'low-confidence' | 'guiding' | 'rerouting' | 'arrived'`

   c. **GuidanceState interface** with fields:
      - `phase: GuidancePhase`
      - `route: RouteSessionReadyState` (the route being followed)
      - `currentStepIndex: number` (which DirectionStep is active)
      - `snappedPosition: NormalizedPoint` (user's current map-space position)
      - `snappedNodeId: string` (nearest walkable node to position)
      - `heading: number | null` (device heading degrees 0-360)
      - `headingConfidence: number | null` (heading accuracy in degrees)
      - `positionConfidence: ConfidenceLevel`
      - `lastFixTimestamp: number`
      - `offRouteDetectedAt: number | null` (for reroute timer tracking)
      - `offRouteFixCount: number` (consecutive off-route fixes)
      - `rerouteResult: PathResult | null` (result of last reroute computation)

   d. **deriveConfidence(positionFix, headingFix)** pure function: returns ConfidenceLevel based on:
      - `high`: GPS fix confident (isGpsFixConfident) AND heading accuracy <= 15°
      - `medium`: GPS fix confident (isGpsFixConfident) AND heading missing or > 15°
      - `low`: GPS fix not confident but finite (accuracy exists)
      - `none`: No GPS fix or infinite accuracy

   e. **isOffRoute(position: NormalizedPoint, currentStepIndex: number, path: PathResult, threshold: number = 0.05)** pure function:
      - Returns true when the perpendicular distance from `position` to the current path segment exceeds `threshold` in normalized units.
      - Current segment = line from `path.nodeIds[currentStepIndex]` to `path.nodeIds[currentStepIndex+1]`.
      - Use point-to-segment perpendicular distance formula. If currentStepIndex is at or beyond path.nodeIds.length-1, use distance to last node.

   f. **shouldAdvanceStep(position: NormalizedPoint, currentStepIndex: number, path: PathResult, advanceThreshold: number = 0.03)** pure function:
      - Returns true when user has crossed the perpendicular threshold near the next waypoint (currentStepIndex + 1).
      - AdvanceThreshold should be smaller than off-route threshold to prevent false reroutes.

   g. **deriveNextPhase(state: GuidanceState, isConfident: boolean, hasArrived: boolean, offRouteFixCount: number, rerouteConfirmFixes: number)** pure function:
      - idle → if isConfident: 'guiding', else: 'low-confidence'
      - low-confidence → if isConfident: 'guiding' (proceed), else: stay in 'low-confidence'
      - guiding → if hasArrived: 'arrived'; if offRouteFixCount >= rerouteConfirmFixes: 'rerouting'; else: stay 'guiding'
      - rerouting → 'guiding' (assumes reroute succeeded; caller sets rerouteResult)
      - arrived → stay 'arrived'

   h. **getActiveStep(state: GuidanceState): DirectionStep | null** helper

2. Create `mobile/routing/guidanceState.test.ts` with tests for:
   - `deriveConfidence`: all four confidence levels from various fix combinations
   - `isOffRoute`: off-route true when position far from segment, false when near; edge at path start/end
   - `shouldAdvanceStep`: advances when close to next waypoint, not before
   - `deriveNextPhase`: all phase transitions (idle→guiding, idle→low-confidence, guiding→rerouting when offRouteFixCount >= threshold, guiding→arrived, rerouting→guiding)
   - `getActiveStep`: returns correct step from state

3. Run `npm test -- --run mobile/routing/guidanceState.test.ts` and verify all tests pass.
4. Verify TypeScript: 0 errors.

## Inputs

- `mobile/routing/routeSessionState.ts`
- `mobile/domain/navGraph.ts`
- `src/shared/gps.ts`

## Expected Output

- `mobile/routing/guidanceState.ts`
- `mobile/routing/guidanceState.test.ts`

## Verification

`npm test -- --run mobile/routing/guidanceState.test.ts` passes all tests with 0 TypeScript errors

## Observability Impact

Phase transitions in `deriveNextPhase` are pure and observable — `useGuidanceSession` (T04) logs each transition.
