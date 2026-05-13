/**
 * Tests for MapViewportFloor component.
 */

import { describe, expect, it, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { MapViewportFloor } from './MapViewportFloor';

const TEST_FLOOR_TARGETS = [
  { buildingId: 1, floorNumber: 1 },
  { buildingId: 1, floorNumber: 2 },
  { buildingId: 2, floorNumber: 1 },
];

const TEST_ROUTE_PATH = [
  { x: 0.5, y: 0.5, floorId: 1 },
  { x: 0.6, y: 0.4, floorId: 1 },
  { x: 0.7, y: 0.3, floorId: 2 },
];

describe('MapViewportFloor', () => {
  it('renders floor selector buttons for all targets', () => {
    const onFloorChange = vi.fn();
    render(
      <MapViewportFloor
        imageUri="mock"
        activeFloorId={1}
        floorTargets={TEST_FLOOR_TARGETS}
        activeFloorTarget={TEST_FLOOR_TARGETS[0]}
        routePath={TEST_ROUTE_PATH}
        onFloorChange={onFloorChange}
      />,
    );

    expect(screen.getByText('Bldg 1 Fl 1')).toBeTruthy();
    expect(screen.getByText('Bldg 1 Fl 2')).toBeTruthy();
    expect(screen.getByText('Bldg 2 Fl 1')).toBeTruthy();
  });

  it('calls onFloorChange with correct target when floor button is pressed', () => {
    const onFloorChange = vi.fn();
    render(
      <MapViewportFloor
        imageUri="mock"
        activeFloorId={1}
        floorTargets={TEST_FLOOR_TARGETS}
        activeFloorTarget={TEST_FLOOR_TARGETS[0]}
        routePath={TEST_ROUTE_PATH}
        onFloorChange={onFloorChange}
      />,
    );

    fireEvent.press(screen.getByText('Bldg 1 Fl 2'));
    expect(onFloorChange).toHaveBeenCalledTimes(1);
    expect(onFloorChange).toHaveBeenCalledWith({ buildingId: 1, floorNumber: 2 });
  });

  it('renders without crashing when floorTargets is empty', () => {
    const onFloorChange = vi.fn();
    const { toJSON } = render(
      <MapViewportFloor
        imageUri="mock"
        activeFloorId={0}
        floorTargets={[]}
        activeFloorTarget={null}
        routePath={[]}
        onFloorChange={onFloorChange}
      />,
    );

    expect(toJSON()).toBeTruthy();
  });
});