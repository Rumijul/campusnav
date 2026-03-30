---
estimated_steps: 68
estimated_files: 2
skills_used: []
---

# T03: Implement useCurrentPosition hook with GPS + heading subscription

Create the GPS + heading subscription hook in `mobile/hooks/useCurrentPosition.ts`. This is the position+heading interface that `useGuidanceSession` will consume. Keep the native module calls behind thin abstractions so the hook is testable without real device.

Steps:
1. Create `mobile/hooks/useCurrentPosition.ts` with:

   a. **PositionFix interface**:
      ```typescript
      interface PositionFix {
        latitude: number
        longitude: number
        accuracyMeters: number
        headingDegrees: number | null
        timestamp: number
      }
      ```

   b. **HeadingData interface**:
      ```typescript
      interface HeadingData {
        headingDegrees: number   // 0-360 magnetic north
        accuracyDegrees: number  // heading accuracy
      }
      ```

   c. **HeadingReader interface** (for testability — abstracts magnetometer API):
      ```typescript
      interface HeadingReader {
        start(callback: (data: HeadingData) => void): void
        stop(): void
      }
      ```

   d. **PositionReader interface** (for testability — abstracts geolocation API):
      ```typescript
      interface PositionReader {
        watchPosition(
          onPosition: (fix: PositionFix) => void,
          onError: (error: Error) => void,
        ): { stop: () => void }
      }
      ```

   e. **useCurrentPosition** hook with options:
      ```typescript
      interface UseCurrentPositionOptions {
        updateIntervalMs?: number        // default: 2000
        maxAccuracyMeters?: number       // default: 50, passed to isGpsFixConfident
        headingReader?: HeadingReader     // defaults to native magnetometer
        positionReader?: PositionReader  // defaults to native navigator.geolocation
      }
      ```

      Hook behavior:
      - On mount: subscribe to positionReader.watchPosition
      - Subscribe to headingReader (if available) — only trust heading when accuracyDegrees <= 15°
      - Apply exponential moving average (EMA) to heading: `smoothedHeading = alpha * newHeading + (1 - alpha) * smoothedHeading` where alpha = 0.3. Handle wraparound at 0°/360° by using the shorter angular path.
      - Return `{ position: PositionFix | null, heading: HeadingData | null, smoothedHeadingDegrees: number | null, isConfident: boolean, isHeadingValid: boolean }`
      - On unmount: stop both subscriptions

   f. **DefaultNativeHeadingReader** class implementing HeadingReader:
      - Uses `expo-sensors` Magnetometer if available in the environment
      - Falls back to no-op (isHeadingValid stays false)
      - Maps magnetometer events to { headingDegrees, accuracyDegrees: 10 } for simplicity

   g. **DefaultPositionReader** class implementing PositionReader:
      - Uses `navigator.geolocation.watchPosition` (React Native raw API, no extra package needed)
      - Maps native GeolocationPosition to PositionFix
      - Handles PERMISSION_DENIED, POSITION_UNAVAILABLE, TIMEOUT errors by calling onError

   h. **isGpsFixConfident** import from `src/shared/gps.ts` for the confidence check.

2. Create `mobile/hooks/useCurrentPosition.test.ts` with mocked PositionReader and HeadingReader:
   - Test: confident position with good heading → isConfident=true, isHeadingValid=true
   - Test: confident position with no heading → isConfident=true, isHeadingValid=false
   - Test: unconfident GPS (accuracy > threshold) → isConfident=false
   - Test: heading EMA smoothing: two readings 90° apart smooth toward new value
   - Test: cleanup: subscriptions stopped on unmount

3. Run `npm test -- --run mobile/hooks/useCurrentPosition.test.ts` and verify tests pass.
4. Verify TypeScript: 0 errors.

## Inputs

- `src/shared/gps.ts`

## Expected Output

- `mobile/hooks/useCurrentPosition.ts`
- `mobile/hooks/useCurrentPosition.test.ts`

## Verification

`npm test -- --run mobile/hooks/useCurrentPosition.test.ts` passes with 0 TypeScript errors

## Observability Impact

The hook exposes isConfident and isHeadingValid — S04 can surface these in the UI when guidance is low-confidence.
