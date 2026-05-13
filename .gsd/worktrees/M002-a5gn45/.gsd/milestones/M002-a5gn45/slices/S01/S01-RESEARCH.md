# S01: Native app runtime + backend graph contract bootstrap — Research

**Date:** 2026-03-26

## Summary

S01 owns the first mobile foundation for **R023** (installable iOS/Android app runtime) and directly supports **R024** (visitor can open app and start routing without sign-in). The current codebase is web-only (Vite + React + Konva), but the backend contract required by mobile already exists and is stable: `GET /api/map` plus floor/campus image endpoints in `src/server/index.ts` provide everything needed for read-only student navigation bootstrapping.

The highest-leverage approach is to add a dedicated `mobile/` Expo app (TypeScript) and keep backend contracts unchanged. Build a thin typed data client (`mobile/data/mapApiClient.ts`) and a domain adapter (`mobile/domain/navGraph.ts`) that preserves existing `NavGraph` invariants (connector links, optional gps bounds, floor metadata), then implement map interaction primitives in `mobile/map/MapViewport.tsx` with React Native gesture primitives instead of trying to port Konva directly.

Skill-informed implementation guidance: apply `react-best-practices` rules `async-parallel` and `js-index-maps` by parallelizing independent fetches and precomputing floor/node maps once per payload; apply Hono skill guidance by keeping fetch-based client contracts for now (Hono RPC type inference would require chained route refactors server-side, out of scope for S01).

## Recommendation

Use **Expo-managed React Native app shell** in `mobile/` with `EXPO_PUBLIC_API_BASE_URL` configuration, and implement three explicit slice outputs first:

1. `mobile/data/mapApiClient.ts` for typed calls to `/api/map`, `/api/floor-plan/:buildingId/:floorNumber`, `/api/campus/image`.
2. `mobile/domain/navGraph.ts` to normalize payload into lookup-friendly structures (`buildingById`, `floorById`, `nodesByFloorId`, optional connector metadata preserved).
3. `mobile/map/MapViewport.tsx` using `react-native-gesture-handler` + reanimated-style transform state for pan/zoom/rotate, keeping normalized coordinate mapping consistent with existing web math.

Why this approach: it isolates mobile runtime risk without destabilizing web/admin code, honors D011 (admin remains web), and creates clean seams for S02/S03 to consume route/session/guidance state.

## Implementation Landscape

### Key Files

- `src/server/index.ts` — source-of-truth read APIs (`/api/map`, `/api/floor-plan/:buildingId/:floorNumber`, `/api/campus/image`) that mobile must consume unchanged.
- `src/shared/types.ts` — canonical `NavGraph`/`NavNode`/`NavFloor` contracts; mobile domain adapter should align to these invariants.
- `src/shared/pathfinding/graph-builder.ts` — documents critical graph semantics (non-accessible `accessibleWeight -> Infinity`, synthesized inter-floor connector edges) that mobile normalization must not break.
- `src/client/hooks/useGraphData.ts` — existing fetch-with-retry pattern worth mirroring in `mapApiClient` (abort + bounded retries).
- `src/client/hooks/useFloorPlanImage.ts` — current image endpoint selection logic (`campus` vs building/floor) to port into mobile image loader.
- `src/client/hooks/useMapViewport.ts` — current gesture math and transform ordering; this is the reference behavior for `mobile/map/MapViewport.tsx`.
- `src/client/hooks/useMapViewport.test.ts` — codified touch invariants (pivot anchoring, angle normalization, thresholding) that should be reused/ported as mobile math tests.
- `src/client/utils/importExport.ts` — contains existing Zod NavGraph validation schema (currently private); candidate extraction point to avoid schema drift between web and mobile.
- `mobile/package.json` (new) — Expo runtime + scripts (`start`, `android`, `ios`, `typecheck`) for installable shell bootstrap.
- `mobile/data/mapApiClient.ts` (new) — typed API contract module required by boundary map.
- `mobile/domain/navGraph.ts` (new) — normalized graph shape + selectors required by boundary map.
- `mobile/map/MapViewport.tsx` (new) — baseline map pan/zoom/rotate primitives required by boundary map.

### Build Order

1. **Bootstrap runtime shell first** (`mobile/` Expo app, app entry, env plumbing) to retire R023 risk early.
2. **Lock contract layer next** (`mapApiClient` + validation) so downstream slices consume stable typed responses.
3. **Build domain normalization** (`navGraph.ts`) before UI composition; this unblocks route/session initialization work in S02.
4. **Implement map primitives** (`MapViewport.tsx`) against local fixture data first, then wire live data/images.
5. **Connect live backend data + floor/campus switching** and confirm no-login launch path (R024 support).

### Verification Approach

- Contract + type safety:
  - `npm run typecheck` (root)
  - `npm --prefix mobile run typecheck` (after mobile scaffold adds script)
- API contract smoke:
  - `npx hono request src/server/index.ts -P /api/map`
  - `npx hono request src/server/index.ts -P /api/campus/image`
- Mobile unit tests (add in slice):
  - `npm --prefix mobile test` for `mapApiClient` retry/error handling and `navGraph` normalization invariants
  - gesture math tests ported from `useMapViewport.test.ts` core helpers
- Runtime smoke:
  - `npm --prefix mobile run start` (Metro boot)
  - `npm --prefix mobile run android` (device/emulator shell launch where available)

## Don't Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| Mobile env API endpoint injection | Expo `EXPO_PUBLIC_*` env variables | Standard Expo path; prevents hardcoded hosts and supports per-profile endpoints. |
| Multi-gesture map interaction composition | `react-native-gesture-handler` simultaneous gesture composition | Native-driven gesture arbitration is more reliable than custom JS touch-state machines. |
| NavGraph payload shape validation | Existing Zod schema pattern already used in `src/client/utils/importExport.ts` | Prevents silent drift between server payload and mobile domain assumptions. |

## Constraints

- Current repo is single-package web/server; `mobile/` is new and must not break existing root build/test scripts.
- Existing web fetches use relative `/api/*`; mobile runtime must use absolute base URL (`EXPO_PUBLIC_API_BASE_URL`) for device access.
- `NavNode` connector fields are optional; normalization must preserve optional semantics under `exactOptionalPropertyTypes`.
- Windows dev environment cannot do native iOS local builds; iOS installability proof should use internal cloud build flow later (S05), while S01 focuses on runtime bootstrap + Android/local shell where possible.

## Common Pitfalls

- **Using relative API URLs in mobile (`/api/map`)** — fails on physical devices; always construct URLs from `EXPO_PUBLIC_API_BASE_URL`.
- **Rewriting graph semantics in mobile adapter** — keep `NavGraph` invariants (connector fields, gps bounds optionality, floor numbering including campus sentinel floor `0`) exactly as server emits.
- **Porting Konva assumptions directly to RN** — Konva stage APIs do not exist on native; port the math, not the component model.
- **Attempting Hono RPC client this slice** — Hono typed client requires chained route declarations; server refactor is out of S01 scope.

## Open Risks

- Final map rendering stack for long-term guidance overlays is still open; S01 should prioritize proving interaction correctness and stable coordinate mapping over visual polish.
- Large floor images may pressure memory/perf on lower-end Android devices; baseline viewport implementation should include image-size-aware defaults.
- Expo/React Native toolchain compatibility with this repo’s Node runtime should be pinned explicitly in mobile docs/scripts to avoid setup drift across contributors.

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| React Native runtime architecture | `vercel-labs/agent-skills@vercel-react-native-skills` | installed |
| Expo native data contracts | `expo/skills@native-data-fetching` | installed |
| React performance and state boundaries | `react-best-practices` | available |
| Hono API contract patterns | `hono` | available |

## Sources

- Expo environment variables for client code (`EXPO_PUBLIC_*`) and fetch endpoint configuration (source: [Expo docs — environment variables](https://docs.expo.dev/guides/environment-variables/))
- Expo internal distribution profile patterns (`distribution: "internal"`, profile split for simulator/device) (source: [Expo docs — EAS build profiles](https://docs.expo.dev/build/eas-json/))
- Gesture composition for simultaneous pan/pinch/rotation using `Gesture.Simultaneous` (source: [React Native Gesture Handler docs — gesture composition](https://docs.swmansion.com/react-native-gesture-handler/docs/fundamentals/gesture-composition/))
- React Native Maps image overlay capability (reviewed as alternative, not primary recommendation for floor-plan-first primitives) (source: [react-native-maps docs](https://github.com/react-native-maps/react-native-maps))
