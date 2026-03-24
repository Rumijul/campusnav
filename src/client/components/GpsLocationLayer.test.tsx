import { Children, isValidElement, type ReactElement } from 'react'
import { Circle } from 'react-konva'
import { describe, expect, it } from 'vitest'
import { GpsLocationLayer } from './GpsLocationLayer'

function extractCircleElements(element: ReactElement): ReactElement[] {
  return Children.toArray(element.props.children).filter(
    (child): child is ReactElement => isValidElement(child) && child.type === Circle,
  )
}

describe('GpsLocationLayer', () => {
  it('returns null when marker visibility is disabled', () => {
    const element = GpsLocationLayer({
      visible: false,
      centerX: 200,
      centerY: 320,
      accuracyRadiusPx: 45,
      stageScale: 1,
    })

    expect(element).toBeNull()
  })

  it('renders both center dot and accuracy ring for visible fixes', () => {
    const element = GpsLocationLayer({
      visible: true,
      centerX: 120,
      centerY: 220,
      accuracyRadiusPx: 30,
      stageScale: 2,
    }) as ReactElement

    const circles = extractCircleElements(element)

    expect(circles).toHaveLength(2)

    const ring = circles.find((circle) => circle.props.name === 'gps-accuracy-ring')
    const dot = circles.find((circle) => circle.props.name === 'gps-center-dot')

    expect(ring?.props.x).toBe(120)
    expect(ring?.props.y).toBe(220)
    expect(ring?.props.radius).toBe(30)
    expect(ring?.props.strokeWidth).toBeCloseTo(1, 8)

    expect(dot?.props.x).toBe(120)
    expect(dot?.props.y).toBe(220)
    expect(dot?.props.radius).toBeCloseTo(3, 8)
    expect(dot?.props.strokeWidth).toBeCloseTo(1, 8)
  })

  it('renders only the center dot when the projected accuracy radius is zero', () => {
    const element = GpsLocationLayer({
      visible: true,
      centerX: 60,
      centerY: 80,
      accuracyRadiusPx: 0,
      stageScale: 1,
    }) as ReactElement

    const circles = extractCircleElements(element)

    expect(circles).toHaveLength(1)
    expect(circles[0]?.props.name).toBe('gps-center-dot')
  })
})
