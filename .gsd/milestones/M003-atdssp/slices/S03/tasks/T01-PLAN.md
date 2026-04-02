---
estimated_steps: 10
estimated_files: 3
skills_used: []
---

# T01: Add PulseRing to ConfidenceIndicator + theme color tokens

Add a pulsing ring sub-component to ConfidenceIndicator using react-native-reanimated. The ring scales from 1.0 to 1.8 and fades from opacity 0.6 to 0 over 1000ms, looping continuously. It renders behind the dot (flex order). Replace hardcoded DOT_COLOR/LABEL_COLOR hex values with theme tokens (colors.confidenceHigh, colors.confidenceMedium, colors.confidenceLow, colors.confidenceNone). Add a `showPulse` prop defaulting to true during non-idle phases. Add Vitest tests for pulse animation behavior.

Steps:
1. Read mobile/components/guidance/ConfidenceIndicator.tsx and confirm current DOT_COLOR/LABEL_COLOR hardcoded values
2. Import useTheme from '../../theme' and use colors.confidenceHigh/Medium/Low/None
3. Create PulseRing sub-component using useSharedValue + useAnimatedStyle + withRepeat(withSequence(withTiming(...)))
4. Render PulseRing behind dot by placing it before dot in JSX (flex order)
5. Add showPulse prop (default true) to conditionally show pulse
6. Update ConfidenceIndicator.test.tsx with React.createElement tests for pulse ring rendering and showPulse prop
7. Run npm test -- --run ConfidenceIndicator to verify all tests pass
8. Verify no TypeScript errors with npx tsc --noEmit

## Inputs

- `mobile/components/guidance/ConfidenceIndicator.tsx`
- `mobile/components/guidance/ConfidenceIndicator.test.tsx`
- `mobile/theme/colors.ts`
- `mobile/theme/index.ts`

## Expected Output

- `mobile/components/guidance/ConfidenceIndicator.tsx`
- `mobile/components/guidance/ConfidenceIndicator.test.tsx`

## Verification

cd mobile && npm test -- --run ConfidenceIndicator && npx tsc --noEmit 2>&1 | head -10
