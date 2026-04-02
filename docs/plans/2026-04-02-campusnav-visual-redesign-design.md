# CampusNav Visual Redesign — Design Document
**Date:** 2026-04-02
**Status:** Approved

---

## 1. Layout Architecture

### Layer Structure (back-to-front)
1. **Full-Screen Map** — Floor plan image as backdrop, fills entire screen
2. **Floating UI Chrome** — Search bar, floor switcher, action buttons
3. **Bottom Sheet** — Primary content surface, swipes up over the map
4. **Guidance Overlay** — Live guidance HUD, renders above everything

### Floating Search Bar
- Pill-shaped, top of screen, blurred/semi-transparent background
- Contains: origin field, swap button, destination field
- Stays fixed while map pans beneath
- Tap to expand and show full search

### Bottom Sheet (primary interaction surface)
Three snap points:
- **Collapsed** — Peek strip: floor badge, ETA, distance
- **Half-expanded** — Route preview with step-by-step directions (default when route is ready)
- **Full** — Building/node browser, accessible settings, full search results

Implemented with `react-native-gesture-handler` + `react-native-reanimated`.

### Current → New Component Mapping
| Old Location | New Location |
|---|---|
| `DestinationPicker` | Bottom sheet (half-expanded) |
| `RoutePreview` | Bottom sheet (half-expanded) |
| `MapViewportFloor` | Full-screen backdrop layer |
| `LiveGuidanceOverlay` | Floating overlay (z-index above all) |
| `AccessibleToggle` | Bottom sheet (full state settings) |
| Telemetry/debug text | Removed in release builds |

---

## 2. Typography & Color System

### Color Tokens

**Dark Mode**
| Token | Value | Usage |
|---|---|---|
| `background` | `#0B0F19` | App background |
| `surface` | `#111827` | Bottom sheet, cards |
| `surfaceElevated` | `#1F2937` | Elevated cards |
| `primary` | `#3B82F6` | Buttons, active states |
| `textPrimary` | `#F9FAFB` | Headlines, primary text |
| `textSecondary` | `#9CA3AF` | Labels, secondary info |
| `textMuted` | `#6B7280` | Captions, hints |
| `border` | `#374151` | Dividers, outlines |
| `success` | `#10B981` | Good confidence, success |
| `warning` | `#F59E0B` | Medium confidence |
| `error` | `#EF4444` | Low confidence, errors |

**Light Mode**
| Token | Value |
|---|---|
| `background` | `#F3F4F6` |
| `surface` | `#FFFFFF` |
| `surfaceElevated` | `#FFFFFF` (with shadow) |
| `primary` | `#007AFF` |
| `textPrimary` | `#111827` |
| `textSecondary` | `#4B5563` |
| `textMuted` | `#9CA3AF` |
| `border` | `#E5E7EB` |

### Typography
- **Font:** System default (SF Pro on iOS, Roboto on Android — no custom font needed)
- **Title:** 24px / 700
- **Section header:** 17px / 600
- **Body:** 15px / 400
- **Caption:** 13px / 400
- **Tabular numbers** for metrics (already implemented with `fontVariant: ['tabular-nums']`)

### Spacing Scale (4pt grid)
`xs: 4px | sm: 8px | md: 16px | lg: 24px | xl: 32px | 2xl: 48px`

---

## 3. Animations & Transitions

### Route Path Drawing
- Path animates along its length from origin to destination
- Uses `react-native-reanimated` shared value driving SVG stroke-dashoffset
- Duration: ~800ms, ease-out curve

### Floor Transition
- Cross-fade between old and new floor plan: 200ms
- Camera spring animation to nearest node on new floor: 300ms

### Bottom Sheet Gestures
- Swipe up/down to move between snap points
- Spring animation (damping: 0.8)
- Flick down from full → collapses to peek
- Implemented with `react-native-gesture-handler` + `react-native-reanimated`

### Guidance Step Transition
- Next step card: slide + scale + opacity (150ms)
- Current step highlighted with accent border

### Search Bar Focus
- Expands slightly on tap, keyboard appears
- Map viewport does NOT shift — sheet is fixed

### Floating Button Press
- Scale 0.95 on press, 100ms duration

---

## 4. Component Inventory

| Component | Description |
|---|---|
| `FloatingSearchBar` | Pill at top, blurred background, origin/destination fields + swap button |
| `BottomSheet` | Draggable sheet with 3 snap points (collapsed/half/full), drag handle, rounded top corners |
| `RouteSummaryStrip` | Compact strip in collapsed state — floor badge, ETA, distance |
| `DirectionStepCard` | Left accent border, icon, instruction, distance. States: current/upcoming/completed |
| `FloatingFloorSwitcher` | Horizontal floor number pills, right side of map, highlights active floor |
| `AccessibleToggle` | iOS-style toggle in bottom sheet settings |
| `ConfidenceDot` | Colored pulsing ring dot — green/yellow/red based on confidence |
| `StartGuidanceButton` | Full-width primary button, bottom of half-expanded sheet |

---

## 5. Auto Light/Dark Mode

- Use React Native's `useColorScheme()` hook
- All color tokens resolve from the active theme object
- System setting controls default; no manual toggle needed for theme

---

## 6. Out of Scope (GSD-2)

- Component library extraction (can be done post-initial implementation)
- Custom font loading
- Haptic feedback
- Offline mode
- Accessibility audit beyond accessible routing toggle

---

*Design approved 2026-04-02. Implementation via GSD-2 writing-plans skill.*
