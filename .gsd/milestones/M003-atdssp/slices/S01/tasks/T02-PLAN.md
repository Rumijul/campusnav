---
estimated_steps: 1
estimated_files: 4
skills_used: []
---

# T02: Create mobile/theme/ token files and useTheme hook

Create mobile/theme/colors.ts with darkColors and lightColors const-asserted token objects matching the design palette. Create mobile/theme/spacing.ts with xs/sm/md/lg/xl/2xl on a 4pt grid. Create mobile/theme/typography.ts with title/sectionHeader/body/caption text styles. Create mobile/theme/index.ts exporting a useTheme() hook using useColorScheme() that returns { colors, spacing, typography, isDark }. Verify with tsc --noEmit and npm test.

## Inputs

- `mobile/babel.config.js`

## Expected Output

- `mobile/theme/colors.ts`
- `mobile/theme/spacing.ts`
- `mobile/theme/typography.ts`
- `mobile/theme/index.ts`

## Verification

cd mobile && npx tsc --noEmit && npm test
