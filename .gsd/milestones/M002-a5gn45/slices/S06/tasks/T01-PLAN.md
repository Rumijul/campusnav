---
estimated_steps: 1
estimated_files: 2
skills_used: []
---

# T01: Physical device E2E walkthrough (TC-3 to TC-10)

Execute S05-UAT TC-3 through TC-10 on physical Android device or emulator. Install APK with `adb install -r mobile/android/app/build/outputs/apk/debug/app-debug.apk`. Start backend with `npm run dev`. Walk through: no-login entry, start/destination selection, route preview, live guidance with confidence dot, heading rotation, floor transitions, off-route deviation + reroute within 5–10 seconds, accessible mode, confidence fallback states, and destination arrival. Record pass/fail per step. Update R033 to validated on completion.

## Inputs

- `S05 S05-UAT.md e2e-checklist.md`
- `Android APK at mobile/android/app/build/outputs/apk/debug/app-debug.apk`

## Expected Output

- `Physical device E2E walkthrough results documenting each R033 step as pass/fail`
- `R033 requirement updated to validated status`

## Verification

adb install succeeds; backend reachable; all 8 walkthrough steps complete with pass/fail recorded

## Observability Impact

Live guidance loop observable on device screen; reroute behavior observable under real GPS movement.
