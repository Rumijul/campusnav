---
estimated_steps: 1
estimated_files: 2
skills_used: []
---

# T05: Build iOS .app bundle artifact

Build iOS .app bundle from the generated ios/ directory. Run `npx eas build --platform ios --profile preview --non-interactive` or fall back to `xcodebuild -workspace` inside `mobile/ios/`. If Apple Developer credentials are not configured, build for iOS Simulator only. The .app bundle must be generated in `mobile/ios/build/` or the EAS default output directory.

## Inputs

- `mobile/ios/`
- `eas.json`

## Expected Output

- `mobile/ios/build/Products/Applications/*.app — iOS .app bundle`
- `or: EAS output .ipa file`

## Verification

ls mobile/ios/build/ 2>/dev/null | grep -E "\.app$|\.ipa$" — must contain .app or .ipa bundle
