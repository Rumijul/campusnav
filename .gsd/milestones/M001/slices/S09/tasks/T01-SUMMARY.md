---
phase: 08-admin-authentication
plan: 01
subsystem: auth
tags: [jwt, bcrypt, hono, rate-limiting, csrf, httponly-cookie, bcryptjs, hono-rate-limiter]

# Dependency graph
requires:
  - phase: 07-api-data-persistence
    provides: Hono server with SQLite-backed /api/map endpoint; server architecture established
provides:
  - Server-side admin auth API: POST /api/auth/login, POST /api/auth/logout, GET /api/auth/me
  - JWT issuance via httpOnly cookie (HS256, 7200s expiry)
  - Brute-force rate limiting on login (5 req/10-min window per IP)
  - CSRF middleware applied globally on Hono app
  - JWT guard protecting all /api/admin/* routes
  - scripts/hash-password.ts CLI utility for admin password setup
  - .env.example documenting required ADMIN_EMAIL, ADMIN_PASSWORD_HASH, JWT_SECRET
affects:
  - 08-02-PLAN (admin login UI — calls these endpoints)
  - Any future plan adding /api/admin/* routes (protected automatically by JWT guard)

# Tech tracking
tech-stack:
  added:
    - bcryptjs@3.0.3 (password hashing + timing-safe comparison)
    - hono-rate-limiter@0.5.3 (IP-based rate limiting for login endpoint)
    - "@types/bcryptjs (TypeScript types for bcryptjs)"
  patterns:
    - httpOnly JWT cookie pattern for session management (no localStorage)
    - Timing-attack-safe credential comparison (always run bcrypt.compare regardless of email match)
    - Placeholder hash for missing ADMIN_PASSWORD_HASH prevents timing oracle
    - Import-time env var validation — JWT_SECRET missing throws on startup
    - Graceful warnings for optional env vars (ADMIN_EMAIL, ADMIN_PASSWORD_HASH)

key-files:
  created:
    - src/server/auth/credentials.ts
    - src/server/auth/loginLimiter.ts
    - src/server/auth/routes.ts
    - scripts/hash-password.ts
    - .env.example
  modified:
    - src/server/index.ts (added csrf, authRoutes, JWT guard, admin ping)
    - package.json (added bcryptjs, hono-rate-limiter, @types/bcryptjs)

key-decisions:
  - "httpOnly cookie (not Authorization header) for JWT storage — XSS-safe, browser handles automatically"
  - "HS256 algorithm with 7200s (2h) expiry — matches plan spec; short enough for security"
  - "PLACEHOLDER_HASH constant in routes.ts — always run bcrypt.compare() even on email mismatch to prevent timing attacks"
  - "Import-time throw for missing JWT_SECRET — server cannot function securely without it"
  - "CSRF applied globally (before auth routes) — consistent protection across all state-changing endpoints"
  - "Rate limiter uses x-forwarded-for first, x-real-ip fallback, 'unknown' default — handles reverse proxy deployments"
  - "User setup required: admin must run hash-password.ts and populate .env manually (env vars, not DB-stored credentials)"

patterns-established:
  - "Auth route module pattern: separate Hono() instance in src/server/auth/routes.ts, mounted via app.route()"
  - "Credential validation: always compare both email AND hash before returning success/failure"
  - "Admin guard pattern: app.use('/api/admin/*', jwt(...)) guards all future admin endpoints automatically"

requirements-completed: [ADMN-01]

# Metrics
duration: 5min
completed: 2026-02-21
---

# Phase 08 Plan 01: Admin Authentication — Server-Side Auth Layer Summary

**bcrypt login + HS256 JWT httpOnly cookie auth with IP-based rate limiting, CSRF protection, and /api/admin/* JWT guard via hono-rate-limiter and bcryptjs**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-02-20T22:47:06Z
- **Completed:** 2026-02-20T22:51:52Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Login endpoint issues JWT in httpOnly cookie with bcrypt verification, timing-attack-safe placeholder hash when credentials not set
- Rate limiter (5/10min per IP) active on login; CSRF middleware applied globally
- JWT guard on `/api/admin/*` protects all future admin routes automatically without per-route configuration
- hash-password.ts CLI utility enables secure admin credential setup outside the codebase
- All existing student-facing routes (health, floor-plan, map) remain public and unchanged

## Task Commits

Each task was committed atomically:

1. **Task 1: Install auth dependencies and create credential + rate limiter modules** - `945d203` (feat)
2. **Task 2: Create auth routes and wire into Hono server with JWT guard + CSRF** - `a308693` (feat)

**Plan metadata:** (docs commit — created below)

## Files Created/Modified

- `src/server/auth/credentials.ts` - Loads ADMIN_EMAIL, ADMIN_PASSWORD_HASH, JWT_SECRET; throws on missing JWT_SECRET; warns on missing admin credentials
- `src/server/auth/loginLimiter.ts` - hono-rate-limiter instance: 5 req/10-min per IP, x-forwarded-for aware
- `src/server/auth/routes.ts` - Hono router: POST /login (rate-limited, bcrypt), POST /logout, GET /me (jwt-protected)
- `scripts/hash-password.ts` - CLI: `npx tsx scripts/hash-password.ts <password>` outputs ADMIN_PASSWORD_HASH= line
- `.env.example` - Documents required ADMIN_EMAIL, ADMIN_PASSWORD_HASH, JWT_SECRET
- `src/server/index.ts` - Added: csrf() global, authRoutes mount, JWT guard on /api/admin/*, /api/admin/ping test endpoint
- `package.json` + `package-lock.json` - Added bcryptjs, hono-rate-limiter, @types/bcryptjs

## Decisions Made

- **httpOnly cookie for JWT:** XSS-safe, browser handles cookie sending automatically; no localStorage exposure
- **PLACEHOLDER_HASH:** When ADMIN_PASSWORD_HASH is not set, compare against a static bcrypt hash to prevent timing oracle — email mismatch alone doesn't short-circuit
- **Import-time validation:** JWT_SECRET missing throws immediately on server startup (fail-fast), ADMIN_EMAIL/HASH log warnings only (graceful degradation)
- **CSRF global middleware:** Applied before all routes so login/logout/admin mutations are all protected
- **HS256 / 7200s expiry:** Per plan specification — simple shared secret sufficient for single-admin use case

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript error in loginLimiter.ts keyGenerator**
- **Found during:** Task 1 verification (`npx tsc --noEmit`)
- **Issue:** `c.req.header('x-forwarded-for')?.split(',')[0].trim()` produced TS2532 "Object is possibly 'undefined'" because `split()[0]` can be undefined in strict mode
- **Fix:** Rewrote keyGenerator with explicit guard: check forwarded header exists, check split result exists, then return trimmed value; otherwise fall through to x-real-ip
- **Files modified:** src/server/auth/loginLimiter.ts
- **Verification:** `npx tsc --noEmit` passes with zero errors
- **Committed in:** `945d203` (Task 1 commit)

**2. [Rule 3 - Blocking] Skipped react-router-dom installation**
- **Found during:** Task 1 planning
- **Issue:** Plan listed `react-router-dom` as a dependency to install, but none of the files created in this plan (credentials.ts, loginLimiter.ts, routes.ts, hash-password.ts) import or use it. Installing an unused package would add unnecessary weight with no benefit.
- **Fix:** Omitted react-router-dom from npm install. The dependency is already available in package.json if needed by client-side code in a later plan.
- **Verification:** All Task 1 and Task 2 files compile and function without it
- **Committed in:** N/A (omission, not a file change)

---

**Total deviations:** 2 (1 auto-fixed bug, 1 planned dependency omitted)
**Impact on plan:** TypeScript fix necessary for correctness. Dependency omission reduces bundle bloat with no functional impact — react-router-dom is unused in server-side auth.

## Issues Encountered

- Biome formatter detected CRLF line endings in newly created files (Windows environment). Auto-fixed with `biome check --write` — no manual intervention needed.

## User Setup Required

**Environment variables require manual configuration before server start:**

1. Run `npx tsx scripts/hash-password.ts 'your-password'` to generate the hash
2. Set in `.env`:
   - `ADMIN_EMAIL` — the admin login email (e.g., `admin@example.com`)
   - `ADMIN_PASSWORD_HASH` — output from step 1 (the `$2b$12$...` value)
   - `JWT_SECRET` — already auto-generated in `.env` during this plan; keep it secret

The `.env` file was created with a generated JWT_SECRET. ADMIN_EMAIL and ADMIN_PASSWORD_HASH must be filled in manually.

## Next Phase Readiness

- Auth API fully functional: login, logout, me, admin protection
- Ready for Plan 02 (admin login UI) to call POST /api/auth/login and GET /api/auth/me
- /api/admin/* guard is live — any new admin API routes added in Plans 03+ are automatically protected
- No blockers

---
*Phase: 08-admin-authentication*
*Completed: 2026-02-21*
