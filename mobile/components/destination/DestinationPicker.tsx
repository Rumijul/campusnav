/**
 * DestinationPicker — building/floor/node accordion with fuzzy text search.
 * Pressing a node calls onNodeSelect. "Set Start" / "Set Destination" toggle
 * in header reflects the activeField from RouteSelection.
 */

import { useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useLocationSearch } from '../../hooks/useLocationSearch';
import { NormalizedNavGraph } from '../../domain/navGraph';
import { NavNode } from '../../../src/shared/types';
import { RouteSelection } from '../../hooks/useRouteSelection';

const DEBOUNCE_MS = 300;

interface Props {
  graph: NormalizedNavGraph;
  selection: RouteSelection;
  onNodeSelect: (node: NavNode) => void;
}

const TYPE_BADGE: Record<string, string> = {
  room: '📍',
  entrance: '🚪',
  elevator: '🛗',
  restroom: '🚻',
  landmark: '⭐',
  stairs: '⬆️',
  ramp: '♿',
  junction: '⬡',
  hallway: '─',
};

const ACCESSIBLE_ICON = '♿';

export function DestinationPicker({ graph, selection, onNodeSelect }: Props) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const { buildings, totalMatches } = useLocationSearch(graph, debouncedQuery);

  const activeLabel = selection.activeField === 'start' ? 'Set Start' : 'Set Destination';
  const otherLabel = selection.activeField === 'start' ? 'Set Destination' : 'Set Start';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerLabel}>{activeLabel}</Text>
        <Text style={styles.resultCount}>
          {totalMatches} {totalMatches === 1 ? 'result' : 'results'}
        </Text>
      </View>

      {/* Search input */}
      <TextInput
        style={styles.searchInput}
        placeholder="Search location..."
        placeholderTextColor="#64748b"
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {/* Active field indicator */}
      <View style={styles.fieldToggle}>
        <Text style={styles.fieldText}>Picking: </Text>
        <Pressable
          style={[styles.fieldChip, selection.activeField === 'start' && styles.fieldChipActive]}
          onPress={() => selection.setActiveField('start')}
        >
          <Text style={[styles.fieldChipText, selection.activeField === 'start' && styles.fieldChipTextActive]}>
            Start {selection.start ? `(${selection.start.label})` : ''}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.fieldChip, selection.activeField === 'destination' && styles.fieldChipActive]}
          onPress={() => selection.setActiveField('destination')}
        >
          <Text style={[styles.fieldChipText, selection.activeField === 'destination' && styles.fieldChipTextActive]}>
            Dest {selection.destination ? `(${selection.destination.label})` : ''}
          </Text>
        </Pressable>
        {(selection.start || selection.destination) && (
          <Pressable style={styles.swapButton} onPress={selection.swap}>
            <Text style={styles.swapButtonText}>⇄ Swap</Text>
          </Pressable>
        )}
      </View>

      {/* Results */}
      <FlatList
        data={buildings}
        keyExtractor={item => String(item.buildingId)}
        style={styles.list}
        renderItem={({ item: building }) => (
          <BuildingAccordion
            building={building}
            onNodeSelect={onNodeSelect}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {debouncedQuery ? 'No locations match your search.' : 'No locations available.'}
          </Text>
        }
      />
    </View>
  );
}

/* ─── Sub-components ─── */

interface BuildingAccordionProps {
  building: import('../../hooks/useLocationSearch').SearchBuilding;
  onNodeSelect: (node: NavNode) => void;
}

function BuildingAccordion({ building, onNodeSelect }: BuildingAccordionProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.buildingSection}>
      <Pressable style={styles.buildingHeader} onPress={() => setExpanded(e => !e)}>
        <View style={styles.buildingInfo}>
          <Text style={styles.buildingName}>{building.buildingName}</Text>
          <Text style={styles.buildingMeta}>
            {building.floors.length} {building.floors.length === 1 ? 'floor' : 'floors'} ·{' '}
            {building.floors.reduce((sum, f) => sum + f.nodes.length, 0)} locations
          </Text>
        </View>
        <Text style={styles.chevron}>{expanded ? '▼' : '▶'}</Text>
      </Pressable>

      {expanded && (
        <View style={styles.floorsContainer}>
          {building.floors.map(floor => (
            <FloorSection key={floor.floorId} floor={floor} onNodeSelect={onNodeSelect} />
          ))}
        </View>
      )}
    </View>
  );
}

interface FloorSectionProps {
  floor: import('../../hooks/useLocationSearch').SearchFloor;
  onNodeSelect: (node: NavNode) => void;
}

function FloorSection({ floor, onNodeSelect }: FloorSectionProps) {
  return (
    <View style={styles.floorSection}>
      <Text style={styles.floorHeader}>Floor {floor.floorNumber}</Text>
      {floor.nodes.map(sn => (
        <NodeRow key={sn.node.id} searchNode={sn} onPress={() => onNodeSelect(sn.node)} />
      ))}
    </View>
  );
}

interface NodeRowProps {
  searchNode: import('../../hooks/useLocationSearch').SearchNode;
  onPress: () => void;
}

function NodeRow({ searchNode, onPress }: NodeRowProps) {
  const { node, buildingName, floorNumber } = searchNode;
  const badge = TYPE_BADGE[node.type] ?? '📍';
  const isAccessible = node.type === 'elevator' || node.type === 'ramp';

  return (
    <Pressable style={styles.nodeRow} onPress={onPress}>
      <Text style={styles.nodeBadge}>{badge}</Text>
      <View style={styles.nodeInfo}>
        <Text style={styles.nodeLabel}>{node.label}</Text>
        <Text style={styles.nodeSubtext}>
          {buildingName} · Floor {floorNumber}
          {node.roomNumber ? ` · Room ${node.roomNumber}` : ''}
        </Text>
      </View>
      {isAccessible && <Text style={styles.accessibleIcon}>{ACCESSIBLE_ICON}</Text>}
    </Pressable>
  );
}

/* ─── Styles (dark theme, campusnav palette) ─── */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  headerLabel: { color: '#f8fafc', fontSize: 18, fontWeight: '700' },
  resultCount: { color: '#64748b', fontSize: 13 },
  searchInput: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#f8fafc',
    fontSize: 15,
  },
  fieldToggle: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 10, gap: 8 },
  fieldText: { color: '#94a3b8', fontSize: 13 },
  fieldChip: { backgroundColor: '#0f172a', borderColor: '#334155', borderWidth: 1, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4 },
  fieldChipActive: { backgroundColor: '#1e3a5f', borderColor: '#38bdf8' },
  fieldChipText: { color: '#94a3b8', fontSize: 12 },
  fieldChipTextActive: { color: '#38bdf8', fontWeight: '600' },
  swapButton: { marginLeft: 'auto', backgroundColor: '#0f172a', borderColor: '#334155', borderWidth: 1, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4 },
  swapButtonText: { color: '#94a3b8', fontSize: 12 },
  list: { flex: 1 },
  emptyText: { color: '#475569', fontSize: 14, textAlign: 'center', marginTop: 40 },
  buildingSection: { borderBottomColor: '#1e293b', borderBottomWidth: 1 },
  buildingHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  buildingInfo: { flex: 1 },
  buildingName: { color: '#f8fafc', fontSize: 16, fontWeight: '600' },
  buildingMeta: { color: '#64748b', fontSize: 12, marginTop: 2 },
  chevron: { color: '#38bdf8', fontSize: 12 },
  floorsContainer: { backgroundColor: '#0a0f1e', paddingLeft: 16 },
  floorSection: { paddingVertical: 6 },
  floorHeader: { color: '#475569', fontSize: 11, fontWeight: '600', letterSpacing: 1, paddingHorizontal: 16, paddingVertical: 4, textTransform: 'uppercase' },
  nodeRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 10 },
  nodeBadge: { fontSize: 16, width: 24, textAlign: 'center' },
  nodeInfo: { flex: 1 },
  nodeLabel: { color: '#e2e8f0', fontSize: 14, fontWeight: '500' },
  nodeSubtext: { color: '#64748b', fontSize: 11, marginTop: 2 },
  accessibleIcon: { fontSize: 14 },
});
