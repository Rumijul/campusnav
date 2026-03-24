/**
 * Core navigation graph type definitions for CampusNav.
 *
 * Two categories of types:
 *
 * 1. **ngraph.graph data types** — `NavNodeData` and `NavEdgeData` are the `.data`
 *    fields stored on ngraph.graph's Node and Link objects via
 *    `graph.addNode(id, data)` and `graph.addLink(from, to, data)`.
 *
 * 2. **Serialization types** — `NavNode`, `NavEdge`, `NavFloor`, `NavBuilding`,
 *    and `NavGraph` are the JSON shapes used for API transport (GET /api/map) and
 *    file storage. The client loads a `NavGraph`, iterates `buildings[].floors[]`,
 *    destructures each node/edge into `(id, data)`, and feeds them into ngraph.graph.
 *    `NavNode` objects live inside `NavFloor.nodes[]`.
 *
 * All coordinates are **NORMALIZED** (0.0–1.0), representing percentages of the
 * floor plan image dimensions. Convert to pixels only at render time:
 * `pixelX = node.x * canvasWidth`.
 */

// ============================================================
// Node Types
// ============================================================

/**
 * Classification of navigation nodes on a floor plan.
 *
 * **Visible to students** (searchable destinations):
 * - `room` — Classroom, office, lab
 * - `entrance` — Building entrance/exit
 * - `elevator` — Elevator (also an accessibility waypoint)
 * - `restroom` — Restroom
 * - `landmark` — Named point of interest (cafeteria, library)
 *
 * **Invisible to students** (routing infrastructure only):
 * - `stairs` — Stairwell navigation waypoint, HIDDEN from student map (routing infrastructure only)
 * - `ramp` — Ramp navigation waypoint, HIDDEN from student map (routing infrastructure only)
 * - `junction` — Hallway intersection
 * - `hallway` — Mid-hallway point
 */
export type NavNodeType =
  | 'room'
  | 'entrance'
  | 'elevator'
  | 'stairs'
  | 'ramp'
  | 'restroom'
  | 'junction'
  | 'hallway'
  | 'landmark'

/**
 * Data stored on each graph node (the `.data` field of an ngraph.graph Node).
 *
 * Coordinates are normalized 0.0–1.0: percentage of floor plan width/height.
 */
export interface NavNodeData {
  /** Normalized x position (0.0 = left edge, 1.0 = right edge of floor plan) */
  x: number
  /** Normalized y position (0.0 = top edge, 1.0 = bottom edge of floor plan) */
  y: number
  /** Display label for search results and turn-by-turn directions */
  label: string
  /** Node classification — determines visibility and search behavior */
  type: NavNodeType
  /** Whether this node appears in student search results */
  searchable: boolean
  /** ID of the floors record this node belongs to (FK → floors.id) */
  floorId: number
  // buildingName REMOVED — derived transitively via floor → building
  /** Room/office number identifier (e.g. "204", "A-102") */
  roomNumber?: string
  /** Human-readable description shown in location detail sheet */
  description?: string
  /** Accessibility information shown in detail sheet */
  accessibilityNotes?: string
  // Floor connector linkage — only set on stairs, elevator, ramp nodes
  /** ID of the floor above that this connector node links to */
  connectsToFloorAboveId?: number
  /** ID of the floor below that this connector node links to */
  connectsToFloorBelowId?: number
  /** ID of the corresponding node on the floor above */
  connectsToNodeAboveId?: string
  /** ID of the corresponding node on the floor below */
  connectsToNodeBelowId?: string
  /** ID of the building this campus entrance marker bridges to (campus map only, entrance nodes) */
  connectsToBuildingId?: number
}

// ============================================================
// Edge Types
// ============================================================

/**
 * Data stored on each graph edge (the `.data` field of an ngraph.graph Link).
 *
 * Every edge carries **dual weights** to enable accessibility routing:
 * - `standardWeight`: cost for the standard walking route
 * - `accessibleWeight`: cost for the wheelchair-accessible route
 *   (same as standard for flat paths; higher for detours like ramps;
 *   `Infinity` for non-accessible edges like stairs)
 */
export interface NavEdgeData {
  /**
   * Walking cost for the standard route.
   * Typically the Euclidean distance between connected nodes in normalized
   * coordinates. Can be overridden by an admin for non-straight paths.
   */
  standardWeight: number
  /**
   * Walking cost for the wheelchair-accessible route.
   * - Same as `standardWeight` for accessible paths.
   * - Higher than `standardWeight` if the accessible path is longer (e.g. ramp).
   * - `Infinity` for non-accessible edges (e.g. stairs without elevator).
   */
  accessibleWeight: number
  /** Whether this edge is traversable by wheelchair */
  accessible: boolean
  /** Whether this edge can be traversed in both directions */
  bidirectional: boolean
  /** Optional admin notes ("3 steps", "narrow doorway", "automatic door") */
  accessibilityNotes?: string
}

// ============================================================
// Serialization Types (API / JSON transport)
// ============================================================

/**
 * A serialized node for JSON transport (API responses, file storage).
 * Combines the node's unique ID with its data fields.
 * NavNode inherits `floorId` from NavNodeData — no direct change needed.
 */
export interface NavNode extends NavNodeData {
  /** Unique identifier for this node (e.g. "room-204", "entrance-main") */
  id: string
}

/**
 * A serialized edge for JSON transport (API responses, file storage).
 * Combines the edge's ID, endpoint references, and data fields.
 */
export interface NavEdge extends NavEdgeData {
  /** Unique identifier for this edge */
  id: string
  /** Source node ID */
  sourceId: string
  /** Target node ID */
  targetId: string
}

/**
 * Optional real-world GPS bounds used to project normalized floor coordinates
 * onto latitude/longitude space.
 */
export interface NavFloorGpsBounds {
  /** Minimum latitude represented by this floor map */
  minLat: number
  /** Maximum latitude represented by this floor map */
  maxLat: number
  /** Minimum longitude represented by this floor map */
  minLng: number
  /** Maximum longitude represented by this floor map */
  maxLng: number
}

/**
 * A single floor within a building, containing all nodes and edges on that floor.
 */
export interface NavFloor {
  /** Database ID of this floor record (floors.id) */
  id: number
  /** Floor number (1-based) */
  floorNumber: number
  /** Path to the floor plan image asset */
  imagePath: string
  /** ISO 8601 timestamp of last graph modification */
  updatedAt: string
  /** Optional GPS calibration bounds for this floor */
  gpsBounds?: NavFloorGpsBounds
  /** All navigation nodes on this floor */
  nodes: NavNode[]
  /** All navigation edges on this floor */
  edges: NavEdge[]
}

/**
 * A building containing one or more floors.
 */
export interface NavBuilding {
  /** Database ID of this building record (buildings.id) */
  id: number
  /** Display name of the building */
  name: string
  /** All floors within this building */
  floors: NavFloor[]
}

/**
 * Complete navigation graph as JSON — returned by `GET /api/map`.
 *
 * The client loads this on page init and builds an ngraph.graph instance
 * by iterating the nested buildings → floors → nodes/edges structure:
 * ```ts
 * const graph = createGraph<NavNodeData, NavEdgeData>()
 * for (const building of navGraph.buildings) {
 *   for (const floor of building.floors) {
 *     for (const { id, ...data } of floor.nodes) graph.addNode(id, data)
 *     for (const { id, sourceId, targetId, ...data } of floor.edges)
 *       graph.addLink(sourceId, targetId, data)
 *   }
 * }
 * ```
 */
export interface NavGraph {
  /** All buildings in the campus, each containing floors with nodes and edges */
  buildings: NavBuilding[]
  // nodes and edges now live under buildings[].floors[].nodes/edges
  // metadata replaced by floors[].updatedAt
}
