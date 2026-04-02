/**
 * Mock react-native-reanimated for jsdom test environment.
 * Provides the animated component primitives that ConfidenceIndicator uses.
 */
'use strict';
const React = require('react');

function View({ style, children, testID }: {
  style?: unknown; children?: React.ReactNode; testID?: string;
}): React.ReactElement {
  return React.createElement('div', { 'data-testid': testID, style }, children);
}

function AnimatedView(props: {
  style?: unknown; children?: React.ReactNode; testID?: string;
}): React.ReactElement {
  return View(props);
}

function useSharedValue(initialValue: number) {
  return { value: initialValue };
}

function useAnimatedStyle(expand: (v: { value: number }) => unknown) {
  return expand({ value: 0 });
}

function withRepeat(inner: unknown, _countOrConfig?: unknown, _config2?: unknown) {
  return inner;
}

function withSequence(inner1: unknown, inner2: unknown) {
  return inner1;
}

function withTiming(value: number, _config?: unknown, _callback?: unknown) {
  return value;
}

function Easing(_config?: unknown) {
  return 0;
}

module.exports = {
  View: AnimatedView,
  Text: View,
  default: {
    createAnimatedComponent: (Component: unknown) => Component,
  },
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
};
