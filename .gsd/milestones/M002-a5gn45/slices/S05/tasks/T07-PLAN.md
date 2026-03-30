---
estimated_steps: 1
estimated_files: 1
skills_used: []
---

# T07: Manual E2E on-device proof (R033 verification)

Document and execute the manual end-to-end verification checklist proving R033: visitor completes one end-to-end guided trip including an off-route recovery. Transfer the APK to an Android device (or install via `adb install`) and the .app to an iOS device/simulator. Execute the checklist: (1) App launches, (2) Visitor selects start + destination, (3) Route preview appears, (4) Guidance starts, (5) Visitor deliberately deviates from route, (6) Reroute triggers within 5-10 seconds, (7) Destination reached. Write a E2E checklist file documenting each step and whether it passed. Verify: manual — inspect E2E checklist file for all steps marked pass/fail.

## Inputs

- `Android APK (T05 output)`
- `iOS .app bundle (T06 output)`

## Expected Output

- `mobile/e2e-checklist.md`

## Verification

manual — inspect E2E checklist file for all steps marked pass/fail
