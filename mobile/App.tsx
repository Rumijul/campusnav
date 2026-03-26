import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  IDLE_BOOTSTRAP_STATE,
  type BootstrapState,
  runAppBootstrap,
} from './bootstrap/appBootstrap';

function nextAttemptFromState(state: BootstrapState): number {
  if (state.phase === 'idle') {
    return 1;
  }

  return state.attempt + 1;
}

function phaseMessage(state: BootstrapState): string {
  switch (state.phase) {
    case 'idle':
      return 'Preparing startup checks.';
    case 'loading':
      return 'Starting CampusNav runtime.';
    case 'ready':
      return 'CampusNav is ready. No sign-in required.';
    case 'error':
      return state.message;
  }
}

export default function App() {
  const [bootstrapState, setBootstrapState] = useState<BootstrapState>(IDLE_BOOTSTRAP_STATE);

  const executeBootstrap = useCallback(async (attempt: number) => {
    const result = await runAppBootstrap({ attempt });

    for (const transition of result.transitions) {
      if (transition.phase === 'ready') {
        console.info('[mobile-bootstrap]', {
          phase: transition.phase,
          attempt: transition.attempt,
          endpoint: transition.apiBaseUrl,
        });
        continue;
      }

      if (transition.phase === 'error') {
        console.warn('[mobile-bootstrap]', {
          phase: transition.phase,
          reason: transition.reason,
          attempt: transition.attempt,
          failedPhase: transition.failedPhase,
        });
        continue;
      }

      if (transition.phase === 'loading') {
        console.info('[mobile-bootstrap]', {
          phase: transition.phase,
          attempt: transition.attempt,
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CampusNav</Text>
      <Text style={styles.subtitle}>Visitor bootstrap shell</Text>

      <Text style={styles.statusLabel}>Bootstrap phase: {bootstrapState.phase}</Text>
      <Text style={styles.statusMessage}>{phaseMessage(bootstrapState)}</Text>

      {bootstrapState.phase === 'loading' ? <ActivityIndicator size="small" color="#38bdf8" /> : null}

      {bootstrapState.phase === 'ready' ? (
        <Text style={styles.readyText}>API endpoint: {bootstrapState.apiBaseUrl}</Text>
      ) : null}

      {bootstrapState.phase === 'error' ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorReason}>Reason: {bootstrapState.reason}</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 10,
  },
  title: {
    color: '#f8fafc',
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: '#cbd5e1',
    fontSize: 14,
    marginBottom: 12,
  },
  statusLabel: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '600',
  },
  statusMessage: {
    color: '#94a3b8',
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 10,
  },
  readyText: {
    color: '#38bdf8',
    fontSize: 13,
    textAlign: 'center',
  },
  errorContainer: {
    marginTop: 6,
    alignItems: 'center',
    gap: 8,
  },
  errorReason: {
    color: '#fda4af',
    fontSize: 13,
  },
  retryButton: {
    backgroundColor: '#0f172a',
    borderColor: '#475569',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  retryButtonText: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '600',
  },
});
