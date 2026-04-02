/**
 * RouteSummaryStrip — compact horizontal route overview.
 *
 * Displays a single row with:
 *   - Total distance (e.g. "350m")
 *   - Estimated time (e.g. "4 min")
 *   - Step count (e.g. "6 steps")
 *
 * Used in the route preview bottom sheet as the header strip above
 * the step list.
 *
 * Usage:
 *   <RouteSummaryStrip
 *     totalDistanceNorm={7.2}
 *     totalDurationSec={240}
 *     stepCount={6}
 *   />
 */

import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme';

export interface RouteSummaryStripProps {
  /** Total route distance in normalized units (≈ 50 m per unit). */
  totalDistanceNorm: number;
  /** Total route duration in seconds. */
  totalDurationSec: number;
  /** Number of direction steps in the route. */
  stepCount: number;
  /** Optional extra styles applied to the container. */
  style?: object;
}

// ─── Formatting helpers ────────────────────────────────────────────────────────

/**
 * Format normalized distance as a human-readable string.
 * 1 normalized unit ≈ 50 m.
 */
function formatDistance(norm: number): string {
  const meters = Math.round(norm * 50);
  if (meters < 1) return '<1m';
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${meters} m`;
}

/** Format seconds as a localized duration string. */
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)} sec`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (secs === 0) return `${mins} min`;
  return `${mins} min ${secs} sec`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RouteSummaryStrip({
  totalDistanceNorm,
  totalDurationSec,
  stepCount,
  style,
}: RouteSummaryStripProps) {
  const { colors, spacing } = useTheme();

  const distanceLabel = formatDistance(totalDistanceNorm);
  const durationLabel = formatDuration(totalDurationSec);
  const stepLabel = stepCount === 1 ? '1 step' : `${stepCount} steps`;

  return (
    <View
      style={[
        styles.strip,
        { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
        style,
      ]}
      accessibilityLabel={`Route summary: ${distanceLabel}, ${durationLabel}, ${stepLabel}`}
      accessibilityRole="text"
    >
      {/* Distance */}
      <View style={styles.chunk}>
        <Text style={[styles.icon, { color: colors.accent }]}>↗</Text>
        <Text style={[styles.value, { color: colors.textPrimary }]}>
          {distanceLabel}
        </Text>
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* Duration */}
      <View style={styles.chunk}>
        <Text style={[styles.icon, { color: colors.accent }]}>⏱</Text>
        <Text style={[styles.value, { color: colors.textPrimary }]}>
          {durationLabel}
        </Text>
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* Step count */}
      <View style={styles.chunk}>
        <Text style={[styles.icon, { color: colors.accent }]}>⋯</Text>
        <Text style={[styles.value, { color: colors.textSecondary }]}>
          {stepLabel}
        </Text>
      </View>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 12,
  },
  chunk: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  icon: {
    fontSize: 13,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: 16,
  },
});
