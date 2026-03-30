/**
 * Direction section grouping — groups direction steps by floor.
 *
 * Ported from src/client/components/directionSections.ts with corrected imports.
 */

import { DirectionSection, DirectionStep } from '../domain/navGraph';

/**
 * Group contiguous direction steps by floor metadata.
 *
 * Notes:
 * - Grouping is boundary-based (contiguous runs), not global merge by floor.
 * - A later return to an earlier floor creates a new section.
 */
export function groupDirectionSections(steps: DirectionStep[]): DirectionSection[] {
  const sections: DirectionSection[] = [];

  for (const step of steps) {
    const lastSection = sections[sections.length - 1];

    if (
      lastSection !== undefined &&
      lastSection.floorId === step.floorId &&
      lastSection.floorNumber === step.floorNumber
    ) {
      lastSection.steps.push(step);
      continue;
    }

    sections.push({
      floorId: step.floorId,
      floorNumber: step.floorNumber,
      steps: [step],
    });
  }

  return sections;
}
