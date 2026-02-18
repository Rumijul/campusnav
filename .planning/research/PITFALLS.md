# Pitfalls Research

**Domain:** Campus wayfinding / indoor navigation web app
**Researched:** 2026-02-18
**Confidence:** HIGH (domain-specific analysis based on graph theory, wayfinding UX research, accessibility standards, and floor plan rendering patterns)

## Critical Pitfalls

### Pitfall 1: Graph Doesn't Match Physical Reality (Pixel-Coordinate Drift)

**What goes wrong:**
The navigation graph nodes are placed on the floor plan image using pixel coordinates, but the floor plan image gets resized, cropped, or replaced over time. When the floor plan image changes dimensions or resolution, every node coordinate becomes wrong — paths float in walls, destinations point to empty space, and the entire graph is silently broken.

**Why it happens:**
Developers anchor nodes to pixel positions (e.g., x:450, y:320) tied to a specific image file. When someone uploads a higher-resolution floor plan, or the image is rendered at a different viewport size, pixel coordinates no longer correspond to physical locations. There's no abstraction layer between "position on image" and "position in building."

**How to avoid:**
Use a **normalized coordinate system** (0.0 to 1.0 for both axes, representing percentage of image width/height) instead of raw pixel coordinates. Store node positions as `{ x: 0.45, y: 0.32 }` meaning "45% from left, 32% from top." Convert to pixels only at render time based on the current image dimensions. This makes the graph resilient to image swaps, resolution changes, and responsive layouts.

**Warning signs:**
- Admin places nodes correctly but they render offset on student-facing view
- Nodes drift when window is resized or on mobile
- After uploading a new floor plan, all paths look wrong
- Hard-coded width/height values in coordinate calculations

**Phase to address:**
Phase 1 (Data model / graph foundation). This is a foundational data representation decision — getting it wrong means rewriting the entire node database and admin editor later.

---

### Pitfall 2: Single Graph Can't Serve Both Standard and Accessible Routes

**What goes wrong:**
The navigation graph is built as one flat graph with uniform edge weights. When it's time to add wheelchair-accessible routing, developers realize that some edges need to be excluded (stairs) and some need different weights (longer ramp paths), but the graph has no mechanism to differentiate. They end up either duplicating the entire graph (maintenance nightmare) or adding complex runtime filtering that introduces subtle bugs (e.g., accessible route still goes through a non-accessible doorway).

**Why it happens:**
Developers think of accessibility as a filter on the same graph, but accessible routing requires fundamentally different edge properties: which edges are traversable, which have different costs, and which intermediate nodes (ramps, elevators) become mandatory waypoints. A naive "just remove stairs" approach misses narrow doorways, heavy doors, steep inclines, and other accessibility barriers that aren't modeled.

**How to avoid:**
Design the graph data model from day one with **edge-level accessibility metadata**:
- Each edge gets an `accessible: boolean` flag (is this edge wheelchair-traversable?)
- Each edge gets separate weight properties: `standardWeight` and `accessibleWeight` (a ramp might be `standardWeight: 30, accessibleWeight: 45` because it's a longer path)
- Each node gets a `type` field that includes accessibility-relevant categories: `"stairs"`, `"ramp"`, `"elevator"`, `"narrow_passage"`
- Run Dijkstra twice with different edge filter + weight selector, not two different graphs

**Warning signs:**
- Edge data only has a single `weight` field
- No way to mark an edge or node as "not wheelchair accessible"
- Accessible route testing is deferred to "later"
- The phrase "we'll add accessibility after the main routing works"

**Phase to address:**
Phase 1 (Data model). The accessibility metadata schema must be in v1 of the edge/node data model. Adding it retroactively means migrating every edge in the graph and re-testing all routes.

---

### Pitfall 3: Admin Graph Editor Produces Disconnected or Unreachable Subgraphs

**What goes wrong:**
The admin builds the navigation graph by placing nodes and connecting edges, but accidentally leaves some nodes unconnected, creates one-way paths, or splits the graph into disconnected islands. Students select a destination that technically exists but is unreachable from their start point. The app either crashes, shows an infinite-distance error, or silently returns no route with no explanation.

**Why it happens:**
Graph editing is inherently error-prone. The admin visually places nodes on a floor plan and draws edges, but there's no validation that:
1. Every destination node is reachable from every other node
2. The graph is fully connected (no orphan islands)
3. Removing a single edge doesn't partition the graph

Dijkstra's algorithm handles unreachable nodes gracefully (returns infinity), but the UI layer often doesn't expect this case.

**How to avoid:**
- **Validate graph connectivity on save**: Run a BFS/DFS from any node and verify all nodes are visited. If not, highlight the disconnected nodes in red in the admin editor.
- **Highlight orphan nodes**: Nodes with zero edges should be visually flagged.
- **Validate accessible subgraph separately**: The subset of edges where `accessible: true` must also form a connected graph for all accessible destinations. An accessible destination reachable only via stairs is a data error, not a pathfinding problem.
- **Handle "no route found" gracefully in UI**: Show "No route available between these points" rather than blank screen or error.

**Warning signs:**
- Admin editor has no "validate graph" button
- No visual distinction between connected and orphan nodes
- No separate validation for the accessible routing subgraph
- Pathfinding returns empty path array with no error handling

**Phase to address:**
Phase 2 (Admin editor) for the validation tools. Phase 3 (Pathfinding) for graceful "no route" handling in the student UI.

---

### Pitfall 4: Floor Plan Image Renders Poorly Across Devices

**What goes wrong:**
The floor plan image looks fine on the developer's desktop monitor but is unusable on mobile phones. Text labels on the floor plan become unreadable. Pan/zoom behavior is janky or non-existent. On low-bandwidth connections the large image takes seconds to load, and on high-DPI screens the image is blurry. The path overlay (SVG/Canvas) doesn't align with the underlying image after zoom/pan transforms.

**Why it happens:**
Floor plan images are typically large (2000-5000px), detailed architectural drawings. Developers test on desktop and assume the floor plan will "just work" at smaller sizes. They underestimate that:
- Mobile users need pinch-to-zoom and pan, which requires a proper pan/zoom library
- Route overlay (drawn on canvas/SVG) must transform in perfect sync with the base image
- A 5MB PNG floor plan image is unacceptable on mobile data

**How to avoid:**
- **Use an established pan-zoom library** (like panzoom, react-zoom-pan-pinch, or Leaflet with a custom image layer) rather than hand-rolling zoom math. These handle touch events, momentum scrolling, zoom limits, and coordinate transforms.
- **Keep the route overlay in the same coordinate space** as the image. If using SVG overlay on top of the image, both must share the same transform. If using Canvas, redraw on every transform. The simplest approach: both image and path are children of the same transformed container element.
- **Optimize the floor plan image**: Serve WebP format, provide multiple resolutions, lazy-load. Consider tiling for very large floor plans (like Leaflet does for maps).
- **Test on mobile from day one**: Use Chrome DevTools device emulation during development, not just before launch.

**Warning signs:**
- Floor plan image file is >1MB
- No pinch-to-zoom or it's custom-built
- Route SVG overlay drifts from the floor plan after zooming
- Floor plan text is unreadable without zooming on mobile
- Developer only tests on desktop

**Phase to address:**
Phase 1 (Floor plan rendering + pan/zoom). This is a presentation foundation — every subsequent feature (node placement, path drawing, interaction) depends on rock-solid image rendering with proper coordinate transforms.

---

### Pitfall 5: Human-Readable Directions Are Nonsensical

**What goes wrong:**
The app shows a correct visual path on the map but generates text directions like "Go to Node 47, then Node 48, then Node 52." Or worse: "Turn left. Go 3.2 units. Turn right." — units that mean nothing to a human. The directions reference internal graph structure rather than landmarks, room numbers, or recognizable features.

**Why it happens:**
Developers focus on the pathfinding algorithm (Dijkstra produces correct shortest paths) and the visual overlay (path renders correctly on the map), but treat text directions as an afterthought. Generating human-readable turn-by-turn directions from a graph path requires:
1. Knowing which direction "left" and "right" are (requires angle calculations between consecutive edges)
2. Knowing landmark names ("pass the cafeteria on your right")
3. Collapsing sequences of straight-line nodes into a single "continue straight for X meters" instruction
4. Converting graph distances to human-understandable units

**How to avoid:**
- **Store human-readable names on key nodes**: Not every node needs a name, but junction nodes, doors, landmarks, and destination nodes must have display-friendly labels. Add a `label` field to nodes (e.g., "Main entrance", "Stairwell B", "Room 204").
- **Categorize nodes by type**: `"hallway"`, `"junction"`, `"door"`, `"room"`, `"landmark"`, `"stairwell"`, `"elevator"`. Direction generation logic uses node types to produce natural language ("Enter through the main doors", "Take the hallway past Room 204").
- **Calculate turn directions**: Use atan2 on consecutive edge vectors to determine if the next segment is a left turn, right turn, or straight continuation. Define thresholds (e.g., <30 degrees = straight, 30-150 = turn, >150 = U-turn).
- **Collapse straight segments**: If three consecutive edges have nearly the same angle, combine them into one "Continue straight" instruction rather than three separate steps.
- **Use real distance estimates**: Map pixel distances to real-world meters using a known scale factor (e.g., admin sets "this hallway is 50 meters" to calibrate).

**Warning signs:**
- Node data has `id` but no `label` or `name` field
- No node `type` classification
- Text directions reference node IDs or internal coordinates
- No distance calibration between pixel units and real-world units
- All nodes generate direction steps (including mid-hallway nodes that should be collapsed)

**Phase to address:**
Phase 1 (Data model) for node labels/types. Phase 3 (Directions generation) for the turn-by-turn algorithm. The data model must support it from the start; the rendering algorithm can come later.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Pixel coordinates instead of normalized | Simpler math, direct image-to-click mapping | Every floor plan change breaks all node positions; responsive layout impossible | Never — normalized coords are equally simple to implement |
| Single weight per edge (no accessible weight) | Simpler data model, fewer fields | Adding accessibility later requires migrating every edge; dual routing is a rewrite | Never — accessibility is a core requirement, not an add-on |
| Storing graph in frontend only (localStorage/JSON file) | No backend needed, fast prototyping | No admin collaboration, no version history, data loss risk, no server-side validation | MVP only, with explicit plan to migrate to backend storage within weeks |
| Hand-rolling pan/zoom | No library dependency | Months of mobile touch event bugs, coordinate drift, edge cases with momentum scrolling | Never — battle-tested libraries exist for this exact problem |
| Hard-coded room/building names | Works for single floor plan | Any campus change (room renumbering, renovation) requires code changes instead of data changes | Never — names must be data, not code |
| Skipping graph validation | Faster admin workflow, no blocking saves | Silent broken routes for students, impossible to debug which edit broke connectivity | Acceptable during initial development only, must add before any real data entry |

## Integration Gotchas

Common mistakes when connecting components in this type of system.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Floor plan image + path overlay | Overlay drawn in screen coordinates, drifts when image pans/zooms | Both must share the same CSS transform parent or canvas context; overlay coordinates are always relative to the image, not the viewport |
| Search/autocomplete + graph nodes | Search returns a room name but has no link to the graph node ID, requiring a fragile name-matching step | Search index should reference graph node IDs directly; each searchable location is a node or has a `nearestNodeId` foreign key |
| Admin editor + student view | Admin saves graph in a different format/coordinate system than student view consumes | Single source of truth: one graph data format, one coordinate system, consumed identically by both editor and viewer |
| Dijkstra output + direction generator | Path is an array of node IDs; direction generator needs geometry (angles, distances) that must be recomputed from the graph | Pathfinding should return enriched path objects: `[{ nodeId, x, y, label, type }]` with precomputed segment angles/distances, not just IDs |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Running Dijkstra on every route request server-side | Slow response times, server CPU spikes | For a single-floor graph (<500 nodes), run Dijkstra client-side in the browser. A campus floor has far too few nodes to need server computation. Ship the graph JSON to the client. | Not a real concern for single-floor (~100-300 nodes), but becomes one at multi-building scale (1000+ nodes) |
| Loading full-resolution floor plan on mobile | 3-5 second load time, high data usage, blank screen while loading | Serve optimized WebP/AVIF, provide srcset for multiple resolutions, show loading skeleton | >500KB image on 3G connection |
| Re-rendering entire path overlay on every frame during pan/zoom | Janky scrolling, dropped frames on mobile | Use CSS transforms for pan/zoom (GPU-accelerated), don't redraw SVG/Canvas on every frame; only redraw on zoom-end for high-quality render | Any mobile device during active pinch-zoom |
| Searching room list with linear scan | Noticeable delay on keypress in search box | Pre-index searchable names with a trie or use a lightweight fuzzy search library (e.g., Fuse.js). For <500 rooms this is premature but still good practice | >200 searchable items with complex fuzzy matching |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Admin editor accessible without authentication | Anyone can modify the navigation graph, redirect routes through dangerous areas, or delete all nodes | Implement admin authentication before the editor is deployed to any accessible URL; even on localhost during dev, add a simple auth gate |
| Floor plan image URL exposes building layout to unauthenticated users | Architectural floor plans may contain security-sensitive information (security office locations, server room locations, emergency exits layout) | Evaluate whether floor plan needs access control; for most campuses this is public info, but check with facilities management. At minimum, don't expose raw architectural drawings — use simplified wayfinding maps instead |
| Graph data API has no rate limiting | Denial of service by repeatedly requesting pathfinding computations | If pathfinding is server-side, add rate limiting. If client-side (recommended for single-floor), this is not an issue since computation happens in user's browser |
| Admin API has no input validation on node coordinates | Malicious admin could inject coordinates that break rendering (NaN, extremely large numbers, negative values) | Validate all node coordinates are within 0.0-1.0 range (normalized), all weights are positive numbers, all node IDs are valid references |

## UX Pitfalls

Common user experience mistakes in campus wayfinding apps.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| "You are here" requires GPS or manual selection from a list of 200 rooms | Users can't set their starting point quickly; they abandon the app | Provide prominent room search with autocomplete AND allow tap-on-map to set start point. Group rooms by area/wing. Show recently selected locations. |
| Accessible route shown separately, requiring extra clicks | Wheelchair users feel like second-class citizens; able-bodied users never see accessible alternatives | Show both routes simultaneously — standard and accessible side by side (as specified in project requirements). This normalizes accessibility. |
| Path shown on map but no text directions | Users must constantly look at phone while walking, can't glance at step-by-step instructions | Always provide both: visual path on map AND numbered text directions. Text directions should be the primary interface while walking. |
| Room search requires exact match ("Room 204" but not "204" or "room204") | Users can't find rooms they know exist | Implement fuzzy search: strip prefixes, normalize case, match partial strings. "204", "Room 204", "room 204", "R204" should all find the same room. |
| No visual confirmation of selected start/end points | User taps on map, path appears, but they're not sure which rooms they selected | Show labeled markers at start (green) and end (red) with room name/number clearly visible. Provide a header like "Room 102 → Library" confirming the route. |
| Floor plan has no "You are zoomed in" context | User zooms into a hallway, loses orientation — which part of the building are they looking at? | Show a mini-map overview in the corner when zoomed in, or highlight the visible area on a small full-building thumbnail. At minimum, show labeled landmarks that anchor orientation. |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Pathfinding works:** But does it handle the case where start == destination? (Should show "You're already here" not an error)
- [ ] **Pathfinding works:** But does it handle when no path exists? (Disconnected graph segments → friendly error, not crash)
- [ ] **Route displays on map:** But does the path avoid going through walls? (Graph edges must follow walkable corridors, not cut diagonally through rooms)
- [ ] **Admin can place nodes:** But can admin delete a node without orphaning edges? (Cascade-delete connected edges, or prevent deletion of connected nodes)
- [ ] **Admin can place nodes:** But is there undo? (Accidental deletion of a node that had 8 edges connected is catastrophic without undo)
- [ ] **Search finds rooms:** But does it find rooms that aren't navigation destinations? (Every searchable room must map to a graph node or nearest-node reference)
- [ ] **Accessible route exists:** But has someone in a wheelchair actually traced the route? (Graph says "accessible" but the physical path may have a 2-inch lip or heavy fire door)
- [ ] **Text directions generated:** But do they make sense when read aloud? (Screen reader users need directions that work as pure text, with no reliance on "see the map")
- [ ] **Works on desktop:** But has it been tested with actual touch events on a real phone? (Chrome DevTools emulation misses many touch interaction bugs)
- [ ] **Graph data can be saved:** But is there a backup/export? (Admin accidentally deletes half the graph — can they restore it?)
- [ ] **Pan/zoom works:** But does tap-to-select-room still work after zooming? (Click/tap coordinates must be transformed through the inverse zoom/pan matrix to find the correct node)

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Pixel coordinates used (no normalization) | MEDIUM | Write a migration script that converts all (x,y) coordinates to (x/imageWidth, y/imageHeight) using the current image dimensions. Update all rendering code to multiply by current dimensions at render time. Must be done before any floor plan image change. |
| Single-weight edges (no accessibility data) | MEDIUM | Add `accessible` boolean and `accessibleWeight` fields to all edges. Default `accessible: true` for hallway edges, `accessible: false` for stairs. Admin must manually review and correct every edge. Time: proportional to number of edges. |
| Disconnected graph in production | LOW | Run BFS connectivity check, identify orphaned node clusters, add missing edges in admin editor. Impact: some routes were silently failing, which users may have noticed and lost trust. |
| Floor plan image swap breaks everything | HIGH if pixel coords / LOW if normalized | If pixel coords: manually reposition every node on the new image. If normalized coords: just swap the image file, all positions auto-adjust. This is why normalized coords are critical. |
| Text directions reference node IDs | MEDIUM | Add `label` and `type` fields to node schema, backfill labels for all named/important nodes. Rewrite direction generator to use labels. Most effort is in the data entry (labeling nodes), not the code. |
| Hand-rolled pan/zoom is buggy on mobile | HIGH | Replace custom implementation with an established library. This means rewriting how the floor plan container works, how overlays attach, and how tap coordinates are resolved. Often a near-complete rewrite of the map view component. |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Pixel-coordinate drift | Phase 1: Data model & floor plan rendering | Verify: resize browser window — do nodes stay in correct positions? Upload a differently-sized image — do coordinates still align? |
| No accessibility metadata on edges | Phase 1: Data model | Verify: edge schema has `accessible`, `standardWeight`, `accessibleWeight` fields. Query: can you filter edges to accessible-only subset? |
| Disconnected graph (no validation) | Phase 2: Admin editor | Verify: create an orphan node, click "validate" — does editor flag it? Delete a bridge edge — does editor warn about graph partition? |
| Floor plan renders poorly on mobile | Phase 1: Floor plan rendering | Verify: open on a real phone — can you pinch-zoom smoothly? Does path overlay stay aligned? Is load time <2 seconds on 4G? |
| Nonsensical text directions | Phase 1: Data model (node labels/types); Phase 3: Direction generation | Verify: read text directions aloud without looking at the map — can you follow them? Do they reference landmarks, not node IDs? |
| Admin produces broken graph | Phase 2: Admin editor validation | Verify: connectivity check runs on save. Orphan nodes highlighted. Accessible subgraph validated separately. |
| No graceful "no route" handling | Phase 3: Pathfinding + student UI | Verify: select two points in disconnected graph regions — does UI show friendly "no route available" message? |
| Search doesn't find rooms | Phase 3: Student-facing search | Verify: search "204" — does it find "Room 204"? Search "libary" (typo) — does fuzzy match suggest "Library"? |
| Tap coordinates wrong after zoom | Phase 1: Floor plan pan/zoom | Verify: zoom in 3x, pan to a room, tap it — does the correct node get selected (not one that's 3x offset)? |
| No admin undo/backup | Phase 2: Admin editor | Verify: delete a node, press undo — does it restore? Export graph, delete everything, import — does it restore? |

## Sources

- Dijkstra's algorithm: Wikipedia, well-established computer science (HIGH confidence)
- Wayfinding UX principles: Wikipedia "Wayfinding" article, referencing Lynch (1960), Passini (1984), Arthur & Passini (1992) — foundational wayfinding research (HIGH confidence)
- WCAG 2.1 accessibility standards: W3C official documentation, updated Feb 2026 (HIGH confidence)
- Indoor positioning challenges: Wikipedia "Indoor positioning system" article (MEDIUM confidence — background context, not directly applied since CampusNav uses no GPS)
- Pan/zoom coordinate transform issues: Based on established web development patterns with CSS transforms and SVG coordinate systems (HIGH confidence — well-known browser behavior)
- Normalized coordinate systems for floor plans: Standard practice in CAD/GIS applications (HIGH confidence)
- Graph connectivity validation: Standard graph theory (BFS/DFS reachability) (HIGH confidence)
- Mobile touch event handling: Established web platform behavior (HIGH confidence)
- Accessible routing as separate edge weights: Standard approach in multi-criteria shortest path problems (HIGH confidence)
- Fuzzy search for room names: Established UX pattern, libraries like Fuse.js (MEDIUM confidence — specific library recommendation from training data)

---
*Pitfalls research for: Campus wayfinding / indoor navigation web app (CampusNav)*
*Researched: 2026-02-18*
