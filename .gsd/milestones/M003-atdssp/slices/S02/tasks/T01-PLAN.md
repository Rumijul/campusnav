---
estimated_steps: 1
estimated_files: 7
skills_used: []
---

# T01: Build BottomSheet and AccessibleToggle components

Create BottomSheet.tsx with GestureDetector pan gesture and 3 snap points, BottomSheetHandle.tsx, and AccessibleToggle.tsx with spring-animated iOS-style switch. All use useTheme() from S01. Follows the oxc workaround pattern (export const TypeName = undefined as unknown as TypeName) for any type exports.

## Inputs

- `mobile/theme/index.ts`
- `mobile/theme/colors.ts`
- `mobile/theme/spacing.ts`
- `mobile/theme/typography.ts`

## Expected Output

- `mobile/components/sheet/BottomSheet.tsx`
- `mobile/components/sheet/BottomSheetHandle.tsx`
- `mobile/components/sheet/index.ts`
- `mobile/components/settings/AccessibleToggle.tsx`
- `mobile/components/settings/index.ts`

## Verification

cd mobile && npx tsc --noEmit 2>&1 | head -40

## Observability Impact

none
