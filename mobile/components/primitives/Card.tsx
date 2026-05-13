/**
 * Card — Maps-style card container.
 * Standardized padding, radius, border, and optional elevation.
 */

import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { useTheme } from '../../theme';
import { shadows } from '../../theme/shadows';

interface CardProps {
  children: React.ReactNode;
  elevated?: boolean;
  padding?: number;
  style?: ViewStyle;
}

export function Card({ children, elevated, padding = 16, style }: CardProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          padding,
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        elevated && shadows.md,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
  },
});
