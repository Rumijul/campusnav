import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFile } from 'node:fs/promises'
import { serve } from '@hono/node-server'
import type { NavGraph } from '@shared/types'
import { Hono } from 'hono'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { db } from './db/client'
import { edges, graphMetadata, nodes } from './db/schema'
import { seedIfEmpty } from './db/seed'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Startup: migrate then seed ──────────────────────────────────────────────
// migrate() is synchronous with better-sqlite3; applies only pending migrations
migrate(db, { migrationsFolder: resolve(__dirname, '../../drizzle') })
seedIfEmpty()
// ────────────────────────────────────────────────────────────────────────────

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

/** Serve the navigation graph as JSON — queries SQLite via Drizzle. No auth required. */
app.get('/api/map', (c) => {
  try {
    // better-sqlite3 is synchronous — no await needed
    const nodeRows = db.select().from(nodes).all()
    const edgeRows = db.select().from(edges).all()
    const metaRows = db.select().from(graphMetadata).limit(1).all()
    const meta = metaRows[0]

    if (!meta) return c.json({ error: 'Graph data not found' }, 404)

    const graph: NavGraph = {
      nodes: nodeRows.map((n) => ({
        id: n.id,
        x: n.x,
        y: n.y,
        label: n.label,
        type: n.type as NavGraph['nodes'][number]['type'],
        searchable: n.searchable,
        floor: n.floor,
        ...(n.roomNumber != null && { roomNumber: n.roomNumber }),
        ...(n.description != null && { description: n.description }),
        ...(n.buildingName != null && { buildingName: n.buildingName }),
        ...(n.accessibilityNotes != null && { accessibilityNotes: n.accessibilityNotes }),
      })),
      edges: edgeRows.map((e) => ({
        id: e.id,
        sourceId: e.sourceId,
        targetId: e.targetId,
        standardWeight: e.standardWeight,
        accessibleWeight: e.accessibleWeight, // 1e10 is safe in JSON; Infinity is not
        accessible: e.accessible,
        bidirectional: e.bidirectional,
        ...(e.accessibilityNotes != null && { accessibilityNotes: e.accessibilityNotes }),
      })),
      metadata: {
        buildingName: meta.buildingName,
        floor: meta.floor,
        lastUpdated: meta.lastUpdated,
      },
    }

    c.header('Cache-Control', 'public, max-age=60')
    return c.json(graph)
  } catch (_err) {
    return c.json({ error: 'Failed to load graph data' }, 500)
  }
})

const port = 3001
console.log(`Server running on http://localhost:${port}`)
serve({ fetch: app.fetch, port })
