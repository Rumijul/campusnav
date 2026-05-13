/**
 * FloorPicker — Maps-style floor selector pill.
 * Positioned bottom-right above the sheet. Active floor highlighted.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GlassView } from '../primitives/GlassView';
import { shadows } from '../../theme/shadows';
import { useTheme } from '../../theme';

interface FloorTarget {
  buildingId: number;
  floorNumber: number;
  label?: string;
}

interface FloorPickerProps {
  floors: FloorTarget[];
  activeFloor: FloorTarget;
  onSelect: (floor: FloorTarget) => void;
}

export function FloorPicker({ floors, activeFloor, onSelect }: FloorPickerProps) {
  const { colors, spacing, typography } = useTheme();

  if (floors.length <= 1) return null;

  return (
    <GlassView blurAmount={15} borderRadius={12} style={shadows.md}>
      <View style={styles.pill}>
        {floors.map((floor, i) => {
          const isActive =
            floor.buildingId === activeFloor.buildingId &&
            floor.floorNumber === activeFloor.floorNumber;

          return (
            <Pressable
              key={`${floor.buildingId}-${floor.floorNumber}`}
              onPress={() => onSelect(floor)}
              style={[
                styles.floorButton,
                i > 0 && { marginLeft: 2 },
                isActive && { backgroundColor: colors.accent },
              ]}
            >
              <Text
                style={[
                  typography.label,
                  {
                    color: isActive ? colors.textInverse : colors.textMuted,
                  },
                ]}
              >
                {floor.label || `F${floor.floorNumber}`}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </GlassView>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    padding: 4,
    gap: 2,
  },
  floorButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
});
