# Phase 7: API & Data Persistence - Context

**Gathered:** 2026-02-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Graph data (nodes + edges + metadata) and floor plan images are persisted on the server and served to the student-facing app via REST API. The student app fetches live data from the server on page load — no hardcoded seed data. No authentication required. Admin editing is out of scope (Phase 9+).

</domain>

<decisions>
## Implementation Decisions

### Schema design
- Use relational tables (not a JSON blob column)
- Separate `nodes` and `edges` tables with typed columns
- Server assembles rows into the existing `NavGraph` TypeScript shape before responding
- Column layout for nodes and edges: Claude infers from the existing NavGraph type in `src/shared/types`
- GET /api/map queries both tables and assembles the full graph JSON in server code

### Data seeding
- Claude decides the seeding strategy (likely: auto-seed on startup if tables are empty, reading from existing campus-graph.json)
- Claude decides whether to keep or remove campus-graph.json after migration
- Claude decides idempotency approach (safe to run multiple times without duplicates)

### Client fetch behavior
- Show a loading spinner/indicator on the map area while graph data is fetching
- On error: retry silently 1–2 times, then show a user-visible error message
- Claude decides whether to keep or remove hardcoded client seed data (clean migration preferred)
- Claude decides client-side caching approach (React state only is acceptable)

### SQLite tooling
- Use Drizzle ORM (not raw better-sqlite3)
- Use Drizzle Kit for migrations (tracked in version control, not inline schema creation)
- Claude decides database file location and naming
- Claude decides .gitignore handling for the .db file

### Claude's Discretion
- Exact column definitions for nodes and edges (infer from NavGraph type)
- Database file location (e.g., `data/campus.db` or similar)
- Whether to gitignore the .db file (standard practice: yes)
- Seeding: auto-seed on startup if empty vs. explicit script
- Idempotency approach for seeding
- Whether to keep campus-graph.json after SQLite migration
- Hardcoded client data: remove or keep as dev fallback
- Client-side caching depth (React state is acceptable)

</decisions>

<specifics>
## Specific Ideas

- The server already has working endpoints for /api/floor-plan/image, /api/floor-plan/thumbnail, and /api/map — the /api/map endpoint needs to switch from reading a JSON file to querying SQLite
- The existing NavGraph TypeScript type in shared/types must remain the client contract (no breaking changes)
- Drizzle Kit is preferred because future phases (admin editor, Phase 9+) will need proper migrations

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-api-data-persistence*
*Context gathered: 2026-02-20*
