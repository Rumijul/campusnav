# S09: Admin Authentication — completed 2026 02 21

**Goal:** unit tests prove Admin Authentication — completed 2026-02-21 works
**Demo:** unit tests prove Admin Authentication — completed 2026-02-21 works

## Must-Haves


## Tasks

- [x] **T01: Create the server-side authentication layer: login/logout/me endpoints, JWT cookie issuance, brute-force rate…**
  - Create the server-side authentication layer: login/logout/me endpoints, JWT cookie issuance, brute-force rate limiting, CSRF protection, and JWT middleware guarding all future admin routes.
- [x] **T02: Create the client-side authentication UI: React Router setup, login page, protected route…**
  - Create the client-side authentication UI: React Router setup, login page, protected route guard, useAuth hook, and admin shell with logout.
- [x] **T03: Human verification of the complete admin authentication flow: login, session persistence, protected…**
  - Human verification of the complete admin authentication flow: login, session persistence, protected routes, logout, and student access.

## Files Likely Touched

- `package.json`
- `src/server/auth/credentials.ts`
- `src/server/auth/loginLimiter.ts`
- `src/server/auth/routes.ts`
- `src/server/index.ts`
- `scripts/hash-password.ts`
- `.env.example`
- `.env`
- `src/client/App.tsx`
- `src/client/main.tsx`
- `src/client/hooks/useAuth.ts`
- `src/client/components/ProtectedRoute.tsx`
- `src/client/pages/admin/LoginPage.tsx`
- `src/client/pages/admin/AdminShell.tsx`
- `src/client/pages/StudentApp.tsx`
