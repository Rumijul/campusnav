import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { serve } from '@hono/node-server'
import type { NavGraph } from '@shared/types'
import { Hono } from 'hono'

const __dirname = dirname(fileURLToPath(import.meta.url))

const app = new Hono()

/** Health check endpoint — verifies the server is running. */
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

/** Serve the full-resolution floor plan PNG. */
app.get('/api/floor-plan/image', async (c) => {
  try {
    const filePath = resolve(__dirname, 'assets/floor-plan.png')
    const buffer = await readFile(filePath)
    c.header('Content-Type', 'image/png')
    c.header('Cache-Control', 'public, max-age=3600')
    return c.body(buffer)
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException).code
    if (code === 'ENOENT') {
      return c.json({ error: 'Floor plan not found' }, 404)
    }
    return c.json({ error: 'Failed to read floor plan' }, 500)
  }
})

/** Serve the low-resolution floor plan thumbnail JPEG. */
app.get('/api/floor-plan/thumbnail', async (c) => {
  try {
    const filePath = resolve(__dirname, 'assets/floor-plan-thumb.jpg')
    const buffer = await readFile(filePath)
    c.header('Content-Type', 'image/jpeg')
    c.header('Cache-Control', 'public, max-age=3600')
    return c.body(buffer)
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException).code
    if (code === 'ENOENT') {
      return c.json({ error: 'Floor plan thumbnail not found' }, 404)
    }
    return c.json({ error: 'Failed to read floor plan thumbnail' }, 500)
  }
})

/**
 * Placeholder type annotation to verify @shared/types path alias
 * resolves correctly from server code. Replaced with real endpoints
 * in later phases.
 */
const _graphTypeCheck: NavGraph | null = null
void _graphTypeCheck

const port = 3001
console.log(`Server running on http://localhost:${port}`)
serve({ fetch: app.fetch, port })
