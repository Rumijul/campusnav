/**
 * ConfidenceRing — GPS confidence indicator.
 * Small colored dot with pulsing ring in top-right during guidance.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { useTheme } from '../../theme';

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'none';

interface ConfidenceRingProps {
  confidence: ConfidenceLevel;
  showPulse?: boolean;
}

export function ConfidenceRing({ confidence, showPulse = true }: ConfidenceRingProps) {
  const { colors } = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!showPulse || confidence === 'none') {
      pulseAnim.setValue(1);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.8,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [showPulse, confidence]);

  const dotColors: Record<ConfidenceLevel, string> = {
    high: colors.confidenceHigh,
    medium: colors.confidenceMedium,
    low: colors.confidenceLow,
    none: colors.confidenceNone,
  };

  const dotColor = dotColors[confidence];

  return (
    <View style={styles.container}>
      {/* Pulse ring */}
      {showPulse && confidence !== 'none' && (
        <Animated.View
          style={[
            styles.pulseRing,
            {
              borderColor: dotColor,
              opacity: pulseAnim.interpolate({
                inputRange: [1, 1.8],
                outputRange: [0.6, 0],
              }),
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />
      )}

      {/* Center dot */}
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
