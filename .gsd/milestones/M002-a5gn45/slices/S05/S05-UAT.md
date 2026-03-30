# S05: Integrated acceptance + internal build delivery — UAT

**Milestone:** M002-a5gn45
**Written:** 2026-03-30T15:29:01.446Z

# S05 UAT: Integrated Acceptance + Internal Build Delivery

## Preconditions
- Android device/emulator connected with USB debugging enabled
- CampusNav backend running at http://localhost:3000 (host) or http://10.0.2.2:3000 (emulator)
- APK installed: adb install -r mobile/android/app/build/outputs/apk/debug/app-debug.apk

## Test Case 1: Android APK Build (R032)
1. Run `ls mobile/android/app/build/outputs/apk/debug/app-debug.apk`
2. Confirm ~127 MB file exists
**Expected**: APK at expected path, 127MB
**Result**: ✅ PASS

## Test Case 2: EAS Build Configuration (R032)
1. Read mobile/eas.json
2. Confirm build.profiles has dev/preview/production
**Expected**: 3 profiles present
**Result**: ✅ PASS

## Test Case 3: No-Login Visitor Access (R024)
1. Launch app → no login screen appears
2. Map/graph loads automatically
**Expected**: authRequired: false in all bootstrap states
**Result**: ⬜ PENDING — requires device

## Test Case 4: Start + Destination Selection (R025)
1. Tap Start field → picker appears → select location
2. Tap Destination field → picker appears → select location
3. Navigate button enabled
**Expected**: Both fields populated, Navigate enabled
**Result**: ⬜ PENDING — requires device

## Test Case 5: Route Preview with Floor Context (R025, R026)
1. Tap Navigate → polyline drawn on map
2. Floor selector strip shows route floors
3. Tap floor button → route path updates
**Expected**: Outdoor + indoor route; floor buttons with Bldg/Floor labels
**Result**: ⬜ PENDING — requires device

## Test Case 6: Live Guidance + Confidence (R026, R027, R029)
1. Start guidance → overlay with instruction card
2. Observe confidence dot (green/yellow/orange/red)
3. Tap indicator → detail label appears
4. Walk → map rotates with heading
**Expected**: Card shows next step; dot color matches GPS quality; map follows heading
**Result**: ⬜ PENDING — requires device

## Test Case 7: Off-Route Reroute (R028)
1. Walk opposite to route direction for 5+ seconds
2. Off-route indicator appears after 3 fixes
3. Rerouting state shown
4. New route drawn within 5-10 seconds
**Expected**: Reroute after ~3 fixes (~5 sec), new route within 10 sec
**Result**: ⬜ PENDING — requires device

## Test Case 8: Accessible Mode (R031)
1. Select accessible/wheelchair mode
2. Start + dest → route avoids stairs
3. Deviate → reroute in accessible mode
**Expected**: Route uses ramps/elevators; reroute works
**Result**: ⬜ PENDING — requires device

## Test Case 9: Confidence Fallback (R027)
1. Navigate in low-GPS area (indoor/tall buildings)
2. Observe orange (low) or red (none) indicator
3. Observe correction prompt, not auto-guidance
**Expected**: Low-confidence state clearly communicated; no misleading step advancement
**Result**: ⬜ PENDING — requires device

## Test Case 10: Destination Arrival (R026)
1. Follow guidance to destination
2. "You have arrived" appears
3. arrive icon displayed; session close option shown
**Expected**: Arrival via shouldAdvanceStep proximity threshold; clean session end
**Result**: ⬜ PENDING — requires device

## Unit Test Coverage (522 passing)
MobilePathfindingEngine, generateDirections, guidanceState (deriveNextPhase, isOffRoute, shouldAdvanceStep), computeRouteSession, deriveConfidence, MapViewportFloor, runAppBootstrap, runMapBootstrap, fetchMapGraph, normalizeNavGraph, bearing/snap utilities, DestinationPicker.

## Known Limitations
iOS build requires macOS. Physical device test pending. 7 test suites fail: React 19 / @testing-library/react jsdom incompatibility (upgrade to v17+ to fix).
