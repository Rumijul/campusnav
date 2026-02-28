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

## Cross-Milestone Trends

### Process Evolution

| Milestone | Timeline | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 MVP | 10 days | 16 (+ 2 inserted) | Initial project — all patterns established here |

### Cumulative Quality

| Milestone | Requirements | E2E Flows | Audit Status |
|-----------|-------------|-----------|--------------|
| v1.0 | 25/25 verified | 4/4 complete | tech_debt (no blockers) |

### Top Lessons (Verified Across Milestones)

1. Audit at phase 10 milestone midpoint, not only at the end — catches documentation gaps while they're cheap to fix
2. Proof-of-concept third-party integrations against the real interaction model before committing
