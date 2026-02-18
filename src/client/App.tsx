import type { NavNodeType } from '@shared/types'
import { useEffect, useState } from 'react'
import { Circle, Layer, Rect, Stage, Text } from 'react-konva'

/** Placeholder node positions (normalized 0-1, converted to px at render) */
const PLACEHOLDER_NODES: { x: number; y: number; type: NavNodeType }[] = [
  { x: 0.2, y: 0.35, type: 'entrance' },
  { x: 0.35, y: 0.5, type: 'room' },
  { x: 0.5, y: 0.4, type: 'junction' },
  { x: 0.65, y: 0.55, type: 'room' },
  { x: 0.8, y: 0.45, type: 'elevator' },
  { x: 0.5, y: 0.65, type: 'stairs' },
]

export default function App() {
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  })

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const { width, height } = dimensions

  // Floor plan area dimensions (centered, with margins)
  const floorPlanMargin = 40
  const floorPlanTop = 100
  const floorPlanWidth = width - floorPlanMargin * 2
  const floorPlanHeight = height - floorPlanTop - floorPlanMargin - 60

  return (
    <Stage width={width} height={height}>
      <Layer>
        {/* Background */}
        <Rect x={0} y={0} width={width} height={height} fill="#f8fafc" />

        {/* Title */}
        <Text
          x={floorPlanMargin}
          y={20}
          text="CampusNav"
          fontSize={28}
          fontStyle="bold"
          fill="#1e293b"
        />

        {/* Subtitle */}
        <Text
          x={floorPlanMargin}
          y={56}
          text="Floor Plan Canvas — Hello Konva!"
          fontSize={16}
          fill="#64748b"
        />

        {/* Floor plan placeholder area */}
        <Rect
          x={floorPlanMargin}
          y={floorPlanTop}
          width={floorPlanWidth}
          height={floorPlanHeight}
          fill="#e2e8f0"
          cornerRadius={12}
          stroke="#cbd5e1"
          strokeWidth={1}
        />

        {/* Floor plan label */}
        <Text
          x={floorPlanMargin + 16}
          y={floorPlanTop + 12}
          text="Floor Plan Area (placeholder)"
          fontSize={13}
          fill="#94a3b8"
        />

        {/* Placeholder nodes */}
        {PLACEHOLDER_NODES.map((node) => (
          <Circle
            key={`node-${node.type}-${node.x}-${node.y}`}
            x={floorPlanMargin + node.x * floorPlanWidth}
            y={floorPlanTop + node.y * floorPlanHeight}
            radius={8}
            fill="#3b82f6"
            stroke="#1d4ed8"
            strokeWidth={2}
            shadowColor="#3b82f6"
            shadowBlur={6}
            shadowOpacity={0.3}
          />
        ))}

        {/* Confirmation text at bottom */}
        <Text
          x={floorPlanMargin}
          y={height - floorPlanMargin - 10}
          text="Phase 1 Setup Complete ✓"
          fontSize={14}
          fill="#16a34a"
          fontStyle="bold"
        />
      </Layer>
    </Stage>
  )
}
