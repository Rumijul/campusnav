import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  PanResponder,
  StyleSheet,
  View, LayoutChangeEvent, PanResponderInstance,
} from 'react-native';

import {
  applyPanDelta,
  applyPinchRotate,
  createInitialMapTransform,
  mapTransformsEqual,
  type MapTransform, ViewportDimensions, ViewportPoint,
} from './mapTransform';
import { useTheme } from '../theme';


interface MapViewportProps {
  imageUri: string;
  onTransformChange?: (transform: MapTransform) => void;
  /** Device heading rotation in degrees to add to manual rotation during active guidance. */
  headingRotationDeg?: number;
}

interface GestureTracking {
  mode: 'none' | 'pan' | 'pinch';
  lastPanPoint: ViewportPoint | null;
  pinchStartDistance: number;
  pinchStartAngle: number;
  pinchStartTransform: MapTransform;
}

function touchPoint(touch: { locationX: number; locationY: number }): ViewportPoint {
  return {
    x: touch.locationX,
    y: touch.locationY,
  };
}

function distance(a: ViewportPoint, b: ViewportPoint): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function angle(a: ViewportPoint, b: ViewportPoint): number {
  return Math.atan2(b.y - a.y, b.x - a.x);
}

function midpoint(a: ViewportPoint, b: ViewportPoint): ViewportPoint {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  };
}

function formatTransformValue(value: number): string {
  if (!Number.isFinite(value)) {
    return '0';
  }

  return value.toFixed(2);
}

export function MapViewport({ imageUri, onTransformChange, headingRotationDeg }: MapViewportProps) {
  const { colors } = useTheme();
  const [viewport, setViewport] = useState<ViewportDimensions | null>(null);
  const [transform, setTransform] = useState<MapTransform>(createInitialMapTransform);

  const gesture = useRef<GestureTracking>({
    mode: 'none',
    lastPanPoint: null,
    pinchStartDistance: 0,
    pinchStartAngle: 0,
    pinchStartTransform: createInitialMapTransform(),
  });

  useEffect(() => {
    onTransformChange?.(transform);
  }, [onTransformChange, transform]);

  const commitTransform = useCallback((updater: (current: MapTransform) => MapTransform) => {
    setTransform((current) => {
      const next = updater(current);
      return mapTransformsEqual(current, next) ? current : next;
    });
  }, []);

  const panResponder: PanResponderInstance = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          const touches = event.nativeEvent.touches;

          if (touches.length >= 2) {
            const first = touches[0];
            const second = touches[1];
            if (!first || !second) {
              return;
            }

            const a = touchPoint(first);
            const b = touchPoint(second);
            gesture.current.mode = 'pinch';
            gesture.current.pinchStartDistance = distance(a, b);
            gesture.current.pinchStartAngle = angle(a, b);
            gesture.current.pinchStartTransform = transform;
            gesture.current.lastPanPoint = null;
            return;
          }

          const first = touches[0];
          if (!first) {
            return;
          }

          gesture.current.mode = 'pan';
          gesture.current.lastPanPoint = touchPoint(first);
        },
        onPanResponderMove: (event) => {
          const touches = event.nativeEvent.touches;

          if (touches.length >= 2) {
            const first = touches[0];
            const second = touches[1];
            if (!first || !second) {
              return;
            }

            const firstPoint = touchPoint(first);
            const secondPoint = touchPoint(second);

            if (gesture.current.mode !== 'pinch' || gesture.current.pinchStartDistance <= 0) {
              gesture.current.mode = 'pinch';
              gesture.current.pinchStartDistance = distance(firstPoint, secondPoint);
              gesture.current.pinchStartAngle = angle(firstPoint, secondPoint);
              gesture.current.pinchStartTransform = transform;
              gesture.current.lastPanPoint = null;
              return;
            }

            const currentDistance = distance(firstPoint, secondPoint);
            const currentAngle = angle(firstPoint, secondPoint);
            if (!Number.isFinite(currentDistance) || currentDistance <= 0 || !Number.isFinite(currentAngle)) {
              return;
            }

            const scaleFactor = currentDistance / gesture.current.pinchStartDistance;
            const rotationDeltaDeg = ((currentAngle - gesture.current.pinchStartAngle) * 180) / Math.PI;
            const focal = midpoint(firstPoint, secondPoint);

            commitTransform(() =>
              applyPinchRotate(gesture.current.pinchStartTransform, {
                scaleFactor,
                rotationDeltaDeg,
                focal,
                viewport,
              }),
            );

            return;
          }

          if (touches.length === 1) {
            const touch = touches[0];
            if (!touch) {
              return;
            }

            const point = touchPoint(touch);

            if (gesture.current.mode !== 'pan' || !gesture.current.lastPanPoint) {
              gesture.current.mode = 'pan';
              gesture.current.lastPanPoint = point;
              return;
            }

            const delta = {
              x: point.x - gesture.current.lastPanPoint.x,
              y: point.y - gesture.current.lastPanPoint.y,
            };

            commitTransform((current) => applyPanDelta(current, delta));
            gesture.current.lastPanPoint = point;
            return;
          }

          gesture.current.mode = 'none';
          gesture.current.lastPanPoint = null;
        },
        onPanResponderRelease: () => {
          gesture.current.mode = 'none';
          gesture.current.lastPanPoint = null;
          gesture.current.pinchStartDistance = 0;
        },
        onPanResponderTerminate: () => {
          gesture.current.mode = 'none';
          gesture.current.lastPanPoint = null;
          gesture.current.pinchStartDistance = 0;
        },
      }),
    [commitTransform, transform, viewport],
  );

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width <= 0 || height <= 0) {
      return;
    }

    setViewport({ width, height });
  };

  const applyScaleAtViewportCenter = (scaleFactor: number) => {
    commitTransform((current) =>
      applyPinchRotate(current, {
        scaleFactor,
        rotationDeltaDeg: 0,
        focal: {
          x: viewport ? viewport.width / 2 : 0,
          y: viewport ? viewport.height / 2 : 0,
        },
        viewport,
      }),
    );
  };

  const applyRotationAtViewportCenter = (rotationDeltaDeg: number) => {
    commitTransform((current) =>
      applyPinchRotate(current, {
        scaleFactor: 1,
        rotationDeltaDeg,
        focal: {
          x: viewport ? viewport.width / 2 : 0,
          y: viewport ? viewport.height / 2 : 0,
        },
        viewport,
      }),
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.viewport, { backgroundColor: colors.background }]} onLayout={onLayout} {...panResponder.panHandlers}>
        <Image
          source={{ uri: imageUri }}
          resizeMode="contain"
          style={[
            styles.mapImage,
            {
              transform: [
                { translateX: transform.translation.x },
                { translateY: transform.translation.y },
                { rotateZ: `${transform.rotationDeg + (headingRotationDeg ?? 0)}deg` },
                { scale: transform.scale },
              ],
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
  },
  viewport: {
    width: '100%',
    height: '100%',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
});
