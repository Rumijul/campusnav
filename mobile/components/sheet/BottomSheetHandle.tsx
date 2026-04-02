/**
 * BottomSheetHandle — drag affordance at the top of a BottomSheet.
 *
 * Usage:
 *   <BottomSheetHandle
 *     label="Drag to resize"
 *     showLabel={false}   // hide the text label (collapsed state)
 *   />
 */

import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../theme';

interface Props {
  /** Screen-reader label for the handle. */
  label?: string;
  /** Whether to show the text label (useful to hide in collapsed state). */
  showLabel?: boolean;
}

export function BottomSheetHandle({ label = 'Drag to resize', showLabel = true }: Props) {
  const { colors } = useTheme();

  return (
    <View
      style={styles.container}
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityHint="Swipe up or down to resize the sheet"
    >
      {/* Grip bar */}
      <View style={[styles.bar, { backgroundColor: colors.borderMuted }]} />

      {/* Label */}
      {showLabel && (
        <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
    gap: 6,
  },
  bar: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});
