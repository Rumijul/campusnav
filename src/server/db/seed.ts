import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { db } from './client'
import { buildings, edges, floors, nodes } from './schema'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Local types matching the nested JSON seed format.
// NavGraph is the API type (with floorId on nodes); SeedGraph is the simpler seed-file type.
type SeedNode = {
  id: string
  x: number
  y: number
  label: string
  type: string
  searchable: boolean
  roomNumber?: string
  description?: string
  accessibilityNotes?: string
}
type SeedEdge = {
  id: string
  sourceId: string
  targetId: string
  standardWeight: number
  accessibleWeight: number
  accessible: boolean
  bidirectional: boolean
  accessibilityNotes?: string
}
type SeedFloor = { floorNumber: number; imagePath: string; nodes: SeedNode[]; edges: SeedEdge[] }
type SeedBuilding = { id: number; name: string; floors: SeedFloor[] }
type SeedGraph = { buildings: SeedBuilding[] }

export async function seedIfEmpty(): Promise<void> {
  // Cheap count check — no-op if already seeded
  const existing = await db.select().from(nodes)
  if (existing.length > 0) {
    console.log(`[seed] Already seeded (${existing.length} nodes) — skipping`)
    return
  }

  const filePath = resolve(__dirname, '../assets/campus-graph.json')
  const graph: SeedGraph = JSON.parse(readFileSync(filePath, 'utf-8'))

  let totalNodes = 0
  let totalEdges = 0

  for (const b of graph.buildings) {
    const buildingRows = await db.insert(buildings).values({ name: b.name }).returning({ id: buildings.id })
    const building = buildingRows[0]
    if (!building) throw new Error(`[seed] Failed to insert building: ${b.name}`)

    for (const f of b.floors) {
      const floorRows = await db.insert(floors).values({
        buildingId: building.id,
        floorNumber: f.floorNumber,
        imagePath: f.imagePath,
        updatedAt: new Date().toISOString(),
      }).returning({ id: floors.id })
      const floor = floorRows[0]
      if (!floor) throw new Error(`[seed] Failed to insert floor: ${f.floorNumber} for building ${b.name}`)

      await db.insert(nodes).values(
        f.nodes.map((n) => ({
          id: n.id,
          x: n.x,
          y: n.y,
          label: n.label,
          type: n.type,
          searchable: n.searchable,
          floorId: floor.id, // assigned from RETURNING — not in JSON
          roomNumber: n.roomNumber ?? null,
          description: n.description ?? null,
          accessibilityNotes: n.accessibilityNotes ?? null,
          // connector linkage defaults to null for all seed nodes (none are cross-floor yet)
          connectsToFloorAboveId: null,
          connectsToFloorBelowId: null,
          connectsToNodeAboveId: null,
          connectsToNodeBelowId: null,
        }))
      ).onConflictDoNothing()

      await db.insert(edges).values(
        f.edges.map((e) => ({
          id: e.id,
          sourceId: e.sourceId,
          targetId: e.targetId,
          standardWeight: e.standardWeight,
          accessibleWeight: e.accessibleWeight, // Keep 1e10 as-is — DO NOT convert to Infinity (JSON cannot serialize Infinity)
          accessible: e.accessible,
          bidirectional: e.bidirectional,
          accessibilityNotes: e.accessibilityNotes ?? null,
        }))
      ).onConflictDoNothing()

      totalNodes += f.nodes.length
      totalEdges += f.edges.length
    }
  }

  console.log(`[seed] Inserted ${totalNodes} nodes, ${totalEdges} edges`)
}
