import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { NavGraph } from '@shared/types'
import { db } from './client'
import { edges, graphMetadata, nodes } from './schema'

const __dirname = dirname(fileURLToPath(import.meta.url))

export async function seedIfEmpty(): Promise<void> {
  // Cheap count check — no-op if already seeded
  const existing = await db.select().from(nodes)
  if (existing.length > 0) {
    console.log(`[seed] Already seeded (${existing.length} nodes) — skipping`)
    return
  }

  const filePath = resolve(__dirname, '../assets/campus-graph.json')
  const graph: NavGraph = JSON.parse(readFileSync(filePath, 'utf-8'))

  // Map NavNode fields to schema column names
  // NavNode has camelCase fields; schema columns are snake_case but Drizzle
  // accepts the JS camelCase property names defined in schema.ts
  await db
    .insert(nodes)
    .values(
      graph.nodes.map((n) => ({
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
      })),
    )
    .onConflictDoNothing()

  await db
    .insert(edges)
    .values(
      graph.edges.map((e) => ({
        id: e.id,
        sourceId: e.sourceId,
        targetId: e.targetId,
        standardWeight: e.standardWeight,
        accessibleWeight: e.accessibleWeight, // Keep 1e10 as-is — DO NOT convert to Infinity (JSON cannot serialize Infinity)
        accessible: e.accessible,
        bidirectional: e.bidirectional,
        accessibilityNotes: e.accessibilityNotes ?? null,
      })),
    )
    .onConflictDoNothing()

  await db
    .insert(graphMetadata)
    .values([{
      buildingName: graph.metadata.buildingName,
      floor: graph.metadata.floor,
      lastUpdated: graph.metadata.lastUpdated,
    }])
    .onConflictDoNothing()

  console.log(`[seed] Inserted ${graph.nodes.length} nodes, ${graph.edges.length} edges`)
}
