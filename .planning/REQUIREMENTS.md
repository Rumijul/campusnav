# Requirements: CampusNav

**Defined:** 2026-03-09
**Core Value:** Show any student the quickest route from where they are to where they need to be, with wheelchair-accessible alternatives always visible.

## v1.6 Requirements

Requirements for v1.6 GPS Integration & UX Refinements milestone.

### Touch Gestures

- [ ] **TOUCH-01**: User's pinch-to-zoom zooms toward the midpoint of both fingers at all rotation angles (not the stage origin)
- [ ] **TOUCH-02**: User's two-finger rotation pivots around the touch midpoint (not the stage origin)
- [ ] **TOUCH-03**: Two-finger gesture applies a 2-degree rotation threshold to eliminate micro-rotation jitter during pinch-zoom

### Directions

- [ ] **DIR-01**: Multi-floor route directions display a floor-section header between steps on different floors
- [ ] **DIR-02**: Floor-change direction step includes up/down directional language (e.g., "up to Floor 3" or "down to Floor 1")

### Connector Linking

- [ ] **CONN-01**: Admin can link a floor-connector node to the corresponding node on the floor above or below via a dropdown in the editor sidebar (no manual node ID entry required)
- [ ] **CONN-02**: Saving a connector link writes both nodes' connector references atomically in a single server transaction (prevents one-sided links that break routing in one direction)
- [ ] **CONN-03**: Admin can remove a connector link between two nodes

### GPS

- [ ] **GPS-01**: Admin can configure a GPS bounding box (min/max latitude and longitude) per floor and per campus map in the Manage Floors interface
- [ ] **GPS-02**: Admin GPS bounds form validates that minLat < maxLat and minLng < maxLng with inline error messages
- [ ] **GPS-03**: Student sees a "you are here" GPS dot on the map canvas when GPS bounds are configured for the current floor
- [ ] **GPS-04**: GPS dot displays an accuracy ring (uncertainty circle) proportional to the reported accuracy radius
- [ ] **GPS-05**: GPS dot is hidden when reported accuracy exceeds 50 meters
- [ ] **GPS-06**: Student can tap "Use my location" to set their GPS position as the route start point, snapping to the nearest walkable node
- [ ] **GPS-07**: When GPS is unavailable or permission is denied, the app shows a graceful fallback message and manual node selection remains fully functional

## v2 Requirements

Deferred to a future release.

### GPS

- **GPS-V2-01**: GPS bounds configurable via map-click helper overlay in admin (not just text inputs)
- **GPS-V2-02**: GPS floor auto-detection via barometric pressure or GPS altitude
- **GPS-V2-03**: Compass-based map auto-rotation via DeviceOrientationEvent

### Directions

- **DIR-V2-01**: Floor-change direction step names the specific connector landmark (e.g., "Take Staircase A to Floor 2")

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real-time continuous GPS tracking | Indoor accuracy (20–50m+) is insufficient for reliable continuous positioning |
| Compass auto-rotation | iOS permission friction, poor sensor accuracy, disorienting UX |
| GPS floor auto-detection | Requires sensor fusion beyond browser APIs (barometric pressure, altitude) |
| Connector name in directions | Deferred by user — dividers + directional language are sufficient for v1.6 |
| GPS via Leaflet/map-click admin helper | High complexity; bboxfinder.com link + text inputs is sufficient for v1.6 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| TOUCH-01 | Phase 21 | Pending |
| TOUCH-02 | Phase 21 | Pending |
| TOUCH-03 | Phase 21 | Pending |
| DIR-01 | Phase 22 | Pending |
| DIR-02 | Phase 22 | Pending |
| CONN-01 | Phase 23 | Pending |
| CONN-02 | Phase 23 | Pending |
| CONN-03 | Phase 23 | Pending |
| GPS-01 | Phase 24 | Pending |
| GPS-02 | Phase 24 | Pending |
| GPS-03 | Phase 25 | Pending |
| GPS-04 | Phase 25 | Pending |
| GPS-05 | Phase 25 | Pending |
| GPS-06 | Phase 25 | Pending |
| GPS-07 | Phase 25 | Pending |

**Coverage:**
- v1.6 requirements: 15 total
- Mapped to phases: 15 (Phases 21–25)
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-09*
*Last updated: 2026-03-09 — traceability filled after roadmap creation*
