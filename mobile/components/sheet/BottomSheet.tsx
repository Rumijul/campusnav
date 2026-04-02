/**
 * BottomSheet — gesture-driven bottom sheet with 3 snap points.
 *
 * Snap points (distance from bottom of screen):
 *   0 = collapsed  — 120px tall strip
 *   1 = half       — 300px tall
 *   2 = full        — 600px tall
 *
 * The sheet fills the full width and is positioned absolutely
 * at the bottom of its parent.  The three snap heights are
 * relative to the bottom of the screen (collapsed sits 120px
 * above the bottom; half sits 300px above; full reaches 600px
 * below the top of the screen).
 *
 * Usage:
 *   <BottomSheet
 *     snapPoints={[120, 300, 600]}
 *     initialSnapIndex={0}
 *     onSnapChange={(idx) => ...}
 *   >
 *     {content}
 *   </BottomSheet>
 */

import { useCallback } from 'react';
import { Dimensions, LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useTheme } from '../../theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export type SnapIndex = 0 | 1 | 2;

interface Props {
  /** Three snap point heights in pixels. */
  snapPoints?: [number, number, number];
  /** Index into snapPoints for initial position (default 0 = collapsed). */
  initialSnapIndex?: SnapIndex;
  /** Called whenever the sheet settles at a new snap point. */
  onSnapChange?: (index: SnapIndex) => void;
  /** Optional extra styles applied to the sheet container. */
  containerStyle?: object;
  children?: React.ReactNode;
}

/** Snap point heights used throughout S02 layout. */
export const DEFAULT_SNAP_POINTS: [number, number, number] = [120, 300, 600];

/**
 * Returns the Y offset (from screen bottom) for a given snap index.
 * At index 0 (collapsed) the sheet sits 120px above the bottom.
 * At index 2 (full) the sheet's top is 600px below the top.
 * The sheet height is always SCREEN_HEIGHT.
 */
function snapToOffset(index: SnapIndex, snapPoints: [number, number, number]): number {
  // sheetY is the top of the sheet measured from the TOP of the screen.
  // The sheet is always SCREEN_HEIGHT tall.
  // At index 0: sheet top is at SCREEN_HEIGHT - 120 (120px above bottom)
  // At index 1: sheet top is at SCREEN_HEIGHT - 300
  // At index 2: sheet top is at SCREEN_HEIGHT - 600
  return SCREEN_HEIGHT - snapPoints[index];
}

export function BottomSheet({
  snapPoints = DEFAULT_SNAP_POINTS,
  initialSnapIndex = 0,
  onSnapChange,
  containerStyle,
  children,
}: Props) {
  const { colors } = useTheme();

  // Track the sheet's top Y position (measured from screen top).
  const sheetY = useSharedValue(snapToOffset(initialSnapIndex, snapPoints));
  const startY = useSharedValue(sheetY.value);
  const currentSnap = useSharedValue<SnapIndex>(initialSnapIndex);

  const notifySnapChange = useCallback(
    (idx: SnapIndex) => {
      onSnapChange?.(idx);
    },
    [onSnapChange],
  );

  const findNearestSnap = useCallback(
    (currentY: number): SnapIndex => {
      // Find the snap point whose Y position is closest to currentY
      let nearest = 0;
      let minDist = Math.abs(snapToOffset(0, snapPoints) - currentY);
      for (let i = 1; i < snapPoints.length; i++) {
        const dist = Math.abs(snapToOffset(i as SnapIndex, snapPoints) - currentY);
        if (dist < minDist) {
          minDist = dist;
          nearest = i;
        }
      }
      return nearest as SnapIndex;
    },
    [snapPoints],
  );

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startY.value = sheetY.value;
    })
    .onUpdate((event) => {
      const newY = startY.value + event.translationY;
      // Clamp so the sheet never goes fully off-screen at the top
      const minY = SCREEN_HEIGHT - snapPoints[2]; // full = top-most
      const maxY = SCREEN_HEIGHT - snapPoints[0]; // collapsed = bottom-most
      sheetY.value = Math.max(minY, Math.min(maxY, newY));
    })
    .onEnd(() => {
      const nearest = findNearestSnap(sheetY.value);
      sheetY.value = withSpring(snapToOffset(nearest, snapPoints), {
        damping: 50,
        stiffness: 300,
      });
      if (nearest !== currentSnap.value) {
        currentSnap.value = nearest;
        runOnJS(notifySnapChange)(nearest);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    top: sheetY.value,
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          styles.sheet,
          { backgroundColor: colors.surface },
          containerStyle,
          animatedStyle,
        ]}
        accessibilityLabel="Bottom sheet"
      >
        <View style={styles.inner}>{children}</View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 100,
  },
  inner: {
    flex: 1,
  },
});
