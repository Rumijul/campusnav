---
phase: 19-student-floor-tab-ui
plan: "00"
type: execute
wave: 0
depends_on: []
files_modified:
  - src/client/hooks/useFloorFiltering.test.ts
autonomous: true
requirements: [MFLR-05, MFLR-06, CAMP-05]

must_haves:
  truths:
    - "Test file exists at src/client/hooks/useFloorFiltering.test.ts"
    - "All 7 test stubs are present and fail (RED state) — no production functions exist yet"
    - "Vitest picks up the file and reports N failing tests"
  artifacts:
    - path: "src/client/hooks/useFloorFiltering.test.ts"
      provides: "Stub unit tests for filterNodesByActiveFloor, filterRouteSegmentByFloor, totalFloorCount"
      min_lines: 60
  key_links:
    - from: "src/client/hooks/useFloorFiltering.test.ts"
      to: "src/client/hooks/useFloorFiltering.ts"
      via: "import of pure functions (file will not exist yet — RED state expected)"
      pattern: "from.*useFloorFiltering"
---

<objective>
Create the Wave 0 test stub for Phase 19's filtering pure functions.

Purpose: Nyquist compliance — tests must exist (and fail) before implementation, establishing the RED state for the TDD loop in Plan 01.
Output: `src/client/hooks/useFloorFiltering.test.ts` with 7 failing test stubs.
</objective>

<execution_context>
@C:/Users/admin/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/admin/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/19-student-floor-tab-ui/19-CONTEXT.md
@.planning/phases/19-student-floor-tab-ui/19-RESEARCH.md
@.planning/phases/19-student-floor-tab-ui/19-VALIDATION.md

<interfaces>
<!-- Key types the test stubs will import against -->
<!-- Source: src/shared/types.ts -->
```typescript
export interface NavNode extends NavNodeData {
  id: string
  floorId: number
  type: NavNodeType  // 'room'|'entrance'|'elevator'|'stairs'|'ramp'|'restroom'|'junction'|'hallway'|'landmark'
  x: number
  y: number
  label: string
  searchable: boolean
  connectsToFloorAboveId?: number
  connectsToFloorBelowId?: number
  connectsToNodeAboveId?: string
  connectsToNodeBelowId?: string
}

export interface NavFloor {
  id: number
  floorNumber: number
  imagePath: string
  updatedAt: string
  nodes: NavNode[]
  edges: NavEdge[]
}

export interface NavBuilding {
  id: number
  name: string
  floors: NavFloor[]
}
```

<!-- Functions to be imported (DO NOT EXIST YET — import will fail, causing RED) -->
<!-- Source: src/client/hooks/useFloorFiltering.ts (to be created in Plan 01) -->
```typescript
// These imports will fail until Plan 01 creates the file
import { filterNodesByActiveFloor, filterRouteSegmentByFloor, totalFloorCount } from './useFloorFiltering'
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Create useFloorFiltering.test.ts stub (RED state)</name>
  <files>src/client/hooks/useFloorFiltering.test.ts</files>
  <behavior>
    - Test 1: filterNodesByActiveFloor — nodes on active floor are included
    - Test 2: filterNodesByActiveFloor — elevator nodes from adjacent floors are included and dimmed
    - Test 3: filterNodesByActiveFloor — stairs/ramp nodes from adjacent floors are NOT included
    - Test 4: filterRouteSegmentByFloor — route nodeIds filtered to active floor only
    - Test 5: filterRouteSegmentByFloor — returns empty array when no route nodes on active floor
    - Test 6: totalFloorCount — returns 1 for single-floor campus
    - Test 7: totalFloorCount — returns N for multi-building campus
  </behavior>
  <action>
Create `src/client/hooks/useFloorFiltering.test.ts` with 7 unit tests using Vitest `describe`/`it`/`expect`.

The file imports `filterNodesByActiveFloor`, `filterRouteSegmentByFloor`, and `totalFloorCount` from `./useFloorFiltering` (this file does NOT exist yet — the import will cause the test file to error/fail, establishing the RED state that Plan 01 will resolve).

Build minimal fixture data inline in the test file — no external fixture JSON needed. Use simple factory objects:

```typescript
import { describe, expect, it } from 'vitest'
import { filterNodesByActiveFloor, filterRouteSegmentByFloor, totalFloorCount } from './useFloorFiltering'
import type { NavBuilding, NavNode } from '@shared/types'

// Minimal NavNode factory
function makeNode(overrides: Partial<NavNode> & { id: string; floorId: number }): NavNode {
  return {
    x: 0.5, y: 0.5, label: 'Test', type: 'room', searchable: true,
    ...overrides,
  }
}
```

Test fixture: Two floors (id: 1 and id: 2). Floor 1 has a room node and a stairs node (hidden). Floor 2 has an elevator node that `connectsToFloorBelowId: 1`, making it an adjacent-floor connector visible on floor 1 as dimmed.

filterNodesByActiveFloor signature expectation:
```typescript
// Returns: { nodes: NavNode[], dimmedNodeIds: Set<string> }
filterNodesByActiveFloor(allNodes: NavNode[], activeFloorId: number): { nodes: NavNode[], dimmedNodeIds: Set<string> }
```

filterRouteSegmentByFloor signature expectation:
```typescript
// Returns filtered nodeIds belonging to activeFloorId
filterRouteSegmentByFloor(nodeIds: string[], nodeMap: Map<string, NavNode>, activeFloorId: number): string[]
```

totalFloorCount signature expectation:
```typescript
totalFloorCount(buildings: NavBuilding[]): number
```

All tests use `expect(result).toEqual(expected)` or `expect(result.size).toBe(N)` patterns. Do NOT mock anything — these are pure functions.
  </action>
  <verify>
    <automated>npx vitest run src/client/hooks/useFloorFiltering.test.ts --reporter=verbose 2>&1 | tail -20</automated>
  </verify>
  <done>Test file exists with 7 test stubs; Vitest reports them as failing/erroring (RED state). No production implementation yet.</done>
</task>

</tasks>

<verification>
Run `npx vitest run src/client/hooks/useFloorFiltering.test.ts --reporter=verbose` and confirm:
- File is picked up by Vitest
- Tests fail/error (not "no tests found")
- The failure is due to missing module `./useFloorFiltering` (expected RED state)
</verification>

<success_criteria>
- `src/client/hooks/useFloorFiltering.test.ts` exists with all 7 test cases
- Vitest picks up the file
- Tests are in RED state (failing) — production functions do not exist yet
- Import path `./useFloorFiltering` is correctly referenced (will be created in Plan 01)
</success_criteria>

<output>
After completion, create `.planning/phases/19-student-floor-tab-ui/19-00-SUMMARY.md`
</output>
