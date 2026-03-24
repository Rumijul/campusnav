# Decisions

<!-- Append-only register of architectural and pattern decisions -->

| ID | Decision | Rationale | Date |
|----|----------|-----------|------|
| D001 | Use graph-based A* pathfinding (`ngraph.path`) for routing | Deterministic, fast, and easy to verify for indoor map graphs. | 2026-02-19 |
| D002 | Show both standard and accessible routes as first-class outputs | Users can compare route options directly instead of hidden mode toggles. | 2026-02-20 |
| D003 | Keep landmark nodes visible and navigation helper nodes hidden | Preserves map readability while retaining rich routing graph connectivity. | 2026-02-19 |
| D004 | Normalize map coordinates to 0–1 space | Prevents pixel drift across image resolutions and zoom levels. | 2026-02-18 |
| D005 | Mutate Konva Stage directly for viewport interactions | Avoids React re-render bottlenecks and maintains smooth pan/zoom at 60fps. | 2026-02-18 |
| D006 | Replace Vaul bottom sheets with custom CSS sheets | Avoids pointer-event conflicts with Konva (`modal=false` + snap issues). | 2026-02-27 |
| D007 | Build inter-floor connectivity via two-pass graph construction | Keeps floor-local edges clean while synthesizing reliable cross-floor links. | 2026-03-01 |
| D008 | Represent campus map as `floorNumber = 0` sentinel | Cleanly separates campus graph from building floors without nullable floor numbers. | 2026-03-07 |
| D009 | Use Backblaze B2 (S3-compatible) for production image storage | No credit-card blocker, compatible SDK path, low migration complexity. | 2026-03-08 |
| D010 | For touch gestures, use inverse-transform focal mapping + 2° rotation dead zone | Fixes pinch/rotate drift and micro-jitter on rotated canvases. | 2026-03-10 |
| D011 | Determine cross-floor up/down direction from resolved floor numbers and carry `floorId`/`floorNumber` on each direction step | Floor IDs are identifiers, not guaranteed vertical order; floor-aware steps let the directions sheet render stable floor sections without extra lookups. | 2026-03-24 |
| D012 | Group direction UI by contiguous floor runs (not global floor merge) and render floor headers only when more than one section exists | Returning to an earlier floor should create a new section in sequence, and single-floor routes should remain visually flat without redundant headers. | 2026-03-24 |
