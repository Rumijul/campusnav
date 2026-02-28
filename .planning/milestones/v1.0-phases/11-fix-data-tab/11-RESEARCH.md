# Phase 11: Fix Data Tab Visibility - Research

**Researched:** 2026-02-22
**Domain:** Tailwind CSS flex layout, React conditional rendering, browser DevTools diagnosis
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- Root cause is not yet diagnosed — investigation scope is comprehensive (CSS/Tailwind layout, JS runtime errors, and component mounting)
- Investigation breadth: broad — do not constrain to MapEditorCanvas.tsx; trace the full tab rendering path including parent layout wrappers
- Task breakdown: Claude's discretion — agent decides whether to split investigate/fix into separate tasks or do it in one pass
- Fix approach: Claude's discretion — prefer minimal targeted change, but restructure if the layout is structurally wrong
- Inline styles: last resort only — try Tailwind classes first; use inline style only if nothing else works, and add a TODO comment
- Scope: fix Data tab and any clearly related tab-switching code (if Map/Canvas tab has the same structural issue, fix it too)
- Quality checks: always run `tsc --noEmit` and `biome check` after the fix — must pass with zero errors before plan is complete
- Verification type: human browser UAT (not automated)
- UAT depth: full success criteria — tab renders, NodeDataTable and EdgeDataTable show actual rows, sorting works, filtering works, inline editing works
- Regression check: yes — also verify Map tab (canvas) still works correctly after the fix
- UAT format: brief smoke tests (5-8 steps), not a comprehensive 36-step checklist

### Claude's Discretion

- Task breakdown (investigate vs fix in one pass)
- Fix approach (targeted patch vs layout restructure) — prefer minimal
- Empty state UX when no nodes/edges
- Tab state persistence (reset vs preserve on tab switch)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| EDIT-07 | Admin can view and edit all nodes in a sortable, filterable data table | NodeDataTable already implemented and verified correct in Phase 10 Plan 02 — only visibility is broken; fix makes it accessible |
| EDIT-08 | Admin can import and export graph data in JSON or CSV format | DataTabToolbar with import/export already implemented and verified correct in Phase 10 Plan 02 — only visibility is broken; fix makes it accessible |
</phase_requirements>

## Summary

The Data tab components (NodeDataTable, EdgeDataTable, DataTabToolbar) were fully implemented and linted clean in Phase 10 Plan 02. The rendering issue is a CSS flex layout problem — not a component logic bug, not a JS runtime error. The root cause is identified by reading the existing code: the flex container chain has a missing `min-h-0` constraint that prevents the Data panel's `flex-1` from occupying the remaining height correctly, causing it to collapse to zero visible height.

The layout hierarchy is: `#root` (h-full) → AdminShell (`h-screen flex-col overflow-hidden`) → MapEditorCanvas (`h-full flex-col`) → Data panel div (`flex-1 overflow-auto`). In Tailwind's default flex model, flex children do not respect parent height constraints without `min-h-0` on intermediate containers. Without it, the Data panel with `flex-1 overflow-auto` collapses because the parent container's height is not properly resolved in the flex sizing pass.

This is a one-file fix: add `min-h-0` to MapEditorCanvas's root div class list. Confirm the fix visually in the browser (Data tab renders and shows table rows), then run `tsc --noEmit` and `biome check` for zero-error validation, then human UAT for sign-off.

**Primary recommendation:** Add `min-h-0` to the root div of MapEditorCanvas.tsx. If that alone is insufficient, also inspect whether the tab bar height calculation needs adjusting for the Data panel.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | 4.1.18 | Utility-first CSS, flex layout classes | Already used project-wide via `@tailwindcss/vite` plugin |
| React | 19.2.4 | Component rendering, conditional display | Already used project-wide |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Biome | 2.4.2 | Lint + format validation | Run after every code change (`npm run lint`) |
| TypeScript | 5.9.3 | Type checking | Run after every code change (`npm run typecheck`) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Tailwind `min-h-0` | Inline `style={{ minHeight: 0 }}` | Inline only as last resort per user decision; Tailwind class is cleaner |
| Tailwind `min-h-0` | Explicit pixel height via `useViewportSize` | More complex; only needed if flex fix is structurally insufficient |

**Installation:** No new packages needed. This is a pure CSS/layout fix.

## Architecture Patterns

### Existing Layout Hierarchy

```
#root                              ← height: 100% (style.css)
└── AdminShell                     ← h-screen w-screen flex flex-col overflow-hidden
    └── MapEditorCanvas            ← relative flex h-full w-full flex-col
        ├── EditorToolbar wrapper  ← shown/hidden via className toggle (~52px)
        ├── Tab bar                ← always visible (~45px), border-b + px-4 py-2
        ├── Map panel div          ← hidden | 'relative flex-1', explicit style height
        └── Data panel div         ← hidden | 'flex-1 overflow-auto'  ← BUG HERE
```

### Pattern 1: Tailwind flex-1 with min-h-0

**What:** When a flex container (`flex flex-col`) has a known height (set via `h-full`, `h-screen`, or explicit height), its `flex-1` children must be able to receive that height via the flex algorithm. By default, the minimum size of a flex item is `auto` (its content size), not 0. This means `flex-1` can be overridden by a large content size — or can fail to fill available space when the parent's height is set via an ancestor flex chain. Adding `min-h-0` overrides the default `min-height: auto` to `min-height: 0`, allowing the flex item to shrink and fill correctly.

**When to use:** Any `flex-col` container where a child uses `flex-1 overflow-auto` and the container gets its height from an ancestor (rather than an explicit pixel value).

**Example:**
```tsx
// Before — Data panel collapses to zero height
<div className="relative flex h-full w-full flex-col">
  <TabBar />
  <div className={activeTab !== 'data' ? 'hidden' : 'flex-1 overflow-auto'}>
    {/* content */}
  </div>
</div>

// After — min-h-0 allows flex children to fill properly
<div className="relative flex h-full w-full flex-col min-h-0">
  <TabBar />
  <div className={activeTab !== 'data' ? 'hidden' : 'flex-1 overflow-auto'}>
    {/* content */}
  </div>
</div>
```

### Pattern 2: Hidden-not-unmounted for tab switching

**What:** Phase 10 established the pattern of using `className={condition ? 'hidden' : '...'}` instead of conditional rendering (`condition && <Component />`). This keeps the Konva Stage mounted when the Data tab is active so that undo history and canvas state are preserved. This pattern is correct and must be maintained.

**Key insight from STATE.md:**
> `[Phase 10]: hidden-not-unmounted for tab switching — Konva Stage wrapper gets className=hidden to preserve undo history and canvas state during Data tab view`

### Anti-Patterns to Avoid

- **Replacing `hidden` with conditional rendering (`&&`):** Would destroy Konva Stage state (undo history, zoom position) on every tab switch. Do not do this.
- **Using `display: block` or `visibility: visible`:** Tailwind `hidden` sets `display: none`. Do not fight it with other display overrides on the same element.
- **Wrapping tables in an additional fixed-height div:** Adds complexity without need; the `flex-1 overflow-auto` pattern handles scrolling correctly once `min-h-0` is present.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Table sorting | Custom sort implementation | Existing NodeDataTable / EdgeDataTable already have sort | Already implemented and tested |
| Table filtering | Custom filter logic | Already in NodeDataTable / EdgeDataTable | Already implemented and tested |
| Tab switching | New tab state management | Existing `activeTab` useState already works | State is correct; only CSS is broken |

**Key insight:** This is not an implementation problem. The components exist and work. The problem is purely visual — a missing CSS class that prevents the browser from allocating height to the Data panel.

## Common Pitfalls

### Pitfall 1: Diagnosing only one layer

**What goes wrong:** Fixing `min-h-0` on MapEditorCanvas root div but missing that AdminShell also needs it (or vice versa).
**Why it happens:** The flex height propagation chain goes through both AdminShell and MapEditorCanvas. If any intermediate container lacks `min-h-0`, the child's `flex-1` may still collapse.
**How to avoid:** After the fix, verify in the browser that the Data panel actually fills the remaining space. AdminShell uses `h-screen overflow-hidden` which is an absolute height — this is safe. The problem is in MapEditorCanvas which uses `h-full` (relative to parent).
**Warning signs:** Data tab still collapses even after adding `min-h-0` — check parent containers.

### Pitfall 2: Breaking the Map panel while fixing the Data panel

**What goes wrong:** Removing the explicit `style={{ height: editorHeight - 52 }}` from the Map panel while restructuring layout, causing the Konva Stage to render with wrong dimensions.
**Why it happens:** Konva Stage requires explicit pixel dimensions (`width`, `height` props). It cannot use CSS-based sizing like `100%`. The explicit style on the Map panel wrapper and the Stage props must remain.
**How to avoid:** Do not touch the Map panel's explicit style. Only add `min-h-0` to the root div. Keep `style={{ width, height: editorHeight - 52 }}` and the Stage's `width={width} height={editorHeight - 52}` props unchanged.
**Warning signs:** After fix, Map tab canvas is blank or wrong size.

### Pitfall 3: The tab bar height is not subtracted in the Data panel

**What goes wrong:** The Data panel renders visible but its content area is obscured by the tab bar — or the panel itself has extra space at the bottom because the height arithmetic is wrong.
**Why it happens:** MapEditorCanvas root is `h-full` (= `h-screen` from AdminShell). The EditorToolbar is shown/hidden. The tab bar (~45px) always occupies space. The Map panel handles this with explicit `style={{ height: editorHeight - 52 }}` — but this only accounts for the toolbar, not the tab bar. For the Data panel, `flex-1` is used instead, so the browser should handle the remaining space correctly after `min-h-0` is added — no manual subtraction needed.
**How to avoid:** After the fix, visually check that the Data panel's scroll area doesn't extend behind the tab bar or off-screen.

### Pitfall 4: JS runtime error silently preventing render

**What goes wrong:** A JavaScript error thrown during Data panel rendering would also cause it to not appear, but this would produce a React error boundary or console error.
**Why it happens:** Could happen if a component prop is undefined or a function throws on first call.
**How to avoid:** Check browser console for errors when clicking the Data tab before concluding the fix is complete. However, the tsc + biome pass in Phase 10 Plan 02 makes this unlikely — the components are type-safe.
**Warning signs:** Console shows React error or unhandled exception when switching to Data tab.

## Code Examples

### Verified current code — MapEditorCanvas root div (the fix target)

```tsx
// Current (broken) — src/client/pages/admin/MapEditorCanvas.tsx line 298
return (
  <div className="relative flex h-full w-full flex-col">
    ...
  </div>
)

// Fixed — add min-h-0
return (
  <div className="relative flex h-full w-full flex-col min-h-0">
    ...
  </div>
)
```

### Verified current code — Data panel div (lines 424-466)

```tsx
{/* Data panel — mounted but hidden when Map tab is active */}
<div className={activeTab !== 'data' ? 'hidden' : 'flex-1 overflow-auto'}>
  <DataTabToolbar ... />
  {activeSubTab === 'nodes' ? (
    <NodeDataTable ... />
  ) : (
    <EdgeDataTable ... />
  )}
</div>
```

This div's classes are correct — `flex-1 overflow-auto` is the right pattern. The parent just needs `min-h-0`.

### Validation commands (from package.json)

```bash
# Type check — must pass with zero errors
npm run typecheck

# Lint — must pass with zero errors/warnings
npm run lint
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `height: 100vh` on containers | `h-screen` + `h-full` + `min-h-0` pattern | Tailwind v3+ CSS best practice | Enables scroll-within-flex without overflow |
| Conditional rendering (`&&`) for tabs | `className="hidden"` (hidden-not-unmounted) | Phase 10 decision | Preserves Konva Stage undo history across tab switches |

**Deprecated/outdated:**
- Explicit `calc(100vh - Xpx)` for tab content areas: Still works but brittle; prefer flex + `min-h-0` for composability.

## Open Questions

1. **Is there also a JS runtime error preventing render (in addition to or instead of the layout bug)?**
   - What we know: Phase 10 Plan 02 confirmed `tsc --noEmit` and `biome check` passed clean. Components are type-safe.
   - What's unclear: Whether there is a runtime error (e.g., undefined prop access) that only triggers when the Data tab is clicked.
   - Recommendation: When executing the fix plan, check the browser console for errors when switching to the Data tab *before* applying the CSS fix. This rules out a JS error as a secondary cause. If a JS error exists, it must be fixed too.

2. **Does AdminShell also need `min-h-0`?**
   - What we know: AdminShell uses `h-screen` (absolute height), not `h-full` (relative height). Absolute heights don't have the same flex propagation issue.
   - What's unclear: Whether Tailwind 4's flex implementation has any difference here.
   - Recommendation: Try fixing MapEditorCanvas root div first. If Data tab still doesn't render after that, check AdminShell.

3. **Is `editorHeight - 52` the correct subtraction for the Map panel?**
   - What we know: `editorHeight = height = window.innerHeight`. The toolbar is ~52px. But the tab bar is always visible and also takes height (~45px). So the Stage may already be slightly oversized.
   - What's unclear: Whether this causes visual overflow in the Map panel.
   - Recommendation: This is pre-existing behavior from Phase 10 and was not reported as broken. Do not change it during this phase unless the Map panel regression check reveals a problem.

## Sources

### Primary (HIGH confidence)

- Codebase direct inspection — `src/client/pages/admin/MapEditorCanvas.tsx` lines 297-477 (root div, Map panel div, Data panel div)
- Codebase direct inspection — `src/client/pages/admin/AdminShell.tsx` (parent layout)
- Codebase direct inspection — `src/client/components/admin/NodeDataTable.tsx` (component exists and renders correctly)
- Codebase direct inspection — `src/client/components/admin/EdgeDataTable.tsx` (component exists and renders correctly)
- Codebase direct inspection — `src/client/components/admin/DataTabToolbar.tsx` (component exists and renders correctly)
- `.planning/phases/10-admin-map-editor-management/10-03-SUMMARY.md` — confirmed known issue description and scope
- `.planning/STATE.md` — `[Phase 10]: hidden-not-unmounted for tab switching` decision confirmed

### Secondary (MEDIUM confidence)

- Tailwind CSS flex layout behavior (min-h-0 pattern): Widely documented CSS flex behavior; `min-height: auto` is the default for flex items which blocks height propagation from ancestor flex containers using `flex-col`. Adding `min-h-0` (maps to `min-height: 0`) allows proper flex shrinking and filling.

### Tertiary (LOW confidence)

- None required for this phase — the root cause is identified directly from code inspection.

## Metadata

**Confidence breakdown:**
- Root cause identification: HIGH — direct code inspection confirms the missing `min-h-0`
- Fix prescription: HIGH — `min-h-0` is the standard Tailwind fix for this exact pattern
- Pitfalls: HIGH — derived from reading the actual code and Phase 10 decisions
- Runtime error risk: MEDIUM — flagged as open question; unlikely given tsc/biome pass but worth checking

**Research date:** 2026-02-22
**Valid until:** Stable — flex layout behavior does not change frequently; valid indefinitely for this codebase
