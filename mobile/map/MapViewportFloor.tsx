/**
 * MapViewportFloor — floor-switching extension of MapViewport.
 *
 * Composes:
 * - MapViewport (floor plan image with pan/pinch/rotate controls)
 * - RoutePathOverlay (polyline overlay on active floor)
 * - Optional routeOverlay prop for additional overlay content inside the map container
 *
 * The active floor target is tracked in state and drives which floor segment is rendered.
 */

import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { MapViewport } from './MapViewport';
import { RoutePathOverlay, RoutePathPoint } from '../components/route/RoutePathOverlay';
import { FloorPlanTarget } from '../data/mapApiClient';
import { MapTransform } from './mapTransform';
import { ViewportDimensions } from './mapTransform';

/* ─── Props ─── */

export interface MapViewportFloorProps {
  /** MapViewport props */
  onTransformChange?: (transform: MapTransform) => void;
  /** All available floor targets for the active route */
  floorTargets: FloorPlanTarget[];
  /** Currently selected floor target */
  activeFloorTarget: FloorPlanTarget | null;
  /** Floor ID for the active target (used for route path overlay filtering) */
  activeFloorId: number;
  /** Route path waypoints (normalized coordinates) */
  routePath: RoutePathPoint[];
  /** Called when user presses a floor button */
  onFloorChange: (target: FloorPlanTarget) => void;
  /** Whether to show the route path overlay */
  showRouteOverlay?: boolean;
  /** Device heading in degrees (0–360), applied to map rotation during active guidance. */
  headingDegrees?: number | null;
  /** Optional additional overlay node rendered inside mapContainer alongside RoutePathOverlay. */
  routeOverlay?: React.ReactNode;
}

/* ─── Component ─── */

export function MapViewportFloor({
  onTransformChange,
  floorTargets,
  activeFloorTarget,
  activeFloorId,
  routePath,
  onFloorChange,
  showRouteOverlay = true,
  headingDegrees,
  routeOverlay,
}: MapViewportFloorProps) {
  const [transform, setTransform] = useState<MapTransform>(() => ({
    scale: 1,
    rotationDeg: 0,
    translation: { x: 0, y: 0 },
    headingRotationDeg: 0,
  }));
  const [viewportDimensions, setViewportDimensions] = useState<ViewportDimensions>({ width: 300, height: 300 });

  const handleTransformChange = useCallback(
    (t: MapTransform) => {
      setTransform(t);
      onTransformChange?.(t);
    },
    [onTransformChange],
  );

  return (
    <View style={styles.container}>
      {/* Map viewport with optional route overlay */}
      <View style={styles.mapContainer}>
        <MapViewport
          imageUri=""
          onTransformChange={handleTransformChange}
          headingRotationDeg={headingDegrees ?? undefined}
        />
        {showRouteOverlay && activeFloorTarget && (
          <RoutePathOverlay
            path={routePath}
            activeFloorId={activeFloorId}
            viewport={viewportDimensions}
            scale={transform.scale}
          />
        )}
        {routeOverlay}
      </View>
    </View>
  );
}

/* ─── Styles ─── */

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 8,
  },
  mapContainer: {
    flex: 1,
    minHeight: 280,
    borderRadius: 12,
    overflow: 'hidden',
  },
});