---
estimated_steps: 1
estimated_files: 11
skills_used: []
---

# T02: Build FloatingSearchBar, FloatingFloorSwitcher, DirectionStepCard, RouteSummaryStrip, and StartGuidanceButton

Create FloatingSearchBar (pill with two TextInputs + swap button), FloatingFloorSwitcher (horizontal floor pill row), DirectionStepCard (step instruction card with state-based accent coloring), RouteSummaryStrip (compact horizontal summary row), and StartGuidanceButton (animated scale Pressable). All use useTheme() from S01. DirectionStepCard uses DirectionStep type from mobile/domain/navGraph.ts. FloatingFloorSwitcher uses FloorPlanTarget from mobile/data/mapApiClient.ts. Follows the oxc workaround pattern for any type exports.

## Inputs

- `mobile/theme/index.ts`
- `mobile/theme/colors.ts`
- `mobile/theme/spacing.ts`
- `mobile/theme/typography.ts`
- `mobile/domain/navGraph.ts`
- `mobile/data/mapApiClient.ts`

## Expected Output

- `mobile/components/search/FloatingSearchBar.tsx`
- `mobile/components/search/index.ts`
- `mobile/components/floor/FloatingFloorSwitcher.tsx`
- `mobile/components/floor/index.ts`
- `mobile/components/route/DirectionStepCard.tsx`
- `mobile/components/route/RouteSummaryStrip.tsx`
- `mobile/components/route/StartGuidanceButton.tsx`
- `mobile/components/route/index.ts`

## Verification

cd mobile && npx tsc --noEmit 2>&1 | head -40
