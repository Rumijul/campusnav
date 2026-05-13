/**
 * RoutePath — animated SVG route overlay.
 * Draws itself from origin to destination over 800ms.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

export interface RoutePathPoint {
  x: number;
  y: number;
  floorId: number;
}

interface RoutePathProps {
  path: RoutePathPoint[];
  activeFloorId: number;
  standard?: boolean; // true = blue, false = amber (accessible)
  viewportWidth: number;
  viewportHeight: number;
}

export function RoutePath({
  path,
  activeFloorId,
  standard = true,
  viewportWidth,
  viewportHeight,
}: RoutePathProps) {
  const dashAnim = useRef(new Animated.Value(1)).current;

  // Filter to active floor
  const floorPoints = path.filter((p) => p.floorId === activeFloorId);
  if (floorPoints.length < 2) return null;

  // Compute total path length
  let totalLength = 0;
  const segments: { x1: number; y1: number; x2: number; y2: number; len: number }[] = [];
  for (let i = 1; i < floorPoints.length; i++) {
    const dx = floorPoints[i].x * viewportWidth - floorPoints[i - 1].x * viewportWidth;
    const dy = floorPoints[i].y * viewportHeight - floorPoints[i - 1].y * viewportHeight;
    const len = Math.hypot(dx, dy);
    totalLength += len;
    segments.push({
      x1: floorPoints[i - 1].x * viewportWidth,
      y1: floorPoints[i - 1].y * viewportHeight,
      x2: floorPoints[i].x * viewportWidth,
      y2: floorPoints[i].y * viewportHeight,
      len,
    });
  }

  // Animate dash offset on mount
  useEffect(() => {
    dashAnim.setValue(1);
    Animated.timing(dashAnim, {
      toValue: 0,
      duration: 800,
      delay: 16, // prevent flash of fully-drawn path
      useNativeDriver: false,
    }).start();
  }, [path, activeFloorId]);

  const color = standard ? '#3B82F6' : '#F59E0B';
  const glowColor = standard
    ? 'rgba(59, 130, 246, 0.25)'
    : 'rgba(245, 158, 11, 0.25)';

  return (
    <AnimatedSvg
      width={viewportWidth}
      height={viewportHeight}
      style={StyleSheet.absoluteFill}
      strokeDasharray={totalLength}
      strokeDashoffset={dashAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, totalLength],
      })}
    >
      {/* Glow layer */}
      {segments.map((seg, i) => (
        <Line
          key={`glow-${i}`}
          x1={seg.x1}
          y1={seg.y1}
          x2={seg.x2}
          y2={seg.y2}
          stroke={glowColor}
          strokeWidth={8}
          strokeLinecap="round"
        />
      ))}

      {/* Main line */}
      {segments.map((seg, i) => (
        <Line
          key={`line-${i}`}
          x1={seg.x1}
          y1={seg.y1}
          x2={seg.x2}
          y2={seg.y2}
          stroke={color}
          strokeWidth={4}
          strokeLinecap="round"
        />
      ))}

      {/* Start marker */}
      <Circle
        cx={floorPoints[0].x * viewportWidth}
        cy={floorPoints[0].y * viewportHeight}
        r={6}
        fill="#22C55E"
        stroke="#0F172A"
        strokeWidth={2}
      />

      {/* End marker */}
      <Circle
        cx={floorPoints[floorPoints.length - 1].x * viewportWidth}
        cy={floorPoints[floorPoints.length - 1].y * viewportHeight}
        r={6}
        fill="#EF4444"
        stroke="#0F172A"
        strokeWidth={2}
      />
    </AnimatedSvg>
  );
}
