/**
 * AccessibleToggle — iOS-style animated switch.
 *
 * Uses react-native-reanimated spring animation to drive the knob
 * between off (left) and on (right) positions.
 * Full ARIA roles and state announcements for screen readers.
 *
 * Usage:
 *   <AccessibleToggle
 *     value={settings.accessibleMode}
 *     onValueChange={(v) => setSettings(s => ({ ...s, accessibleMode: v }))}
 *     disabled={false}
 *     accessibilityLabel="Accessible mode"
 *   />
 */

import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useTheme } from '../../theme';

interface Props {
  /** Current on/off state. */
  value: boolean;
  /** Called when the user toggles the switch. */
  onValueChange: (value: boolean) => void;
  /** Prevent interaction when true. */
  disabled?: boolean;
  /** Screen-reader label for the track. */
  accessibilityLabel?: string;
  /** Screen-reader hint shown when the control is focused. */
  accessibilityHint?: string;
}

// Spring config for a snappy iOS-like feel
const SPRING_CONFIG = {
  damping: 20,
  stiffness: 400,
  mass: 0.6,
};

const TRACK_WIDTH = 51;   // iOS standard
const TRACK_HEIGHT = 31;  // iOS standard
const KNOB_SIZE = 27;     // iOS standard
const KNOB_MARGIN = 2;    // gap between knob and track edge
const KNOB_TRAVEL = TRACK_WIDTH - KNOB_SIZE - KNOB_MARGIN * 2;

export function AccessibleToggle({
  value,
  onValueChange,
  disabled = false,
  accessibilityLabel = 'Toggle switch',
  accessibilityHint = 'Double tap to change setting',
}: Props) {
  const { colors } = useTheme();
  const knobX = useSharedValue(value ? KNOB_TRAVEL : 0);

  const handleToggle = () => {
    const next = !value;
    knobX.value = withSpring(next ? KNOB_TRAVEL : 0, SPRING_CONFIG);
    onValueChange(next);
  };

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: knobX.value }],
  }));

  const trackBg = value ? colors.accent : colors.borderMuted;

  return (
    <Pressable
      onPress={disabled ? undefined : handleToggle}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      style={styles.container}
    >
      <View
        style={[
          styles.track,
          { backgroundColor: trackBg, opacity: disabled ? 0.4 : 1 },
        ]}
      >
        <Animated.View style={[styles.knob, knobStyle]}>
          {/* Knob highlight — subtle inner shine */}
          <View style={styles.knobHighlight} />
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
  },
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    justifyContent: 'center',
    paddingHorizontal: KNOB_MARGIN,
  },
  knob: {
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
    overflow: 'hidden',
  },
  knobHighlight: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: 2,
    height: '40%',
    borderRadius: KNOB_SIZE / 2,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
});
