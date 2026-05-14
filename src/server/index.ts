import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { r2GetBuffer, r2PutBuffer } from './r2'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import type { NavGraph, NavNode } from '@shared/types'
import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { and, eq, inArray } from 'drizzle-orm'
import postgres from 'postgres'
import { Hono } from 'hono'
import { csrf } from 'hono/csrf'
import { jwt } from 'hono/jwt'
import { JWT_SECRET } from './auth/credentials'
import { authRoutes } from './auth/routes'
import { ConnectorLinkingError, linkConnectorNodesFromPayload } from './connectorLinking'
import { db } from './db/client'
import { buildings, edges, floors, nodes } from './db/schema'
import {
  FloorGpsBoundsError,
  serializeFloorGpsBounds,
  updateFloorGpsBoundsFromPayload,
} from './floorGpsBounds'
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

/** Serve the floor plan image for a specific building and floor. */
app.get('/api/floor-plan/:buildingId/:floorNumber', async (c) => {
  try {
    const buildingId = Number(c.req.param('buildingId'))
    const floorNumber = Number(c.req.param('floorNumber'))
    if (Number.isNaN(buildingId) || Number.isNaN(floorNumber)) {
      return c.json({ error: 'Invalid building or floor number' }, 400)
    }

    const [floorRow] = await db
      .select({ imagePath: floors.imagePath })
      .from(floors)
      .where(and(eq(floors.buildingId, buildingId), eq(floors.floorNumber, floorNumber)))
      .limit(1)

    if (!floorRow) return c.json({ error: 'Floor not found' }, 404)

    const buffer = await r2GetBuffer(floorRow.imagePath)
    // Detect content type from extension
    const ext = floorRow.imagePath.split('.').pop()?.toLowerCase()
    const contentType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png'
    c.header('Content-Type', contentType)
    c.header('Cache-Control', 'public, max-age=3600')
    return c.body(buffer)
  } catch (_err) {
    return c.json({ error: 'Floor plan image not found' }, 404)
  }
})

/** Serve the full-resolution floor plan PNG. */
app.get('/api/floor-plan/image', async (c) => {
  try {
    const buffer = await r2GetBuffer('floor-plan.png')
    c.header('Content-Type', 'image/png')
    c.header('Cache-Control', 'public, max-age=3600')
    return c.body(buffer)
  } catch (_err) {
    return c.json({ error: 'Floor plan not found' }, 404)
  }
})

/** Serve the low-resolution floor plan thumbnail JPEG. */
app.get('/api/floor-plan/thumbnail', async (c) => {
  try {
    const buffer = await r2GetBuffer('floor-plan-thumb.jpg')
    c.header('Content-Type', 'image/jpeg')
    c.header('Cache-Control', 'public, max-age=3600')
    return c.body(buffer)
  } catch (_err) {
    return c.json({ error: 'Floor plan thumbnail not found' }, 404)
  }
})

/** Serve the campus overhead map image. */
app.get('/api/campus/image', async (c) => {
  try {
    const [campusBuilding] = await db.select({ id: buildings.id }).from(buildings)
      .where(eq(buildings.name, 'Campus')).limit(1)
    if (!campusBuilding) return c.json({ error: 'Campus map not found' }, 404)
    const [campusFloor] = await db.select({ imagePath: floors.imagePath }).from(floors)
      .where(and(eq(floors.buildingId, campusBuilding.id), eq(floors.floorNumber, 0))).limit(1)
    if (!campusFloor) return c.json({ error: 'Campus map not found' }, 404)
    const buffer = await r2GetBuffer(campusFloor.imagePath)
    const ext = campusFloor.imagePath.split('.').pop()?.toLowerCase()
    const contentType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png'
    c.header('Content-Type', contentType)
    c.header('Cache-Control', 'public, max-age=3600')
    return c.body(buffer)
  } catch (_err) {
    return c.json({ error: 'Campus map image not found' }, 404)
  }
})

/**
 * Serve a lightweight navigation graph skeleton without per-floor geometry payloads.
 * Used by the student app for fast initial load — geometry is fetched per-floor on demand.
 */
app.get('/api/map/skeleton', async (c) => {
  try {
    const [buildingRows, floorRows, nodeRows, edgeRows] = await Promise.all([
      db.select().from(buildings),
      db.select().from(floors),
      db.select().from(nodes),
      db.select().from(edges),
    ])

    if (buildingRows.length === 0) return c.json({ error: 'Graph data not found' }, 404)

    const nodesByFloor = new Map<number, typeof nodeRows>()
    for (const n of nodeRows) {
      if (!nodesByFloor.has(n.floorId)) nodesByFloor.set(n.floorId, [])
      nodesByFloor.get(n.floorId)!.push(n)
    }

    const edgesByFloor = new Map<number, typeof edgeRows>()
    const nodeFloorMap = new Map(nodeRows.map(n => [n.id, n.floorId]))
    for (const e of edgeRows) {
      const floorId = nodeFloorMap.get(e.sourceId)
      if (floorId !== undefined) {
        if (!edgesByFloor.has(floorId)) edgesByFloor.set(floorId, [])
        edgesByFloor.get(floorId)!.push(e)
      }
    }

    const floorsByBuilding = new Map<number, typeof floorRows>()
    for (const f of floorRows) {
      if (!floorsByBuilding.has(f.buildingId)) floorsByBuilding.set(f.buildingId, [])
      floorsByBuilding.get(f.buildingId)!.push(f)
    }

    const graph: NavGraph = {
      buildings: buildingRows.map((b) => ({
        id: b.id,
        name: b.name,
        floors: (floorsByBuilding.get(b.id) ?? []).map((f) => ({
          id: f.id,
          floorNumber: f.floorNumber,
          imagePath: f.imagePath,
          updatedAt: f.updatedAt,
          ...serializeFloorGpsBounds(f),
          // NOTE: geometry is intentionally OMITTED here for fast skeleton load
          nodes: (nodesByFloor.get(f.id) ?? []).map((n) => ({
            id: n.id,
            x: n.x,
            y: n.y,
            label: n.label,
            type: n.type as NavNode['type'],
            searchable: n.searchable,
            floorId: n.floorId,
            ...(n.roomNumber != null && { roomNumber: n.roomNumber }),
            ...(n.description != null && { description: n.description }),
            ...(n.accessibilityNotes != null && { accessibilityNotes: n.accessibilityNotes }),
            ...(n.connectsToFloorAboveId != null && { connectsToFloorAboveId: n.connectsToFloorAboveId }),
            ...(n.connectsToFloorBelowId != null && { connectsToFloorBelowId: n.connectsToFloorBelowId }),
            ...(n.connectsToNodeAboveId != null && { connectsToNodeAboveId: n.connectsToNodeAboveId }),
            ...(n.connectsToNodeBelowId != null && { connectsToNodeBelowId: n.connectsToNodeBelowId }),
            ...(n.connectsToBuildingId != null && { connectsToBuildingId: n.connectsToBuildingId }),
          })),
          edges: (edgesByFloor.get(f.id) ?? []).map((e) => ({
            id: e.id,
            sourceId: e.sourceId,
            targetId: e.targetId,
            standardWeight: e.standardWeight,
            accessibleWeight: e.accessibleWeight,
            accessible: e.accessible,
            bidirectional: e.bidirectional,
            ...(e.accessibilityNotes != null && { accessibilityNotes: e.accessibilityNotes }),
          })),
        })),
      })),
    }

    c.header('Cache-Control', 'public, max-age=60')
    return c.json(graph)
  } catch (_err) {
    console.error('GET /api/map/skeleton failed:', _err)
    return c.json({ error: 'Failed to load graph data' }, 500)
  }
})

/**
 * Serve per-floor vector geometry on demand.
 * The student app requests this when a floor is first viewed — geometry is cached
 * in memory after the first fetch.
 */
app.get('/api/floors/:id/geometry', async (c) => {
  try {
    const floorId = Number(c.req.param('id'))
    if (!Number.isInteger(floorId) || floorId <= 0) {
      return c.json({ error: 'Invalid floor id' }, 400)
    }

    const [row] = await db
      .select({ geometry: floors.geometry })
      .from(floors)
      .where(eq(floors.id, floorId))
      .limit(1)

    if (!row) return c.json({ error: 'Floor not found' }, 404)
    if (row.geometry == null) return c.json({ error: 'Geometry not available for this floor' }, 404)

    c.header('Cache-Control', 'private, max-age=300')
    return c.json(row.geometry)
  } catch (_err) {
    console.error('GET /api/floors/:id/geometry failed:', _err)
    return c.json({ error: 'Failed to load floor geometry' }, 500)
  }
})

/** Serve the navigation graph as JSON — queries PostgreSQL via Drizzle. No auth required. */
app.get('/api/map', async (c) => {
  try {
    const [buildingRows, floorRows, nodeRows, edgeRows] = await Promise.all([
      db.select().from(buildings),
      db.select().from(floors),
      db.select().from(nodes),
      db.select().from(edges),
    ])

    if (buildingRows.length === 0) return c.json({ error: 'Graph data not found' }, 404)

    // Group nodes by floorId for efficient assembly
    const nodesByFloor = new Map<number, typeof nodeRows>()
    for (const n of nodeRows) {
      if (!nodesByFloor.has(n.floorId)) nodesByFloor.set(n.floorId, [])
      nodesByFloor.get(n.floorId)!.push(n)
    }

    // Assign edges to source node's floor (edges are not directly floor-scoped in DB)
    const edgesByFloor = new Map<number, typeof edgeRows>()
    const nodeFloorMap = new Map(nodeRows.map(n => [n.id, n.floorId]))
    for (const e of edgeRows) {
      const floorId = nodeFloorMap.get(e.sourceId)
      if (floorId !== undefined) {
        if (!edgesByFloor.has(floorId)) edgesByFloor.set(floorId, [])
        edgesByFloor.get(floorId)!.push(e)
      }
    }

    // Group floors by buildingId
    const floorsByBuilding = new Map<number, typeof floorRows>()
    for (const f of floorRows) {
      if (!floorsByBuilding.has(f.buildingId)) floorsByBuilding.set(f.buildingId, [])
      floorsByBuilding.get(f.buildingId)!.push(f)
    }

    const graph: NavGraph = {
      buildings: buildingRows.map((b) => ({
        id: b.id,
        name: b.name,
        floors: (floorsByBuilding.get(b.id) ?? []).map((f) => ({
          id: f.id,
          floorNumber: f.floorNumber,
          imagePath: f.imagePath,
          updatedAt: f.updatedAt,
          ...serializeFloorGpsBounds(f),
          ...(f.geometry != null && { geometry: f.geometry as import('@shared/types').FloorPlanGeometry }),
          nodes: (nodesByFloor.get(f.id) ?? []).map((n) => ({
            id: n.id,
            x: n.x,
            y: n.y,
            label: n.label,
            type: n.type as NavNode['type'],
            searchable: n.searchable,
            floorId: n.floorId,
            ...(n.roomNumber != null && { roomNumber: n.roomNumber }),
            ...(n.description != null && { description: n.description }),
            ...(n.accessibilityNotes != null && { accessibilityNotes: n.accessibilityNotes }),
            ...(n.connectsToFloorAboveId != null && { connectsToFloorAboveId: n.connectsToFloorAboveId }),
            ...(n.connectsToFloorBelowId != null && { connectsToFloorBelowId: n.connectsToFloorBelowId }),
            ...(n.connectsToNodeAboveId != null && { connectsToNodeAboveId: n.connectsToNodeAboveId }),
            ...(n.connectsToNodeBelowId != null && { connectsToNodeBelowId: n.connectsToNodeBelowId }),
            ...(n.connectsToBuildingId != null && { connectsToBuildingId: n.connectsToBuildingId }),
          })),
          edges: (edgesByFloor.get(f.id) ?? []).map((e) => ({
            id: e.id,
            sourceId: e.sourceId,
            targetId: e.targetId,
            standardWeight: e.standardWeight,
            accessibleWeight: e.accessibleWeight,
            accessible: e.accessible,
            bidirectional: e.bidirectional,
            ...(e.accessibilityNotes != null && { accessibilityNotes: e.accessibilityNotes }),
          })),
        })),
      })),
    }

    c.header('Cache-Control', 'public, max-age=60')
    return c.json(graph)
  } catch (_err) {
    console.error('GET /api/map failed:', _err)
    return c.json({ error: 'Failed to load graph data' }, 500)
  }
})

// ── Auth routes (public — login/logout/me) ────────────────────────────────────
app.route('/api/auth', authRoutes)

// ── JWT guard for all admin API routes ────────────────────────────────────────
app.use('/api/admin/*', jwt({ secret: JWT_SECRET, alg: 'HS256', cookie: 'admin_token' }))

// ── Admin routes (protected) ──────────────────────────────────────────────────

/**
 * POST /api/admin/connectors/link
 * Links, relinks, or unlinks connector nodes (`stairs`/`elevator`/`ramp`) atomically.
 * Request body: { sourceNodeId, direction: "above"|"below", targetNodeId?: string|null }
 */
app.post('/api/admin/connectors/link', async (c) => {
  try {
    let body: unknown

    try {
      body = await c.req.json()
    } catch {
      return c.json({ errorCode: 'INVALID_REQUEST', error: 'Request body must be valid JSON' }, 400)
    }

    const result = await linkConnectorNodesFromPayload(body)
    return c.json(result)
  } catch (error) {
    if (error instanceof ConnectorLinkingError) {
      return c.json({ errorCode: error.code, error: error.message }, error.status)
    }

    console.error('Connector link update failed:', error)
    return c.json({ errorCode: 'INTERNAL_ERROR', error: 'Failed to update connector link' }, 500)
  }
})

/**
 * POST /api/admin/graph
 * Replaces the entire navigation graph in PostgreSQL atomically.
 * Receives a full NavGraph JSON body (buildings → floors → nodes/edges);
 * wraps delete+insert in a PostgreSQL transaction.
 */
app.post('/api/admin/graph', async (c) => {
  try {
    const graph = (await c.req.json()) as NavGraph
    // Basic validation: must have buildings array
    if (!Array.isArray(graph.buildings)) {
      return c.json({ error: 'Invalid graph data' }, 400)
    }

    await db.transaction(async (tx) => {
      // Delete in FK-safe order (edges → nodes → floors → buildings)
      await tx.delete(edges)
      await tx.delete(nodes)
      await tx.delete(floors)
      await tx.delete(buildings)

      // Pass 1: Insert buildings and floors, collect { floorNumber → floorId } map
      const floorIdByNumber = new Map<number, number>()

      for (const b of graph.buildings) {
        const buildingRows = await tx.insert(buildings).values({ name: b.name }).returning({ id: buildings.id })
        if (buildingRows.length === 0) throw new Error('Failed to insert building')
        const building = buildingRows[0]!

        for (const f of b.floors) {
          const floorRows = await tx.insert(floors).values({
            buildingId: building.id,
            floorNumber: f.floorNumber,
            imagePath: f.imagePath,
            updatedAt: new Date().toISOString(),
          }).returning({ id: floors.id })
          if (floorRows.length === 0) throw new Error('Failed to insert floor')
          const floor = floorRows[0]!
          floorIdByNumber.set(f.floorNumber, floor.id)

          for (const n of f.nodes) {
            await tx.insert(nodes).values({
              id: n.id, x: n.x, y: n.y, label: n.label, type: n.type,
              searchable: n.searchable, floorId: floor.id,
              roomNumber: n.roomNumber ?? null,
              description: n.description ?? null,
              accessibilityNotes: n.accessibilityNotes ?? null,
              // Pass connector references through as-is; Pass 2 resolves FLOOR:/NODE: placeholders
              connectsToFloorAboveId: n.connectsToFloorAboveId ?? null,
              connectsToFloorBelowId: n.connectsToFloorBelowId ?? null,
              connectsToNodeAboveId: n.connectsToNodeAboveId ?? null,
              connectsToNodeBelowId: n.connectsToNodeBelowId ?? null,
              connectsToBuildingId: n.connectsToBuildingId ?? null,
            })
          }

          for (const e of f.edges) {
            await tx.insert(edges).values({
              id: e.id, sourceId: e.sourceId, targetId: e.targetId,
              standardWeight: e.standardWeight, accessibleWeight: e.accessibleWeight,
              accessible: e.accessible, bidirectional: e.bidirectional,
              accessibilityNotes: e.accessibilityNotes ?? null,
            })
          }
        }
      }

      // Pass 2: Resolve cross-floor connector references.
      // In the JSON, nodes can use "FLOOR:{floorNumber}" (e.g. "FLOOR:2") as a
      // placeholder for connectsToFloorAboveId / connectsToFloorBelowId.
      // Also, connectsToNodeAboveId / connectsToNodeBelowId can use "NODE:{nodeId}"
      // as a self-referential sentinel that gets resolved to the actual nodeId.
      const resolveFloorRef = (ref: unknown): number | null => {
        if (typeof ref === 'number') return ref
        if (typeof ref === 'string') {
          const m = ref.match(/^FLOOR:(\d+)$/)
          if (m) {
            const fid = floorIdByNumber.get(parseInt(m[1]!, 10))
            return fid ?? null
          }
          return null
        }
        return null
      }

      const allNodeRows = await tx.select({ id: nodes.id, connectsToFloorAboveId: nodes.connectsToFloorAboveId, connectsToFloorBelowId: nodes.connectsToFloorBelowId, connectsToNodeAboveId: nodes.connectsToNodeAboveId, connectsToNodeBelowId: nodes.connectsToNodeBelowId }).from(nodes)
      const needsUpdate: Array<{ id: string; patch: Record<string, unknown> }> = []

      for (const row of allNodeRows) {
        const patch: Record<string, unknown> = {}
        let dirty = false

        // Resolve "FLOOR:{n}" → actual floorId for both directions
        if (row.connectsToFloorAboveId !== null) {
          const resolved = resolveFloorRef(row.connectsToFloorAboveId)
          if (resolved !== null) { patch.connectsToFloorAboveId = resolved; dirty = true }
        }
        if (row.connectsToFloorBelowId !== null) {
          const resolved = resolveFloorRef(row.connectsToFloorBelowId)
          if (resolved !== null) { patch.connectsToFloorBelowId = resolved; dirty = true }
        }

        // Resolve "NODE:{nodeId}" → actual nodeId for both directions
        if (row.connectsToNodeAboveId !== null && typeof row.connectsToNodeAboveId === 'string') {
          const m = row.connectsToNodeAboveId.match(/^NODE:(.+)$/)
          if (m) { patch.connectsToNodeAboveId = m[1]; dirty = true }
        }
        if (row.connectsToNodeBelowId !== null && typeof row.connectsToNodeBelowId === 'string') {
          const m = row.connectsToNodeBelowId.match(/^NODE:(.+)$/)
          if (m) { patch.connectsToNodeBelowId = m[1]; dirty = true }
        }

        if (dirty) needsUpdate.push({ id: row.id, patch })
      }

      for (const { id, patch } of needsUpdate) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await tx.update(nodes).set(patch as any).where(eq(nodes.id, id))
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
    await r2PutBuffer('floor-plan.png', buffer, file.type)
    return c.json({ ok: true })
  } catch (err) {
    console.error('Floor plan upload failed:', err)
    return c.json({ error: 'Failed to upload floor plan' }, 500)
  }
})

/**
 * POST /api/admin/floors
 * Accepts multipart form with buildingId, floorNumber, image.
 * Creates the floor record and saves the image atomically.
 */
app.post('/api/admin/floors', async (c) => {
  try {
    const body = await c.req.parseBody()
    const buildingId = Number(body.buildingId)
    const floorNumber = Number(body.floorNumber)
    const file = body.image
    if (Number.isNaN(buildingId) || Number.isNaN(floorNumber)) {
      return c.json({ error: 'Invalid buildingId or floorNumber' }, 400)
    }
    if (!file || !(file instanceof File)) return c.json({ error: 'No image file provided' }, 400)
    if (!file.type.startsWith('image/')) return c.json({ error: 'File must be an image' }, 400)
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
    const filename = `floor-plan-${buildingId}-${floorNumber}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())
    await r2PutBuffer(filename, buffer, file.type)
    const floorRows = await db.insert(floors).values({
      buildingId,
      floorNumber,
      imagePath: filename,
      updatedAt: new Date().toISOString(),
    }).returning({ id: floors.id })
    if (floorRows.length === 0) throw new Error('Failed to insert floor')
    return c.json({ ok: true, floorId: floorRows[0]!.id })
  } catch (err) {
    console.error('Add floor failed:', err)
    return c.json({ error: 'Failed to add floor' }, 500)
  }
})

/**
 * PUT /api/admin/floors/:id/gps-bounds
 * Updates floor GPS calibration bounds using full-tuple set/clear operations.
 */
app.put('/api/admin/floors/:id/gps-bounds', async (c) => {
  const floorId = Number(c.req.param('id'))
  if (!Number.isInteger(floorId) || floorId <= 0) {
    return c.json({ errorCode: 'INVALID_REQUEST', error: 'floorId must be a positive integer' }, 400)
  }

  let body: unknown

  try {
    body = await c.req.json()
  } catch {
    return c.json({ errorCode: 'INVALID_REQUEST', error: 'Request body must be valid JSON' }, 400)
  }

  try {
    const result = await updateFloorGpsBoundsFromPayload(floorId, body)
    return c.json(result)
  } catch (error) {
    if (error instanceof FloorGpsBoundsError) {
      return c.json({ errorCode: error.code, error: error.message }, error.status)
    }

    console.error('Floor GPS bounds update failed:', error)
    return c.json({ errorCode: 'INTERNAL_ERROR', error: 'Failed to update floor GPS bounds' }, 500)
  }
})

/**
 * DELETE /api/admin/floors/:id
 * Deletes the floor and all its nodes + edges in FK-safe order
 * (edges first, then nodes, then floor).
 */
app.delete('/api/admin/floors/:id', async (c) => {
  try {
    const floorId = Number(c.req.param('id'))
    if (Number.isNaN(floorId)) return c.json({ error: 'Invalid floor id' }, 400)
    await db.transaction(async (tx) => {
      const floorNodeIds = await tx.select({ id: nodes.id }).from(nodes).where(eq(nodes.floorId, floorId))
      const ids = floorNodeIds.map(n => n.id)
      if (ids.length > 0) {
        await tx.delete(edges).where(inArray(edges.sourceId, ids))
        await tx.delete(edges).where(inArray(edges.targetId, ids))
        await tx.delete(nodes).where(eq(nodes.floorId, floorId))
      }
      await tx.delete(floors).where(eq(floors.id, floorId))
    })
    return c.json({ ok: true })
  } catch (err) {
    console.error('Delete floor failed:', err)
    return c.json({ error: 'Failed to delete floor' }, 500)
  }
})

/**
 * POST /api/admin/floor-plan/:buildingId/:floorNumber
 * Replaces the image for an existing floor. Saves file as
 * floor-plan-{buildingId}-{floorNumber}.{ext} and updates floors.imagePath.
 */
app.post('/api/admin/floor-plan/:buildingId/:floorNumber', async (c) => {
  try {
    const buildingId = Number(c.req.param('buildingId'))
    const floorNumber = Number(c.req.param('floorNumber'))
    if (Number.isNaN(buildingId) || Number.isNaN(floorNumber)) {
      return c.json({ error: 'Invalid building or floor number' }, 400)
    }
    const body = await c.req.parseBody()
    const file = body.image
    if (!file || !(file instanceof File)) return c.json({ error: 'No image file provided' }, 400)
    if (!file.type.startsWith('image/')) return c.json({ error: 'File must be an image' }, 400)
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
    const filename = `floor-plan-${buildingId}-${floorNumber}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())
    await r2PutBuffer(filename, buffer, file.type)
    await db.update(floors)
      .set({ imagePath: filename, updatedAt: new Date().toISOString() })
      .where(and(eq(floors.buildingId, buildingId), eq(floors.floorNumber, floorNumber)))
    return c.json({ ok: true })
  } catch (err) {
    console.error('Replace floor image failed:', err)
    return c.json({ error: 'Failed to replace floor image' }, 500)
  }
})

/**
 * POST /api/admin/floors/:id/geometry
 * Updates the vector floor plan geometry for a floor.
 * Accepts JSON body matching FloorPlanGeometry.
 */
app.post('/api/admin/floors/:id/geometry', async (c) => {
  try {
    const floorId = Number(c.req.param('id'))
    if (!Number.isInteger(floorId) || floorId <= 0) {
      return c.json({ error: 'Invalid floor id' }, 400)
    }
    const body = await c.req.json()
    if (!body || typeof body !== 'object') {
      return c.json({ error: 'Request body must be a JSON object' }, 400)
    }
    await db.update(floors)
      .set({ geometry: body, updatedAt: new Date().toISOString() })
      .where(eq(floors.id, floorId))
    return c.json({ ok: true })
  } catch (err) {
    console.error('Geometry upload failed:', err)
    return c.json({ error: 'Failed to save geometry' }, 500)
  }
})

/**
 * POST /api/admin/campus/image
 * Upsert pattern — creates Campus building+floor if they don't exist,
 * then saves the campus-map.{ext} image.
 */
app.post('/api/admin/campus/image', async (c) => {
  try {
    const body = await c.req.parseBody()
    const file = body.image
    if (!file || !(file instanceof File)) return c.json({ error: 'No image file provided' }, 400)
    if (!file.type.startsWith('image/')) return c.json({ error: 'File must be an image' }, 400)
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
    const filename = `campus-map.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())
    await r2PutBuffer(filename, buffer, file.type)
    // Upsert Campus building
    let [campusBuilding] = await db.select({ id: buildings.id }).from(buildings)
      .where(eq(buildings.name, 'Campus')).limit(1)
    if (!campusBuilding) {
      const rows = await db.insert(buildings).values({ name: 'Campus' }).returning({ id: buildings.id })
      if (rows.length === 0) throw new Error('Failed to create Campus building')
      campusBuilding = rows[0]!
    }
    // Upsert Campus floor (floorNumber = 0 is the sentinel)
    let [campusFloor] = await db.select({ id: floors.id }).from(floors)
      .where(and(eq(floors.buildingId, campusBuilding.id), eq(floors.floorNumber, 0))).limit(1)
    if (!campusFloor) {
      const rows = await db.insert(floors).values({
        buildingId: campusBuilding.id,
        floorNumber: 0,
        imagePath: filename,
        updatedAt: new Date().toISOString(),
      }).returning({ id: floors.id })
      if (rows.length === 0) throw new Error('Failed to create Campus floor')
      campusFloor = rows[0]!
    } else {
      await db.update(floors)
        .set({ imagePath: filename, updatedAt: new Date().toISOString() })
        .where(eq(floors.id, campusFloor.id))
    }
    return c.json({ ok: true, buildingId: campusBuilding.id, floorId: campusFloor.id })
  } catch (err) {
    console.error('Campus image upload failed:', err)
    return c.json({ error: 'Failed to upload campus image' }, 500)
  }
})

app.use('/*', serveStatic({ root: './dist/client' }))

app.get('/*', async (c) => {
  const html = await readFile('./dist/client/index.html', 'utf-8')
  return c.html(html)
})

const port = Number(process.env.PORT) || 3001
console.log(`Server running on http://localhost:${port}`)
serve({ fetch: app.fetch, port })
