---
estimated_steps: 1
estimated_files: 1
skills_used: []
---

# T06: Manual E2E on-device proof (R033 verification)

Document and execute the manual end-to-end verification checklist proving R033: visitor completes one end-to-end guided trip including an off-route recovery. Transfer the APK to an Android device (or install via `adb install`) and the .app to an iOS device/simulator. Execute the checklist: (1) App launches, (2) Visitor selects start + destination, (3) Route preview appears, (4) Guidance starts, (5) Visitor deliberately deviates from route, (6) Reroute triggers within 5-10 seconds, (7) Destination reached. Write a E2E checklist file documenting each step and whether it passed.

## Inputs

- `mobile/android/app/build/outputs/ — APK/AAB from T04`
- `mobile/ios/build/ — .app/.ipa from T05`

## Expected Output

- `mobile/e2e-checklist.md — Markdown file documenting E2E verification steps with pass/fail status for each`

## Verification

manual — inspect E2E checklist file for all steps marked pass/fail
