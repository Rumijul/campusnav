---
phase: 08-admin-authentication
plan: 02
subsystem: auth-ui
tags: [react-router-dom, useAuth, protected-route, login-form, jwt-cookie, tailwind]

# Dependency graph
requires:
  - phase: 08-01
    provides: POST /api/auth/login, POST /api/auth/logout, GET /api/auth/me endpoints
provides:
  - BrowserRouter route tree: / (public student app), /admin/login (public login), /admin (protected)
  - useAuth hook: authenticated/loading/logout via GET /api/auth/me with httpOnly cookie
  - ProtectedRoute: redirects unauthenticated users to /admin/login, loading state during check
  - LoginPage: email+password form, disabled button+spinner during submit, per-status error messages
  - AdminShell: placeholder admin page with logout button (Phase 9 editor mounts here)
  - StudentApp: thin wrapper around FloorPlanCanvas for route element
affects:
  - 08-03+ (admin editor — AdminShell is the mount point in Phase 9)
  - All future admin UI pages (protected by ProtectedRoute automatically)

# Tech tracking
tech-stack:
  added:
    - react-router-dom@^7 (BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate)
  patterns:
    - httpOnly cookie session: useAuth fetches GET /api/auth/me with credentials:'include' on mount
    - ProtectedRoute via Outlet pattern: parent <Route element={<ProtectedRoute />}> wraps child routes
    - Navigate component (not useNavigate in render) for declarative redirects
    - Biome --write auto-fix for CRLF line endings (Windows environment)

key-files:
  created:
    - src/client/hooks/useAuth.ts
    - src/client/components/ProtectedRoute.tsx
    - src/client/pages/StudentApp.tsx
    - src/client/pages/admin/LoginPage.tsx
    - src/client/pages/admin/AdminShell.tsx
  modified:
    - src/client/App.tsx (replaced bare FloorPlanCanvas with BrowserRouter + Routes tree)
    - package.json + package-lock.json (added react-router-dom)

key-decisions:
  - "Navigate component (not useNavigate() in render body) for authenticated-user redirect on LoginPage — correct React Router v6 declarative pattern, avoids side effects during render"
  - "useAuth checks !loading && authenticated before rendering Navigate — prevents premature redirect while /api/auth/me is in-flight"
  - "react-router-dom installed at npm install time (not in 08-01) — first plan to actually use it client-side"
  - "BrowserRouter inside App.tsx, not main.tsx — keeps StrictMode wrapping in main unchanged"

requirements-completed: [ADMN-01]

# Metrics
duration: 3min
completed: 2026-02-21
---

# Phase 08 Plan 02: Admin Authentication — Client-Side Auth UI Summary

**React Router v6 route tree with useAuth hook, protected route guard, login form with spinner/error states, and admin shell with logout — full client-side auth flow wired to Plan 01 API**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-02-20T22:55:46Z
- **Completed:** 2026-02-20T22:58:30Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- `useAuth` hook fetches `/api/auth/me` on mount with `credentials:'include'`, exposes `authenticated/loading/logout` to all components
- `ProtectedRoute` blocks unauthenticated access to `/admin` routes; shows "Loading..." while auth check is in-flight, then redirects if not authenticated
- `LoginPage` has email + password fields, disabled Submit button + CSS spinner during request, per-status error messages (429 → "Too many login attempts", else → "Invalid credentials"), and declarative redirect when already authenticated
- `AdminShell` is a placeholder with logout button; calls `useAuth().logout()` then navigates to `/admin/login`
- `App.tsx` replaced bare `<FloorPlanCanvas />` with `BrowserRouter` + three-route tree — student app at `/` completely unchanged
- Build succeeds (145 modules, 589KB — Konva chunk is pre-existing, unrelated)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useAuth hook, ProtectedRoute, and page components** — `89cbeb3` (feat)
2. **Task 2: Wire React Router into App.tsx with public and protected routes** — `ea8c6c3` (feat)

## Files Created/Modified

- `src/client/hooks/useAuth.ts` — Auth state via GET /api/auth/me, logout via POST /api/auth/logout, returns `{ authenticated, loading, logout }`
- `src/client/components/ProtectedRoute.tsx` — Outlet-based guard; loading spinner, Navigate to /admin/login if unauthenticated
- `src/client/pages/StudentApp.tsx` — Thin wrapper around FloorPlanCanvas (enables route element usage)
- `src/client/pages/admin/LoginPage.tsx` — Login form: email, password, submitting state, error display, authenticated redirect
- `src/client/pages/admin/AdminShell.tsx` — Admin placeholder with logout button calling useAuth().logout()
- `src/client/App.tsx` — BrowserRouter with Routes: / (StudentApp), /admin/login (LoginPage), /admin (ProtectedRoute > AdminShell)
- `package.json` + `package-lock.json` — Added react-router-dom dependency

## Decisions Made

- **Navigate not useNavigate in render:** Calling `useNavigate()` imperatively in the render body (outside useEffect or event handler) can cause React warnings. Used `<Navigate to="/admin" replace />` component instead — correct React Router v6 declarative redirect pattern.
- **!loading && authenticated check:** LoginPage waits for the auth check to complete before redirecting — prevents a flash redirect to /admin while /api/auth/me is still loading.
- **BrowserRouter in App, not main:** StrictMode in main.tsx wraps App unchanged. BrowserRouter is a route concern that belongs in App.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Used Navigate component instead of useNavigate() in LoginPage render body**
- **Found during:** Task 1 implementation review
- **Issue:** Plan spec said "If user is already authenticated, redirect to /admin immediately" — initial implementation used `navigate('/admin', { replace: true })` called directly in the render function body (outside event handler / useEffect). This is an anti-pattern in React Router v6 and causes React warnings.
- **Fix:** Changed to `if (!loading && authenticated) { return <Navigate to="/admin" replace /> }` — the correct declarative approach. Also added `!loading` guard to prevent premature redirect.
- **Files modified:** `src/client/pages/admin/LoginPage.tsx`
- **Committed in:** `89cbeb3` (Task 1 commit)

**2. [Rule 2 - Missing Critical] Auto-fix CRLF line endings**
- **Found during:** Task 1 verification (Biome check)
- **Issue:** Windows environment writes CRLF line endings; Biome formatter expects LF. Same pattern as Plan 01.
- **Fix:** `npx biome check --write` on all created/modified files. No logic changes.
- **Files modified:** All new files (useAuth.ts, ProtectedRoute.tsx, StudentApp.tsx, LoginPage.tsx, AdminShell.tsx, App.tsx)
- **Committed in:** Part of task commits (formatting included)

**Out-of-scope pre-existing issues (deferred, not fixed):**
- Other src/client/ files (FloorPlanCanvas.tsx, LandmarkLayer.tsx, etc.) have pre-existing CRLF issues — not caused by this plan, not touched

---

**Total deviations:** 2 (1 auto-fixed React pattern bug, 1 CRLF formatting auto-fix)
**Impact on plan:** Navigate fix improves correctness and eliminates React warnings. CRLF fix is cosmetic/tooling.

## Next Phase Readiness

- Full client-side auth flow operational: login form, protected routes, logout
- Student wayfinding at `/` is completely unaffected — no login prompt, no redirect
- Session persists across refresh via httpOnly cookie (set by Plan 01 server)
- No flash-of-redirect: loading state handled before auth decision
- AdminShell ready as Phase 9 editor mount point
- No blockers

---
*Phase: 08-admin-authentication*
*Completed: 2026-02-21*
