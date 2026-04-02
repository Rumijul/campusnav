/**
 * FloatingFloorSwitcher — horizontal scrollable row of floor pills.
 *
 * Renders a horizontally scrolling list of floor-number buttons.
 * The currently selected floor is highlighted with the accent color.
 * Used in the floating UI layer above the map to switch floors quickly.
 *
 * Usage:
 *   <FloatingFloorSwitcher
 *     floors={[{ buildingId: 1, floorNumber: 1 }, { buildingId: 1, floorNumber: 2 }]}
 *     selectedFloor={{ buildingId: 1, floorNumber: 2 }}
 *     onSelectFloor={(target) => setSelectedFloor(target)}
 *   />
 */

import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme';
import { FloorPlanTarget } from '../../data/mapApiClient';

export interface FloatingFloorSwitcherProps {
  /** All available floors to display as pills. */
  floors: FloorPlanTarget[];
  /** Currently selected floor. */
  selectedFloor: FloorPlanTarget;
  /** Called when the user selects a different floor. */
  onSelectFloor: (target: FloorPlanTarget) => void;
  /** Optional extra styles applied to the scroll container. */
  style?: object;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns a human-readable label for a floor, e.g. "Floor 2". */
function floorLabel(target: FloorPlanTarget): string {
  return `Floor ${target.floorNumber}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FloatingFloorSwitcher({
  floors,
  selectedFloor,
  onSelectFloor,
  style,
}: FloatingFloorSwitcherProps) {
  const { colors, spacing } = useTheme();

  if (!floors || floors.length === 0) {
    return null;
  }

  const isSelected = (target: FloorPlanTarget) =>
    target.buildingId === selectedFloor.buildingId &&
    target.floorNumber === selectedFloor.floorNumber;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface },
        style,
      ]}
      accessibilityLabel="Floor switcher"
      accessibilityRole="tablist"
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {floors.map((floor, index) => {
          const selected = isSelected(floor);
          return (
            <Pressable
              key={`${floor.buildingId}-${floor.floorNumber}-${index}`}
              onPress={() => onSelectFloor(floor)}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={floorLabel(floor)}
              accessibilityHint="Switches to this floor on the map"
              style={({ pressed }: { pressed: boolean }) => [
                styles.pill,
                {
                  backgroundColor: selected
                    ? colors.chipActive
                    : colors.surfaceElevated,
                  borderColor: selected
                    ? colors.borderAccent
                    : colors.borderMuted,
                },
                pressed && {
                  backgroundColor: selected
                    ? colors.accentSubtle
                    : colors.border,
                },
              ]}
              testID={`floor-pill-${floor.floorNumber}`}
            >
              <Text
                style={[
                  styles.pillText,
                  {
                    color: selected
                      ? colors.chipTextActive
                      : colors.textSecondary,
                    fontWeight: selected ? '700' : '500',
                  },
                ]}
              >
                {floor.floorNumber}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    borderRadius: 22,
    paddingVertical: 6,
    paddingHorizontal: 10,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pill: {
    minWidth: 36,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  pillText: {
    fontSize: 14,
  },
});
