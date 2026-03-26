export interface ViewportPoint {
  x: number;
  y: number;
}

export interface ViewportDimensions {
  width: number;
  height: number;
}

export interface MapTransform {
  scale: number;
  rotationDeg: number;
  translation: ViewportPoint;
}

export interface PinchRotateInput {
  scaleFactor: number;
  rotationDeltaDeg: number;
  focal: ViewportPoint;
  viewport: ViewportDimensions | null | undefined;
}

export const MIN_VIEWPORT_SCALE = 0.5;
export const MAX_VIEWPORT_SCALE = 4;

const DEFAULT_TRANSFORM: MapTransform = {
  scale: 1,
  rotationDeg: 0,
  translation: { x: 0, y: 0 },
};

const EPSILON = 1e-6;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function rotatePoint(point: ViewportPoint, angleRad: number): ViewportPoint {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);

  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function isValidViewport(viewport: ViewportDimensions | null | undefined): viewport is ViewportDimensions {
  return (
    !!viewport &&
    isFiniteNumber(viewport.width) &&
    isFiniteNumber(viewport.height) &&
    viewport.width > 0 &&
    viewport.height > 0
  );
}

function clampFocalPoint(focal: ViewportPoint, viewport: ViewportDimensions): ViewportPoint {
  if (!isFiniteNumber(focal.x) || !isFiniteNumber(focal.y)) {
    return {
      x: viewport.width / 2,
      y: viewport.height / 2,
    };
  }

  return {
    x: clamp(focal.x, 0, viewport.width),
    y: clamp(focal.y, 0, viewport.height),
  };
}

export function createInitialMapTransform(): MapTransform {
  return {
    scale: DEFAULT_TRANSFORM.scale,
    rotationDeg: DEFAULT_TRANSFORM.rotationDeg,
    translation: { ...DEFAULT_TRANSFORM.translation },
  };
}

export function clampViewportScale(scale: number): number {
  if (!isFiniteNumber(scale)) {
    return DEFAULT_TRANSFORM.scale;
  }

  return clamp(scale, MIN_VIEWPORT_SCALE, MAX_VIEWPORT_SCALE);
}

export function normalizeRotationDeg(rotationDeg: number): number {
  if (!isFiniteNumber(rotationDeg)) {
    return DEFAULT_TRANSFORM.rotationDeg;
  }

  return ((((rotationDeg + 180) % 360) + 360) % 360) - 180;
}

export function worldFromScreen(screenPoint: ViewportPoint, transform: MapTransform): ViewportPoint {
  const scale = clampViewportScale(transform.scale);
  const normalizedRotation = normalizeRotationDeg(transform.rotationDeg);

  const translated = {
    x: screenPoint.x - transform.translation.x,
    y: screenPoint.y - transform.translation.y,
  };

  const unrotated = rotatePoint(translated, -toRadians(normalizedRotation));

  return {
    x: unrotated.x / scale,
    y: unrotated.y / scale,
  };
}

export function screenFromWorld(worldPoint: ViewportPoint, transform: MapTransform): ViewportPoint {
  const scale = clampViewportScale(transform.scale);
  const normalizedRotation = normalizeRotationDeg(transform.rotationDeg);

  const scaled = {
    x: worldPoint.x * scale,
    y: worldPoint.y * scale,
  };

  const rotated = rotatePoint(scaled, toRadians(normalizedRotation));

  return {
    x: rotated.x + transform.translation.x,
    y: rotated.y + transform.translation.y,
  };
}

export function applyPanDelta(transform: MapTransform, delta: ViewportPoint): MapTransform {
  if (!isFiniteNumber(delta.x) || !isFiniteNumber(delta.y)) {
    return transform;
  }

  const nextTranslation = {
    x: transform.translation.x + delta.x,
    y: transform.translation.y + delta.y,
  };

  if (!isFiniteNumber(nextTranslation.x) || !isFiniteNumber(nextTranslation.y)) {
    return transform;
  }

  return {
    ...transform,
    translation: nextTranslation,
  };
}

export function applyPinchRotate(transform: MapTransform, input: PinchRotateInput): MapTransform {
  if (!isValidViewport(input.viewport)) {
    return transform;
  }

  if (
    !isFiniteNumber(input.scaleFactor) ||
    !isFiniteNumber(input.rotationDeltaDeg) ||
    input.scaleFactor <= 0
  ) {
    return transform;
  }

  const focalPoint = clampFocalPoint(input.focal, input.viewport);
  const worldAnchor = worldFromScreen(focalPoint, transform);

  const nextScale = clampViewportScale(transform.scale * input.scaleFactor);
  const nextRotation = normalizeRotationDeg(transform.rotationDeg + input.rotationDeltaDeg);

  const projectedAnchor = screenFromWorld(worldAnchor, {
    scale: nextScale,
    rotationDeg: nextRotation,
    translation: { x: 0, y: 0 },
  });

  const nextTranslation = {
    x: focalPoint.x - projectedAnchor.x,
    y: focalPoint.y - projectedAnchor.y,
  };

  if (!isFiniteNumber(nextTranslation.x) || !isFiniteNumber(nextTranslation.y)) {
    return transform;
  }

  return {
    scale: nextScale,
    rotationDeg: nextRotation,
    translation: nextTranslation,
  };
}

export function mapTransformsEqual(a: MapTransform, b: MapTransform): boolean {
  return (
    Math.abs(a.scale - b.scale) < EPSILON &&
    Math.abs(a.rotationDeg - b.rotationDeg) < EPSILON &&
    Math.abs(a.translation.x - b.translation.x) < EPSILON &&
    Math.abs(a.translation.y - b.translation.y) < EPSILON
  );
}
