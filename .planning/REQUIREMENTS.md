# Requirements: CampusNav

**Defined:** 2026-03-01
**Core Value:** Show any student the quickest route from where they are to where they need to be, with wheelchair-accessible alternatives always visible.

## v1.5 Requirements

Requirements for the General Support Update milestone. Each maps to roadmap phases 15–20.

### Infrastructure

- [x] **INFR-01**: Application database migrated from SQLite to PostgreSQL for cloud-hosted deployment readiness

### Multi-floor

- [x] **MFLR-01**: Each building floor is a first-class data entity with its own floor plan image reference and node graph
- [x] **MFLR-02**: Floor connector nodes (staircase/elevator/ramp) carry floor-linkage metadata (which floor above/below they connect to)
- [x] **MFLR-03**: Pathfinding engine routes across floors via floor connector nodes, preferring accessible connectors for wheelchair routes
- [x] **MFLR-04**: Admin can add/remove floors per building and upload a distinct floor plan image for each floor
- [x] **MFLR-05**: Student sees per-floor route segments — each segment displayed on that floor's map
- [x] **MFLR-06**: Student can switch between floor tabs to browse any floor's map independently of the active route

### Multi-building / Campus

- [x] **CAMP-01**: Multi-building data model stores buildings as parent entities, each containing one or more floors
- [x] **CAMP-02**: Admin uploads a hand-drawn overhead image as the campus-level outdoor map
- [x] **CAMP-03**: Admin places outdoor path nodes and building entrance markers on the campus map
- [x] **CAMP-04**: Building entrance nodes bridge the outdoor graph to floor 1 of each building, enabling cross-building routes
- [x] **CAMP-05**: Routes crossing buildings display an outdoor campus segment between each building's floor segments

### Deployment

- [x] **DEPL-01**: Frontend deployed to a free always-on CDN (e.g., Netlify or Vercel)
- [x] **DEPL-02**: Backend API deployed to a free always-on hosting service (e.g., Railway or Render)
- [x] **DEPL-03**: Database running on a free cloud PostgreSQL service (e.g., Neon)

## Future Requirements

*No future requirements identified for this milestone — scope is fully committed.*

## Out of Scope

| Feature | Reason |
|---------|--------|
| Multiple campuses | Single campus assumed; multi-campus adds organizational complexity not needed for v1.5 |
| 3D floor visualization | 2D per-floor maps sufficient; 3D adds rendering complexity without wayfinding benefit |
| Automated floor detection | Requires device sensors (BLE/WiFi); manual floor switching covers the use case |
| Real-time graph updates for active sessions | Admin edits take effect on next route computation; edge case not worth the complexity |
| GPS/live location tracking | Requires hardware infrastructure not available; explicitly deferred in v1.0 |
| Student accounts/login | Open access is a feature; FERPA concerns; explicitly deferred in v1.0 |

## Traceability

Which phases cover which requirements.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFR-01 | Phase 15: PostgreSQL Migration | Complete |
| MFLR-01 | Phase 16: Multi-floor Data Model | Complete |
| MFLR-02 | Phase 16: Multi-floor Data Model | Complete |
| CAMP-01 | Phase 16: Multi-floor Data Model | Complete |
| MFLR-03 | Phase 17: Multi-floor Pathfinding Engine | Complete |
| MFLR-04 | Phase 18: Admin Multi-floor Editor | Complete |
| CAMP-02 | Phase 18: Admin Multi-floor Editor | Complete |
| CAMP-03 | Phase 18: Admin Multi-floor Editor | Complete |
| CAMP-04 | Phase 18: Admin Multi-floor Editor | Complete |
| MFLR-05 | Phase 19: Student Floor Tab UI | Complete |
| MFLR-06 | Phase 19: Student Floor Tab UI | Complete |
| CAMP-05 | Phase 19: Student Floor Tab UI | Complete |
| DEPL-01 | Phase 20: Deployment | Complete |
| DEPL-02 | Phase 20: Deployment | Complete |
| DEPL-03 | Phase 20: Deployment | Complete |

**Coverage:**
- v1.5 requirements: 15 total
- Mapped to phases: 15
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-01*
*Last updated: 2026-03-01 after milestone v1.5 initialization*
