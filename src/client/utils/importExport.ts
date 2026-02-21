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
  floor: z.number().int().positive(),
  roomNumber: z.string().optional(),
  description: z.string().optional(),
  buildingName: z.string().optional(),
  accessibilityNotes: z.string().optional(),
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

const navGraphSchema = z.object({
  nodes: z.array(navNodeSchema),
  edges: z.array(navEdgeSchema),
  metadata: z
    .object({
      buildingName: z.string(),
      floor: z.number(),
      lastUpdated: z.string(),
    })
    .optional(),
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

export function exportJson(nodes: NavNode[], edges: NavEdge[]): void {
  const graph: NavGraph = {
    nodes,
    edges,
    metadata: {
      buildingName: 'Main Building',
      floor: 1,
      lastUpdated: new Date().toISOString(),
    },
  }
  triggerDownload(JSON.stringify(graph, null, 2), 'application/json', 'campus-graph.json')
}

// ─── CSV export ───────────────────────────────────────────────────────────────

export function exportNodesCsv(nodes: NavNode[]): void {
  const header = toCsvRow([
    'id',
    'label',
    'type',
    'floor',
    'roomNumber',
    'searchable',
    'x',
    'y',
    'description',
    'buildingName',
    'accessibilityNotes',
  ])
  const rows = nodes.map((n) =>
    toCsvRow([
      n.id,
      n.label,
      n.type,
      n.floor,
      n.roomNumber ?? '',
      n.searchable,
      n.x,
      n.y,
      n.description ?? '',
      n.buildingName ?? '',
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
  return {
    ok: true,
    data: { nodes: result.data.nodes as NavNode[], edges: result.data.edges as NavEdge[] },
  }
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
      floor: Number(row.floor),
      roomNumber: row.roomNumber || undefined,
      description: row.description || undefined,
      buildingName: row.buildingName || undefined,
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
