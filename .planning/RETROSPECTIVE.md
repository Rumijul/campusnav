# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

---

## Milestone: v1.0 — MVP

**Shipped:** 2026-02-28
**Phases:** 16 | **Plans:** 48 | **Timeline:** 10 days (2026-02-18 → 2026-02-28)
**Commits:** 183 | **LOC:** ~6,865 TypeScript

### What Was Built

- Interactive 2D floor plan canvas with 60fps pan/zoom/pinch-to-zoom (Konva.js), counter-scaled landmark markers, and mobile touch gesture support
- Dual-mode A* pathfinding engine (standard + wheelchair-accessible routes) using ngraph.path with normalized 0-1 coordinate system, sub-50ms performance for 500-node graphs
- Full student wayfinding UX: autocomplete search, tap-to-select route pins, animated dashed route lines with color coding, step-by-step directions with time estimates, landmark detail sheet (ROUT-07)
- Visual admin map editor: floor plan upload, drag-and-drop node/edge placement, undo/redo (useReducer + useRef history), accessibility marking, OSM-style property editor
- Admin data management: sortable/filterable data tables with inline editing, JSON/CSV import-export, tab-switching with hidden-not-unmounted canvas preservation
- SQLite persistence (Drizzle ORM, better-sqlite3), Hono REST API, idempotent seeder, JWT-secured admin routes (httpOnly cookie, CSRF, rate limiting)
- All 25 v1 requirements verified across 4 complete E2E flows

### What Worked

- **GSD workflow discipline** — clear phase boundaries with PLAN → execute → SUMMARY → VERIFICATION created a reliable delivery cadence. No phase got stuck.
- **Human verification gates** — UAT plans (04-04, 05-03, 06-05, etc.) caught real failures before moving on. This was where the decimal phases (5.1, 14.1) originated — a healthy signal not a failure.
- **TDD for pure algorithms** — Phases 3 and 6 used test-first for pathfinding and direction generation. Both passed first-try human verification without gap closure.
- **Research-first architecture** — front-loading the data model and rendering foundation (Phase 1 normalized coordinates, Phase 3 graph types) prevented rework in later phases. The research recommendation to deliver student UX before admin tooling held up perfectly.
- **Decimal phase insertions** — the 5.1 and 14.1 patterns let urgent fixes be inserted without disrupting the numbered sequence. Clean, traceable.
- **Retroactive verification (Phase 12)** — formally closing documentation gaps for Phases 7, 8, 9 was the right call. It cleared 8 orphaned requirements and surfaced no implementation gaps.

### What Was Inefficient

- **Vaul library integration** — Vaul was installed in Phase 4 and had to be fully replaced in Phase 5.1 when it proved fundamentally broken with Konva event propagation. The library incompatibility wasn't obvious from docs. A lighter proof-of-concept before committing would have saved rework.
- **Data tab visibility bug** — the Tailwind `min-h-0` + absolute positioning issue (Phase 11) wasn't caught in Phase 10's human verification because the Data tab appeared to render but wasn't visually obvious. A more targeted UAT checklist item ("click Data tab and confirm rows are visible") would have caught it.
- **REQUIREMENTS.md stats footer** — the cosmetic "Complete: 24 | Pending (gap closure): 1" footer stayed stale from Phase 12 onward. It caused mild audit confusion. Stats footers should be auto-updated or removed.
- **Phase 13 missing VERIFICATION.md** — ROUT-07 ended the milestone as "partial" in the audit due to a missing formal VERIFICATION.md. Running `/gsd:verify-work 13` immediately after human UAT approval would have closed this cleanly.

### Patterns Established

- **Normalized 0-1 coordinate system** — all floor plan positions stored as fractions of image dimensions; never pixel coordinates. Do not change this.
- **Direct Konva stage mutation for viewport** — pan/zoom updates the stage position/scale directly, never through React state. 60fps requires bypassing reconciler.
- **Counter-scaled Groups for markers** — `scaleX/Y = 1/stageScale` keeps markers at constant screen size. Apply to all canvas-space markers.
- **Custom CSS height-transition sheets** — Vaul is incompatible with Konva pointer events. Use `transform: translateY()` + `transition` pattern instead.
- **httpOnly cookie JWT** — never `Authorization` header for admin sessions. XSS-safe and browser-transparent.
- **Idempotent DB seeder** — server startup checks `SELECT COUNT` before inserting. Required for safe restarts.
- **Hidden-not-unmounted for tab switching** — `className="hidden"` preserves Konva canvas state and undo history across tab switches. `React.lazy` or unmount will lose state.
- **1e10 sentinel for non-accessible edges** — `Infinity` can't round-trip through `JSON.stringify` → SQLite → JSON. Use `1e10`.

### Key Lessons

1. **Audit early, not at the end** — the v1.0 audit revealed 8 orphaned requirements (Phases 7-9 had no VERIFICATION.md). Running an intermediate audit at Phase 10 completion would have closed those gaps incrementally instead of requiring a dedicated retroactive phase.
2. **Proof-of-concept third-party integrations before committing** — Vaul appeared compatible from docs but broke Konva pointer events under the real use case (modal=false + Konva canvas behind sheet). POC the interaction first.
3. **Human UAT checklists need "negative space" items** — Phase 10 UAT didn't explicitly check "Data tab renders visible rows." Add negative-space checks: "click X and confirm Y is visible" not just "X exists."
4. **Decimal phases are healthy, not failures** — 5.1 and 14.1 arose from UAT gaps and user feedback. Treat them as evidence that verification gates are working, not as planning failures.
5. **Keep SUMMARY frontmatter minimal** — the `one_liner` field convention was not established for this project. Future milestones should standardize a `one_liner` in every SUMMARY.md frontmatter for automated extraction.

### Cost Observations

- Model mix: ~80% sonnet, ~20% opus (architect/research phases used opus; execution used sonnet)
- Sessions: ~15-20 sessions estimated across 10 days
- Notable: Yolo mode + comprehensive depth kept gate overhead minimal; most phases executed in 2-7 minutes per plan

---

## Milestone: v1.5 — General Support Update

**Shipped:** 2026-03-08
**Phases:** 6 | **Plans:** 25 | **Timeline:** 8 days (2026-03-01 → 2026-03-08)
**LOC:** ~8,937 TypeScript (up from ~6,865 at v1.0)

### What Was Built

- SQLite → PostgreSQL migration (postgres-js + Drizzle ORM async patterns) — verified against live Docker container, then against Neon cloud DB in production
- Multi-floor data model: buildings/floors as first-class DB entities, per-floor nav graphs, floor-connector node metadata (connectsToNodeAboveId/BelowId) bridging floors
- Cross-floor A* pathfinding: two-pass buildGraph synthesizes inter-floor links from node metadata; zero-heuristic for cross-floor pairs preserves admissibility; wheelchair routes prefer accessible connectors
- Admin multi-floor editor: building selector, sorted floor tabs with auto-save on switch, Manage Floors modal, campus overhead image upload, campus entrance node with amber marker and building link dropdown; ResizeObserver for dynamic canvas sizing
- Student floor tab UI: FloorTabStrip HTML overlay, per-floor route segment filtering, auto-floor-switch on Get Directions, dimmed adjacent-floor elevator markers (TDD RED→GREEN→UAT)
- Production deployment: Render (free tier) + Neon PostgreSQL + Backblaze B2 image storage; all 7 smoke tests passed; live at https://campusnav-hbm3.onrender.com

### What Worked

- **TDD for pure multi-floor logic** — Phase 17 used TDD for cross-floor edge synthesis, A* heuristic, and floor-change direction steps. All three passed UAT without gap closure, same result as v1.0 Phase 3/6 experience. TDD is clearly the right tool for pathfinding-core plans.
- **Phase 19 TDD RED→GREEN** — useFloorFiltering stubs committed in 19-00 before any implementation. Plan 01 turned them green. This made 19-02 and 19-03 straightforward to wire. The pre-stubbed test phase pattern works.
- **Human-verify checkpoints at phase end** — 16-04, 17-04 (implicitly via P04 wiring), 18-06, 19-04, 20-03 all caught real integration issues or confirmed green. Phase 18 verification found two bugs (optimistic update lag, canvas stretching) that saved future debugging.
- **Optimistic state updates over refetch** — Phase 18 verification revealed that `loadNavGraph()` refetch after floor mutations caused visible lag. Replacing with local state patches was 10 lines and eliminated the lag. Refetch-on-mutation is an anti-pattern for low-latency admin UIs.
- **Provider agility** — switching Cloudflare R2 to Backblaze B2 mid-deployment was zero code change (same @aws-sdk/client-s3 client). S3-compatible abstraction paid off immediately.
- **ResizeObserver over hardcoded dimensions** — the Phase 18 canvas stretching bug traced to `windowHeight - 52` hardcoded offset. ResizeObserver fix was correct and durable. Avoid computed dimension hacks.

### What Was Inefficient

- **ROADMAP.md plan-level detail was excessive** — Phase 17 plans still showed individual plan checkboxes as `[ ]` (unchecked) in the archived ROADMAP even though they were complete. Plan-level checkbox tracking in ROADMAP should be abandoned in favor of phase-level only.
- **STATE.md accumulates rather than refreshes** — STATE.md now has 14 YAML frontmatter blocks stacked. It's not a state file anymore; it's a log. Future STATE.md design should use a single overwrite block, not append.
- **No `one_liner` in SUMMARY frontmatter** — this lesson appeared in v1.0 retro and still wasn't applied. The CLI `milestone complete` returned `accomplishments: []` because no one_liner field exists. Establish this convention for v2.0.
- **Missing REQUIREMENTS.md for Phase 20 completion line** — REQUIREMENTS.md was not updated after Phase 20 completed (DEPL-01/02/03 were already checked from v1.5 scope). The file was clean, but the convention of checking off requirements in-milestone as phases complete drifted.

### Patterns Established

- **Two-pass buildGraph** — pass 1 adds nodes and intra-floor edges, pass 2 synthesizes inter-floor links from connectsToNodeAboveId/BelowId. Never store inter-floor edges in DB. Derive from node metadata only.
- **Zero A* heuristic for cross-floor pairs** — returning 0 for cross-floor (a.floorId ≠ b.floorId) keeps the heuristic conservative and admissible. Both finders (standard + accessible) must apply this check.
- **floorNumber=0 sentinel for campus overhead** — distinguishes the campus map from real building floors (1+). Avoids nullable floor number or a separate DB flag.
- **S3-compatible abstraction for image storage** — using @aws-sdk/client-s3 with configurable endpoint allows swapping storage providers without code changes. Confirmed with R2→B2 switch.
- **Pre-stubbed TDD plan (wave-0)** — commit failing stubs in a dedicated plan before implementing. Makes the RED state explicit and the GREEN state a clean commit. Repeat for all algorithmic phases.

### Key Lessons

1. **TDD on algorithmic phases is non-negotiable** — phases 17 and 19 used TDD; both passed human verification on first attempt. Every future pathfinding or data-transformation plan should be TDD.
2. **Establish `one_liner` frontmatter convention now** — the CLI can't extract accomplishments without it. Add it to the SUMMARY.md template before v2.0 starts.
3. **STATE.md should overwrite, not append** — the append pattern creates a 500-line log that's noise for context restoration. A single YAML block that gets overwritten is the right design.
4. **Verify canvas dimension assumptions during Phase 1 of any visual feature** — hardcoded offsets (windowHeight − 52) silently break when layout changes. Use ResizeObserver or CSS flex from the start.
5. **Optimistic UI updates > refetch for admin mutations** — admin operations (floor add/delete) should update local state with server-returned data, not trigger a full graph refetch. Refetch is for initial load only.

### Cost Observations

- Model mix: ~85% sonnet, ~15% haiku (execution used sonnet; research phases used haiku for context gathering)
- Sessions: ~8–10 sessions over 8 days
- Notable: 25 plans at avg ~3–5 min/plan execution time; Phase 20 infrastructure setup was human-action time, not model time

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Timeline | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 MVP | 10 days | 16 (+ 2 inserted) | Initial project — all patterns established here |
| v1.5 General Support Update | 8 days | 6 | Multi-floor architecture; TDD wave-0 pattern introduced; production deployment |

### Cumulative Quality

| Milestone | Requirements | E2E Flows | Audit Status |
|-----------|-------------|-----------|--------------|
| v1.0 | 25/25 verified | 4/4 complete | tech_debt (no blockers) |
| v1.5 | 15/15 verified | 7 smoke tests passed | passed (no audit file — yolo mode) |

### Top Lessons (Verified Across Milestones)

1. **TDD on algorithmic phases** — confirmed across v1.0 (Phases 3, 6) and v1.5 (Phases 17, 19). Always RED→GREEN before wiring UI.
2. Audit at phase midpoint, not only at the end — catches documentation gaps while they're cheap to fix
3. Proof-of-concept third-party integrations against the real interaction model before committing
4. **`one_liner` frontmatter is required** — v1.5 CLI returned `accomplishments: []` without it. Must be added to SUMMARY.md template before v2.0.
