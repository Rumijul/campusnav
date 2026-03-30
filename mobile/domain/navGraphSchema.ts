import { NavGraph } from '../../src/shared/types';
import { z } from 'zod';

const navNodeTypeValues = [
  'room',
  'entrance',
  'elevator',
  'stairs',
  'ramp',
  'restroom',
  'junction',
  'hallway',
  'landmark',
] as const;

const finiteNumber = z.number().finite();
const normalizedCoordinate = finiteNumber.min(0).max(1);
const positiveInt = z.number().int().positive();

const navFloorGpsBoundsSchema = z
  .object({
    minLat: finiteNumber,
    maxLat: finiteNumber,
    minLng: finiteNumber,
    maxLng: finiteNumber,
  })
  .strict()
  .refine((bounds) => bounds.minLat < bounds.maxLat && bounds.minLng < bounds.maxLng, {
    message: 'gpsBounds must satisfy minLat < maxLat and minLng < maxLng',
  });

const navNodeSchema = z
  .object({
    id: z.string().min(1),
    x: normalizedCoordinate,
    y: normalizedCoordinate,
    label: z.string(),
    type: z.enum(navNodeTypeValues),
    searchable: z.boolean(),
    floorId: positiveInt,
    roomNumber: z.string().optional(),
    description: z.string().optional(),
    accessibilityNotes: z.string().optional(),
    connectsToFloorAboveId: positiveInt.optional(),
    connectsToFloorBelowId: positiveInt.optional(),
    connectsToNodeAboveId: z.string().min(1).optional(),
    connectsToNodeBelowId: z.string().min(1).optional(),
    connectsToBuildingId: positiveInt.optional(),
  })
  .strict();

const navEdgeSchema = z
  .object({
    id: z.string().min(1),
    sourceId: z.string().min(1),
    targetId: z.string().min(1),
    standardWeight: finiteNumber.min(0),
    accessibleWeight: finiteNumber.min(0),
    accessible: z.boolean(),
    bidirectional: z.boolean(),
    accessibilityNotes: z.string().optional(),
  })
  .strict();

const navFloorSchema = z
  .object({
    id: positiveInt,
    floorNumber: z.number().int(),
    imagePath: z.string().min(1),
    updatedAt: z.string().min(1),
    gpsBounds: navFloorGpsBoundsSchema.optional(),
    nodes: z.array(navNodeSchema),
    edges: z.array(navEdgeSchema),
  })
  .strict();

const navBuildingSchema = z
  .object({
    id: positiveInt,
    name: z.string().min(1),
    floors: z.array(navFloorSchema),
  })
  .strict();

export const navGraphContractSchema = z
  .object({
    buildings: z.array(navBuildingSchema),
  })
  .strict();

export NavGraphContract = z.output<typeof navGraphContractSchema>;

export interface NavGraphContractValidationError {
  reason: 'contract-validation-error';
  message: string;
  issues: string[];
}

export NavGraphValidationResult =
  | { ok: true; data: NavGraph }
  | { ok: false; error: NavGraphContractValidationError };

function formatIssuePath(path: PropertyKey[]): string {
  if (path.length === 0) {
    return 'root';
  }

  return path
    .map((segment) => {
      if (typeof segment === 'number') {
        return `[${segment}]`;
      }

      return typeof segment === 'symbol' ? segment.toString() : segment;
    })
    .join('.');
}

export function validateNavGraphPayload(payload: unknown): NavGraphValidationResult {
  const parsed = navGraphContractSchema.safeParse(payload);

  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `${formatIssuePath(issue.path)}: ${issue.message}`);

    return {
      ok: false,
      error: {
        reason: 'contract-validation-error',
        message: 'Map payload failed contract validation.',
        issues,
      },
    };
  }

  const data: NavGraph = parsed.data;

  return {
    ok: true,
    data,
  };
}
