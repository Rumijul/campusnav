/**
 * LiveGuidanceOverlay — real-time guidance overlay driven by GuidanceState.
 *
 * Conditionally renders one of five UI variants based on `guidanceState.phase`:
 * - `idle`          → nothing
 * - `low-confidence` → orange banner prompting position confirmation
 * - `guiding`       → step card with instruction, icon, distance, progress
 * - `rerouting`     → blue banner with spinner
 * - `arrived`       → green celebration card
 */

import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRef, useState } from 'react';

import { getActiveStep, type GuidanceState } from '../../routing/guidanceState';
import type { DirectionStep, NormalizedFloorRecord } from '../../domain/navGraph';
import { ConfidenceIndicator, type ConfidenceLevel } from './ConfidenceIndicator';

// ─── Step icon helpers (mirrors RoutePreview) ────────────────────────────────

const STEP_ICONS: Record<string, string> = {
  'straight': '↑',
  'turn-left': '←',
  'turn-right': '→',
  'sharp-left': '↙',
  'sharp-right': '↘',
  'arrive': '🏁',
  'accessible': '♿',
  'stairs-up': '⬆',
  'stairs-down': '⬇',
  'elevator': '🛗',
  'ramp': '♿',
};

function stepIcon(step: DirectionStep): string {
  return STEP_ICONS[step.icon] ?? '→';
}

// ─── Distance formatting ─────────────────────────────────────────────────────

/**
 * Format a normalized distance as a human-readable string.
 * Normalized coordinate space → approximate real distance (50 m per unit).
 */
function formatDistance(norm: number): string {
  const meters = Math.round(norm * 50);
  if (meters < 1) return '<1m';
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)}km`;
  return `${meters}m`;
}

/**
 * Sum of distances for all steps from currentStepIndex onward.
 */
function remainingDistance(state: GuidanceState): number {
  const { route, currentStepIndex } = state;
  if (route.phase !== 'ready' || !route.directions) return 0;
  return route.directions.steps
    .slice(currentStepIndex)
    .reduce((sum, s) => sum + s.distanceM, 0);
}

// ─── Props ───────────────────────────────────────────────────────────────────

export interface LiveGuidanceOverlayProps {
  guidanceState: GuidanceState;
  onConfirmPosition: () => void;
  onStopGuidance: () => void;
  /** Floor ID of the current snapped position. */
  floorId?: number | null;
  /** Floor lookup map for display labels. */
  floorMap?: Map<number, NormalizedFloorRecord>;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Low-confidence banner: orange/yellow background, confirm button. */
function LowConfidenceBanner({
  onConfirmPosition,
  floorId,
  floorMap,
}: {
  onConfirmPosition: () => void;
  floorId?: number | null;
  floorMap?: Map<number, NormalizedFloorRecord>;
}) {
  const floorLabel = floorId && floorMap ? floorMap.get(floorId)?.floor.floorNumber ?? floorId : null;

  return (
    <View style={styles.lowConfidenceBanner} testID="low-confidence-banner">
      <View style={styles.bannerRow}>
        <ConfidenceIndicator confidence="low" />
        <Text style={styles.lowConfidenceText}>
          Can't confirm your location.{'\n'}
          Tap the map to confirm where you are, or move to an open area.
          {floorLabel != null ? `\nYou are on Floor ${floorLabel}.` : ''}
        </Text>
      </View>
      <Pressable style={styles.confirmButton} onPress={onConfirmPosition} testID="confirm-position-btn">
        <Text style={styles.confirmButtonText}>Confirm location</Text>
      </Pressable>
    </View>
  );
}

/** Rerouting banner: blue background with spinner. */
function ReroutingBanner() {
  return (
    <View style={styles.reroutingBanner} testID="rerouting-banner">
      <ActivityIndicator color="#38bdf8" size="small" />
      <Text style={styles.reroutingText}>Recalculating your route...</Text>
    </View>
  );
}

/** Main guiding card: step instruction, icon, distance, progress. */
function GuidingCard({
  state,
  onStopGuidance,
  floorId,
  floorMap,
}: {
  state: GuidanceState;
  onStopGuidance: () => void;
  floorId?: number | null;
  floorMap?: Map<number, NormalizedFloorRecord>;
}) {
  const activeStep = getActiveStep(state);
  const { route, currentStepIndex, positionConfidence } = state;

  const totalSteps = route.phase === 'ready' && route.directions
    ? route.directions.steps.length
    : 0;
  const progressLabel = `Step ${currentStepIndex + 1} of ${totalSteps}`;
  const remaining = remainingDistance(state);

  const instruction = activeStep?.instruction ?? 'Navigating...';
  const icon = activeStep ? stepIcon(activeStep) : '→';

  return (
    <View style={styles.guidingCard} testID="guiding-card">
      {/* Top row: step icon + instruction */}
      <View style={styles.stepRow}>
        <View style={styles.stepIconContainer}>
          <Text style={styles.stepIcon}>{icon}</Text>
        </View>
        <Text style={styles.instructionText} numberOfLines={2}>
          {instruction}
        </Text>
        <ConfidenceIndicator confidence={positionConfidence} />
      </View>

      {/* Floor badge row */}
      <FloorBadge floorId={floorId} floorMap={floorMap} />

      {/* Bottom row: distance + progress + end button */}
      <View style={styles.bottomRow}>
        <Text style={styles.distanceText}>{formatDistance(remaining)} remaining</Text>
        <Text style={styles.progressText}>{progressLabel}</Text>
        <Pressable onPress={onStopGuidance} testID="stop-guidance-btn">
          <Text style={styles.endButton}>End guidance</Text>
        </Pressable>
      </View>
    </View>
  );
}

/** Arrived celebration card. */
function ArrivedCard({
  state,
  onStopGuidance,
}: {
  state: GuidanceState;
  onStopGuidance: () => void;
}) {
  const destLabel =
    state.route.phase === 'ready' && state.route.destination
      ? state.route.destination.label
      : 'Destination';

  return (
    <View style={styles.arrivedCard} testID="arrived-card">
      <Text style={styles.checkmark}>✅</Text>
      <Text style={styles.arrivedTitle}>You've arrived!</Text>
      <Text style={styles.arrivedDest}>{destLabel}</Text>
      <Pressable style={styles.doneButton} onPress={onStopGuidance} testID="done-btn">
        <Text style={styles.doneButtonText}>Done</Text>
      </Pressable>
    </View>
  );
}

/** Floor badge — shows current floor label next to step icon in the guiding card. */
function FloorBadge({
  floorId,
  floorMap,
}: {
  floorId?: number | null;
  floorMap?: Map<number, NormalizedFloorRecord>;
}) {
  if (!floorId || !floorMap) return null;
  const record = floorMap.get(floorId);
  if (!record) return null;
  return (
    <View style={styles.floorBadge} testID="floor-badge">
      <Text style={styles.floorBadgeText}>Floor {record.floor.floorNumber}</Text>
    </View>
  );
}

/** Floor transition banner — briefly shown for 2500 ms when floor changes. */
function FloorTransitionBanner({
  floorId,
  floorMap,
}: {
  floorId?: number | null;
  floorMap?: Map<number, NormalizedFloorRecord>;
}) {
  const prevFloorIdRef = useRef<number | null>(null);
  const [visible, setVisible] = useState(false);
  const [displayFloorId, setDisplayFloorId] = useState<number | null>(null);

  if (floorId !== prevFloorIdRef.current && floorId !== null && prevFloorIdRef.current !== null) {
    prevFloorIdRef.current = floorId;
    const label = floorMap?.get(floorId)?.floor.floorNumber ?? floorId;
    setDisplayFloorId(floorId);
    setVisible(true);
    setTimeout(() => setVisible(false), 2500);
  } else if (floorId !== null) {
    prevFloorIdRef.current = floorId;
  }

  if (!visible || displayFloorId === null) return null;

  const label = floorMap?.get(displayFloorId)?.floor.floorNumber ?? displayFloorId;

  return (
    <View style={styles.floorTransitionBanner} testID="floor-transition-banner">
      <Text style={styles.floorTransitionText}>Now on Floor {label}</Text>
    </View>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function LiveGuidanceOverlay({
  guidanceState,
  onConfirmPosition,
  onStopGuidance,
  floorId,
  floorMap,
}: LiveGuidanceOverlayProps) {
  const { phase } = guidanceState;

  if (phase === 'idle') return null;

  if (phase === 'low-confidence') {
    return <LowConfidenceBanner onConfirmPosition={onConfirmPosition} floorId={floorId} floorMap={floorMap} />;
  }

  if (phase === 'rerouting') {
    return <ReroutingBanner />;
  }

  if (phase === 'arrived') {
    return <ArrivedCard state={guidanceState} onStopGuidance={onStopGuidance} />;
  }

  // phase === 'guiding'
  return (
    <>
      <FloorTransitionBanner floorId={floorId} floorMap={floorMap} />
      <GuidingCard
        state={guidanceState}
        onStopGuidance={onStopGuidance}
        floorId={floorId}
        floorMap={floorMap}
      />
    </>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Low-confidence banner
  lowConfidenceBanner: {
    backgroundColor: '#7c2d12',
    borderColor: '#f97316',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    margin: 12,
    gap: 10,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  lowConfidenceText: {
    flex: 1,
    color: '#fed7aa',
    fontSize: 13,
    lineHeight: 18,
  },
  confirmButton: {
    backgroundColor: '#f97316',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },

  // Rerouting banner
  reroutingBanner: {
    backgroundColor: '#0c2d4a',
    borderColor: '#38bdf8',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    margin: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reroutingText: {
    color: '#7dd3fc',
    fontSize: 14,
    fontWeight: '600',
  },

  // Guiding card
  guidingCard: {
    backgroundColor: '#0f172a',
    borderColor: '#1e3a5f',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    margin: 12,
    gap: 10,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#1e3a5f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIcon: {
    fontSize: 18,
    color: '#38bdf8',
    fontWeight: '700',
  },
  instructionText: {
    flex: 1,
    color: '#f1f5f9',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  distanceText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '600',
  },
  progressText: {
    color: '#475569',
    fontSize: 12,
    flex: 1,
  },
  endButton: {
    color: '#64748b',
    fontSize: 12,
    textDecorationLine: 'underline',
  },

  // Arrived card
  arrivedCard: {
    backgroundColor: '#052e16',
    borderColor: '#22c55e',
    borderWidth: 1,
    borderRadius: 14,
    padding: 20,
    margin: 12,
    alignItems: 'center',
    gap: 8,
  },
  checkmark: {
    fontSize: 32,
  },
  arrivedTitle: {
    color: '#4ade80',
    fontSize: 20,
    fontWeight: '700',
  },
  arrivedDest: {
    color: '#86efac',
    fontSize: 14,
  },
  doneButton: {
    backgroundColor: '#22c55e',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 24,
    marginTop: 4,
  },
  doneButtonText: {
    color: '#052e16',
    fontSize: 15,
    fontWeight: '700',
  },

  // Floor badge — small chip shown next to step icon
  floorBadge: {
    backgroundColor: '#1e3a5f',
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
    alignSelf: 'flex-start',
    marginTop: -4,
    marginLeft: 46, // align with step icon start
  },
  floorBadgeText: {
    color: '#7dd3fc',
    fontSize: 11,
    fontWeight: '600',
  },

  // Floor transition banner — full-width toast shown for 2500 ms on floor change
  floorTransitionBanner: {
    backgroundColor: '#1d4ed8',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 12,
    marginBottom: 4,
    alignItems: 'center',
  },
  floorTransitionText: {
    color: '#eff6ff',
    fontSize: 13,
    fontWeight: '700',
  },
});
