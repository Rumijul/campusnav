/**
 * Sheet — Maps-style draggable bottom sheet.
 *
 * 3 snap points (percentage of screen height):
 *   Collapsed (15%): route summary strip
 *   Half (40%):      directions list
 *   Full (85%):      full details + settings
 *
 * Features:
 * - Pan gesture with velocity-aware spring snapping
 * - Translucent backdrop that fades with sheet position
 * - Drag handle bar
 * - Smooth spring animations
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import Reanimated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useTheme } from '../../theme';
import { shadows } from '../../theme/shadows';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export type SnapPoint = 'collapsed' | 'half' | 'full';

const SNAP_FRACTIONS: Record<SnapPoint, number> = {
  collapsed: 0.15,
  half: 0.40,
  full: 0.85,
};

// Spring config: smooth settle (not bouncy) — Maps-like feel
const SPRING_CONFIG = {
  damping: 50,
  stiffness: 300,
  mass: 0.8,
};

interface SheetProps {
  children: React.ReactNode;
  onSnapChange?: (snap: SnapPoint) => void;
  initialSnap?: SnapPoint;
}

export function Sheet({ children, onSnapChange, initialSnap = 'collapsed' }: SheetProps) {
  const { colors } = useTheme();
  const [currentSnap, setCurrentSnap] = useState<SnapPoint>(initialSnap);

  // Shared value for the translateY offset (0 = fully down, negative = up)
  const translateY = useSharedValue(0);

  // Calculate sheet height from snap
  const sheetHeight = SNAP_FRACTIONS[currentSnap] * SCREEN_HEIGHT;

  // Store snap points as pixel offsets from bottom
  const snapOffsets = useRef({
    collapsed: -(SNAP_FRACTIONS.collapsed * SCREEN_HEIGHT),
    half: -(SNAP_FRACTIONS.half * SCREEN_HEIGHT),
    full: -(SNAP_FRACTIONS.full * SCREEN_HEIGHT),
  });

  // Find nearest snap point based on current offset + velocity
  const findNearestSnap = useCallback((offset: number, velocity: number): SnapPoint => {
    // Velocity-aware: if flicking up fast, go to next snap
    // if flicking down fast, go to previous snap
    const absVel = Math.abs(velocity);

    if (absVel > 500) {
      if (velocity < 0) {
        // Flicking up — go to next higher snap
        if (offset < snapOffsets.current.half + 50) return 'full';
        if (offset < snapOffsets.current.collapsed + 50) return 'half';
        return 'collapsed';
      } else {
        // Flicking down — go to next lower snap
        if (offset > snapOffsets.current.half - 50) return 'collapsed';
        if (offset > snapOffsets.current.full - 50) return 'half';
        return 'full';
      }
    }

    // Slow drag — snap to nearest
    const distCollapsed = Math.abs(offset - snapOffsets.current.collapsed);
    const distHalf = Math.abs(offset - snapOffsets.current.half);
    const distFull = Math.abs(offset - snapOffsets.current.full);

    if (distCollapsed <= distHalf && distCollapsed <= distFull) return 'collapsed';
    if (distHalf <= distFull) return 'half';
    return 'full';
  }, []);

  // Reanimated pan gesture
  const gesture = Gesture.Pan()
    .onStart(() => {
      // Capture current offset
    })
    .onUpdate((e) => {
      // Clamp: don't drag above full or below collapsed
      const newY = Math.max(
        snapOffsets.current.full - 20,
        Math.min(0, translateY.value + e.translationY)
      );
      translateY.value = newY;
    })
    .onEnd((e) => {
      const snap = findNearestSnap(translateY.value, e.velocityY);
      const targetOffset = snapOffsets.current[snap];

      translateY.value = withSpring(targetOffset, SPRING_CONFIG, () => {
        runOnJS(setCurrentSnap)(snap);
        if (onSnapChange) runOnJS(onSnapChange)(snap);
      });
    });

  // Set initial position
  useEffect(() => {
    translateY.value = withSpring(snapOffsets.current[initialSnap], SPRING_CONFIG);
  }, []);

  // Animated styles
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => {
    // Backdrop opacity: 0 at collapsed, 1 at half, 1 at full
    const progress = Math.min(
      1,
      Math.max(
        0,
        (-translateY.value - SNAP_FRACTIONS.collapsed * SCREEN_HEIGHT) /
          ((SNAP_FRACTIONS.half - SNAP_FRACTIONS.collapsed) * SCREEN_HEIGHT)
      )
    );
    return { opacity: progress * 0.3 };
  });

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Backdrop */}
      <Reanimated.View style={[styles.backdrop, backdropStyle]} pointerEvents="none">
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => {
            translateY.value = withSpring(snapOffsets.current.collapsed, SPRING_CONFIG);
            setCurrentSnap('collapsed');
            onSnapChange?.('collapsed');
          }}
        />
      </Reanimated.View>

      {/* Sheet */}
      <GestureDetector gesture={gesture}>
        <Reanimated.View
          style={[
            styles.sheet,
            sheetStyle,
            shadows.lg,
            {
              height: SNAP_FRACTIONS.full * SCREEN_HEIGHT + 40,
              backgroundColor: colors.sheet,
              borderColor: colors.glassBorder,
            },
          ]}
        >
          {/* Drag handle — the grabber bar at top */}
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: colors.textMuted }]} />
          </View>

          {/* Content */}
          <View style={styles.content}>{children}</View>
        </Reanimated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    pointerEvents: 'box-none',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  sheet: {
    position: 'absolute',
    bottom: -40, // Offset so sheet starts from bottom of screen
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    opacity: 0.4,
  },
  content: {
    flex: 1,
  },
});
