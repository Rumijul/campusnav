import { bearing, normalizeDelta } from './navGraph';

describe('bearing utility', () => {
  describe('cardinal directions', () => {
    it('should return 0 for north (positive y direction)', () => {
      expect(bearing(0, 0, 0, 1)).toBe(0);
    });

    it('should return 90 for east (positive x direction)', () => {
      expect(bearing(0, 0, 1, 0)).toBe(90);
    });

    it('should return 180 for south (negative y direction)', () => {
      expect(bearing(0, 0, 0, -1)).toBe(180);
    });

    it('should return 270 for west (negative x direction)', () => {
      expect(bearing(0, 0, -1, 0)).toBe(270);
    });
  });

  describe('diagonal directions', () => {
    it('should return 45 for northeast diagonal', () => {
      expect(bearing(0, 0, 1, 1)).toBe(45);
    });
  });

  describe('edge cases', () => {
    it('should return 0 when start and end points are the same', () => {
      expect(bearing(0.5, 0.5, 0.5, 0.5)).toBe(0);
    });
  });
});

describe('normalizeDelta utility', () => {
  it('should return 0 when delta is 0', () => {
    expect(normalizeDelta(0)).toBe(0);
  });

  it('should normalize positive delta > 180 to negative', () => {
    expect(normalizeDelta(200)).toBe(-160);
  });

  it('should normalize negative delta < -180 to positive', () => {
    expect(normalizeDelta(-200)).toBe(160);
  });

  it('should handle boundary case exactly at 180', () => {
    expect(normalizeDelta(180)).toBe(180);
  });

  it('should handle boundary case exactly at -180', () => {
    expect(normalizeDelta(-180)).toBe(-180);
  });
});
