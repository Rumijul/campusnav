/**
 * DirectionStepCard — single turn-by-turn instruction card.
 *
 * Displays a direction step with icon, instruction text, distance, and
 * duration.  State-based accent coloring:
 *   - default    → normal surface styling
 *   - active     → accent border highlight
 *   - accessible → success accent (for elevator/ramp segments)
 *   - stairs     → warning accent (for stairs steps)
 *   - arrived    → green highlight for the final destination step
 *
 * DirectionStep typed from mobile/domain/navGraph.ts.
 *
 * Usage:
 *   <DirectionStepCard
 *     step={step}
 *     isActive={index === currentStepIndex}
 *     onPress={() => onStepPress(index)}
 *   />
 */

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme';
import { DirectionStep, StepIcon } from '../../domain/navGraph';

export interface DirectionStepCardProps {
  /** The direction step to display. */
  step: DirectionStep;
  /** Highlight the card when this step is the active guidance step. */
  isActive?: boolean;
  /** Called when the user taps the card. */
  onPress?: () => void;
  /** Optional extra styles applied to the card container. */
  style?: object;
}

// ─── Icon helpers ─────────────────────────────────────────────────────────────

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

function stepIconEmoji(icon: StepIcon): string {
  return STEP_ICONS[icon] ?? '→';
}

// ─── Distance / duration formatting ────────────────────────────────────────────

/**
 * Format normalized distance as a human-readable string.
 * 1 normalized unit ≈ 50 m.
 */
function formatDistance(norm: number): string {
  const meters = Math.round(norm * 50);
  if (meters < 1) return '<1m';
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)}km`;
  return `${meters}m`;
}

/** Format seconds as a human-readable duration string. */
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (secs === 0) return `${mins}min`;
  return `${mins}min ${secs}s`;
}

// ─── Accent variant ───────────────────────────────────────────────────────────

type AccentVariant = 'default' | 'active' | 'accessible' | 'stairs' | 'arrived';

function accentVariant(step: DirectionStep, isActive?: boolean): AccentVariant {
  if (step.icon === 'arrive') return 'arrived';
  if (isActive) return 'active';
  if (step.icon === 'elevator' || step.icon === 'ramp') return 'accessible';
  if (step.icon === 'stairs-up' || step.icon === 'stairs-down') return 'stairs';
  return 'default';
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DirectionStepCard({
  step,
  isActive = false,
  onPress,
  style,
}: DirectionStepCardProps) {
  const { colors } = useTheme();

  const variant = accentVariant(step, isActive);

  const borderColor =
    variant === 'arrived'
      ? colors.success
      : variant === 'active'
        ? colors.borderAccent
        : variant === 'accessible'
          ? colors.success
          : variant === 'stairs'
            ? colors.warning
            : colors.guidanceCardBorder;

  const iconBgColor =
    variant === 'arrived'
      ? colors.successSubtle
      : variant === 'accessible'
        ? colors.successSubtle
        : variant === 'stairs'
          ? colors.warning + '33'  // warning with alpha
          : colors.guidanceStepIcon;

  const iconColor =
    variant === 'arrived'
      ? colors.success
      : variant === 'accessible'
        ? colors.success
        : variant === 'stairs'
          ? colors.warning
          : colors.accent;

  const cardBg =
    variant === 'arrived'
      ? colors.successSubtle
      : colors.guidanceCard;

  const textColor =
    variant === 'arrived'
      ? colors.successMuted
      : variant === 'active'
        ? colors.textPrimary
        : colors.textSecondary;

  const distanceColor =
    variant === 'arrived'
      ? colors.success
      : variant === 'accessible'
        ? colors.successMuted
        : variant === 'stairs'
          ? colors.warningMuted
          : colors.accent;

  const icon = stepIconEmoji(step.icon);
  const distance = formatDistance(step.distanceM);
  const duration = formatDuration(step.durationSec);

  const CardWrapper = onPress ? Pressable : View;

  return (
    <CardWrapper
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${step.instruction}, ${distance}, ${duration}`}
      accessibilityHint="Tap to highlight this step on the map"
      style={({ pressed }: { pressed: boolean }) => [
        styles.card,
        {
          backgroundColor: cardBg,
          borderColor,
          borderWidth: variant === 'default' ? 1 : 1.5,
        },
        pressed && onPress && styles.cardPressed,
        style,
      ]}
      testID={`direction-step-card-${step.icon}`}
    >
      {/* Icon container */}
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: iconBgColor },
        ]}
      >
        <Text style={[styles.icon, { color: iconColor }]}>{icon}</Text>
      </View>

      {/* Instruction + meta */}
      <View style={styles.content}>
        <Text
          style={[styles.instruction, { color: textColor }]}
          numberOfLines={2}
        >
          {step.instruction}
        </Text>
        <View style={styles.metaRow}>
          <Text style={[styles.metaText, { color: distanceColor }]}>
            {distance}
          </Text>
          <Text style={[styles.metaDot, { color: colors.textDisabled }]}>·</Text>
          <Text style={[styles.metaText, { color: colors.textMuted }]}>
            {duration}
          </Text>
          {step.isAccessibleSegment && (
            <>
              <Text style={[styles.metaDot, { color: colors.textDisabled }]}>·</Text>
              <Text style={[styles.metaText, { color: colors.success }]}>
                ♿ Accessible
              </Text>
            </>
          )}
        </View>
      </View>

      {/* Floor badge */}
      <View
        style={[styles.floorBadge, { backgroundColor: colors.guidanceFloorBadge }]}
      >
        <Text style={[styles.floorBadgeText, { color: colors.textInverse }]}>
          {step.floorNumber}
        </Text>
      </View>
    </CardWrapper>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    gap: 12,
    marginVertical: 3,
  },
  cardPressed: {
    opacity: 0.8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  icon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
    gap: 3,
  },
  instruction: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  metaDot: {
    fontSize: 12,
  },
  floorBadge: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  floorBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
