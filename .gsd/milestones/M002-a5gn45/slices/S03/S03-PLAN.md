# S03: Real-time guidance core (confidence + reroute engine)

**Goal:** Build the real-time guidance core: a confidence-gated guidance state machine, GPS+heading position hook, session orchestrator that advances steps and triggers reroute, and live UI overlay components.
**Demo:** After this: After this: live foreground positioning advances guidance and triggers reroute when user deviates, with confidence-gated fallback behavior.

## Tasks
- [x] **T01: Added bearing() and normalizeDelta() geometry utilities to mobile/domain/navGraph.ts with 11 passing tests** — Port the bearing utility from the web codebase into `mobile/domain/navGraph.ts`. Bearing is the angular difference between two normalized map-space points, used for step-advance detection and for heading-aware map rotation in S04.

Steps:
1. Read the existing `mobile/domain/navGraph.ts` file to find a good insertion point (near DirectionStep types or at the bottom before the normalizeNavGraph function).
2. Add the `bearing(ax: number, ay: number, bx: number, by: number): number` function using the formula: `atan2(dx, -dy)` in screen-space coordinates where 0°=north, 90°=east. Return value normalized to [0, 360).
3. Also add `normalizeDelta(delta: number): number` → range [-180, 180] (subtract 360 when delta > 180, add 360 when delta < -180).
4. Export both from `mobile/domain/navGraph.ts`.
5. Add unit tests in `mobile/domain/bearing.test.ts` covering:
   - North: bearing(0, 0, 0, 1) === 0
   - East: bearing(0, 0, 1, 0) === 90
   - South: bearing(0, 0, 0, -1) === 180
   - West: bearing(0, 0, -1, 0) === 270
   - Diagonal: bearing(0, 0, 1, 1) === 45
   - normalizeDelta(200) === -160, normalizeDelta(-200) === 160, normalizeDelta(0) === 0
   - Same point: bearing(0.5, 0.5, 0.5, 0.5) === 0 (handle division by zero gracefully)
6. Run `npm test -- mobile/domain/bearing.test.ts` and verify all pass.
7. Verify TypeScript: 0 errors.
  - Estimate: 30m
  - Files: mobile/domain/navGraph.ts, mobile/domain/bearing.test.ts
  - Verify: `npm test -- --run mobile/domain/bearing.test.ts` passes all 8 tests with 0 TypeScript errors
- [ ] **T02: Implement guidance state machine with pure helper functions** — Create the core guidance state machine in `mobile/routing/guidanceState.ts`. This is a pure TypeScript module with no React dependencies — fully unit-testable.

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
  - Estimate: 1h
  - Files: mobile/routing/guidanceState.ts, mobile/routing/guidanceState.test.ts
  - Verify: `npm test -- --run mobile/routing/guidanceState.test.ts` passes all tests with 0 TypeScript errors
- [ ] **T03: Implement useCurrentPosition hook with GPS + heading subscription** — Create the GPS + heading subscription hook in `mobile/hooks/useCurrentPosition.ts`. This is the position+heading interface that `useGuidanceSession` will consume. Keep the native module calls behind thin abstractions so the hook is testable without real device.

Steps:
1. Create `mobile/hooks/useCurrentPosition.ts` with:

   a. **PositionFix interface**:
      ```typescript
      interface PositionFix {
        latitude: number
        longitude: number
        accuracyMeters: number
        headingDegrees: number | null
        timestamp: number
      }
      ```

   b. **HeadingData interface**:
      ```typescript
      interface HeadingData {
        headingDegrees: number   // 0-360 magnetic north
        accuracyDegrees: number  // heading accuracy
      }
      ```

   c. **HeadingReader interface** (for testability — abstracts magnetometer API):
      ```typescript
      interface HeadingReader {
        start(callback: (data: HeadingData) => void): void
        stop(): void
      }
      ```

   d. **PositionReader interface** (for testability — abstracts geolocation API):
      ```typescript
      interface PositionReader {
        watchPosition(
          onPosition: (fix: PositionFix) => void,
          onError: (error: Error) => void,
        ): { stop: () => void }
      }
      ```

   e. **useCurrentPosition** hook with options:
      ```typescript
      interface UseCurrentPositionOptions {
        updateIntervalMs?: number        // default: 2000
        maxAccuracyMeters?: number       // default: 50, passed to isGpsFixConfident
        headingReader?: HeadingReader     // defaults to native magnetometer
        positionReader?: PositionReader  // defaults to native navigator.geolocation
      }
      ```

      Hook behavior:
      - On mount: subscribe to positionReader.watchPosition
      - Subscribe to headingReader (if available) — only trust heading when accuracyDegrees <= 15°
      - Apply exponential moving average (EMA) to heading: `smoothedHeading = alpha * newHeading + (1 - alpha) * smoothedHeading` where alpha = 0.3. Handle wraparound at 0°/360° by using the shorter angular path.
      - Return `{ position: PositionFix | null, heading: HeadingData | null, smoothedHeadingDegrees: number | null, isConfident: boolean, isHeadingValid: boolean }`
      - On unmount: stop both subscriptions

   f. **DefaultNativeHeadingReader** class implementing HeadingReader:
      - Uses `expo-sensors` Magnetometer if available in the environment
      - Falls back to no-op (isHeadingValid stays false)
      - Maps magnetometer events to { headingDegrees, accuracyDegrees: 10 } for simplicity

   g. **DefaultPositionReader** class implementing PositionReader:
      - Uses `navigator.geolocation.watchPosition` (React Native raw API, no extra package needed)
      - Maps native GeolocationPosition to PositionFix
      - Handles PERMISSION_DENIED, POSITION_UNAVAILABLE, TIMEOUT errors by calling onError

   h. **isGpsFixConfident** import from `src/shared/gps.ts` for the confidence check.

2. Create `mobile/hooks/useCurrentPosition.test.ts` with mocked PositionReader and HeadingReader:
   - Test: confident position with good heading → isConfident=true, isHeadingValid=true
   - Test: confident position with no heading → isConfident=true, isHeadingValid=false
   - Test: unconfident GPS (accuracy > threshold) → isConfident=false
   - Test: heading EMA smoothing: two readings 90° apart smooth toward new value
   - Test: cleanup: subscriptions stopped on unmount

3. Run `npm test -- --run mobile/hooks/useCurrentPosition.test.ts` and verify tests pass.
4. Verify TypeScript: 0 errors.
  - Estimate: 1h
  - Files: mobile/hooks/useCurrentPosition.ts, mobile/hooks/useCurrentPosition.test.ts
  - Verify: `npm test -- --run mobile/hooks/useCurrentPosition.test.ts` passes with 0 TypeScript errors
- [ ] **T04: Implement useGuidanceSession orchestrator hook** — Create the guidance session hook in `mobile/hooks/useGuidanceSession.ts` that wires together `useRouteSession` (from S02), `useCurrentPosition` (T03), and the guidance state machine (T02) into a live guidance loop.

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
  - Estimate: 1.5h
  - Files: mobile/hooks/useGuidanceSession.ts, mobile/hooks/useGuidanceSession.test.ts
  - Verify: `npm test -- --run mobile/hooks/useGuidanceSession.test.ts` passes with 0 TypeScript errors
- [ ] **T05: Implement LiveGuidanceOverlay and ConfidenceIndicator UI components** — Create the guidance UI components in `mobile/components/guidance/`. These are the visual layer S04 will later enhance with floor-aware overlays and accessible mode parity.

Steps:
1. Create directory `mobile/components/guidance/`.

2. Create `mobile/components/guidance/ConfidenceIndicator.tsx`:
   - Props: `confidence: ConfidenceLevel`
   - Renders a small colored dot:
     - 'high' → green (#22c55e)
     - 'medium' → yellow (#eab308)
     - 'low' → orange (#f97316)
     - 'none' → red (#ef4444) with an icon (e.g., a question mark or GPS-off icon)
   - The dot should be a View with borderRadius: 9999, width/height 12px.
   - Optional: clicking reveals a small popover/modal with confidence details (accuracy, heading accuracy). Implement this as a simple Pressable that toggles a Text label.
   - Export type `ConfidenceLevel` from this file (re-exported from guidanceState).

3. Create `mobile/components/guidance/LiveGuidanceOverlay.tsx`:
   - Props:
     ```typescript
     interface LiveGuidanceOverlayProps {
       guidanceState: GuidanceState
       onConfirmPosition: () => void
       onStopGuidance: () => void
     }
     ```
   - Conditionally renders based on guidanceState.phase:
     - **idle**: Render nothing (null)
     - **low-confidence**: Render a banner:
       - Orange/yellow background
       - Text: "Can't confirm your location. Tap the map to confirm where you are, or move to an open area."
       - ConfidenceIndicator dot on the left
       - "Confirm location" button (calls onConfirmPosition)
     - **guiding**: Render the main guidance card:
       - Large current step instruction text (e.g., "Walk 50m to the elevators")
       - StepIcon from the active step on the left
       - Distance remaining to destination
       - Progress indicator (e.g., "Step 2 of 5")
       - ConfidenceIndicator dot in the corner
       - Small "End guidance" text button (onStopGuidance)
     - **rerouting**: Render a banner:
       - Blue background
       - Text: "Recalculating your route..."
       - A loading spinner (ActivityIndicator from react-native)
     - **arrived**: Render a celebration card:
       - Green checkmark icon
       - "You've arrived!" text
       - Destination name
       - "Done" button (onStopGuidance)
   - Use StyleSheet.create for styling. Keep colors consistent with a shared constants file if one exists, otherwise define inline.

4. Create `mobile/components/guidance/LiveGuidanceOverlay.test.tsx` and `ConfidenceIndicator.test.tsx`:
   - Since the project uses jsdom environment (per vitest config), these will be smoke tests checking component renders without crash for each phase.
   - Test: ConfidenceIndicator renders green dot for 'high', red for 'none', etc.
   - Test: LiveGuidanceOverlay renders null for 'idle' phase
   - Test: LiveGuidanceOverlay renders guidance card for 'guiding' phase
   - Test: LiveGuidanceOverlay renders low-confidence banner for 'low-confidence' phase
   - Test: LiveGuidanceOverlay renders arrived card for 'arrived' phase

5. Run `npm test -- --run mobile/components/guidance/` and verify all pass.
6. Verify TypeScript: 0 errors.
  - Estimate: 45m
  - Files: mobile/components/guidance/ConfidenceIndicator.tsx, mobile/components/guidance/LiveGuidanceOverlay.tsx, mobile/components/guidance/ConfidenceIndicator.test.tsx, mobile/components/guidance/LiveGuidanceOverlay.test.tsx
  - Verify: `npm test -- --run mobile/components/guidance/` passes with 0 TypeScript errors
- [ ] **T06: Wire guidance into App and verify TypeScript clean** — Wire the guidance components into App.tsx and add a guidance start/stop UI. Also export bearing from navGraph.ts and ensure all S03 exports are re-exported from a single entry point.

Steps:
1. In `mobile/App.tsx`:
   a. Import `useGuidanceSession` from `mobile/hooks/useGuidanceSession`
   b. Import `LiveGuidanceOverlay` from `mobile/components/guidance/LiveGuidanceOverlay`
   c. Import `ConfidenceIndicator` from `mobile/components/guidance/ConfidenceIndicator`
   d. Import `useCurrentPosition` from `mobile/hooks/useCurrentPosition`
   e. In the component, call `useGuidanceSession({ graph, route: routeSessionState, updateIntervalMs: 2000 })` — only when routeSessionState.phase === 'ready'
   f. Add a "Start Guidance" button to the RoutePreview area (visible when routeSessionState.phase === 'ready' and guidanceState.phase === 'idle'). Pressing it calls `startGuidance()`.
   g. When guidanceState.phase !== 'idle', render `LiveGuidanceOverlay` overlaid on the map viewport.
   h. When guidance is active, show the `ConfidenceIndicator` dot in a fixed position (e.g., top-right corner of the screen).
   i. Pass `onConfirmPosition={confirmPosition}` and `onStopGuidance={stopGuidance}` to LiveGuidanceOverlay.

2. Add guidance start/stop buttons:
   - "Start Guidance" button: visible when route is ready and not yet guiding
   - Hidden when guidance is active (LiveGuidanceOverlay has its own "End" button)
   - Style: consistent with existing destination picker / route preview buttons

3. Create `mobile/routing/index.ts` that re-exports all routing-related public API from S02 and S03:
   ```typescript
   export { MobilePathfindingEngine } from './pathfindingEngine'
   export { computeRouteSession } from './routeSessionState'
   export type { RouteSessionState, RouteSessionReadyState } from './routeSessionState'
   export { guidanceState, deriveConfidence, isOffRoute, shouldAdvanceStep, deriveNextPhase, getActiveStep } from './guidanceState'
   export type { GuidanceState, GuidancePhase, ConfidenceLevel } from './guidanceState'
   export { bearing, normalizeDelta } from '../domain/navGraph'
   ```

4. Create `mobile/hooks/index.ts` that re-exports:
   ```typescript
   export { useCurrentPosition } from './useCurrentPosition'
   export type { PositionFix, HeadingData } from './useCurrentPosition'
   export { useGuidanceSession } from './useGuidanceSession'
   export type { UseGuidanceSessionResult, UseGuidanceSessionProps } from './useGuidanceSession'
   ```

5. Run `npm run typecheck` and fix any TypeScript errors.
6. Run `npm test -- --run` to verify all S03 tests still pass.
7. Verify: no TypeScript errors across the entire mobile/ directory.
  - Estimate: 30m
  - Files: mobile/App.tsx, mobile/routing/index.ts, mobile/hooks/index.ts
  - Verify: `npm run typecheck` returns 0 errors and `npm test -- --run` shows all S03 tests passing
