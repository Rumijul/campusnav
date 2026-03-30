---
estimated_steps: 35
estimated_files: 3
skills_used: []
---

# T06: Wire guidance into App and verify TypeScript clean

Wire the guidance components into App.tsx and add a guidance start/stop UI. Also export bearing from navGraph.ts and ensure all S03 exports are re-exported from a single entry point.

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

## Inputs

- `mobile/hooks/useGuidanceSession.ts`
- `mobile/components/guidance/LiveGuidanceOverlay.tsx`
- `mobile/components/guidance/ConfidenceIndicator.tsx`
- `mobile/domain/navGraph.ts`

## Expected Output

- `mobile/App.tsx`
- `mobile/routing/index.ts`
- `mobile/hooks/index.ts`

## Verification

`npm run typecheck` returns 0 errors and `npm test -- --run` shows all S03 tests passing

## Observability Impact

None
