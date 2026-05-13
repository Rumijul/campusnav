/**
 * Typography tokens for CampusNav — Maps-inspired scale.
 * Adds display sizes for ETA/distances and Maps-style labels.
 */

import { TextStyle } from 'react-native';

export const typography = {
  // Large display — ETA, distance
  display1: {
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 41,
    letterSpacing: -0.5,
  } satisfies TextStyle,

  display2: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    letterSpacing: -0.3,
  } satisfies TextStyle,

  // Title
  title: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
  } satisfies TextStyle,

  // Section headers — Maps-style "DIRECTIONS" label
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  } satisfies TextStyle,

  // Body
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

  // Caption
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

  // Tiny label — floor badges, route mode badge
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  } satisfies TextStyle,

  // Chip
  chip: {
    fontSize: 12,
    fontWeight: '500',
  } satisfies TextStyle,

  // Large number — step distance
  stepNumber: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 28,
  } satisfies TextStyle,
} as const;

export const Typography = undefined as unknown as Record<string, TextStyle>;
