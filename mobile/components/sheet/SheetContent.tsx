/**
 * SheetContent — Maps-style sheet content that changes per snap point.
 *
 * Collapsed (15%): route summary strip with ETA + distance
 * Half (40%):      scrollable directions list
 * Full (85%):      full details with destination browser + settings
 */

import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useTheme } from '../../theme';
import { DirectionStep, StepType } from '../directions/DirectionStep';
import type { SnapPoint } from './Sheet';

export interface DirectionStepData {
  type: StepType;
  instruction: string;
  distance?: string;
}

interface SheetContentProps {
  snap: SnapPoint;
  eta?: string;
  distance?: string;
  startName?: string;
  destName?: string;
  accessibleMode?: boolean;
  steps?: DirectionStepData[];
  onStartGuidance?: () => void;
  onToggleAccessible?: () => void;
}

export function SheetContent({
  snap,
  eta,
  distance: totalDistance,
  startName,
  destName,
  accessibleMode,
  steps,
  onStartGuidance,
  onToggleAccessible,
}: SheetContentProps) {
  const { colors, spacing, typography } = useTheme();

  // ── Collapsed: route summary strip ──
  if (snap === 'collapsed') {
    return (
      <View style={[styles.collapsedContainer, { paddingHorizontal: spacing.lg }]}>
        {eta && totalDistance ? (
          <View style={styles.summaryRow}>
            <View>
              <Text style={[typography.display2, { color: colors.textPrimary }]}>
                {eta}
              </Text>
              <Text style={[typography.caption, { color: colors.textMuted }]}>
                {totalDistance}
              </Text>
            </View>
            <View style={styles.routeNames}>
              <Text style={[typography.bodyBold, { color: colors.textPrimary }]} numberOfLines={1}>
                {startName || 'Start'}
              </Text>
              <Text style={[typography.caption, { color: colors.textMuted }]}>
                to {destName || 'Destination'}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={[typography.body, { color: colors.textMuted }]}>
              Select origin and destination
            </Text>
            <Text style={[typography.caption, { color: colors.textMuted }]}>
              Tap the map or search to begin
            </Text>
          </View>
        )}

        {/* Swipe indicator */}
        <View style={styles.swipeHint}>
          <View style={[styles.swipeBar, { backgroundColor: colors.textMuted }]} />
        </View>
      </View>
    );
  }

  // ── Half: directions list ──
  if (snap === 'half') {
    return (
      <View style={styles.halfContainer}>
        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: spacing.lg }]}>
          <Text style={[typography.sectionHeader, { color: colors.textMuted }]}>
            Directions
          </Text>
          {eta && totalDistance && (
            <Text style={[typography.caption, { color: colors.textMuted }]}>
              {eta} · {totalDistance}
              {accessibleMode ? ' · ♿' : ''}
            </Text>
          )}
        </View>

        {/* Steps */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
        >
          {steps?.map((step, i) => (
            <DirectionStep
              key={i}
              type={step.type}
              instruction={step.instruction}
              distance={step.distance}
              isLast={i === steps.length - 1}
            />
          ))}

          {(!steps || steps.length === 0) && (
            <Text style={[typography.body, { color: colors.textMuted, textAlign: 'center', marginTop: 40 }]}>
              No route calculated yet
            </Text>
          )}
        </ScrollView>

        {/* Start guidance button */}
        {onStartGuidance && steps && steps.length > 0 && (
          <View style={[styles.guidanceFooter, { paddingHorizontal: spacing.lg }]}>
            <Pressable
              style={[styles.guidanceButton, { backgroundColor: colors.accent }]}
              onPress={onStartGuidance}
            >
              <Text style={[styles.guidanceButtonText, { color: colors.textInverse }]}>
                Start Guidance
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  }

  // ── Full: details + settings ──
  return (
    <View style={styles.fullContainer}>
      {/* Settings section at top */}
      <View style={[styles.settingsSection, { paddingHorizontal: spacing.lg }]}>
        <Text style={[typography.sectionHeader, { color: colors.textMuted }]}>
          Settings
        </Text>

        <Pressable
          style={[
            styles.settingRow,
            { borderColor: colors.border, backgroundColor: colors.surface },
          ]}
          onPress={onToggleAccessible}
        >
          <View>
            <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>
              Wheelchair Accessible
            </Text>
            <Text style={[typography.caption, { color: colors.textMuted }]}>
              Avoid stairs and use ramps/elevators
            </Text>
          </View>
          <View
            style={[
              styles.toggle,
              {
                backgroundColor: accessibleMode ? colors.accessible : colors.surfaceElevated,
                borderColor: accessibleMode ? colors.accessible : colors.border,
              },
            ]}
          >
            <Text
              style={[
                typography.label,
                { color: accessibleMode ? colors.textInverse : colors.textMuted },
              ]}
            >
              {accessibleMode ? 'ON' : 'OFF'}
            </Text>
          </View>
        </Pressable>
      </View>

      {/* Directions below (same as half but taller) */}
      <View style={[styles.header, { paddingHorizontal: spacing.lg }]}>
        <Text style={[typography.sectionHeader, { color: colors.textMuted }]}>
          Directions
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {steps?.map((step, i) => (
          <DirectionStep
            key={i}
            type={step.type}
            instruction={step.instruction}
            distance={step.distance}
            isLast={i === steps.length - 1}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  collapsedContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 4,
  },
  routeNames: {
    flex: 1,
    alignItems: 'flex-end',
    marginLeft: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 8,
    gap: 4,
  },
  swipeHint: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  swipeBar: {
    width: 32,
    height: 3,
    borderRadius: 2,
    opacity: 0.3,
  },
  halfContainer: {
    flex: 1,
  },
  header: {
    paddingTop: 4,
    paddingBottom: 8,
    gap: 2,
  },
  scrollView: {
    flex: 1,
  },
  guidanceFooter: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  guidanceButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  guidanceButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  fullContainer: {
    flex: 1,
  },
  settingsSection: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    gap: 8,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  toggle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
});
