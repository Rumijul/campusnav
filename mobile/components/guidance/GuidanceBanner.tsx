/**
 * GuidanceBanner — Maps-style compact guidance strip.
 * Shows current instruction like "Turn right in 50m".
 * Slides in from top during active guidance.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GlassView } from '../primitives/GlassView';
import { shadows } from '../../theme/shadows';
import { useTheme } from '../../theme';

interface GuidanceBannerProps {
  instruction: string;
  distance?: string;
  floorLabel?: string;
  progress?: number; // 0-1 progress to next turn
  onStop: () => void;
}

const DIRECTION_ICONS: Record<string, string> = {
  straight: '↑',
  left: '↰',
  right: '↱',
  'slight-left': '↖',
  'slight-right': '↗',
  'u-turn': '↩',
  stairs: '🪜',
  elevator: '🛗',
  arrived: '🏁',
};

export function GuidanceBanner({
  instruction,
  distance,
  floorLabel,
  progress = 0,
  onStop,
}: GuidanceBannerProps) {
  const { colors, spacing, typography } = useTheme();

  // Attempt to pick an icon from the instruction
  const icon = Object.entries(DIRECTION_ICONS).find(([key]) =>
    instruction.toLowerCase().includes(key)
  )?.[1] || '↑';

  return (
    <GlassView blurAmount={20} borderRadius={14} style={shadows.md}>
      <View style={styles.banner}>
        {/* Left: icon + instruction */}
        <View style={styles.info}>
          <View style={[styles.iconCircle, { backgroundColor: colors.accentSubtle }]}>
            <Text style={[styles.icon, { color: colors.accent }]}>{icon}</Text>
          </View>

          <View style={styles.textCol}>
            <Text
              style={[typography.bodyBold, { color: colors.textPrimary }]}
              numberOfLines={1}
            >
              {instruction}
            </Text>
            {(distance || floorLabel) && (
              <Text style={[typography.caption, { color: colors.textMuted }]}>
                {[distance, floorLabel].filter(Boolean).join(' · ')}
              </Text>
            )}
          </View>
        </View>

        {/* Right: stop button */}
        <Pressable
          onPress={onStop}
          style={[styles.stopButton, { backgroundColor: colors.surfaceElevated }]}
        >
          <Text style={[typography.bodyBold, { color: colors.textMuted }]}>✕</Text>
        </Pressable>
      </View>

      {/* Progress bar */}
      <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: colors.accent,
              width: `${Math.min(100, progress * 100)}%`,
            },
          ]}
        />
      </View>
    </GlassView>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  info: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  stopButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBar: {
    height: 2,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
});
