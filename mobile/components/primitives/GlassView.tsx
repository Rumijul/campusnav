/**
 * GlassView — Maps-style frosted glass container.
 * Uses @react-native-community/blur when available, falls back to
 * semi-transparent overlay in Expo Go / environments without native blur.
 */

import React from 'react';
import { StyleSheet, View, ViewStyle, Platform } from 'react-native';

import { useTheme } from '../../theme';

// BlurView may not be available in Expo Go — try/catch the import
let BlurView: React.ComponentType<{
  blurType?: 'dark' | 'light';
  blurAmount?: number;
  style?: ViewStyle;
}> | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const blurModule = require('@react-native-community/blur');
  BlurView = blurModule.BlurView;
} catch {
  // Native blur not available (Expo Go, web, etc.) — use fallback
}

interface GlassViewProps {
  children: React.ReactNode;
  blurAmount?: number;
  borderRadius?: number;
  style?: ViewStyle | ViewStyle[];
}

export function GlassView({
  children,
  blurAmount = 20,
  borderRadius = 16,
  style,
}: GlassViewProps) {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.container, { borderRadius }, style as any]}>
      {BlurView ? (
        <BlurView
          blurType={isDark ? 'dark' : 'light'}
          blurAmount={blurAmount}
          style={[styles.blur, { borderRadius }]}
        />
      ) : (
        <View
          style={[
            styles.blur,
            {
              borderRadius,
              backgroundColor: isDark
                ? 'rgba(15, 23, 42, 0.4)'
                : 'rgba(255, 255, 255, 0.4)',
            },
          ]}
        />
      )}
      <View
        style={[
          styles.overlay,
          {
            borderRadius,
            backgroundColor: colors.glass,
            borderColor: colors.glassBorder,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  blur: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    flex: 1,
    borderWidth: 1,
  },
});
