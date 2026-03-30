---
estimated_steps: 8
estimated_files: 4
skills_used: []
---

# T01: Heading-aware map rotation

Extend MapTransform with headingRotationDeg field, add applyHeadingRotation() pure helper, propagate headingDegrees prop through MapViewport → MapViewportFloor → App.tsx wiring.

Steps:
1. Read mobile/map/mapTransform.ts — extend MapTransform interface with headingRotationDeg: number field (default 0).
2. Add pure function applyHeadingRotation(existing: MapTransform, headingDegrees: number | null): MapTransform. When headingDegrees is null, returns existing unchanged. When non-null, returns existing with headingRotationDeg = headingDegrees.
3. Read mobile/map/MapViewport.tsx — add optional headingRotationDeg?: number prop. In the Image transform array, change rotateZ from `${transform.rotationDeg}deg` to `${transform.rotationDeg + (headingRotationDeg ?? 0)}deg`. When headingRotationDeg is non-null, this applies cumulative rotation (manual + heading).
4. Read mobile/map/MapViewportFloor.tsx — add optional headingDegrees?: number | null prop. Pass it to MapViewport as headingRotationDeg.
5. Read mobile/App.tsx — extract smoothedHeadingDegrees from useCurrentPosition return. Pass headingDegrees={smoothedHeadingDegrees} to MapViewportFloor. When guidanceState.phase === 'idle', pass null (heading rotation only during active guidance).
6. Run npx tsc --noEmit to verify 0 TypeScript errors.

## Inputs

- `mobile/map/mapTransform.ts`
- `mobile/map/MapViewport.tsx`
- `mobile/map/MapViewportFloor.tsx`
- `mobile/App.tsx`
- `mobile/hooks/useCurrentPosition.ts`

## Expected Output

- `mobile/map/mapTransform.ts`
- `mobile/map/MapViewport.tsx`
- `mobile/map/MapViewportFloor.tsx`
- `mobile/App.tsx`

## Verification

npx tsc --noEmit

## Observability Impact

smoothedHeadingDegrees flows reactively through props → map rotation. No new logging; heading is observable via React DevTools state inspection.
