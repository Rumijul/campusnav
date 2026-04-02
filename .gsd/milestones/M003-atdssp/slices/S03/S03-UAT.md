# S03: Route + Guidance Animated Components — UAT

**Milestone:** M003-atdssp
**Written:** 2026-04-02T12:32:08.979Z

# S03: Route + Guidance Animated Components — UAT

**Milestone:** M003-atdssp | **Date:** 2026-04-02

## Preconditions
- Mobile app built (npx expo prebuild completed)
- Metro bundler running (npx expo start)
- Dark and light system themes available for token verification

## Test Cases

**TC-1: Pulse Ring Shows for High Confidence** — Render ConfidenceIndicator confidence=high showPulse=true. Ring scales 1.0→1.8, fades 0.6→0 over 1000ms, renders behind dot. Color matches confidenceHigh theme token.

**TC-2: Pulse Ring Hidden When showPulse=false** — Dot renders alone at 12×12px. No pulsing ring visible.

**TC-3: All Four Confidence Levels Use Theme Tokens** — confidence=high/medium/low/none maps to confidenceHigh/Medium/Low/None from darkColors. Light mode uses lightColors.

**TC-4: Tap Toggles Detail Label** — Tap dot → label appears ("GPS OK" etc). Tap again → label hides.

**TC-5: Route Path Draws On Mount** — Path animates from origin to destination over ~800ms using strokeDashoffset. Start node = colors.routeStart circle, end = colors.routeEnd.

**TC-6: Empty Path Returns Null** — path=[] → component returns null. No crash.

**TC-7: Filters to Active Floor** — activeFloorId=1 renders floor 1 nodes only. Changing to floor 2 updates path correctly.

**TC-8: Pointer Events None** — overlay pointerEvents="none" — map touches pass through to floor plan below.

## Edge Cases

**EC-1: Single Node Path** — Start circle renders. No segment. No end circle.

**EC-2: Viewport Change** — totalLength recomputes; animation replays with new dimensions.

**EC-3: PulseRing Cleanup** — useEffect cleanup resets shared values. No animation after unmount.

**EC-4: Zero-Length Segment** — computePathLength returns 0. Component renders without NaN.

9 test cases + 4 edge cases. Executed by S04 integration + device verification. Status: pending S04.
