# Phase 2: Floor Plan Rendering - Context

**Gathered:** 2026-02-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Interactive 2D floor plan canvas where users can view a floor plan image and navigate it with pan, zoom, and touch gestures. Landmarks, routes, and search are separate phases — this phase delivers the base map viewing experience.

</domain>

<decisions>
## Implementation Decisions

### Zoom & pan behavior
- Moderate zoom max (~3x-4x) — enough to read room labels clearly, not deep architectural zoom
- Zoom toward cursor/finger position (like Google Maps), not viewport center
- Soft bounds on panning — allow some overscroll past floor plan edges, then elastic snap-back
- No special gestures — just pan (drag) and zoom (scroll/pinch). No double-tap, no long-press
- Smooth animated zoom transitions (eased), not instant
- No reset-to-fit button
- On-screen +/- zoom buttons visible (for discoverability, especially on desktop)

### Floor plan image source
- Any test image is fine for development — no need for a real floor plan
- Floor plan image served from the API (not bundled as static asset) — ready for Phase 7 persistence
- Subtle grid pattern as canvas background behind/around the floor plan
- User can rotate the map on mobile (e.g., align with walking direction)

### Initial view & framing
- Re-fit floor plan to new viewport dimensions on device orientation change (portrait ↔ landscape)

### Loading & error states
- Centered spinner while floor plan image loads from server
- Progressive loading — show low-res thumbnail first, swap in full image when ready
- Spinner visible during initial load, thumbnail replaces spinner, then full image replaces thumbnail

### Claude's Discretion
- Image format support (PNG, JPEG, etc.)
- Large image handling strategy
- Fallback image when server is unavailable
- Server endpoint design for floor plan image (dedicated endpoint vs static middleware)
- Initial view framing (fit-to-screen vs fill viewport)
- Aspect ratio handling (preserve vs crop)
- Canvas layout (full viewport with overlays vs header + map)
- Error state design when image fails to load
- Empty state when no floor plan exists
- Pan/zoom behavior during loading
- Min zoom level
- Connection-lost indicator behavior
- Image caching strategy
- Image appearance transition (fade-in vs instant)

</decisions>

<specifics>
## Specific Ideas

- Zoom should feel like Google Maps — zoom into where you're pointing
- Grid background behind the floor plan like a drafting table
- Mobile rotation support — students can rotate the map to match their physical orientation while walking
- Progressive image loading for slow campus WiFi connections

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-floor-plan-rendering*
*Context gathered: 2026-02-18*
