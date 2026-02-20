import * as bcrypt from 'bcryptjs'
import { Hono } from 'hono'
import { deleteCookie, setCookie } from 'hono/cookie'
import { jwt, sign } from 'hono/jwt'
import { ADMIN_EMAIL, ADMIN_PASSWORD_HASH, JWT_SECRET } from './credentials'
import { loginLimiter } from './loginLimiter'

/** Placeholder hash used when ADMIN_PASSWORD_HASH is not set — prevents timing attacks */
const PLACEHOLDER_HASH = '$2b$12$invalid.hash.placeholder.value.xx'

export const authRoutes = new Hono()

/**
 * POST /login
 * Validates admin credentials and issues a JWT in an httpOnly cookie.
 * Rate-limited to 5 attempts per 10-minute window per IP.
 */
authRoutes.post('/login', loginLimiter, async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>
  const email = typeof body.email === 'string' ? body.email : ''
  const password = typeof body.password === 'string' ? body.password : ''

  const emailMatch = email === ADMIN_EMAIL

  // Always run bcrypt.compare to prevent timing attacks, even when email doesn't match
  const hashToCompare = ADMIN_PASSWORD_HASH || PLACEHOLDER_HASH
  const passMatch = await bcrypt.compare(password, hashToCompare)

  if (!emailMatch || !passMatch) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  const token = await sign(
    {
      sub: ADMIN_EMAIL,
      role: 'admin',
      exp: Math.floor(Date.now() / 1000) + 7200,
    },
    JWT_SECRET,
    'HS256',
  )

  setCookie(c, 'admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    path: '/',
    maxAge: 7200,
  })

  return c.json({ ok: true }, 200)
})

/**
 * POST /logout
 * Clears the admin_token cookie server-side.
 */
authRoutes.post('/logout', (c) => {
  deleteCookie(c, 'admin_token', { path: '/' })
  return c.json({ ok: true })
})

/**
 * GET /me
 * Returns auth status for the current session.
 * Protected by JWT middleware — requires valid admin_token cookie.
 */
authRoutes.get('/me', jwt({ secret: JWT_SECRET, alg: 'HS256', cookie: 'admin_token' }), (c) => {
  return c.json({ authenticated: true })
})
