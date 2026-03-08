---
phase: 17-multi-floor-pathfinding-engine
plan: 03
type: tdd
wave: 1
depends_on: []
files_modified:
  - src/client/hooks/useRouteDirections.ts
  - src/client/hooks/useRouteDirections.test.ts
autonomous: true
requirements:
  - MFLR-03

must_haves:
  truths:
    - "generateDirections accepts a 4th floorMap parameter (Map<number, NavFloor>) and emits a floor-change step when adjacent node IDs are on different floors"
    - "Floor-change step instruction reads: 'Take the stairs to Floor N', 'Take the elevator to Floor N', or 'Take the ramp to Floor N' using connector node type and destination floor number"
    - "StepIcon has 4 new values: 'stairs-up', 'stairs-down', 'elevator', 'ramp' — distinct per connector type and vertical direction"
    - "All existing generateDirections tests pass with the new optional 4th parameter (backward compatible)"
    - "useRouteDirections hook signature unchanged — floorMap defaults to empty Map when not provided"
  artifacts:
    - path: "src/client/hooks/useRouteDirections.ts"
      provides: "Updated StepIcon type, floor-change step emission in generateDirections loop"
      contains: "stairs-up"
    - path: "src/client/hooks/useRouteDirections.test.ts"
      provides: "Tests for floor-change step detection and instruction text"
  key_links:
    - from: "src/client/hooks/useRouteDirections.ts"
      to: "NavNode.floorId + NavFloor.floorNumber"
      via: "compare curr.floorId vs next.floorId; look up floorMap.get(next.floorId).floorNumber"
      pattern: "floorId.*floorMap|floorMap.*floorId"
---

<objective>
Extend generateDirections to detect floor transitions in the route and emit human-readable "Take the stairs/elevator/ramp to Floor N" direction steps with appropriate new StepIcon values.

Purpose: Without floor-change steps, multi-floor routes are silent about the transition — users see "Continue straight" at a stairwell and nothing about going to a different floor. This delivers the direction-generation half of MFLR-03.
Output: Updated useRouteDirections.ts with floor-change branch; new test cases for floor-change steps.
</objective>

<execution_context>
@C:/Users/admin/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/admin/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/17-multi-floor-pathfinding-engine/17-CONTEXT.md

<interfaces>
<!-- Key types the executor needs. No codebase exploration required. -->

From src/shared/types.ts (NavFloor — needed for floorNumber lookup):
```typescript
export interface NavFloor {
  id: number           // floorMap key
  floorNumber: number  // "to Floor N" instruction uses this
  imagePath: string
  updatedAt: string
  nodes: NavNode[]
  edges: NavEdge[]
}

export interface NavNode extends NavNodeData {
  id: string
  floorId: number      // compare curr.floorId vs next.floorId
  type: NavNodeType    // 'stairs' | 'elevator' | 'ramp' determines icon and text
}
```

Current generateDirections signature:
```typescript
export function generateDirections(
  nodeIds: string[],
  nodeMap: Map<string, NavNode>,
  mode: 'standard' | 'accessible',
): DirectionsResult
```

New signature (4th parameter optional, backward compatible):
```typescript
export function generateDirections(
  nodeIds: string[],
  nodeMap: Map<string, NavNode>,
  mode: 'standard' | 'accessible',
  floorMap?: Map<number, NavFloor>,   // optional; defaults to new Map() if omitted
): DirectionsResult
```

Current StepIcon (to be extended):
```typescript
export type StepIcon =
  | 'straight' | 'turn-left' | 'turn-right'
  | 'sharp-left' | 'sharp-right'
  | 'arrive' | 'accessible'
```

New StepIcon (add 4 values):
```typescript
export type StepIcon =
  | 'straight' | 'turn-left' | 'turn-right'
  | 'sharp-left' | 'sharp-right'
  | 'arrive' | 'accessible'
  | 'stairs-up' | 'stairs-down' | 'elevator' | 'ramp'
```

Existing hook (no change to signature):
```typescript
export function useRouteDirections(
  pathResult: PathResult | null,
  nodeMap: Map<string, NavNode>,
  mode: 'standard' | 'accessible',
): DirectionsResult
// Note: hook does NOT add floorMap — Phase 19 will wire floorMap when it builds
// per-floor routing; for now the hook passes undefined (empty Map default)
```
</interfaces>
</context>

<feature>
  <name>Floor-change direction steps in generateDirections</name>
  <files>
    src/client/hooks/useRouteDirections.ts,
    src/client/hooks/useRouteDirections.test.ts
  </files>
  <behavior>
    **New StepIcon values:**
    - 'stairs-up': ascending stairs floor change
    - 'stairs-down': descending stairs floor change
    - 'elevator': elevator floor change (up or down)
    - 'ramp': ramp floor change (up or down)

    **Floor-change detection in the intermediate-node loop (indices 1..N-2):**
    - At each (prev, curr, next) triple: check if curr.floorId !== next.floorId
    - If different floors (floor transition happening at curr→next edge):
      - Determine icon:
        - curr.type === 'stairs': next.floorId > curr.floorId ? 'stairs-up' : 'stairs-down'
        - curr.type === 'elevator': 'elevator'
        - curr.type === 'ramp': 'ramp'
        - Any other type: treat as 'stairs-up' (fallback, should not occur)
      - Determine instruction text: look up destination floor number
        - destFloor = floorMap?.get(next.floorId)
        - floorNumber = destFloor?.floorNumber ?? next.floorId
        - instruction = `Take the ${connectorTypeName} to Floor ${floorNumber}`
        - connectorTypeName: stairs → 'stairs', elevator → 'elevator', ramp → 'ramp'
      - distanceM = euclideanDist(prev.x, prev.y, curr.x, curr.y) (same as normal step)
      - durationSec = distanceM / speed
      - isAccessibleSegment = curr.type === 'elevator' || curr.type === 'ramp'
      - Emit step with this floor-change data instead of the normal turn classification
    - If same floor: normal bearing-based turn classification as before

    **Tests to add in useRouteDirections.test.ts:**
    - Test 1: 3-node path where curr is stairs on floor 1, next is on floor 2
      - step.icon === 'stairs-up'
      - step.instruction === 'Take the stairs to Floor 2'
      - step.isAccessibleSegment === false
    - Test 2: stairs-down (next.floorId < curr.floorId)
      - step.icon === 'stairs-down'
      - step.instruction === 'Take the stairs to Floor 1'
    - Test 3: elevator floor change
      - step.icon === 'elevator'
      - step.instruction === 'Take the elevator to Floor 2'
      - step.isAccessibleSegment === true
    - Test 4: ramp floor change
      - step.icon === 'ramp'
      - step.instruction === 'Take the ramp to Floor 2'
      - step.isAccessibleSegment === true
    - Test 5: floorMap omitted (undefined) — instruction still emits with floorId as fallback number
    - Test 6: Existing non-floor-change tests pass unchanged (floorId same on all nodes)

    **buildInstruction must also handle new StepIcon values:**
    The `buildInstruction` function's `base` record currently excludes 'accessible' but includes all turn icons. Add the new floor-change icons to a separate branch or guard — floor-change steps bypass buildInstruction entirely (instruction is built inline in the floor-change branch).
  </behavior>
  <implementation>
    RED: Add the 6 test cases in useRouteDirections.test.ts. Helper: makeNode with floorId override. Build a makeFloorMap helper that creates Map<number, NavFloor>. Run `npm test -- useRouteDirections` — new tests must fail, existing tests must pass.

    GREEN: Update useRouteDirections.ts:
    1. Add 4 new values to StepIcon type
    2. Add floorMap optional 4th parameter to generateDirections
    3. In the intermediate-node loop: check curr.floorId !== next.floorId BEFORE the bearing calculation. If different floors, build the floor-change step and push; use `continue` to skip the normal turn classification for this iteration.
    4. Keep buildInstruction unchanged — floor-change steps set instruction inline, never call buildInstruction.
    5. useRouteDirections hook: no signature change — passes undefined (omits floorMap), which defaults to new Map() inside generateDirections.

    REFACTOR: Ensure TypeScript strict compliance — `npx tsc --noEmit`. Clean up any unused variables.
  </implementation>
</feature>

<verification>
```
npm test -- useRouteDirections
```
All 6 new tests pass. All existing useRouteDirections tests pass. `npx tsc --noEmit` exits 0.
</verification>

<success_criteria>
- StepIcon includes 'stairs-up', 'stairs-down', 'elevator', 'ramp'
- generateDirections 4th parameter is optional floorMap (backward compatible)
- Floor-change steps emitted when adjacent nodes have different floorId
- Instruction text: "Take the [type] to Floor [floorNumber]"
- isAccessibleSegment: true for elevator and ramp floor-change steps
- npm test -- useRouteDirections: all pass
</success_criteria>

<output>
After completion, create `.planning/phases/17-multi-floor-pathfinding-engine/17-03-SUMMARY.md`
</output>
