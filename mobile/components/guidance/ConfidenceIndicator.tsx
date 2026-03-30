/**
 * ConfidenceIndicator — colored dot + optional detail popover.
 *
 * Renders a small (12×12px) filled circle whose color reflects the
 * current GPS/heading confidence level.  Tapping the dot toggles a
 * small inline label showing the level name.
 */

import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ConfidenceLevel } from '../../routing/guidanceState';

export { ConfidenceLevel } from '../../routing/guidanceState';

// ─── Color map ────────────────────────────────────────────────────────────────

const DOT_COLOR: Record<ConfidenceLevel, string> = {
  high: '#22c55e',   // green
  medium: '#eab308', // yellow
  low: '#f97316',    // orange
  none: '#ef4444',   // red
};

const LABEL_COLOR: Record<ConfidenceLevel, string> = {
  high: '#4ade80',
  medium: '#facc15',
  low: '#fb923c',
  none: '#f87171',
};

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

interface Props {
  confidence: ConfidenceLevel;
}

export function ConfidenceIndicator({ confidence }: Props) {
  const [showLabel, setShowLabel] = useState(false);

  const dotColor = DOT_COLOR[confidence];
  const labelColor = LABEL_COLOR[confidence];
  const labelText = LABEL_TEXT[confidence];
  const icon = ICON_MAP[confidence];

  return (
    <Pressable
      style={styles.container}
      onPress={() => setShowLabel(s => !s)}
      accessibilityRole="button"
      accessibilityLabel={`GPS confidence: ${confidence}`}
      testID="confidence-indicator"
    >
      <View style={[styles.dot, { backgroundColor: dotColor }]}>
        {icon ? <Text style={styles.icon}>{icon}</Text> : null}
      </View>
      {showLabel && (
        <View style={[styles.labelBadge, { backgroundColor: dotColor + '33', borderColor: dotColor }]}>
          <Text style={[styles.labelText, { color: labelColor }]}>
            {labelText}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
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
    top: 16,
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
