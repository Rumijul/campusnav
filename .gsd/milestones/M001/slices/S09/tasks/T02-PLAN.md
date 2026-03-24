---
phase: 08-admin-authentication
plan: 02
type: execute
wave: 2
depends_on:
  - 08-01
files_modified:
  - src/client/App.tsx
  - src/client/main.tsx
  - src/client/hooks/useAuth.ts
  - src/client/components/ProtectedRoute.tsx
  - src/client/pages/admin/LoginPage.tsx
  - src/client/pages/admin/AdminShell.tsx
  - src/client/pages/StudentApp.tsx
autonomous: true
requirements:
  - ADMN-01

must_haves:
  truths:
    - "Navigating to / shows the student wayfinding app (FloorPlanCanvas) with no login prompt"
    - "Navigating to /admin/login shows a minimal email + password login form"
    - "Submitting valid credentials on the login form redirects to /admin"
    - "Submitting invalid credentials shows 'Invalid credentials' error on the form"
    - "Submitting when rate-limited shows 'Too many login attempts' message"
    - "Submit button is disabled and shows spinner while login request is in-flight"
    - "Navigating to /admin without a valid session redirects to /admin/login"
    - "The /admin page shows an admin shell with a visible logout button"
    - "Clicking logout clears session and redirects to /admin/login"
    - "Session persists across browser refresh (cookie-based)"
  artifacts:
    - path: "src/client/App.tsx"
      provides: "BrowserRouter with route tree: / (public), /admin/login (public), /admin (protected)"
    - path: "src/client/hooks/useAuth.ts"
      provides: "useAuth hook: { authenticated, loading, logout } via GET /api/auth/me"
      exports: ["useAuth"]
    - path: "src/client/components/ProtectedRoute.tsx"
      provides: "Route guard that redirects unauthenticated users to /admin/login"
      exports: ["ProtectedRoute"]
    - path: "src/client/pages/admin/LoginPage.tsx"
      provides: "Minimal login form with email, password, submit, error display, spinner"
      exports: ["default"]
    - path: "src/client/pages/admin/AdminShell.tsx"
      provides: "Placeholder admin page with logout button (Phase 9 editor mounts here)"
      exports: ["default"]
    - path: "src/client/pages/StudentApp.tsx"
      provides: "Wrapper around FloorPlanCanvas for route element"
      exports: ["default"]
  key_links:
    - from: "src/client/components/ProtectedRoute.tsx"
      to: "src/client/hooks/useAuth.ts"
      via: "useAuth() for auth state check"
      pattern: "useAuth"
    - from: "src/client/App.tsx"
      to: "src/client/components/ProtectedRoute.tsx"
      via: "Route element wrapper for /admin"
      pattern: "ProtectedRoute"
    - from: "src/client/pages/admin/LoginPage.tsx"
      to: "/api/auth/login"
      via: "fetch POST on form submit"
      pattern: "fetch.*api/auth/login"
    - from: "src/client/pages/admin/AdminShell.tsx"
      to: "/api/auth/logout"
      via: "fetch POST on logout button click"
      pattern: "fetch.*api/auth/logout"
---

<objective>
Create the client-side authentication UI: React Router setup, login page, protected route guard, useAuth hook, and admin shell with logout.

Purpose: Wire the client to the server auth API (Plan 01) so admins can log in and access protected pages while students see the wayfinding app unchanged.
Output: Complete client-side auth flow with routing, login form, session persistence, and logout.
</objective>

<execution_context>
@C:/Users/LENOVO/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/LENOVO/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/08-admin-authentication/08-RESEARCH.md
@.planning/phases/08-admin-authentication/08-01-SUMMARY.md
@src/client/App.tsx
@src/client/main.tsx
@src/client/components/FloorPlanCanvas.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create useAuth hook, ProtectedRoute, and page components</name>
  <files>
    src/client/hooks/useAuth.ts
    src/client/components/ProtectedRoute.tsx
    src/client/pages/StudentApp.tsx
    src/client/pages/admin/LoginPage.tsx
    src/client/pages/admin/AdminShell.tsx
  </files>
  <action>
1. Create `src/client/hooks/useAuth.ts`:
   - State: `authenticated` (boolean, initial false), `loading` (boolean, initial true)
   - On mount (useEffect, empty deps): fetch `GET /api/auth/me` with `{ credentials: 'include' }`
     - If `response.ok` → `setAuthenticated(true)`
     - Else or on catch → `setAuthenticated(false)`
     - Finally → `setLoading(false)`
   - Export `logout` function: fetch `POST /api/auth/logout` with `{ method: 'POST', credentials: 'include' }`, then set `authenticated = false`
   - Return `{ authenticated, loading, logout }`

2. Create `src/client/components/ProtectedRoute.tsx`:
   - Import `Navigate`, `Outlet` from `react-router-dom`
   - Import `useAuth` from hooks
   - While `loading` → return a centered spinner div (Tailwind: `flex items-center justify-center h-screen`) with "Loading..." text
   - If `!authenticated` → return `<Navigate to="/admin/login" replace />`
   - Else → return `<Outlet />`

3. Create `src/client/pages/StudentApp.tsx`:
   - Simple wrapper: import and render `FloorPlanCanvas`
   - This exists so the route element is a page-level component

4. Create `src/client/pages/admin/LoginPage.tsx`:
   - Minimal Tailwind-styled form centered on page (flex, items-center, justify-center, min-h-screen, bg-gray-50)
   - Card container: max-w-sm, bg-white, p-8, rounded-lg, shadow
   - Heading: "Admin Login" (text-xl, font-semibold, mb-6)
   - Form fields: email (type="email", required) and password (type="password", required)
   - Each field: label + input with Tailwind styling (w-full, px-3, py-2, border, rounded, focus:ring)
   - Submit button: "Sign In" — full width, bg-blue-600, text-white, rounded, py-2
   - State: `email`, `password`, `submitting` (boolean), `error` (string | null)
   - On submit (handleSubmit):
     - `e.preventDefault()`, set `submitting=true`, clear error
     - `fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ email, password }) })`
     - If `res.ok` → `navigate('/admin')` using `useNavigate()` from react-router-dom
     - If `res.status === 429` → `setError('Too many login attempts. Please wait and try again.')`
     - Else → `setError('Invalid credentials.')`
     - Finally → `setSubmitting(false)`
   - When `submitting`: button disabled, text changes to "Signing in..." with a CSS spinner (animate-spin)
   - Error display: red text below the button (`text-red-600 text-sm mt-3`)
   - If user is already authenticated (check via useAuth), redirect to /admin immediately

5. Create `src/client/pages/admin/AdminShell.tsx`:
   - Simple placeholder page for Phase 9 editor
   - Header bar: flex, justify-between, items-center, p-4, bg-white, border-b
   - Left: "Admin Panel" heading
   - Right: Logout button (bg-red-500, text-white, px-4, py-2, rounded)
   - Logout handler: call `logout()` from useAuth, then `navigate('/admin/login')`
   - Main content: centered "Map editor coming in Phase 9" placeholder text
  </action>
  <verify>
    - `npx tsc --noEmit` passes
    - `npx biome check src/client/hooks/useAuth.ts src/client/components/ProtectedRoute.tsx src/client/pages/` passes
  </verify>
  <done>
    - useAuth hook fetches /api/auth/me, exposes authenticated/loading/logout
    - ProtectedRoute redirects to /admin/login when unauthenticated, shows loading state during check
    - LoginPage has email/password fields, disabled button + spinner during submit, generic error messages
    - AdminShell has visible logout button
    - StudentApp wraps FloorPlanCanvas for route element
  </done>
</task>

<task type="auto">
  <name>Task 2: Wire React Router into App.tsx with public and protected routes</name>
  <files>
    src/client/App.tsx
    src/client/main.tsx
  </files>
  <action>
1. Update `src/client/App.tsx`:
   - Import `BrowserRouter`, `Routes`, `Route` from `react-router-dom`
   - Import `StudentApp` from `./pages/StudentApp`
   - Import `LoginPage` from `./pages/admin/LoginPage`
   - Import `AdminShell` from `./pages/admin/AdminShell`
   - Import `ProtectedRoute` from `./components/ProtectedRoute`
   - Replace the current `<FloorPlanCanvas />` with:
     ```tsx
     <BrowserRouter>
       <Routes>
         {/* Public: student wayfinding */}
         <Route path="/" element={<StudentApp />} />

         {/* Public: admin login */}
         <Route path="/admin/login" element={<LoginPage />} />

         {/* Protected: admin panel */}
         <Route element={<ProtectedRoute />}>
           <Route path="/admin" element={<AdminShell />} />
         </Route>
       </Routes>
     </BrowserRouter>
     ```

2. `src/client/main.tsx` — NO changes needed. StrictMode wrapping is fine. BrowserRouter is inside App, not main.

3. Verify that the Vite dev server still works:
   - `/` renders FloorPlanCanvas (student app) — unchanged behavior
   - `/admin/login` renders the login form
   - `/admin` redirects to `/admin/login` when not authenticated

**CRITICAL:** Do NOT wrap BrowserRouter in StrictMode — StrictMode is already in main.tsx wrapping App. BrowserRouter goes inside App only.
  </action>
  <verify>
    - `npx tsc --noEmit` passes
    - `npx biome check src/client/App.tsx src/client/main.tsx` passes
    - `npm run dev` starts without errors
    - Opening `http://localhost:5173/` shows the student FloorPlanCanvas (unchanged)
    - Opening `http://localhost:5173/admin/login` shows the login form
    - Opening `http://localhost:5173/admin` redirects to `/admin/login`
  </verify>
  <done>
    - App.tsx uses BrowserRouter with three route zones: public student (/), public login (/admin/login), protected admin (/admin)
    - Student app at / is completely unchanged — no login prompt, no redirect
    - Admin routes are guarded by ProtectedRoute
    - Full login flow works: form submit → server validates → cookie set → redirect to /admin
    - Logout button clears session and redirects to login
  </done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` — zero type errors
2. `npx biome check .` — zero lint errors
3. Student app at `/` loads and works exactly as before (no login prompt)
4. `/admin/login` shows a clean login form
5. Valid credentials → redirect to `/admin` showing admin shell with logout button
6. Invalid credentials → "Invalid credentials" error on form
7. Rate-limited → "Too many login attempts" message
8. Button disabled + spinner during login request
9. `/admin` without session → redirect to `/admin/login`
10. Refresh on `/admin` with valid session → stays on admin page
11. Logout button → clears session → redirects to /admin/login
</verification>

<success_criteria>
- Full client-side auth flow operational: login form, protected routes, logout
- Student wayfinding at / completely unaffected
- Session persists across refresh (httpOnly cookie)
- No flash-of-redirect (loading state handled)
</success_criteria>

<output>
After completion, create `.planning/phases/08-admin-authentication/08-02-SUMMARY.md`
</output>
