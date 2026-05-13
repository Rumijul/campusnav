/**
 * App — Maps-quality campus wayfinding.
 *
 * Layout (bottom to top, z-index):
 *   z0   MapViewportFloor — full-screen interactive floor plan
 *   z1   RoutePath — animated SVG route overlay
 *   z10  SearchPill — glass floating search bar
 *   z15  GuidanceBanner — compact turn-by-turn strip
 *   z20  ConfidenceRing — GPS confidence dot
 *   z30  FloorPicker — floor selector pill
 *   z100 Sheet — draggable 3-snap bottom sheet
 */

import 'react-native-reanimated';
import 'react-native-gesture-handler';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { IDLE_MAP_BOOTSTRAP_STATE, MapBootstrapState, runMapBootstrap } from './bootstrap/mapBootstrapState';
import { NavBuilding, NavNode } from '../src/shared/types';
import {
  NormalizedNavGraph,
  NormalizedFloorRecord,
  NormalizedNodeRecord,
  NormalizedEdgeRecord,
  PathResult,
  DirectionsResult,
} from './domain/navGraph';
import { MapViewportFloor } from './map/MapViewportFloor';
import { FloorPlanTarget } from './data/mapApiClient';
import { createMapApiClient } from './data/mapApiClient';
import {
  createInitialMapTransform,
  mapTransformsEqual,
  MapTransform,
  ViewportDimensions,
} from './map/mapTransform';
import { RoutePath, RoutePathPoint } from './components/route/RoutePath';
import { RouteSelection, useRouteSelection } from './hooks/useRouteSelection';
import { useGuidanceSession } from './hooks/useGuidanceSession';
import { RouteSessionReadyState } from './routing/routeSessionState';
import { getActiveStep } from './routing/guidanceState';
import { useRouteSession } from './routing/useRouteSession';
import type { RouteSelection as SessionRouteSelection } from './routing/useRouteSession';
import { useCurrentPosition } from './hooks/useCurrentPosition';
import { findNearestNodeOnFloor } from './hooks/findNearestNodeOnFloor';
import { SearchPill } from './components/search/SearchPill';
import { Sheet, SnapPoint } from './components/sheet/Sheet';
import { SheetContent } from './components/sheet/SheetContent';
import { GuidanceBanner } from './components/guidance/GuidanceBanner';
import { ConfidenceRing, ConfidenceLevel } from './components/guidance/ConfidenceRing';
import { FloorPicker } from './components/map/FloorPicker';
import { useTheme } from './theme';

/* ─── Helpers ─── */

function nextAttemptFromState(state: MapBootstrapState): number {
  if (state.phase === 'idle') return 1;
  return state.attempt + 1;
}

function phaseMessage(state: MapBootstrapState): string {
  switch (state.phase) {
    case 'idle':    return 'Preparing startup checks.';
    case 'loading': return `Loading ${state.currentPhase} contract from ${state.endpoint}.`;
    case 'ready':   return 'CampusNav map is ready for visitor navigation.';
    case 'error':   return state.message;
  }
}

/* ─── Empty graph stub ─── */

const EMPTY_GRAPH_STUB: NormalizedNavGraph = {
  graph: { buildings: [] },
  buildingById: new Map<number, NavBuilding>(),
  floorById: new Map<number, NormalizedFloorRecord>(),
  floorByBuildingAndNumber: new Map<string, NormalizedFloorRecord>(),
  nodeById: new Map<string, NormalizedNodeRecord>(),
  edgeById: new Map<string, NormalizedEdgeRecord>(),
  outgoingEdgesByNodeId: new Map<string, NormalizedEdgeRecord[]>(),
};

/* ─── Floor helpers ─── */

function buildFloorTargets(graph: NormalizedNavGraph): FloorPlanTarget[] {
  const targets: FloorPlanTarget[] = [];
  for (const building of graph.graph.buildings) {
    for (const floor of building.floors) {
      targets.push({ buildingId: building.id, floorNumber: floor.floorNumber });
    }
  }
  return targets;
}

function getFloorId(target: FloorPlanTarget, graph: NormalizedNavGraph): number {
  const key = `${target.buildingId}:${target.floorNumber}`;
  return graph.floorByBuildingAndNumber.get(key)?.floor.id ?? 0;
}

/* ─── Layout constants ─── */

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SEARCH_BAR_TOP = 56;
const SEARCH_BAR_HORIZONTAL_PADDING = 16;
const CONFIDENCE_TOP = SEARCH_BAR_TOP + 8;
const FLOOR_PICKER_BOTTOM = 100;

/* ─── Stub route ─── */

const STUB_READY_ROUTE: RouteSessionReadyState = {
  phase: 'ready',
  start: null,
  destination: null,
  routeMode: 'standard',
  path: { found: false, nodeIds: [], totalDistance: 0, segments: [] } as PathResult,
  directions: { steps: [], totalDistanceNorm: 0, totalDurationSec: 0 } as DirectionsResult,
  errorMessage: null,
};

/* ─── Component ─── */

export default function App() {
  const [bootstrapState, setBootstrapState] = useState<MapBootstrapState>(IDLE_MAP_BOOTSTRAP_STATE);
  const [transformState, setTransformState] = useState<MapTransform>(createInitialMapTransform());
  const [viewportDimensions] = useState<ViewportDimensions>({ width: SCREEN_WIDTH, height: SCREEN_HEIGHT });
  const [graph, setGraph] = useState<NormalizedNavGraph | null>(null);
  const [activeFloorTarget, setActiveFloorTarget] = useState<FloorPlanTarget | null>(null);
  const [activeFloorId, setActiveFloorId] = useState<number>(0);
  const [routePath, setRoutePath] = useState<RoutePathPoint[]>([]);
  const [accessibleMode, setAccessibleMode] = useState(false);
  const [floorTargets, setFloorTargets] = useState<FloorPlanTarget[]>([]);
  const [sheetSnap, setSheetSnap] = useState<SnapPoint>('collapsed');
  const [searchOrigin, setSearchOrigin] = useState('');
  const [searchDestination, setSearchDestination] = useState('');

  const { colors } = useTheme();

  /* ─── Bootstrap ─── */

  const executeBootstrap = useCallback(async (attempt: number) => {
    const envUrl = typeof process !== 'undefined' ? process.env.EXPO_PUBLIC_API_BASE_URL : undefined;
    try {
      const result = await runMapBootstrap({ attempt, envUrl });
      setBootstrapState(result.state);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setBootstrapState({
        phase: 'error', attempt, reason: 'normalization-failure',
        message: `Bootstrap threw: ${message}`, failedPhase: 'map',
        endpoint: null, recoverable: false, authRequired: false,
      });
    }
  }, []);

  useEffect(() => { void executeBootstrap(1); }, [executeBootstrap]);

  /* ─── Graph loaded ─── */

  useEffect(() => {
    if (bootstrapState.phase !== 'ready') return;
    const normalized = bootstrapState.graph;
    setGraph(normalized);
    setFloorTargets(buildFloorTargets(normalized));
  }, [bootstrapState]);

  /* ─── Initial active floor ─── */

  const [initialFloorSet, setInitialFloorSet] = useState(false);
  useEffect(() => {
    if (!initialFloorSet && floorTargets.length > 0 && graph) {
      const first = floorTargets[0];
      setActiveFloorTarget(first);
      setActiveFloorId(getFloorId(first, graph));
      setInitialFloorSet(true);
    }
  }, [initialFloorSet, floorTargets, graph]);

  /* ─── Map client + floor image ─── */

  const mapClient = graph && bootstrapState.phase === 'ready'
    ? createMapApiClient({ baseUrl: bootstrapState.apiBaseUrl })
    : null;

  const imageUri = useMemo(() => {
    if (!mapClient || !activeFloorTarget) return '';
    return mapClient.resolveFloorPlanImageUrl(activeFloorTarget);
  }, [mapClient, activeFloorTarget]);

  /* ─── Route selection ─── */

  const selection = useRouteSelection();

  /* ─── Route session ─── */

  const { sessionState, routeMode, setRouteMode } = useRouteSession({
    graph: graph ?? EMPTY_GRAPH_STUB,
    selection: selection as unknown as SessionRouteSelection,
  });

  useEffect(() => {
    setRouteMode(accessibleMode ? 'accessible' : 'standard');
  }, [accessibleMode, setRouteMode]);

  /* ─── Route path ─── */

  useEffect(() => {
    if (!sessionState || sessionState.phase !== 'ready' || !graph) {
      setRoutePath([]);
      return;
    }
    const { path } = sessionState;
    const waypoints: RoutePathPoint[] = [];
    for (const nodeId of path.nodeIds) {
      const record = graph.nodeById.get(nodeId);
      if (!record) continue;
      waypoints.push({ x: record.node.x, y: record.node.y, floorId: record.floorId });
    }
    setRoutePath(waypoints);
  }, [sessionState, graph]);

  /* ─── Directions ─── */

  const getDirectionSteps = useCallback(() => {
    if (!sessionState || sessionState.phase !== 'ready') return [];
    return sessionState.directions.steps.map((step: { instruction: string; distanceNorm?: number; iconType?: string }) => ({
      type: (step.iconType || 'straight') as import('./components/directions/DirectionStep').StepType,
      instruction: step.instruction,
      distance: step.distanceNorm != null ? `${Math.round(step.distanceNorm)}m` : undefined,
    }));
  }, [sessionState]);

  const getETA = useCallback(() => {
    if (!sessionState || sessionState.phase !== 'ready') return undefined;
    const minutes = Math.round(sessionState.directions.totalDurationSec / 60);
    return `${minutes} min`;
  }, [sessionState]);

  const getDistance = useCallback(() => {
    if (!sessionState || sessionState.phase !== 'ready') return undefined;
    const meters = Math.round(sessionState.directions.totalDistanceNorm);
    return `${meters}m`;
  }, [sessionState]);

  /* ─── Transform ─── */

  const onTransformChange = useCallback((nextTransform: MapTransform) => {
    setTransformState(current =>
      mapTransformsEqual(current, nextTransform) ? current : {
        scale: nextTransform.scale,
        rotationDeg: nextTransform.rotationDeg,
        translation: { ...nextTransform.translation },
        headingRotationDeg: nextTransform.headingRotationDeg,
      },
    );
  }, []);

  /* ─── Node select ─── */

  const handleNodeSelect = useCallback((node: NavNode) => {
    selection.setFromTap(node as unknown as Parameters<typeof selection.setFromTap>[0]);
    if (graph) {
      const record = graph.nodeById.get(node.id);
      if (record) {
        const target = floorTargets.find(
          t => t.buildingId === record.buildingId && t.floorNumber === record.floorNumber
        );
        if (target) {
          setActiveFloorTarget(target);
          setActiveFloorId(getFloorId(target, graph));
        }
      }
    }
  }, [selection, graph, floorTargets]);

  /* ─── Guidance ─── */

  const isRouteReady = sessionState?.phase === 'ready' && graph !== null;
  const { position, smoothedHeadingDegrees } = useCurrentPosition();

  const { guidanceState, startGuidance, stopGuidance, confirmPosition } = useGuidanceSession({
    graph: graph ?? EMPTY_GRAPH_STUB,
    route: sessionState?.phase === 'ready' ? sessionState : STUB_READY_ROUTE,
    updateIntervalMs: 2000,
  });

  const showGuidance = guidanceState.phase !== 'idle';

  /* ─── Floor change ─── */

  const handleFloorChange = useCallback((target: FloorPlanTarget) => {
    setActiveFloorTarget(target);
    if (graph) {
      setActiveFloorId(getFloorId(target, graph));
      const newFloorId = getFloorId(target, graph);
      const snappedPos = guidanceState.snappedPosition;
      const nearestNodeId = findNearestNodeOnFloor(graph, newFloorId, snappedPos);
      if (nearestNodeId) confirmPosition(nearestNodeId);
    }
  }, [graph, guidanceState.snappedPosition, confirmPosition]);

  /* ─── Search handlers ─── */

  const handleSwap = useCallback(() => {
    setSearchOrigin(searchDestination);
    setSearchDestination(searchOrigin);
    const prevStart = selection.start;
    const prevDest = selection.destination;
    if (prevDest) selection.setFromTap(prevDest);
    if (prevStart) selection.setDestination(prevStart);
  }, [searchOrigin, searchDestination, selection]);

  const handleSearchPress = useCallback(() => {
    // useRouteSession picks up selection changes reactively
  }, []);

  /* ─── Guidance display ─── */

  const activeStep = getActiveStep(guidanceState);
  const guidanceInstruction = activeStep?.instruction || 'Follow the route';
  const guidanceDistance = activeStep?.distanceM != null
    ? `${Math.round(activeStep.distanceM)}m`
    : undefined;

  const confidenceLevel: ConfidenceLevel =
    guidanceState.positionConfidence === 'high' ? 'high'
    : guidanceState.positionConfidence === 'medium' ? 'medium'
    : guidanceState.positionConfidence === 'low' ? 'low'
    : 'none';

  /* ─── Idle / Loading ─── */

  if (bootstrapState.phase === 'idle' || bootstrapState.phase === 'loading') {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.centerContent}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>CampusNav</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              Loading campus map…
            </Text>
            {bootstrapState.phase === 'loading' && (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={colors.accent} />
                <Text style={[styles.loadingText, { color: colors.accent }]}>
                  {bootstrapState.currentPhase}
                </Text>
              </View>
            )}
          </View>
        </View>
      </GestureHandlerRootView>
    );
  }

  /* ─── Error ─── */

  if (bootstrapState.phase === 'error') {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.centerContent}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>CampusNav</Text>
            <Text style={[styles.errorReason, { color: colors.error }]}>
              {bootstrapState.message}
            </Text>
            <Pressable
              style={[styles.retryButton, { backgroundColor: colors.surface }]}
              onPress={() => void executeBootstrap(nextAttemptFromState(bootstrapState))}
            >
              <Text style={[styles.retryText, { color: colors.textPrimary }]}>Retry</Text>
            </Pressable>
          </View>
        </View>
      </GestureHandlerRootView>
    );
  }

  /* ─── No graph guard ─── */
  /* activeFloorTarget must be set before rendering interactive map layers.
     It starts as null — graph loads first, then activeFloorTarget arrives
     one render later via useEffect. Guarding here prevents FloorPicker and
     MapViewportFloor from accessing .buildingId on null. */

  if (!graph || !activeFloorTarget) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.centerContent}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>CampusNav</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>Loading map…</Text>
          </View>
        </View>
      </GestureHandlerRootView>
    );
  }

  /* ─── Ready — Maps-style layered UI ─── */

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>

      {/* z0: Full-screen map */}
      <View style={styles.mapBackdrop}>
        <MapViewportFloor
          imageUri={imageUri}
          activeFloorId={activeFloorId}
          floorTargets={floorTargets}
          activeFloorTarget={activeFloorTarget}
          routePath={routePath}
          onFloorChange={handleFloorChange}
          showRouteOverlay={false}
          onTransformChange={onTransformChange}
          headingDegrees={showGuidance ? smoothedHeadingDegrees : null}
          nodeRecords={graph ? Array.from(graph.nodeById.values()) : []}
          selectedNodeId={
            selection.activeField === 'start'
              ? selection.start?.id ?? null
              : selection.destination?.id ?? null
          }
          onNodePress={(record) => handleNodeSelect(record.node)}
        />

        {/* z1: Animated route path */}
        {sessionState?.phase === 'ready' && activeFloorTarget && (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <RoutePath
              path={routePath}
              activeFloorId={activeFloorId}
              standard={!accessibleMode}
              viewportWidth={SCREEN_WIDTH}
              viewportHeight={SCREEN_HEIGHT}
            />
          </View>
        )}
      </View>

      {/* z10: Glass search pill */}
      <View style={styles.searchBarContainer}>
        <SearchPill
          origin={searchOrigin}
          destination={searchDestination}
          onOriginChange={setSearchOrigin}
          onDestinationChange={setSearchDestination}
          onSwap={handleSwap}
          onSearchPress={handleSearchPress}
          disabled={!isRouteReady}
        />
      </View>

      {/* z15: Guidance banner */}
      {showGuidance && (
        <View style={styles.guidanceContainer}>
          <GuidanceBanner
            instruction={guidanceInstruction}
            distance={guidanceDistance}
            floorLabel={guidanceState.currentFloorId != null
              ? `Floor ${graph.floorById.get(guidanceState.currentFloorId)?.floor.floorNumber ?? '?'}`
              : undefined}
            onStop={stopGuidance}
          />
        </View>
      )}

      {/* z20: Confidence ring */}
      {showGuidance && (
        <View style={styles.confidenceContainer}>
          <ConfidenceRing confidence={confidenceLevel} showPulse />
        </View>
      )}

      {/* z30: Floor picker */}
      <View style={styles.floorPickerContainer}>
        <FloorPicker
          floors={floorTargets}
          activeFloor={activeFloorTarget}
          onSelect={handleFloorChange}
        />
      </View>

      {/* z100: Bottom sheet */}
      <Sheet onSnapChange={setSheetSnap} initialSnap="collapsed">
        <SheetContent
          snap={sheetSnap}
          eta={getETA()}
          distance={getDistance()}
          startName={selection.start?.label}
          destName={selection.destination?.label}
          accessibleMode={accessibleMode}
          steps={getDirectionSteps() as any}
          onStartGuidance={startGuidance}
          onToggleAccessible={() => setAccessibleMode((p) => !p)}
        />
      </Sheet>
      </View>
    </GestureHandlerRootView>
  );
}

/* ─── Styles ─── */

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  mapBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  searchBarContainer: {
    position: 'absolute',
    top: SEARCH_BAR_TOP,
    left: SEARCH_BAR_HORIZONTAL_PADDING,
    right: SEARCH_BAR_HORIZONTAL_PADDING,
    zIndex: 10,
  },
  guidanceContainer: {
    position: 'absolute',
    top: SEARCH_BAR_TOP + 64,
    left: SEARCH_BAR_HORIZONTAL_PADDING,
    right: SEARCH_BAR_HORIZONTAL_PADDING,
    zIndex: 15,
  },
  confidenceContainer: {
    position: 'absolute',
    top: CONFIDENCE_TOP,
    right: 16,
    zIndex: 20,
  },
  floorPickerContainer: {
    position: 'absolute',
    bottom: FLOOR_PICKER_BOTTOM,
    right: 16,
    zIndex: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
  },
  errorReason: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  retryText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
