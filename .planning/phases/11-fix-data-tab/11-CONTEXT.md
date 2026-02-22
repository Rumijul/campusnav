# Phase 11: Fix Data Tab Visibility - Context

**Gathered:** 2026-02-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix the bug preventing the Data tab in the admin map editor from rendering. The Data tab should reveal NodeDataTable and EdgeDataTable when clicked. The tables, tab-switching logic, and layout components already exist from Phase 10 — this phase only fixes their visibility, not rebuilds them.

</domain>

<decisions>
## Implementation Decisions

### Debug approach
- Root cause is not yet diagnosed — issue was observed (tab doesn't render) but not investigated
- Investigation scope: comprehensive — check CSS/Tailwind layout, JS runtime errors, and component mounting (not just Tailwind)
- Investigation breadth: broad — do not constrain to MapEditorCanvas.tsx; trace the full tab rendering path including parent layout wrappers
- Task breakdown: Claude's discretion — agent decides whether to split investigate/fix into separate tasks or do it in one pass

### Fix strategy
- Fix approach: Claude's discretion — prefer minimal targeted change, but restructure if the layout is structurally wrong
- Inline styles: last resort only — try Tailwind classes first; use inline style only if nothing else works, and add a TODO comment
- Scope: fix Data tab and any clearly related tab-switching code (if Map/Canvas tab has the same structural issue, fix it too)
- Quality checks: always run `tsc --noEmit` and `biome check` after the fix — must pass with zero errors before plan is complete

### Validation & UAT
- Verification type: human browser UAT (not automated)
- UAT depth: full success criteria — tab renders, NodeDataTable and EdgeDataTable show actual rows, sorting works, filtering works, inline editing works
- Regression check: yes — also verify Map tab (canvas) still works correctly after the fix
- UAT format: brief smoke tests (5-8 steps), not a comprehensive 36-step checklist

### Data tab UX on fix
- Initial render state: brief loading indication then data appears (not instant, not long spinner)
- Empty state (zero nodes/edges): Claude's discretion — pick what looks natural given the existing table component design
- Table layout: preserve whatever Phase 10 built — do not redesign the layout, just make it visible
- Tab state persistence on switch: Claude's discretion — pick what makes sense given React component state management

### Claude's Discretion
- Task breakdown (investigate vs fix in one pass)
- Fix approach (targeted patch vs layout restructure) — prefer minimal
- Empty state UX when no nodes/edges
- Tab state persistence (reset vs preserve on tab switch)

</decisions>

<specifics>
## Specific Ideas

- The Phase 10 UAT (10-03-SUMMARY.md) recorded: "Data tab not visible in UI (potential rendering issue in MapEditorCanvas.tsx) — noted as known issue; phase approved for deployment"
- Investigation should start in MapEditorCanvas.tsx but is not limited to it — the issue could be in a parent layout wrapper or a component mounting failure

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 11-fix-data-tab*
*Context gathered: 2026-02-22*
