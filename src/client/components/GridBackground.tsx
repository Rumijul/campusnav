import { Fragment } from 'react'
import { Line } from 'react-konva'

const GRID_SPACING = 30
const GRID_COLOR = '#e2e8f0'
const GRID_STROKE_WIDTH = 0.5

interface GridBackgroundProps {
  width: number
  height: number
}

/**
 * Subtle drafting-table grid pattern background.
 * Renders on a static (non-transformed) Layer so it stays fixed during pan/zoom.
 */
export default function GridBackground({ width, height }: GridBackgroundProps) {
  const lines: React.ReactElement[] = []

  // Vertical lines
  for (let x = 0; x <= width; x += GRID_SPACING) {
    lines.push(
      <Line
        key={`v-${x}`}
        points={[x, 0, x, height]}
        stroke={GRID_COLOR}
        strokeWidth={GRID_STROKE_WIDTH}
      />,
    )
  }

  // Horizontal lines
  for (let y = 0; y <= height; y += GRID_SPACING) {
    lines.push(
      <Line
        key={`h-${y}`}
        points={[0, y, width, y]}
        stroke={GRID_COLOR}
        strokeWidth={GRID_STROKE_WIDTH}
      />,
    )
  }

  return <Fragment>{lines}</Fragment>
}
