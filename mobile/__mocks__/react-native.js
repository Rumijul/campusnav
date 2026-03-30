/**
 * Mock react-native for jsdom test environment.
 *
 * @testing-library/react-native needs these exports to exist and be
 * proper React component types so it can render and query them.
 * We use @testing-library/react's DOM primitives mapped to HTML elements.
 */
'use strict';
const React = require('react');

function View({ children, style, testID, ...props }) {
  return React.createElement('div', { 'data-testid': testID, style, ...props }, children);
}

function Text({ children, style, numberOfLines, ...props }) {
  return React.createElement('span', { style, ...props }, children);
}

function Pressable({ onPress, children, disabled, style, testID, ...props }) {
  return React.createElement(
    'button',
    { onClick: onPress, disabled, 'data-testid': testID, style, ...props },
    children,
  );
}

function TextInput({ style, value, onChangeText, placeholder, placeholderTextColor, ...props }) {
  return React.createElement('input', {
    type: 'text',
    value,
    onChange: (e) => onChangeText && onChangeText(e.target.value),
    placeholder,
    style,
    ...props,
  });
}

function FlatList({ data, renderItem, keyExtractor, style, ...props }) {
  if (!data || data.length === 0) return null;
  return React.createElement(
    'div',
    { style, 'data-flatlist': true, ...props },
    data.map((item, index) =>
      React.createElement('div', { key: keyExtractor ? keyExtractor(item, index) : index },
        renderItem({ item, index }),
      ),
    ),
  );
}

function ActivityIndicator({ color, size, ...props }) {
  const label = size === 'small' ? '◌' : '⟳';
  return React.createElement('span', { 'aria-label': 'loading', ...props }, label);
}

module.exports = {
  View,
  Text,
  Pressable,
  TextInput,
  FlatList,
  ActivityIndicator,
  StyleSheet: {
    create: (styles) => styles,
  },
  Platform: {
    OS: 'ios',
    select: (opts) => (opts.ios ?? opts.default ?? {}),
  },
  Dimensions: {
    get: () => ({ width: 375, height: 812 }),
    addEventListener: () => ({ remove: () => {} }),
  },
  PixelRatio: {
    get: () => 2,
  },
  ScrollView: View,
  TouchableOpacity: Pressable,
};
