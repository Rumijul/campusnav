---
gsd_state_version: 1.0
milestone: v1.5
milestone_name: General Support Update
status: complete
stopped_at: "v1.5 milestone archived — all 25 plans complete, 15/15 requirements satisfied, deployed live"
last_updated: "2026-03-08"
last_activity: "2026-03-08 — v1.5 milestone complete: archived to .planning/milestones/, PROJECT.md evolved, ROADMAP.md collapsed, RETROSPECTIVE.md updated, git tag v1.5 created"
progress:
  total_phases: 6
  completed_phases: 6
  total_plans: 25
  completed_plans: 25
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-08 after v1.5 milestone)

**Core value:** Show any student the quickest route from where they are to where they need to be, with wheelchair-accessible alternatives always visible.
**Current focus:** v1.5 archived. Start next milestone with /gsd:new-milestone.

## Current Position

Phase: —
Plan: — (milestone complete — no active phase)
Status: Milestone Complete — all requirements verified, live deployment smoke-tested, milestone archived
Last activity: 2026-03-08 — v1.5 milestone complete and archived. CampusNav live at https://campusnav-hbm3.onrender.com.

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.

Key v1.5 decisions:
- postgres-js over pg/node-postgres — native ESM, Neon serverless compatible
- Two-pass buildGraph — intra-floor pass 1, inter-floor synthesis pass 2 from node metadata
- Zero A* heuristic for cross-floor pairs — admissible; inter-floor edge costs provide signal
- floorNumber=0 sentinel for campus overhead map
- Backblaze B2 over Cloudflare R2 — no credit card, S3-compatible drop-in
- ResizeObserver for canvas dimensions — replaces hardcoded windowHeight−52
- Optimistic state updates for admin floor mutations — no refetch lag

### Pending Todos

None.

### Roadmap Evolution

- Phase 5.1 inserted after Phase 5: Issues needed to be fixed (v1.0)
- Phase 14.1 inserted after Phase 14: node selection fixes and admin room number edit (v1.0)
- Phases 15–20: v1.5 General Support Update (complete)

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-03-08
Stopped at: v1.5 milestone archived
Resume file: None
Next action: /gsd:new-milestone (clear context first with /clear)
