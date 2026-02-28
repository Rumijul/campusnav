---
phase: 13-restore-location-detail
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/client/components/LocationDetailSheet.tsx
autonomous: true
requirements:
  - ROUT-07

must_haves:
  truths:
    - "A LocationDetailSheet component exists that renders node name, type, roomNumber, description, buildingName, accessibilityNotes"
    - "The sheet uses the custom CSS height-transition pattern (no Vaul) matching DirectionsSheet.tsx"
    - "The sheet has a close button and is dismissible via drag handle"
    - "The sheet renders null when node is null (no DOM waste)"
  artifacts:
    - path: "src/client/components/LocationDetailSheet.tsx"
      provides: "Location detail bottom sheet component"
      exports: ["LocationDetailSheet", "LocationDetailSheetProps"]
      min_lines: 60
  key_links:
    - from: "src/client/components/LocationDetailSheet.tsx"
      to: "src/shared/types.ts"
      via: "NavNode type import"
      pattern: "import type.*NavNode.*@shared/types"
    - from: "src/client/components/LocationDetailSheet.tsx"
      to: "src/client/components/DirectionsSheet.tsx"
      via: "same CSS height-transition pattern (not a runtime link — pattern reuse)"
      pattern: "fixed inset-x-0 bottom-0 z-40"
---

<objective>
Create LocationDetailSheet.tsx — a custom CSS bottom sheet component that displays landmark detail fields when a student taps a map location.

Purpose: Provide the ROUT-07 detail display component using the established custom CSS sheet pattern (no Vaul). This component is the pure UI layer; wiring into FloorPlanCanvas happens in Plan 02.

Output: src/client/components/LocationDetailSheet.tsx — exported component + props interface
</objective>

<execution_context>
@C:/Users/admin/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/admin/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@src/client/components/DirectionsSheet.tsx
@src/client/components/LandmarkSheet.tsx
@src/shared/types.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create LocationDetailSheet component</name>
  <files>src/client/components/LocationDetailSheet.tsx</files>
  <action>
Create a new file src/client/components/LocationDetailSheet.tsx.

Props interface:
```typescript
export interface LocationDetailSheetProps {
  node: NavNode | null   // null = sheet hidden (returns null from render)
  onClose: () => void
}
```

Component behavior:
- Returns null when node is null (no DOM, no transitions when closed)
- Uses `position: fixed; inset-x-0; bottom-0` pattern matching DirectionsSheet.tsx
- PEEK_HEIGHT = 180 (smaller than DirectionsSheet's 260 — detail needs less vertical space)
- EXPANDED_MAX = 0.75 (fraction of window.innerHeight)
- z-index: z-40 (one level below DirectionsSheet z-50, so directions sheet renders on top when both could theoretically coexist)
- Includes drag handle with onPointerDown/onPointerMove/onPointerUp/onPointerCancel pattern copied from DirectionsSheet.tsx (same dragStartY ref logic, dy > 40 expands, dy < -40 collapses)
- Resets to peek (setExpanded(false)) whenever node changes — use useEffect([node])

Header section (always visible in peek):
- Node label as h2 (text-lg font-semibold text-gray-900)
- Node type as subtitle using TYPE_LABELS map (copy from LandmarkSheet.tsx):
  `const TYPE_LABELS: Record<string, string> = { room: 'Room', entrance: 'Entrance', elevator: 'Elevator', restroom: 'Restroom', landmark: 'Point of Interest' }`
- Close button (×) top-right: circular bg-gray-100 button, onClick={onClose}, aria-label="Close location details"

Scrollable content section (visible when expanded):
- Conditionally render each field only if the value is present (matches LandmarkSheet.tsx pattern):
  - roomNumber → label "Room"
  - description → label "Description"
  - buildingName → label "Building"
  - floor → label "Floor" (render always since floor is non-optional number)
  - accessibilityNotes → label "Accessibility"
- Each field: `<p className="text-xs font-medium uppercase tracking-wide text-gray-400">` for label, `<p className="text-sm text-gray-700">` for value
- Wrap in `<div className="overflow-y-auto px-5 pb-10 pt-1 flex-1">`

Full section structure:
```tsx
<section
  aria-label={`Details for ${node.label}`}
  className="fixed inset-x-0 bottom-0 z-40 flex flex-col rounded-t-2xl bg-white shadow-2xl"
  style={{
    height: expanded ? `${Math.round(window.innerHeight * EXPANDED_MAX)}px` : `${PEEK_HEIGHT}px`,
    transition: 'height 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
  }}
>
```

Do NOT import from vaul. Do NOT use Drawer.Root or Drawer.Portal. This is a pure CSS component.
Use TypeScript strict mode (no `any`, no non-null assertions without guards).
Export: `export function LocationDetailSheet(...)`.
  </action>
  <verify>Run `npx biome check src/client/components/LocationDetailSheet.tsx` — zero errors. Run `npx tsc --noEmit` — zero type errors.</verify>
  <done>LocationDetailSheet.tsx exists, exports LocationDetailSheetProps and LocationDetailSheet, passes Biome and TypeScript checks with zero errors.</done>
</task>

</tasks>

<verification>
1. `npx biome check src/client/components/LocationDetailSheet.tsx` — exits 0
2. `npx tsc --noEmit` — exits 0 (no new type errors introduced)
3. File exists at src/client/components/LocationDetailSheet.tsx
4. File exports `LocationDetailSheet` and `LocationDetailSheetProps`
5. File contains no vaul import
6. PEEK_HEIGHT = 180, z-40 class present (confirmed via grep)
</verification>

<success_criteria>
LocationDetailSheet.tsx is a self-contained custom CSS bottom sheet component that:
- Accepts NavNode | null and onClose callback
- Renders null when node is null
- Shows peek (180px) with name + type + close button
- Expands to 75% viewport on drag-up
- Displays roomNumber, description, buildingName, floor, accessibilityNotes fields conditionally
- Uses no Vaul imports
- Passes Biome + TypeScript strict mode checks
</success_criteria>

<output>
After completion, create `.planning/phases/13-restore-location-detail/13-01-SUMMARY.md`
</output>
