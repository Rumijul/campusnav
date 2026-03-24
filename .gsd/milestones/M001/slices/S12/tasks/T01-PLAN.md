---
phase: 11-fix-data-tab
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/client/pages/admin/MapEditorCanvas.tsx
autonomous: true
requirements:
  - EDIT-07
  - EDIT-08

must_haves:
  truths:
    - "Clicking the Data tab in the browser reveals NodeDataTable and EdgeDataTable (no blank/collapsed panel)"
    - "The Map tab canvas still renders correctly after the fix"
    - "tsc --noEmit exits with zero errors"
    - "biome check exits with zero errors/warnings"
  artifacts:
    - path: "src/client/pages/admin/MapEditorCanvas.tsx"
      provides: "Root div with min-h-0 class added to flex-col container"
      contains: "min-h-0"
  key_links:
    - from: "MapEditorCanvas root div"
      to: "Data panel div (flex-1 overflow-auto)"
      via: "Tailwind flex height propagation"
      pattern: "flex h-full w-full flex-col min-h-0"
---

<objective>
Diagnose and fix the CSS flex layout issue preventing the Data tab panel from rendering in the admin map editor.

Purpose: The Data tab (NodeDataTable + EdgeDataTable) was fully implemented in Phase 10 but is visually invisible due to a missing Tailwind `min-h-0` constraint on the MapEditorCanvas root flex container. This prevents EDIT-07 and EDIT-08 from being verifiable.

Output: A single-class fix to MapEditorCanvas.tsx that makes the Data panel fill its available height correctly, confirmed by passing tsc + biome checks.
</objective>

<execution_context>
@C:/Users/admin/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/admin/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md

@src/client/pages/admin/MapEditorCanvas.tsx
@.planning/phases/11-fix-data-tab/11-RESEARCH.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Diagnose and fix the Data tab CSS layout bug</name>
  <files>src/client/pages/admin/MapEditorCanvas.tsx</files>
  <action>
    **Step 1 — Confirm root cause in code:**
    Read MapEditorCanvas.tsx. Verify the root return div at ~line 298 has class `"relative flex h-full w-full flex-col"` and is missing `min-h-0`. Also verify the Data panel div uses `"flex-1 overflow-auto"` — this is the correct class and must NOT be changed.

    **Step 2 — Apply the fix:**
    Change the root div class from:
    ```
    "relative flex h-full w-full flex-col"
    ```
    to:
    ```
    "relative flex h-full w-full flex-col min-h-0"
    ```
    This adds `min-h-0` which overrides the default `min-height: auto` on the flex container, allowing the `flex-1` Data panel child to properly receive the remaining height from the ancestor `h-screen` on AdminShell.

    **Step 3 — Verify no regressions introduced:**
    - Do NOT change the Map panel's explicit `style={{ height: editorHeight - 52 }}` — Konva Stage requires explicit pixel dimensions and must not use CSS-based sizing.
    - Do NOT change the tab-switching logic (hidden-not-unmounted pattern must be preserved: `className={activeTab !== 'data' ? 'hidden' : 'flex-1 overflow-auto'}`).
    - Do NOT change the EditorToolbar wrapper or tab bar divs.
    - If AdminShell.tsx also uses `h-full` (not `h-screen`) anywhere in its chain, check whether it also needs `min-h-0`. AdminShell uses `h-screen` (absolute height) — it does NOT need `min-h-0`. Only MapEditorCanvas needs the fix.

    **Step 4 — Check browser console (document before fixing, not after):**
    Before concluding the fix is complete, note: the RESEARCH.md flagged a possible JS runtime error as a secondary cause. If the CSS fix alone is applied and the dev server is running, click the Data tab and check the browser console for React errors or unhandled exceptions. If a JS error exists (e.g., undefined prop), fix it too and document in the SUMMARY.

    **Step 5 — Run quality checks:**
    ```bash
    cd C:/Users/admin/Desktop/projects/campusnav && npm run typecheck
    cd C:/Users/admin/Desktop/projects/campusnav && npm run lint
    ```
    Both must exit with zero errors. If either fails, fix before proceeding.
  </action>
  <verify>
    1. `npm run typecheck` exits with 0 errors
    2. `npm run lint` exits with 0 errors/warnings
    3. MapEditorCanvas.tsx root div class string contains `min-h-0`
    4. Map panel still has its explicit `style={{ height: ... }}` unchanged
    5. Data panel div still uses `className={activeTab !== 'data' ? 'hidden' : 'flex-1 overflow-auto'}` (hidden-not-unmounted preserved)
  </verify>
  <done>
    MapEditorCanvas.tsx root div has `min-h-0` added; tsc and biome both pass with zero errors; no other layout classes modified; hidden-not-unmounted pattern preserved.
  </done>
</task>

</tasks>

<verification>
After completing Task 1:
- `npm run typecheck` → exit 0
- `npm run lint` → exit 0
- `git diff src/client/pages/admin/MapEditorCanvas.tsx` shows only `min-h-0` added to root div class (and any JS error fixes if discovered)
</verification>

<success_criteria>
The Data tab rendering fix is ready for human UAT when:
1. The root div class in MapEditorCanvas.tsx contains `min-h-0`
2. tsc passes with zero errors
3. biome passes with zero errors/warnings
4. The Map panel's explicit style and Konva Stage props are unchanged
</success_criteria>

<output>
After completion, create `.planning/phases/11-fix-data-tab/11-01-SUMMARY.md` following the summary template.
</output>
