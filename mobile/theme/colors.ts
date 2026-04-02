/**
 * Theme color tokens for CampusNav.
 * Dark theme is the primary palette derived from existing component styles.
 * Light theme mirrors the same structure with adjusted values.
 */

export const darkColors = {
  // Core backgrounds
  background: '#020617',
  surface: '#0f172a',
  surfaceElevated: '#1e293b',

  // Text
  textPrimary: '#f8fafc',
  textSecondary: '#e2e8f0',
  textMuted: '#94a3b8',
  textDisabled: '#64748b',
  textInverse: '#020617',

  // Accent — primary interactive color (sky blue)
  accent: '#38bdf8',
  accentMuted: '#7dd3fc',
  accentSubtle: '#1e3a5f',

  // Semantic — confidence / status
  success: '#22c55e',
  successMuted: '#4ade80',
  successSubtle: '#052e16',

  warning: '#eab308',
  warningMuted: '#facc15',

  error: '#ef4444',
  errorMuted: '#f87171',
  errorSubtle: '#7c2d12',

  orange: '#f97316',
  orangeMuted: '#fb923c',

  // Borders
  border: '#1e293b',
  borderMuted: '#334155',
  borderAccent: '#38bdf8',

  // Overlay
  overlay: '#0a0f1e',
  overlayLight: '#0f172a',

  // Guidance specific
  guidanceCard: '#0f172a',
  guidanceCardBorder: '#1e3a5f',
  guidanceStepIcon: '#1e3a5f',
  guidanceFloorBadge: '#1d4ed8',

  // Route path
  routeStart: '#4ade80',
  routeEnd: '#f87171',
  routeLine: '#38bdf8',

  // Confidence indicator
  confidenceHigh: '#22c55e',
  confidenceMedium: '#eab308',
  confidenceLow: '#f97316',
  confidenceNone: '#ef4444',

  // Field chips
  chipActive: '#1e3a5f',
  chipTextActive: '#38bdf8',
} as const;

export const lightColors = {
  // Core backgrounds
  background: '#f8fafc',
  surface: '#ffffff',
  surfaceElevated: '#f1f5f9',

  // Text
  textPrimary: '#020617',
  textSecondary: '#1e293b',
  textMuted: '#64748b',
  textDisabled: '#94a3b8',
  textInverse: '#f8fafc',

  // Accent — primary interactive color (sky blue)
  accent: '#0284c7',
  accentMuted: '#38bdf8',
  accentSubtle: '#e0f2fe',

  // Semantic — confidence / status
  success: '#16a34a',
  successMuted: '#22c55e',
  successSubtle: '#dcfce7',

  warning: '#ca8a04',
  warningMuted: '#eab308',

  error: '#dc2626',
  errorMuted: '#ef4444',
  errorSubtle: '#fee2e2',

  orange: '#ea580c',
  orangeMuted: '#f97316',

  // Borders
  border: '#e2e8f0',
  borderMuted: '#cbd5e1',
  borderAccent: '#0284c7',

  // Overlay
  overlay: '#f1f5f9',
  overlayLight: '#ffffff',

  // Guidance specific
  guidanceCard: '#ffffff',
  guidanceCardBorder: '#e2e8f0',
  guidanceStepIcon: '#e0f2fe',
  guidanceFloorBadge: '#0284c7',

  // Route path
  routeStart: '#22c55e',
  routeEnd: '#ef4444',
  routeLine: '#0284c7',

  // Confidence indicator
  confidenceHigh: '#16a34a',
  confidenceMedium: '#ca8a04',
  confidenceLow: '#ea580c',
  confidenceNone: '#dc2626',

  // Field chips
  chipActive: '#e0f2fe',
  chipTextActive: '#0284c7',
} as const;

export type DarkColors = typeof darkColors;
export type LightColors = typeof lightColors;
