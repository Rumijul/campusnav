---
estimated_steps: 1
estimated_files: 2
skills_used: []
---

# T04: Build Android APK/AAB artifact

Build Android APK or AAB from the generated android/ directory. Run `npx eas build --platform android --profile preview --non-interactive` or fall back to `./gradlew assembleRelease` inside `mobile/android/`. If EAS credentials are not configured, fall back to local gradle build. The APK/AAB must be generated in `mobile/android/app/build/outputs/` or the EAS default output directory.

## Inputs

- `mobile/android/`
- `eas.json`

## Expected Output

- `mobile/android/app/build/outputs/apk/debug/app-debug.apk or similar APK file`
- `or: mobile/android/app/build/outputs/bundle/release/app-release.aab or similar AAB file`

## Verification

ls mobile/android/app/build/outputs/apk/ 2>/dev/null || ls mobile/android/app/build/outputs/bundle/ 2>/dev/null — must contain .apk or .aab file
