import { rateLimiter } from 'hono-rate-limiter'

/**
 * Rate limiter middleware for the login endpoint.
 * Allows 5 attempts per 10-minute window per IP address.
 * Uses standard headers (draft-6) to communicate limit status to clients.
 */
export const loginLimiter = rateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  limit: 5, // 5 attempts per window
  standardHeaders: 'draft-6',
  keyGenerator: (c) => {
    const forwarded = c.req.header('x-forwarded-for')
    if (forwarded) {
      const first = forwarded.split(',')[0]
      if (first) return first.trim()
    }
    return c.req.header('x-real-ip') ?? 'unknown'
  },
})
