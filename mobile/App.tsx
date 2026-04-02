/**
 * App — visitor navigation runtime (no sign-in required).
 *
 * Layered floating UI layout:
 *   - Full-screen map backdrop (MapViewportFloor + AnimatedRoutePathOverlay)
 *   - Floating search bar + floor switcher on top (absolute positioned)
 *   - Bottom sheet with snap-driven content at bottom
 *   - ConfidenceIndicator top-right during active guidance
 *   - LiveGuidanceOverlay absolute overlay during guidance
 *
 * Bootstrap loads nav graph + campus image from configured endpoints.
 */

import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';

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
import { DestinationPicker } from './components/destination/DestinationPicker';
import { RoutePreview } from './components/route/RoutePreview';
import { RoutePathPoint } from './components/route/RoutePathOverlay';
import { AnimatedRoutePathOverlay } from './components/route/RoutePathOverlay';
import { RouteSelection, useRouteSelection } from './hooks/useRouteSelection';
import { useGuidanceSession } from './hooks/useGuidanceSession';
import { RouteSessionReadyState } from './routing/routeSessionState';
import { useRouteSession } from './routing/useRouteSession';
import type { RouteSelection as SessionRouteSelection } from './routing/useRouteSession';
import { useCurrentPosition } from './hooks/useCurrentPosition';
import { findNearestNodeOnFloor } from './hooks/findNearestNodeOnFloor';
import { LiveGuidanceOverlay } from './components/guidance/LiveGuidanceOverlay';
import { ConfidenceIndicator } from './components/guidance/ConfidenceIndicator';
import { BottomSheet, DEFAULT_SNAP_POINTS, SnapIndex } from './components/sheet/BottomSheet';
import { FloatingSearchBar } from './components/search/FloatingSearchBar';
import { FloatingFloorSwitcher } from './components/floor/FloatingFloorSwitcher';
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

/* ─── Empty graph stub (uses shared/types NavNode) ─── */

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
const FLOOR_SWITCHER_TOP = SEARCH_BAR_TOP + 68 + 12;
const CONFIDENCE_TOP = SEARCH_BAR_TOP + 8;

/* ─── Stub route (idle state) ─── */

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
  const [viewportDimensions, setViewportDimensions] = useState<ViewportDimensions>({ width: SCREEN_WIDTH, height: SCREEN_HEIGHT });
  const [graph, setGraph] = useState<NormalizedNavGraph | null>(null);
  const [imageUri, setImageUri] = useState<string>('');
  const [activeFloorTarget, setActiveFloorTarget] = useState<FloorPlanTarget | null>(null);
  const [activeFloorId, setActiveFloorId] = useState<number>(0);
  const [routePath, setRoutePath] = useState<RoutePathPoint[]>([]);
  const [accessibleMode, setAccessibleMode] = useState(false);
  const [floorTargets, setFloorTargets] = useState<FloorPlanTarget[]>([]);
  const [sheetSnap, setSheetSnap] = useState<SnapIndex>(0);

  // Search bar text (local; drives FloatingSearchBar inputs)
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
        phase: 'error',
        attempt,
        reason: 'normalization-failure',
        message: `Bootstrap threw: ${message}`,
        failedPhase: 'map',
        endpoint: null,
        recoverable: false,
        authRequired: false,
      });
    }
  }, []);

  useEffect(() => {
    void executeBootstrap(1);
  }, [executeBootstrap]);

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
      const firstTarget = floorTargets[0];
      setActiveFloorTarget(firstTarget);
      setActiveFloorId(getFloorId(firstTarget, graph));
      setInitialFloorSet(true);
    }
  }, [initialFloorSet, floorTargets, graph]);

  /* ─── Map client + floor image ─── */

  const mapClient = graph && bootstrapState.phase === 'ready'
    ? createMapApiClient({ baseUrl: bootstrapState.apiBaseUrl })
    : null;

  useEffect(() => {
    if (!mapClient || !activeFloorTarget) { setImageUri(''); return; }
    setImageUri(mapClient.resolveFloorPlanImageUrl(activeFloorTarget));
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
      const node = record.node;
      waypoints.push({ x: node.x, y: node.y, floorId: record.floorId });
    }
    setRoutePath(waypoints);
  }, [sessionState, graph]);

  /* ─── Transform ─── */

  const onTransformChange = useCallback((nextTransform: MapTransform) => {
    setTransformState(current =>
      mapTransformsEqual(current, nextTransform)
        ? current
        : {
            scale: nextTransform.scale,
            rotationDeg: nextTransform.rotationDeg,
            translation: { ...nextTransform.translation },
            headingRotationDeg: nextTransform.headingRotationDeg,
          },
    );
  }, []);

  /* ─── Node select ─── */

  const handleNodeSelect = useCallback((node: NavNode) => {
    // setFromTap expects the NavNode from useRouteSelection's local type alias (same shape)
    selection.setFromTap(node as unknown as Parameters<typeof selection.setFromTap>[0]);
    if (graph) {
      const record = graph.nodeById.get(node.id);
      if (record) {
        const target = floorTargets.find(t => t.buildingId === record.buildingId && t.floorNumber === record.floorNumber);
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

  const showGuidanceOverlay = guidanceState.phase !== 'idle';

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

  /* ─── Search bar handlers ─── */

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
    void selection;
  }, [selection]);

  /* ─── Sheet content based on snap ─── */

  const renderSheetContent = () => {
    if (!graph) return null;

    switch (sheetSnap) {
      case 0:
        return (
          <View style={sheetStyles.sheetContent}>
            <DestinationPicker
              graph={graph}
              selection={selection as Parameters<typeof DestinationPicker>[0]['selection']}
              onNodeSelect={handleNodeSelect}
            />
          </View>
        );

      case 1:
        return (
          <View style={sheetStyles.sheetContent}>
            {sessionState && sessionState.phase === 'ready' && (
              <RoutePreview
                directions={sessionState.directions}
                accessibleMode={accessibleMode}
              />
            )}
            {sessionState?.phase === 'ready' && guidanceState.phase === 'idle' && (
              <Pressable
                style={[sheetStyles.startGuidanceButton, { backgroundColor: colors.accent }]}
                onPress={startGuidance}
              >
                <Text style={[sheetStyles.startGuidanceText, { color: colors.textInverse }]}>
                  Start Guidance
                </Text>
              </Pressable>
            )}
            {sessionState && sessionState.phase === 'no-route' && (
              <Text style={[sheetStyles.statusMessage, { color: colors.error }]}>
                No path found between selected locations.
              </Text>
            )}
            {sessionState && sessionState.phase === 'error' && (
              <Text style={[sheetStyles.statusMessage, { color: colors.error }]}>
                {sessionState.errorMessage}
              </Text>
            )}
          </View>
        );

      case 2:
        return (
          <View style={sheetStyles.sheetContent}>
            <View style={sheetStyles.toggleRow}>
              <Text style={[sheetStyles.toggleLabel, { color: colors.textSecondary }]}>
                Accessible mode
              </Text>
              <Pressable
                style={[
                  sheetStyles.toggleButton,
                  accessibleMode && { backgroundColor: colors.accentSubtle, borderColor: colors.accent },
                ]}
                onPress={() => setAccessibleMode(prev => !prev)}
              >
                <Text
                  style={[
                    sheetStyles.toggleButtonText,
                    accessibleMode && { color: colors.accent },
                  ]}
                >
                  {accessibleMode ? 'ON' : 'OFF'}
                </Text>
              </Pressable>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  /* ─── Idle / Loading ─── */

  if (bootstrapState.phase === 'idle' || bootstrapState.phase === 'loading') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>CampusNav</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Visitor runtime shell (no sign-in)
          </Text>
          <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>
            Bootstrap phase: {bootstrapState.phase}
          </Text>
          <Text style={[styles.statusMessage, { color: colors.textMuted }]}>
            {phaseMessage(bootstrapState)}
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
    );
  }

  /* ─── Error ─── */

  if (bootstrapState.phase === 'error') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>CampusNav</Text>
          <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>
            Bootstrap phase: error
          </Text>
          <Text style={[styles.errorReason, { color: colors.error }]}>
            Failed phase: {bootstrapState.failedPhase}
          </Text>
          <Text style={[styles.errorReason, { color: colors.error }]}>
            Reason: {bootstrapState.reason}
          </Text>
          <Text style={[styles.errorReason, { color: colors.error }]}>
            Endpoint: {bootstrapState.endpoint ?? 'n/a'}
          </Text>
          <Pressable
            style={[sheetStyles.startGuidanceButton, { backgroundColor: colors.surface }]}
            onPress={() => void executeBootstrap(nextAttemptFromState(bootstrapState))}
          >
            <Text style={[sheetStyles.startGuidanceText, { color: colors.textPrimary }]}>
              Retry startup
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  /* ─── Guard ─── */

  if (!graph) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>CampusNav</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>Loading map…</Text>
        </View>
      </View>
    );
  }

  /* ─── Ready — layered floating UI ─── */

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      {/* ── Full-screen map backdrop ── */}
      <View style={styles.mapBackdrop}>
        <MapViewportFloor
          activeFloorId={activeFloorId}
          floorTargets={floorTargets}
          activeFloorTarget={activeFloorTarget}
          routePath={routePath}
          onFloorChange={handleFloorChange}
          showRouteOverlay={sessionState?.phase === 'ready'}
          showFloorSelector={false}
          onTransformChange={onTransformChange}
          headingDegrees={guidanceState.phase === 'idle' ? null : smoothedHeadingDegrees}
        />

        {/* Animated route path overlay — layered above map */}
        {sessionState?.phase === 'ready' && activeFloorTarget && (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <AnimatedRoutePathOverlay
              path={routePath}
              activeFloorId={activeFloorId}
              viewport={viewportDimensions}
              scale={transformState.scale}
            />
          </View>
        )}
      </View>

      {/* ── Floating search bar — top of screen ── */}
      <View style={styles.searchBarContainer}>
        <FloatingSearchBar
          origin={searchOrigin}
          destination={searchDestination}
          onOriginChange={setSearchOrigin}
          onDestinationChange={setSearchDestination}
          onSwap={handleSwap}
          onSearchPress={handleSearchPress}
          disabled={!isRouteReady}
        />
      </View>

      {/* ── Floating floor switcher — below search bar ── */}
      {floorTargets.length > 0 && activeFloorTarget && (
        <View style={styles.floorSwitcherContainer}>
          <FloatingFloorSwitcher
            floors={floorTargets}
            selectedFloor={activeFloorTarget}
            onSelectFloor={handleFloorChange}
          />
        </View>
      )}

      {/* ── Confidence indicator — top-right ── */}
      {showGuidanceOverlay && (
        <View style={styles.confidenceContainer}>
          <ConfidenceIndicator
            confidence={guidanceState.positionConfidence}
            showPulse={true}
          />
        </View>
      )}

      {/* ── Live guidance overlay — absolute overlay ── */}
      {showGuidanceOverlay && (
        <View style={styles.guidanceOverlayContainer}>
          <LiveGuidanceOverlay
            guidanceState={guidanceState}
            onConfirmPosition={() => {
              if (sessionState?.phase === 'ready') {
                const firstNodeId = sessionState.path.nodeIds[0];
                if (firstNodeId) confirmPosition(firstNodeId);
              }
            }}
            onStopGuidance={stopGuidance}
            floorId={guidanceState.currentFloorId}
            floorMap={graph.floorById}
            accessibleMode={accessibleMode}
          />
        </View>
      )}

      {/* ── Bottom sheet — snap-driven content ── */}
      <BottomSheet
        snapPoints={DEFAULT_SNAP_POINTS}
        initialSnapIndex={0}
        onSnapChange={setSheetSnap}
      >
        {renderSheetContent()}
      </BottomSheet>
    </View>
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
    gap: 8,
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
  floorSwitcherContainer: {
    position: 'absolute',
    top: FLOOR_SWITCHER_TOP,
    left: SEARCH_BAR_HORIZONTAL_PADDING,
    right: SEARCH_BAR_HORIZONTAL_PADDING,
    zIndex: 10,
  },
  confidenceContainer: {
    position: 'absolute',
    top: CONFIDENCE_TOP,
    right: 16,
    zIndex: 20,
  },
  guidanceOverlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  statusLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  statusMessage: {
    fontSize: 13,
    marginBottom: 4,
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
    fontSize: 12,
  },
});

const sheetStyles = StyleSheet.create({
  sheetContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  startGuidanceButton: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginVertical: 4,
  },
  startGuidanceText: {
    fontSize: 16,
    fontWeight: '700',
  },
  statusMessage: {
    fontSize: 13,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  toggleButton: {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  toggleButtonText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
});
