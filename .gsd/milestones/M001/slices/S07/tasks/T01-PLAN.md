---
phase: 06-route-visualization-directions
plan: 01
type: tdd
wave: 1
depends_on: []
files_modified:
  - src/client/hooks/useRouteDirections.ts
  - src/client/hooks/useRouteDirections.test.ts
autonomous: true
requirements:
  - ROUT-05
  - ROUT-06

must_haves:
  truths:
    - "Given a path of nodeIds + a node map, the hook returns a list of turn-by-turn direction steps with instruction text and time estimate"
    - "A step's instruction references nearby landmark node labels (e.g. 'Turn left at the cafeteria')"
    - "Walking time is derived from segment distances using standard or accessible speed constants"
    - "Bearing delta < 30° produces a 'Continue straight' step; 30–120° produces 'Turn left/right'; > 120° produces 'Sharp turn'"
    - "When routes are identical (same nodeIds), routesAreIdentical() returns true"
    - "When only 0 or 1 nodes exist in the path, returns empty steps with 0 totalTime"
  artifacts:
    - path: "src/client/hooks/useRouteDirections.ts"
      provides: "useRouteDirections hook and routesAreIdentical utility"
      exports: ["useRouteDirections", "routesAreIdentical", "DirectionStep", "DirectionsResult"]
    - path: "src/client/hooks/useRouteDirections.test.ts"
      provides: "Unit tests for all step-generation cases"
      contains: "routesAreIdentical"
  key_links:
    - from: "src/client/hooks/useRouteDirections.ts"
      to: "src/shared/pathfinding/types.ts"
      via: "PathResult import"
      pattern: "PathResult"
    - from: "src/client/hooks/useRouteDirections.ts"
      to: "src/shared/types.ts"
      via: "NavNode import"
      pattern: "NavNode"
---

<objective>
Implement useRouteDirections — a pure step-generation hook that converts a PathResult + node map into turn-by-turn walking directions with landmark references and time estimates.

Purpose: Provides the data layer for DirectionsSheet (Plan 03). All business logic is testable in isolation before UI is built.
Output: useRouteDirections hook, routesAreIdentical utility, DirectionStep/DirectionsResult types, passing unit tests.
</objective>

<execution_context>
@C:/Users/admin/.config/opencode/get-shit-done/workflows/execute-plan.md
@C:/Users/admin/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@src/shared/pathfinding/types.ts
@src/shared/types.ts
@src/server/assets/campus-graph.json
</context>

<feature>
  <name>useRouteDirections — turn-by-turn step generation</name>
  <files>src/client/hooks/useRouteDirections.ts, src/client/hooks/useRouteDirections.test.ts</files>
  <behavior>
## Types to export

```typescript
export type StepIcon = 'straight' | 'turn-left' | 'turn-right' | 'sharp-left' | 'sharp-right' | 'arrive' | 'accessible'

export interface DirectionStep {
  instruction: string      // e.g. "Turn left at the cafeteria"
  icon: StepIcon
  distanceM: number        // segment distance in normalized units (used for time calc)
  durationSec: number      // estimated seconds for this segment
  isAccessibleSegment: boolean  // true if this segment uses a ramp/accessible node
}

export interface DirectionsResult {
  steps: DirectionStep[]
  totalDistanceNorm: number   // sum of all segment distances (normalized units)
  totalDurationSec: number    // sum of all step durations
}
```

## Constants (Claude's discretion — use these values)

```typescript
const WALKING_SPEED_STANDARD = 0.023   // normalized units/s
const WALKING_SPEED_ACCESSIBLE = 0.013 // normalized units/s
```

## Core function: generateDirections

```typescript
function generateDirections(
  nodeIds: string[],
  nodeMap: Map<string, NavNode>,
  mode: 'standard' | 'accessible'
): DirectionsResult
```

Algorithm:
1. If nodeIds.length < 2: return { steps: [], totalDistanceNorm: 0, totalDurationSec: 0 }
2. For each consecutive triple (prev, curr, next) in nodeIds:
   a. Compute bearing from prev→curr and from curr→next
   b. Delta = normalize angle difference to [-180, 180]
   c. Classify delta:
      - |delta| < 30 → icon: 'straight', instruction: "Continue straight"
      - 30 ≤ |delta| < 120, delta > 0 → icon: 'turn-right', instruction: "Turn right"
      - 30 ≤ |delta| < 120, delta < 0 → icon: 'turn-left', instruction: "Turn left"
      - |delta| ≥ 120, delta > 0 → icon: 'sharp-right', instruction: "Sharp right"
      - |delta| ≥ 120, delta < 0 → icon: 'sharp-left', instruction: "Sharp left"
   d. Landmark reference: if curr node has type in ['room','landmark','entrance','elevator','restroom'] AND searchable=true:
      - Append " at the {curr.label}" to instruction (e.g. "Turn left at the cafeteria")
   e. isAccessibleSegment: curr.type === 'ramp' OR curr.type === 'elevator'
   f. Segment distance: Euclidean distance from prev coords to curr coords (normalized)
   g. durationSec = segmentDistance / walkingSpeed
3. Final step: icon: 'arrive', instruction: "Arrive at {last node label}", durationSec for last segment
4. Return steps, totalDistanceNorm, totalDurationSec

## routesAreIdentical utility

```typescript
export function routesAreIdentical(a: PathResult, b: PathResult): boolean {
  if (!a.found || !b.found) return false
  if (a.nodeIds.length !== b.nodeIds.length) return false
  return a.nodeIds.every((id, i) => id === b.nodeIds[i])
}
```

## Hook: useRouteDirections

```typescript
export function useRouteDirections(
  pathResult: PathResult | null,
  nodeMap: Map<string, NavNode>,
  mode: 'standard' | 'accessible'
): DirectionsResult
```
- Returns memoized DirectionsResult
- When pathResult is null or pathResult.found === false: returns empty result
- Uses useMemo with deps [pathResult, nodeMap, mode]

## Test cases

Input/output for unit tests:
- nodeIds.length === 0 → steps: [], totalDistanceNorm: 0, totalDurationSec: 0
- nodeIds.length === 1 → steps: [], totalDistanceNorm: 0, totalDurationSec: 0
- nodeIds.length === 2 → single 'arrive' step with correct durationSec
- Straight path (3 collinear nodes) → first step icon: 'straight', second step icon: 'arrive'
- Left turn path (bearing change ~90° left) → first step icon: 'turn-left'
- routesAreIdentical: same nodeIds → true; different nodeIds → false; one not found → false
  </behavior>
  <implementation>
1. Create src/client/hooks/useRouteDirections.ts with the exported types, constants, generateDirections function, routesAreIdentical utility, and useRouteDirections hook.
2. Create src/client/hooks/useRouteDirections.test.ts using vitest (import { describe, it, expect } from 'vitest'). Test file imports from './useRouteDirections'. Build minimal NavNode/PathResult fixtures inline in the test file (no JSON files needed). Cover all 6 test cases listed above.
3. Run `npx vitest run src/client/hooks/useRouteDirections.test.ts` to verify tests pass.
4. Run `npx biome check src/client/hooks/useRouteDirections.ts src/client/hooks/useRouteDirections.test.ts` to verify lint clean.
  </implementation>
</feature>

<verification>
- `npx vitest run src/client/hooks/useRouteDirections.test.ts` exits 0, all tests pass
- `npx biome check src/client/hooks/useRouteDirections.ts src/client/hooks/useRouteDirections.test.ts` exits 0
- `npx tsc --noEmit` exits 0
</verification>

<success_criteria>
- useRouteDirections.ts exists and exports: useRouteDirections, routesAreIdentical, DirectionStep, DirectionsResult
- All unit tests pass (straight path, turn-left, arrive, empty, identical routes)
- TypeScript strict mode passes, Biome lint clean
</success_criteria>

<output>
After completion, create `.planning/phases/06-route-visualization-directions/06-01-SUMMARY.md`
</output>
