---
estimated_steps: 1
estimated_files: 3
skills_used: []
---

# T04: Configure Expo build artifacts (app.json, eas.json, .env, prebuild)

Expand app.json with icon, splash, and build configuration. Create eas.json with internal build profiles (dev, preview). Create .env with EXPO_PUBLIC_API_BASE_URL for Android emulator (10.0.2.2:3000) and iOS simulator (localhost:3000). Then run `npx expo prebuild --clean` to generate android/ and ios/ native directories. Verify: ls mobile/android/ && ls mobile/ios/ — both directories must exist after prebuild; eas.json must be valid JSON with `build.profiles` key.

## Inputs

- None specified.

## Expected Output

- `mobile/app.json`
- `mobile/eas.json`
- `mobile/.env`
- `mobile/android/`
- `mobile/ios/`

## Verification

ls mobile/android/ && ls mobile/ios/ — both directories must exist after prebuild; eas.json must be valid JSON
