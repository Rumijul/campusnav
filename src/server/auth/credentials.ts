/**
 * Admin credential configuration loaded from environment variables.
 * JWT_SECRET is required at startup; missing admin credentials allow server start
 * but login will fail gracefully.
 */

export const JWT_SECRET: string = process.env.JWT_SECRET ?? ''
export const ADMIN_EMAIL: string | undefined = process.env.ADMIN_EMAIL
export const ADMIN_PASSWORD_HASH: string | undefined = process.env.ADMIN_PASSWORD_HASH

// Validate at import time: JWT_SECRET is required for the server to function securely
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET env var is required')
}

// Warn about missing admin credentials — server starts but login will fail
if (!ADMIN_EMAIL) {
  console.warn('[auth] WARNING: ADMIN_EMAIL env var is not set — login will always fail')
}
if (!ADMIN_PASSWORD_HASH) {
  console.warn('[auth] WARNING: ADMIN_PASSWORD_HASH env var is not set — login will always fail')
}
