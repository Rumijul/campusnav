/**
 * NodeMarkersOverlay — renders individual nav nodes as tappable dots on the
 * floor plan, synchronized with pan/pinch/rotate gesture transforms.
 *
 * Each dot:
 * - Is color-coded by node type (connector types distinct from rooms/POIs)
 * - Transforms with the map gesture state via screenFromWorld()
 * - Hidden when zoomed out too far (scale < minScaleToShow)
 * - Filtered to the active floor
 *
 * Renders ABOVE the floor plan image (pointerEvents="box-none" so map
 * pan/pinch still works through transparent dot areas).
 */

import { memo, useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import {
  MapTransform,
  screenFromWorld,
  ViewportDimensions,
  ViewportPoint,
} from '../../map/mapTransform';
import { NormalizedNodeRecord } from '../../domain/navGraph';

interface Props {
  /** All normalized node records from the graph (pre-filtered to active floor). */
  nodes: NormalizedNodeRecord[];
  viewport: ViewportDimensions;
  scale: number;
  transform: MapTransform;
  activeFloorId: number;
  selectedNodeId: string | null;
  onNodePress?: (record: NormalizedNodeRecord) => void;
  /** Minimum scale below which markers are hidden (default 0.6). */
  minScaleToShow?: number;
}

const DOT_RADIUS = 5;
const CONNECTOR_DOT_RADIUS = 4;
const SELECTION_RING_SIZE = 10;

const TYPES_THAT_SHOW_ALWAYS = new Set(['entrance', 'landmark', 'restroom']);
const CONNECTOR_TYPES = new Set(['elevator', 'ramp', 'stairs']);

/**
 * Return the dot radius for a node type.
 * Connector types (stairs/elevator/ramp) get a slightly smaller dot.
 */
function dotRadius(nodeType: string): number {
  return CONNECTOR_TYPES.has(nodeType) ? CONNECTOR_DOT_RADIUS : DOT_RADIUS;
}

/**
 * Return the dot color for a node type.
 * Connector types use distinct colors; POI types use a consistent blue.
 */
function dotColor(nodeType: string): string {
  switch (nodeType) {
    case 'elevator': return '#60a5fa'; // blue — accessible
    case 'ramp':     return '#34d399'; // green — accessible
    case 'stairs':   return '#fb923c'; // orange — stairs
    case 'entrance': return '#4ade80'; // green
    case 'landmark':  return '#a78bfa'; // purple
    case 'restroom': return '#f472b6'; // pink
    case 'room':     return '#60a5fa'; // blue
    case 'junction': return '#94a3b8'; // gray
    case 'hallway':  return '#94a3b8'; // gray
    default:         return '#60a5fa';
  }
}

interface MarkerDotProps {
  record: NormalizedNodeRecord;
  screenPos: ViewportPoint;
  radius: number;
  color: string;
  selected: boolean;
  onPress?: (record: NormalizedNodeRecord) => void;
}

function MarkerDot({ record, screenPos, radius, color, selected, onPress }: MarkerDotProps) {
  const handlePress = useCallback(() => {
    onPress?.(record);
  }, [record, onPress]);

  return (
    <Pressable
      hitSlop={8}
      onPress={handlePress}
      style={[
        styles.dot,
        {
          left: screenPos.x - radius,
          top: screenPos.y - radius,
          width: radius * 2,
          height: radius * 2,
          borderRadius: radius,
          backgroundColor: color,
          borderColor: selected ? '#ffffff' : 'transparent',
          borderWidth: selected ? 2 : 0,
        },
      ]}
    >
      {selected && (
        <View
          style={[
            styles.selectionRing,
            {
              left: -(SELECTION_RING_SIZE - radius * 2) / 2,
              top: -(SELECTION_RING_SIZE - radius * 2) / 2,
              width: SELECTION_RING_SIZE,
              height: SELECTION_RING_SIZE,
              borderRadius: SELECTION_RING_SIZE / 2,
            },
          ]}
          pointerEvents="none"
        />
      )}
    </Pressable>
  );
}

/**
 * NodeMarkersOverlay — renders nav node dots for the active floor.
 *
 * Visibility rules:
 * - Hidden when scale < minScaleToShow (prevents clutter when zoomed out)
 * - Hidden when viewport has zero size
 * - Non-searchable nodes shown only if they are entrance/landmark/restroom
 * - Dots outside the viewport (with 20px margin) are skipped
 */
export const NodeMarkersOverlay = memo(function NodeMarkersOverlay({
  nodes,
  viewport,
  scale,
  transform,
  activeFloorId,
  selectedNodeId,
  onNodePress,
  minScaleToShow = 0.6,
}: Props) {
  const { colors: _colors } = useTheme();

  if (scale < minScaleToShow) return null;
  if (viewport.width <= 0 || viewport.height <= 0) return null;

  const activeNodes = nodes.filter(r => r.floorId === activeFloorId);

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      {activeNodes.map(record => {
        const { node } = record;

        // Show non-searchable nodes only if they are notable types
        if (!node.searchable && !TYPES_THAT_SHOW_ALWAYS.has(node.type)) {
          return null;
        }

        // Convert normalized [0,1] coordinates to screen pixels via screenFromWorld
        const worldPoint = { x: node.x * viewport.width, y: node.y * viewport.height };
        const screenPos = screenFromWorld(worldPoint, transform);

        // Cull dots far outside the viewport (20px margin)
        const margin = 20;
        if (
          screenPos.x < -margin ||
          screenPos.x > viewport.width + margin ||
          screenPos.y < -margin ||
          screenPos.y > viewport.height + margin
        ) {
          return null;
        }

        const isSelected = node.id === selectedNodeId;
        const radius = dotRadius(node.type);
        const color = dotColor(node.type);

        return (
          <MarkerDot
            key={node.id}
            record={record}
            screenPos={screenPos}
            radius={radius}
            color={color}
            selected={isSelected}
            onPress={onNodePress}
          />
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  dot: {
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 2.5,
    elevation: 4,
  },
  selectionRing: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
  },
});
