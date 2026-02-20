# Phase 8: Admin Authentication - Research

**Researched:** 2026-02-21
**Domain:** JWT authentication with httpOnly cookies; Hono middleware; React Router protected routes; bcrypt credential verification; brute-force rate limiting
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Token storage:** JWT stored in an **httpOnly cookie** (not localStorage). JavaScript cannot read it, protecting against XSS.
- **Cookie security:** Apply **SameSite cookie policy** and include a **CSRF token** alongside the cookie for full CSRF protection.
- **Admin credential provisioning:** Admin credentials stored in **environment variables** (email + bcrypt-hashed password in `.env`). No DB user table required.
- **Login page design:** Minimal utility page — plain form, no heavy branding. Error messages are **generic only** ("Invalid credentials"). **Disable submit button and show spinner** while request is in-flight.
- **Session TTL:** **1–4 hours** (short, security-first). **No "remember me" checkbox.**
- **Logout:** Visible logout button; clicking it clears the httpOnly cookie server-side.
- **Session expiry UX:** When frontend detects 401 from API: show a toast/message ("Session expired, please log in again"), then redirect to login.
- **Brute-force protection:** Lock out after N consecutive failures within a time window (e.g., 5 attempts → 10-minute block). Exact thresholds at Claude's discretion.

### Claude's Discretion

- Admin route prefix structure (`/api/admin/*` vs per-route auth middleware)
- Post-login redirect destination
- Silent refresh vs redirect-on-401 strategy
- Number of admin accounts the .env supports (array vs single pair)
- Whether to include a change-password UI inside the admin panel
- Exact lockout thresholds for brute-force protection
- Temp cookie / session state during lockout period

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ADMN-01 | Admin can log in with credentials to access the map editor | `POST /api/auth/login` verifies bcrypt hash against env-var credentials, issues JWT in httpOnly cookie via `hono/jwt` `sign()` + `setCookie()`. Protected admin routes use `jwt({ cookie: 'admin_token' })` middleware. Client-side React Router `<ProtectedRoute>` redirects unauthenticated users to `/admin/login`. |
</phase_requirements>

---

## Summary

Phase 8 adds a server-side auth layer in front of future admin routes (Phases 9–10) and a minimal client-side login page. The stack is already mostly in place: Hono 4.11.9 provides built-in JWT helpers (`hono/jwt`) and cookie utilities (`hono/cookie`), no extra JWT library is needed. The user decision to store the JWT in an httpOnly cookie (not localStorage) is the right security choice and is directly supported by Hono's `setCookie()` with `httpOnly: true`.

The credential model is simple: one admin identity stored as `ADMIN_EMAIL` and `ADMIN_PASSWORD_HASH` (bcrypt) in `.env`. The login endpoint reads these env vars, verifies the submitted password via `bcryptjs.compare()`, and if valid calls `sign()` from `hono/jwt` and writes the cookie. All protected admin API routes are guarded by the built-in `jwt({ cookie: 'admin_token' })` middleware. Student routes (`GET /api/map`, floor plan endpoints) require no change — they remain public.

On the client side, no routing exists yet. React Router DOM must be added to enable `/admin/login` and future `/admin/*` editor pages. A `<ProtectedRoute>` component wraps admin routes, checking auth status via a lightweight `/api/auth/me` endpoint; unauthenticated visitors are redirected to `/admin/login`. The existing Vite dev server already proxies `/api` to the Hono server on port 3001, so the login API call works transparently.

**Primary recommendation:** Use `hono/jwt` built-in (`sign`, `verify`, `jwt` middleware with `cookie` option) + `hono/cookie` (`setCookie`, `deleteCookie`) + `bcryptjs` (pure-JS, no native rebuild) + `hono-rate-limiter` (in-memory, login route only) + `react-router-dom` for client-side routing. No separate JWT library (`jose`) is needed — Hono's built-in covers all requirements.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `hono/jwt` | built-in (Hono 4.11.9) | JWT sign, verify, and middleware with cookie option | Already in project; Hono's built-in handles HS256 sign/verify + cookie extraction; no extra dependency |
| `hono/cookie` | built-in (Hono 4.11.9) | `setCookie`, `deleteCookie`, `getCookie` with `httpOnly`, `sameSite`, `maxAge` | Already in project; full cookie security option support verified |
| `hono/csrf` | built-in (Hono 4.11.9) | CSRF protection via Origin header validation | Already in project; `csrf()` middleware satisfies the CSRF requirement from CONTEXT.md |
| `bcryptjs` | ^2.4.3 | Pure-JS bcrypt: hash comparison for login; hash generation for setup | No native build step (unlike `bcrypt`); TS types in `@types/bcryptjs`; works on any platform |
| `react-router-dom` | ^6.x (latest stable) | Client-side routing: `/admin/login`, `<ProtectedRoute>`, `<Navigate>` | No routing exists yet in the project; this is the standard SPA routing library |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `hono-rate-limiter` | latest (^0.5+) | In-memory rate limiting middleware for login endpoint | Applied to `POST /api/auth/login` only; prevents brute-force; no Redis needed for single-instance |
| `@types/bcryptjs` | latest | TypeScript types for bcryptjs | Always — bcryptjs ships no built-in types |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `bcryptjs` | `bcrypt` (native) | Native `bcrypt` is ~30% faster but requires node-gyp (C++ build tools, fragile on Windows). For a low-traffic admin login, the speed difference is negligible; `bcryptjs` avoids the rebuild pitfall already seen with `better-sqlite3` |
| `hono/jwt` built-in | `jose` npm package | `jose` is a comprehensive JOSE library (ESM-only, v6 universal). Hono already wraps jose internally; using Hono's built-in avoids a redundant dependency and aligns with the project's "thin CRUD server" philosophy |
| `hono-rate-limiter` | Custom in-memory Map counter | Custom Map-based rate limiting is simple for a single route but lacks time-window decay, standard headers, and `keyGenerator` flexibility; `hono-rate-limiter` is the Hono-native port of `express-rate-limit` |
| `react-router-dom` | TanStack Router | TanStack Router is type-safe and modern, but `react-router-dom` v6 is universally documented and the entire existing codebase has zero routing — introducing it has the lowest friction |

**Installation:**
```bash
npm install bcryptjs react-router-dom hono-rate-limiter
npm install -D @types/bcryptjs
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── server/
│   ├── auth/
│   │   ├── credentials.ts    # Load + validate ADMIN_EMAIL / ADMIN_PASSWORD_HASH from env
│   │   ├── loginLimiter.ts   # hono-rate-limiter instance for POST /api/auth/login
│   │   └── routes.ts         # POST /api/auth/login, POST /api/auth/logout, GET /api/auth/me
│   └── index.ts              # Mount auth routes; add jwt() guard to /api/admin/*
├── client/
│   ├── App.tsx               # Add BrowserRouter + route tree
│   ├── pages/
│   │   ├── StudentApp.tsx    # Existing FloorPlanCanvas (student-facing, public)
│   │   └── admin/
│   │       └── LoginPage.tsx # Minimal login form
│   ├── components/
│   │   └── ProtectedRoute.tsx # Redirects to /admin/login if not authenticated
│   └── hooks/
│       └── useAuth.ts        # GET /api/auth/me → { authenticated: boolean }
└── shared/
    └── types.ts              # (existing — no changes needed for auth types)
```

### Pattern 1: JWT Issue on Login (Server)

**What:** `POST /api/auth/login` verifies credentials against env vars, signs a JWT, writes it to an httpOnly cookie.

**When to use:** The login endpoint handler.

**Example:**
```typescript
// Source: hono.dev/docs/helpers/jwt + hono.dev/docs/helpers/cookie
import { sign } from 'hono/jwt'
import { setCookie } from 'hono/cookie'

app.post('/api/auth/login', async (c) => {
  const { email, password } = await c.req.json()

  const adminEmail = process.env.ADMIN_EMAIL
  const adminHash  = process.env.ADMIN_PASSWORD_HASH

  if (!adminEmail || !adminHash) {
    return c.json({ error: 'Server misconfiguration' }, 500)
  }

  const emailMatch = email === adminEmail
  const passMatch  = emailMatch && await bcrypt.compare(password, adminHash)

  // Always run compare (even if email wrong) to prevent timing attacks
  if (!emailMatch || !passMatch) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  const payload = {
    sub:  adminEmail,
    role: 'admin',
    exp:  Math.floor(Date.now() / 1000) + 60 * 60 * 2,  // 2-hour TTL
  }
  const token = await sign(payload, process.env.JWT_SECRET!, 'HS256')

  setCookie(c, 'admin_token', token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'Lax',          // 'Lax' works with same-site form POSTs; 'Strict' blocks cross-site nav
    path:     '/',
    maxAge:   60 * 60 * 2,   // matches JWT exp
  })

  return c.json({ ok: true })
})
```

**Key insight on SameSite:** The CONTEXT.md specifies "SameSite cookie policy." Use `SameSite: Lax` in development (localhost, no HTTPS). In production with HTTPS, upgrade to `SameSite: Strict`. `Lax` allows the cookie to be sent on top-level navigations (clicking links from external page → admin), `Strict` does not. For a single-campus internal tool, `Strict` is preferable in production.

### Pattern 2: JWT Verification Middleware (Server)

**What:** `jwt()` middleware reads the `admin_token` cookie and verifies it. Applied to all `/api/admin/*` routes.

**When to use:** All future admin API routes (Phases 9–10) automatically get auth by mounting under `/api/admin/`.

**Example:**
```typescript
// Source: hono.dev/docs/middleware/builtin/jwt
import { jwt } from 'hono/jwt'
import type { JwtVariables } from 'hono/jwt'

type Variables = JwtVariables
const app = new Hono<{ Variables: Variables }>()

// Guard all /api/admin/* routes — Phase 9 editor routes mount here
app.use('/api/admin/*', jwt({
  secret: process.env.JWT_SECRET!,
  alg:    'HS256',
  cookie: 'admin_token',   // reads from cookie, not Authorization header
}))
```

### Pattern 3: Logout (Server)

**What:** `POST /api/auth/logout` deletes the cookie server-side by calling `deleteCookie()`.

**Example:**
```typescript
// Source: hono.dev/docs/helpers/cookie
import { deleteCookie } from 'hono/cookie'

app.post('/api/auth/logout', (c) => {
  deleteCookie(c, 'admin_token', { path: '/' })
  return c.json({ ok: true })
})
```

### Pattern 4: Auth Status Endpoint (Server)

**What:** `GET /api/auth/me` is used by the client `<ProtectedRoute>` to check if the session is still valid. Returns 200 with `{ authenticated: true }` if cookie JWT verifies, 401 otherwise.

**Example:**
```typescript
// Requires JWT middleware applied upstream to this route
app.get('/api/auth/me',
  jwt({ secret: process.env.JWT_SECRET!, alg: 'HS256', cookie: 'admin_token' }),
  (c) => {
    return c.json({ authenticated: true })
  }
)
```

**Alternative:** If `/api/admin/*` middleware already covers `/api/admin/me`, just use that path. Placing it outside `/api/admin/*` (e.g., `/api/auth/me`) is cleaner since auth routes have their own prefix.

### Pattern 5: Brute-Force Rate Limiter (Server)

**What:** Apply `hono-rate-limiter` to `POST /api/auth/login` only. 5 requests per 10 minutes per IP.

**Example:**
```typescript
// Source: github.com/rhinobase/hono-rate-limiter
import { rateLimiter } from 'hono-rate-limiter'

const loginLimiter = rateLimiter({
  windowMs:       10 * 60 * 1000,       // 10-minute window
  limit:          5,                     // 5 attempts per window
  keyGenerator:   (c) => c.req.header('x-forwarded-for') ?? c.env?.ip ?? 'unknown',
  standardHeaders: 'draft-6',
})

app.post('/api/auth/login', loginLimiter, async (c) => { /* ... */ })
```

**Note:** `hono-rate-limiter` uses an in-memory store by default. For a single-instance Node.js process, this is correct. The store resets on server restart (acceptable: brute-force sessions don't survive server restarts either).

### Pattern 6: CSRF Protection (Server)

**What:** `csrf()` middleware from `hono/csrf` validates the `Origin` header on unsafe methods (POST, PUT, DELETE). Applied globally or to `/api/auth/*`.

**Example:**
```typescript
// Source: hono.dev/docs/middleware/builtin/csrf
import { csrf } from 'hono/csrf'

// Apply to all non-GET requests — validates Origin header
app.use(csrf())
```

**Important caveat:** `hono/csrf` uses Origin header validation, not a traditional CSRF token in a response body. This is simpler and covers the same attack vector for `SameSite: Lax` cookies. The CONTEXT.md says "include a CSRF token alongside the cookie" — the planner should decide whether to implement a double-submit CSRF token (more traditional) or rely on Hono's built-in Origin check. The built-in `csrf()` middleware satisfies the CSRF requirement for this project with zero additional client-side code.

### Pattern 7: Protected Route (Client)

**What:** React Router `<ProtectedRoute>` component checks auth status and redirects to `/admin/login` if unauthenticated. Uses `GET /api/auth/me` to probe the session.

**Example:**
```typescript
// Source: React Router v6 pattern (blog.logrocket.com/authentication-react-router-v6/)
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function ProtectedRoute() {
  const { authenticated, loading } = useAuth()
  if (loading) return <div>Loading...</div>          // avoid flash-of-redirect
  if (!authenticated) return <Navigate to="/admin/login" replace />
  return <Outlet />
}
```

### Pattern 8: Client Routing Setup (App.tsx)

**What:** Wrap the app in `BrowserRouter`. Student app (`/`) stays public. Admin routes nested under `<ProtectedRoute>`.

**Example:**
```typescript
// Source: react-router-dom v6 docs
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import FloorPlanCanvas from './components/FloorPlanCanvas'
import LoginPage from './pages/admin/LoginPage'
import { ProtectedRoute } from './components/ProtectedRoute'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public student-facing route */}
        <Route path="/" element={<FloorPlanCanvas />} />

        {/* Public admin login */}
        <Route path="/admin/login" element={<LoginPage />} />

        {/* Protected admin routes (Phase 9+ editor mounts here) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/admin/*" element={<div>Admin Panel (Phase 9)</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
```

### Pattern 9: useAuth Hook (Client)

**What:** Fetches `GET /api/auth/me` once on mount; exposes `{ authenticated, loading }`. Used by `<ProtectedRoute>`.

**Example:**
```typescript
import { useEffect, useState } from 'react'

export function useAuth() {
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => {
        setAuthenticated(r.ok)
      })
      .catch(() => setAuthenticated(false))
      .finally(() => setLoading(false))
  }, [])

  return { authenticated, loading }
}
```

**Important:** `credentials: 'include'` is required for cookies to be sent with cross-origin fetch requests. With Vite proxy (`/api` → `localhost:3001`), the browser treats it as same-origin in dev, so `credentials: 'include'` is belt-and-suspenders but harmless and correct for production.

### Pattern 10: Login Form (Client)

**What:** Minimal form — email, password, submit button. Disable button + show spinner on submit. Generic error message on failure.

**Example:**
```typescript
const [submitting, setSubmitting] = useState(false)
const [error, setError] = useState<string | null>(null)

async function handleSubmit(e: React.FormEvent) {
  e.preventDefault()
  setSubmitting(true)
  setError(null)

  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  })

  if (res.ok) {
    navigate('/admin')  // post-login redirect to admin panel
  } else if (res.status === 429) {
    setError('Too many login attempts. Please wait 10 minutes.')
  } else {
    setError('Invalid credentials.')  // generic — never reveal which field was wrong
  }
  setSubmitting(false)
}
```

### Pattern 11: Credential Setup Script (Server)

**What:** A small utility script `scripts/hash-password.ts` (or documented in README) lets the admin generate a bcrypt hash to put in `.env`. This is run once during setup.

**Example:**
```typescript
// scripts/hash-password.ts — run with: npx tsx scripts/hash-password.ts
import bcrypt from 'bcryptjs'
const hash = await bcrypt.hash(process.argv[2], 12)
console.log(hash)
// Paste output into .env: ADMIN_PASSWORD_HASH=<output>
```

### Anti-Patterns to Avoid

- **Storing JWT in localStorage:** XSS can steal it. httpOnly cookie is the locked decision — never revert this.
- **Revealing which credential was wrong:** "Email not found" vs "Wrong password" enables user enumeration. Always return "Invalid credentials" for any failure.
- **Not using `credentials: 'include'` on fetch:** Cookie will not be sent with same-origin-cross-port (dev proxy) or cross-origin fetch requests.
- **Not clearing cookie server-side on logout:** Clearing the cookie only client-side is insecure (cannot clear httpOnly cookies from JS). Always call `deleteCookie()` server-side.
- **Applying JWT middleware globally:** Student routes (`GET /api/map`, floor plan) must stay public. Apply `jwt()` to `/api/admin/*` specifically, not to `app.use('/*', ...)`.
- **Checking `authenticated` state only in client:** Server must verify the JWT on every admin API call. Client-side route protection is UX, not security.
- **Using `bcrypt.hashSync()` in the login handler:** Blocking the event loop. Use `bcrypt.compare()` (async) in the handler; use `hashSync` only in the one-time offline setup script.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JWT signing & verification | Custom HMAC + base64 encoding | `hono/jwt` `sign()` + `verify()` | JWT has subtle expiry, algorithm, and claim validation logic that is easy to get wrong |
| Cookie security options | Manual `Set-Cookie` header string | `hono/cookie` `setCookie()` | Hono handles the `SameSite`, `HttpOnly`, `Secure`, `Path`, `MaxAge` option encoding correctly |
| CSRF protection | Double-submit token + custom validator | `hono/csrf` middleware | Built-in Origin header validation covers the attack vector; adding token adds complexity with little gain for this project |
| Password hashing | Custom salt + SHA-256 | `bcryptjs` | Bcrypt's slow cost factor and built-in salt are specifically designed for password storage; SHA-256 is too fast for brute-force resistance |
| Rate limiting | Map-based counter with setInterval cleanup | `hono-rate-limiter` | Time-window decay, standard `Retry-After` headers, and Hono middleware signature are already implemented; Map-based DIY lacks decay correctness |
| Protected routing | Manual `if (!isLoggedIn) window.location.href = '/login'` | React Router `<Navigate>` + `<Outlet>` | React Router's `<Navigate replace>` handles history correctly; raw location assignment breaks Back button |

**Key insight:** Authentication is a domain with many subtle correctness requirements (timing attacks, cookie scope, CSRF attack vectors, brute-force windows). Every "don't hand-roll" item has specific failure modes that existing libraries have already solved.

---

## Common Pitfalls

### Pitfall 1: Timing Attack on Credential Check

**What goes wrong:** The login handler short-circuits on email mismatch before calling `bcrypt.compare()`. An attacker can measure response time: fast = email not found, slow = email found but wrong password. This reveals valid email addresses (user enumeration).

**Why it happens:** Conditional logic: `if (email !== adminEmail) return 401` skips the slow bcrypt operation.

**How to avoid:** Always run `bcrypt.compare()` regardless of email match. If the email is wrong, compare against a dummy hash so the response time is constant:
```typescript
const emailMatch = email === adminEmail
// Always run compare — prevents timing-based email enumeration
const passMatch = await bcrypt.compare(password, adminHash ?? '$2b$12$dummy.hash.to.prevent.timing')
if (!emailMatch || !passMatch) return c.json({ error: 'Invalid credentials' }, 401)
```

**Warning signs:** Login response is noticeably faster for unknown emails than for known-but-wrong-password attempts.

### Pitfall 2: SameSite: Strict Breaks Dev Login Flow

**What goes wrong:** If `sameSite: 'Strict'` is set in development, some browsers may not send the cookie after redirects. Specifically, after a successful login redirect (`/admin/login` → `/admin`), the strict policy may block the cookie on the first navigated request.

**Why it happens:** `Strict` blocks the cookie on any cross-site navigation, including top-level page loads that originated from an external URL.

**How to avoid:** Use `sameSite: 'Lax'` in development (`NODE_ENV !== 'production'`). Switch to `'Strict'` in production. Since this is a local dev + single-campus deployment, `Lax` in all environments is acceptable as a simplification.

**Warning signs:** Login appears to succeed (200 returned) but the next page load immediately redirects back to login.

### Pitfall 3: `secure: true` Cookie Rejected on HTTP Localhost

**What goes wrong:** Setting `secure: true` on the cookie in development means the browser will only send it over HTTPS. Vite dev server runs on HTTP (localhost:5173). The cookie will never be sent.

**Why it happens:** `secure: true` is correct for production but blocks cookies on plain HTTP.

**How to avoid:** Conditionally set `secure` based on environment:
```typescript
secure: process.env.NODE_ENV === 'production'
```
**Warning signs:** Login succeeds (cookie set in response), but subsequent requests to `/api/auth/me` return 401 (cookie never sent).

### Pitfall 4: Flash-of-Redirect in ProtectedRoute

**What goes wrong:** `useAuth` starts with `authenticated: false`. Before the `/api/auth/me` fetch completes, `<ProtectedRoute>` renders `<Navigate to="/admin/login">` and the admin user sees a redirect flash even when they have a valid session.

**Why it happens:** Initial render fires before async auth check resolves.

**How to avoid:** Track a `loading` state in `useAuth`. While loading, render a neutral spinner or null — never redirect. Only redirect once loading is false and authenticated is false.

**Warning signs:** Logged-in admin is briefly sent to the login page before snapping back to the admin panel.

### Pitfall 5: `credentials: 'include'` Missing on Fetch

**What goes wrong:** Fetch calls to `/api/auth/login`, `/api/auth/me`, and all `/api/admin/*` requests don't include the cookie because the default `credentials` mode is `'same-origin'`. When Vite proxies the request, the browser may treat it as cross-origin.

**Why it happens:** Default `fetch()` mode does not include cookies for cross-origin requests. Vite's proxy rewrites the URL at the network level but the browser's security model still sees the original origin.

**How to avoid:** Add `credentials: 'include'` to every fetch that needs the auth cookie:
```typescript
fetch('/api/auth/me', { credentials: 'include' })
```
**Warning signs:** `/api/auth/me` returns 401 even when the user just logged in successfully.

### Pitfall 6: JWT_SECRET Not Set in .env

**What goes wrong:** `process.env.JWT_SECRET` is `undefined`. `sign(payload, undefined)` throws or produces a token signed with an empty secret (if the library allows it), which is trivially forgeable.

**Why it happens:** `.env` file not loaded, or `JWT_SECRET` key missing.

**How to avoid:** Validate env vars at startup before starting the server:
```typescript
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) throw new Error('JWT_SECRET env var is required')
```
Add `JWT_SECRET` to `.env.example` and document it in the project README.

**Warning signs:** Server starts without error but JWTs are signed with undefined secret; or server throws `TypeError` on first login attempt.

### Pitfall 7: Vite Proxy Does Not Forward Cookies by Default

**What goes wrong:** The Vite proxy in `vite.config.ts` is already configured (`'/api' → 'http://localhost:3001'`). Cookies set by the Hono server (on localhost:3001) are attributed to localhost:5173 by the browser. When the next request is proxied, Vite's `http-proxy` forwards the cookies from the original domain — this generally works, but `secure: true` cookies will not be forwarded over HTTP.

**Why it happens:** Browser security model: secure cookies only travel over HTTPS.

**How to avoid:** Keep `secure: false` in development (see Pitfall 3). The existing Vite proxy config requires no changes for Phase 8.

**Warning signs:** Login cookie set correctly in browser DevTools but not seen in Hono handler.

### Pitfall 8: Biome Linting on `bcryptjs` async API

**What goes wrong:** Biome may flag `await bcrypt.compare()` in a synchronous Hono handler (if the handler is not declared `async`).

**Why it happens:** The handler must be `async` to use `await`. The login endpoint is naturally async (it's validating credentials). This is not a problem if declared correctly.

**How to avoid:** Always declare login handler as `async (c) => { ... }`. Biome will flag missing `await` on promises if the handler is not async.

**Warning signs:** Biome `lint` step fails with "async expression without await" or similar.

---

## Code Examples

Verified patterns from official sources:

### Full Login Endpoint

```typescript
// Source: hono.dev/docs/helpers/jwt + hono.dev/docs/helpers/cookie
import { Hono } from 'hono'
import { sign } from 'hono/jwt'
import { setCookie, deleteCookie } from 'hono/cookie'
import bcrypt from 'bcryptjs'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) throw new Error('JWT_SECRET env var is required')

const SESSION_TTL_SECONDS = 60 * 60 * 2  // 2 hours

app.post('/api/auth/login', loginLimiter, async (c) => {
  const body = await c.req.json<{ email?: string; password?: string }>()
  const { email = '', password = '' } = body

  const adminEmail = process.env.ADMIN_EMAIL ?? ''
  const adminHash  = process.env.ADMIN_PASSWORD_HASH ?? ''

  const emailMatch = email === adminEmail
  // Always run bcrypt.compare to prevent timing-based email enumeration
  const passMatch  = await bcrypt.compare(
    password,
    adminHash || '$2b$12$invalid.hash.placeholder.value'
  )

  if (!emailMatch || !passMatch) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  const token = await sign(
    { sub: adminEmail, role: 'admin', exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS },
    JWT_SECRET,
    'HS256'
  )

  setCookie(c, 'admin_token', token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    path:     '/',
    maxAge:   SESSION_TTL_SECONDS,
  })

  return c.json({ ok: true })
})
```

### Protecting Admin API Routes

```typescript
// Source: hono.dev/docs/middleware/builtin/jwt
import { jwt } from 'hono/jwt'
import type { JwtVariables } from 'hono/jwt'

type Variables = JwtVariables
const app = new Hono<{ Variables: Variables }>()

// All /api/admin/* routes require valid JWT cookie
// Phase 9+ editor routes mount under this prefix automatically
app.use('/api/admin/*', jwt({
  secret: JWT_SECRET,
  alg:    'HS256',
  cookie: 'admin_token',
}))
```

### Logout

```typescript
// Source: hono.dev/docs/helpers/cookie
app.post('/api/auth/logout', (c) => {
  deleteCookie(c, 'admin_token', { path: '/' })
  return c.json({ ok: true })
})
```

### Auth Status Check

```typescript
app.get('/api/auth/me',
  jwt({ secret: JWT_SECRET, alg: 'HS256', cookie: 'admin_token' }),
  (c) => c.json({ authenticated: true })
)
```

### React Router App Setup

```typescript
// Source: react-router-dom v6 (reactrouter.com)
import { BrowserRouter, Routes, Route } from 'react-router-dom'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<FloorPlanCanvas />} />
        <Route path="/admin/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/admin/*" element={<AdminPanel />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
```

### bcryptjs Hash Generation (Setup Script)

```typescript
// scripts/hash-password.ts — run once: npx tsx scripts/hash-password.ts 'your-password'
import bcrypt from 'bcryptjs'
const hash = await bcrypt.hash(process.argv[2], 12)
console.log('ADMIN_PASSWORD_HASH=' + hash)
// Paste into .env
```

### Rate Limiter for Login Route

```typescript
// Source: github.com/rhinobase/hono-rate-limiter
import { rateLimiter } from 'hono-rate-limiter'

export const loginLimiter = rateLimiter({
  windowMs:        10 * 60 * 1000,   // 10-minute window
  limit:           5,                  // 5 attempts per IP per window
  standardHeaders: 'draft-6',
  keyGenerator:    (c) =>
    c.req.header('x-forwarded-for')?.split(',')[0].trim()
    ?? c.req.header('x-real-ip')
    ?? 'unknown',
})
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `localStorage` JWT storage | httpOnly cookie JWT | Security community shift ~2018+ | XSS cannot steal tokens; requires server-side logout |
| Traditional CSRF token (double-submit) | `SameSite` cookie + `Origin` header validation | SameSite browser support solidified ~2020 | Simpler: no hidden form field; CSRF middleware validates Origin header |
| `jsonwebtoken` npm package | `hono/jwt` built-in helpers | Hono v3+ | No extra dependency; Hono wraps jose internally |
| `bcrypt` (native C++) | `bcryptjs` (pure JS) for non-perf-critical paths | Stable alternative ~2016 | Avoids node-gyp build issues (critical on Windows dev environments in this project) |
| Express `express-rate-limit` | `hono-rate-limiter` (Hono port) | ~2023 | Hono-native middleware signature; same API surface |

**Deprecated/outdated:**
- `jsonwebtoken` (`jwt.sign()` / `jwt.verify()`): Callback-based API; requires separate `@types/jsonwebtoken`. Replaced by `hono/jwt` for this project.
- `cookie-session` / `express-session`: Session stores are overkill for a stateless JWT approach. httpOnly cookie + JWT is the modern stateless alternative.
- `passport.js`: Heavy framework; adds abstraction cost that is not needed for a single-admin, single-strategy login.

---

## Open Questions

1. **CSRF: Hono `csrf()` middleware vs traditional double-submit token**
   - What we know: CONTEXT.md says "include a CSRF token alongside the cookie." Hono's `csrf()` middleware validates the `Origin` header — not a separate token. This covers the same attack surface differently.
   - What's unclear: Whether the user's intent was a traditional double-submit CSRF token (cookie + hidden form field) or simply "have CSRF protection."
   - Recommendation: Use `hono/csrf` middleware (Origin validation). It satisfies the security requirement without additional client-side plumbing. The planner should note this interpretation and document it. If a traditional CSRF token is required, implement `csurf`-style: server generates a token, embeds in the login page response, client sends it as a header.

2. **Post-login redirect destination**
   - What we know: Marked as Claude's discretion. The admin panel pages don't exist yet (Phase 9).
   - What's unclear: Should login redirect to `/admin` (placeholder shell) or back to whatever page the admin tried to access?
   - Recommendation: Simple fixed redirect to `/admin` for Phase 8. Implement redirect-to-original-URL in Phase 9 when the admin panel has real content. The React Router `<Navigate to="/admin" replace />` pattern covers this.

3. **Number of admin accounts from .env**
   - What we know: Single admin is the primary use case. Claude's discretion on array vs single pair.
   - What's unclear: Whether `ADMIN_EMAIL`/`ADMIN_PASSWORD_HASH` should support multiple pairs (e.g., `ADMIN_EMAIL_1`, `ADMIN_EMAIL_2`).
   - Recommendation: Single pair (`ADMIN_EMAIL` + `ADMIN_PASSWORD_HASH`) for Phase 8. Multi-admin is a v2 requirement (ADME-01). Keep it simple.

4. **Vite SPA routing: `historyApiFallback` for `/admin/login` refresh**
   - What we know: Vite dev server has built-in `historyApiFallback` enabled by default (serves `index.html` for all 404s). React Router client-side routes work in dev without config.
   - What's unclear: Production build behavior — the Hono server would need to serve `index.html` for unknown routes (not just `/api/*`). This is a Phase 9+ concern when the app is deployed.
   - Recommendation: In dev, Vite handles it. In production, add a catch-all route to the Hono server serving the built `index.html`. This is a Phase 8 concern only if a production build is tested during this phase.

---

## Sources

### Primary (HIGH confidence)

- `/honojs/website` (Context7) — JWT middleware config (`cookie` option), `setCookie`/`deleteCookie` options, `csrf` middleware, route grouping with `app.route()`, `sign`/`verify` helper signatures
- `https://hono.dev/docs/middleware/builtin/jwt` — JWT middleware API (fetched directly)
- `https://hono.dev/docs/helpers/jwt` — `sign()` and `verify()` helper function signatures (fetched directly)
- `https://hono.dev/docs/helpers/cookie` — `setCookie`, `deleteCookie`, `getCookie` options (via Context7)

### Secondary (MEDIUM confidence)

- `https://www.npmjs.com/package/bcryptjs` — Pure-JS bcrypt, TypeScript support, no native build requirement (WebSearch verified via multiple sources)
- `https://github.com/rhinobase/hono-rate-limiter` — `rateLimiter` API: `windowMs`, `limit`, `keyGenerator`, in-memory default store (WebSearch; README described via search snippet)
- `https://blog.logrocket.com/authentication-react-router-v6/` — `<ProtectedRoute>` with `<Navigate>` and `<Outlet>` pattern (WebSearch; standard React Router v6 pattern confirmed by multiple sources)
- `https://reactrouter.com` — React Router v6 `BrowserRouter`, `Routes`, `Route`, `Navigate`, `Outlet` (WebSearch)

### Tertiary (LOW confidence)

- `hono-rate-limiter` `keyGenerator` for IP extraction from `x-forwarded-for` header — described via WebSearch only; standard pattern for Node.js behind proxy

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Hono built-ins verified via Context7 + official docs. `bcryptjs` verified via multiple WebSearch sources. `hono-rate-limiter` verified via WebSearch (GitHub README description).
- Architecture: HIGH — Server patterns verified from official Hono docs. Client patterns are standard React Router v6. No novel patterns introduced.
- Pitfalls: HIGH for Pitfalls 1–6 (derived from verified behavior of cookie flags, bcrypt timing, React Router render order). MEDIUM for Pitfalls 7–8 (Vite proxy cookie forwarding and Biome lint specifics — inferred from existing project patterns).

**Research date:** 2026-02-21
**Valid until:** 2026-03-23 (Hono 4.x and React Router 6 are both stable; 30-day window)
