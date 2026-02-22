# Phase 12: Retroactive Phase Verifications - Research

**Researched:** 2026-02-22
**Domain:** Documentation verification — retroactive VERIFICATION.md creation for Phases 7, 8, and 9
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ADMN-02 | Student-facing wayfinding requires no login or authentication | Phase 7 already has a VERIFICATION.md that formally satisfies this requirement. Plan 12-01 must confirm its presence and completeness. |
| ADMN-01 | Admin can log in with credentials to access the map editor | Phase 8 has no VERIFICATION.md. Full code evidence confirmed in src/server/auth/routes.ts, src/client/hooks/useAuth.ts, src/client/components/ProtectedRoute.tsx, src/client/App.tsx. Human UAT confirmed in 08-03-SUMMARY.md (5/5 tests passed). |
| EDIT-01 | Admin can upload a floor plan image as the map base layer | Phase 9 has no VERIFICATION.md. POST /api/admin/floor-plan endpoint confirmed in src/server/index.ts line 207. handleFileChange with blob URL confirmed in 09-02-SUMMARY.md. Human UAT passed in 09-04-SUMMARY.md. |
| EDIT-02 | Admin can place visible landmark nodes on the floor plan via drag-and-drop | Phase 9 has no VERIFICATION.md. NodeMarkerLayer + PLACE_NODE action confirmed in 09-02-SUMMARY.md. Human UAT passed in 09-04-SUMMARY.md. |
| EDIT-03 | Admin can place hidden navigation nodes (ramps, stairs, hallway junctions) via drag-and-drop | Phase 9 has no VERIFICATION.md. Same PLACE_NODE flow; junction/hallway/stairs/ramp types auto-set searchable:false. Human UAT passed in 09-04-SUMMARY.md. |
| EDIT-04 | Admin can create edges (connections) between nodes with distance/weight metadata | Phase 9 has no VERIFICATION.md. CREATE_EDGE two-click flow with rubber-band preview confirmed in EdgeLayer.tsx and 09-03-SUMMARY.md. Human UAT passed in 09-04-SUMMARY.md. |
| EDIT-05 | Admin can mark edges as wheelchair-accessible or not | Phase 9 has no VERIFICATION.md. EditorSidePanel accessible toggle → UPDATE_EDGE with 1e10 sentinel confirmed in 09-03-SUMMARY.md. Human UAT passed in 09-04-SUMMARY.md. |
</phase_requirements>

---

## Summary

Phase 12 is a documentation-closure phase, not a code-change phase. The v1.0 milestone audit identified that Phases 7, 8, and 9 completed their implementations and human UAT successfully but were never given formal VERIFICATION.md files. Seven requirements (ADMN-02, ADMN-01, EDIT-01 through EDIT-05) are classified as "orphaned" — functionally satisfied by code and human UAT approval, but absent from any VERIFICATION.md document.

**Critical discovery:** Phase 7 already has a VERIFICATION.md (`07-VERIFICATION.md`) that was created retroactively during the v1.0 audit process (dated 2026-02-22). This file is comprehensive, complete, and passes all 6 truth checks for ADMN-02. Plan 12-01 should confirm its existence and completeness rather than creating a new file from scratch.

The work for Phase 12 is entirely code-reading and document-writing. No implementation changes are required. The verifier reads existing source files and SUMMARY artifacts to produce structured VERIFICATION.md files that formally close the documentation gap. The pattern is established by the existing `07-VERIFICATION.md` file.

**Primary recommendation:** Use the existing `07-VERIFICATION.md` as the canonical format template. Create `08-VERIFICATION.md` for ADMN-01 and `09-VERIFICATION.md` for EDIT-01 through EDIT-05, each following the same frontmatter + observable truths + required artifacts + key link verification + requirements coverage structure.

---

## Situation Assessment: What Already Exists

### Phase 7 (ADMN-02) — VERIFICATION.MD ALREADY EXISTS

`07-VERIFICATION.md` was created during the audit (2026-02-22). It contains:
- Frontmatter: `status: passed`, `score: 6/6`, `re_verification: false`, `gaps: []`
- 6 observable truths all VERIFIED
- 9 required artifacts all VERIFIED with line numbers
- 7 key links all WIRED
- ADMN-02 requirements coverage section
- CSRF analysis confirming GET /api/map is safe-method-passthrough

**Plan 12-01 task:** Confirm this file exists and is complete. If complete (it is), close by documenting the finding. No new file needs to be written for Phase 7.

### Phase 8 (ADMN-01) — NO VERIFICATION.MD EXISTS

Source evidence available:
- `src/server/auth/routes.ts` — POST /login (bcrypt, rate-limited), POST /logout, GET /me (JWT-protected)
- `src/server/auth/credentials.ts` — env var validation, import-time throw for JWT_SECRET
- `src/server/auth/loginLimiter.ts` — hono-rate-limiter, 5/10min per IP
- `src/server/index.ts` line 28: `app.use(csrf())` global; line 122: `app.use('/api/admin/*', jwt(...))` guard
- `src/client/hooks/useAuth.ts` — GET /api/auth/me with credentials:'include', logout via POST
- `src/client/components/ProtectedRoute.tsx` — Outlet-based guard, Navigate to /admin/login when unauthenticated
- `src/client/pages/admin/LoginPage.tsx` — email+password form with spinner/error states
- `src/client/pages/admin/AdminShell.tsx` — admin shell with logout button
- `src/client/App.tsx` — BrowserRouter with Routes: / (StudentApp), /admin/login (LoginPage), /admin (ProtectedRoute > AdminShell)
- Human UAT: `08-UAT.md` — 5/5 tests passed

### Phase 9 (EDIT-01 through EDIT-05) — NO VERIFICATION.MD EXISTS

Source evidence available:
- `src/client/hooks/useEditorState.ts` — useReducer editor state, PLACE_NODE, CREATE_EDGE, UPDATE_EDGE, MOVE_NODE, undo/redo
- `src/server/index.ts` line 207: `app.post('/api/admin/floor-plan', ...)` — multipart upload
- `src/server/index.ts` line 131: `app.post('/api/admin/graph', ...)` — atomic SQLite transaction
- `src/client/pages/admin/MapEditorCanvas.tsx` — handleFileChange (blob URL), handleCanvasClick (PLACE_NODE/edge two-click), keyboard shortcuts
- `src/client/components/admin/NodeMarkerLayer.tsx` — landmark markers (pin + label) + navigation dots, counter-scale, drag to reposition
- `src/client/components/admin/EditorToolbar.tsx` — Select/Add Node/Add Edge modes, Upload, Save, Undo/Redo
- `src/client/components/admin/EdgeLayer.tsx` — color-coded edges (green/grey/blue), rubber-band preview (listening=false)
- `src/client/components/admin/EditorSidePanel.tsx` — wheelchair accessible toggle → UPDATE_EDGE with 1e10 sentinel
- Human UAT: `09-04-SUMMARY.md` — all 9 verification steps passed

---

## Standard Verification Format

The planner should create VERIFICATION.md files following the exact format established in `07-VERIFICATION.md`. The planner must understand this format precisely.

### Frontmatter Structure

```yaml
---
phase: {phase-slug}
verified: {ISO-8601 date}
status: passed
score: {N/N} must-haves verified
re_verification: false
gaps: []
human_verification:
  - test: "{human test description}"
    expected: "{expected result}"
    why_human: "{why this requires human observation}"
---
```

### Document Sections (in order)

1. **Goal Achievement** — Observable Truths table
2. **Required Artifacts** table
3. **Key Link Verification** table
4. **Requirements Coverage** table
5. **Anti-Patterns Found** table
6. **Human Verification Required** (detailed breakdown of UAT items)
7. **Gaps Summary**

### Observable Truths Table Columns

| Column | Content |
|--------|---------|
| # | Ordinal number |
| Truth | Plain-English statement of what must be true |
| Status | VERIFIED / NOT VERIFIED / HUMAN_NEEDED |
| Evidence | Specific file + line number + code reference |

### Required Artifacts Table Columns

| Column | Content |
|--------|---------|
| Artifact | File path |
| Expected | What the file should contain |
| Exists | Yes/No |
| Lines | Approximate line count |
| Status | VERIFIED / NOT VERIFIED |
| Details | Specific code evidence |

### Key Links Table Columns

| Column | Content |
|--------|---------|
| From | Source file |
| To | Target file |
| Via | Import/call mechanism |
| Status | WIRED / BROKEN |
| Details | Specific line reference |

---

## Observable Truths by Phase

### Phase 8 Observable Truths (ADMN-01: Admin Login)

These map directly to the Phase 8 success criteria and 08-UAT.md tests:

1. **Admin can log in with email/password and receive a session token** — POST /api/auth/login accepts JSON body, validates email+bcrypt password, issues httpOnly JWT cookie. Code: `src/server/auth/routes.ts` lines 18-51.

2. **Unauthenticated users are redirected to login when accessing admin routes** — ProtectedRoute checks `useAuth().authenticated` and redirects to /admin/login when not authenticated. Code: `src/client/components/ProtectedRoute.tsx` lines 15-17.

3. **Student-facing wayfinding remains fully accessible without login** — Route `/` renders `StudentApp` outside any `ProtectedRoute`. Code: `src/client/App.tsx` line 12.

4. **Admin session persists across browser refreshes** — httpOnly cookie with maxAge=7200 stored server-side; `useAuth` re-fetches GET /api/auth/me on mount. Code: `src/server/auth/routes.ts` lines 43-48, `src/client/hooks/useAuth.ts` lines 7-22.

5. **Admin can log out and session is fully cleared** — POST /api/auth/logout calls `deleteCookie(c, 'admin_token')` server-side. Code: `src/server/auth/routes.ts` lines 58-61.

Human UAT items (already confirmed in 08-03-SUMMARY.md): login form visual states (spinner during submit, error on wrong credentials), redirect after login, admin shell appearance.

### Phase 9 Observable Truths (EDIT-01 through EDIT-05)

These map directly to Phase 9 success criteria and 09-04-SUMMARY.md approval:

1. **Admin can upload a floor plan image that becomes the base layer** (EDIT-01) — POST /api/admin/floor-plan endpoint + handleFileChange in MapEditorCanvas creates blob URL for instant preview. Code: `src/server/index.ts` line 207, `src/client/pages/admin/MapEditorCanvas.tsx` handleFileChange.

2. **Admin can place visible landmark nodes on the floor plan by dragging and dropping** (EDIT-02) — PLACE_NODE action in useEditorState; NodeMarkerLayer renders landmark types as colored pin circles with labels; nodes draggable in select mode via onDragEnd normalizing pixel→normalized coords. Code: `src/client/hooks/useEditorState.ts`, `src/client/components/admin/NodeMarkerLayer.tsx`.

3. **Admin can place hidden navigation nodes by dragging and dropping** (EDIT-03) — Same PLACE_NODE flow; NavNodeType 'junction', 'hallway', 'stairs', 'ramp' auto-set searchable:false; rendered as small grey dots in NodeMarkerLayer. Code: `src/client/components/admin/NodeMarkerLayer.tsx`.

4. **Admin can create edges (connections) between nodes with distance/weight metadata** (EDIT-04) — Two-click flow: first click sets pendingEdgeSourceId (SET_PENDING_EDGE_SOURCE), second click fires CREATE_EDGE with auto-calculated normalized-coordinate distance; rubber-band preview (listening=false) follows cursor. Code: `src/client/components/admin/EdgeLayer.tsx`, `src/client/pages/admin/MapEditorCanvas.tsx`.

5. **Admin can mark edges as wheelchair-accessible or not** (EDIT-05) — EditorSidePanel accessible checkbox dispatches UPDATE_EDGE with `accessible: false` and `accessibleWeight: 1e10` (sentinel); green=accessible, grey=non-accessible color coding in EdgeLayer. Code: `src/client/components/admin/EditorSidePanel.tsx`, `src/client/components/admin/EdgeLayer.tsx` line 59.

Human UAT items (already confirmed in 09-04-SUMMARY.md): all 9 visual verification steps passed including floor plan upload, node placement, edge rubber-band, accessibility color coding, undo/redo, save persistence, student view unaffected.

---

## Required Artifacts by Phase

### Phase 8 Required Artifacts

| Artifact | What It Does |
|----------|-------------|
| `src/server/auth/credentials.ts` | Loads ADMIN_EMAIL, ADMIN_PASSWORD_HASH, JWT_SECRET; throws on missing JWT_SECRET |
| `src/server/auth/loginLimiter.ts` | hono-rate-limiter: 5 req/10-min per IP |
| `src/server/auth/routes.ts` | Hono router: POST /login, POST /logout, GET /me |
| `scripts/hash-password.ts` | CLI to generate bcrypt hash for .env setup |
| `.env.example` | Documents required env vars |
| `src/server/index.ts` | CSRF global (line 28), authRoutes mount (line 119), JWT guard on /api/admin/* (line 122) |
| `src/client/hooks/useAuth.ts` | Auth state via GET /api/auth/me; logout via POST |
| `src/client/components/ProtectedRoute.tsx` | Outlet-based guard; Navigate to /admin/login if unauthenticated |
| `src/client/pages/StudentApp.tsx` | Thin wrapper at / (outside ProtectedRoute) |
| `src/client/pages/admin/LoginPage.tsx` | Email+password form, spinner, error states |
| `src/client/pages/admin/AdminShell.tsx` | Admin shell with logout button |
| `src/client/App.tsx` | BrowserRouter + Routes tree: /,/admin/login,/admin |

### Phase 9 Required Artifacts

| Artifact | What It Does |
|----------|-------------|
| `src/client/hooks/useEditorState.ts` | useReducer editor state, all EditorAction types, undo/redo |
| `src/server/index.ts` lines 131, 207 | POST /api/admin/graph (SQLite transaction), POST /api/admin/floor-plan (multipart) |
| `src/client/pages/admin/MapEditorCanvas.tsx` | Konva Stage, mode switching, canvas click handlers, keyboard shortcuts |
| `src/client/components/admin/EditorToolbar.tsx` | Mode buttons, Upload, Save, Undo/Redo |
| `src/client/components/admin/NodeMarkerLayer.tsx` | Landmark pins + nav dots, draggable in select mode |
| `src/client/components/admin/EdgeLayer.tsx` | Color-coded edges, rubber-band preview |
| `src/client/components/admin/EditorSidePanel.tsx` | Node/edge property editor, accessible toggle |
| `src/client/pages/admin/AdminShell.tsx` | Mounts MapEditorCanvas full-screen |

---

## Key Decisions (for Evidence in Verification)

### Phase 8 Key Decisions

- **httpOnly cookie (not localStorage)** — `setCookie(c, 'admin_token', token, { httpOnly: true, ... })` in routes.ts line 43
- **PLACEHOLDER_HASH** — `const PLACEHOLDER_HASH = '$2b$12$invalid.hash.placeholder.value.xx'` in routes.ts line 9 — always runs bcrypt.compare to prevent timing attacks
- **Import-time throw for JWT_SECRET** — credentials.ts throws if JWT_SECRET missing
- **CSRF applied globally** — `app.use(csrf())` at line 28 of index.ts, before all routes
- **app.use('/api/admin/*', jwt(...))** at line 122 — all future admin routes protected automatically
- **BrowserRouter inside App.tsx** — not main.tsx; StrictMode in main stays unchanged

### Phase 9 Key Decisions

- **Undo/redo in useRef (not useState)** — avoids double renders; lightweight historyInfo useState for button disabled states
- **db.$client for synchronous transaction** — better-sqlite3 is sync-only; Drizzle's transaction is async
- **EdgeLayer between floor plan Layer and NodeMarkerLayer** — edges render under nodes
- **Rubber-band Line has listening=false** — prevents intercepting click events during edge creation
- **1e10 sentinel for non-accessible edges** — never Infinity (JSON.stringify(Infinity) = null); stored and returned as 10000000000
- **Stage height = viewportHeight - 52px** — toolbar offset keeps toolbar outside Konva coordinate space
- **Blob URL from URL.createObjectURL()** — instant floor plan preview + cache-bust after upload

---

## Anti-Patterns to Avoid in Verification Documents

These are code patterns to flag as WARNINGS in the VERIFICATION.md if found:

- **Stub/todo code** — functions that return hardcoded values or throw "not implemented"
- **Auth bypass** — admin routes without JWT guard
- **Double-fetch** — multiple useGraphData calls in same component tree
- **Infinity in JSON** — `JSON.stringify(Infinity)` produces `null`; use 1e10 sentinel

Based on source review, none of these are present in Phase 8 or 9 code. The Anti-Patterns Found tables will contain only INFO-level findings (guard clauses, etc.).

---

## Plan Structure Guidance

### Plan 12-01: Phase 7 VERIFICATION.md Check

**Scope:** Verify that the existing `07-VERIFICATION.md` is complete and formally closes ADMN-02.

**Key finding from research:** `07-VERIFICATION.md` already exists and is comprehensive (6/6 truths verified, 9 artifacts verified, 7 key links WIRED, ADMN-02 satisfied). Plan 12-01 is a confirmation task, not a creation task.

**Tasks:**
1. Read `07-VERIFICATION.md` and confirm it satisfies all 4 Phase 7 success criteria
2. Update REQUIREMENTS.md traceability to mark ADMN-02 as Complete
3. No file creation needed — document confirmation in plan summary

### Plan 12-02: Phase 8 VERIFICATION.md Creation

**Scope:** Create `08-VERIFICATION.md` by reading source files and cross-referencing 08-UAT.md.

**Tasks:**
1. Read key source files (auth/routes.ts, useAuth.ts, ProtectedRoute.tsx, App.tsx, index.ts lines 28/119/122)
2. Verify each observable truth against code with specific line numbers
3. Write `08-VERIFICATION.md` with all required sections
4. Update REQUIREMENTS.md traceability to mark ADMN-01 as Complete

### Plan 12-03: Phase 9 VERIFICATION.md Creation

**Scope:** Create `09-VERIFICATION.md` by reading source files and cross-referencing 09-04-SUMMARY.md.

**Tasks:**
1. Read key source files (useEditorState.ts, EdgeLayer.tsx, EditorSidePanel.tsx, MapEditorCanvas.tsx, NodeMarkerLayer.tsx)
2. Verify each observable truth (EDIT-01 through EDIT-05) against code with specific line numbers
3. Write `09-VERIFICATION.md` with all required sections covering all 5 requirements
4. Update REQUIREMENTS.md traceability to mark EDIT-01 through EDIT-05 as Complete

---

## Common Pitfalls

### Pitfall 1: Creating a Duplicate Phase 7 VERIFICATION.md

**What goes wrong:** Plan executor ignores existing `07-VERIFICATION.md` and creates a new one, overwriting the audit-created document.
**Why it happens:** Phase description says "create formal VERIFICATION.md files for Phases 7, 8, and 9" — executor assumes all three are missing.
**How to avoid:** Plan 12-01 must start by reading `.planning/phases/07-api-data-persistence/07-VERIFICATION.md` and confirming it exists and is complete.
**Warning signs:** Executor tries to write `07-VERIFICATION.md` without first reading it.

### Pitfall 2: Treating UAT as Unsatisfied

**What goes wrong:** Executor marks observable truths as HUMAN_NEEDED rather than VERIFIED because they involve visual UI interaction.
**Why it happens:** The verifier does not know that human UAT was already performed and approved.
**How to avoid:** Cross-reference `08-UAT.md` (5/5 passed) and `09-04-SUMMARY.md` (all 9 steps passed). Prior UAT approval is evidence — cite it explicitly. Mark items as VERIFIED with evidence pointing to the UAT file.

### Pitfall 3: Missing the 1e10 Sentinel Evidence for EDIT-05

**What goes wrong:** EDIT-05 verification marks accessibility toggle as VERIFIED but misses the sentinel value check.
**Why it happens:** It's easy to confirm the checkbox exists without checking the value stored for non-accessible edges.
**How to avoid:** Explicitly verify that UPDATE_EDGE sets `accessibleWeight: 1e10` (not Infinity, not 0) when accessible is false. Evidence: EditorSidePanel.tsx accessible toggle handler.

### Pitfall 4: Wrong File Location

**What goes wrong:** VERIFICATION.md written to wrong directory.
**Why it happens:** Phase 12 is in `.planning/phases/12-retroactive-verifications/` but the VERIFICATION.md files belong in the target phase directories.
**How to avoid:** Write to the phase being verified:
- `07-VERIFICATION.md` → `.planning/phases/07-api-data-persistence/07-VERIFICATION.md` (confirm existing)
- `08-VERIFICATION.md` → `.planning/phases/08-admin-authentication/08-VERIFICATION.md`
- `09-VERIFICATION.md` → `.planning/phases/09-admin-map-editor-visual/09-VERIFICATION.md`

---

## Code Examples

### Confirmed: JWT guard placement in index.ts

```typescript
// Source: src/server/index.ts lines 119-122
app.route('/api/auth', authRoutes)

// ── JWT guard for all admin API routes ────────────────────────────────────────
app.use('/api/admin/*', jwt({ secret: JWT_SECRET, alg: 'HS256', cookie: 'admin_token' }))
```

This single middleware line protects ALL `/api/admin/*` routes without per-route configuration.

### Confirmed: ProtectedRoute redirect pattern

```typescript
// Source: src/client/components/ProtectedRoute.tsx lines 15-17
if (!authenticated) {
  return <Navigate to="/admin/login" replace />
}
```

### Confirmed: Edge accessibility sentinel

```typescript
// Source: src/client/components/admin/EdgeLayer.tsx line 59
const stroke = isSelected ? '#3b82f6' : edge.accessible ? '#22c55e' : '#9ca3af'
```

Green (#22c55e) = accessible, grey (#9ca3af) = non-accessible, blue (#3b82f6) = selected.

### Confirmed: Rubber-band preview non-intercepting

```typescript
// Source: src/client/components/admin/EdgeLayer.tsx lines 85-89
stroke="#3b82f6"
strokeWidth={2}
dash={[8, 4]}
listening={false}   // ← critical: prevents click event interception
```

### Confirmed: Student route outside ProtectedRoute

```typescript
// Source: src/client/App.tsx lines 11-12
{/* Public: student wayfinding */}
<Route path="/" element={<StudentApp />} />
```

Route "/" is at root level, not nested inside `<Route element={<ProtectedRoute />}>`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| VERIFICATION.md format | A new format | The `07-VERIFICATION.md` template | Consistency with existing documents; planner expects this format |
| Code evidence | Manual re-analysis | Read the specific files and line numbers identified in this research | All evidence is already located; re-investigation wastes time |
| UAT re-confirmation | Re-running UAT with a human | Reference existing UAT artifacts | 08-UAT.md and 09-04-SUMMARY.md already capture human approval |

---

## Sources

### Primary (HIGH confidence)

- `.planning/phases/07-api-data-persistence/07-VERIFICATION.md` — canonical format template; ADMN-02 already satisfied
- `.planning/phases/07-api-data-persistence/07-UAT.md` — Phase 7 human UAT results (6/6 passed)
- `.planning/phases/08-admin-authentication/08-UAT.md` — Phase 8 human UAT results (5/5 passed)
- `.planning/phases/09-admin-map-editor-visual/09-04-SUMMARY.md` — Phase 9 human UAT approval (9/9 steps passed)
- `src/server/auth/routes.ts` — Phase 8 auth endpoints with line-number evidence
- `src/client/hooks/useAuth.ts` — Phase 8 client auth hook
- `src/client/components/ProtectedRoute.tsx` — Phase 8 route guard
- `src/client/App.tsx` — Phase 8 route tree
- `src/server/index.ts` lines 28, 119, 122 — CSRF + auth route mount + JWT guard
- `src/client/components/admin/EdgeLayer.tsx` — Phase 9 EDIT-04 + EDIT-05 evidence
- `.planning/v1.0-MILESTONE-AUDIT.md` — gap identification and evidence catalog

### Secondary (MEDIUM confidence)

- `.planning/phases/08-admin-authentication/08-01-SUMMARY.md` — Phase 8 Plan 01 decisions and file list
- `.planning/phases/08-admin-authentication/08-02-SUMMARY.md` — Phase 8 Plan 02 decisions and file list
- `.planning/phases/08-admin-authentication/08-03-SUMMARY.md` — Phase 8 Plan 03 (verification) summary
- `.planning/phases/09-admin-map-editor-visual/09-01-SUMMARY.md` — Phase 9 Plan 01 decisions
- `.planning/phases/09-admin-map-editor-visual/09-02-SUMMARY.md` — Phase 9 Plan 02 decisions
- `.planning/phases/09-admin-map-editor-visual/09-03-SUMMARY.md` — Phase 9 Plan 03 decisions

---

## Open Questions

1. **REQUIREMENTS.md update scope**
   - What we know: Phase 12 success criteria only mention creating VERIFICATION.md files
   - What's unclear: Whether Plans 12-01/02/03 should also update REQUIREMENTS.md traceability checkboxes from `[ ]` to `[x]`
   - Recommendation: Include REQUIREMENTS.md traceability updates in each plan — they are a direct consequence of closing the orphaned requirements and provide formal project-level closure.

2. **ADMN-02 status discrepancy**
   - What we know: REQUIREMENTS.md marks ADMN-02 as `[x]` Complete (line 37) despite being in the orphaned list. The audit classified it as orphaned from a VERIFICATION.md perspective only.
   - What's unclear: Whether Plan 12-01 needs to update REQUIREMENTS.md at all.
   - Recommendation: Plan 12-01 should confirm ADMN-02 is already marked `[x]` in REQUIREMENTS.md. If it is, no update needed. Focus effort on confirming the existing `07-VERIFICATION.md` is complete.

---

## Metadata

**Confidence breakdown:**
- Situation assessment (what exists): HIGH — direct file reads confirmed Phase 7 has VERIFICATION.md, Phases 8 and 9 do not
- Observable truths by phase: HIGH — verified against actual source files with line numbers
- Required artifacts lists: HIGH — confirmed by directory listing and SUMMARY frontmatter
- Format template: HIGH — derived directly from existing `07-VERIFICATION.md`
- Pitfalls: HIGH — based on direct inspection of actual gap between plans

**Research date:** 2026-02-22
**Valid until:** Not applicable — static codebase; verification content does not expire
