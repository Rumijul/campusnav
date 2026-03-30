---
estimated_steps: 39
estimated_files: 5
skills_used: []
---

# T02: Route session state machine + useRouteSession hook

## Task T02 — Route Session State Machine + useRouteSession Hook

### Why
The routing computation is only part of the trip setup loop. T02 wires together: route selection state (start/destination), route computation (T01 engine), direction generation (T01), and reactive floor-context updates. It produces a self-contained `useRouteSession` hook that App.tsx can drop in without knowing the implementation details.

### Files
**Created:**
- `mobile/routing/routeSessionState.ts` — State machine types and constants
- `mobile/routing/useRouteSession.ts` — Main hook consuming all routing pieces
- `mobile/routing/useRouteSession.test.ts` — State transitions, error states, mode switching
- `mobile/hooks/useRouteSelection.ts` — Port of web `useRouteSelection` hook (pure React)
- `mobile/hooks/useRouteSelection.test.ts` — Field advancement, swap, clear, tap assignment

**Modified:**
- `mobile/domain/navGraph.ts` (no change — imports from there)

### Do
1. **Implement `mobile/routing/routeSessionState.ts`**:
   - Define `RouteSessionPhase = 'idle' | 'computing' | 'ready' | 'no-route' | 'error'`
   - Define `RouteSessionState` discriminated union carrying: phase, start/destination `NavNode | null`, `RouteMode`, `PathResult | null`, `DirectionsResult | null`, error message
   - Define `RouteSessionOptions = { graph: NormalizedNavGraph; mode: RouteMode; start: NavNode | null; destination: NavNode | null }`
   - Export pure `computeRouteSession(options): RouteSessionState` function that runs synchronously (A* is fast)
   - On `start === null || destination === null`: return `idle` state
   - On route found: return `ready` with PathResult + DirectionsResult
   - On route not found: return `no-route`
   - On node not in graph: return `error`

2. **Implement `mobile/routing/useRouteSession.ts`**:
   - Accept props: `{ graph: NormalizedNavGraph; selection: RouteSelection }` where `RouteSelection` is from `../hooks/useRouteSelection`
   - Use `useMemo` to run `computeRouteSession` whenever `graph`, `selection.start`, `selection.destination` change
   - Track `routeMode` state separately (`'standard' | 'accessible'`) — expose `setRouteMode`
   - Expose: `{ sessionState, routeMode, setRouteMode }`

3. **Write `mobile/routing/useRouteSession.test.ts`**:
   - Mock `NormalizedNavGraph` with `createTestNavGraph()` from T01
   - Test: idle when no selection, computing→ready on both-selected, no-route when unreachable, accessible mode filtering

4. **Port `mobile/hooks/useRouteSelection.ts`**:
   - Copy `src/client/hooks/useRouteSelection.ts` verbatim but:
     - Replace `@shared/types` import with relative `../../src/shared/types`
     - Add `RouteSelection` to the interface (inline the type since this is a small hook)
   - The hook is pure React — no external mobile dependencies needed

5. **Write `mobile/hooks/useRouteSelection.test.ts`**:
   - Use `@testing-library/react-hooks` or Vitest's `fn()` mocking
   - Test: `setFromTap` advances activeField, swap exchanges start/destination, clearAll resets state, tapping same field skips duplicate

6. **Verify**: `npm --prefix mobile run test -- mobile/routing/routeSessionState.test.ts mobile/routing/useRouteSession.test.ts mobile/hooks/useRouteSelection.test.ts` → all pass. `npm --prefix mobile run typecheck` → 0 errors.

## Inputs

- `mobile/routing/pathfindingEngine.ts`
- `mobile/routing/generateDirections.ts`
- `src/client/hooks/useRouteSelection.ts`
- `mobile/domain/navGraph.ts`

## Expected Output

- `mobile/routing/routeSessionState.ts`
- `mobile/routing/useRouteSession.ts`
- `mobile/routing/useRouteSession.test.ts`
- `mobile/hooks/useRouteSelection.ts`
- `mobile/hooks/useRouteSelection.test.ts`

## Verification

npm --prefix mobile run test -- mobile/routing/routeSessionState.test.ts mobile/routing/useRouteSession.test.ts mobile/hooks/useRouteSelection.test.ts && npm --prefix mobile run typecheck

## Observability Impact

Route session exposes phase as a discriminated union tag — visible in React DevTools as 'idle' | 'computing' | 'ready' | 'no-route' | 'error'.
