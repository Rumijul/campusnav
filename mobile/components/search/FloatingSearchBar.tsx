/**
 * FloatingSearchBar — pill-shaped dual-input search widget.
 *
 * Renders a rounded pill containing:
 *   - Origin TextInput (with a location pin icon)
 *   - Swap button (exchanges origin and destination)
 *   - Destination TextInput (with a target icon)
 *
 * All styling driven by useTheme(). Fully accessible with
 * proper labels, roles, and keyboard navigation.
 *
 * Usage:
 *   <FloatingSearchBar
 *     origin={origin}
 *     destination={destination}
 *     onOriginChange={(text) => ...}
 *     onDestinationChange={(text) => ...}
 *     onSwap={() => setOrigin(destination); setDestination(origin)}
 *     onSearchPress={() => ...}
 *   />
 */

import { useCallback } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTheme } from '../../theme';

export interface SearchBarInputs {
  origin: string;
  destination: string;
}

export interface FloatingSearchBarProps {
  /** Current origin text. */
  origin: string;
  /** Current destination text. */
  destination: string;
  /** Called when the origin text changes. */
  onOriginChange: (text: string) => void;
  /** Called when the destination text changes. */
  onDestinationChange: (text: string) => void;
  /** Called when the user presses the swap button. */
  onSwap: () => void;
  /** Called when the search/directions button is pressed. */
  onSearchPress: () => void;
  /** Prevent all interactions when true. */
  disabled?: boolean;
  /** Optional extra styles applied to the pill container. */
  style?: object;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns a shorter secondary label for a location field. */
function fieldLabel(placeholder: string): string {
  if (placeholder.toLowerCase().includes('origin')) return 'From';
  if (placeholder.toLowerCase().includes('destination')) return 'To';
  return placeholder;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FloatingSearchBar({
  origin,
  destination,
  onOriginChange,
  onDestinationChange,
  onSwap,
  onSearchPress,
  disabled = false,
  style,
}: FloatingSearchBarProps) {
  const { colors, spacing, typography } = useTheme();

  const handleSwap = useCallback(() => {
    if (disabled) return;
    onSwap();
  }, [disabled, onSwap]);

  const handleSearch = useCallback(() => {
    if (disabled) return;
    onSearchPress();
  }, [disabled, onSearchPress]);

  const inputStyle = {
    flex: 1,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    fontSize: typography.body.fontSize,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceElevated,
  };

  const activeInputStyle = {
    ...inputStyle,
    borderWidth: 1.5,
    borderColor: colors.borderAccent,
  };

  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: colors.surface },
        disabled && styles.pillDisabled,
        style,
      ]}
      accessibilityRole="none"
    >
      {/* Origin field */}
      <View style={styles.fieldWrapper}>
        <Text
          style={[
            styles.fieldIcon,
            { color: colors.textMuted, fontSize: 14 },
          ]}
          accessibilityElementsHidden
        >
          ◎
        </Text>
        <TextInput
          style={[inputStyle, styles.fieldInput]}
          value={origin}
          onChangeText={onOriginChange}
          placeholder="My location"
          placeholderTextColor={colors.textDisabled}
          returnKeyType="next"
          editable={!disabled}
          accessibilityLabel="Origin location"
          accessibilityHint="Enter your starting location"
          testID="search-origin-input"
        />
      </View>

      {/* Swap button */}
      <Pressable
        onPress={handleSwap}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel="Swap origin and destination"
        accessibilityHint="Exchanges the start and end locations"
        style={({ pressed }: { pressed: boolean }) => [
          styles.swapButton,
          { backgroundColor: colors.surfaceElevated },
          pressed && { backgroundColor: colors.borderMuted },
        ]}
        testID="search-swap-btn"
      >
        <Text style={[styles.swapIcon, { color: colors.accent }]}>⇅</Text>
      </Pressable>

      {/* Destination field */}
      <View style={styles.fieldWrapper}>
        <Text
          style={[
            styles.fieldIcon,
            { color: colors.textMuted, fontSize: 14 },
          ]}
          accessibilityElementsHidden
        >
          ⊕
        </Text>
        <TextInput
          style={[inputStyle, styles.fieldInput]}
          value={destination}
          onChangeText={onDestinationChange}
          placeholder="Where to?"
          placeholderTextColor={colors.textDisabled}
          returnKeyType="go"
          onSubmitEditing={handleSearch}
          editable={!disabled}
          accessibilityLabel="Destination"
          accessibilityHint="Enter your destination"
          testID="search-destination-input"
        />
      </View>

      {/* Search button */}
      <Pressable
        onPress={handleSearch}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel="Get directions"
        accessibilityHint="Starts navigation to the destination"
        style={({ pressed }: { pressed: boolean }) => [
          styles.searchButton,
          { backgroundColor: colors.accent },
          pressed && { backgroundColor: colors.accentMuted },
          disabled && styles.buttonDisabled,
        ]}
        testID="search-submit-btn"
      >
        <Text style={[styles.searchIcon, { color: colors.textInverse }]}>→</Text>
      </Pressable>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 28,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  pillDisabled: {
    opacity: 0.5,
  },
  fieldWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fieldIcon: {
    width: 16,
    textAlign: 'center',
  },
  fieldInput: {
    paddingLeft: 0,
    paddingRight: 8,
  },
  swapButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  swapIcon: {
    fontSize: 16,
    fontWeight: '700',
  },
  searchButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  searchIcon: {
    fontSize: 16,
    fontWeight: '700',
  },
});
