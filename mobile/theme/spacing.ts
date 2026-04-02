/**
 * Spacing scale based on a 4pt grid.
 * All spacing values are multiples of 4 for visual consistency.
 */

export const spacing = {
  /** 4px */
  xs: 4,
  /** 8px */
  sm: 8,
  /** 12px */
  md: 12,
  /** 16px */
  lg: 16,
  /** 24px */
  xl: 24,
  /** 32px */
  '2xl': 32,
  /** 48px */
  '3xl': 48,
  /** 64px */
  '4xl': 64,
} as const;

// oxc workaround: removed export type; keeping const-only export
// Spacing is only used as a TypeScript type (stripped at runtime)
export const Spacing = undefined as unknown as Record<string, number>;
