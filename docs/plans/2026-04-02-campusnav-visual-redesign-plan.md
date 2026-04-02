# CampusNav Visual Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the visual redesign specified in `docs/plans/2026-04-02-campusnav-visual-redesign-design.md` — new theme system, floating UI layout, bottom sheet, and animations.

**Architecture:** Build a theme system with light/dark tokens first, then create new floating/bottom-sheet components alongside existing ones (no breaking changes until final integration), then wire everything together in App.tsx.

**Tech Stack:** react-native-reanimated, react-native-gesture-handler, React Native useColorScheme(), React Native SVG (for animated route path)

---

## Dependency Install

### Task 1: Install animation dependencies

**Files:**
- Modify: `mobile/package.json`

**Step 1: Add dependencies to package.json**

Add to `dependencies` in `mobile/package.json`:

```json
"react-native-reanimated": "^4.0.0",
"react-native-gesture-handler": "^2.20.0",
"react-native-svg": "^15.8.0",
"@react-native-community/blur": "^4.4.0"
```

**Step 2: Install dependencies**

Run: `cd mobile && npm install`

**Step 3: Configure babel.config.js for reanimated**

Modify `babel.config.js` in `mobile/` root — add `'react-native-reanimated/plugin'` to plugins array:

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
  };
};
```

**Step 4: Verify install**

Run: `cd mobile && npx expo install --check`
Expected: No missing peer dependency warnings

**Step 5: Commit**

```bash
git add mobile/package.json mobile/babel.config.js
git commit -m "deps: add reanimated, gesture-handler, svg, blur"
```

---

## Theme System

### Task 2: Create theme types and color tokens

**Files:**
- Create: `mobile/theme/colors.ts`
- Create: `mobile/theme/spacing.ts`
- Create: `mobile/theme/typography.ts`
- Create: `mobile/theme/index.ts`

**Step 1: Write the theme types and color tokens**

Create `mobile/theme/colors.ts`:

```typescript
export const darkColors = {
  background: '#0B0F19',
  surface: '#111827',
  surfaceElevated: '#1F2937',
  primary: '#3B82F6',
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  border: '#374151',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
} as const;

export const lightColors = {
  background: '#F3F4F6',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  primary: '#007AFF',
  textPrimary: '#111827',
  textSecondary: '#4B5563',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
} as const;

export type ColorTokens = typeof darkColors;
```

Create `mobile/theme/spacing.ts`:

```typescript
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
} as const;

export type SpacingKey = keyof typeof spacing;
```

Create `mobile/theme/typography.ts`:

```typescript
import { TextStyle } from 'react-native';

export const typography = {
  title: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 30,
  } satisfies TextStyle,
  sectionHeader: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
  } satisfies TextStyle,
  body: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 20,
  } satisfies TextStyle,
  caption: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  } satisfies TextStyle,
} as const;
```

Create `mobile/theme/index.ts`:

```typescript
import { useColorScheme } from 'react-native';
import { darkColors, lightColors, ColorTokens } from './colors';
import { spacing } from './spacing';
import { typography } from './typography';

export interface Theme {
  colors: ColorTokens;
  spacing: typeof spacing;
  typography: typeof typography;
  isDark: boolean;
}

export function useTheme(): Theme {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  return {
    colors: isDark ? darkColors : lightColors,
    spacing,
    typography,
    isDark,
  };
}

export { darkColors, lightColors, spacing, typography };
export type { ColorTokens } from './colors';
```

**Step 2: Run typecheck**

Run: `cd mobile && npx tsc --noEmit`
Expected: No errors (theme files are new, no breaking changes)

**Step 3: Commit**

```bash
git add mobile/theme/colors.ts mobile/theme/spacing.ts mobile/theme/typography.ts mobile/theme/index.ts
git commit -m "feat(theme): add color tokens, spacing scale, typography, useTheme hook"
```

---

## Bottom Sheet Component

### Task 3: Build BottomSheet component

**Files:**
- Create: `mobile/components/sheet/BottomSheet.tsx`
- Create: `mobile/components/sheet/BottomSheetHandle.tsx`
- Test: `mobile/components/sheet/BottomSheet.test.tsx`

**Step 1: Write the failing test**

Create `mobile/components/sheet/BottomSheet.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react-native';
import { BottomSheet } from './BottomSheet';

describe('BottomSheet', () => {
  it('renders children when provided', () => {
    const { getByText } = render(
      <BottomSheet snapPoints={{ collapsed: 120, half: 300, full: 600 }}>
        <>{({ snapPoint }) => <>{String(snapPoint)}</>}</>
      </BottomSheet>
    );
    expect(getByText('collapsed')).toBeTruthy();
  });
});
```

Run: `cd mobile && npx vitest run components/sheet/BottomSheet.test.tsx`
Expected: FAIL — component doesn't exist yet

**Step 2: Write the BottomSheet implementation**

Create `mobile/components/sheet/BottomSheet.tsx`:

```tsx
/**
 * BottomSheet — draggable bottom sheet with 3 snap points.
 * Built with react-native-gesture-handler + react-native-reanimated.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '../../theme';

export type SnapPoint = 'collapsed' | 'half' | 'full';

export interface BottomSheetProps {
  children: (context: { snapPoint: SnapPoint }) => React.ReactNode;
  snapPoints: {
    collapsed: number; // height in pixels
    half: number;
    full: number;
  };
  defaultSnapPoint?: SnapPoint;
}

const SPRING_CONFIG = {
  damping: 20,
  stiffness: 200,
};

export function BottomSheet({ children, snapPoints, defaultSnapPoint = 'collapsed' }: BottomSheetProps) {
  const theme = useTheme();
  const translateY = useSharedValue(snapPoints[defaultSnapPoint]);
  const contextY = useSharedValue(0);

  const snapTo = (point: SnapPoint) => {
    'worklet';
    translateY.value = withSpring(snapPoints[point], SPRING_CONFIG);
  };

  const gesture = Gesture.Pan()
    .onStart(() => {
      contextY.value = translateY.value;
    })
    .onUpdate((event) => {
      translateY.value = Math.max(
        snapPoints.full,
        Math.min(snapPoints.collapsed, contextY.value + event.translationY)
      );
    })
    .onEnd((event) => {
      const current = translateY.value;
      const velocity = event.velocityY;
      const midpoint = (snapPoints.collapsed + snapPoints.half) / 2;

      if (velocity > 500) {
        // Fast downward flick → collapse
        snapTo('collapsed');
      } else if (velocity < -500) {
        // Fast upward flick → expand to full
        snapTo('full');
      } else if (current < midpoint) {
        snapTo('collapsed');
      } else if (current < (snapPoints.half + snapPoints.full) / 2) {
        snapTo('half');
      } else {
        snapTo('full');
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const snapPoint: SnapPoint =
    translateY.value < (snapPoints.collapsed + snapPoints.half) / 2
      ? 'collapsed'
      : translateY.value < (snapPoints.half + snapPoints.full) / 2
      ? 'half'
      : 'full';

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          styles.sheet,
          { backgroundColor: theme.colors.surface },
          animatedStyle,
        ]}
      >
        <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />
        {children({ snapPoint })}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
});
```

**Step 3: Run tests**

Run: `cd mobile && npx vitest run components/sheet/BottomSheet.test.tsx`
Expected: PASS

**Step 4: Commit**

```bash
git add mobile/components/sheet/
git commit -m "feat(sheet): add BottomSheet with 3 snap points and gesture handling"
```

---

## Floating Search Bar Component

### Task 4: Build FloatingSearchBar component

**Files:**
- Create: `mobile/components/search/FloatingSearchBar.tsx`
- Test: `mobile/components/search/FloatingSearchBar.test.tsx`

**Step 1: Write the failing test**

Create `mobile/components/search/FloatingSearchBar.test.tsx` — write a test that asserts the component renders two text input fields and a swap button.

Run: `npx vitest run ...` — Expected: FAIL

**Step 2: Write the FloatingSearchBar implementation**

Create `mobile/components/search/FloatingSearchBar.tsx`:

```tsx
/**
 * FloatingSearchBar — pill-shaped floating search bar at top of screen.
 * Contains origin field, swap button, destination field.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../../theme';

interface Props {
  originValue: string;
  destinationValue: string;
  onOriginChange: (text: string) => void;
  onDestinationChange: (text: string) => void;
  onSwap: () => void;
  onFocus?: () => void;
}

export function FloatingSearchBar({
  originValue,
  destinationValue,
  onOriginChange,
  onDestinationChange,
  onSwap,
  onFocus,
}: Props) {
  const theme = useTheme();

  return (
    <View style={[styles.pill, { backgroundColor: theme.colors.surface + 'CC' }]}>
      <TextInput
        style={[styles.input, { color: theme.colors.textPrimary }]}
        placeholder="Start location"
        placeholderTextColor={theme.colors.textMuted}
        value={originValue}
        onChangeText={onOriginChange}
        onFocus={onFocus}
      />
      <Pressable
        onPress={onSwap}
        style={[styles.swapButton, { backgroundColor: theme.colors.surfaceElevated }]}
        accessibilityLabel="Swap start and destination"
      >
        <Text style={[styles.swapIcon, { color: theme.colors.primary }]}>⇅</Text>
      </Pressable>
      <TextInput
        style={[styles.input, { color: theme.colors.textPrimary }]}
        placeholder="Where to?"
        placeholderTextColor={theme.colors.textMuted}
        value={destinationValue}
        onChangeText={onDestinationChange}
        onFocus={onFocus}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 6,
  },
  swapButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swapIcon: {
    fontSize: 14,
    fontWeight: '700',
  },
});
```

**Step 3: Run tests**

Run: `npx vitest run components/search/FloatingSearchBar.test.tsx`

**Step 4: Commit**

```bash
git add mobile/components/search/
git commit -m "feat(search): add FloatingSearchBar component"
```

---

## Floating Floor Switcher

### Task 5: Build FloatingFloorSwitcher component

**Files:**
- Create: `mobile/components/floor/FloatingFloorSwitcher.tsx`

**Step 1: Write the component**

Create `mobile/components/floor/FloatingFloorSwitcher.tsx`:

```tsx
/**
 * FloatingFloorSwitcher — horizontal pill of floor numbers floating over the map.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme';
import { FloorPlanTarget } from '../../data/mapApiClient';

interface Props {
  targets: FloorPlanTarget[];
  activeTarget: FloorPlanTarget | null;
  onSelect: (target: FloorPlanTarget) => void;
}

export function FloatingFloorSwitcher({ targets, activeTarget, onSelect }: Props) {
  const theme = useTheme();

  if (targets.length <= 1) return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface + 'CC' }]}>
      {targets.map((target) => {
        const isActive =
          activeTarget?.buildingId === target.buildingId &&
          activeTarget?.floorNumber === target.floorNumber;
        return (
          <Pressable
            key={`${target.buildingId}-${target.floorNumber}`}
            onPress={() => onSelect(target)}
            style={[
              styles.pill,
              {
                backgroundColor: isActive
                  ? theme.colors.primary
                  : theme.colors.surfaceElevated,
              },
            ]}
          >
            <Text
              style={[
                styles.label,
                { color: isActive ? '#fff' : theme.colors.textSecondary },
              ]}
            >
              {target.floorNumber}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
});
```

**Step 2: Commit**

```bash
git add mobile/components/floor/FloatingFloorSwitcher.tsx
git commit -m "feat(floor): add FloatingFloorSwitcher component"
```

---

## Direction Step Card Component

### Task 6: Build DirectionStepCard component

**Files:**
- Create: `mobile/components/route/DirectionStepCard.tsx`

**Step 7: Write the DirectionStepCard**

Create `mobile/components/route/DirectionStepCard.tsx`:

```tsx
/**
 * DirectionStepCard — step row with left accent border, icon, instruction.
 * States: current (highlighted), upcoming, completed.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useTheme } from '../../theme';
import { DirectionStep } from '../../domain/navGraph';

interface Props {
  step: DirectionStep;
  accessibleMode: boolean;
  state: 'current' | 'upcoming' | 'completed';
}

const STEP_ICONS: Record<string, string> = {
  'straight': '↑',
  'turn-left': '←',
  'turn-right': '→',
  'sharp-left': '↙',
  'sharp-right': '↘',
  'arrive': '🏁',
  'accessible': '♿',
  'stairs-up': '⬆',
  'stairs-down': '⬇',
  'elevator': '🛗',
  'ramp': '♿',
};

function stepIcon(step: DirectionStep): string {
  return STEP_ICONS[step.icon] ?? '→';
}

export function DirectionStepCard({ step, accessibleMode, state }: Props) {
  const theme = useTheme();
  const icon = stepIcon(step);

  const accentColor =
    state === 'completed'
      ? theme.colors.textMuted
      : state === 'current'
      ? theme.colors.primary
      : step.isAccessibleSegment
      ? '#facc15'
      : '#38bdf8';

  const textColor =
    state === 'completed'
      ? theme.colors.textMuted
      : theme.colors.textPrimary;

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(state === 'completed' ? 0.5 : 1, { duration: 150 }),
    transform: [{ scale: withTiming(state === 'current' ? 1.02 : 1, { duration: 150 }) }],
  }));

  return (
    <Animated.View style={[styles.row, animatedStyle]}>
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
      <View style={[styles.iconBox, { backgroundColor: accentColor + '20' }]}>
        <Text style={[styles.icon, { color: accentColor }]}>{icon}</Text>
      </View>
      <View style={styles.content}>
        <Text style={[styles.instruction, { color: textColor }]} numberOfLines={2}>
          {step.instruction}
        </Text>
        <Text style={[styles.meta, { color: theme.colors.textMuted }]}>
          {Math.round(step.distanceM)}m · {Math.round(step.durationSec)}s
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    paddingRight: 16,
  },
  accentBar: {
    width: 3,
    height: '100%',
    minHeight: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    gap: 2,
  },
  instruction: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 20,
  },
  meta: {
    fontSize: 13,
  },
});
```

**Step 2: Commit**

```bash
git add mobile/components/route/DirectionStepCard.tsx
git commit -m "feat(route): add DirectionStepCard with current/upcoming/completed states"
```

---

## Route Summary Strip

### Task 7: Build RouteSummaryStrip component

**Files:**
- Create: `mobile/components/route/RouteSummaryStrip.tsx`

**Step 1: Write the component**

Create `mobile/components/route/RouteSummaryStrip.tsx`:

```tsx
/**
 * RouteSummaryStrip — compact strip shown in collapsed bottom sheet state.
 * Shows floor badge, ETA, distance.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme';

interface Props {
  floorNumber: number;
  buildingId: number;
  totalMinutes: number;
  totalMeters: number;
  isGuidanceActive?: boolean;
}

export function RouteSummaryStrip({ floorNumber, buildingId, totalMinutes, totalMeters, isGuidanceActive }: Props) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.badge, { backgroundColor: theme.colors.primary + '20' }]}>
        <Text style={[styles.badgeText, { color: theme.colors.primary }]}>
          Fl {floorNumber}
        </Text>
      </View>
      <Text style={[styles.eta, { color: theme.colors.textPrimary }]}>
        ~{Math.round(totalMinutes)} min
      </Text>
      <Text style={[styles.separator]}>·</Text>
      <Text style={[styles.distance, { color: theme.colors.textSecondary }]}>
        {totalMeters < 1000 ? `${totalMeters}m` : `${(totalMeters / 1000).toFixed(1)}km`}
      </Text>
      {isGuidanceActive && (
        <View style={[styles.guidanceBadge, { backgroundColor: theme.colors.success + '20' }]}>
          <Text style={[styles.guidanceText, { color: theme.colors.success }]}>
            ● Guiding
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  eta: {
    fontSize: 15,
    fontWeight: '600',
  },
  separator: {
    fontSize: 13,
    color: '#6B7280',
  },
  distance: {
    fontSize: 14,
  },
  guidanceBadge: {
    marginLeft: 'auto',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  guidanceText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
```

**Step 2: Commit**

```bash
git add mobile/components/route/RouteSummaryStrip.tsx
git commit -m "feat(route): add RouteSummaryStrip component"
```

---

## Animated Route Path Overlay

### Task 8: Add animated route path drawing to RoutePathOverlay

**Files:**
- Modify: `mobile/components/route/RoutePathOverlay.tsx`

**Step 1: Read the current implementation**

The current `RoutePathOverlay` renders a polyline. We need to add an animated variant that uses reanimated.

**Step 2: Add animated stroke-dashoffset to RoutePathOverlay**

Modify `mobile/components/route/RoutePathOverlay.tsx` — add a `useAnimated` boolean prop. When true, the path draws itself using a reanimated `strokeDashoffset` value that animates from full path length to 0 over 800ms.

```tsx
// Add to imports
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';

// Add prop: useAnimated?: boolean
// When useAnimated is true:
// const progress = useSharedValue(0);
// useEffect(() => { progress.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) }); }, []);
// Animated path uses strokeDashoffset = pathLength * (1 - progress.value)
```

**Step 3: Run tests**

Run: `cd mobile && npx vitest run components/route/RoutePathOverlay.test.tsx`
Expected: PASS (if test exists) or verify manually

**Step 4: Commit**

```bash
git add mobile/components/route/RoutePathOverlay.tsx
git commit -m "feat(route): add animated route path drawing to RoutePathOverlay"
```

---

## Floor Transition Animation

### Task 9: Add floor cross-fade animation to MapViewportFloor

**Files:**
- Modify: `mobile/components/floor/FloorTransitionView.tsx` (new file)
- Modify: `mobile/map/MapViewportFloor.tsx`

**Step 1: Create FloorTransitionView**

Create `mobile/components/floor/FloorTransitionView.tsx`:

```tsx
/**
 * FloorTransitionView — cross-fades between two floor images.
 * Used when switching floors.
 */

import React, { useEffect } from 'react';
import { StyleSheet, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface Props {
  oldUri: string;
  newUri: string;
  isTransitioning: boolean;
}

export function FloorTransitionView({ oldUri, newUri, isTransitioning }: Props) {
  const oldOpacity = useSharedValue(1);
  const newOpacity = useSharedValue(0);

  useEffect(() => {
    if (isTransitioning) {
      oldOpacity.value = withTiming(0, { duration: 200, easing: Easing.ease });
      newOpacity.value = withTiming(1, { duration: 200, easing: Easing.ease });
    } else {
      oldOpacity.value = 1;
      newOpacity.value = 0;
    }
  }, [isTransitioning, oldUri, newUri]);

  const oldStyle = useAnimatedStyle(() => ({ opacity: oldOpacity.value }));
  const newStyle = useAnimatedStyle(() => ({ opacity: newOpacity.value }));

  return (
    <>
      <Animated.Image source={{ uri: oldUri }} style={[styles.image, oldStyle]} />
      <Animated.Image source={{ uri: newUri }} style={[styles.image, newStyle]} />
    </>
  );
}

const styles = StyleSheet.create({
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
});
```

**Step 2: Update MapViewportFloor to use FloorTransitionView**

In `MapViewportFloor`, replace the single `MapViewport` + `Image` with `FloorTransitionView` and wire up the transition trigger on `activeFloorTarget` change.

**Step 3: Commit**

```bash
git add mobile/components/floor/FloorTransitionView.tsx mobile/map/MapViewportFloor.tsx
git commit -m "feat(map): add floor cross-fade animation on floor switch"
```

---

## Confidence Dot Enhancement

### Task 10: Add pulsing ring animation to ConfidenceIndicator

**Files:**
- Modify: `mobile/components/guidance/ConfidenceIndicator.tsx`

**Step 1: Enhance ConfidenceIndicator with pulsing ring**

Modify `ConfidenceIndicator` to add a pulsing ring animation using `react-native-reanimated` that activates when `confidence` is not `none`. The ring scales from 1 to 1.5 and fades out, looping.

**Step 2: Update color tokens to use theme**

Replace hardcoded colors (`#22c55e`, `#eab308`, etc.) with theme colors.

**Step 3: Commit**

```bash
git add mobile/components/guidance/ConfidenceIndicator.tsx
git commit -m "feat(guidance): add pulsing ring animation to ConfidenceIndicator"
```

---

## Start Guidance Button

### Task 11: Build StartGuidanceButton component

**Files:**
- Create: `mobile/components/guidance/StartGuidanceButton.tsx`

**Step 1: Write the component**

Create `mobile/components/guidance/StartGuidanceButton.tsx` — a full-width primary button with press-in scale animation (0.95 scale, 100ms) using `react-native-reanimated`.

```tsx
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useTheme } from '../../theme';

interface Props {
  onPress: () => void;
  disabled?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function StartGuidanceButton({ onPress, disabled }: Props) {
  const theme = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPressIn={() => { scale.value = withTiming(0.95, { duration: 100 }); }}
      onPressOut={() => { scale.value = withTiming(1, { duration: 100 }); }}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        { backgroundColor: disabled ? theme.colors.textMuted : theme.colors.primary },
        animatedStyle,
      ]}
    >
      <Text style={styles.label}>Start Guidance</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
```

**Step 2: Commit**

```bash
git add mobile/components/guidance/StartGuidanceButton.tsx
git commit -m "feat(guidance): add StartGuidanceButton with press animation"
```

---

## AccessibleToggle Component

### Task 12: Build AccessibleToggle component

**Files:**
- Create: `mobile/components/settings/AccessibleToggle.tsx`

**Step 1: Write the component**

Create `mobile/components/settings/AccessibleToggle.tsx` — iOS-style toggle using `react-native-reanimated` for smooth thumb animation. Uses theme colors.

```tsx
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import { useTheme } from '../../theme';

interface Props {
  value: boolean;
  onValueChange: (value: boolean) => void;
}

const TRACK_WIDTH = 51;
const TRACK_HEIGHT = 31;
const THUMB_SIZE = 27;
const THUMB_OFFSET = 2;

export function AccessibleToggle({ value, onValueChange }: Props) {
  const theme = useTheme();
  const progress = useSharedValue(value ? 1 : 0);

  React.useEffect(() => {
    progress.value = withSpring(value ? 1 : 0, { damping: 15, stiffness: 200 });
  }, [value]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [theme.colors.border, theme.colors.primary]
    ),
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: progress.value * (TRACK_WIDTH - THUMB_SIZE - THUMB_OFFSET * 2),
      },
    ],
  }));

  return (
    <Pressable onPress={() => onValueChange(!value)} accessibilityRole="switch">
      <Animated.View style={[styles.track, trackStyle]}>
        <Animated.View style={[styles.thumb, { backgroundColor: '#fff' }, thumbStyle]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    padding: THUMB_OFFSET,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});
```

**Step 2: Commit**

```bash
git add mobile/components/settings/AccessibleToggle.tsx
git commit -m "feat(settings): add AccessibleToggle iOS-style switch"
```

---

## App.tsx Refactor

### Task 13: Integrate all new components into App.tsx

**Files:**
- Modify: `mobile/App.tsx`

**Step 1: Plan the refactor**

The refactor restructures the layout from the current `ScrollView`-based vertical stack to a layered floating UI + bottom sheet layout:

```
View (relative, full screen, background)
  MapViewportFloor (absolute, fills screen)
  FloatingSearchBar (absolute, top)
  FloatingFloorSwitcher (absolute, right side of map)
  BottomSheet (absolute, bottom)
    [collapsed content] → RouteSummaryStrip
    [half content] → RoutePreview
    [full content] → DestinationPicker + AccessibleToggle
  ConfidenceDot (absolute, top-right)
  LiveGuidanceOverlay (absolute, top, zIndex above all)
```

**Step 2: Apply the refactor**

Replace the current App.tsx body with the new layered structure. Remove all hardcoded color values — replace with `useTheme()` hook. Remove telemetry text from release view.

**Step 3: Run typecheck**

Run: `cd mobile && npx tsc --noEmit`
Expected: No errors

**Step 4: Run all tests**

Run: `cd mobile && npm test`
Expected: All tests pass

**Step 5: Commit**

```bash
git add mobile/App.tsx
git commit -m "refactor: App.tsx — new floating UI + bottom sheet layout"
```

---

## Final Integration

### Task 14: Wire up bottom sheet snap points to route state

**Step 1: Ensure bottom sheet defaults to `half` snap point when route is ready, and `collapsed` otherwise**

This is handled in the App.tsx refactor step — the `defaultSnapPoint` prop on `BottomSheet` is set based on `sessionState?.phase === 'ready'`.

**Step 2: Ensure floor cross-fade triggers on floor change**

The `isTransitioning` prop on `FloorTransitionView` is set when `activeFloorTarget` changes, using a short timeout to reset after transition.

**Step 3: Run full test suite**

Run: `cd mobile && npm test && npx tsc --noEmit`
Expected: All pass

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: complete visual redesign integration"
```

---

## Post-Implementation

### Task 15: Push to GitHub

**Step 1: Push to origin**

```bash
git push origin master
```

Render will auto-deploy from the master branch.
