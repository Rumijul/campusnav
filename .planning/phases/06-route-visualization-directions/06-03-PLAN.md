---
phase: 06-route-visualization-directions
plan: 03
type: execute
wave: 2
depends_on:
  - 06-01
files_modified:
  - src/client/components/DirectionsSheet.tsx
autonomous: true
requirements:
  - ROUT-03
  - ROUT-04
  - ROUT-05
  - ROUT-06

must_haves:
  truths:
    - "DirectionsSheet renders as a Vaul bottom sheet that opens when a route result is available"
    - "Sheet header contains two tabs: 'Standard' and 'Accessible'; clicking a tab changes activeMode"
    - "The active tab's step list renders instruction text, directional icon, and per-step time"
    - "Total walking time for the active route is shown at the top of the sheet"
    - "When routes are identical, only one merged tab is shown labeled 'Standard (accessible)'"
    - "When the accessible route is not found, the Accessible tab is shown but disabled/grayed with tooltip 'No accessible route available'"
    - "When neither route is found, the sheet shows a 'No route found' message"
    - "A back arrow button calls onBack() to dismiss the sheet and return user to pin selection"
    - "Sheet has snapPoints [0.35, 0.92] and modal={false} so map stays interactive"
  artifacts:
    - path: "src/client/components/DirectionsSheet.tsx"
      provides: "Vaul directions sheet with Standard/Accessible tabs and step list"
      exports: ["DirectionsSheet", "DirectionsSheetProps"]
      min_lines: 120
  key_links:
    - from: "src/client/components/DirectionsSheet.tsx"
      to: "src/client/hooks/useRouteDirections.ts"
      via: "imports DirectionStep, DirectionsResult types"
      pattern: "DirectionStep|DirectionsResult"
    - from: "src/client/components/DirectionsSheet.tsx"
      to: "vaul"
      via: "Drawer.Root with modal=false, dismissible=false"
      pattern: "Drawer\\.Root"
---

<objective>
Build DirectionsSheet — the Vaul bottom sheet that displays Standard/Accessible route tabs with step-by-step directions and walking time estimates.

Purpose: Gives the student readable turn-by-turn walking directions after a route is computed.
Output: DirectionsSheet component ready to be wired into FloorPlanCanvas in Plan 04.
</objective>

<execution_context>
@C:/Users/admin/.config/opencode/get-shit-done/workflows/execute-plan.md
@C:/Users/admin/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@src/client/components/LandmarkSheet.tsx
@src/client/hooks/useRouteDirections.ts
@src/client/components/SearchOverlay.tsx
@.planning/phases/06-route-visualization-directions/06-01-SUMMARY.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create DirectionsSheet component</name>
  <files>src/client/components/DirectionsSheet.tsx</files>
  <action>
Create `src/client/components/DirectionsSheet.tsx`.

**Props interface:**
```typescript
import type { PathResult } from '@shared/pathfinding/types'
import type { NavNode } from '@shared/types'
import type { DirectionStep, DirectionsResult } from '../hooks/useRouteDirections'

export interface DirectionsSheetProps {
  open: boolean
  standard: PathResult | null        // null when not yet computed
  accessible: PathResult | null
  standardDirections: DirectionsResult
  accessibleDirections: DirectionsResult
  routesIdentical: boolean
  activeMode: 'standard' | 'accessible'
  onTabChange: (mode: 'standard' | 'accessible') => void
  onBack: () => void
  startNode: NavNode | null
  destNode: NavNode | null
}
```

**Vaul sheet setup (per locked decisions):**
- `dismissible={false}` — back arrow is the ONLY exit
- `snapPoints={[0.35, 0.92]}` — peek (35%) and full (92%)
- `modal={false}` — map stays interactive while sheet is open
- `activeSnapPoint` + `setActiveSnapPoint` controlled state, default `0.35`
- No `<Drawer.Overlay>` (omit entirely — keeps map interactive)

**Tab state (activeMode comes from parent via props — DirectionsSheet is stateless for tabs):**

**Render logic — three cases:**

**Case 1: Neither route found** (standard?.found === false AND accessible?.found === false, or both null):
```tsx
<div className="px-5 py-8 text-center text-slate-500">
  <p className="text-lg font-medium">No route found</p>
  <p className="text-sm mt-1">No path connects the selected locations.</p>
</div>
```

**Case 2: Routes identical** (routesIdentical === true):
- Single tab chip labeled "Standard (accessible)" — no tab switcher needed
- Show standardDirections steps

**Case 3: Normal (two distinct routes):**
- Tab header row with two tabs: "Standard" (blue) and "Accessible" (green)
- Active tab: colored background, full opacity
- Inactive tab: gray, full opacity if route found, 50% opacity if not found
- Disabled Accessible tab: `disabled` attribute + `title="No accessible route available"` tooltip
- Show activeMode's directions steps

**Sheet structure:**
```tsx
<Drawer.Root open={open} snapPoints={[0.35, 0.92]} activeSnapPoint={snapPoint}
  setActiveSnapPoint={setSnapPoint} modal={false} dismissible={false}>
  <Drawer.Portal>
    <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-2xl bg-white shadow-2xl outline-none"
      style={{ maxHeight: '92vh' }}>
      {/* Drag handle */}
      <div className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-gray-300 shrink-0" />
      
      {/* Header row: back arrow + route summary + optional tabs */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-2 border-b border-slate-100 shrink-0">
        <button type="button" onClick={onBack} aria-label="Back to search" className="p-1 text-slate-500 hover:text-slate-700">
          <BackArrowIcon />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">
            {startNode?.label ?? '—'} → {destNode?.label ?? '—'}
          </p>
          <p className="text-xs text-slate-500">
            {activeMode === 'standard'
              ? formatDuration(standardDirections.totalDurationSec)
              : formatDuration(accessibleDirections.totalDurationSec)}
          </p>
        </div>
      </div>

      {/* Tabs (only in Case 3) */}
      {!routesIdentical && (
        <div className="flex gap-2 px-4 pt-3 pb-2 shrink-0">
          <TabButton mode="standard" activeMode={activeMode} found={standard?.found ?? false}
            color="#3b82f6" label="Standard" onTabChange={onTabChange} />
          <TabButton mode="accessible" activeMode={activeMode} found={accessible?.found ?? false}
            color="#22c55e" label="Accessible" onTabChange={onTabChange}
            disabledTitle={accessible?.found === false ? "No accessible route available" : undefined} />
        </div>
      )}
      {routesIdentical && (
        <div className="px-4 pt-2 pb-1 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
            Standard (accessible)
          </span>
        </div>
      )}

      {/* Step list */}
      <div className="flex-1 overflow-y-auto pb-10">
        {/* Render steps for activeMode (or standardDirections if identical) */}
      </div>
    </Drawer.Content>
  </Drawer.Portal>
</Drawer.Root>
```

**Step item rendering:**
Each `DirectionStep` renders as a row:
```tsx
<div className="flex items-start gap-3 px-4 py-3 border-b border-slate-50 last:border-0">
  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
    <StepIconComponent icon={step.icon} />
  </div>
  <div className="flex-1 min-w-0">
    <p className="text-sm text-slate-800">{step.instruction}</p>
    {step.durationSec > 0 && (
      <p className="text-xs text-slate-400 mt-0.5">{formatDuration(step.durationSec)}</p>
    )}
  </div>
  {step.isAccessibleSegment && (
    <span className="text-xs px-1.5 py-0.5 rounded bg-green-50 text-green-700 shrink-0">♿</span>
  )}
</div>
```

**Inline SVG icons for StepIconComponent (icon prop):**
- `straight`: up arrow (↑)
- `turn-left`: left curved arrow
- `turn-right`: right curved arrow
- `sharp-left`: sharp left arrow
- `sharp-right`: sharp right arrow
- `arrive`: checkmark circle or pin icon
- `accessible`: wheelchair symbol (♿ or SVG)

Use simple inline SVG paths (16×16 viewBox). Keep icons minimal — single-path or two-path shapes.

**formatDuration helper:**
```typescript
function formatDuration(sec: number): string {
  if (sec < 60) return `${Math.round(sec)}s`
  const mins = Math.round(sec / 60)
  return `${mins} min`
}
```

**BackArrowIcon:** Same chevron-left SVG already used in SearchOverlay.tsx (20×20, stroke currentColor path "M12 4L6 10L12 16").

**TabButton sub-component:**
```typescript
interface TabButtonProps {
  mode: 'standard' | 'accessible'
  activeMode: 'standard' | 'accessible'
  found: boolean
  color: string
  label: string
  onTabChange: (mode: 'standard' | 'accessible') => void
  disabledTitle?: string
}
```
- If `disabledTitle` set AND found=false: render `<button disabled title={disabledTitle}>` with grayed styling
- Active: colored dot + colored text + light colored background
- Inactive: gray text

**CRITICAL anti-patterns to avoid:**
- Do NOT use `dismissible` to allow swipe-down close — `dismissible={false}` is locked
- Do NOT lift snapPoint state out of DirectionsSheet — keep it local with useState
- Do NOT put route computing logic in this component — it only renders props
  </action>
  <verify>
Run: `npx tsc --noEmit`
Run: `npx biome check src/client/components/DirectionsSheet.tsx`
Both must exit 0.
  </verify>
  <done>
DirectionsSheet.tsx exists, exports DirectionsSheet and DirectionsSheetProps, TypeScript and Biome clean.
Three cases render correctly: no-route message, identical-route single tab, two distinct tabs with disabled accessible tab support.
  </done>
</task>

</tasks>

<verification>
- `npx tsc --noEmit` exits 0
- `npx biome check src/client/components/DirectionsSheet.tsx` exits 0
- File exports: `DirectionsSheet`, `DirectionsSheetProps`
- Component handles all three cases: no route, identical routes, distinct routes
</verification>

<success_criteria>
- DirectionsSheet.tsx created with Vaul snap points [0.35, 0.92], modal=false, dismissible=false
- Tab state is passed via props (activeMode/onTabChange), not internal state
- All three edge cases handled: no route, identical routes, accessible tab disabled
- Step list renders icon + instruction + per-step time
- Back arrow calls onBack() to return to A/B pin selection state
</success_criteria>

<output>
After completion, create `.planning/phases/06-route-visualization-directions/06-03-SUMMARY.md`
</output>
