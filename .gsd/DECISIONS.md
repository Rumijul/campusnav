# Decisions Register

<!-- Append-only. Never edit or remove existing rows.
     To reverse a decision, add a new row that supersedes it.
     Read this file at the start of any planning or research phase. -->

| # | When | Scope | Decision | Choice | Rationale | Revisable? | Made By |
|---|------|-------|----------|--------|-----------|------------|---------|
| D001 | M001/S24 planning | routing-ui | Cross-floor direction semantics and UI floor section contract | Determine up/down transitions from resolved floor numbers (falling back to floorId only when floor metadata is missing) and include floorId/floorNumber on each DirectionStep for section rendering. | Database floor IDs are identifiers, not reliable vertical ordering. Using floor numbers avoids incorrect up/down language, and carrying floor metadata on steps lets the sheet render deterministic floor sections without extra graph lookups. | Yes | agent |
| D002 | M001/S25 planning | integration | Atomic persistence strategy for admin floor-connector linking | Implement a dedicated protected endpoint (`POST /api/admin/connectors/link`) that validates source/target compatibility and writes reciprocal connector fields for both nodes in one DB transaction, including relink/unlink cleanup. | The existing save flow serializes the active floor separately from off-floor data; a dedicated endpoint guarantees bilateral consistency at write time and provides explicit failure diagnostics, preventing one-sided cross-floor links. | Yes | agent |
