/**
 * Typography tokens for CampusNav.
 * Text styles derived from existing component usage.
 */

import { TextStyle } from 'react-native';

export const typography = {
  title: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
  } satisfies TextStyle,

  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  } satisfies TextStyle,

  body: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
  } satisfies TextStyle,

  bodyBold: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  } satisfies TextStyle,

  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  } satisfies TextStyle,

  captionBold: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  } satisfies TextStyle,

  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  } satisfies TextStyle,

  chip: {
    fontSize: 12,
    fontWeight: '500',
  } satisfies TextStyle,
} as const;

// oxc workaround: removed export type; keeping const-only export
// Typography is only used as a TypeScript type (stripped at runtime)
export const Typography = undefined as unknown as Record<string, TextStyle>;
