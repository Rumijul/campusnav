/**
 * RoutePreview — step-by-step directions grouped by floor.
 *
 * Props:
 * - directions: DirectionsResult from the route session
 * - floorMap: Map<floorId, NavFloor> from the normalized graph
 * - accessibleMode: boolean to highlight accessible path elements
 * - onFloorChange: callback to switch the active floor
 */

import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { groupDirectionSections } from '../../routing/directionSections';
import { DirectionsResult, DirectionSection, DirectionStep } from '../../domain/navGraph';
import { NavFloor } from '../../../src/shared/types';

/* ─── Icons ─── */

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

/* ─── Step icon color ─── */

function iconColor(step: DirectionStep, accessibleMode: boolean): string {
  if (step.isAccessibleSegment) return '#facc15'; // amber for accessible segments
  if (step.icon === 'arrive') return '#4ade80'; // green for arrival
  if (accessibleMode && (step.icon === 'elevator' || step.icon === 'ramp')) return '#facc15';
  return '#38bdf8'; // cyan for standard
}

/* ─── Duration formatting ─── */

function formatDuration(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

/* ─── Distance formatting (normalized → approximate meters) ─── */

function formatDistance(norm: number): string {
  // Normalized coordinate space → approximate real distance
  // Assume campus coordinate space roughly maps to 50m per unit
  const meters = Math.round(norm * 50);
  if (meters < 1) return '<1m';
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)}km`;
  return `${meters}m`;
}

/* ─── Props ─── */

interface Props {
  directions: DirectionsResult;
  accessibleMode: boolean;
}

/* ─── Component ─── */

export function RoutePreview({ directions, accessibleMode }: Props) {
  const sections = groupDirectionSections(directions.steps);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Route Preview</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>
            {formatDistance(directions.totalDistanceNorm)}
          </Text>
          <Text style={styles.summaryDivider}>·</Text>
          <Text style={styles.summaryText}>
            {formatDuration(directions.totalDurationSec)}
          </Text>
          <Text style={styles.summaryDivider}>·</Text>
          <Text style={styles.stepCount}>{directions.steps.length} steps</Text>
        </View>
      </View>

      {/* Sections */}
      <FlatList
        data={sections}
        keyExtractor={item => String(item.floorId)}
        style={styles.sectionList}
        renderItem={({ item: section }) => (
          <FloorSectionView section={section} accessibleMode={accessibleMode} />
        )}
        ItemSeparatorComponent={() => <View style={styles.sectionSeparator} />}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No directions available.</Text>
        }
      />
    </View>
  );
}

/* ─── Floor section view ─── */

interface FloorSectionProps {
  section: DirectionSection;
  accessibleMode: boolean;
}

function FloorSectionView({ section, accessibleMode }: FloorSectionProps) {
  return (
    <View style={styles.floorSection}>
      <Text style={styles.floorHeader}>
        Floor {section.floorNumber}
      </Text>
      {section.steps.map((step, idx) => (
        <StepRow key={idx} step={step} accessibleMode={accessibleMode} />
      ))}
    </View>
  );
}

/* ─── Individual step row ─── */

interface StepRowProps {
  step: DirectionStep;
  accessibleMode: boolean;
}

function StepRow({ step, accessibleMode }: StepRowProps) {
  const icon = stepIcon(step);
  const color = iconColor(step, accessibleMode);
  const isAccessible = step.isAccessibleSegment || step.icon === 'elevator' || step.icon === 'ramp';

  return (
    <View style={[styles.stepRow, isAccessible && accessibleMode && styles.stepRowAccessible]}>
      <View style={[styles.stepIconContainer, { backgroundColor: color + '20' }]}>
        <Text style={[styles.stepIcon, { color }]}>{icon}</Text>
      </View>
      <View style={styles.stepContent}>
        <Text style={styles.instruction} numberOfLines={2}>
          {step.instruction}
        </Text>
        <View style={styles.stepMeta}>
          <Text style={styles.stepMetaText}>{formatDistance(step.distanceM)}</Text>
          <Text style={styles.stepMetaDivider}>·</Text>
          <Text style={styles.stepMetaText}>{formatDuration(step.durationSec)}</Text>
        </View>
      </View>
    </View>
  );
}

/* ─── Styles ─── */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    gap: 4,
  },
  headerTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  summaryText: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '600',
  },
  summaryDivider: {
    color: '#475569',
    fontSize: 13,
  },
  stepCount: {
    color: '#64748b',
    fontSize: 12,
  },
  sectionList: {
    flex: 1,
  },
  sectionSeparator: {
    height: 8,
    backgroundColor: '#0a0f1e',
  },
  floorSection: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  floorHeader: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  stepRowAccessible: {
    backgroundColor: '#1c1408',
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  stepIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIcon: {
    fontSize: 16,
    fontWeight: '700',
  },
  stepContent: {
    flex: 1,
    gap: 2,
  },
  instruction: {
    color: '#e2e8f0',
    fontSize: 14,
    lineHeight: 18,
  },
  stepMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stepMetaText: {
    color: '#64748b',
    fontSize: 12,
  },
  stepMetaDivider: {
    color: '#334155',
    fontSize: 12,
  },
  emptyText: {
    color: '#475569',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },
});