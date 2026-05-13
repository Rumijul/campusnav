# CampusNav Mobile — Maps-Quality Redesign

> **Goal:** Rewrite the mobile app from scratch with Apple/Google Maps-level visual polish. Same functionality as current, but beautiful.

**Architecture:** Expo + React Native. Full-screen map + translucent floating chrome (search bar, bottom sheet, guidance banner). Glass-morphism design language. react-native-reanimated for all animations, react-native-gesture-handler for all touch, react-native-svg for route overlay.

**Strategy:** Start with a fresh `mobile-v2/` directory, build slice by slice. Keep the existing `mobile/` as reference for logic (pathfinding, routing, GPS, graph normalization) — port that logic, redesign the UI shell completely.

**Tech Stack (unchanged):** Expo 53, React Native 0.79, react-native-reanimated 3.19, react-native-gesture-handler 2.30, react-native-svg 15.15, @react-native-community/blur 4.4

---

## Slice 0: Scaffold & Theme Foundation

### Task 0.1: Create mobile-v2 directory and package.json

**Objective:** Initialize a fresh Expo project inside `mobile-v2/`

**Files:**
- Create: `mobile-v2/package.json`
- Create: `mobile-v2/tsconfig.json`
- Create: `mobile-v2/app.json`
- Create: `mobile-v2/App.tsx` (bare scaffold)

Package.json dependencies:
- expo, react, react-native (same versions as current)
- react-native-reanimated, react-native-gesture-handler, react-native-svg
- @react-native-community/blur
- expo-location, expo-sensors

### Task 0.2: Build theme system

**Objective:** Maps-inspired color tokens, spacing, typography

**Files:**
- Create: `mobile-v2/theme/colors.ts`
- Create: `mobile-v2/theme/spacing.ts`
- Create: `mobile-v2/theme/typography.ts`
- Create: `mobile-v2/theme/shadows.ts`
- Create: `mobile-v2/theme/index.ts` (useTheme hook)

**Design tokens (dark mode default):**
- Background: #0F172A (deep slate navy — material dark)
- Surface: #1E293B (card/sheet surfaces)
- Surface elevated: #334155 (raised elements)
- Accent: #3B82F6 (blue-500, route line color)
- Accent accessible: #F59E0B (amber-500, accessible route)
- Text primary: #F8FAFC
- Text secondary: #94A3B8
- Text muted: #64748B
- Success: #22C55E
- Warning: #F59E0B
- Error: #EF4444

Spacing: 4px grid (4, 8, 12, 16, 20, 24, 32, 40, 48, 64)

Typography: System font, sizes 11-34, weights 400/500/600/700

### Task 0.3: Build glass-morphism primitives

**Objective:** Reusable GlassView component for frosted overlays

**Files:**
- Create: `mobile-v2/components/primitives/GlassView.tsx`

Props: blurAmount, borderRadius, backgroundColor (with alpha), borderColor

Implementation: BlurView background + semi-transparent overlay. Expose as a simple wrapper.

### Task 0.4: Build reusable card component

**Objective:** Maps-style card with consistent padding, radius, shadow

**Files:**
- Create: `mobile-v2/components/primitives/Card.tsx`

Props: children, elevated (boolean), padding

Style: 16px radius, surface background, subtle border. Elevated variant adds shadow.

---

## Slice 1: Map Experience

### Task 1.1: Map viewport with smooth gestures

**Objective:** Full-screen interactive map with pinch-zoom and rotation

**Files:**
- Create: `mobile-v2/components/map/MapViewport.tsx`

Port the gesture handling logic from the existing MapViewport.tsx. Use GestureDetector with simultaneous pinch + pan + rotate. Render the floor plan image with Animated.Image, apply scale/translate/rotate transforms via useAnimatedStyle. Ensure zoom focal point is the pinch midpoint.

### Task 1.2: Floor plan image loading

**Objective:** Load and display floor plan image from API

**Files:**
- Create: `mobile-v2/data/mapApiClient.ts`

Port the existing mapApiClient logic. getMapData(), resolveFloorPlanImageUrl(). Use the same Hono API endpoints.

### Task 1.3: Node markers overlay

**Objective:** Tappable node dots on the map, Maps-style

**Files:**
- Create: `mobile-v2/components/map/NodeMarkers.tsx`

Render small dots at each node position. Color by type (entrance=green, restroom=pink, landmark=purple, stairs=orange, elevator=blue, ramp=green). Selected node gets a pulsing ring. Dots hide when zoomed out. Use shared values for position transforms so they move with the map in real time.

### Task 1.4: Floor cross-fade transition

**Objective:** Smooth cross-fade when switching floors

**Files:**
- Create: `mobile-v2/components/map/FloorTransition.tsx`

When floor changes: old image fades out (opacity 1→0, 300ms) while new image fades in (opacity 0→1, 300ms). Use two stacked Animated.Image with cross-fade. No jump cuts.

---

## Slice 2: Search Experience

### Task 2.1: Expandable search pill

**Objective:** Maps-style floating search bar

**Files:**
- Create: `mobile-v2/components/search/SearchPill.tsx`

Two states:
- **Collapsed** (default): Translucent pill showing "From · To" or current selection summary. 48px tall, glass background, centered near top.
- **Expanded** (on tap): Sheet slides down revealing two full text inputs (origin/destination) with clear buttons, swap button between them, and a "Search" CTA.

Animation: Animated height + opacity transition. BlurView backdrop.

### Task 2.2: Location search with autocomplete

**Objective:** Search rooms/buildings by name

**Files:**
- Create: `mobile-v2/components/search/LocationSearch.tsx`

Text inputs debounced at 300ms. Filter graph nodes by searchable name. Show results as a scrollable list below input. Tap result to select. Show "No results" when empty.

---

## Slice 3: Bottom Sheet (The Core)

This is the most important slice — the bottom sheet is the primary interaction surface and makes or breaks the Maps feel.

### Task 3.1: Sheet pan gesture with spring physics

**Objective:** Fluid, bouncy bottom sheet that feels like Apple Maps

**Files:**
- Create: `mobile-v2/components/sheet/Sheet.tsx`

Implementation:
- Uses Gesture.Pan() on the handle + content
- Tracks translateY as a shared value
- Snap points are percentages of screen height (not fixed pixels):
  - Collapsed: 15% (shows route summary only)
  - Half: 40% (shows directions list)
  - Full: 85% (shows full details + settings)
- On release, spring to nearest snap point
- Spring config: damping: 50, stiffness: 300 (smooth settle — not bouncy)
- Velocity-aware: fast flick up goes to next snap, slow drag stays
- Render a drag handle bar (36px wide, 4px tall, rounded, centered)
- Content area below handle fills remaining space

### Task 3.2: Sheet backdrop

**Objective:** Translucent backdrop when sheet is dragged up

**Files:**
- Modify: `mobile-v2/components/sheet/Sheet.tsx`

Render a semi-transparent backdrop (black 30% opacity) that fades in as the sheet moves from collapsed toward half. Tapping backdrop collapses sheet to minimum. Use Animated.View with opacity driven by sheet position.

### Task 3.3: Sheet content — collapsed state

**Objective:** Route summary strip when sheet is collapsed

**Files:**
- Create: `mobile-v2/components/sheet/SheetContent.tsx`

At collapsed (15%): Show a compact route summary:
- "5 min · 200m" on one line
- Start location → Destination on second line
- Accessible mode badge if active
- Swipe up indicator (chevron)

### Task 3.4: Sheet content — half state

**Objective:** Scrollable directions list

**Files:**
- Create: `mobile-v2/components/sheet/SheetContent.tsx` (continue)

At half (40%): Show directions list:
- Route summary header (ETA, distance, mode)
- Scrollable list of direction steps
- Each step: turn icon + instruction text + distance
- Floor transition steps have a distinct "Floor X" header badge
- Standard/accessible toggle at top

### Task 3.5: Sheet content — full state

**Objective:** Full detail view with settings

**Files:**
- Create: `mobile-v2/components/sheet/SheetContent.tsx` (continue)

At full (85%): Same directions list but taller, plus at the top:
- Building/floor browser (destination picker)
- Accessible mode toggle
- "Start Guidance" button (prominent, accent color, full width)

### Task 3.6: Direction step card component

**Objective:** Beautiful direction step rendering

**Files:**
- Create: `mobile-v2/components/directions/DirectionStep.tsx`

Design:
- Icon on left (arrow, stairs, elevator, flag)
- Instruction text (bold key phrase, lighter detail)
- Distance on right
- Color accent bar on left edge for the step type
- Floor transition steps get a distinct colored background
- Connects to next step with a subtle vertical line

---

## Slice 4: Route Visualization

### Task 4.1: Animated route path drawing

**Objective:** Route path draws itself from origin to destination

**Files:**
- Create: `mobile-v2/components/route/RoutePath.tsx`

Implementation:
- SVG overlay on the map
- Compute total path length
- Animate strokeDashoffset from totalLength to 0 over 800ms
- Ease-out curve for natural feel
- 16ms delay before animation starts (prevents flash)
- Path color: accent blue (#3B82F6) for standard, amber (#F59E0B) for accessible
- Line width: 4px with 20% opacity glow underneath

### Task 4.2: Start/end markers

**Objective:** Clear origin and destination markers on the map

**Files:**
- Create: `mobile-v2/components/route/RouteMarkers.tsx`

Origin: Green dot with "A" label
Destination: Red pin icon with "B" label (or use map marker emoji)
Both pulse briefly when route is first calculated.

---

## Slice 5: Live Guidance

### Task 5.1: Guidance top banner

**Objective:** Compact guidance strip like Apple Maps "in 200m, turn right"

**Files:**
- Create: `mobile-v2/components/guidance/GuidanceBanner.tsx`

Design:
- Glass pill at top of screen (below search bar)
- Shows current instruction: icon + "Turn right in 50m onto Main Corridor"
- Progress bar showing distance to next turn
- Floor badge when transitioning floors ("Floor 2 ↗")
- End guidance (X) button on right
- Slide in from top, slide out when done

### Task 5.2: Confidence indicator

**Objective:** GPS confidence ring

**Files:**
- Create: `mobile-v2/components/guidance/ConfidenceRing.tsx`

Small colored dot + pulsing ring in top-right corner during guidance:
- Green: high confidence (accuracy < 10m)
- Yellow: medium confidence (10-30m)
- Red: low confidence (>30m)
- Gray: no fix
Pulse animation: scale 1→1.8, opacity 0.6→0, continuous loop.

---

## Slice 6: Integration & Polish

### Task 6.1: Wire App.tsx

**Objective:** Compose all components into the main screen

**Files:**
- Modify: `mobile-v2/App.tsx`

Layout (bottom to top, z-index order):
1. MapViewport (z0) — full screen
2. NodeMarkers (z1) — on top of map
3. RoutePath (z2) — SVG overlay
4. RouteMarkers (z2) — start/end pins
5. Sheet backdrop (z5) — semi-transparent overlay
6. SearchPill (z10) — at top
7. GuidanceBanner (z15) — below search
8. ConfidenceRing (z20) — top-right
9. Sheet (z100) — bottom sheet

Bootstrap flow: load graph from API → set floor targets → render map.

### Task 6.2: Route calculation integration

**Objective:** Wire up pathfinding and directions

**Files:**
- Create: `mobile-v2/routing/useRouting.ts`

Port pathfinding logic from existing codebase (ngraph.path A*). Return standard + accessible paths. Generate step-by-step directions. Wire into sheet content and route path overlay.

### Task 6.3: GPS integration

**Objective:** Current position with confidence gating

**Files:**
- Create: `mobile-v2/hooks/useLocation.ts`

Port existing GPS logic: expo-location watcher, confidence gating, nearest walkable node snapping. Show "you are here" dot on map.

### Task 6.4: Haptics & micro-interactions

**Objective:** Haptic feedback for key interactions

**Files:**
- Modify: various components

Add haptics:
- Light impact on sheet snap
- Success notification on route found
- Warning on guidance step change
- Error on invalid selection

Use expo-haptics (light, medium, heavy, success, warning, error).

### Task 6.5: Floor switcher

**Objective:** Maps-style floor picker

**Files:**
- Create: `mobile-v2/components/map/FloorPicker.tsx`

Show as horizontal pill with floor numbers near the bottom-right of the map (above the sheet). Active floor highlighted. Tap to switch. Smooth scale animation on select.

### Task 6.6: Remove old mobile directory

**Objective:** Replace old code with new

**Files:**
- Delete: `mobile/` directory
- Rename: `mobile-v2/` → `mobile/`
- Update: Root `package.json` scripts if needed

### Task 6.7: Verification

**Objective:** Confirm everything works end-to-end

Checks:
- App boots and loads map data from API
- Search bar expands, allows room search
- Node selection sets origin/destination
- Route calculates and path animates on map
- Directions render in sheet
- Bottom sheet drags smoothly between 3 positions
- Floor switching cross-fades images
- Guidance banner shows during live navigation
- Dark/light theme switches with system preference
- All existing functionality preserved (start/destination selection, routing, GPS, guidance)

---

## Files Summary

| File | Action | Slice |
|------|--------|-------|
| `mobile-v2/package.json` | Create | 0 |
| `mobile-v2/tsconfig.json` | Create | 0 |
| `mobile-v2/app.json` | Create | 0 |
| `mobile-v2/App.tsx` | Create → Modify | 0 → 6 |
| `mobile-v2/theme/colors.ts` | Create | 0 |
| `mobile-v2/theme/spacing.ts` | Create | 0 |
| `mobile-v2/theme/typography.ts` | Create | 0 |
| `mobile-v2/theme/shadows.ts` | Create | 0 |
| `mobile-v2/theme/index.ts` | Create | 0 |
| `mobile-v2/components/primitives/GlassView.tsx` | Create | 0 |
| `mobile-v2/components/primitives/Card.tsx` | Create | 0 |
| `mobile-v2/components/map/MapViewport.tsx` | Create | 1 |
| `mobile-v2/components/map/NodeMarkers.tsx` | Create | 1 |
| `mobile-v2/components/map/FloorTransition.tsx` | Create | 1 |
| `mobile-v2/components/map/FloorPicker.tsx` | Create | 6 |
| `mobile-v2/data/mapApiClient.ts` | Create | 1 |
| `mobile-v2/components/search/SearchPill.tsx` | Create | 2 |
| `mobile-v2/components/search/LocationSearch.tsx` | Create | 2 |
| `mobile-v2/components/sheet/Sheet.tsx` | Create | 3 |
| `mobile-v2/components/sheet/SheetContent.tsx` | Create | 3 |
| `mobile-v2/components/directions/DirectionStep.tsx` | Create | 3 |
| `mobile-v2/components/route/RoutePath.tsx` | Create | 4 |
| `mobile-v2/components/route/RouteMarkers.tsx` | Create | 4 |
| `mobile-v2/components/guidance/GuidanceBanner.tsx` | Create | 5 |
| `mobile-v2/components/guidance/ConfidenceRing.tsx` | Create | 5 |
| `mobile-v2/routing/useRouting.ts` | Create | 6 |
| `mobile-v2/hooks/useLocation.ts` | Create | 6 |
| `mobile/` | Delete | 6 |

---

## Design Reference

Target look: Google Maps navigation mode + Apple Maps sheet UI

Key visual elements:
- **Glass everywhere**: BlurView backgrounds with semi-transparent overlays
- **Deep dark background**: #0F172A (not pure black — has blue undertones)
- **Blue accent**: #3B82F6 for routes, buttons, active states
- **Amber accessibility**: #F59E0B for accessible mode (high contrast against dark bg)
- **Rounded everything**: 12-16px corner radius on all cards and pills
- **Subtle borders**: 1px rgba(255,255,255,0.08) on cards for depth
- **Typography**: System font. Section headers at 13px semibold uppercase tracked. Body at 15px. Large numbers at 28-34px bold for ETA/distance.
- **Spacing**: Generous padding (16-24px). Nothing cramped.
- **Motion**: Spring physics everywhere. Nothing linear. Nothing instant.
