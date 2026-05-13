/**
 * Shadow / elevation tokens for Maps-style depth layers.
 */

import { ViewStyle } from 'react-native';

export const shadows = {
  /** Subtle — cards, sheet handle */
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  } satisfies ViewStyle,

  /** Standard — floating search bar, floor picker */
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  } satisfies ViewStyle,

  /** Elevated — bottom sheet */
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  } satisfies ViewStyle,

  /** None */
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  } satisfies ViewStyle,
} as const;

export const Shadows = undefined as unknown as Record<string, ViewStyle>;
