---
phase: 04-map-landmarks-location-display
plan: 03
type: execute
wave: 3
depends_on: [04-02]
files_modified:
  - src/client/components/LandmarkSheet.tsx
  - src/client/components/FloorPlanCanvas.tsx
autonomous: true
requirements: [ROUT-07]

must_haves:
  truths:
    - "Tapping a landmark marker opens a bottom sheet that peeks at ~15% viewport height"
    - "Bottom sheet shows landmark name and type in the peek state"
    - "Dragging the sheet up to ~90% reveals full details: name, room number, type, description, floor, building, accessibility notes"
    - "Sheet can be dismissed by swiping down, tapping the close button, or tapping the map background"
    - "Map remains pannable/zoomable while the sheet is peeked (modal=false)"
  artifacts:
    - path: "src/client/components/LandmarkSheet.tsx"
      provides: "Vaul bottom sheet component for landmark detail display"
      exports: ["LandmarkSheet"]
  key_links:
    - from: "src/client/components/FloorPlanCanvas.tsx"
      to: "src/client/components/LandmarkSheet.tsx"
      via: "selectedNode prop + onClose callback outside Stage"
      pattern: "LandmarkSheet"
    - from: "src/client/components/LandmarkSheet.tsx"
      to: "vaul"
      via: "Drawer.Root with snapPoints={[0.15, 0.9]} modal={false}"
      pattern: "Drawer.Root"
---

<objective>
Install Vaul and build the LandmarkSheet bottom sheet component. Wire it into FloorPlanCanvas so tapping a marker opens the sheet with landmark details.

Purpose: Satisfies ROUT-07 — users can tap a location to see its full details. Google Maps-style peek-then-expand UX per locked user decisions.

Output: LandmarkSheet component + FloorPlanCanvas sheet integration. Complete end-to-end landmark tap → detail flow.
</objective>

<execution_context>
@C:/Users/LENOVO/.config/opencode/get-shit-done/workflows/execute-plan.md
@C:/Users/LENOVO/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@src/shared/types.ts
@src/client/components/FloorPlanCanvas.tsx
@.planning/phases/04-map-landmarks-location-display/04-02-SUMMARY.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Install Vaul and create LandmarkSheet component</name>
  <files>src/client/components/LandmarkSheet.tsx</files>
  <action>
**Step 1 — Install Vaul:**
```bash
npm install vaul
```
Version 1.1.2 per research. Verify with `npm list vaul`.

**Step 2 — Create src/client/components/LandmarkSheet.tsx:**

```tsx
import { useState } from 'react'
import { Drawer } from 'vaul'
import type { NavNode } from '@shared/types'

interface LandmarkSheetProps {
  node: NavNode | null
  onClose: () => void
}

const TYPE_LABELS: Record<string, string> = {
  room: 'Room',
  entrance: 'Entrance',
  elevator: 'Elevator',
  restroom: 'Restroom',
  landmark: 'Point of Interest',
}

export function LandmarkSheet({ node, onClose }: LandmarkSheetProps) {
  const [activeSnapPoint, setActiveSnapPoint] = useState<number | string | null>(0.15)

  // Reset to peek snap point whenever a new node is selected
  // This ensures sheet always opens at peek, not at previous expanded height
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional reset on node change
  // Use a key prop on Drawer.Root instead — see render below

  return (
    <Drawer.Root
      key={node?.id ?? 'none'}
      open={node !== null}
      onOpenChange={(open) => { if (!open) onClose() }}
      snapPoints={[0.15, 0.9]}
      activeSnapPoint={activeSnapPoint}
      setActiveSnapPoint={setActiveSnapPoint}
      modal={false}
      dismissible={true}
    >
      <Drawer.Portal>
        <Drawer.Content
          className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-2xl bg-white shadow-2xl outline-none focus:outline-none"
          style={{ maxHeight: '90vh' }}
          aria-label={node?.label ?? 'Location details'}
        >
          {/* Drag handle */}
          <div className="mx-auto mt-3 h-1.5 w-10 flex-shrink-0 rounded-full bg-gray-300" />

          {/* Peek content — always visible */}
          <div className="flex items-center justify-between px-5 pb-2 pt-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{node?.label}</h2>
              <p className="text-sm font-medium capitalize text-gray-500">
                {TYPE_LABELS[node?.type ?? ''] ?? node?.type}
              </p>
            </div>
            <Drawer.Close asChild>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
                onClick={onClose}
                aria-label="Close"
              >
                <span aria-hidden>×</span>
              </button>
            </Drawer.Close>
          </div>

          {/* Full detail content — visible when expanded */}
          <div className="overflow-y-auto px-5 pb-10 pt-1">
            {node?.roomNumber && (
              <div className="mb-3">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Room</p>
                <p className="text-sm text-gray-700">{node.roomNumber}</p>
              </div>
            )}
            {node?.description && (
              <div className="mb-3">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Description</p>
                <p className="text-sm text-gray-700">{node.description}</p>
              </div>
            )}
            {node?.buildingName && (
              <div className="mb-3">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Building</p>
                <p className="text-sm text-gray-700">{node.buildingName}</p>
              </div>
            )}
            {node?.floor !== undefined && (
              <div className="mb-3">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Floor</p>
                <p className="text-sm text-gray-700">{node.floor}</p>
              </div>
            )}
            {node?.accessibilityNotes && (
              <div className="mb-3">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Accessibility</p>
                <p className="text-sm text-gray-700">{node.accessibilityNotes}</p>
              </div>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
```

Key implementation notes:
- `modal={false}` — CRITICAL per research. Without this, the Vaul overlay blocks the canvas. With `modal={false}`, map remains interactive when sheet is peeked.
- `key={node?.id ?? 'none'}` — forces Vaul to remount when a different node is selected, resetting activeSnapPoint to 0.15 (peek) automatically.
- `snapPoints={[0.15, 0.9]}` — fractions of viewport height (not pixels).
- No `<Drawer.Overlay>` — omitting it when `modal={false}` keeps the map fully interactive.
- The `activeSnapPoint` state + `setActiveSnapPoint` use controlled mode for predictability.
  </action>
  <verify>`npx tsc --noEmit` and `npx biome check .` — zero errors. Check `npm list vaul` shows vaul installed.</verify>
  <done>LandmarkSheet component exists with correct Vaul integration. TypeScript and lint pass.</done>
</task>

<task type="auto">
  <name>Task 2: Wire LandmarkSheet into FloorPlanCanvas</name>
  <files>src/client/components/FloorPlanCanvas.tsx</files>
  <action>
Integrate `LandmarkSheet` into `FloorPlanCanvas`. The sheet is an HTML overlay that lives **outside** the Konva Stage, parallel to `ZoomControls`.

In `src/client/components/FloorPlanCanvas.tsx`:

1. Add import: `import { LandmarkSheet } from './LandmarkSheet'`

2. The `selectedNode` and `setSelectedNode` state already exist from Plan 02. Verify they are present; if not, add them:
   ```typescript
   const [selectedNode, setSelectedNode] = useState<NavNode | null>(null)
   ```
   And the NavNode type import: `import type { NavNode } from '@shared/types'`

3. Add `<LandmarkSheet>` as a sibling to `<ZoomControls>` in the return JSX, outside the `<Stage>`:
   ```tsx
   <LandmarkSheet
     node={selectedNode}
     onClose={() => setSelectedNode(null)}
   />
   ```

The final structure of the return should be:
```tsx
<div className="relative w-full h-full">
  <Stage ...>
    {/* Grid layer */}
    {/* Image layer */}
    {/* Landmark markers (LandmarkLayer) */}
    {/* UI overlay (loading/error) */}
  </Stage>

  <ZoomControls ... />
  <LandmarkSheet node={selectedNode} onClose={() => setSelectedNode(null)} />
</div>
```

No other changes needed — Plan 02 already wired the Stage `onClick` handler for background tap dismissal.
  </action>
  <verify>
1. `npx tsc --noEmit` — zero errors
2. `npx biome check .` — zero errors
3. Start dev server (`npm run dev`) and open browser
4. Click a landmark marker — bottom sheet slides up from bottom showing name + type
5. Drag sheet up — full details appear (room number, description, building, floor, accessibility notes)
6. Tap close button — sheet dismisses
7. Swipe sheet down — sheet dismisses
8. Tap map background while sheet is peeked — sheet dismisses
9. While sheet is peeked, pan/zoom the map — map responds normally (modal=false working)
  </verify>
  <done>Tapping a landmark opens the bottom sheet. Sheet shows name/type in peek, full details when expanded. All three dismissal methods work. Map remains interactive while sheet is peeked.</done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` — zero TypeScript errors
2. `npx biome check .` — zero lint errors
3. Full E2E flow: open app → landmark markers visible → tap marker → sheet slides up → see name + type → drag up → see room number, description, building, floor, accessibility notes → dismiss via close button
4. Swipe-down dismissal works
5. Tap-outside dismissal works (tap map background while sheet peeked)
6. Map pan/zoom works while sheet is in peek state (not blocked by overlay)
7. Selecting a second landmark while first is open correctly switches to new landmark's details
</verification>

<success_criteria>
- LandmarkSheet component installed with Vaul, snap points [0.15, 0.9], modal=false
- Tapping any visible landmark opens sheet at peek height
- Full detail view shows all 6 fields: name, room number, type, description, floor, building, accessibility notes
- All 3 dismissal methods work: close button, swipe down, tap map background
- Map interaction not blocked while sheet is peeked
- TypeScript compiles, Biome lint passes
</success_criteria>

<output>
After completion, create `.planning/phases/04-map-landmarks-location-display/04-03-SUMMARY.md`
</output>
