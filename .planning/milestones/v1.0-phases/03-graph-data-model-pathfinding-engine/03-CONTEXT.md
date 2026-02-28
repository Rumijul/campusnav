# Phase 3: Graph Data Model & Pathfinding Engine - Context

**Gathered:** 2026-02-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the in-memory graph structure and pathfinding engine with accessibility-aware edge filtering. The engine computes shortest paths and wheelchair-accessible paths on a navigation graph. This phase delivers the computation layer — no UI, no API, no persistence. Route visualization (Phase 6) and data persistence (Phase 7) consume this engine downstream.

</domain>

<decisions>
## Implementation Decisions

### Edge weight meaning
- Weights auto-calculated from Euclidean distance between node coordinates (admin can override)
- Single walking speed constant used to convert distance to time estimates downstream — the weight difference between standard and accessible edges handles routing differences
- Claude's discretion: whether weights represent physical distance or walking time, and how standardWeight/accessibleWeight relate (e.g., Infinity for impassable edges like stairs)

### Test graph design
- Minimal toy graph (5-10 nodes, a few edges) — just enough to verify pathfinding works
- Graph data loaded from JSON files (not hardcoded TypeScript) — aligns with how production works (Phase 7 serves JSON)
- Claude's discretion: test scenario coverage (edge cases like disconnected graphs, same-start-and-end) and JSON format (adjacency list vs node+edge arrays)

### Multi-floor graph modeling
- Single-floor routing only in this phase — multi-floor navigation deferred until multi-floor data exists
- Floor transitions classified as accessible vs not-accessible (two types, not three) — simpler model
- Include a `floor` field on nodes now even though unused — future-proofs for multi-floor extension
- Claude's discretion: whether to use transition nodes or floor properties on edges for cross-floor connections (when eventually needed)

### Path result content
- Claude's discretion: level of detail in path results (node IDs only, nodes + total distance, or full per-edge breakdown)
- Claude's discretion: API shape for computing both standard and accessible routes (single call returning pair, separate calls, or mode parameter)
- Claude's discretion: how "no route found" is communicated (result with reason, null, or error)
- Claude's discretion: pathfinding algorithm choice (Dijkstra's, A*, or other)

### Claude's Discretion
- Edge weight semantics (distance vs time) and dual-weight relationship
- Test scenario coverage and JSON graph format
- Path result detail level and API shape
- Pathfinding algorithm selection
- "No route found" communication pattern
- Multi-floor graph structure (for future use)

</decisions>

<specifics>
## Specific Ideas

- Edge weights should be auto-calculated from Euclidean distance between node coordinates, with admin override capability
- Single walking speed constant for time estimates — keep it simple, don't vary speed by context
- Floor field on nodes from the start, even though this phase is single-floor only
- JSON files for seed data during development, matching the eventual API format from Phase 7

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-graph-data-model-pathfinding-engine*
*Context gathered: 2026-02-18*
