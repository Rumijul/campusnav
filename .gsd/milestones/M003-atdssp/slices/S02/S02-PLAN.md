# S02: Bottom Sheet + Floating UI Chrome

**Goal:** Build the structural UI chrome: BottomSheet with 3 snap points (collapsed 120px / half 300px / full 600px), FloatingSearchBar pill, FloatingFloorSwitcher, DirectionStepCard, RouteSummaryStrip, StartGuidanceButton, and AccessibleToggle. These form the floating layer of the new layered layout — consumed by S04 App.tsx integration.
**Demo:** After this: Bottom sheet renders and can be dragged between collapsed (strip), half (route preview), and full (settings) snap points. Floating search bar pill is visible at top of screen.

## Tasks
- [x] **T01: Created BottomSheet with pan gesture + 3 snap points, BottomSheetHandle, and AccessibleToggle iOS-style spring switch** — Create BottomSheet.tsx with GestureDetector pan gesture and 3 snap points, BottomSheetHandle.tsx, and AccessibleToggle.tsx with spring-animated iOS-style switch. All use useTheme() from S01. Follows the oxc workaround pattern (export const TypeName = undefined as unknown as TypeName) for any type exports.
  - Estimate: 45m
  - Files: mobile/components/sheet/BottomSheet.tsx, mobile/components/sheet/BottomSheetHandle.tsx, mobile/components/settings/AccessibleToggle.tsx, mobile/theme/index.ts, mobile/theme/colors.ts, mobile/components/sheet/index.ts, mobile/components/settings/index.ts
  - Verify: cd mobile && npx tsc --noEmit 2>&1 | head -40
- [ ] **T02: Build FloatingSearchBar, FloatingFloorSwitcher, DirectionStepCard, RouteSummaryStrip, and StartGuidanceButton** — Create FloatingSearchBar (pill with two TextInputs + swap button), FloatingFloorSwitcher (horizontal floor pill row), DirectionStepCard (step instruction card with state-based accent coloring), RouteSummaryStrip (compact horizontal summary row), and StartGuidanceButton (animated scale Pressable). All use useTheme() from S01. DirectionStepCard uses DirectionStep type from mobile/domain/navGraph.ts. FloatingFloorSwitcher uses FloorPlanTarget from mobile/data/mapApiClient.ts. Follows the oxc workaround pattern for any type exports.
  - Estimate: 60m
  - Files: mobile/components/search/FloatingSearchBar.tsx, mobile/components/search/index.ts, mobile/components/floor/FloatingFloorSwitcher.tsx, mobile/components/floor/index.ts, mobile/components/route/DirectionStepCard.tsx, mobile/components/route/RouteSummaryStrip.tsx, mobile/components/route/StartGuidanceButton.tsx, mobile/components/route/index.ts, mobile/theme/index.ts, mobile/domain/navGraph.ts, mobile/data/mapApiClient.ts
  - Verify: cd mobile && npx tsc --noEmit 2>&1 | head -40
