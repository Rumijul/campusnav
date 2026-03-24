---
phase: 17-multi-floor-pathfinding-engine
plan: "01"
subsystem: pathfinding
tags: [graph-builder, multi-floor, tdd, inter-floor-edges]
dependency_graph:
  requires: []
  provides: [cross-floor-edge-synthesis, multi-floor-graph]
  affects: [pathfinding-engine, A*-router]
tech_stack:
  added: []
  patterns: [two-pass graph construction, connector-node inter-floor synthesis, processed-pair deduplication Set]
key_files:
  created:
    - src/shared/__tests__/fixtures/multi-floor-test-graph.json
  modified:
    - src/shared/pathfinding/graph-builder.ts
    - src/shared/__tests__/graph-builder.test.ts
decisions:
  - buildGraph iterates buildings→floors directly (no flattenNavGraph internal call) to avoid losing floor-connector metadata
  - Two-pass construction: pass 1 adds all nodes+intra-floor edges, pass 2 synthesizes inter-floor links from connectsToNodeAboveId
  - processed-pair Set (sorted canonical key) prevents duplicate inter-floor link creation when both connector nodes reference each other
  - flattenNavGraph export retained unchanged for admin editor (MapEditorCanvas.tsx) — only its internal call inside buildGraph was removed
  - Inter-floor edges are synthesized purely from node data — no JSON-stored inter-floor edges needed in fixture
  - Pre-existing TypeScript errors in useRouteDirections.ts are out-of-scope (confirmed pre-existing before this plan)
metrics:
  duration: "2 min"
  completed_date: "2026-03-01"
  tasks_completed: 3
  files_changed: 3
---

# Phase 17 Plan 01: Cross-floor Edge Synthesis in buildGraph Summary

**One-liner:** Two-pass buildGraph iterates buildings→floors directly and synthesizes bidirectional inter-floor edges from connectsToNodeAboveId on stairs/elevator/ramp connector nodes, replacing the flattenNavGraph shim call.

## What Was Built

Updated `buildGraph` in `graph-builder.ts` to synthesize cross-floor edges at graph construction time, making the A* pathfinding engine capable of routing across floors without any JSON-stored inter-floor edge data.

**Key changes:**
- `buildGraph` now iterates `navGraph.buildings → building.floors` directly in Pass 1, adding nodes and intra-floor edges (with Infinity normalization preserved)
- Pass 2 iterates all graph nodes; for any `stairs`, `elevator`, or `ramp` node with `connectsToNodeAboveId` pointing to an existing graph node, it adds two directed links (bidirectional) with fixed weights
- Stairs inter-floor: `standardWeight=0.3`, `accessibleWeight=Infinity`, `accessible=false`
- Elevator/ramp inter-floor: `standardWeight=0.3`, `accessibleWeight=0.45`, `accessible=true`
- `flattenNavGraph` export is retained (admin editor depends on it) — only the internal call from `buildGraph` was removed

**Test fixture created:** `multi-floor-test-graph.json` — a two-floor building with 4 nodes on floor 1 (entrance, corridor-1, stairs-f1, elevator-f1) and 3 nodes on floor 2 (stairs-f2, elevator-f2, room-201). No inter-floor edges in JSON; all synthesized by `buildGraph`.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| RED | Add failing tests + fixture | 6c67277 | multi-floor-test-graph.json, graph-builder.test.ts |
| GREEN | Implement cross-floor edge synthesis | 1f61b3a | graph-builder.ts |

## Verification

```
npm test -- graph-builder
```

Result: 13/13 tests pass (8 pre-existing + 5 new inter-floor edge tests).

TypeScript: Pre-existing errors in `useRouteDirections.ts` confirmed out-of-scope (exist before this plan's changes).

## Deviations from Plan

None — plan executed exactly as written.

## Out-of-scope Discoveries

Pre-existing TypeScript errors in `src/client/hooks/useRouteDirections.ts` and `src/client/hooks/useRouteDirections.test.ts` (argument count mismatch, unused import, type mismatch). Confirmed pre-existing via `git stash` check. Logged for awareness; not fixed.

## Self-Check: PASSED

- FOUND: src/shared/pathfinding/graph-builder.ts
- FOUND: src/shared/__tests__/fixtures/multi-floor-test-graph.json
- FOUND: src/shared/__tests__/graph-builder.test.ts
- FOUND: .planning/phases/17-multi-floor-pathfinding-engine/17-01-SUMMARY.md
- FOUND: 6c67277 (RED phase commit)
- FOUND: 1f61b3a (GREEN phase commit)
