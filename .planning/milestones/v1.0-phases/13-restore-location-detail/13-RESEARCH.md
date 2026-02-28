# Phase 13: Restore Location Detail View - Research

**Researched:** 2026-02-22
**Domain:** React / Konva landmark tap interaction, custom CSS bottom sheet, coexistence with route selection
**Confidence:** HIGH — all findings verified from direct codebase inspection

## Summary

ROUT-07 ("User can tap a location to see its details") was originally implemented in Phase 4 as `LandmarkSheet.tsx` — a Vaul-powered bottom sheet that opened when a landmark was tapped. In Phase 5, landmark taps were repurposed to feed into route selection via `setFromTap`, and `LandmarkSheet` was removed from the render tree entirely (though the file was not deleted).

The core challenge in Phase 13 is **coexistence**: a single tap on a landmark must do something context-sensitive. The route selection flow (Phase 5) must remain intact, and detail display must be addable without breaking it. The existing `LandmarkSheet.tsx` component is preserved on disk but uses Vaul (which was replaced by a custom CSS sheet in Phase 5.1 due to pointer-event conflicts). The correct approach is to port the detail display to the same custom CSS sheet pattern used by `DirectionsSheet.tsx`.

**Primary recommendation:** Implement a `LocationDetailSheet` using the same custom CSS bottom sheet pattern as `DirectionsSheet.tsx` (no Vaul). Wire it to open in "peek only" mode on landmark tap while simultaneously calling `routeSelection.setFromTap`. Use distinct state (`detailNode` / `setDetailNode`) so the two flows remain independent.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ROUT-07 | User can tap a location to see its details (name, room number, type, description) | LandmarkSheet.tsx already contains the complete detail display logic; it needs to be wired back in using the custom CSS sheet pattern. The `NavNode` type has all required fields: `label`, `roomNumber`, `type`, `description`, `buildingName`, `accessibilityNotes`. |
</phase_requirements>

## Standard Stack

### Core (all already installed — no new dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.4 | Component state and rendering | Project foundation |
| Konva / react-konva | 10.2.0 / 19.2.2 | Canvas landmark tap events | Already used for all map interaction |
| Tailwind CSS | 4.1.18 | Sheet styling | Project standard |
| TypeScript | 5.9.3 | Type safety | Project standard |

### No New Dependencies

Vaul (v1.1.2) is still in `package.json` but was removed from actual usage in Phase 5.1. Do NOT reintroduce Vaul for this phase. The custom CSS sheet pattern (`position: fixed; bottom: 0; height transition`) used in `DirectionsSheet.tsx` is the established pattern and avoids all pointer-event conflicts.

**Installation:**
```bash
# No new packages required
```

## Architecture Patterns

### Current Tap Handler Architecture

When a student taps a landmark, the tap flows through:

```
LandmarkMarker.onClick/onTap
  → LandmarkLayer.onSelectNode(node)
    → FloorPlanCanvas → routeSelection.setFromTap(node)
```

`setFromTap` sets the node as start or destination depending on `activeField`, then auto-advances `activeField`. There is no detail display anywhere in this chain.

### Recommended Project Structure (no changes)

```
src/client/
├── components/
│   ├── FloorPlanCanvas.tsx     # Add detailNode state + LocationDetailSheet render
│   ├── LandmarkLayer.tsx       # Modify onSelectNode signature to pass full node
│   ├── LandmarkSheet.tsx       # Existing file — rewrite to use custom CSS pattern
│   └── LocationDetailSheet.tsx # New or reused: custom CSS bottom sheet for detail
├── hooks/
│   └── useRouteSelection.ts    # No changes needed
└── ...
```

### Pattern 1: Dual-Action Tap Handler

**What:** A landmark tap simultaneously opens the detail sheet AND feeds the route selection. Both happen in parallel.
**When to use:** When both behaviors are valid side-effects of the same user intent.

```typescript
// In FloorPlanCanvas.tsx
const [detailNode, setDetailNode] = useState<NavNode | null>(null)

const handleLandmarkTap = useCallback((node: NavNode) => {
  // Action 1: open detail sheet
  setDetailNode(node)
  // Action 2: continue existing route selection flow
  routeSelection.setFromTap(node)
}, [routeSelection])

// Pass to LandmarkLayer
<LandmarkLayer
  nodes={nodes}
  imageRect={imageRect}
  stageScale={stageScale}
  selectedNodeId={null}
  onSelectNode={handleLandmarkTap}  // was: routeSelection.setFromTap
  hiddenNodeIds={hiddenNodeIds}
/>
```

**Why this works:** `routeSelection.setFromTap` is a pure state update — calling it and `setDetailNode` in the same callback has no ordering constraint.

### Pattern 2: Custom CSS Bottom Sheet (established in Phase 5.1)

**What:** `position: fixed; bottom: 0` with CSS `height` transition between peek and expanded states. No Vaul, no Radix, no pointer-event overhead.
**When to use:** Whenever a bottom sheet is needed in this project.

```typescript
// Source: DirectionsSheet.tsx (established pattern, Phase 5.1)
const PEEK_HEIGHT = 180  // px for location detail — smaller than directions (260px)
const EXPANDED_MAX = 0.75  // fraction of window height

// Render:
if (!open) return null

return (
  <section
    className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-2xl bg-white shadow-2xl"
    style={{
      height: expanded ? `${Math.round(window.innerHeight * EXPANDED_MAX)}px` : `${PEEK_HEIGHT}px`,
      transition: 'height 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
    }}
  >
    {/* drag handle + content */}
  </section>
)
```

**Critical note:** `z-50` keeps the sheet above all canvas content. DirectionsSheet already uses z-50 — when both could appear simultaneously, the one rendered later in DOM order wins. The planner must decide render order or use different z-index values.

### Pattern 3: Sheet Dismissal on Route Trigger

**What:** When a route is computed (both A and B are selected), close the detail sheet automatically.
**When to use:** To prevent two sheets coexisting on screen.

```typescript
// In FloorPlanCanvas.tsx
useEffect(() => {
  if (routeSelection.bothSelected) {
    setDetailNode(null)  // close detail sheet when route mode starts
  }
}, [routeSelection.bothSelected])
```

### Anti-Patterns to Avoid

- **Reintroducing Vaul for LandmarkSheet:** Vaul was removed in Phase 5.1 due to irreconcilable pointer-event conflicts with Konva. Do not bring it back even though the existing `LandmarkSheet.tsx` uses it.
- **Blocking canvas interaction:** Any sheet with `pointer-events: auto` that covers the full viewport will block map pan/zoom. Keep the sheet `fixed; bottom: 0` with only the sheet area having pointer events.
- **Shared sheet state between directions and detail:** Keep `detailNode` state completely separate from `sheetOpen` (directions state). They must be independently closable.
- **Using selectedNodeId for detail highlighting:** The `LandmarkLayer` prop `selectedNodeId` is currently always `null`. Do not repurpose it for the detail-open state, as it changes marker appearance and may conflict with the route selection pin display.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bottom sheet transitions | Custom animation library | CSS `height` transition (see DirectionsSheet.tsx) | Already proven pattern in this project |
| Drag handle for resizing | Custom touch tracking | Copy from DirectionsSheet.tsx (onPointerDown/Move/Up pattern) | Already works, tested across devices |
| Detail field display | Custom data formatting | Copy field-by-field pattern from existing LandmarkSheet.tsx | All fields (label, roomNumber, type, description, buildingName, accessibilityNotes) already rendered |

**Key insight:** Both the UI pattern (custom sheet) and the data rendering (field display) already exist in this codebase. Phase 13 is primarily a wiring task, not a building task.

## Common Pitfalls

### Pitfall 1: Two Sheets Simultaneously Visible
**What goes wrong:** Detail sheet opens on landmark tap; user selects a route; directions sheet also opens. Both are on screen with z-50.
**Why it happens:** `detailNode` and `sheetOpen` (directions) are independent state, so they can both be truthy at the same time.
**How to avoid:** Add a `useEffect` that clears `detailNode` when a route is triggered. Also: if `detailNode !== null` should close when `sheetOpen` becomes true (directions sheet opened), add that dependency.
**Warning signs:** Two sheets stacked on top of each other in the browser.

### Pitfall 2: Detail Sheet Interferes with Canvas Pan
**What goes wrong:** The sheet's touch handlers capture pointer events meant for the canvas, blocking pan.
**Why it happens:** `pointer-events: auto` on the sheet element intercepts events that would otherwise reach the Konva Stage.
**How to avoid:** The sheet is `position: fixed; bottom: 0` and only covers the lower portion of the screen. Canvas area above the sheet should remain interactive. Only the drag handle uses `touch-none` (pointer capture). This is the same approach as DirectionsSheet.
**Warning signs:** Cannot pan the map above the peeked sheet.

### Pitfall 3: onSelectNode Signature Mismatch
**What goes wrong:** `LandmarkLayer.onSelectNode` currently types as `(node: NavNode) => void` and the caller is `routeSelection.setFromTap`. Changing the caller to a combined handler should be transparent, but any TypeScript narrowing must be preserved.
**Why it happens:** TypeScript will catch type mismatches, but refactors that touch both the prop interface and the implementation can introduce subtle bugs.
**How to avoid:** Keep the `onSelectNode: (node: NavNode) => void` prop signature unchanged. The FloorPlanCanvas wrapper handler is what changes.

### Pitfall 4: Landmark Taps Open Detail Even for Already-Selected Nodes
**What goes wrong:** A node is selected as A or B (and replaced by a pin), the user taps a visible landmark (which is not hidden), and the detail sheet opens for a node that is also serving as a route endpoint. This is technically correct behavior but may confuse users.
**Why it happens:** `hiddenNodeIds` only hides A/B nodes from the landmark layer; all other nodes still fire tap events.
**How to avoid:** This is acceptable behavior — showing the detail of a landmark while it's selected as a route endpoint is valid. No special handling needed. Document as a known edge case.

### Pitfall 5: LandmarkSheet.tsx Uses Vaul — Needs Rewrite
**What goes wrong:** The existing `LandmarkSheet.tsx` imports from `vaul`. Running it as-is would re-introduce the pointer-event conflicts.
**Why it happens:** Phase 4 created LandmarkSheet with Vaul before Phase 5.1 replaced Vaul with the custom CSS sheet pattern.
**How to avoid:** Either:
  - **Option A (recommended):** Create a new `LocationDetailSheet.tsx` using the custom CSS pattern. Keep the field rendering logic from `LandmarkSheet.tsx` but replace the Vaul wrapper.
  - **Option B:** In-place rewrite of `LandmarkSheet.tsx` to use the custom CSS pattern.
  Either way, do not import from `vaul` for this component.

## Code Examples

Verified patterns from the codebase:

### Current LandmarkLayer onSelectNode wiring (FloorPlanCanvas.tsx line 321)
```typescript
// Source: src/client/components/FloorPlanCanvas.tsx
<LandmarkLayer
  nodes={nodes}
  imageRect={imageRect}
  stageScale={stageScale}
  selectedNodeId={null}
  onSelectNode={routeSelection.setFromTap}  // Phase 13: wrap in combined handler
  hiddenNodeIds={hiddenNodeIds}
/>
```

### NavNode fields available for display
```typescript
// Source: src/shared/types.ts
interface NavNode extends NavNodeData {
  id: string        // unique ID
  label: string     // display name (always present)
  type: NavNodeType // 'room' | 'entrance' | 'elevator' | 'restroom' | 'landmark'
  roomNumber?: string
  description?: string
  buildingName?: string
  accessibilityNotes?: string
  floor: number
  x: number         // normalized 0-1 (don't display)
  y: number         // normalized 0-1 (don't display)
  searchable: boolean
}
```

### Custom sheet height transition pattern (DirectionsSheet.tsx)
```typescript
// Source: src/client/components/DirectionsSheet.tsx
const PEEK_HEIGHT = 260  // px
const EXPANDED_MAX = 0.92  // fraction of window height

// The sheet only renders when open — no DOM waste when closed
if (!open) return null

return (
  <section
    className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-2xl bg-white shadow-2xl"
    style={{
      height: expanded ? `${Math.round(window.innerHeight * EXPANDED_MAX)}px` : `${PEEK_HEIGHT}px`,
      transition: 'height 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
    }}
  >
    {/* Drag handle */}
    <div
      className="shrink-0 flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing touch-none"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        onDragStart(e.clientY)
      }}
      onPointerMove={(e) => onDragMove(e.clientY)}
      onPointerUp={() => onDragEnd()}
      onPointerCancel={() => onDragEnd()}
    >
      <div className="h-1.5 w-10 rounded-full bg-gray-300" />
    </div>
    {/* ... content ... */}
  </section>
)
```

### Existing LandmarkSheet field display (reuse the field section, drop the Vaul wrapper)
```typescript
// Source: src/client/components/LandmarkSheet.tsx
// The content section is correct — just replace Drawer.Root/Portal/Content wrapper

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
  {node?.accessibilityNotes && (
    <div className="mb-3">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Accessibility</p>
      <p className="text-sm text-gray-700">{node.accessibilityNotes}</p>
    </div>
  )}
</div>
```

### Legend bottom position pattern (established in Phase 06-06)
```typescript
// Source: src/client/components/FloorPlanCanvas.tsx
// Legend dynamically repositions based on sheetOpen
style={{ bottom: sheetOpen ? '276px' : '16px' }}
// Phase 13 will need to account for detailSheet also being open
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Vaul bottom sheet (`LandmarkSheet.tsx`) | Custom CSS height-transition sheet (`DirectionsSheet.tsx` pattern) | Phase 5.1 | No external dependency, no pointer-event conflicts |
| Landmark tap → detail only | Landmark tap → route selection only | Phase 5 | Detail display was dropped entirely |
| Phase 13 goal | Landmark tap → detail AND route selection | Phase 13 | Restore ROUT-07 without breaking SRCH-02 |

**Deprecated/outdated:**
- Vaul `Drawer.Root/Portal/Content` pattern: replaced by custom CSS sheet — do not reintroduce
- `LandmarkSheet.tsx` as-is: Vaul-based, must be replaced with custom CSS version before use

## Open Questions

1. **Should tapping the same landmark twice toggle the detail sheet closed?**
   - What we know: Currently, tapping a landmark always calls `setFromTap`, which may assign the same node to the route selection field it already occupies (causing a swap if it was the other field)
   - What's unclear: Is toggle-to-close desired, or is always-open-on-tap simpler?
   - Recommendation: Always open on tap (simpler, consistent). If `detailNode?.id === node.id`, still call `setDetailNode(node)` — no harm, sheet just re-renders with same data.

2. **What happens to the canvas legend position when the detail sheet is open?**
   - What we know: The legend uses `style={{ bottom: sheetOpen ? '276px' : '16px' }}` where `sheetOpen` is the directions sheet state
   - What's unclear: Should the detail sheet also push the legend up?
   - Recommendation: Yes — add a condition for `detailNode !== null` alongside `sheetOpen` in the legend's bottom calculation. The detail sheet peek height will be smaller (~180px), so use a different offset.

3. **Should the detail sheet also dismiss when the user taps the map background?**
   - What we know: Phase 4's original implementation used `Stage onClick` to dismiss the sheet. However, the current FloorPlanCanvas has no `onClick` on the Stage.
   - What's unclear: Is background-tap-to-dismiss desirable?
   - Recommendation: The drag handle and a close (×) button are sufficient for dismissal. Background tap dismissal is optional and can be added via `Stage onClick={() => setDetailNode(null)}` but is not required by ROUT-07.

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection — all findings from reading actual source files
  - `src/client/components/FloorPlanCanvas.tsx` — tap handler, state management, sheet render patterns
  - `src/client/components/LandmarkLayer.tsx` — onSelectNode prop interface
  - `src/client/components/LandmarkMarker.tsx` — onClick/onTap handler
  - `src/client/components/LandmarkSheet.tsx` — existing detail component (Vaul-based, needs rewrite)
  - `src/client/components/DirectionsSheet.tsx` — custom CSS sheet pattern to replicate
  - `src/client/hooks/useRouteSelection.ts` — setFromTap behavior
  - `src/shared/types.ts` — NavNode field definitions
  - `.planning/phases/05-search-location-selection/05-01-SUMMARY.md` — Phase 5 decision to remove LandmarkSheet
  - `.planning/phases/04-map-landmarks-location-display/04-03-SUMMARY.md` — original LandmarkSheet implementation
  - `.planning/phases/05.1-issues-needed-to-be-fixed/05.1-02-SUMMARY.md` — Vaul removal rationale
  - `.planning/phases/06-route-visualization-directions/06-06-PLAN.md` — routeVisible state decoupled from sheetOpen

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — codebase inspection, no speculation
- Architecture: HIGH — all patterns directly verified in existing code
- Pitfalls: HIGH — pitfalls derived from documented Phase 5 and 5.1 decisions

**Research date:** 2026-02-22
**Valid until:** 2026-03-22 (stable codebase, 30-day window)
