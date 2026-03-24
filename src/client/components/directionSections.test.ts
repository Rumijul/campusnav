import { describe, expect, it } from 'vitest'
import type { DirectionStep } from '../hooks/useRouteDirections'
import { groupDirectionSections } from './directionSections'

function makeStep(
  instruction: string,
  floorId: number,
  floorNumber: number = floorId,
): DirectionStep {
  return {
    instruction,
    icon: 'straight',
    distanceM: 1,
    durationSec: 10,
    isAccessibleSegment: false,
    floorId,
    floorNumber,
  }
}

describe('groupDirectionSections', () => {
  it('returns one section for a single-floor direction set', () => {
    const steps = [
      makeStep('Continue straight', 1),
      makeStep('Turn left', 1),
      makeStep('Arrive', 1),
    ]

    const sections = groupDirectionSections(steps)

    expect(sections).toHaveLength(1)
    expect(sections[0]).toMatchObject({ floorId: 1, floorNumber: 1 })
    expect(sections[0]?.steps).toEqual(steps)
  })

  it('splits sections at floor boundaries for cross-floor directions', () => {
    const steps = [
      makeStep('Head to stairs', 1, 1),
      makeStep('Take the stairs up to Floor 2', 1, 1),
      makeStep('Continue straight', 2, 2),
      makeStep('Arrive at Lab', 2, 2),
    ]

    const sections = groupDirectionSections(steps)

    expect(sections).toHaveLength(2)
    expect(sections.map((section) => section.floorNumber)).toEqual([1, 2])
    expect(sections.map((section) => section.steps.length)).toEqual([2, 2])
    expect(sections[0]?.steps[1]?.instruction).toBe('Take the stairs up to Floor 2')
    expect(sections[1]?.steps[0]?.instruction).toBe('Continue straight')
  })

  it('creates a new section when directions later return to a previous floor', () => {
    const steps = [
      makeStep('Walk to stairs', 1, 1),
      makeStep('Take the stairs up to Floor 2', 1, 1),
      makeStep('Continue on Floor 2', 2, 2),
      makeStep('Take the stairs down to Floor 1', 2, 2),
      makeStep('Arrive on Floor 1', 1, 1),
    ]

    const sections = groupDirectionSections(steps)

    expect(sections).toHaveLength(3)
    expect(sections.map((section) => section.floorNumber)).toEqual([1, 2, 1])
    expect(sections.map((section) => section.steps.length)).toEqual([2, 2, 1])
    expect(sections[2]?.steps[0]?.instruction).toBe('Arrive on Floor 1')
  })
})
