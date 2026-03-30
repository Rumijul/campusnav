/**
 * App — visitor navigation runtime (no sign-in required).
 *
 * Composition:
 * - Bootstrap: loads nav graph + campus image from configured endpoints
 * - DestinationPicker: building/floor/node search with start/destination selection
 * - MapViewportFloor: floor plan image viewer + route path overlay + floor switcher
 * - RoutePreview: step-by-step directions when route is ready
 * - Accessible mode toggle: switches between standard / accessible routing
 */

import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  IDLE_MAP_BOOTSTRAP_STATE,
  type MapBootstrapState,
  runMapBootstrap,
} from './bootstrap/mapBootstrapState';
import type { NormalizedNavGraph } from './domain/navGraph';
import { MapViewportFloor } from './map/MapViewportFloor';
import type { FloorPlanTarget } from './data/mapApiClient';
import { createMapApiClient } from './data/mapApiClient';
import {
  createInitialMapTransform,
  mapTransformsEqual,
  type MapTransform,
} from './map/mapTransform';
import { DestinationPicker } from './components/destination/DestinationPicker';
import { RoutePreview } from './components/route/RoutePreview';
import { RoutePathOverlay, type RoutePathPoint } from './components/route/RoutePathOverlay';
import { useRouteSelection } from './hooks/useRouteSelection';
import { useRouteSession } from './routing/useRouteSession';
import type { NavNode } from '@shared/types';

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

function formatMetric(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : '0';
}

/* ─── Floor target from normalized graph ─── */

function buildFloorTargets(graph: NormalizedNavGraph): FloorPlanTarget[] {
  const targets: FloorPlanTarget[] = [];
  for (const building of graph.graph.buildings) {
    for (const floor of building.floors) {
      targets.push({ buildingId: building.id, floorNumber: floor.floorNumber });
    }
  }
  return targets;
}

/* ─── Map FloorPlanTarget → floorId ─── */

function getFloorId(target: FloorPlanTarget, graph: NormalizedNavGraph): number {
  const key = `${target.buildingId}:${target.floorNumber}`;
  return graph.floorByBuildingAndNumber.get(key)?.floor.id ?? 0;
}

/* ─── Route path from session ready state ─── */

function buildRoutePath(sessionPhase: 'ready', graph: NormalizedNavGraph): RoutePathPoint[] {
  // The path result from MobilePathfindingEngine contains nodeIds
  // We map each to normalized coordinates from the graph
  if (!sessionPhase || sessionPhase !== 'ready') return [];
  return [];
}

/* ─── Component ─── */

export default function App() {
  const [bootstrapState, setBootstrapState] = useState<MapBootstrapState>(IDLE_MAP_BOOTSTRAP_STATE);
  const [transformState, setTransformState] = useState<MapTransform>(createInitialMapTransform());
  const [graph, setGraph] = useState<NormalizedNavGraph | null>(null);
  const [imageUri, setImageUri] = useState<string>('');
  const [activeFloorTarget, setActiveFloorTarget] = useState<FloorPlanTarget | null>(null);
  const [activeFloorId, setActiveFloorId] = useState<number>(0);
  const [routePath, setRoutePath] = useState<RoutePathPoint[]>([]);
  const [accessibleMode, setAccessibleMode] = useState(false);
  const [floorTargets, setFloorTargets] = useState<FloorPlanTarget[]>([]);

  /* ─── Bootstrap ─── */

  const executeBootstrap = useCallback(async (attempt: number) => {
    const result = await runMapBootstrap({ attempt });
    for (const t of result.transitions) {
      if (t.phase === 'loading') console.info('[mobile-bootstrap]', { phase: t.phase, attempt: t.attempt, currentPhase: t.currentPhase, endpoint: t.endpoint });
      if (t.phase === 'ready') console.info('[mobile-bootstrap]', { phase: t.phase, attempt: t.attempt, endpoint: t.image.endpoint });
      if (t.phase === 'error') console.warn('[mobile-bootstrap]', { phase: t.phase, attempt: t.attempt, failedPhase: t.failedPhase, reason: t.reason, recoverable: t.recoverable });
    }
    setBootstrapState(result.state);
  }, []);

  useEffect(() => {
    void executeBootstrap(1);
  }, [executeBootstrap]);

  /* ─── Graph already normalized by bootstrap ─── */

  useEffect(() => {
    if (bootstrapState.phase !== 'ready') return;
    const normalized = bootstrapState.graph;
    setGraph(normalized);
    const targets = buildFloorTargets(normalized);
    setFloorTargets(targets);
  }, [bootstrapState]);

  /* ─── Set initial active floor when floorTargets are first populated ─── */

  const [initialFloorSet, setInitialFloorSet] = useState(false);
  useEffect(() => {
    if (!initialFloorSet && floorTargets.length > 0 && graph) {
      const firstTarget = floorTargets[0];
      setActiveFloorTarget(firstTarget);
      setActiveFloorId(getFloorId(firstTarget, graph));
      setInitialFloorSet(true);
    }
  }, [initialFloorSet, floorTargets, graph]);

  /* ─── Map API client for floor images ─── */

  const mapClient = graph && bootstrapState.phase === 'ready'
    ? createMapApiClient({ baseUrl: bootstrapState.apiBaseUrl })
    : null;

  /* ─── Update floor image when activeFloorTarget changes ─── */

  useEffect(() => {
    if (!mapClient || !activeFloorTarget) { setImageUri(''); return; }
    const url = mapClient.resolveFloorPlanImageUrl(activeFloorTarget);
    setImageUri(url);
  }, [mapClient, activeFloorTarget]);

  /* ─── Route selection ─── */

  const selection = useRouteSelection();

  /* ─── Route session ─── */

  const { sessionState, routeMode, setRouteMode } = graph
    ? useRouteSession({ graph, selection })
    : { sessionState: null, routeMode: 'standard' as const, setRouteMode: () => {} };

  /* ─── Update route mode when accessibleMode changes ─── */

  useEffect(() => {
    setRouteMode(accessibleMode ? 'accessible' : 'standard');
  }, [accessibleMode, setRouteMode]);

  /* ─── Build route path when session is ready ─── */

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

  /* ─── Transform change handler ─── */

  const onTransformChange = useCallback((nextTransform: MapTransform) => {
    setTransformState(current =>
      mapTransformsEqual(current, nextTransform)
        ? current
        : { scale: nextTransform.scale, rotationDeg: nextTransform.rotationDeg, translation: { ...nextTransform.translation } },
    );
  }, []);

  /* ─── Node select handler ─── */

  const onNodeSelect = useCallback((node: NavNode) => {
    selection.setFromTap(node);
    // After selection, set the active floor to the node's floor
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

  /* ─── Accessible mode toggle ─── */

  const toggleAccessibleMode = useCallback(() => {
    setAccessibleMode(prev => !prev);
  }, []);

  /* ─── Retry handler ─── */

  const onRetryPress = useCallback(() => {
    void executeBootstrap(nextAttemptFromState(bootstrapState));
  }, [executeBootstrap, bootstrapState]);

  /* ─── Phase: idle / loading ─── */

  if (bootstrapState.phase === 'idle' || bootstrapState.phase === 'loading') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>CampusNav</Text>
        <Text style={styles.subtitle}>Visitor runtime shell (no sign-in)</Text>
        <Text style={styles.statusLabel}>Bootstrap phase: {bootstrapState.phase}</Text>
        <Text style={styles.statusMessage}>{phaseMessage(bootstrapState)}</Text>
        {bootstrapState.phase === 'loading' && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#38bdf8" />
            <Text style={styles.loadingText}>{bootstrapState.currentPhase}</Text>
          </View>
        )}
      </View>
    );
  }

  /* ─── Phase: error ─── */

  if (bootstrapState.phase === 'error') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>CampusNav</Text>
        <Text style={styles.statusLabel}>Bootstrap phase: error</Text>
        <Text style={styles.errorReason}>Failed phase: {bootstrapState.failedPhase}</Text>
        <Text style={styles.errorReason}>Reason: {bootstrapState.reason}</Text>
        <Text style={styles.errorReason}>Endpoint: {bootstrapState.endpoint ?? 'n/a'}</Text>
        <Pressable onPress={onRetryPress} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Retry startup</Text>
        </Pressable>
      </View>
    );
  }

  /* ─── Phase: ready ─── */

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <Text style={styles.title}>CampusNav</Text>
      <Text style={styles.subtitle}>Visitor runtime — no sign-in needed</Text>
      <Text style={styles.statusLabel}>Graph: {graph!.graph.buildings.length} buildings</Text>

      {/* Destination Picker */}
      <View style={styles.section}>
        <DestinationPicker
          graph={graph!}
          selection={selection}
          onNodeSelect={onNodeSelect}
        />
      </View>

      {/* Route Preview (when ready) */}
      {sessionState && sessionState.phase === 'ready' && (
        <View style={styles.section}>
          <RoutePreview
            directions={sessionState.directions}
            accessibleMode={accessibleMode}
          />
        </View>
      )}

      {/* Session phase / route status */}
      {sessionState && (
        <View style={styles.sessionStatus}>
          <Text style={styles.statusLabel}>Route: {sessionState.phase}</Text>
          {sessionState.phase === 'no-route' && (
            <Text style={styles.statusMessage}>No path found between selected locations.</Text>
          )}
          {sessionState.phase === 'error' && (
            <Text style={styles.errorReason}>{sessionState.errorMessage}</Text>
          )}
        </View>
      )}

      {/* Map Viewport with floor switcher */}
      <View style={styles.section}>
        <MapViewportFloor
          activeFloorId={activeFloorId}
          floorTargets={floorTargets}
          activeFloorTarget={activeFloorTarget}
          routePath={routePath}
          onFloorChange={(target) => {
            setActiveFloorTarget(target);
            if (graph) setActiveFloorId(getFloorId(target, graph));
          }}
          showRouteOverlay={sessionState?.phase === 'ready'}
          showFloorSelector={floorTargets.length > 1}
          onTransformChange={onTransformChange}
        />
      </View>

      {/* Accessible mode toggle */}
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Accessible mode</Text>
        <Pressable
          style={[styles.toggleButton, accessibleMode && styles.toggleButtonActive]}
          onPress={toggleAccessibleMode}
        >
          <Text style={[styles.toggleButtonText, accessibleMode && styles.toggleButtonTextActive]}>
            {accessibleMode ? 'ON' : 'OFF'}
          </Text>
        </Pressable>
      </View>

      {/* Telemetry */}
      <Text style={styles.telemetryText}>
        viewport scale={formatMetric(transformState.scale)} rotation={formatMetric(transformState.rotationDeg)}°
        tx={formatMetric(transformState.translation.x)} ty={formatMetric(transformState.translation.y)}
      </Text>
    </ScrollView>
  );
}

/* ─── Styles ─── */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  title: {
    color: '#f8fafc',
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: '#cbd5e1',
    fontSize: 14,
    marginBottom: 4,
  },
  statusLabel: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '600',
  },
  statusMessage: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: 4,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#38bdf8',
    fontSize: 13,
  },
  section: {
    minHeight: 120,
    backgroundColor: '#0a0f1e',
    borderRadius: 12,
    overflow: 'hidden',
  },
  sessionStatus: {
    gap: 2,
  },
  errorReason: {
    color: '#fda4af',
    fontSize: 12,
  },
  retryButton: {
    marginTop: 6,
    backgroundColor: '#0f172a',
    borderColor: '#475569',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  toggleLabel: {
    color: '#cbd5e1',
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
  toggleButtonActive: {
    backgroundColor: '#0c2d4a',
    borderColor: '#38bdf8',
    borderWidth: 1.5,
  },
  toggleButtonText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  toggleButtonTextActive: {
    color: '#38bdf8',
  },
  telemetryText: {
    color: '#64748b',
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    marginBottom: 8,
  },
});