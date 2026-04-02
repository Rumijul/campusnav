/**
 * ConfidenceIndicator — colored dot + optional detail popover + pulse ring.
 *
 * Renders a small (12×12px) filled circle whose color reflects the
 * current GPS/heading confidence level.  Tapping the dot toggles a
 * small inline label showing the level name.
 *
 * A PulseRing sub-component renders an animated ring behind the dot
 * during non-idle guidance phases.  It scales and fades continuously
 * using react-native-reanimated.
 */

import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '../../theme';

// Re-export for consumers; defined inline to avoid importing guidanceState.ts
// which uses TypeScript type-as-assertion patterns that vitest's oxc parser
// cannot process during test transform.
export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'none';
export const ConfidenceLevel = undefined as unknown as ConfidenceLevel;

// ─── Color map ────────────────────────────────────────────────────────────────

const LABEL_TEXT: Record<ConfidenceLevel, string> = {
  high: 'GPS OK',
  medium: 'Heading?',
  low: 'Weak GPS',
  none: 'No GPS',
};

const ICON_MAP: Record<ConfidenceLevel, string> = {
  high: '',
  medium: '',
  low: '',
  none: '⚠',
};

// ─── PulseRing ───────────────────────────────────────────────────────────────

interface PulseRingProps {
  color: string;
  show: boolean;
}

function PulseRing({ color, show }: PulseRingProps) {
  const scale = useSharedValue(1.0);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    if (!show) {
      scale.value = 1.0;
      opacity.value = 0;
      return;
    }
    // Reset to starting values before beginning the loop
    scale.value = 1.0;
    opacity.value = 0.6;
    scale.value = withRepeat(
      withSequence(
        withTiming(1.8, { duration: 1000, easing: Easing.out(Easing.ease) }),
        withTiming(1.0, { duration: 0 }),
      ),
      -1,
      false,
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 1000, easing: Easing.out(Easing.ease) }),
        withTiming(0.6, { duration: 0 }),
      ),
      -1,
      false,
    );
  }, [show, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!show) return null;

  return (
    <Animated.View
      style={[
        styles.pulseRing,
        { backgroundColor: color },
        animatedStyle,
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

// ─── ConfidenceIndicator ──────────────────────────────────────────────────────

interface Props {
  confidence: ConfidenceLevel;
  /** Show the pulsing ring. Defaults to true. */
  showPulse?: boolean;
}

export function ConfidenceIndicator({ confidence, showPulse = true }: Props) {
  const [showLabel, setShowLabel] = useState(false);
  const { colors } = useTheme();

  const colorMap: Record<ConfidenceLevel, string> = {
    high: colors.confidenceHigh,
    medium: colors.confidenceMedium,
    low: colors.confidenceLow,
    none: colors.confidenceNone,
  };

  const labelColorMap: Record<ConfidenceLevel, string> = {
    high: colors.successMuted,
    medium: colors.warningMuted,
    low: colors.orangeMuted,
    none: colors.errorMuted,
  };

  const dotColor = colorMap[confidence];
  const labelColor = labelColorMap[confidence];
  const labelText = LABEL_TEXT[confidence];
  const icon = ICON_MAP[confidence];

  return (
    <View
      style={styles.container}
      accessibilityRole="button"
      accessibilityLabel={`GPS confidence: ${confidence}`}
      testID="confidence-indicator"
    >
      {/* PulseRing renders behind the dot via absolute positioning */}
      <PulseRing color={dotColor} show={showPulse} />

      {/* Tappable dot */}
      <Pressable
        style={styles.dotTouchable}
        onPress={() => setShowLabel(s => !s)}
        testID="confidence-dot"
        accessibilityRole="button"
        accessibilityLabel={`GPS confidence: ${confidence}`}
      >
        <View style={[styles.dot, { backgroundColor: dotColor }]}>
          {icon ? <Text style={styles.icon}>{icon}</Text> : null}
        </View>
      </Pressable>

      {/* Label badge */}
      {showLabel && (
        <View
          style={[
            styles.labelBadge,
            { backgroundColor: dotColor + '33', borderColor: dotColor },
          ]}
        >
          <Text style={[styles.labelText, { color: labelColor }]}>
            {labelText}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
  },
  pulseRing: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 9999,
  },
  dotTouchable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 7,
    color: '#fff',
    lineHeight: 9,
  },
  labelBadge: {
    position: 'absolute',
    top: 32,
    left: '50%',
    transform: [{ translateX: -30 }],
    width: 60,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    alignItems: 'center',
  },
  labelText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
