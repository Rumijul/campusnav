# CampusNav E2E Verification Checklist

## Build Artifacts

### Android
- **APK Path**: `mobile/android/app/build/outputs/apk/debug/app-debug.apk`
- **APK Size**: 127,631,438 bytes (127 MB)
- **Package Name**: `com.campusnav.mobile`
- **Version**: 0.1.0 (versionCode 1)
- **Build Date**: 2026-03-30
- **Status**: ✅ Built (T05)

### iOS
- **Status**: ❌ Blocked - Windows platform cannot generate iOS builds
- **Required for**: macOS with Xcode
- **Build Command**: `eas build --platform ios --profile preview`
- **Fallback**: Expo Go development build with `npx expo run:ios`

---

## Manual E2E Verification Checklist (R033)

**Requirement**: R033 — Visitor completes one end-to-end guided trip including an off-route recovery.

### Prerequisites
1. Android device or emulator with USB debugging enabled
2. Location services enabled on device
3. APK installed via: `adb install mobile/android/app/build/outputs/apk/debug/app-debug.apk`

---

### Step 1: App Launch ✅ / ❌
- [ ] App icon visible on home screen / app drawer
- [ ] Tap app icon → splash screen appears
- [ ] Splash screen shows CampusNav branding (#1a1a2e background)
- [ ] App transitions to main screen within 5 seconds
- [ ] No crash or ANR during startup

**Expected Result**: Main navigation screen displayed with map and search controls visible.

**Verification Notes**: _________________________

---

### Step 2: Start Location Selection ✅ / ❌
- [ ] "Start" field visible at top of screen
- [ ] Tap "Start" field → location picker appears
- [ ] Current location option shown (if GPS available)
- [ ] Building/campus location search works
- [ ] Selected start location displayed in field

**Expected Result**: Visitor can select starting point (current GPS location or campus building).

**Verification Notes**: _________________________

---

### Step 3: Destination Selection ✅ / ❌
- [ ] "Destination" field visible below Start field
- [ ] Tap "Destination" field → location picker appears
- [ ] Campus building search/filter works
- [ ] Popular destinations (if any) shown
- [ ] Selected destination displayed in field

**Expected Result**: Visitor can select destination building/location.

**Verification Notes**: _________________________

---

### Step 4: Route Preview ✅ / ❌
- [ ] "Navigate" or route preview button appears after both locations selected
- [ ] Route drawn on map (polyline overlay)
- [ ] Estimated travel time displayed
- [ ] Distance shown (meters/km or campus-specific)
- [ ] Multiple route options (if available) shown
- [ ] Route matches visually on map

**Expected Result**: Clear route visualization from start to destination with time/distance estimates.

**Verification Notes**: _________________________

---

### Step 5: Guidance Start ✅ / ❌
- [ ] Tap "Start Navigation" or confirm route button
- [ ] Guidance overlay appears (turn-by-turn instructions)
- [ ] First direction/instruction shown
- [ ] Current position indicator (blue dot) visible
- [ ] Map follows current position (if GPS active)
- [ ] Audio guidance (if implemented) begins

**Expected Result**: Active navigation guidance begins with clear instructions.

**Verification Notes**: _________________________

---

### Step 6: Off-Route Deviation Test ✅ / ❌
**Purpose**: Verify rerouting capability when visitor deviates from planned route.

#### Actions:
1. While guidance is active, walk/drive in opposite direction of route
2. OR manually dismiss/reject guidance
3. OR simulate location moving off route path

#### Observations:
- [ ] After 3-5 seconds, system detects off-route status
- [ ] Visual indicator shows "off-route" or similar
- [ ] System begins recalculating new route
- [ ] New route polyline drawn within 5-10 seconds
- [ ] Updated guidance instructions appear
- [ ] Guidance continues to original destination

**Expected Result**: Reroute triggers within 5-10 seconds of deviation, new route provided.

**Verification Notes**: _________________________

---

### Step 7: Destination Reached ✅ / ❌
- [ ] Upon approaching destination, arrival indicator appears
- [ ] Final instruction: "You have arrived" or similar
- [ ] Destination marker highlighted on map
- [ ] Option to end navigation shown
- [ ] Navigation session closes cleanly

**Expected Result**: Clear destination arrival notification and clean navigation end.

**Verification Notes**: _________________________

---

## iOS Verification (Requires macOS)

For iOS verification, transfer the build to a Mac and run:

```bash
# On macOS with Xcode installed
cd campusnav/mobile
npx expo run:ios --device

# Or install to simulator
npx expo run:ios --simulator
```

**Note**: iOS build requires macOS environment (blocked on Windows development machine).

---

## Test Summary

| Step | Description | Status | Tester | Date |
|------|-------------|--------|--------|------|
| 1 | App Launch | ______ | ________ | ________ |
| 2 | Start Location Selection | ______ | ________ | ________ |
| 3 | Destination Selection | ______ | ________ | ________ |
| 4 | Route Preview | ______ | ________ | ________ |
| 5 | Guidance Start | ______ | ________ | ________ |
| 6 | Off-Route Recovery | ______ | ________ | ________ |
| 7 | Destination Reached | ______ | ________ | ________ |

---

## R033 Verification Result

**Requirement**: Visitor completes one end-to-end guided trip including an off-route recovery.

- **All Steps Passed**: ✅ YES / ❌ NO
- **R033 Verified**: ✅ COMPLETE / ❌ INCOMPLETE
- **Blocking Issues Found**: _______________

---

## Known Limitations

1. **iOS Build**: Cannot be built on Windows - requires macOS with Xcode
2. **Physical Device Required**: GPS-based navigation cannot be fully tested on emulator (only simulated locations)
3. **Audio Guidance**: Requires device with audio output

---

## Quick Install Commands

### Android
```bash
# Connect device via USB with debugging enabled
adb install -r mobile/android/app/build/outputs/apk/debug/app-debug.apk

# Or if multiple devices connected
adb -d install -r mobile/android/app/build/outputs/apk/debug/app-debug.apk

# Verify installation
adb shell pm list packages | grep campusnav
```

### iOS (macOS only)
```bash
cd mobile
npx expo run:ios --device
# OR
eas build --platform ios --profile preview
# Then download and install via Xcode or TestFlight
```

---

*Document generated: 2026-03-30*
*Task: T07 - Manual E2E on-device proof*
*Milestone: M002-a5gn45 - Integrated acceptance + internal build delivery*
