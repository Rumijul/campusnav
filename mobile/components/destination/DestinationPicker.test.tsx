/**
 * Tests for DestinationPicker component.
 * Uses node environment + React Native mock via testing-library.
 */

import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { DestinationPicker } from './DestinationPicker';
import { normalizeNavGraph } from '../../domain/navGraph';
import { NavBuilding, NavFloor, NavGraph } from '../../../src/shared/types';

function createTestGraph(): NavGraph {
  return {
    buildings: [
      {
        id: 1,
        name: 'Library',
        floors: [
          {
            id: 1,
            floorNumber: 1,
            imagePath: '/lib-f1.png',
            updatedAt: '2024-01-01T00:00:00Z',
            nodes: [
              { id: 'n1', x: 0.5, y: 0.5, floorId: 1, type: 'room', searchable: true, label: 'Reception', roomNumber: '101' },
              { id: 'n2', x: 0.3, y: 0.5, floorId: 1, type: 'room', searchable: true, label: 'Study Room', roomNumber: '102' },
              { id: 'n3', x: 0.1, y: 0.5, floorId: 1, type: 'elevator', searchable: true, label: 'Elevator' },
              { id: 'stairs', x: 0.9, y: 0.5, floorId: 1, type: 'stairs', searchable: false, label: 'Stairs' },
            ],
            edges: [{ id: 'e1', sourceId: 'n1', targetId: 'n2', standardWeight: 0.2, accessibleWeight: 0.2, accessible: true, bidirectional: true }],
          },
          {
            id: 2,
            floorNumber: 2,
            imagePath: '/lib-f2.png',
            updatedAt: '2024-01-01T00:00:00Z',
            nodes: [
              { id: 'n4', x: 0.5, y: 0.5, floorId: 2, type: 'landmark', searchable: true, label: 'Cafeteria', roomNumber: '201' },
            ],
            edges: [],
          },
        ],
      },
      {
        id: 2,
        name: 'Science Building',
        floors: [
          {
            id: 3,
            floorNumber: 1,
            imagePath: '/sci-f1.png',
            updatedAt: '2024-01-01T00:00:00Z',
            nodes: [
              { id: 'n5', x: 0.5, y: 0.5, floorId: 3, type: 'entrance', searchable: true, label: 'Main Entrance' },
            ],
            edges: [],
          },
        ],
      },
    ],
  };
}

function makeGraph() {
  const result = normalizeNavGraph(createTestGraph());
  if (!result.ok) throw new Error('Failed to normalize');
  return result.data;
}

function makeSelection() {
  return {
    start: null,
    destination: null,
    activeField: 'start' as const,
    bothSelected: false,
    setStart: vi.fn(),
    setDestination: vi.fn(),
    setActiveField: vi.fn(),
    setFromTap: vi.fn(),
    swap: vi.fn(),
    clearStart: vi.fn(),
    clearDestination: vi.fn(),
    clearAll: vi.fn(),
  };
}

// Minimal route selection mock that works with the component
import { NavNode } from '../../../src/shared/types';

function createMockSelection(overrides?: Partial<{
  start: NavNode | null;
  destination: NavNode | null;
  activeField: 'start' | 'destination';
  onSetStart: () => void;
  onSetDestination: () => void;
  onSwap: () => void;
  onSetActiveField: (f: 'start' | 'destination') => void;
}>) {
  const mockStart = vi.fn();
  const mockDest = vi.fn();
  const mockSwap = vi.fn();
  const mockSetAF = vi.fn();
  return {
    start: overrides?.start ?? null,
    destination: overrides?.destination ?? null,
    activeField: overrides?.activeField ?? 'start',
    bothSelected: (overrides?.start !== null && overrides?.destination !== null) ?? false,
    setStart: mockStart,
    setDestination: mockDest,
    setActiveField: mockSetAF,
    setFromTap: vi.fn(),
    swap: mockSwap,
    clearStart: vi.fn(),
    clearDestination: vi.fn(),
    clearAll: vi.fn(),
    _mockFns: { mockStart, mockDest, mockSwap, mockSetAF },
    ...overrides,
  };
}

describe('DestinationPicker', () => {
  it('renders search input', () => {
    const graph = makeGraph();
    const selection = createMockSelection();
    render(<DestinationPicker graph={graph} selection={selection} onNodeSelect={vi.fn()} />);
    expect(screen.getByPlaceholderText('Search location...')).toBeTruthy();
  });

  it('renders building items when graph is loaded', () => {
    const graph = makeGraph();
    const selection = createMockSelection();
    render(<DestinationPicker graph={graph} selection={selection} onNodeSelect={vi.fn()} />);
    expect(screen.getByText('Library')).toBeTruthy();
    expect(screen.getByText('Science Building')).toBeTruthy();
  });

  it('shows floor and node counts in building metadata', () => {
    const graph = makeGraph();
    const selection = createMockSelection();
    render(<DestinationPicker graph={graph} selection={selection} onNodeSelect={vi.fn()} />);
    // Library: 2 floors, 4 searchable nodes (stairs excluded)
    expect(screen.getByText(/2 floors/)).toBeTruthy();
    expect(screen.getByText(/4 locations/)).toBeTruthy();
  });

  it('expanding building shows floor headers and nodes', () => {
    const graph = makeGraph();
    const selection = createMockSelection();
    render(<DestinationPicker graph={graph} selection={selection} onNodeSelect={vi.fn()} />);

    // Tap building header to expand
    fireEvent.press(screen.getByText('Library'));

    expect(screen.getByText('Floor 1')).toBeTruthy();
    expect(screen.getByText('Floor 2')).toBeTruthy();
  });

  it('expanded building shows searchable nodes', () => {
    const graph = makeGraph();
    const selection = createMockSelection();
    render(<DestinationPicker graph={graph} selection={selection} onNodeSelect={vi.fn()} />);

    fireEvent.press(screen.getByText('Library'));

    // Stairs is not searchable, so should not appear
    expect(screen.getByText('Reception')).toBeTruthy();
    expect(screen.getByText('Study Room')).toBeTruthy();
    expect(screen.getByText('Elevator')).toBeTruthy();
    expect(screen.queryByText('Stairs')).toBeNull();
  });

  it('search filters node results', () => {
    const graph = makeGraph();
    const selection = createMockSelection();
    render(<DestinationPicker graph={graph} selection={selection} onNodeSelect={vi.fn()} />);

    // Expand Library
    fireEvent.press(screen.getByText('Library'));

    // Type in search box
    const input = screen.getByPlaceholderText('Search location...');
    fireEvent.changeText(input, 'Study');

    // Should only show Study Room
    expect(screen.getByText('Study Room')).toBeTruthy();
    expect(screen.queryByText('Reception')).toBeNull();
  });

  it('search by room number works', () => {
    const graph = makeGraph();
    const selection = createMockSelection();
    render(<DestinationPicker graph={graph} selection={selection} onNodeSelect={vi.fn()} />);

    fireEvent.press(screen.getByText('Library'));

    const input = screen.getByPlaceholderText('Search location...');
    fireEvent.changeText(input, '101');

    expect(screen.getByText('Reception')).toBeTruthy();
  });

  it('calling onNodeSelect with correct node on press', () => {
    const graph = makeGraph();
    const onNodeSelect = vi.fn();
    const selection = createMockSelection();
    render(<DestinationPicker graph={graph} selection={selection} onNodeSelect={onNodeSelect} />);

    fireEvent.press(screen.getByText('Library'));
    fireEvent.press(screen.getByText('Reception'));

    expect(onNodeSelect).toHaveBeenCalledTimes(1);
    expect(onNodeSelect.mock.calls[0][0].id).toBe('n1');
  });

  it('shows accessible icon for elevator nodes', () => {
    const graph = makeGraph();
    const selection = createMockSelection();
    render(<DestinationPicker graph={graph} selection={selection} onNodeSelect={vi.fn()} />);

    fireEvent.press(screen.getByText('Library'));

    expect(screen.getByText('♿')).toBeTruthy();
  });

  it('active field chip is highlighted', () => {
    const graph = makeGraph();
    const selection = createMockSelection({ activeField: 'destination' });
    render(<DestinationPicker graph={graph} selection={selection} onNodeSelect={vi.fn()} />);

    // Both chips should be visible, destination active
    expect(screen.getByText(/^Dest/)).toBeTruthy();
    expect(screen.getByText(/^Start/)).toBeTruthy();
  });

  it('swap button appears when start or destination is set', () => {
    const graph = makeGraph();
    const selection = createMockSelection({ start: graph.nodeById.get('n1')?.node ?? null });
    render(<DestinationPicker graph={graph} selection={selection} onNodeSelect={vi.fn()} />);

    expect(screen.getByText('⇄ Swap')).toBeTruthy();
  });

  it('result count updates after search', () => {
    const graph = makeGraph();
    const selection = createMockSelection();
    render(<DestinationPicker graph={graph} selection={selection} onNodeSelect={vi.fn()} />);

    // Initial: all searchable nodes = 4 (Library) + 1 (Science) = 5
    expect(screen.getByText(/^5 results$/)).toBeTruthy();

    const input = screen.getByPlaceholderText('Search location...');
    fireEvent.changeText(input, 'Caf');

    // After debounce: only Cafeteria = 1
    // Wait for debounce (300ms)
    return new Promise(resolve => setTimeout(resolve, 350));
  });

  it('empty result message shown for nonsense query', async () => {
    const graph = makeGraph();
    const selection = createMockSelection();
    render(<DestinationPicker graph={graph} selection={selection} onNodeSelect={vi.fn()} />);

    const input = screen.getByPlaceholderText('Search location...');
    fireEvent.changeText(input, 'xyz123nonsense');

    // Wait for debounce
    await new Promise(resolve => setTimeout(resolve, 350));

    expect(screen.getByText('No locations match your search.')).toBeTruthy();
  });
});
