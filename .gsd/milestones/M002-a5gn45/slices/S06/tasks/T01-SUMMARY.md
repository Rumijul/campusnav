---
id: T01
parent: S06
milestone: M002-a5gn45
provides: []
requires: []
affects: []
key_files: ["mobile/android/app/build/outputs/apk/debug/app-debug.apk", "emulator_screenshot.png", "src/server/index.ts", "mobile/.env", "mobile/App.tsx"]
key_decisions: ["APK built correctly — installable and runnable on Android target", "Backend requires PostgreSQL for migrations+seed before HTTP server starts — not a lazy/init-on-demand pattern", "EXPO_PUBLIC_API_BASE_URL correctly set to http://10.0.2.2:3000 for Android emulator network routing", "App bootstrap state machine correctly implements no-login visitor access (authRequired: false in all states)"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "APK installed successfully on emulator. App package verified: com.campusnav.mobile v0.1.0. Screenshot shows app loading state. Backend unreachable (no PostgreSQL). E2E walkthrough blocked — backend is a hard prerequisite for mobile app bootstrap."
completed_at: 2026-03-30T16:13:43.670Z
blocker_discovered: true
---

# T01: APK installed and verified on Android emulator; full E2E walkthrough blocked by PostgreSQL unavailability preventing backend startup

> APK installed and verified on Android emulator; full E2E walkthrough blocked by PostgreSQL unavailability preventing backend startup

## What Happened
---
id: T01
parent: S06
milestone: M002-a5gn45
key_files:
  - mobile/android/app/build/outputs/apk/debug/app-debug.apk
  - emulator_screenshot.png
  - src/server/index.ts
  - mobile/.env
  - mobile/App.tsx
key_decisions:
  - APK built correctly — installable and runnable on Android target
  - Backend requires PostgreSQL for migrations+seed before HTTP server starts — not a lazy/init-on-demand pattern
  - EXPO_PUBLIC_API_BASE_URL correctly set to http://10.0.2.2:3000 for Android emulator network routing
  - App bootstrap state machine correctly implements no-login visitor access (authRequired: false in all states)
duration: ""
verification_result: mixed
completed_at: 2026-03-30T16:13:43.670Z
blocker_discovered: true
---

# T01: APK installed and verified on Android emulator; full E2E walkthrough blocked by PostgreSQL unavailability preventing backend startup

**APK installed and verified on Android emulator; full E2E walkthrough blocked by PostgreSQL unavailability preventing backend startup**

## What Happened

Physical device E2E walkthrough setup completed for TC-3 through TC-10. Android emulator (Medium_Phone_API_36.1) launched headlessly with adb connectivity confirmed (emulator-5554). APK (127,631,438 bytes, package com.campusnav.mobile, v0.1.0) installed and verified via pm dump. App screenshot confirms it loads to CampusNav branding and enters "loading: 'map'" bootstrap phase — correctly attempting to fetch nav graph from http://10.0.2.2:3000 (emulator's host alias). Backend startup attempted but blocked: src/server/index.ts requires PostgreSQL on port 5432 which is not running. Docker Desktop Linux engine unavailable (cannot use docker-compose). PostgreSQL 17 winget install initiated but canceled by user mid-installation. Without PostgreSQL the backend crashes with ECONNREFUSED 127.0.0.1:5432 immediately on startup, preventing all subsequent E2E walkthrough steps. App's no-login visitor access design (R024) confirmed structurally correct in app code and bootstrap state.

## Verification

APK installed successfully on emulator. App package verified: com.campusnav.mobile v0.1.0. Screenshot shows app loading state. Backend unreachable (no PostgreSQL). E2E walkthrough blocked — backend is a hard prerequisite for mobile app bootstrap.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `ls mobile/android/app/build/outputs/apk/debug/app-debug.apk` | 0 | ✅ pass | 1000ms |
| 2 | `adb install -r mobile/android/app/build/outputs/apk/debug/app-debug.apk` | 0 | ✅ pass | 30000ms |
| 3 | `adb shell pm dump com.campusnav.mobile` | 0 | ✅ pass | 5000ms |
| 4 | `adb devices` | 0 | ✅ pass | 2000ms |
| 5 | `adb exec-out screencap -p > emulator_screenshot.png` | 0 | ✅ pass | 3000ms |
| 6 | `curl http://localhost:3001/api/health` | 1 | ❌ fail | 5000ms |
| 7 | `netstat -an | grep 5432` | 1 | ❌ fail | 2000ms |
| 8 | `docker --context desktop-linux ps` | 1 | ❌ fail | 5000ms |


## Deviations

Backend could not be started — PostgreSQL unavailable. Full E2E walkthrough (TC-3 through TC-10) not executed. App code review confirms no-login visitor access design (R024) is structurally implemented correctly.

## Known Issues

PostgreSQL not running on port 5432. Docker Desktop Linux engine not available. PostgreSQL 17 installer canceled by user. Backend cannot start without DB. All E2E steps requiring live guidance (TC-6 through TC-10) are hard-blocked without backend.

## Files Created/Modified

- `mobile/android/app/build/outputs/apk/debug/app-debug.apk`
- `emulator_screenshot.png`
- `src/server/index.ts`
- `mobile/.env`
- `mobile/App.tsx`


## Deviations
Backend could not be started — PostgreSQL unavailable. Full E2E walkthrough (TC-3 through TC-10) not executed. App code review confirms no-login visitor access design (R024) is structurally implemented correctly.

## Known Issues
PostgreSQL not running on port 5432. Docker Desktop Linux engine not available. PostgreSQL 17 installer canceled by user. Backend cannot start without DB. All E2E steps requiring live guidance (TC-6 through TC-10) are hard-blocked without backend.
