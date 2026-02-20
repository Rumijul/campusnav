---
phase: 08-admin-authentication
plan: 03
type: execute
wave: 3
depends_on:
  - 08-02
files_modified: []
autonomous: false
requirements:
  - ADMN-01

must_haves:
  truths:
    - "Admin can log in with email/password and reach the admin panel"
    - "Unauthenticated users are redirected to login when accessing /admin"
    - "Student wayfinding at / works without any login prompt"
    - "Admin session persists across browser refresh"
    - "Logout clears session and returns to login page"
  artifacts: []
  key_links: []
---

<objective>
Human verification of the complete admin authentication flow: login, session persistence, protected routes, logout, and student access.

Purpose: Confirm that all auth behaviors work correctly in the browser before marking Phase 8 complete.
Output: Verified auth flow ready for Phase 9 (admin map editor).
</objective>

<execution_context>
@C:/Users/LENOVO/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/LENOVO/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/08-admin-authentication/08-01-SUMMARY.md
@.planning/phases/08-admin-authentication/08-02-SUMMARY.md
</context>

<tasks>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Verify complete admin authentication flow</name>
  <action>Human tests all verification scenarios below on the running dev server at http://localhost:5173.</action>
  <verify>Human confirms all scenarios pass and types "approved".</verify>
  <done>All 5 must-have truths confirmed — Phase 8 verified complete.</done>
  <what-built>
    Complete admin authentication system:
    - Server: JWT login/logout/me endpoints with httpOnly cookies, brute-force rate limiting, CSRF protection
    - Client: React Router with public student route (/), login page (/admin/login), protected admin routes (/admin)
    - Session management: httpOnly cookie persists across refresh, logout clears server-side
  </what-built>
  <how-to-verify>
    **Setup:** Ensure `npm run dev` is running (both client and server).

    **1. Student access unchanged (no login required):**
    - Open http://localhost:5173/
    - Confirm the campus floor plan map loads and works (pan, zoom, search, routing)
    - No login prompt, no redirect — fully public

    **2. Protected route redirect:**
    - Open http://localhost:5173/admin
    - Confirm redirect to http://localhost:5173/admin/login

    **3. Login form:**
    - On the login page, verify: email field, password field, "Sign In" button
    - Submit with wrong credentials → "Invalid credentials" error shown
    - Submit with correct credentials (from your .env) → redirect to /admin

    **4. Admin panel:**
    - After login, confirm you see the admin shell with "Admin Panel" heading and a logout button
    - Refresh the page (F5) → confirm you stay on /admin (session persists)

    **5. Logout:**
    - Click the logout button
    - Confirm redirect to /admin/login
    - Try navigating to /admin → confirm redirect to /admin/login (session cleared)

    **6. Rate limiting (optional):**
    - Rapidly submit 6+ wrong logins → confirm "Too many login attempts" message appears
  </how-to-verify>
  <resume-signal>Type "approved" if all checks pass, or describe any issues found</resume-signal>
</task>

</tasks>

<verification>
All 5 must-have truths verified by human interaction:
1. Admin login works with valid credentials
2. Unauthenticated users redirected to login
3. Student wayfinding unaffected
4. Session persists across refresh
5. Logout clears session
</verification>

<success_criteria>
- Human confirms all auth behaviors work correctly in the browser
- No regressions in student-facing wayfinding
</success_criteria>

<output>
After completion, create `.planning/phases/08-admin-authentication/08-03-SUMMARY.md`
</output>
