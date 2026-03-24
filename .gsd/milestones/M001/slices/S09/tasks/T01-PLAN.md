---
phase: 08-admin-authentication
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - package.json
  - src/server/auth/credentials.ts
  - src/server/auth/loginLimiter.ts
  - src/server/auth/routes.ts
  - src/server/index.ts
  - scripts/hash-password.ts
  - .env.example
  - .env
autonomous: true
requirements:
  - ADMN-01
user_setup:
  - service: env-vars
    why: "Admin credentials and JWT secret must be set in .env"
    env_vars:
      - name: ADMIN_EMAIL
        source: "Admin chooses their login email"
      - name: ADMIN_PASSWORD_HASH
        source: "Run: npx tsx scripts/hash-password.ts 'your-password' — paste the output"
      - name: JWT_SECRET
        source: "Any random string (32+ chars). E.g. run: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""

must_haves:
  truths:
    - "POST /api/auth/login with valid credentials returns 200 and sets httpOnly admin_token cookie"
    - "POST /api/auth/login with invalid credentials returns 401 with generic error"
    - "GET /api/auth/me with valid cookie returns 200 { authenticated: true }"
    - "GET /api/auth/me without cookie returns 401"
    - "POST /api/auth/logout clears the admin_token cookie"
    - "POST /api/auth/login is rate-limited (429 after 5 rapid attempts)"
    - "GET /api/map remains accessible without any cookie (student routes unchanged)"
    - "/api/admin/* routes return 401 when no valid JWT cookie is present"
  artifacts:
    - path: "src/server/auth/credentials.ts"
      provides: "Env var loading and validation for ADMIN_EMAIL, ADMIN_PASSWORD_HASH, JWT_SECRET"
    - path: "src/server/auth/loginLimiter.ts"
      provides: "hono-rate-limiter instance for login endpoint"
    - path: "src/server/auth/routes.ts"
      provides: "Auth route handlers: login, logout, me"
      exports: ["authRoutes"]
    - path: "src/server/index.ts"
      provides: "Mounts auth routes, CSRF middleware, JWT guard on /api/admin/*"
    - path: "scripts/hash-password.ts"
      provides: "CLI utility to bcrypt-hash a password for .env"
  key_links:
    - from: "src/server/auth/routes.ts"
      to: "src/server/auth/credentials.ts"
      via: "imports ADMIN_EMAIL, ADMIN_PASSWORD_HASH, JWT_SECRET"
      pattern: "import.*credentials"
    - from: "src/server/index.ts"
      to: "src/server/auth/routes.ts"
      via: "app.route mounts auth routes"
      pattern: "app\\.route.*auth"
    - from: "src/server/index.ts"
      to: "hono/jwt middleware"
      via: "jwt() guard on /api/admin/*"
      pattern: "jwt\\(.*cookie.*admin_token"
---

<objective>
Create the server-side authentication layer: login/logout/me endpoints, JWT cookie issuance, brute-force rate limiting, CSRF protection, and JWT middleware guarding all future admin routes.

Purpose: Establish the auth API that the client-side login page (Plan 02) will call. Student-facing routes remain untouched and public.
Output: Auth route handlers, credential validation, rate limiter, hash-password script, .env.example with required vars.
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
@src/server/index.ts
@package.json
</context>

<tasks>

<task type="auto">
  <name>Task 1: Install auth dependencies and create credential + rate limiter modules</name>
  <files>
    package.json
    src/server/auth/credentials.ts
    src/server/auth/loginLimiter.ts
    scripts/hash-password.ts
    .env.example
    .env
  </files>
  <action>
1. Install dependencies:
   ```
   npm install bcryptjs react-router-dom hono-rate-limiter
   npm install -D @types/bcryptjs
   ```

2. Create `src/server/auth/credentials.ts`:
   - Read `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `JWT_SECRET` from `process.env`
   - Export all three as named constants
   - Validate at import time: if `JWT_SECRET` is missing/empty, throw `Error('JWT_SECRET env var is required')`
   - If `ADMIN_EMAIL` or `ADMIN_PASSWORD_HASH` are missing, log a warning but don't crash (allows server to start; login will fail gracefully)

3. Create `src/server/auth/loginLimiter.ts`:
   - Import `rateLimiter` from `hono-rate-limiter`
   - Export a `loginLimiter` middleware instance configured:
     - `windowMs: 10 * 60 * 1000` (10 minutes)
     - `limit: 5` (5 attempts per window)
     - `standardHeaders: 'draft-6'`
     - `keyGenerator: (c) => c.req.header('x-forwarded-for')?.split(',')[0].trim() ?? c.req.header('x-real-ip') ?? 'unknown'`

4. Create `scripts/hash-password.ts`:
   - Import `bcrypt` from `bcryptjs`
   - Read password from `process.argv[2]`
   - If no arg provided, print usage and exit
   - Hash with cost factor 12: `await bcrypt.hash(password, 12)`
   - Print `ADMIN_PASSWORD_HASH=<hash>` to stdout

5. Create `.env.example` with:
   ```
   ADMIN_EMAIL=admin@example.com
   ADMIN_PASSWORD_HASH=
   JWT_SECRET=
   ```

6. Create `.env` with the same template vars but populate JWT_SECRET with a generated random hex string (32 bytes). Leave ADMIN_EMAIL and ADMIN_PASSWORD_HASH with placeholder values. Add `.env` to `.gitignore` if not already there.
  </action>
  <verify>
    - `npm ls bcryptjs react-router-dom hono-rate-limiter` shows all installed
    - `npx tsc --noEmit` passes (no type errors in new files)
    - `npx tsx scripts/hash-password.ts testpass123` prints a bcrypt hash starting with `$2b$12$`
  </verify>
  <done>
    - bcryptjs, react-router-dom, hono-rate-limiter installed in package.json
    - credentials.ts exports ADMIN_EMAIL, ADMIN_PASSWORD_HASH, JWT_SECRET with startup validation
    - loginLimiter.ts exports configured rate limiter middleware
    - hash-password.ts script works end-to-end
    - .env.example documents required env vars
    - .env exists with JWT_SECRET populated
  </done>
</task>

<task type="auto">
  <name>Task 2: Create auth routes and wire into Hono server with JWT guard + CSRF</name>
  <files>
    src/server/auth/routes.ts
    src/server/index.ts
  </files>
  <action>
1. Create `src/server/auth/routes.ts`:
   - Import `Hono` from `hono`, `sign` from `hono/jwt`, `setCookie`/`deleteCookie` from `hono/cookie`, `jwt` from `hono/jwt`, `bcrypt` from `bcryptjs`
   - Import `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `JWT_SECRET` from `./credentials`
   - Import `loginLimiter` from `./loginLimiter`
   - Export `authRoutes` as a new `Hono()` instance

   **POST /login** (with loginLimiter middleware):
   - Parse JSON body `{ email, password }` — default both to empty string if missing
   - Compare `email === ADMIN_EMAIL` → `emailMatch` boolean
   - ALWAYS run `bcrypt.compare(password, ADMIN_PASSWORD_HASH || '$2b$12$invalid.hash.placeholder.value')` to prevent timing attacks
   - If `!emailMatch || !passMatch`: return `{ error: 'Invalid credentials' }` with status 401
   - If match: sign JWT with `{ sub: ADMIN_EMAIL, role: 'admin', exp: Math.floor(Date.now()/1000) + 7200 }` using JWT_SECRET, algorithm 'HS256'
   - `setCookie(c, 'admin_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'Lax', path: '/', maxAge: 7200 })`
   - Return `{ ok: true }` with status 200

   **POST /logout**:
   - `deleteCookie(c, 'admin_token', { path: '/' })`
   - Return `{ ok: true }`

   **GET /me** (with jwt middleware `{ secret: JWT_SECRET, alg: 'HS256', cookie: 'admin_token' }`):
   - Return `{ authenticated: true }`

2. Update `src/server/index.ts`:
   - Add `import { csrf } from 'hono/csrf'`
   - Add `import { jwt } from 'hono/jwt'`
   - Add `import { authRoutes } from './auth/routes'`
   - Add `import { JWT_SECRET } from './auth/credentials'`
   - Apply CSRF middleware globally: `app.use(csrf())` — BEFORE route definitions
   - Mount auth routes: `app.route('/api/auth', authRoutes)` — BEFORE the jwt guard
   - Add JWT guard for all future admin API routes: `app.use('/api/admin/*', jwt({ secret: JWT_SECRET, alg: 'HS256', cookie: 'admin_token' }))`
   - Add a placeholder admin endpoint for testing: `app.get('/api/admin/ping', (c) => c.json({ ok: true, message: 'Admin access granted' }))`
   - Keep ALL existing routes (health, floor-plan, map) unchanged and ABOVE the admin guard — they must remain public

   **IMPORTANT ordering in index.ts:**
   1. Migrations + seed (existing)
   2. `app.use(csrf())` — global CSRF
   3. Existing public routes (health, floor-plan, map) — NO changes
   4. `app.route('/api/auth', authRoutes)` — auth endpoints
   5. `app.use('/api/admin/*', jwt(...))` — admin guard
   6. `app.get('/api/admin/ping', ...)` — test endpoint
   7. `serve(...)` — existing
  </action>
  <verify>
    - `npx tsc --noEmit` passes
    - `npx biome check src/server/auth/ src/server/index.ts` passes (fix any lint issues)
    - Start server with populated .env: `ADMIN_EMAIL=admin@test.com ADMIN_PASSWORD_HASH=$(npx tsx scripts/hash-password.ts testpass) JWT_SECRET=testsecret npx tsx src/server/index.ts`
    - `curl -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -H "Origin: http://localhost:3001" -d '{"email":"admin@test.com","password":"testpass"}'` → 200 with Set-Cookie header containing admin_token
    - `curl http://localhost:3001/api/map` → 200 (public route still works)
    - `curl http://localhost:3001/api/admin/ping` → 401 (no cookie)
  </verify>
  <done>
    - Auth routes mounted at /api/auth/login, /api/auth/logout, /api/auth/me
    - Login validates credentials via bcrypt, issues JWT in httpOnly cookie
    - Logout clears the cookie server-side
    - /me returns auth status
    - CSRF middleware applied globally
    - JWT guard protects /api/admin/* routes
    - All existing student-facing routes remain public and unchanged
    - Rate limiter active on login endpoint
  </done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` — zero type errors
2. `npx biome check .` — zero lint errors in auth files
3. Login endpoint returns 200 + httpOnly cookie for valid credentials
4. Login endpoint returns 401 + "Invalid credentials" for wrong email or wrong password (same message for both)
5. /api/auth/me returns 200 with valid cookie, 401 without
6. /api/auth/logout clears the cookie
7. /api/map, /api/health, /api/floor-plan/* remain accessible without any cookie
8. /api/admin/ping returns 401 without valid cookie, 200 with valid cookie
9. Rate limiter returns 429 after 5 rapid failed login attempts
</verification>

<success_criteria>
- Server-side auth layer fully functional: login, logout, session check, admin route protection
- Student-facing API unchanged and public
- No new dependencies beyond bcryptjs, hono-rate-limiter, react-router-dom, @types/bcryptjs
- hash-password.ts script operational for admin setup
</success_criteria>

<output>
After completion, create `.planning/phases/08-admin-authentication/08-01-SUMMARY.md`
</output>
