---
phase: 17-multi-floor-pathfinding-engine
plan: 02
type: tdd
wave: 2
depends_on:
  - 17-01
files_modified:
  - src/shared/pathfinding/engine.ts
  - src/shared/__tests__/pathfinding.test.ts
autonomous: true
requirements:
  - MFLR-03

must_haves:
  truths:
    - "A* heuristic returns 0 for cross-floor node pairs (different floorId) — admissible for inter-floor routing"
    - "Standard mode finds the shortest cross-floor path including stairs connector"
    - "Accessible mode routes across floors via elevator/ramp — returns not-found when only stairs connectors exist"
    - "PathfindingEngine constructor and findRoute signature are unchanged — existing call sites require no modification"
    - "All existing pathfinding tests still pass"
  artifacts:
    - path: "src/shared/pathfinding/engine.ts"
      provides: "Updated heuristic: returns 0 when a.data.floorId !== b.data.floorId"
    - path: "src/shared/__tests__/pathfinding.test.ts"
      provides: "Cross-floor routing test cases using multi-floor-test-graph.json fixture"
  key_links:
    - from: "src/shared/pathfinding/engine.ts"
      to: "NavNodeData.floorId"
      via: "heuristic lambda: if a.data.floorId !== b.data.floorId return 0"
      pattern: "floorId"
---

<objective>
Update the A* heuristic inside PathfindingEngine to return 0 for node pairs on different floors. This keeps the heuristic admissible (never overestimates) for cross-floor routing, allowing the engine to find optimal paths that traverse inter-floor edges synthesized in Plan 01.

Purpose: The Euclidean x,y distance between nodes on different floors is meaningless — it would cause the heuristic to be inadmissible and miss valid cross-floor paths. Returning 0 makes the heuristic conservative (always admissible) while inter-floor edges provide the actual cost signal.
Output: Updated engine.ts heuristic, new cross-floor pathfinding tests.
</objective>

<execution_context>
@C:/Users/admin/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/admin/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/17-multi-floor-pathfinding-engine/17-01-SUMMARY.md
@.planning/phases/17-multi-floor-pathfinding-engine/17-CONTEXT.md

<interfaces>
<!-- Key types and patterns the executor needs. -->

From src/shared/pathfinding/engine.ts (current heuristic — both finders):
```typescript
heuristic: (a: Node<NavNodeData>, b: Node<NavNodeData>) =>
  calculateWeight(a.data.x, a.data.y, b.data.x, b.data.y),
```
Change to:
```typescript
heuristic: (a: Node<NavNodeData>, b: Node<NavNodeData>) =>
  a.data.floorId !== b.data.floorId
    ? 0
    : calculateWeight(a.data.x, a.data.y, b.data.x, b.data.y),
```
Apply this change to BOTH standardFinder and accessibleFinder heuristics.

From src/shared/__tests__/fixtures/multi-floor-test-graph.json (created in Plan 01):
```json
// Two-floor graph with stairs-f1 ↔ stairs-f2 and elevator-f1 ↔ elevator-f2
// entrance → corridor-1 → stairs-f1 --(inter-floor)--> stairs-f2 → room-201
// entrance → corridor-1 → elevator-f1 --(inter-floor)--> elevator-f2 → room-201
```

From src/shared/__tests__/pathfinding.test.ts (existing tests — must keep passing):
```typescript
// All existing tests use testGraph (single-floor test-graph.json)
// New tests add multiFloorGraph (multi-floor-test-graph.json)
```
</interfaces>
</context>

<feature>
  <name>Cross-floor heuristic and pathfinding tests</name>
  <files>
    src/shared/pathfinding/engine.ts,
    src/shared/__tests__/pathfinding.test.ts
  </files>
  <behavior>
    **New cross-floor pathfinding tests (using multi-floor-test-graph.json):**
    - Test 1: Standard mode finds cross-floor path entrance → room-201 via stairs
      - result.found === true
      - result.nodeIds includes 'stairs-f1' and 'stairs-f2' in sequence
      - result.totalDistance > 0
    - Test 2: Accessible mode finds cross-floor path entrance → room-201 via elevator
      - result.found === true
      - result.nodeIds includes 'elevator-f1' and 'elevator-f2' in sequence
      - result.nodeIds does NOT include 'stairs-f1' or 'stairs-f2'
    - Test 3: Accessible mode returns not-found when only stairs path exists
      - Build a single-connector graph with only stairs (no elevator) between floors
      - engine.findRoute(start, dest, 'accessible').found === false
    - Test 4: Same-floor routing still works after heuristic change
      - engine.findRoute('entrance', 'corridor-1', 'standard').found === true (within floor 1)
    - Test 5: Cross-floor path has correct segments count
      - entrance → corridor-1 → stairs-f1 → stairs-f2 → room-201 = 4 segments

    **engine.ts heuristic change:**
    - Both standardFinder and accessibleFinder heuristics: return 0 if a.data.floorId !== b.data.floorId
    - Otherwise: return calculateWeight(a.data.x, a.data.y, b.data.x, b.data.y)
    - No other changes to engine.ts — constructor signature, findRoute signature, NOT_FOUND constant all unchanged
  </behavior>
  <implementation>
    RED: Add the 5 new test cases in pathfinding.test.ts importing multiFloorGraph from fixtures/multi-floor-test-graph.json. Run `npm test -- pathfinding` — new tests must fail (heuristic not yet updated), existing tests must pass.

    GREEN: Update the heuristic lambdas in engine.ts (both standardFinder and accessibleFinder) to return 0 for cross-floor pairs. Run `npm test -- pathfinding` — all tests pass.

    REFACTOR: Verify TypeScript: `npx tsc --noEmit`. Clean up any redundant code.
  </implementation>
</feature>

<verification>
```
npm test -- pathfinding
```
All 5 new tests pass. All existing pathfinding tests pass. `npx tsc --noEmit` exits 0.
</verification>

<success_criteria>
- Both A* heuristic functions return 0 when a.data.floorId !== b.data.floorId
- Cross-floor standard route found via stairs connector (entrance → room-201 multi-floor fixture)
- Cross-floor accessible route found via elevator connector (avoids stairs)
- Accessible mode returns not-found when only stairs path exists between floors
- npm test -- pathfinding: all pass
</success_criteria>

<output>
After completion, create `.planning/phases/17-multi-floor-pathfinding-engine/17-02-SUMMARY.md`
</output>
