---
estimated_steps: 35
estimated_files: 4
skills_used: []
---

# T03: Destination picker UI with building/floor/node search

## Task T03 — Destination Picker UI with Building/Floor/Node Search

### Why
The visitor needs a way to select start and destination. T03 builds the search UI and the `useLocationSearch` hook that filters the normalized graph in-memory. The picker uses a building→floor→node accordion/tree structure with a fuzzy text input, mirroring the web CampusNav destination experience without re-inventing the UX.

### Files
**Created:**
- `mobile/hooks/useLocationSearch.ts` — In-memory search over NormalizedNavGraph
- `mobile/hooks/useLocationSearch.test.ts` — Prefix match, empty query, type filter, result count
- `mobile/components/destination/DestinationPicker.tsx` — Building/floor/node accordion with search bar
- `mobile/components/destination/DestinationPicker.test.tsx` — Render, search debounce, node selection, accessible mode display

### Do
1. **Implement `mobile/hooks/useLocationSearch.ts`**:
   - Accept `{ graph: NormalizedNavGraph; query: string; typeFilter?: Set<NavNodeType> }`
   - Return `{ buildings: SearchBuilding[] }` where each `SearchBuilding` has `floors: SearchFloor[]` with `nodes: SearchNode[]`
   - Search algorithm: case-insensitive prefix match on `label` OR `roomNumber` OR `description` OR `buildingName`; only include buildings/floors that have at least one matching node
   - Sort: buildings by name, floors by floorNumber ascending, nodes by label
   - Filter by `typeFilter` if provided (useful for restricting to entrances, rooms, etc.)
   - Export `SearchBuilding`, `SearchFloor`, `SearchNode` types
   - For performance: build the search index lazily in `useMemo` keyed on `graph`

2. **Write `mobile/hooks/useLocationSearch.test.ts`**:
   - Create a mock `NormalizedNavGraph` with 2 buildings, 3 floors each, ~5 nodes per floor
   - Test: empty query returns all searchable nodes; prefix "Lib" matches "Library"; prefix "201" matches room "201"; type filter excludes stairs; empty result for nonsense query

3. **Implement `mobile/components/destination/DestinationPicker.tsx`**:
   - Props: `{ graph: NormalizedNavGraph; selection: RouteSelection; onNodeSelect: (node: NavNode) => void }`
   - Layout: `TextInput` for search at top; `FlatList` of `SearchBuilding` results below
   - Each building item is an accordion/expandable section showing building name + floor count + chevron
   - Expanded building shows floors with floor number header; each floor shows its searchable nodes
   - Node row: label + room number + type badge + accessible icon (for elevator/ramp nodes)
   - Active field indicator ("Set Start" / "Set Destination") shown in header; switch button to toggle
   - Use `useLocationSearch` internally with debounced search input (300ms `useEffect` + state)
   - Pressing a node calls `onNodeSelect(node)`
   - Render with `StyleSheet` (dark theme matching existing App.tsx palette: bg #020617, text #f8fafc)

4. **Write `mobile/components/destination/DestinationPicker.test.tsx`**:
   - Use `@testing-library/react-native` or Vitest with React Native mock
   - Test: renders search input; renders building items; search filters results; node press calls `onNodeSelect` with correct node

5. **Verify**: `npm --prefix mobile run test -- mobile/hooks/useLocationSearch.test.ts mobile/components/destination/DestinationPicker.test.tsx` → all pass. `npm --prefix mobile run typecheck` → 0 errors.

## Inputs

- `mobile/domain/navGraph.ts`
- `mobile/hooks/useRouteSelection.ts`
- `src/shared/types.ts`

## Expected Output

- `mobile/hooks/useLocationSearch.ts`
- `mobile/hooks/useLocationSearch.test.ts`
- `mobile/components/destination/DestinationPicker.tsx`
- `mobile/components/destination/DestinationPicker.test.tsx`

## Verification

npm --prefix mobile run test -- mobile/hooks/useLocationSearch.test.ts mobile/components/destination/DestinationPicker.test.tsx && npm --prefix mobile run typecheck

## Observability Impact

Search debounce (300ms) prevents excessive re-computation; search results are logged at info level for debugging.
