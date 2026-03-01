import type { NavEdge, NavGraph, NavNode, NavNodeType } from '@shared/types'
import Papa from 'papaparse'
import { z } from 'zod'

// ─── Zod schemas for validation ───────────────────────────────────────────────

const navNodeTypeValues: [NavNodeType, ...NavNodeType[]] = [
  'room',
  'entrance',
  'elevator',
  'stairs',
  'ramp',
  'restroom',
  'junction',
  'hallway',
  'landmark',
]

const navNodeSchema = z.object({
  id: z.string().min(1),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  label: z.string().min(1),
  type: z.enum(navNodeTypeValues),
  searchable: z.boolean(),
  floorId: z.number().int().positive(),
  roomNumber: z.string().optional(),
  description: z.string().optional(),
  accessibilityNotes: z.string().optional(),
  connectsToFloorAboveId: z.number().int().positive().optional(),
  connectsToFloorBelowId: z.number().int().positive().optional(),
  connectsToNodeAboveId: z.string().optional(),
  connectsToNodeBelowId: z.string().optional(),
})

const navEdgeSchema = z.object({
  id: z.string().min(1),
  sourceId: z.string().min(1),
  targetId: z.string().min(1),
  standardWeight: z.number().positive(),
  accessibleWeight: z.number().positive(),
  accessible: z.boolean(),
  bidirectional: z.boolean(),
  accessibilityNotes: z.string().optional(),
})

const navFloorSchema = z.object({
  id: z.number().int().positive(),
  floorNumber: z.number().int().positive(),
  imagePath: z.string().min(1),
  updatedAt: z.string().min(1),
  nodes: z.array(navNodeSchema),
  edges: z.array(navEdgeSchema),
})

const navBuildingSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  floors: z.array(navFloorSchema),
})

const navGraphSchema = z.object({
  buildings: z.array(navBuildingSchema),
})

// ─── Download helper ──────────────────────────────────────────────────────────

function triggerDownload(content: string, mimeType: string, filename: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ─── CSV quoting helper ───────────────────────────────────────────────────────

function toCsvRow(values: (string | number | boolean | undefined | null)[]): string {
  return values
    .map((v) => {
      const s = v == null ? '' : String(v)
      return /[,"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    })
    .join(',')
}

// ─── JSON export ──────────────────────────────────────────────────────────────

/**
 * Exports nodes and edges as a NavGraph JSON file.
 * Wraps the flat editor state into a single-building/single-floor NavGraph.
 */
export function exportJson(nodes: NavNode[], edges: NavEdge[]): void {
  const graph: NavGraph = {
    buildings: [
      {
        id: 1,
        name: 'Main Building',
        floors: [
          {
            id: 1,
            floorNumber: 1,
            imagePath: 'floor-plan.png',
            updatedAt: new Date().toISOString(),
            nodes,
            edges,
          },
        ],
      },
    ],
  }
  triggerDownload(JSON.stringify(graph, null, 2), 'application/json', 'campus-graph.json')
}

// ─── CSV export ───────────────────────────────────────────────────────────────

export function exportNodesCsv(nodes: NavNode[]): void {
  const header = toCsvRow([
    'id',
    'label',
    'type',
    'floorId',
    'roomNumber',
    'searchable',
    'x',
    'y',
    'description',
    'accessibilityNotes',
  ])
  const rows = nodes.map((n) =>
    toCsvRow([
      n.id,
      n.label,
      n.type,
      n.floorId,
      n.roomNumber ?? '',
      n.searchable,
      n.x,
      n.y,
      n.description ?? '',
      n.accessibilityNotes ?? '',
    ]),
  )
  const csv = `\ufeff${[header, ...rows].join('\n')}`
  triggerDownload(csv, 'text/csv', 'nodes.csv')
}

export function exportEdgesCsv(edges: NavEdge[]): void {
  const header = toCsvRow([
    'id',
    'sourceId',
    'targetId',
    'standardWeight',
    'accessibleWeight',
    'accessible',
    'bidirectional',
    'accessibilityNotes',
  ])
  const rows = edges.map((e) =>
    toCsvRow([
      e.id,
      e.sourceId,
      e.targetId,
      e.standardWeight,
      e.accessibleWeight,
      e.accessible,
      e.bidirectional,
      e.accessibilityNotes ?? '',
    ]),
  )
  const csv = `\ufeff${[header, ...rows].join('\n')}`
  triggerDownload(csv, 'text/csv', 'edges.csv')
}

// ─── JSON import ──────────────────────────────────────────────────────────────

export type ImportResult<T> = { ok: true; data: T } | { ok: false; errors: string[] }

/**
 * Parses a NavGraph JSON string and returns the flattened nodes and edges.
 * Supports both the new multi-floor format (buildings[].floors[]) and
 * validates against the full NavGraph schema.
 */
export function handleJsonImport(
  jsonText: string,
): ImportResult<{ nodes: NavNode[]; edges: NavEdge[] }> {
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    return { ok: false, errors: ['File is not valid JSON'] }
  }
  const result = navGraphSchema.safeParse(parsed)
  if (!result.success) {
    const errors = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`)
    return { ok: false, errors }
  }
  // Flatten buildings → floors → nodes/edges for the flat editor state
  const nodes = result.data.buildings.flatMap((b) => b.floors.flatMap((f) => f.nodes as NavNode[]))
  const edges = result.data.buildings.flatMap((b) => b.floors.flatMap((f) => f.edges as NavEdge[]))
  return { ok: true, data: { nodes, edges } }
}

// ─── CSV import ───────────────────────────────────────────────────────────────

export function parseNodesCsv(csvText: string): ImportResult<NavNode[]> {
  const result = Papa.parse<Record<string, string>>(csvText, { header: true, skipEmptyLines: true })
  const errors: string[] = []
  const nodes: NavNode[] = []

  if (result.errors.length > 0) {
    return { ok: false, errors: result.errors.map((e) => `Row ${e.row ?? '?'}: ${e.message}`) }
  }

  for (let i = 0; i < result.data.length; i++) {
    const row = result.data[i]
    if (!row) continue
    const parsed = navNodeSchema.safeParse({
      id: row.id,
      x: Number(row.x),
      y: Number(row.y),
      label: row.label,
      type: row.type,
      searchable: row.searchable === 'true',
      floorId: Number(row.floorId),
      roomNumber: row.roomNumber || undefined,
      description: row.description || undefined,
      accessibilityNotes: row.accessibilityNotes || undefined,
    })
    if (!parsed.success) {
      errors.push(
        ...parsed.error.issues.map((e) => `Row ${i + 2}: ${e.path.join('.')}: ${e.message}`),
      )
    } else {
      nodes.push(parsed.data as NavNode)
    }
  }

  if (errors.length > 0) return { ok: false, errors }
  return { ok: true, data: nodes }
}

export function parseEdgesCsv(csvText: string): ImportResult<NavEdge[]> {
  const result = Papa.parse<Record<string, string>>(csvText, { header: true, skipEmptyLines: true })
  const errors: string[] = []
  const edges: NavEdge[] = []

  if (result.errors.length > 0) {
    return { ok: false, errors: result.errors.map((e) => `Row ${e.row ?? '?'}: ${e.message}`) }
  }

  for (let i = 0; i < result.data.length; i++) {
    const row = result.data[i]
    if (!row) continue
    const parsed = navEdgeSchema.safeParse({
      id: row.id,
      sourceId: row.sourceId,
      targetId: row.targetId,
      standardWeight: Number(row.standardWeight),
      accessibleWeight: Number(row.accessibleWeight),
      accessible: row.accessible === 'true',
      bidirectional: row.bidirectional === 'true',
      accessibilityNotes: row.accessibilityNotes || undefined,
    })
    if (!parsed.success) {
      errors.push(
        ...parsed.error.issues.map((e) => `Row ${i + 2}: ${e.path.join('.')}: ${e.message}`),
      )
    } else {
      edges.push(parsed.data as NavEdge)
    }
  }

  if (errors.length > 0) return { ok: false, errors }
  return { ok: true, data: edges }
}

// ─── FileReader helper ────────────────────────────────────────────────────────

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file, 'utf-8')
  })
}
