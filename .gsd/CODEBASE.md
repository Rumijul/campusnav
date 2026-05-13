# Codebase Map

Generated: 2026-04-13T04:58:15Z | Files: 202 | Described: 0/202
<!-- gsd:codebase-meta {"generatedAt":"2026-04-13T04:58:15Z","fingerprint":"3225b0d7a2342a29402378d08a1828ed55c37cf7","fileCount":202,"truncated":false} -->

### (root)/
- `.env.example`
- `.gitignore`
- `.mcp.json`
- `apk-installed.zip`
- `app-release.apk`
- `app.json`
- `biome.json`
- `convert-import-types.cjs`
- `convert-import-types.sh`
- `docker-compose.yml`
- `drizzle.config.ts`
- `index.html`
- `package-lock.json`
- `package.json`
- `README.md`
- `render.yaml`
- `tsconfig.json`
- `vite.config.ts`

### apk-extract/assets/
- `apk-extract/assets/index.android.bundle`

### docs/plans/
- `docs/plans/2026-04-02-campusnav-visual-redesign-design.md`
- `docs/plans/2026-04-02-campusnav-visual-redesign-plan.md`

### drizzle/
- `drizzle/0000_romantic_abomination.sql`
- `drizzle/0001_multi_floor.sql`
- `drizzle/0002_campus_entrance_bridge.sql`
- `drizzle/0003_floor_gps_bounds.sql`

### drizzle/meta/
- `drizzle/meta/_journal.json`
- `drizzle/meta/0000_snapshot.json`
- `drizzle/meta/0001_snapshot.json`
- `drizzle/meta/0002_snapshot.json`
- `drizzle/meta/0003_snapshot.json`

### mobile/
- `mobile/.env.example`
- `mobile/app.json`
- `mobile/App.tsx`
- `mobile/babel.config.js`
- `mobile/e2e-checklist.md`
- `mobile/eas.json`
- `mobile/metro.config.js`
- `mobile/package-lock.json`
- `mobile/package.json`
- `mobile/tsconfig.json`
- `mobile/vitest.config.ts`
- `mobile/vitest.setup.ts`

### mobile/__mocks__/
- `mobile/__mocks__/react-native-reanimated.ts`
- `mobile/__mocks__/react-native.js`

### mobile/bootstrap/
- `mobile/bootstrap/appBootstrap.test.ts`
- `mobile/bootstrap/appBootstrap.ts`
- `mobile/bootstrap/mapBootstrapState.test.ts`
- `mobile/bootstrap/mapBootstrapState.ts`

### mobile/components/destination/
- `mobile/components/destination/DestinationPicker.test.tsx`
- `mobile/components/destination/DestinationPicker.tsx`

### mobile/components/floor/
- `mobile/components/floor/FloatingFloorSwitcher.tsx`
- `mobile/components/floor/index.ts`

### mobile/components/guidance/
- `mobile/components/guidance/ConfidenceIndicator.test.tsx`
- `mobile/components/guidance/ConfidenceIndicator.tsx`
- `mobile/components/guidance/LiveGuidanceOverlay.test.tsx`
- `mobile/components/guidance/LiveGuidanceOverlay.tsx`

### mobile/components/route/
- `mobile/components/route/DirectionStepCard.tsx`
- `mobile/components/route/index.ts`
- `mobile/components/route/RoutePathOverlay.tsx`
- `mobile/components/route/RoutePreview.tsx`
- `mobile/components/route/RouteSummaryStrip.tsx`
- `mobile/components/route/StartGuidanceButton.tsx`

### mobile/components/search/
- `mobile/components/search/FloatingSearchBar.tsx`
- `mobile/components/search/index.ts`

### mobile/components/settings/
- `mobile/components/settings/AccessibleToggle.tsx`
- `mobile/components/settings/index.ts`

### mobile/components/sheet/
- `mobile/components/sheet/BottomSheet.tsx`
- `mobile/components/sheet/BottomSheetHandle.tsx`
- `mobile/components/sheet/index.ts`

### mobile/dist-android/
- `mobile/dist-android/metadata.json`

### mobile/dist-android/_expo/static/js/android/
- `mobile/dist-android/_expo/static/js/android/AppEntry-1aff647a8665cc61ce93a67482b7680d.hbc`

### mobile/dist-native/
- `mobile/dist-native/metadata.json`

### mobile/dist-native/_expo/static/js/android/
- `mobile/dist-native/_expo/static/js/android/AppEntry-1aff647a8665cc61ce93a67482b7680d.hbc`

### mobile/dist-native2/
- `mobile/dist-native2/metadata.json`

### mobile/dist-native2/_expo/static/js/android/
- `mobile/dist-native2/_expo/static/js/android/AppEntry-7ccdacf0d4f3c8748a4b917c024243ff.hbc`

### mobile/dist-native3/
- `mobile/dist-native3/metadata.json`

### mobile/dist-native3/_expo/static/js/android/
- `mobile/dist-native3/_expo/static/js/android/AppEntry-7ccdacf0d4f3c8748a4b917c024243ff.hbc`

### mobile/dist2/
- `mobile/dist2/metadata.json`

### mobile/dist2/_expo/static/js/android/
- `mobile/dist2/_expo/static/js/android/AppEntry-1aff647a8665cc61ce93a67482b7680d.hbc`

### mobile/dist3/
- `mobile/dist3/metadata.json`

### mobile/dist3/_expo/static/js/android/
- `mobile/dist3/_expo/static/js/android/AppEntry-1aff647a8665cc61ce93a67482b7680d.hbc`

### mobile/domain/
- `mobile/domain/bearing.test.ts`
- `mobile/domain/navGraph.test.ts`
- `mobile/domain/navGraph.ts`
- `mobile/domain/navGraphSchema.ts`

### mobile/hooks/
- `mobile/hooks/findNearestNodeOnFloor.test.ts`
- `mobile/hooks/findNearestNodeOnFloor.ts`
- `mobile/hooks/index.ts`
- `mobile/hooks/useCurrentPosition.test.ts`
- `mobile/hooks/useCurrentPosition.ts`
- `mobile/hooks/useGuidanceSession.test.ts`
- `mobile/hooks/useGuidanceSession.ts`
- `mobile/hooks/useLocationSearch.test.ts`
- `mobile/hooks/useLocationSearch.ts`
- `mobile/hooks/useRouteSelection.test.ts`
- `mobile/hooks/useRouteSelection.ts`

### mobile/map/
- `mobile/map/mapTransform.test.ts`
- `mobile/map/mapTransform.ts`
- `mobile/map/MapViewport.tsx`
- `mobile/map/MapViewportFloor.test.tsx`
- `mobile/map/MapViewportFloor.tsx`

### mobile/routing/
- `mobile/routing/directionSections.test.ts`
- `mobile/routing/directionSections.ts`
- `mobile/routing/generateDirections.test.ts`
- `mobile/routing/generateDirections.ts`
- `mobile/routing/guidanceState.test.ts`
- `mobile/routing/guidanceState.ts`
- `mobile/routing/index.ts`
- `mobile/routing/pathfindingEngine.test.ts`
- `mobile/routing/pathfindingEngine.ts`
- `mobile/routing/routeSessionState.test.ts`
- `mobile/routing/routeSessionState.ts`
- `mobile/routing/useRouteSession.test.ts`
- `mobile/routing/useRouteSession.ts`

### mobile/theme/
- `mobile/theme/colors.ts`
- `mobile/theme/index.ts`
- `mobile/theme/spacing.ts`
- `mobile/theme/typography.ts`

### scripts/
- `scripts/generate-test-images.ts`
- `scripts/hash-password.ts`

### src/client/
- `src/client/App.tsx`
- `src/client/main.tsx`
- `src/client/style.css`

### src/client/components/
- `src/client/components/directionSections.test.ts`
- `src/client/components/directionSections.ts`
- `src/client/components/DirectionsSheet.tsx`
- `src/client/components/FloorPlanCanvas.tsx`
- `src/client/components/FloorPlanImage.tsx`
- `src/client/components/FloorTabStrip.tsx`
- `src/client/components/GpsLocationLayer.test.tsx`
- `src/client/components/GpsLocationLayer.tsx`
- `src/client/components/GridBackground.tsx`
- `src/client/components/LandmarkLayer.tsx`
- `src/client/components/LandmarkMarker.tsx`
- `src/client/components/LandmarkSheet.tsx`
- `src/client/components/LocationDetailSheet.tsx`
- `src/client/components/ProtectedRoute.tsx`
- `src/client/components/RouteLayer.tsx`
- `src/client/components/SearchOverlay.gps.test.tsx`
- `src/client/components/SearchOverlay.tsx`
- `src/client/components/SelectionMarkerLayer.tsx`
- `src/client/components/ZoomControls.tsx`

### src/client/components/admin/
- `src/client/components/admin/connectorLinking.test.ts`
- `src/client/components/admin/connectorLinking.ts`
- `src/client/components/admin/DataTabToolbar.tsx`
- `src/client/components/admin/EdgeDataTable.tsx`
- `src/client/components/admin/EdgeLayer.tsx`
- `src/client/components/admin/EditorSidePanel.connector.test.tsx`
- `src/client/components/admin/EditorSidePanel.tsx`
- `src/client/components/admin/EditorToolbar.tsx`
- `src/client/components/admin/gpsBoundsForm.test.ts`
- `src/client/components/admin/gpsBoundsForm.ts`
- `src/client/components/admin/ManageFloorsModal.gps.test.tsx`
- `src/client/components/admin/ManageFloorsModal.tsx`
- `src/client/components/admin/NodeDataTable.tsx`
- `src/client/components/admin/NodeMarkerLayer.tsx`

### src/client/gps/
- `src/client/gps/studentGpsState.test.ts`
- `src/client/gps/studentGpsState.ts`

### src/client/hooks/
- `src/client/hooks/useAuth.ts`
- `src/client/hooks/useEditorState.ts`
- `src/client/hooks/useFloorFiltering.test.ts`
- `src/client/hooks/useFloorFiltering.ts`
- `src/client/hooks/useFloorPlanImage.ts`
- `src/client/hooks/useGeolocation.test.ts`
- `src/client/hooks/useGeolocation.ts`
- `src/client/hooks/useGraphData.ts`
- `src/client/hooks/useLocationSearch.ts`
- `src/client/hooks/useMapViewport.test.ts`
- `src/client/hooks/useMapViewport.ts`
- `src/client/hooks/useRouteDirections.test.ts`
- `src/client/hooks/useRouteDirections.ts`
- `src/client/hooks/useRouteSelection.ts`
- `src/client/hooks/useViewportSize.ts`

### src/client/pages/
- `src/client/pages/StudentApp.tsx`

### src/client/pages/admin/
- `src/client/pages/admin/AdminShell.tsx`
- `src/client/pages/admin/LoginPage.tsx`
- `src/client/pages/admin/MapEditorCanvas.tsx`

### src/client/utils/
- `src/client/utils/importExport.ts`

### src/server/
- `src/server/connectorLinking.test.ts`
- `src/server/connectorLinking.ts`
- `src/server/floorGpsBounds.test.ts`
- `src/server/floorGpsBounds.ts`
- `src/server/index.ts`
- `src/server/r2.ts`

### src/server/assets/
- `src/server/assets/campus-graph.json`

### src/server/auth/
- `src/server/auth/credentials.ts`
- `src/server/auth/loginLimiter.ts`
- `src/server/auth/routes.ts`

### src/server/db/
- `src/server/db/client.ts`
- `src/server/db/schema.ts`
- `src/server/db/seed.ts`

### src/shared/
- `src/shared/gps.test.ts`
- `src/shared/gps.ts`
- `src/shared/package.json`
- `src/shared/types.ts`

### src/shared/__tests__/
- `src/shared/__tests__/graph-builder.test.ts`
- `src/shared/__tests__/pathfinding.test.ts`

### src/shared/__tests__/fixtures/
- `src/shared/__tests__/fixtures/multi-floor-test-graph.json`
- `src/shared/__tests__/fixtures/test-graph.json`

### src/shared/pathfinding/
- `src/shared/pathfinding/engine.ts`
- `src/shared/pathfinding/graph-builder.ts`
- `src/shared/pathfinding/types.ts`
