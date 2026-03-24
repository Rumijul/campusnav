# S20: Admin Multi Floor Editor — completed 2026 03 07

**Goal:** unit tests prove Admin Multi-floor Editor — completed 2026-03-07 works
**Demo:** unit tests prove Admin Multi-floor Editor — completed 2026-03-07 works

## Must-Haves


## Tasks

- [x] **T01: Lay the foundational data contracts for Phase 18: add the campus-to-building bridge…**
  - Lay the foundational data contracts for Phase 18: add the campus-to-building bridge foreign key to the database schema and TypeScript types. This plan creates the interface contracts that all subsequent plans depend on.
- [x] **T02: Add the five new server API routes that the multi-floor editor and…**
  - Add the five new server API routes that the multi-floor editor and campus editor require: floor CRUD (add/delete), per-floor image upload, campus image upload, and campus image serving.
- [x] **T03: Extend useEditorState to support multi-floor and campus editing. The hook needs to…**
  - Extend useEditorState to support multi-floor and campus editing. The hook needs to track which building/floor is active and provide snapshot caching so floor switches don't re-fetch already-loaded data. Undo history resets on floor switch (auto-save handles persistence).
- [x] **T04: Create the ManageFloorsModal component and extend EditorToolbar, EditorSidePanel, and NodeMarkerLayer with the…**
  - Create the ManageFloorsModal component and extend EditorToolbar, EditorSidePanel, and NodeMarkerLayer with the floor management and campus-specific UI needed for MFLR-04, CAMP-03, and CAMP-04.
- [x] **T05: Wire all the Phase 18 components together in MapEditorCanvas: building selector, floor…**
  - Wire all the Phase 18 components together in MapEditorCanvas: building selector, floor tab row, auto-save on floor switch, campus mode, Manage Floors modal, context-sensitive upload, and correct node floorId assignment.
- [x] **T06: Human verification of the complete Phase 18 multi-floor editor. Confirms all MFLR-04…**
  - Human verification of the complete Phase 18 multi-floor editor. Confirms all MFLR-04, CAMP-02, CAMP-03, CAMP-04 requirements are observable and working in the browser.

## Files Likely Touched

- `src/server/db/schema.ts`
- `src/shared/types.ts`
- `drizzle/0002_campus_entrance_bridge.sql`
- `src/server/index.ts`
- `src/client/hooks/useEditorState.ts`
- `src/client/components/admin/ManageFloorsModal.tsx`
- `src/client/components/admin/EditorToolbar.tsx`
- `src/client/components/admin/EditorSidePanel.tsx`
- `src/client/components/admin/NodeMarkerLayer.tsx`
- `src/client/pages/admin/MapEditorCanvas.tsx`
