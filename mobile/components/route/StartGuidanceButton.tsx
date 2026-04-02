/**
 * StartGuidanceButton — animated call-to-action button to begin turn-by-turn guidance.
 *
 * Renders a large pill-shaped Pressable that scales up on press.
 * Uses react-native-reanimated `withSpring` for a snappy feel.
 *
 * Usage:
 *   <StartGuidanceButton
 *     onPress={() => startGuidance(route)}
 *     disabled={!route}
 *   />
 */

import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useTheme } from '../../theme';

export interface StartGuidanceButtonProps {
  /** Called when the user presses the button. */
  onPress: () => void;
  /** Prevent interaction when true. */
  disabled?: boolean;
  /** Label shown on the button. Defaults to "Start Guidance". */
  label?: string;
  /** Optional extra styles applied to the button container. */
  style?: object;
}

// Spring config for snappy scale animation
const SPRING_CONFIG = {
  damping: 15,
  stiffness: 400,
  mass: 0.8,
};

const PRESSED_SCALE = 0.93;

export function StartGuidanceButton({
  onPress,
  disabled = false,
  label = 'Start Guidance',
  style,
}: StartGuidanceButtonProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(PRESSED_SCALE, SPRING_CONFIG);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, SPRING_CONFIG);
  };

  return (
    <Animated.View style={[styles.wrapper, animatedStyle, style]}>
      <Pressable
        onPress={disabled ? undefined : onPress}
        onPressIn={disabled ? undefined : handlePressIn}
        onPressOut={disabled ? undefined : handlePressOut}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint="Begins turn-by-turn navigation to the selected destination"
        accessibilityState={{ disabled }}
        style={({ pressed }: { pressed: boolean }) => [
          styles.button,
          { backgroundColor: colors.accent },
          pressed && !disabled && { backgroundColor: colors.accentMuted },
          disabled && styles.buttonDisabled,
        ]}
        testID="start-guidance-btn"
      >
        {/* Navigation arrow icon */}
        <View style={[styles.iconWrapper, { backgroundColor: colors.textInverse + '1f' }]}>
          <Text style={[styles.icon, { color: colors.accent }]}>➤</Text>
        </View>

        {/* Label */}
        <Text
          style={[
            styles.label,
            { color: colors.textInverse },
            disabled && { color: colors.textDisabled },
          ]}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'stretch',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 10,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: '#334155',
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 14,
    fontWeight: '700',
  },
  label: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
