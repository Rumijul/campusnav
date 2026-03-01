import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import type { NavGraph } from '@shared/types'
import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { Hono } from 'hono'
import { csrf } from 'hono/csrf'
import { jwt } from 'hono/jwt'
import { JWT_SECRET } from './auth/credentials'
import { authRoutes } from './auth/routes'
import { db } from './db/client'
import { edges, graphMetadata, nodes } from './db/schema'
import { seedIfEmpty } from './db/seed'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Startup: migrate then seed ──────────────────────────────────────────────
// postgres-js migrator is async — use a dedicated short-lived connection (max: 1)
const migrationClient = postgres(process.env.DATABASE_URL!, { max: 1 })
await migrate(drizzlePg(migrationClient), { migrationsFolder: resolve(__dirname, '../../drizzle') })
await migrationClient.end()
await seedIfEmpty()
// ────────────────────────────────────────────────────────────────────────────

const app = new Hono()

// ── Global CSRF protection ───────────────────────────────────────────────────
app.use(csrf())

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

/** Serve the navigation graph as JSON — queries PostgreSQL via Drizzle. No auth required. */
app.get('/api/map', async (c) => {
  try {
    const nodeRows = await db.select().from(nodes)
    const edgeRows = await db.select().from(edges)
    const metaRows = await db.select().from(graphMetadata).limit(1)
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

// ── Auth routes (public — login/logout/me) ────────────────────────────────────
app.route('/api/auth', authRoutes)

// ── JWT guard for all admin API routes ────────────────────────────────────────
app.use('/api/admin/*', jwt({ secret: JWT_SECRET, alg: 'HS256', cookie: 'admin_token' }))

// ── Admin routes (protected) ──────────────────────────────────────────────────

/**
 * POST /api/admin/graph
 * Replaces the entire navigation graph in PostgreSQL atomically.
 * Receives a full NavGraph JSON body; wraps delete+insert in a PostgreSQL transaction.
 */
app.post('/api/admin/graph', async (c) => {
  try {
    const graph = (await c.req.json()) as NavGraph
    // Basic validation: must have nodes array and edges array
    if (!Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) {
      return c.json({ error: 'Invalid graph data' }, 400)
    }

    await db.transaction(async (tx) => {
      // Delete all existing data
      await tx.delete(graphMetadata)
      await tx.delete(edges)
      await tx.delete(nodes)

      // Insert nodes
      for (const n of graph.nodes) {
        await tx.insert(nodes).values({
          id: n.id,
          x: n.x,
          y: n.y,
          label: n.label,
          type: n.type,
          searchable: n.searchable,
          floor: n.floor,
          roomNumber: n.roomNumber ?? null,
          description: n.description ?? null,
          buildingName: n.buildingName ?? null,
          accessibilityNotes: n.accessibilityNotes ?? null,
        })
      }

      // Insert edges
      for (const e of graph.edges) {
        await tx.insert(edges).values({
          id: e.id,
          sourceId: e.sourceId,
          targetId: e.targetId,
          standardWeight: e.standardWeight,
          accessibleWeight: e.accessibleWeight, // 1e10 for non-accessible (never Infinity)
          accessible: e.accessible,
          bidirectional: e.bidirectional,
          accessibilityNotes: e.accessibilityNotes ?? null,
        })
      }

      // Insert metadata
      if (graph.metadata) {
        await tx.insert(graphMetadata).values({
          buildingName: graph.metadata.buildingName,
          floor: graph.metadata.floor,
          lastUpdated: graph.metadata.lastUpdated,
        })
      }
    })

    return c.json({ ok: true })
  } catch (err) {
    console.error('Graph save failed:', err)
    return c.json({ error: 'Failed to save graph' }, 500)
  }
})

/**
 * POST /api/admin/floor-plan
 * Accepts a multipart image upload and writes it to the server assets directory.
 * The uploaded image replaces the existing floor-plan.png.
 */
app.post('/api/admin/floor-plan', async (c) => {
  try {
    const body = await c.req.parseBody()
    const file = body.image
    if (!file || !(file instanceof File)) {
      return c.json({ error: 'No image file provided' }, 400)
    }
    if (!file.type.startsWith('image/')) {
      return c.json({ error: 'File must be an image' }, 400)
    }
    const buffer = Buffer.from(await file.arrayBuffer())
    const dest = resolve(__dirname, 'assets/floor-plan.png')
    await writeFile(dest, buffer)
    return c.json({ ok: true })
  } catch (err) {
    console.error('Floor plan upload failed:', err)
    return c.json({ error: 'Failed to upload floor plan' }, 500)
  }
})

app.use('/*', serveStatic({ root: './dist/client' }))

app.get('/*', async (c) => {
  const html = await readFile('./dist/client/index.html', 'utf-8')
  return c.html(html)
})

const port = 3001
console.log(`Server running on http://localhost:${port}`)
serve({ fetch: app.fetch, port })
