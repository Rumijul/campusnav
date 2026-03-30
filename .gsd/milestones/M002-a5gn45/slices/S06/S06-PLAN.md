# S06: Physical device E2E verification (R033 closure)

**Goal:** Execute physical device E2E walkthrough to confirm R033 — first-time visitor completes full journey (start→route→off-route deviation→reroute→arrive) on a physical Android device.
**Demo:** After this: Manual device walkthrough confirms end-to-end visitor journey on physical hardware

## Tasks
- [x] **T01: APK installed and verified on Android emulator; full E2E walkthrough blocked by PostgreSQL unavailability preventing backend startup** — Execute S05-UAT TC-3 through TC-10 on physical Android device or emulator. Install APK with `adb install -r mobile/android/app/build/outputs/apk/debug/app-debug.apk`. Start backend with `npm run dev`. Walk through: no-login entry, start/destination selection, route preview, live guidance with confidence dot, heading rotation, floor transitions, off-route deviation + reroute within 5–10 seconds, accessible mode, confidence fallback states, and destination arrival. Record pass/fail per step. Update R033 to validated on completion.
  - Estimate: 30 minutes
  - Files: mobile/e2e-checklist.md, .gsd/REQUIREMENTS.md
  - Verify: adb install succeeds; backend reachable; all 8 walkthrough steps complete with pass/fail recorded
  - Blocker: PostgreSQL not running on port 5432. Docker Desktop Linux engine not available. PostgreSQL 17 installer canceled by user. Backend cannot start without DB. All E2E steps requiring live guidance (TC-6 through TC-10) are hard-blocked without backend.
