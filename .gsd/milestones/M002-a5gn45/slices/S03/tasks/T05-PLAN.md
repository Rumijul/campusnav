---
estimated_steps: 55
estimated_files: 4
skills_used: []
---

# T05: Implement LiveGuidanceOverlay and ConfidenceIndicator UI components

Create the guidance UI components in `mobile/components/guidance/`. These are the visual layer S04 will later enhance with floor-aware overlays and accessible mode parity.

Steps:
1. Create directory `mobile/components/guidance/`.

2. Create `mobile/components/guidance/ConfidenceIndicator.tsx`:
   - Props: `confidence: ConfidenceLevel`
   - Renders a small colored dot:
     - 'high' → green (#22c55e)
     - 'medium' → yellow (#eab308)
     - 'low' → orange (#f97316)
     - 'none' → red (#ef4444) with an icon (e.g., a question mark or GPS-off icon)
   - The dot should be a View with borderRadius: 9999, width/height 12px.
   - Optional: clicking reveals a small popover/modal with confidence details (accuracy, heading accuracy). Implement this as a simple Pressable that toggles a Text label.
   - Export type `ConfidenceLevel` from this file (re-exported from guidanceState).

3. Create `mobile/components/guidance/LiveGuidanceOverlay.tsx`:
   - Props:
     ```typescript
     interface LiveGuidanceOverlayProps {
       guidanceState: GuidanceState
       onConfirmPosition: () => void
       onStopGuidance: () => void
     }
     ```
   - Conditionally renders based on guidanceState.phase:
     - **idle**: Render nothing (null)
     - **low-confidence**: Render a banner:
       - Orange/yellow background
       - Text: "Can't confirm your location. Tap the map to confirm where you are, or move to an open area."
       - ConfidenceIndicator dot on the left
       - "Confirm location" button (calls onConfirmPosition)
     - **guiding**: Render the main guidance card:
       - Large current step instruction text (e.g., "Walk 50m to the elevators")
       - StepIcon from the active step on the left
       - Distance remaining to destination
       - Progress indicator (e.g., "Step 2 of 5")
       - ConfidenceIndicator dot in the corner
       - Small "End guidance" text button (onStopGuidance)
     - **rerouting**: Render a banner:
       - Blue background
       - Text: "Recalculating your route..."
       - A loading spinner (ActivityIndicator from react-native)
     - **arrived**: Render a celebration card:
       - Green checkmark icon
       - "You've arrived!" text
       - Destination name
       - "Done" button (onStopGuidance)
   - Use StyleSheet.create for styling. Keep colors consistent with a shared constants file if one exists, otherwise define inline.

4. Create `mobile/components/guidance/LiveGuidanceOverlay.test.tsx` and `ConfidenceIndicator.test.tsx`:
   - Since the project uses jsdom environment (per vitest config), these will be smoke tests checking component renders without crash for each phase.
   - Test: ConfidenceIndicator renders green dot for 'high', red for 'none', etc.
   - Test: LiveGuidanceOverlay renders null for 'idle' phase
   - Test: LiveGuidanceOverlay renders guidance card for 'guiding' phase
   - Test: LiveGuidanceOverlay renders low-confidence banner for 'low-confidence' phase
   - Test: LiveGuidanceOverlay renders arrived card for 'arrived' phase

5. Run `npm test -- --run mobile/components/guidance/` and verify all pass.
6. Verify TypeScript: 0 errors.

## Inputs

- `mobile/routing/guidanceState.ts`

## Expected Output

- `mobile/components/guidance/ConfidenceIndicator.tsx`
- `mobile/components/guidance/LiveGuidanceOverlay.tsx`
- `mobile/components/guidance/ConfidenceIndicator.test.tsx`
- `mobile/components/guidance/LiveGuidanceOverlay.test.tsx`

## Verification

`npm test -- --run mobile/components/guidance/` passes with 0 TypeScript errors

## Observability Impact

None
