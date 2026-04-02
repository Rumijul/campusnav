/**
 * RoutePathOverlay — renders the computed route path on top of the floor plan image.
 *
 * View-based polyline (no new SVG dependency). For each adjacent pair of
 * nodes on the active floor, renders endpoint dots and a connecting line
 * rotated to match the bearing.
 */

import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { ViewportDimensions } from '../../map/mapTransform';
import { useTheme } from '../../theme';

/* ─── Types ─── */

export interface RoutePathPoint {
  x: number;       // normalized [0,1]
  y: number;       // normalized [0,1]
  floorId: number;
}

interface Props {
  path: RoutePathPoint[];
  activeFloorId: number;
  viewport: ViewportDimensions;
  scale: number;
}

/* ─── Helpers (pure, no closure state) ─── */

function segmentBearingDeg(
  from: RoutePathPoint,
  to: RoutePathPoint,
  vp: ViewportDimensions,
  sc: number,
): number {
  const dx = (to.x - from.x) * vp.width * sc;
  const dy = (to.y - from.y) * vp.height * sc;
  return Math.atan2(dy, dx) * (180 / Math.PI);
}

function segmentLen(
  from: RoutePathPoint,
  to: RoutePathPoint,
  vp: ViewportDimensions,
  sc: number,
): number {
  const dx = (to.x - from.x) * vp.width * sc;
  const dy = (to.y - from.y) * vp.height * sc;
  return Math.hypot(dx, dy);
}

/* ─── Animated SVG overlay ─────────────────────────────────────────────────── */

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Computes the total length of a path through a sequence of floor nodes,
 * using the same pixel-scale logic as segmentLen.
 */
function computePathLength(
  nodes: RoutePathPoint[],
  vp: ViewportDimensions,
  sc: number,
): number {
  let total = 0;
  for (let i = 1; i < nodes.length; i++) {
    const dx = (nodes[i].x - nodes[i - 1].x) * vp.width * sc;
    const dy = (nodes[i].y - nodes[i - 1].y) * vp.height * sc;
    total += Math.hypot(dx, dy);
  }
  return total;
}

/**
 * Builds an SVG path `d` string from a sequence of floor nodes.
 * Uses viewport + scale to convert normalized [0,1] coords to pixel positions.
 */
function buildPathD(nodes: RoutePathPoint[], vp: ViewportDimensions, sc: number): string {
  if (nodes.length === 0) return '';
  const parts = nodes.map(n => `${n.x * vp.width * sc},${n.y * vp.height * sc}`);
  return `M ${parts[0]} ` + parts.slice(1).map(p => `L ${p}`).join(' ');
}

export interface AnimatedRoutePathOverlayProps {
  path: RoutePathPoint[];
  activeFloorId: number;
  viewport: ViewportDimensions;
  scale: number;
}

/**
 * AnimatedRoutePathOverlay — SVG-based route path with strokeDashoffset draw-on effect.
 *
 * Renders a polyline path that "draws itself" from origin to destination over ~800ms
 * using react-native-reanimated's strokeDashoffset animation.  Start/end nodes are
 * marked with colored circles.  Designed to render behind the floor plan image
 * (pointerEvents="none").
 *
 * Requires react-native-svg and react-native-reanimated.
 */
export function AnimatedRoutePathOverlay({
  path,
  activeFloorId,
  viewport,
  scale,
}: AnimatedRoutePathOverlayProps) {
  const { colors } = useTheme();

  const floorNodes = path.filter(n => n.floorId === activeFloorId);

  if (floorNodes.length === 0) return null;

  const totalLength = computePathLength(floorNodes, viewport, scale);
  const pathD = buildPathD(floorNodes, viewport, scale);
  const svgWidth = viewport.width * scale;
  const svgHeight = viewport.height * scale;

  // strokeDashoffset: starts at totalLength (invisible), animates to 0 (fully drawn)
  const dashOffset = useSharedValue(totalLength);

  // Re-trigger animation when path or floor changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // Reset to full offset (invisible), then animate to 0 (fully drawn)
    dashOffset.value = totalLength;
    const t = setTimeout(() => {
      dashOffset.value = withTiming(0, { duration: 800 });
    }, 16); // Let the reset render first
    return () => clearTimeout(t);
  }, [totalLength]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: dashOffset.value,
  }));

  if (totalLength === 0) return null;

  const startNode = floorNodes[0];
  const endNode = floorNodes[floorNodes.length - 1];
  const startX = startNode.x * svgWidth;
  const startY = startNode.y * svgHeight;
  const endX = endNode.x * svgWidth;
  const endY = endNode.y * svgHeight;

  return (
    <View style={styles.overlay} pointerEvents="none">
      <Svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={StyleSheet.absoluteFill}
      >
        {/* Animated polyline path */}
        <AnimatedPath
          d={pathD}
          stroke={colors.routeLine}
          strokeWidth={2.5}
          fill="none"
          strokeDasharray={`${totalLength}`}
          animatedProps={animatedProps}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Start node */}
        <Circle
          cx={startX}
          cy={startY}
          r={5}
          fill={colors.routeStart}
          stroke={colors.routeStart}
          strokeWidth={1.5}
        />

        {/* End node */}
        {floorNodes.length > 1 && (
          <Circle
            cx={endX}
            cy={endY}
            r={5}
            fill={colors.routeEnd}
            stroke={colors.routeEnd}
            strokeWidth={1.5}
          />
        )}
      </Svg>
    </View>
  );
}

/* ─── Coordinate to pixel position ─── */

function toPixel(node: RoutePathPoint, vp: ViewportDimensions, sc: number) {
  return {
    left: node.x * vp.width * sc - 4,
    top:  node.y * vp.height * sc - 4,
  };
}

/* ─── Component ─── */

export function RoutePathOverlay({ path, activeFloorId, viewport, scale }: Props) {
  const floorNodes = path.filter(n => n.floorId === activeFloorId);

  if (floorNodes.length === 0) return null;

  // Single node → draw one dot
  if (floorNodes.length === 1) {
    const { left, top } = toPixel(floorNodes[0], viewport, scale);
    return <View style={[styles.dot, styles.dotStart, { left, top }]} />;
  }

  // Multiple nodes → draw start/end dots + connecting segments
  return (
    <View style={styles.overlay} pointerEvents="none">
      {/* Start dot */}
      <View style={[styles.dot, styles.dotStart, toPixel(floorNodes[0], viewport, scale)]} />

      {/* Segments between consecutive nodes */}
      {floorNodes.slice(1).map((toNode, i) => {
        const fromNode = floorNodes[i];
        const { left: startLeft, top: startTop } = toPixel(fromNode, viewport, scale);
        const { left: endLeft, top: endTop } = toPixel(toNode, viewport, scale);
        const len = segmentLen(fromNode, toNode, viewport, scale);
        const angleDeg = segmentBearingDeg(fromNode, toNode, viewport, scale);

        return (
          <View key={`seg-${i}`} style={styles.overlay} pointerEvents="none">
            {/* Connecting line (anchored at start, rotated) */}
            {len > 0 && (
              <View
                style={[
                  styles.line,
                  { width: len, left: startLeft + 4, top: startTop + 3, transform: [{ rotate: `${angleDeg}deg` }] },
                ]}
              />
            )}
          </View>
        );
      })}

      {/* End dot */}
      <View style={[styles.dot, styles.dotEnd, toPixel(floorNodes[floorNodes.length - 1], viewport, scale)]} />
    </View>
  );
}

/* ─── Styles ─── */

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  dot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#38bdf8',
  },
  dotStart: {
    backgroundColor: '#4ade80',
  },
  dotEnd: {
    backgroundColor: '#f87171',
  },
  line: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#38bdf8',
    transformOrigin: 'left center',
  },
});