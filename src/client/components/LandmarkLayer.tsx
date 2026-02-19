import type { NavNode, NavNodeType } from '@shared/types'
import { Layer } from 'react-konva'
import { useGraphData } from '../hooks/useGraphData'
import { LandmarkMarker } from './LandmarkMarker'

/* ──────────────── Constants ──────────────── */

const VISIBLE_NODE_TYPES: NavNodeType[] = ['room', 'entrance', 'elevator', 'restroom', 'landmark']

/* ──────────────── Props ──────────────── */

interface LandmarkLayerProps {
  imageRect: { x: number; y: number; width: number; height: number } | null
  stageScale: number
  selectedNodeId: string | null
  onSelectNode: (node: NavNode) => void
  /** Node IDs to exclude from rendering (e.g. start/dest nodes replaced by A/B pins) */
  hiddenNodeIds?: string[]
}

/* ──────────────── Component ──────────────── */

export function LandmarkLayer({
  imageRect,
  stageScale,
  selectedNodeId,
  onSelectNode,
  hiddenNodeIds,
}: LandmarkLayerProps) {
  const graphState = useGraphData()

  // Image not yet loaded — no markers
  if (imageRect === null) return null

  // Data not yet loaded or error — no markers; floor plan still usable
  if (graphState.status !== 'loaded') return null

  const visibleNodes = graphState.data.nodes.filter(
    (n) => VISIBLE_NODE_TYPES.includes(n.type) && !hiddenNodeIds?.includes(n.id),
  )

  return (
    <Layer>
      {visibleNodes.map((node) => (
        <LandmarkMarker
          key={node.id}
          node={node}
          imageRect={imageRect}
          stageScale={stageScale}
          isSelected={node.id === selectedNodeId}
          isLabelVisible={node.id === selectedNodeId || stageScale >= 2.0}
          onClick={() => onSelectNode(node)}
        />
      ))}
    </Layer>
  )
}
