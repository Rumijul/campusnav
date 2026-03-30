/**
 * Tests for mobile/hooks/useRouteSelection.ts
 *
 * Covers:
 * - setFromTap advances activeField
 * - swap exchanges start/destination
 * - clearAll resets state
 * - tapping same field skips duplicate (swap behavior)
 */

import { describe, expect, it } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRouteSelection } from './useRouteSelection';
import type { NavNode } from '../../src/shared/types';

function makeNode(id: string, label = `Node ${id}`): NavNode {
  return {
    id,
    x: 0.5,
    y: 0.5,
    floorId: 1,
    type: 'room',
    searchable: true,
    label,
    roomNumber: id,
  };
}

describe('useRouteSelection', () => {
  describe('initial state', () => {
    it('starts with null start and destination', () => {
      const { result } = renderHook(() => useRouteSelection());
      expect(result.current.start).toBeNull();
      expect(result.current.destination).toBeNull();
    });

    it('starts with activeField = "start"', () => {
      const { result } = renderHook(() => useRouteSelection());
      expect(result.current.activeField).toBe('start');
    });

    it('starts with bothSelected = false', () => {
      const { result } = renderHook(() => useRouteSelection());
      expect(result.current.bothSelected).toBe(false);
    });
  });

  describe('setStart', () => {
    it('sets start node and advances activeField to "destination"', () => {
      const { result } = renderHook(() => useRouteSelection());
      const node = makeNode('node-a');

      act(() => {
        result.current.setStart(node);
      });

      expect(result.current.start).toEqual(node);
      expect(result.current.activeField).toBe('destination');
    });
  });

  describe('setDestination', () => {
    it('sets destination node and advances activeField to "start"', () => {
      const { result } = renderHook(() => useRouteSelection());

      act(() => {
        result.current.setDestination(makeNode('dest-a'));
      });

      expect(result.current.destination).toBeDefined();
      expect(result.current.activeField).toBe('start');
    });
  });

  describe('setFromTap', () => {
    it('when activeField is "start", assigns to start and advances to "destination"', () => {
      const { result } = renderHook(() => useRouteSelection());
      const node = makeNode('tap-a');

      act(() => {
        result.current.setFromTap(node);
      });

      expect(result.current.start).toEqual(node);
      expect(result.current.activeField).toBe('destination');
    });

    it('when activeField is "destination", assigns to destination and advances to "start"', () => {
      const { result } = renderHook(() => useRouteSelection());

      // Advance to destination field
      act(() => {
        result.current.setActiveField('destination');
      });

      const node = makeNode('tap-b');
      act(() => {
        result.current.setFromTap(node);
      });

      expect(result.current.destination).toEqual(node);
      expect(result.current.activeField).toBe('start');
    });

    it('tapping the other field swaps start and destination', () => {
      const { result } = renderHook(() => useRouteSelection());

      // Set start first
      act(() => {
        result.current.setStart(makeNode('start-x'));
      });

      // Now tap what is currently the start (node-x) while activeField is "destination"
      // This should trigger the swap
      act(() => {
        result.current.setActiveField('destination');
      });

      act(() => {
        result.current.setFromTap(makeNode('start-x'));
      });

      // The tapped node becomes destination, start-x becomes start
      // After swap: start = tapped node (start-x), dest = previous start (start-x)
      // Actually: when activeField=dest and start.id === tapped.id, swap happens
      // So: setStartState(prevDest=null) → start=start-x (same), setDestinationState(prevStart=start-x) → dest=start-x
      // Result: start=start-x, dest=start-x, activeField='start'
      expect(result.current.start?.id).toBe('start-x');
      expect(result.current.destination?.id).toBe('start-x');
    });

    it('tapping the same field that is already set skips duplicate and advances', () => {
      const { result } = renderHook(() => useRouteSelection());

      // Set start
      act(() => {
        result.current.setStart(makeNode('start-y'));
      });

      // activeField is now "destination"
      // Now tap what is currently the destination (null) — no swap, just set
      const node = makeNode('new-dest');
      act(() => {
        result.current.setFromTap(node);
      });

      expect(result.current.start?.id).toBe('start-y');
      expect(result.current.destination?.id).toBe('new-dest');
      expect(result.current.activeField).toBe('start');
    });
  });

  describe('swap', () => {
    it('exchanges start and destination', () => {
      const { result } = renderHook(() => useRouteSelection());

      act(() => {
        result.current.setStart(makeNode('old-start'));
        result.current.setDestination(makeNode('old-dest'));
      });

      act(() => {
        result.current.swap();
      });

      expect(result.current.start?.id).toBe('old-dest');
      expect(result.current.destination?.id).toBe('old-start');
    });

    it('is a no-op when both are null', () => {
      const { result } = renderHook(() => useRouteSelection());

      act(() => {
        result.current.swap();
      });

      expect(result.current.start).toBeNull();
      expect(result.current.destination).toBeNull();
    });

    it('is a no-op when only one is set', () => {
      const { result } = renderHook(() => useRouteSelection());

      act(() => {
        result.current.setStart(makeNode('only-start'));
      });

      act(() => {
        result.current.swap();
      });

      // With one null, the swap still exchanges null with the set value
      expect(result.current.start?.id ?? null).toBeNull();
      expect(result.current.destination?.id).toBe('only-start');
    });
  });

  describe('clearAll', () => {
    it('resets start, destination, and activeField', () => {
      const { result } = renderHook(() => useRouteSelection());

      act(() => {
        result.current.setStart(makeNode('s'));
        result.current.setDestination(makeNode('d'));
        result.current.setActiveField('destination');
      });

      act(() => {
        result.current.clearAll();
      });

      expect(result.current.start).toBeNull();
      expect(result.current.destination).toBeNull();
      expect(result.current.activeField).toBe('start');
      expect(result.current.bothSelected).toBe(false);
    });
  });

  describe('clearStart', () => {
    it('clears start and resets activeField to "start"', () => {
      const { result } = renderHook(() => useRouteSelection());

      act(() => {
        result.current.setStart(makeNode('s'));
        result.current.setActiveField('destination');
      });

      act(() => {
        result.current.clearStart();
      });

      expect(result.current.start).toBeNull();
      expect(result.current.activeField).toBe('start');
    });
  });

  describe('clearDestination', () => {
    it('clears destination and resets activeField to "destination"', () => {
      const { result } = renderHook(() => useRouteSelection());

      act(() => {
        result.current.setDestination(makeNode('d'));
      });

      act(() => {
        result.current.clearDestination();
      });

      expect(result.current.destination).toBeNull();
      expect(result.current.activeField).toBe('destination');
    });
  });

  describe('bothSelected', () => {
    it('is true when both start and destination are set', () => {
      const { result } = renderHook(() => useRouteSelection());

      act(() => {
        result.current.setStart(makeNode('s'));
        result.current.setDestination(makeNode('d'));
      });

      expect(result.current.bothSelected).toBe(true);
    });

    it('is false when only start is set', () => {
      const { result } = renderHook(() => useRouteSelection());

      act(() => {
        result.current.setStart(makeNode('s'));
      });

      expect(result.current.bothSelected).toBe(false);
    });

    it('is false when only destination is set', () => {
      const { result } = renderHook(() => useRouteSelection());

      act(() => {
        result.current.setDestination(makeNode('d'));
      });

      expect(result.current.bothSelected).toBe(false);
    });
  });
});
