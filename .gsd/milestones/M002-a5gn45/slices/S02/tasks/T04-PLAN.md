---
estimated_steps: 58
estimated_files: 5
skills_used: []
---

# T04: Route preview + floor switching + route path overlay + app wiring

## Task T04 — Route Preview + Floor Switching + Route Path Overlay + App Wiring

### Why
T04 is the final integration wave: it connects the route session (T02) and destination picker (T03) into a composable App, adds a step-by-step route preview, extends MapViewport to switch floor images, renders the route polyline as a View-based overlay, and exposes the accessible mode toggle.

### Files
**Created:**
- `mobile/components/route/RoutePreview.tsx` — Step-by-step directions grouped by floor
- `mobile/components/route/RoutePathOverlay.tsx` — Polyline overlay using View components
- `mobile/map/MapViewportFloor.tsx` — Floor-switching extension of MapViewport
- `mobile/map/MapViewportFloor.test.tsx` — Floor switching and overlay tests

**Modified:**
- `mobile/map/MapViewport.tsx` — Re-exported as-is; floor switching lives in `MapViewportFloor.tsx`
- `mobile/App.tsx` — Composed with DestinationPicker, RoutePreview, MapViewportFloor, accessible mode toggle

### Do
1. **Implement `mobile/components/route/RoutePreview.tsx`**:
   - Props: `{ directions: DirectionsResult; floorMap: Map<number, NavFloor>; onFloorChange: (floorId: number) => void }`
   - Import `groupDirectionSections` from `../../routing/directionSections`
   - Import `DirectionSection`, `DirectionStep` from `../../domain/navGraph`
   - Group steps with `groupDirectionSections(directions.steps)`
   - Render each section with floor header ("Floor 1", "Floor 2") and a `FlatList` of step rows
   - Each step row: icon (rendered as emoji or colored View), instruction text, distance + ETA
   - Accessible mode steps: show elevator/ramp icon distinctly
   - Total summary footer: total distance + estimated walking time
   - Dark theme matching app palette

2. **Implement `mobile/components/route/RoutePathOverlay.tsx`**:
   - Props: `{ path: Array<{x: number; y: number; floorId: number}>; activeFloorId: number; viewport: ViewportDimensions; scale: number; }`
   - Filter `path` to nodes on `activeFloorId`
   - Render a `View` overlay with `Position: 'absolute'` containing two dots per segment:
     - Each dot: `width: 8, height: 8, borderRadius: 4, backgroundColor: '#38bdf8'`
     - Positioned using `{ left: node.x * viewport.width * scale - 4, top: node.y * viewport.height * scale - 4 }`
     - Connect with a `View` line: `width: Math.sqrt(dx²+dy²) * scale, height: 2, backgroundColor: '#38bdf8'`
     - Rotate line to match bearing using transform
   - This is a View-based polyline (Option A from S02 research — no new SVG dependency)
   - If polyline rendering proves too complex for View transforms: just render colored dots at each node position

3. **Implement `mobile/map/MapViewportFloor.tsx`**:
   - Props: `{ imageUri: string; floorTargets: FloorPlanTarget[]; activeFloorTarget: FloorPlanTarget | null; routePath: RoutePathPoint[]; onFloorChange: (target: FloorPlanTarget) => void; onTransformChange: (t: MapTransform) => void }`
   - Composition: `MapViewport` (from existing `MapViewport.tsx`) + floor selector strip + `RoutePathOverlay`
   - Floor selector: horizontal `ScrollView` of floor buttons below the controls row
     - Each button: "Bldg {name} Fl {num}" — active floor button has accent color (#38bdf8 bg)
     - On press: calls `onFloorChange(target)`
   - Pass `routePath` filtered to `activeFloorTarget` into `RoutePathOverlay`
   - The inner `MapViewport` gets the image URI from the active floor target via `getFloorPlanImageUrl` from `mapApiClient`

4. **Modify `mobile/App.tsx`**:
   - Import `RouteSessionProvider` logic (inline in component — no context needed for this scale)
   - Add state: `accessibleMode: boolean`
   - After bootstrap `ready` state:
     - `const selection = useRouteSelection()` from `hooks/useRouteSelection`
     - `const { sessionState, routeMode, setRouteMode } = useRouteSession({ graph: bootstrapState.graph, selection })`
     - Show `DestinationPicker` with `graph` and `selection`
     - Show `MapViewportFloor` with `activeFloorTarget`, `routePath` from session
     - Show `RoutePreview` when `sessionState.phase === 'ready'`
     - Accessible mode toggle: `Pressable` switch updating `accessibleMode` → `setRouteMode`
     - Show `no-route` / `error` state messages inline
   - The existing diagnostic panel (API endpoint, building count) stays as-is

5. **Write `mobile/map/MapViewportFloor.test.tsx`**:
   - Mock `MapViewport`, test floor button rendering and `onFloorChange` callback
   - Test: clicking floor button triggers correct callback

6. **Verify**: `npm --prefix mobile run typecheck` → 0 errors. The full App composition is validated by successful typecheck and existing S01 app-shell tests.

7. **Wire up the floor image URL resolution**: In App.tsx, when `activeFloorTarget` changes, call `mapApiClient.getFloorPlanImageUrl(target)` and update the image URI fed to `MapViewportFloor`. Import `createMapApiClient` from `data/mapApiClient` and `validateApiBaseUrl` from `bootstrap/appBootstrap`.

## Inputs

- `mobile/routing/routeSessionState.ts`
- `mobile/routing/useRouteSession.ts`
- `mobile/components/destination/DestinationPicker.tsx`
- `mobile/routing/directionSections.ts`
- `mobile/map/MapViewport.tsx`
- `mobile/data/mapApiClient.ts`
- `mobile/App.tsx`

## Expected Output

- `mobile/components/route/RoutePreview.tsx`
- `mobile/components/route/RoutePathOverlay.tsx`
- `mobile/map/MapViewportFloor.tsx`
- `mobile/map/MapViewportFloor.test.tsx`
- `mobile/App.tsx (modified)`

## Verification

npm --prefix mobile run typecheck && npm --prefix mobile run test -- mobile/map/MapViewportFloor.test.tsx

## Observability Impact

App-level state (selection, session phase, active floor) is fully observable via React DevTools. Floor image load errors surface through existing bootstrap error state mechanism.
