/**
 * MapViewportFloor — floor-switching extension of MapViewport.
 *
 * Composes:
 * - MapViewport (floor plan image with pan/pinch/rotate controls)
 * - Floor selector strip (horizontal ScrollView of floor buttons)
 * - RoutePathOverlay (polyline overlay on active floor)
 *
 * The active floor target is tracked in state and drives both
 * which image is shown and which floor segment is rendered.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { MapViewport } from './MapViewport';
import { RoutePathOverlay, type RoutePathPoint } from '../components/route/RoutePathOverlay';
import type { FloorPlanTarget } from '../data/mapApiClient';
import type { MapTransform } from './mapTransform';
import type { ViewportDimensions } from './mapTransform';

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
  /** Whether to show the floor selector strip */
  showFloorSelector?: boolean;
  /** Device heading in degrees (0–360), applied to map rotation during active guidance. */
  headingDegrees?: number | null;
}

/* ─── State ─── */

interface FloorButtonData {
  target: FloorPlanTarget;
  label: string;
  isActive: boolean;
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
  showFloorSelector = true,
  headingDegrees,
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

  // Build floor button data
  const floorButtons: FloorButtonData[] = floorTargets.map(target => ({
    target,
    label: `Bldg ${target.buildingId} Fl ${target.floorNumber}`,
    isActive: activeFloorTarget !== null
      && activeFloorTarget.buildingId === target.buildingId
      && activeFloorTarget.floorNumber === target.floorNumber,
  }));

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
      </View>

      {/* Floor selector strip */}
      {showFloorSelector && floorButtons.length > 0 && (
        <View style={styles.floorSelector}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.floorScrollContent}
          >
            {floorButtons.map((btn, idx) => (
              <Pressable
                key={`floor-${idx}`}
                style={[styles.floorButton, btn.isActive && styles.floorButtonActive]}
                onPress={() => onFloorChange(btn.target)}
              >
                <Text style={[styles.floorButtonText, btn.isActive && styles.floorButtonTextActive]}>
                  {btn.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
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
  floorSelector: {
    paddingVertical: 4,
  },
  floorScrollContent: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  floorButton: {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  floorButtonActive: {
    backgroundColor: '#0c2d4a',
    borderColor: '#38bdf8',
    borderWidth: 1.5,
  },
  floorButtonText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '500',
  },
  floorButtonTextActive: {
    color: '#38bdf8',
    fontWeight: '700',
  },
});