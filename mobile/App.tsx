import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  IDLE_MAP_BOOTSTRAP_STATE,
  type MapBootstrapState,
  runMapBootstrap,
} from './bootstrap/mapBootstrapState';
import { MapViewport } from './map/MapViewport';
import {
  createInitialMapTransform,
  mapTransformsEqual,
  type MapTransform,
} from './map/mapTransform';

function nextAttemptFromState(state: MapBootstrapState): number {
  if (state.phase === 'idle') {
    return 1;
  }

  return state.attempt + 1;
}

function phaseMessage(state: MapBootstrapState): string {
  switch (state.phase) {
    case 'idle':
      return 'Preparing startup checks.';
    case 'loading':
      return `Loading ${state.currentPhase} contract from ${state.endpoint}.`;
    case 'ready':
      return 'CampusNav map is ready for visitor navigation.';
    case 'error':
      return state.message;
  }
}

function formatMetric(value: number): string {
  if (!Number.isFinite(value)) {
    return '0';
  }

  return value.toFixed(2);
}

export default function App() {
  const [bootstrapState, setBootstrapState] = useState<MapBootstrapState>(IDLE_MAP_BOOTSTRAP_STATE);
  const [transformState, setTransformState] = useState<MapTransform>(createInitialMapTransform());

  const executeBootstrap = useCallback(async (attempt: number) => {
    const result = await runMapBootstrap({ attempt });

    for (const transition of result.transitions) {
      if (transition.phase === 'loading') {
        console.info('[mobile-bootstrap]', {
          phase: transition.phase,
          attempt: transition.attempt,
          currentPhase: transition.currentPhase,
          endpoint: transition.endpoint,
        });
      }

      if (transition.phase === 'ready') {
        console.info('[mobile-bootstrap]', {
          phase: transition.phase,
          attempt: transition.attempt,
          endpoint: transition.image.endpoint,
        });
      }

      if (transition.phase === 'error') {
        console.warn('[mobile-bootstrap]', {
          phase: transition.phase,
          attempt: transition.attempt,
          failedPhase: transition.failedPhase,
          endpoint: transition.endpoint,
          reason: transition.reason,
          recoverable: transition.recoverable,
        });
      }
    }

    setBootstrapState(result.state);
  }, []);

  useEffect(() => {
    void executeBootstrap(1);
  }, [executeBootstrap]);

  const onRetryPress = () => {
    void executeBootstrap(nextAttemptFromState(bootstrapState));
  };

  const onTransformChange = useCallback((nextTransform: MapTransform) => {
    setTransformState((current) =>
      mapTransformsEqual(current, nextTransform)
        ? current
        : {
            scale: nextTransform.scale,
            rotationDeg: nextTransform.rotationDeg,
            translation: { ...nextTransform.translation },
          },
    );
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CampusNav</Text>
      <Text style={styles.subtitle}>Visitor runtime shell (no sign-in)</Text>

      <Text style={styles.statusLabel}>Bootstrap phase: {bootstrapState.phase}</Text>
      <Text style={styles.statusMessage}>{phaseMessage(bootstrapState)}</Text>

      {bootstrapState.phase === 'loading' ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color="#38bdf8" />
          <Text style={styles.loadingText}>{bootstrapState.currentPhase}</Text>
        </View>
      ) : null}

      {bootstrapState.phase === 'ready' ? (
        <View style={styles.readyContainer}>
          <Text style={styles.readyText}>API endpoint: {bootstrapState.apiBaseUrl}</Text>
          <Text style={styles.readyText}>Image endpoint: {bootstrapState.image.endpoint}</Text>
          <Text style={styles.readyText}>
            Graph buildings: {bootstrapState.graph.graph.buildings.length}
          </Text>
          <MapViewport imageUri={bootstrapState.image.endpoint} onTransformChange={onTransformChange} />
          <Text style={styles.telemetryText}>
            viewport scale={formatMetric(transformState.scale)} rotation={formatMetric(transformState.rotationDeg)}°
            tx={formatMetric(transformState.translation.x)} ty={formatMetric(transformState.translation.y)}
          </Text>
        </View>
      ) : null}

      {bootstrapState.phase === 'error' ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorReason}>Failed phase: {bootstrapState.failedPhase}</Text>
          <Text style={styles.errorReason}>Reason: {bootstrapState.reason}</Text>
          <Text style={styles.errorReason}>Endpoint: {bootstrapState.endpoint ?? 'n/a'}</Text>
          <Pressable onPress={onRetryPress} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry startup</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
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
  readyContainer: {
    flex: 1,
    gap: 8,
  },
  readyText: {
    color: '#38bdf8',
    fontSize: 12,
  },
  telemetryText: {
    color: '#64748b',
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  errorContainer: {
    marginTop: 6,
    gap: 4,
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
});
