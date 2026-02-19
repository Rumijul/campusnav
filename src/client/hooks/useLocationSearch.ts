import { calculateWeight } from '@shared/pathfinding/graph-builder'
import type { NavNode, NavNodeType } from '@shared/types'
import { useCallback, useState } from 'react'

/* ──────────────── Types ──────────────── */

interface LocationSearchResult {
  query: string
  results: NavNode[]
  search: (query: string) => void
  searchNearest: (fromNode: NavNode, poiType: NavNodeType) => NavNode[]
  clearSearch: () => void
}

/* ──────────────── Hook ──────────────── */

/**
 * Fuzzy location search with autocomplete and nearest-POI search.
 *
 * Filters nodes by label, roomNumber, and type (case-insensitive).
 * Only triggers when query length >= 2. Returns max 8 results.
 * Results are ordered: exact label prefix first, then substring matches.
 */
export function useLocationSearch(nodes: NavNode[]): LocationSearchResult {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<NavNode[]>([])

  const search = useCallback(
    (q: string) => {
      setQuery(q)

      if (q.length < 2) {
        setResults([])
        return
      }

      const lower = q.toLowerCase()
      const searchable = nodes.filter((n) => n.searchable)

      // Score matches: 0 = exact prefix on label, 1 = prefix on roomNumber,
      // 2 = prefix on type, 3 = substring on label/roomNumber
      const scored: Array<{ node: NavNode; score: number }> = []

      for (const node of searchable) {
        const labelLower = node.label.toLowerCase()
        const roomLower = (node.roomNumber ?? '').toLowerCase()
        const typeLower = node.type.toLowerCase()

        if (labelLower.startsWith(lower)) {
          scored.push({ node, score: 0 })
        } else if (roomLower.startsWith(lower)) {
          scored.push({ node, score: 1 })
        } else if (typeLower.startsWith(lower)) {
          scored.push({ node, score: 2 })
        } else if (labelLower.includes(lower) || roomLower.includes(lower)) {
          scored.push({ node, score: 3 })
        }
      }

      scored.sort((a, b) => a.score - b.score)
      setResults(scored.slice(0, 8).map((s) => s.node))
    },
    [nodes],
  )

  const searchNearest = useCallback(
    (fromNode: NavNode, poiType: NavNodeType): NavNode[] => {
      const candidates = nodes.filter(
        (n) => n.searchable && n.type === poiType && n.id !== fromNode.id,
      )

      const withDist = candidates.map((n) => ({
        node: n,
        dist: calculateWeight(fromNode.x, fromNode.y, n.x, n.y),
      }))

      withDist.sort((a, b) => a.dist - b.dist)
      return withDist.slice(0, 5).map((d) => d.node)
    },
    [nodes],
  )

  const clearSearch = useCallback(() => {
    setQuery('')
    setResults([])
  }, [])

  return { query, results, search, searchNearest, clearSearch }
}
