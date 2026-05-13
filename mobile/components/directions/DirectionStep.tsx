/**
 * DirectionStep — Maps-style direction step card.
 *
 * Each step shows:
 * - Left accent bar (color-coded by step type)
 * - Turn icon
 * - Instruction text (bold key phrase)
 * - Distance on right
 * - Floor transition badges get distinct styling
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../theme';

export type StepType = 'straight' | 'turn-left' | 'turn-right' | 'stairs-up'
  | 'stairs-down' | 'elevator' | 'ramp' | 'start' | 'end'
  | 'floor-up' | 'floor-down';

interface DirectionStepProps {
  type: StepType;
  instruction: string;
  distance?: string;
  isLast?: boolean;
}

const STEP_ICONS: Record<StepType, string> = {
  straight: '↑',
  'turn-left': '↰',
  'turn-right': '↱',
  'stairs-up': '🪜',
  'stairs-down': '🪜',
  elevator: '🛗',
  ramp: '♿',
  start: '●',
  end: '🏁',
  'floor-up': '⬆',
  'floor-down': '⬇',
};

function accentColor(type: StepType, colors: ReturnType<typeof useTheme>['colors']): string {
  switch (type) {
    case 'straight': return colors.directionStraight;
    case 'turn-left':
    case 'turn-right': return colors.directionTurn;
    case 'stairs-up':
    case 'stairs-down':
    case 'elevator':
    case 'ramp':
    case 'floor-up':
    case 'floor-down': return colors.directionFloor;
    case 'start': return colors.directionStart;
    case 'end': return colors.directionEnd;
  }
}

export function DirectionStep({ type, instruction, distance, isLast }: DirectionStepProps) {
  const { colors, spacing, typography } = useTheme();
  const barColor = accentColor(type, colors);

  return (
    <View style={styles.row}>
      {/* Accent bar + connector line */}
      <View style={styles.accentColumn}>
        <View style={[styles.accentBar, { backgroundColor: barColor }]} />
        {!isLast && <View style={[styles.connector, { backgroundColor: colors.border }]} />}
      </View>

      {/* Icon + instruction */}
      <View style={[styles.content, { gap: spacing.sm }]}>
        <View style={styles.iconRow}>
          <View style={[styles.iconCircle, { backgroundColor: barColor + '20' }]}>
            <Text style={[styles.icon, { color: barColor }]}>
              {STEP_ICONS[type]}
            </Text>
          </View>
        </View>

        <View style={styles.textColumn}>
          <Text
            style={[typography.body, { color: colors.textPrimary }]}
            numberOfLines={2}
          >
            {instruction}
          </Text>
          {distance && (
            <Text style={[typography.caption, { color: colors.textMuted }]}>
              {distance}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    minHeight: 56,
  },
  accentColumn: {
    width: 4,
    alignItems: 'center',
    marginRight: 16,
  },
  accentBar: {
    width: 4,
    height: '100%',
    borderRadius: 2,
  },
  connector: {
    width: 1,
    flex: 1,
    marginTop: -2,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 8,
  },
  iconRow: {
    marginRight: 12,
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 16,
  },
  textColumn: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
});
