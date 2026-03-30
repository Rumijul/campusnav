/**
 * RoutePathOverlay — renders the computed route path on top of the floor plan image.
 *
 * View-based polyline (no new SVG dependency). For each adjacent pair of
 * nodes on the active floor, renders endpoint dots and a connecting line
 * rotated to match the bearing.
 */

import { StyleSheet, View } from 'react-native';
import type { ViewportDimensions } from '../../map/mapTransform';

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