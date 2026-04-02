/**
 * Theme system for CampusNav.
 * Exports color palettes, spacing scale, typography, and the useTheme hook.
 */

import { useColorScheme } from 'react-native';

import { darkColors, lightColors } from './colors';
import { spacing } from './spacing';
import { typography } from './typography';

export { darkColors, lightColors } from './colors';
export { spacing } from './spacing';
export { typography } from './typography';

export interface Theme {
  colors: typeof darkColors | typeof lightColors;
  spacing: typeof spacing;
  typography: typeof typography;
  isDark: boolean;
}

/**
 * Returns the current theme based on the system color scheme.
 *
 * Usage:
 *   const { colors, spacing, typography, isDark } = useTheme();
 */
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
