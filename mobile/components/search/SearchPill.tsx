/**
 * SearchPill — Maps-style expandable floating search bar.
 *
 * Two states:
 *   Collapsed: Translucent pill showing "From · To"
 *   Expanded:  Two full text inputs with swap + search
 *
 * Uses GlassView for the frosted backdrop.
 */

import React, { useCallback, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { GlassView } from '../primitives/GlassView';
import { useTheme } from '../../theme';
import { shadows } from '../../theme/shadows';

interface SearchPillProps {
  origin: string;
  destination: string;
  onOriginChange: (text: string) => void;
  onDestinationChange: (text: string) => void;
  onSwap: () => void;
  onSearchPress: () => void;
  disabled?: boolean;
}

export function SearchPill({
  origin,
  destination,
  onOriginChange,
  onDestinationChange,
  onSwap,
  onSearchPress,
  disabled,
}: SearchPillProps) {
  const { colors, spacing } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [animHeight] = useState(() => new Animated.Value(0));

  const toggle = useCallback(() => {
    const toValue = expanded ? 0 : 1;
    setExpanded(!expanded);
    Animated.spring(animHeight, {
      toValue,
      damping: 50,
      stiffness: 400,
      mass: 0.8,
      useNativeDriver: false,
    }).start();
  }, [expanded, animHeight]);

  const expandedHeight = animHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 140],
  });

  const collapsedOpacity = animHeight.interpolate({
    inputRange: [0, 0.3],
    outputRange: [1, 0],
  });

  const expandedOpacity = animHeight.interpolate({
    inputRange: [0.5, 1],
    outputRange: [0, 1],
  });

  return (
    <GlassView blurAmount={20} borderRadius={16} style={[shadows.md]}>
      <Pressable onPress={toggle} style={styles.pill}>
        {/* ── Collapsed state ── */}
        <Animated.View
          style={[styles.collapsed, { opacity: collapsedOpacity }]}
          pointerEvents={expanded ? 'none' : 'auto'}
        >
          <Text
            style={[styles.collapsedText, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {origin || 'From'}  ·  {destination || 'To'}
          </Text>
        </Animated.View>

        {/* ── Expanded state ── */}
        <Animated.View
          style={[styles.expanded, { opacity: expandedOpacity, maxHeight: expandedHeight }]}
          pointerEvents={expanded ? 'auto' : 'none'}
        >
          <View style={styles.inputRow}>
            <View style={[styles.dot, { backgroundColor: colors.routeStart }]} />
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              placeholder="Origin"
              placeholderTextColor={colors.textMuted}
              value={origin}
              onChangeText={onOriginChange}
              autoFocus={expanded}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.inputRow}>
            <View style={[styles.dot, { backgroundColor: colors.routeEnd }]} />
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              placeholder="Destination"
              placeholderTextColor={colors.textMuted}
              value={destination}
              onChangeText={onDestinationChange}
            />
          </View>

          <View style={styles.actionsRow}>
            <Pressable
              onPress={onSwap}
              style={[styles.swapButton, { borderColor: colors.border }]}
            >
              <Text style={[styles.swapText, { color: colors.accent }]}>⇅</Text>
            </Pressable>

            <Pressable
              onPress={() => { onSearchPress(); toggle(); }}
              disabled={disabled}
              style={[
                styles.searchButton,
                { backgroundColor: disabled ? colors.surfaceElevated : colors.accent },
              ]}
            >
              <Text
                style={[
                  styles.searchText,
                  { color: disabled ? colors.textMuted : colors.textInverse },
                ]}
              >
                Search
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </Pressable>
    </GlassView>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  collapsed: {
    justifyContent: 'center',
    minHeight: 24,
  },
  collapsedText: {
    fontSize: 15,
    fontWeight: '500',
  },
  expanded: {
    overflow: 'hidden',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 8,
  },
  divider: {
    height: 1,
    marginLeft: 22,
    marginVertical: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  swapButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swapText: {
    fontSize: 18,
  },
  searchButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  searchText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
