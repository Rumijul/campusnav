/**
 * Maps-inspired color tokens for CampusNav.
 * Dark theme: deep navy with blue accents (Google Maps dark mode).
 * Light theme: near-white with iOS-blue accents (Apple Maps light mode).
 */

export const darkColors = {
  // Core backgrounds
  background: '#0F172A',
  surface: '#1E293B',
  surfaceElevated: '#334155',

  // Glass / translucent surfaces
  glass: 'rgba(15, 23, 42, 0.85)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  sheet: 'rgba(30, 41, 59, 0.95)',

  // Text
  textPrimary: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#94A3B8',
  textDisabled: '#64748B',
  textInverse: '#0F172A',

  // Accent — Maps blue
  accent: '#3B82F6',
  accentMuted: '#60A5FA',
  accentSubtle: '#1E3A5F',

  // Accessible route — amber
  accessible: '#F59E0B',
  accessibleMuted: '#FBBF24',
  accessibleSubtle: '#451A03',

  // Semantic
  success: '#22C55E',
  successMuted: '#4ADE80',
  successSubtle: '#052E16',

  warning: '#EAB308',
  warningMuted: '#FACC15',

  error: '#EF4444',
  errorMuted: '#F87171',
  errorSubtle: '#7C2D12',

  // Borders
  border: '#334155',
  borderMuted: '#1E293B',
  borderAccent: '#3B82F6',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.3)',
  overlayHeavy: 'rgba(0, 0, 0, 0.6)',

  // Route
  routeStandard: '#3B82F6',
  routeAccessible: '#F59E0B',
  routeGlow: 'rgba(59, 130, 246, 0.2)',
  routeStart: '#4ADE80',
  routeEnd: '#F87171',

  // Guidance
  guidanceBanner: 'rgba(30, 41, 59, 0.9)',
  guidanceBannerBorder: 'rgba(255, 255, 255, 0.08)',

  // Confidence
  confidenceHigh: '#22C55E',
  confidenceMedium: '#EAB308',
  confidenceLow: '#F97316',
  confidenceNone: '#64748B',

  // Node markers
  nodeEntrance: '#4ADE80',
  nodeRestroom: '#F472B6',
  nodeLandmark: '#A78BFA',
  nodeElevator: '#60A5FA',
  nodeRamp: '#34D399',
  nodeStairs: '#F97316',
  nodeRoom: '#60A5FA',
  nodeJunction: '#94A3B8',
  nodeHallway: '#94A3B8',

  // Direction step accent bar colors
  directionStraight: '#3B82F6',
  directionTurn: '#F59E0B',
  directionFloor: '#8B5CF6',
  directionStart: '#22C55E',
  directionEnd: '#EF4444',

  // Misc
  chipActive: '#1E3A5F',
  chipTextActive: '#3B82F6',

  // Backward-compatible aliases for old components
  orangeMuted: '#FB923C',
  routeLine: '#3B82F6',
  guidanceCard: '#1E293B',
  guidanceCardBorder: 'rgba(255, 255, 255, 0.08)',
  guidanceStepIcon: '#1E3A5F',
  guidanceFloorBadge: '#3B82F6',
} as const;

export const lightColors = {
  // Core backgrounds
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceElevated: '#F1F5F9',

  // Glass / translucent surfaces
  glass: 'rgba(255, 255, 255, 0.85)',
  glassBorder: 'rgba(0, 0, 0, 0.06)',
  sheet: 'rgba(255, 255, 255, 0.95)',

  // Text
  textPrimary: '#0F172A',
  textSecondary: '#334155',
  textMuted: '#94A3B8',
  textDisabled: '#CBD5E1',
  textInverse: '#FFFFFF',

  // Accent — iOS Maps blue
  accent: '#007AFF',
  accentMuted: '#60A5FA',
  accentSubtle: '#DBEAFE',

  // Accessible route — amber
  accessible: '#D97706',
  accessibleMuted: '#F59E0B',
  accessibleSubtle: '#FEF3C7',

  // Semantic
  success: '#16A34A',
  successMuted: '#22C55E',
  successSubtle: '#DCFCE7',

  warning: '#CA8A04',
  warningMuted: '#EAB308',

  error: '#DC2626',
  errorMuted: '#EF4444',
  errorSubtle: '#FEE2E2',

  // Borders
  border: '#E2E8F0',
  borderMuted: '#F1F5F9',
  borderAccent: '#007AFF',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.15)',
  overlayHeavy: 'rgba(0, 0, 0, 0.3)',

  // Route
  routeStandard: '#007AFF',
  routeAccessible: '#D97706',
  routeGlow: 'rgba(0, 122, 255, 0.15)',
  routeStart: '#22C55E',
  routeEnd: '#EF4444',

  // Guidance
  guidanceBanner: 'rgba(255, 255, 255, 0.9)',
  guidanceBannerBorder: 'rgba(0, 0, 0, 0.06)',

  // Confidence
  confidenceHigh: '#16A34A',
  confidenceMedium: '#CA8A04',
  confidenceLow: '#EA580C',
  confidenceNone: '#94A3B8',

  // Node markers (same as dark but darker tones)
  nodeEntrance: '#16A34A',
  nodeRestroom: '#EC4899',
  nodeLandmark: '#8B5CF6',
  nodeElevator: '#3B82F6',
  nodeRamp: '#10B981',
  nodeStairs: '#EA580C',
  nodeRoom: '#3B82F6',
  nodeJunction: '#64748B',
  nodeHallway: '#64748B',

  // Direction step accent bar colors
  directionStraight: '#007AFF',
  directionTurn: '#D97706',
  directionFloor: '#7C3AED',
  directionStart: '#16A34A',
  directionEnd: '#DC2626',

  // Misc
  chipActive: '#DBEAFE',
  chipTextActive: '#007AFF',

  // Backward-compatible aliases for old components
  orangeMuted: '#F97316',
  routeLine: '#007AFF',
  guidanceCard: '#FFFFFF',
  guidanceCardBorder: 'rgba(0, 0, 0, 0.06)',
  guidanceStepIcon: '#DBEAFE',
  guidanceFloorBadge: '#007AFF',
} as const;
