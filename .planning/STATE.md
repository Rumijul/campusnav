---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
last_updated: "2026-03-01T12:41:36.867Z"
progress:
  total_phases: 4
  completed_phases: 3
  total_plans: 11
  completed_plans: 11
---

---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
last_updated: "2026-03-01T12:16:54.889Z"
progress:
  total_phases: 4
  completed_phases: 2
  total_plans: 11
  completed_plans: 8
---

---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
last_updated: "2026-03-01T06:51:46.367Z"
progress:
  total_phases: 3
  completed_phases: 1
  total_plans: 7
  completed_plans: 6
---

---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
last_updated: "2026-03-01T06:44:14.362Z"
progress:
  total_phases: 3
  completed_phases: 1
  total_plans: 7
  completed_plans: 5
---

---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
last_updated: "2026-03-01T06:37:36.287Z"
progress:
  total_phases: 3
  completed_phases: 1
  total_plans: 7
  completed_plans: 4
---

---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
last_updated: "2026-03-01T04:28:11.611Z"
progress:
  total_phases: 2
  completed_phases: 0
  total_plans: 3
  completed_plans: 1
---

---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: MVP
status: complete
last_updated: "2026-02-28T00:00:00.000Z"
progress:
  total_phases: 16
  completed_phases: 16
  total_plans: 48
  completed_plans: 48
---

---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
last_updated: "2026-02-27T23:05:56.016Z"
progress:
  total_phases: 17
  completed_phases: 16
  total_plans: 48
  completed_plans: 48
---

---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
last_updated: "2026-02-27T19:41:15.579Z"
progress:
  total_phases: 17
  completed_phases: 16
  total_plans: 48
  completed_plans: 48
---

---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
last_updated: "2026-02-27T19:39:30.128Z"
progress:
  total_phases: 17
  completed_phases: 15
  total_plans: 48
  completed_plans: 46
---

---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
last_updated: "2026-02-27T13:17:12.192Z"
progress:
  total_phases: 16
  completed_phases: 15
  total_plans: 45
  completed_plans: 45
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-28 after v1.0 milestone)

**Core value:** Show any student the quickest route from where they are to where they need to be, with wheelchair-accessible alternatives always visible.
**Current focus:** v1.0 milestone complete — all 25 requirements shipped, archived to .planning/milestones/. Planning next milestone with /gsd:new-milestone.

## Current Position

Phase: 18-admin-multi-floor-editor
Plan: 01 complete (1/? plans done — Phase 18 In Progress)
Status: In Progress (Plan 02 next)
Last activity: 2026-03-01 — Completed 18-01: Added connectsToBuildingId nullable FK to nodes table (Drizzle schema + migration 0002_campus_entrance_bridge.sql), updated NavNodeData TypeScript interface, wired field through GET /api/map and POST /api/admin/graph. Requirements MFLR-04, CAMP-02, CAMP-03, CAMP-04 satisfied.

## Performance Metrics

**Velocity:**
- Total plans completed: 13
- Average duration: 7 min
- Total execution time: ~1.4 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-project-setup-foundation | 2/2 | 27 min | 13 min |
| 02-floor-plan-rendering | 2/2 | 22 min | 11 min |
| 03-graph-data-model-pathfinding-engine | 2/2 | 8 min | 4 min |
| 04-map-landmarks-location-display | 4/4 | ~11 min | ~3 min |
| 05-search-location-selection | 3/3 | 17 min | 6 min |
| 05.1-issues-needed-to-be-fixed | 2/2 | ~29 min | ~15 min |
| 06-route-visualization-directions | 7/7 | ~29 min | ~4 min |

**Recent Trend:**
- Last 5 plans: 5 min, 3 min, 8 min, 3 min, 3 min, 14 min, 4 min, 5 min
- Trend: stable

*Updated after each plan completion*
| Phase 06-route-visualization-directions P01 | 4 min | 2 tasks | 2 files |
| Phase 06-route-visualization-directions P04 | 2 min | 1 task | 1 file |
| Phase 05.1-issues-needed-to-be-fixed P01 | 4 min | 2 tasks | 4 files |
| Phase 05.1-issues-needed-to-be-fixed P02 | ~25 min | 3 tasks | 3 files |
| Phase 06-route-visualization-directions P06 | 3 min | 5 tasks | 2 files |
| Phase 06-route-visualization-directions P07 | 15 min | 2 tasks | 2 files |
| Phase 07-api-data-persistence P01 | 2 min | 2 tasks | 8 files |
| Phase 07-api-data-persistence P03 | 5 min | 2 tasks | 3 files |
| Phase 07-api-data-persistence P02 | 5 | 2 tasks | 2 files |
| Phase 08-admin-authentication P01 | 5 min | 2 tasks | 7 files |
| Phase 08-admin-authentication P02 | 3 | 2 tasks | 7 files |
| Phase 09-admin-map-editor-visual P01 | 4 | 2 tasks | 2 files |
| Phase 09-admin-map-editor-visual P02 | 3 | 2 tasks | 4 files |
| Phase 09 P03 | 4 | 2 tasks | 3 files |
| Phase 09 P04 | 0 | 1 task (human-verify) | 0 files |
| Phase 10-admin-map-editor-management P01 | 3 | 2 tasks | 3 files |
| Phase 10 P02 | 5 | 2 tasks | 5 files |
| Phase 10 P03 | 0 | 1 task (human-verify) | 0 files |
| Phase 07-api-data-persistence P04 | 0 | 2 tasks | 0 files |
| Phase 11-fix-data-tab P01 | 2 | 1 tasks | 1 files |
| Phase 11-fix-data-tab P02 | 0 | 1 task (human-verify) | 1 files |
| Phase 12-retroactive-verifications P01 | 3 | 2 tasks | 1 files |
| Phase 12-retroactive-verifications P02 | 2 | 2 tasks | 2 files |
| Phase 12-retroactive-verifications P03 | 3 | 2 tasks | 2 files |
| Phase 13-restore-location-detail P01 | 6 | 1 task | 1 file |
| Phase 13 P02 | 5 | 1 tasks | 1 files |
| Phase 13-restore-location-detail P03 | 1 | 0 tasks | 0 files |
| Phase 14-documentation-cleanup P01 | 3 | 2 tasks | 2 files |
| Phase 14.1-node-selection-fixes P02 | 2 | 2 tasks | 2 files |
| Phase 14.1-node-selection-fixes-and-admin-room-number-edit P01 | 2 | 2 tasks | 2 files |
| Phase 14.1-node-selection-fixes-and-admin-room-number-edit P02 | 2 | 2 tasks | 2 files |
| Phase 14.1-node-selection-fixes-and-admin-room-number-edit P03 | 3 | 2 tasks | 2 files |
| Phase 15-postgresql-migration P01 | 3 | 2 tasks | 10 files |
| Phase 15-postgresql-migration P02 | 3 | 2 tasks | 2 files |
| Phase 15-postgresql-migration P03 | 0 | 1 task (human-verify) | 0 files |
| Phase 16-multi-floor-data-model P01 | 2.5 min | 2 tasks | 4 files |
| Phase 16-multi-floor-data-model P02 | 4 min | 2 tasks | 3 files |
| Phase 16-multi-floor-data-model P03 | 5 | 2 tasks | 13 files |
| Phase 16-multi-floor-data-model P04 | 0 | 1 task (human-verify) | 1 file |
| Phase 17-multi-floor-pathfinding-engine P01 | 2 | 3 tasks | 3 files |
| Phase 17-multi-floor-pathfinding-engine P03 | 3 | 1 tasks | 2 files |
| Phase 17-multi-floor-pathfinding-engine P02 | 5 | 2 tasks | 2 files |
| Phase 17-multi-floor-pathfinding-engine P04 | 5 | 1 tasks | 2 files |
| Phase 18-admin-multi-floor-editor P01 | 2 min | 2 tasks | 5 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: 10 phases derived from 25 v1 requirements; comprehensive depth
- [Roadmap]: Phases 2 & 3 can execute in parallel (both depend only on Phase 1)
- [Roadmap]: Student wayfinding (Phases 2-6) before admin tooling (Phases 7-10) per research recommendation
- [Research]: Client-side pathfinding; server is thin CRUD layer only
- [Research]: Normalized 0-1 coordinates to prevent pixel-drift pitfall
- [01-01]: Single-project flat layout (src/client, src/server, src/shared) over monorepo
- [01-01]: npm as package manager — zero setup, universal compatibility
- [01-01]: Biome 2.4 for linting+formatting — single tool replacing ESLint+Prettier
- [01-01]: Dual edge weights (standardWeight + accessibleWeight) for accessibility routing
- [Phase 01-02]: Viewport dimensions tracked via useState + window resize listener so Konva Stage fills screen
- [Phase 01-02]: Biome config uses negated includes (!dist, !node_modules) per v2.2+ syntax to exclude build artifacts
- [02-01]: Sharp + SVG overlay for programmatic test floor plan image generation
- [02-01]: useMemo for fit-to-screen rect to satisfy hooks-at-top-level lint rule
- [02-01]: onImageRectChange callback for FloorPlanImage → FloorPlanCanvas communication
- [02-02]: Direct Konva stage mutation (not React setState) for all viewport interactions — 60fps performance
- [02-02]: Instant wheel zoom (no Tween) to prevent stacked animation jitter; animated Tween for button zoom
- [02-02]: Konva.hitOnDragEnabled = true at module scope for multi-touch pinch during drag
- [02-02]: HTML overlay for ZoomControls — stays fixed outside Konva transform space
- [03-01]: Normalize accessibleWeight to Infinity for non-accessible edges during buildGraph construction
- [03-01]: Use 1e10 as sentinel value in JSON fixtures for non-accessible edge weights
- [03-02]: Pathfinders created once in constructor, reused per query — avoids per-call overhead
- [03-02]: Reverse ngraph.path output for source-first node ordering
  - [03-02]: Frozen NOT_FOUND constant spread for immutable failure responses
  - [04-01]: stairs and ramp moved to 'Invisible to students' in NavNodeType — routing infrastructure only, not student destinations
  - [04-01]: GET /api/map mirrors floor-plan route pattern; Cache-Control max-age=60 for near-real-time admin edits
  - [04-01]: campus-graph.json fixture covers all 9 NavNodeType values for downstream filtering test coverage
- [Phase 04]: LandmarkLayer owns its own Layer — cleaner encapsulation, rendered directly in Stage without wrapper
- [Phase 04]: onScaleChange callback pattern in useMapViewport — thin event bridge to React state preserving 60fps direct Konva mutations
- [Phase 04]: Counter-scaling via Group scaleX/Y=1/stageScale for constant screen-pixel markers during zoom
- [Phase 04-03]: modal=false on Vaul Drawer.Root — keeps Konva map interactive while sheet is peeked; no overlay blocking canvas
- [Phase 04-04]: Human approved all 7 must-have truths — landmark display complete; use-image was pre-existing missing dep fixed with npm install
- [Phase 05-01]: Landmark tap feeds into route selection via setFromTap instead of opening detail sheet — LandmarkSheet removed from render tree
- [Phase 05-01]: A/B pins use counter-scaled Groups matching LandmarkMarker pattern for zoom consistency
- [Phase 05-01]: hiddenNodeIds filtering in LandmarkLayer prevents duplicate markers at selected positions
- [Phase 05-01]: Background tap does NOT clear route selections — only search bar X buttons will clear (Plan 02)
- [Phase 05-02]: setActiveField added to RouteSelection interface — SearchOverlay needs explicit control of which field receives selections
- [Phase 05-02]: Konva.Tween (0.4s, EaseInOut) for auto-pan with 15% bounding-box padding
- [Phase 05-02]: Biome a11y compliance — compact strip uses sibling button elements, no role="button" on divs, no nested buttons
- [Phase 05-02]: routeResult state stored but not consumed — Phase 6 will render route path overlay
- [Phase 05-03]: Human approved all 8 must-have truths — search & location selection complete; no gap closure needed
- [Phase 06-02]: Konva.Animation with dashOffset imperative mutation (not React setState) for 60fps-safe route line animation
- [Phase 06-02]: tension=0 on Konva Line — ensures straight segments through node waypoints, not spline interpolation
- [Phase 06-01]: Screen-space bearing: atan2(dx,-dy) gives clockwise-from-north in canvas coords (y-down)
- [Phase 06-01]: generateDirections exported as pure function for direct unit testing without React wrapper
- [Phase 06-04]: RouteLayer sits inside Stage between FloorPlanImage Layer and LandmarkLayer — canvas-space positioning
- [Phase 06-04]: buildRoutePoints uses useCallback (not useMemo) since it's a function; activeRoutePoints uses useMemo for the computed array
- [Phase 06-04]: Sheet auto-opens at 35% peek on route computed; back arrow closes fully; clearing selections also closes
- [Phase 05.1-02]: Vaul v1.1.2 replaced with custom CSS bottom sheet — modal={false}+snapPoints was fundamentally broken; custom height-transition sheet has zero pointer-event conflicts
- [Phase 05.1-02]: handleSheetBack calls routeSelection.clearAll() — back = exit route mode entirely (SUPERSEDED by 06-06: back now only closes sheet)
- [Phase 05.1-02]: SearchOverlay sheetOpen prop collapses compact strip to pill — prevents screen-space conflict with directions sheet
- [Phase 05.1-02]: Clear (✕) button in compact strip — direct route discard without entering search UI
- [Phase 06-06]: routeVisible state decoupled from sheetOpen — back arrow closes sheet while route line stays visible
- [Phase 06-06]: handleSheetBack calls setSheetOpen(false) not clearAll() — back = hide sheet, X = exit route mode
- [Phase 06-06]: useMapViewport: preventDefault only on touches.length >= 2 to unblock single-finger canvas pan after route
- [Phase 06-07]: onOpenSheet/hasRoute props bridge FloorPlanCanvas sheet state to SearchOverlay tap target — compact strip reopens sheet when route available
- [Phase 06-07]: Canvas legend moved to bottom-left (left-3) to eliminate overlap with ZoomControls at bottom-right
- [Phase 07-01]: DB file at data/campus.db (project root), gitignored via data/ entry
- [Phase 07-01]: Migration-first approach — drizzle-kit generate creates committed SQL files (not push)
- [Phase 07-01]: mkdirSync({ recursive: true }) in client.ts auto-creates data/ on first run
- [Phase 07-01]: 1e10 sentinel for non-accessible edges stored as REAL — never Infinity (JSON.stringify(Infinity) = null)
- [Phase 07-03]: AbortController replaces cancelled boolean — signal threads through retry loop enabling true fetch abort on unmount
- [Phase 07-03]: HTML overlay (not Konva Text) for graph loading/error states — z-10 + pointer-events-none keeps canvas pannable during load
- [Phase 07-03]: Prop-lifting pattern: LandmarkLayer converted to pure display component, nodes passed from FloorPlanCanvas to eliminate duplicate GET /api/map
- [Phase 07-02]: GET /api/map is a plain synchronous handler — better-sqlite3 is synchronous, no async/await needed
- [Phase 07-02]: 1e10 sentinel preserved through full DB round-trip — stored as REAL in SQLite, returned as 10000000000 in JSON (never Infinity)
- [Phase 07-02]: campus-graph.json kept in place as canonical seed source — seeder reads it, does not delete it
- [Phase 08-01]: httpOnly cookie (not Authorization header) for JWT storage — XSS-safe, browser handles automatically
- [Phase 08-01]: PLACEHOLDER_HASH in routes.ts — always run bcrypt.compare() even on email mismatch to prevent timing attacks
- [Phase 08-01]: Import-time throw for missing JWT_SECRET — server cannot function securely without it; graceful warn for missing admin credentials
- [Phase 08-01]: CSRF applied globally (before auth routes) — consistent protection across all state-changing endpoints
- [Phase 08-01]: app.use('/api/admin/*', jwt(...)) pattern — all future admin routes protected automatically without per-route configuration
- [Phase 08-02]: Navigate component (not useNavigate in render) for authenticated-user redirect on LoginPage — correct React Router v6 declarative pattern
- [Phase 08-02]: BrowserRouter inside App.tsx, not main.tsx — StrictMode in main stays unchanged; router is App concern
- [Phase 09-admin-map-editor-visual]: useEditorState undo/redo stored in useRef (not useState) — avoids double renders; lightweight historyInfo useState triggers re-renders only for canUndo/canRedo
- [Phase 09-admin-map-editor-visual]: db.$client accesses underlying better-sqlite3 Database for synchronous .transaction() API — Drizzle's own transaction is async but better-sqlite3 is sync-only
- [Phase 09-02]: NodeMarkerLayer renders its own Konva Layer — clean encapsulation matching student view LandmarkLayer pattern
- [Phase 09-02]: EditorToolbar is absolute-positioned HTML overlay (z-10) above Konva Stage — matches SearchOverlay/ZoomControls pattern; keeps toolbar outside Konva transform space
- [Phase 09-02]: Stage height = viewportHeight - 52px (toolbar offset) — Stage fills remaining viewport below toolbar
- [Phase 09-02]: Blob URL from URL.createObjectURL() used after floor plan upload for instant preview + cache-bust
- [Phase 09-03]: EdgeLayer sits between floor plan Layer and NodeMarkerLayer — edges render under nodes for clean visual hierarchy
- [Phase 09-03]: Rubber-band preview Line has listening=false — prevents interception of click events during edge creation flow
- [Phase 09-03]: exactOptionalPropertyTypes-safe field updates — pass string values directly, never string|undefined for optional NavNode/NavEdge fields
- [Phase 10-01]: DELETE_NODE filters both nodes and edges in a single returned state object — no intermediate state with dangling edges possible
- [Phase 10-01]: isInputFocused guard checks document.activeElement tagName against INPUT/TEXTAREA/SELECT before Delete/Backspace — prevents accidental deletion while typing in side panel fields
- [Phase 10-01]: recordHistory() called after every delete dispatch — all deletions are undoable via Ctrl+Z
- [Phase 10]: hidden-not-unmounted for tab switching — Konva Stage wrapper gets className=hidden to preserve undo history and canvas state during Data tab view
- [Phase 10]: importExport.ts is a single utility module — all six import/export functions centralized with no logic scattered across components
- [Phase 10]: CSV header detection heuristic — firstLine.includes('label') && firstLine.includes('type') distinguishes nodes.csv from edges.csv for single Import CSV button
- [Phase 10-03]: Data tab not visible in UI (potential rendering issue in MapEditorCanvas.tsx) — noted as known issue; phase approved for deployment; deferred to follow-up if needed
- [Phase 07]: No code changes required — Phase 07 implementation passed all 6 must-have truth checks on first human verification
- [Phase 07]: Idempotent seed confirmed: server restart logs 'Already seeded (48 nodes) — skipping', no data duplication
- [Phase 11-fix-data-tab]: min-h-0 added to MapEditorCanvas root div — overrides default min-height:auto on flex items, allowing Data panel flex-1 to receive height from ancestor h-screen in AdminShell
- [Phase 11-fix-data-tab]: EditorToolbar changed from absolute to relative positioning — absolute removed it from flex-col flow, causing tab bar to collapse to Y=0 hidden behind toolbar; both fixes (min-h-0 + relative) required together
- [Phase 12-retroactive-verifications]: ADMN-02 traceability corrected to Phase 7 — Phase 7 is the true implementing phase; Phase 12 only confirmed documentation completeness
- [Phase 12-02]: PLACEHOLDER_HASH in routes.ts is intentional timing-attack prevention, documented as Info-level anti-pattern not a stub
- [Phase 12-02]: ADMN-01 attributed to Phase 8 (not Phase 12) in traceability — Phase 8 was the implementing phase
- [Phase 12-03]: EDIT-05 1e10 sentinel confirmed: EditorSidePanel.tsx line 251 uses accessibleWeight: 1e10, not Infinity
- [Phase 12-03]: 09-VERIFICATION.md format matches 07-VERIFICATION.md exactly: 7 sections, same table columns, same frontmatter structure
- [Phase 13-01]: nodeId derived from node?.id used as useEffect dependency — avoids Biome useExhaustiveDependencies false positive on object references; biome-ignore comment added with rationale
- [Phase 13-01]: LocationDetailSheet PEEK_HEIGHT=180px (DirectionsSheet uses 260px) — detail header is more compact than route summary
- [Phase 13-01]: LocationDetailSheet z-40 (one below DirectionsSheet z-50) — directions sheet renders on top in stacking order
- [Phase 13]: handleLandmarkTap calls both setDetailNode and routeSelection.setFromTap — single tap does double duty (detail view + route A/B assignment)
- [Phase 13-02]: Auto-close useEffect watches [routeSelection.start, routeSelection.destination] — same dep array as clear-route effect; two separate effects for two separate behaviors
- [Phase 13-02]: LocationDetailSheet rendered before DirectionsSheet in JSX — z-40 vs z-50 ensures directions sheet always stacks on top
- [Phase 13-02]: 196px legend bottom offset = PEEK_HEIGHT(180) + 16px gap — matches LocationDetailSheet peek geometry exactly
- [Phase 13-restore-location-detail]: Human-approved: all 7 ROUT-07 browser tests passed — LocationDetailSheet, route selection coexistence, dismissal, and canvas pan all confirmed working
- [Phase 14]: Annotate rather than rewrite 05.1-02-SUMMARY — historical record of what was built must be preserved; only add superseded note
- [Phase 14]: Phase 6 plan count corrected to 7 (06-01 through 06-07) — 06-06 and 06-07 were gap-closure plans not previously listed in ROADMAP
- [Phase 14.1-01]: Conditional spread {...(onClick ? { onClick } : {})} for exactOptionalPropertyTypes-safe optional Konva event prop on FloorPlanImage
- [Phase 14.1-01]: state.selectedNodeId added to handleNodeClick dep array — required to prevent stale closure on toggle comparison
- [Phase 14.1-01]: Mode guard (state.mode === 'select') in FloorPlanImage onClick — prevents interference with add-node placement and add-edge creation
- [Phase 14.1-02]: cancelBubble on pin Group click/tap prevents event bubbling to LandmarkLayer — tap clears pin without re-triggering handleLandmarkTap
- [Phase 14.1-02]: hitFunc PIN_RADIUS * 2.5 expands tap target to 30px vs 12px visual — matches LandmarkMarker pattern for mobile tappability
- [Phase 14.1-02]: onClearStart/onClearDestination as optional props — backward compatible; no additional clearing logic needed (existing useEffect handles teardown)
- [Phase 14.1-03]: exactOptionalPropertyTypes workaround: conditional spread ({} vs { roomNumber: trimmed }) to clear optional fields instead of passing undefined
- [Phase 14.1-03]: SearchOverlay gap-1 + items-center for tighter Room N · type grouping; conditional dot separator renders only when roomNumber present
- [Phase 15-postgresql-migration]: postgres-js chosen (not pg/node-postgres) — native ESM, promise-based, matches Neon serverless connection model
- [Phase 15-postgresql-migration]: db export name unchanged from SQLite version — all downstream imports remain valid without modification
- [Phase 15-postgresql-migration]: Downstream errors (seed.ts, index.ts) deferred to Plan 02 — SQLite sync APIs (.all, .run, .transaction) replaced with async patterns in next plan
- [Phase 15-02]: Top-level await used for migrate/seed startup — valid in ESM (package.json type=module)
- [Phase 15-02]: Dedicated postgres({ max: 1 }) migration client closed after migration — prevents connection pool overhead during startup
- [Phase 15-02]: db.transaction(async tx => {...}) replaces db.$client.transaction() — Drizzle ORM API used instead of raw postgres.js client
- [Phase 15-03]: Human-verified live integration test — all 5 truths confirmed: Docker running, migrate+seed startup, /api/health 200, /api/map seeded data, idempotent restart. INFR-01 satisfied.
- [Phase 15-postgresql-migration]: Phase 15 complete — SQLite (better-sqlite3) fully replaced with PostgreSQL (postgres-js + drizzle-orm); app ready for Neon cloud deployment
- [Phase 16-multi-floor-data-model]: text type for connects_to_node_above/below_id to match nodes.id text PK; text for floors.updated_at to match project ISO 8601 convention; graphMetadata dropped atomically in same migration
- [Phase 16-02]: SeedGraph local type in seed.ts mirrors JSON shape; NavGraph remains the API type with floorId on NavNodeData
- [Phase 16-02]: RETURNING guard uses explicit index access with Error throw (not destructuring) to satisfy TypeScript strict null checks on Drizzle returning()
- [Phase 16-02]: floorId NOT in campus-graph.json nodes; seeder assigns from RETURNING floor.id; onConflictDoNothing not used on buildings/floors inserts
- [Phase 16-03]: flattenNavGraph documented as Phase 17 replacement target — shim keeps engine compiling without cross-floor routing
- [Phase 16-03]: Admin editor flattens NavGraph on load, wraps flat state into single-building NavGraph on save
- [Phase 16-04]: seed.ts must SELECT-before-INSERT for buildings — migration pre-creates "Main Building" (ID 1); unconditional seed insert creates ID 2 with all nodes, leaving buildings[0] empty; fix: query by name and reuse existing ID
- [Phase 17-01]: buildGraph iterates buildings→floors directly (no flattenNavGraph internal call); two-pass: pass 1 nodes+intra-floor edges, pass 2 synthesizes inter-floor links from connectsToNodeAboveId
- [Phase 17-01]: flattenNavGraph export retained for admin editor (MapEditorCanvas.tsx); processed-pair Set prevents duplicate inter-floor links; inter-floor edges synthesized from node data only (no JSON-stored inter-floor edges)
- [Phase 17-03]: Floor-change detection checks curr.floorId !== next.floorId BEFORE bearing calculation; continue skips normal turn step for connector nodes
- [Phase 17-03]: classifyTurn and buildInstruction return types narrowed to exclude floor-change icons for TypeScript strict compliance
- [Phase 17-03]: useRouteDirections hook signature unchanged; Phase 19 will wire real floorMap for per-floor routing
- [Phase 17-02]: Return 0 for cross-floor A* heuristic pairs: Euclidean x,y across floors is inadmissible; 0 keeps heuristic conservative while inter-floor edge costs provide signal
- [Phase 17-02]: Both standardFinder and accessibleFinder heuristics updated with same floor-aware check: a.data.floorId !== b.data.floorId ? 0 : calculateWeight(...)
- [Phase 17-04]: floorMap optional 4th param in useRouteDirections — backward compatible; floorMap useMemo depends on graphState; flattenNavGraph not imported by FloorPlanCanvas
- [Phase 18-01]: connectsToBuildingId nullable (no .notNull()) — only entrance nodes on campus map will have this set; all others leave null
- [Phase 18-01]: Renamed auto-generated migration 0002_melodic_richard_fisk.sql to 0002_campus_entrance_bridge.sql; updated _journal.json tag — Drizzle applies migrations by journal tag, not filename
- [Phase 18-01]: Conditional spread pattern ...(n.connectsToBuildingId != null && { connectsToBuildingId }) matches existing nullable FK field pattern in GET /api/map

### Pending Todos

None yet.

### Roadmap Evolution

- Phase 5.1 inserted after Phase 5: Issues needed to be fixed (URGENT) — COMPLETE
- Phase 14.1 inserted after Phase 14: node selection fixes and admin room number edit (URGENT)

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-03-01
Stopped at: Completed 18-admin-multi-floor-editor 18-01-PLAN.md
Resume file: None
Next action: /gsd:execute-phase 18 plan 02
