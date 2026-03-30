/**
 * Tests for groupDirectionSections.
 */

import { describe, expect, it } from 'vitest';
import type { DirectionStep } from '../domain/navGraph';
import { groupDirectionSections } from './directionSections';

/**
 * Create a test direction step.
 */
function makeStep(
  instruction: string,
  floorId: number,
  floorNumber: number = floorId,
  icon: DirectionStep['icon'] = 'straight',
): DirectionStep {
  return {
    instruction,
    icon,
    distanceM: 1,
    durationSec: 10,
    isAccessibleSegment: false,
    floorId,
    floorNumber,
  };
}

describe('groupDirectionSections', () => {
  it('returns empty array for empty steps', () => {
    const sections = groupDirectionSections([]);
    expect(sections).toEqual([]);
  });

  it('returns one section for a single-floor direction set', () => {
    const steps = [
      makeStep('Continue straight', 1, 1),
      makeStep('Turn left', 1, 1),
      makeStep('Arrive', 1, 1),
    ];

    const sections = groupDirectionSections(steps);

    expect(sections).toHaveLength(1);
    expect(sections[0]).toMatchObject({ floorId: 1, floorNumber: 1 });
    expect(sections[0]?.steps).toEqual(steps);
  });

  it('splits sections at floor boundaries for cross-floor directions', () => {
    const steps = [
      makeStep('Head to stairs', 1, 1),
      makeStep('Take the stairs up to Floor 2', 1, 1, 'stairs-up'),
      makeStep('Continue straight', 2, 2),
      makeStep('Arrive at Lab', 2, 2, 'arrive'),
    ];

    const sections = groupDirectionSections(steps);

    expect(sections).toHaveLength(2);
    expect(sections.map((section) => section.floorNumber)).toEqual([1, 2]);
    expect(sections.map((section) => section.steps.length)).toEqual([2, 2]);
    expect(sections[0]?.steps[1]?.instruction).toBe('Take the stairs up to Floor 2');
    expect(sections[1]?.steps[0]?.instruction).toBe('Continue straight');
  });

  it('creates a new section when directions later return to a previous floor', () => {
    const steps = [
      makeStep('Walk to stairs', 1, 1),
      makeStep('Take the stairs up to Floor 2', 1, 1, 'stairs-up'),
      makeStep('Continue on Floor 2', 2, 2),
      makeStep('Take the stairs down to Floor 1', 2, 2, 'stairs-down'),
      makeStep('Arrive on Floor 1', 1, 1, 'arrive'),
    ];

    const sections = groupDirectionSections(steps);

    expect(sections).toHaveLength(3);
    expect(sections.map((section) => section.floorNumber)).toEqual([1, 2, 1]);
    expect(sections.map((section) => section.steps.length)).toEqual([2, 2, 1]);
    expect(sections[2]?.steps[0]?.instruction).toBe('Arrive on Floor 1');
  });

  it('handles elevator floor changes correctly', () => {
    const steps = [
      makeStep('Walk to elevator', 1, 1),
      makeStep('Take the elevator up to Floor 2', 1, 1, 'elevator'),
      makeStep('Exit elevator', 2, 2),
      makeStep('Arrive at Room', 2, 2, 'arrive'),
    ];

    const sections = groupDirectionSections(steps);

    expect(sections).toHaveLength(2);
    expect(sections[0]?.floorNumber).toBe(1);
    expect(sections[1]?.floorNumber).toBe(2);
  });

  it('groups steps with same floorId but different floorNumber', () => {
    // This shouldn't happen in practice, but the function should use both floorId and floorNumber
    const steps = [
      makeStep('Step 1', 1, 1),
      makeStep('Step 2', 1, 2), // Same floorId, different floorNumber
      makeStep('Step 3', 1, 2),
    ];

    const sections = groupDirectionSections(steps);

    expect(sections).toHaveLength(2);
    expect(sections[0]?.steps).toHaveLength(1);
    expect(sections[1]?.steps).toHaveLength(2);
  });

  it('handles ramp floor changes', () => {
    const steps = [
      makeStep('Walk to ramp', 1, 1),
      makeStep('Take the ramp up to Floor 2', 1, 1, 'ramp'),
      makeStep('Continue straight', 2, 2),
      makeStep('Arrive', 2, 2, 'arrive'),
    ];

    const sections = groupDirectionSections(steps);

    expect(sections).toHaveLength(2);
    expect(sections[0]?.steps[1]?.icon).toBe('ramp');
  });
});
