# Phase 1: Project Setup & Foundation - Context

**Gathered:** 2025-02-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Scaffold the project, configure tooling, and define core TypeScript types for the graph data model. This phase delivers a working dev environment with the foundational types that every subsequent phase builds on. No user-facing features.

</domain>

<decisions>
## Implementation Decisions

### Project naming
- Project folder and repo name: `campusnav` (lowercase)

### Project structure
- Claude's discretion on monorepo vs single project — choose what fits best for a React frontend + Hono backend with shared types

### Package manager
- Claude's discretion — choose based on what works best with the selected project structure and tooling

### Dev workflow
- Claude's discretion — single command or separate terminals, whichever is more practical

### Claude's Discretion
- Monorepo vs single project structure
- Package manager choice (npm, pnpm, or bun)
- Dev server configuration (single vs multi-terminal)
- Node data shape (fields, types, metadata — informed by research: normalized 0-1 coordinates, node types, accessibility flags)
- Edge data shape (weight, accessible weight, bidirectional — informed by research: dual weights for accessibility routing)
- Coordinate system design (research strongly recommends normalized 0-1 coordinates over pixel coordinates)
- Linting and formatting configuration
- Testing framework choice

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. Research findings (STACK.md, ARCHITECTURE.md, PITFALLS.md) should heavily inform the data model design, particularly:
- Normalized 0-1 coordinates (not pixel coordinates) per PITFALLS.md
- Dual edge weights (standard + accessible) per ARCHITECTURE.md
- Node types distinguishing visible landmarks from hidden navigation nodes per PROJECT.md

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-project-setup-foundation*
*Context gathered: 2025-02-18*
