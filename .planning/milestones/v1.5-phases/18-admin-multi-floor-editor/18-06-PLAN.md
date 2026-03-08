---
phase: 18-admin-multi-floor-editor
plan: 06
type: execute
wave: 5
depends_on: [18-05]
files_modified: []
autonomous: false
requirements:
  - MFLR-04
  - CAMP-02
  - CAMP-03
  - CAMP-04

must_haves:
  truths:
    - "Admin can switch between buildings using the selector dropdown"
    - "Admin can switch between floor tabs and see the correct floor image and nodes"
    - "Manage Floors modal opens, lists floors, and allows adding a floor with image"
    - "Campus tab activates campus canvas; Upload Campus Map uploads the overhead image"
    - "Campus entrance node shows building link dropdown in side panel"
    - "Server starts without migration errors (connects_to_building_id column exists)"
  artifacts:
    - path: "src/client/pages/admin/MapEditorCanvas.tsx"
      provides: "Working multi-floor editor"
    - path: "src/client/components/admin/ManageFloorsModal.tsx"
      provides: "Working manage floors modal"
  key_links: []
---

<objective>
Human verification of the complete Phase 18 multi-floor editor. Confirms all MFLR-04, CAMP-02, CAMP-03, CAMP-04 requirements are observable and working in the browser.

Purpose: Visual and interactive verification that cannot be done by automated checks — floor plan rendering, modal UX, campus empty state, image upload previews.

Output: Approved phase — all must-have truths confirmed working.
</objective>

<execution_context>
@C:/Users/admin/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/admin/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/18-admin-multi-floor-editor/18-05-SUMMARY.md
</context>

<tasks>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>
    Phase 18 multi-floor admin editor:
    - Building selector dropdown between toolbar and canvas
    - Floor tab row with auto-save on switch
    - Manage Floors modal (add floor with image, delete floor with confirm, replace image)
    - Campus tab with empty state prompt and overhead image upload
    - Campus entrance node building link dropdown in side panel
    - Campus entrance nodes render in amber when linked to a building
    - connectsToBuildingId migration applied on server startup
  </what-built>
  <how-to-verify>
    Start the development server:
    ```
    npm run dev
    ```
    Navigate to http://localhost:3001 → Login as admin → open the admin map editor.

    **Check 1 — Building selector + floor tabs (MFLR-04):**
    1. Verify the building selector dropdown is visible between the toolbar and the canvas
    2. Verify floor tab(s) appear to the right of the dropdown, sorted by floor number
    3. Click a floor tab — confirm the canvas switches to that floor's image and nodes
    4. Switch to a different floor tab — confirm auto-save fires silently (no modal, no interruption)

    **Check 2 — Manage Floors modal (MFLR-04):**
    1. Click "Manage Floors" in the toolbar
    2. Confirm modal opens with a list of floors
    3. Each floor row should have: floor number label, image thumbnail, Replace Image button, Delete button
    4. Click "Add Floor" with a floor number and an image file — confirm a new floor tab appears after close
    5. Close the modal

    **Check 3 — Campus tab (CAMP-02, CAMP-03):**
    1. Select "Campus" from the building selector dropdown
    2. Confirm floor tabs disappear and "Manage Floors" button disappears from toolbar
    3. If no campus image exists: confirm "Upload campus map to begin" text is centered on canvas and clicking it opens file picker
    4. Upload a campus overhead image — confirm it appears on the canvas
    5. Confirm toolbar label changes to "Upload Campus Map" when Campus is active

    **Check 4 — Campus entrance node (CAMP-03, CAMP-04):**
    1. While in Campus context, place a node (Add Node mode, click canvas)
    2. In the side panel, change the node type to "Entrance"
    3. Confirm "Links to Building" dropdown appears in the side panel
    4. Select a building from the dropdown
    5. Confirm the node marker turns amber on the canvas

    **Check 5 — Server migration (MFLR-04 infrastructure):**
    1. In terminal, confirm server started without migration errors
    2. Confirm no `FK violation` or `column does not exist` errors in server output
  </how-to-verify>
  <resume-signal>Type "approved" if all 5 checks pass, or describe any issues found</resume-signal>
</task>

</tasks>

<verification>
All 5 manual checks pass as described above.
</verification>

<success_criteria>
- Building selector and floor tabs render and function correctly
- Floor switch auto-saves silently
- Manage Floors modal lists, adds, and deletes floors correctly
- Campus tab activates with empty state prompt; campus image upload works
- Campus entrance nodes show building link dropdown and amber marker
- Server starts cleanly with migration applied
</success_criteria>

<output>
After approval, create `.planning/phases/18-admin-multi-floor-editor/18-06-SUMMARY.md`
</output>
