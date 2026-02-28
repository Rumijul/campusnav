---
phase: 07-api-data-persistence
plan: 03
type: execute
wave: 2
depends_on:
  - 07-01
files_modified:
  - src/client/hooks/useGraphData.ts
  - src/client/components/FloorPlanCanvas.tsx
  - src/client/components/LandmarkLayer.tsx
autonomous: true
requirements:
  - ADMN-02

must_haves:
  truths:
    - "useGraphData retries the fetch 1-2 times on failure before transitioning to error state"
    - "While graph data is loading, an animated HTML overlay spinner is shown on the map area"
    - "On persistent error after retries, a visible error message is shown on the map area"
    - "Only one GET /api/map request fires on page load (double-fetch eliminated)"
    - "LandmarkLayer receives nodes as a prop from FloorPlanCanvas — it no longer calls useGraphData itself"
  artifacts:
    - path: "src/client/hooks/useGraphData.ts"
      provides: "Graph data fetcher with retry logic (1-2 retries, fixed delay)"
      min_lines: 35
    - path: "src/client/components/FloorPlanCanvas.tsx"
      provides: "HTML overlay spinner/error for graph loading state; passes nodes prop to LandmarkLayer"
      min_lines: 80
    - path: "src/client/components/LandmarkLayer.tsx"
      provides: "Receives nodes as prop, no longer calls useGraphData internally"
      min_lines: 30
  key_links:
    - from: "src/client/components/FloorPlanCanvas.tsx"
      to: "src/client/hooks/useGraphData.ts"
      via: "const graphState = useGraphData()"
      pattern: "useGraphData"
    - from: "src/client/components/FloorPlanCanvas.tsx"
      to: "src/client/components/LandmarkLayer.tsx"
      via: "nodes={nodes} prop"
      pattern: "nodes=\\{nodes\\}"
---

<objective>
Add retry logic + HTML loading spinner to useGraphData, and fix the double-fetch by lifting graph state into FloorPlanCanvas and passing the nodes array as a prop to LandmarkLayer (eliminating LandmarkLayer's own useGraphData call).

Purpose: The student app now shows a meaningful loading state while graph data fetches from SQLite, handles transient errors gracefully, and makes exactly one network request on page load.
Output: useGraphData.ts (retry logic), FloorPlanCanvas.tsx (HTML spinner overlay, nodes prop), LandmarkLayer.tsx (accepts nodes prop)
</objective>

<execution_context>
@C:/Users/admin/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/admin/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@src/client/hooks/useGraphData.ts
@src/client/components/FloorPlanCanvas.tsx
@src/client/components/LandmarkLayer.tsx
@.planning/phases/07-api-data-persistence/07-RESEARCH.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add retry logic to useGraphData</name>
  <files>
    src/client/hooks/useGraphData.ts
  </files>
  <action>
Rewrite `src/client/hooks/useGraphData.ts` to add retry logic: attempt the fetch up to 3 times total (initial + 2 retries) with a 1-second delay between attempts. Only transition to `error` state after all attempts fail.

```typescript
import type { NavGraph } from '@shared/types'
import { useEffect, useState } from 'react'

type GraphState =
  | { status: 'loading' }
  | { status: 'loaded'; data: NavGraph }
  | { status: 'error'; message: string }

const MAX_ATTEMPTS = 3
const RETRY_DELAY_MS = 1000

async function fetchWithRetry(signal: AbortSignal): Promise<NavGraph> {
  let lastError: unknown
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await fetch('/api/map', { signal })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return (await response.json()) as NavGraph
    } catch (err) {
      if (signal.aborted) throw err   // Don't retry on cancellation
      lastError = err
      if (attempt < MAX_ATTEMPTS) {
        // Wait before retrying — simple fixed delay
        await new Promise<void>((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
      }
    }
  }
  throw lastError
}

export function useGraphData(): GraphState {
  const [state, setState] = useState<GraphState>({ status: 'loading' })

  useEffect(() => {
    const controller = new AbortController()

    fetchWithRetry(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setState({ status: 'loaded', data })
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted)
          setState({ status: 'error', message: String(err) })
      })

    return () => {
      controller.abort()
    }
  }, [])

  return state
}
```

Key decisions:
- 3 total attempts (initial + 2 retries) matches CONTEXT.md "retry silently 1-2 times"
- Fixed 1-second delay between retries — no exponential backoff needed at this scale
- Uses `AbortController` instead of `cancelled` boolean for cleaner cancellation + fetch abort
- `signal.aborted` check prevents state updates after component unmount
  </action>
  <verify>
- `src/client/hooks/useGraphData.ts` exports `useGraphData`
- `npx tsc --noEmit` passes (zero TypeScript errors)
- Function signature unchanged: `useGraphData(): GraphState` — no breaking changes for callers
  </verify>
  <done>
useGraphData retries up to 2 times on failure before transitioning to error state. AbortController used for cleanup. TypeScript compiles without errors.
  </done>
</task>

<task type="auto">
  <name>Task 2: Add HTML spinner overlay and fix double-fetch in FloorPlanCanvas + LandmarkLayer</name>
  <files>
    src/client/components/FloorPlanCanvas.tsx
    src/client/components/LandmarkLayer.tsx
  </files>
  <action>
**A. Update `LandmarkLayer.tsx`** — remove the internal `useGraphData()` call; accept `nodes` as a prop instead.

Change the `LandmarkLayerProps` interface to add `nodes: NavNode[]` and remove the internal hook call:

```typescript
import type { NavNode, NavNodeType } from '@shared/types'
import { Layer } from 'react-konva'
import { LandmarkMarker } from './LandmarkMarker'

const VISIBLE_NODE_TYPES: NavNodeType[] = ['room', 'entrance', 'elevator', 'restroom', 'landmark']

interface LandmarkLayerProps {
  nodes: NavNode[]                                           // received from FloorPlanCanvas
  imageRect: { x: number; y: number; width: number; height: number } | null
  stageScale: number
  selectedNodeId: string | null
  onSelectNode: (node: NavNode) => void
  hiddenNodeIds?: string[]
}

export function LandmarkLayer({
  nodes,
  imageRect,
  stageScale,
  selectedNodeId,
  onSelectNode,
  hiddenNodeIds,
}: LandmarkLayerProps) {
  if (imageRect === null) return null

  const visibleNodes = nodes.filter(
    (n) => VISIBLE_NODE_TYPES.includes(n.type) && !hiddenNodeIds?.includes(n.id),
  )

  return (
    <Layer>
      {visibleNodes.map((node) => (
        <LandmarkMarker
          key={node.id}
          node={node}
          imageRect={imageRect}
          stageScale={stageScale}
          isSelected={node.id === selectedNodeId}
          isLabelVisible={node.id === selectedNodeId || stageScale >= 2.0}
          onClick={() => onSelectNode(node)}
        />
      ))}
    </Layer>
  )
}
```

No more `useGraphData` import — LandmarkLayer is now a pure display component.

**B. Update `FloorPlanCanvas.tsx`** to:
1. Pass `nodes={nodes}` prop to `<LandmarkLayer />` (nodes are already derived from graphState in the component)
2. Replace Konva `<Text>` graph loading state with HTML overlay spinner + error message
3. Keep existing floor plan image loading states (the Konva Text for isLoading/isFailed is for the floor plan image, NOT graph data — leave those)

In FloorPlanCanvas.tsx:
- The `nodes` variable is already derived: `const nodes = useMemo(() => graphState.status === 'loaded' ? graphState.data.nodes : [], [graphState])`
- Update the `<LandmarkLayer />` JSX to add `nodes={nodes}` prop
- Add HTML overlay `<div>` (sibling to `<Stage>`, inside the outer `<div className="relative w-full h-full">`) for graph loading/error states:

```tsx
{/* Graph data loading overlay — shows while useGraphData fetches from server */}
{graphState.status === 'loading' && (
  <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
    <div className="flex flex-col items-center gap-3 bg-white/80 backdrop-blur-sm rounded-xl px-6 py-4 shadow">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-sm text-slate-600 font-medium">Loading map data…</span>
    </div>
  </div>
)}

{/* Graph data error overlay — shows after all retries exhausted */}
{graphState.status === 'error' && (
  <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
    <div className="flex flex-col items-center gap-2 bg-white/90 backdrop-blur-sm rounded-xl px-6 py-4 shadow border border-red-200">
      <span className="text-red-500 font-semibold text-sm">Failed to load map data</span>
      <span className="text-slate-500 text-xs">Please refresh the page to try again</span>
    </div>
  </div>
)}
```

Position: place these two divs after the `<SearchOverlay />` block and before the `<Stage>` block inside the outer wrapper div. Use `z-10` and `pointer-events-none` so they don't block the canvas from being interactable if the user wants to pan while loading completes.

No existing Konva Text graph loading state exists in FloorPlanCanvas (the existing Konva Text nodes are for floor plan image loading — leave them unchanged).
  </action>
  <verify>
1. `npx tsc --noEmit` — zero TypeScript errors
2. Open browser dev tools Network tab: on page load, only ONE GET /api/map request fires (not two)
3. With server running: loading spinner appears briefly then disappears when graph loads
4. LandmarkLayer no longer imports useGraphData (grep confirms)
5. FloorPlanCanvas passes `nodes={nodes}` to LandmarkLayer
  </verify>
  <done>
LandmarkLayer accepts nodes prop and no longer calls useGraphData internally.
FloorPlanCanvas passes nodes={nodes} to LandmarkLayer.
HTML spinner overlay shows during graph data load.
HTML error overlay shows after retries exhausted.
Only one GET /api/map request fires on page load.
TypeScript compiles without errors.
  </done>
</task>

</tasks>

<verification>
After both tasks complete:
1. `npx tsc --noEmit` passes
2. `grep -r "useGraphData" src/client/components/LandmarkLayer.tsx` — returns no matches
3. Browser Network tab: single GET /api/map on page load
4. Map loads with landmarks visible (nodes passed correctly through prop chain)
5. Animate spinner: temporarily stop server, refresh browser — spinner shows, then error message after retries
</verification>

<success_criteria>
The client makes a single fetch to /api/map, shows a loading spinner while waiting, and shows a clear error message if the server is unreachable after retries. LandmarkLayer is now a pure display component receiving nodes as props.
</success_criteria>

<output>
After completion, create `.planning/phases/07-api-data-persistence/07-03-SUMMARY.md` using the summary template.
</output>
