# S04: Visitor-first live UX + floor-safe accessible parity — UAT

**Milestone:** M002-a5gn45
**Written:** 2026-03-30T13:37:55.482Z

# S04 UAT: Visitor-first live UX + floor-safe accessible parity

## Preconditions
- Mobile app runs on iOS/Android simulator or device
- Mock navigation graph loaded with 2+ buildings, each with 2+ floors
- Mock GPS position available at known floor coordinates
- App started and map is displayed

## Test Cases

### T01: Heading-Aware Map Rotation

**TC01: Map rotation inactive during idle phase**
1. Open app and verify map loads
2. Verify guidance overlay shows idle/inactive state
3. Attempt to rotate map using device rotation
4. Map should NOT auto-rotate to match device heading
5. Expected: Map retains manual orientation

**TC02: Map rotation activates during active guidance**
1. Select start and destination nodes
2. Start guidance session (phase transitions to 'guiding')
3. Slowly rotate device 90° clockwise
4. Map should rotate to maintain north-up heading relative to device orientation
5. Expected: Map auto-rotates; "up" on device points in direction of travel

**TC03: Heading rotation is cumulative with manual rotation**
1. Manually rotate map 45° using two-finger gesture
2. Start guidance session
3. Rotate device 90° clockwise
4. Expected: Map shows 135° total rotation (45° manual + 90° heading)

**TC04: Heading rotation resets on guidance stop**
1. Start guidance session (heading rotation activates)
2. Stop guidance (return to idle)
3. Verify heading rotation is disabled
4. Expected: Map returns to manual-only rotation mode

### T02: Floor-Aware Guidance State

**TC05: FloorBadge displays current floor**
1. Load map with multi-floor building
2. Start guidance to a destination on Floor 2
3. Verify FloorBadge shows "Floor 2" on Floor 1
4. Expected: Badge visible, correct floor number

**TC06: FloorTransitionBanner appears on floor change**
1. Start guidance through a multi-floor route
2. Walk to trigger floor transition (e.g., use elevator to Floor 2)
3. Observe banner for 2.5 seconds
4. Expected: "Now on Floor 2" banner appears, fades after timeout

**TC07: Floor context in LowConfidenceBanner**
1. Start guidance on Floor 1
2. Trigger low GPS confidence state
3. Verify LowConfidenceBanner includes floor context
4. Expected: Banner mentions current floor number

**TC08: currentFloorId resets on stopGuidance**
1. Start guidance and confirm floor tracking is active
2. Stop guidance session
3. Verify guidance state shows currentFloorId: null
4. Expected: Floor tracking inactive, matches idle semantics

### T03: Accessible Mode Parity

**TC09: Accessible mode toggle in guidance UI**
1. Locate accessible mode toggle in app UI
2. Toggle accessible mode ON
3. Verify toggle state persists visually
4. Expected: Accessible mode state change is reflected in UI

**TC10: Elevator step highlighting in accessible mode**
1. Enable accessible mode
2. Navigate to a route step involving an elevator
3. Verify elevator icon has amber (#facc15) background
4. Expected: Amber highlight visible, not default navy background

**TC11: Ramp step highlighting in accessible mode**
1. Enable accessible mode
2. Navigate to a route step involving a ramp
3. Verify ramp icon has amber (#facc15) background
4. Expected: Amber highlight visible

**TC12: (accessible) suffix in instruction text**
1. Enable accessible mode
2. View guidance step for elevator or ramp
3. Verify instruction text includes "(accessible)" suffix
4. Expected: "Take the elevator (accessible)" not "Take the elevator"

**TC13: Standard mode has no amber highlighting**
1. Disable accessible mode (standard mode)
2. View guidance step for elevator
3. Verify elevator icon uses default navy background
4. Expected: No amber highlighting in standard mode

**TC14: findNearestNodeOnFloor snaps on floor change**
1. Manually change floor via map controls
2. Verify app snaps position to nearest node on new floor
3. Expected: Position confirms to nearest accessible node on floor

### Integration Tests

**TC15: End-to-end: Outdoor to Floor 1 with heading rotation**
1. Start at outdoor position
2. Select destination inside building, Floor 1
3. Walk toward building (heading rotation activates outdoors)
4. Enter building (floor tracking activates)
5. Expected: Smooth transition, heading rotation → floor tracking

**TC16: End-to-end: Floor transition with accessible mode**
1. Enable accessible mode
2. Start multi-floor route with elevator
3. Complete floor transition
4. Verify floor context + accessible highlighting both working
5. Expected: FloorBadge shows current floor, elevator has amber highlight

## Edge Cases

**EC01: Null headingDegrees during idle**
- Verify null (not 0) is passed during idle phase
- Expected: No unexpected map rotation behavior

**EC02: Floor transition while in accessible mode**
- Floor change during accessible mode should maintain accessible highlighting
- Expected: Amber highlighting persists across floor transition

**EC03: Rapid floor changes**
- Rapidly change floors (e.g., up-down-up)
- Banner should show for each genuine change
- Expected: Banner appears for each actual floor ID change

**EC04: Node not found on floor (findNearestNodeOnFloor returns null)**
- Graph has floor with zero nodes
- Attempt floor change to that floor
- Expected: Graceful handling, no crash

## Success Criteria
- [ ] Heading-aware map rotation activates only during active guidance
- [ ] FloorBadge displays correct floor number
- [ ] FloorTransitionBanner appears for 2.5s on floor change
- [ ] Accessible mode shows amber highlighting for elevator/ramp
- [ ] "(accessible)" suffix appears in accessible mode instructions
- [ ] findNearestNodeOnFloor correctly snaps to nearest node on floor change
- [ ] Pre-existing web tests continue to pass
- [ ] All S04-specific tests pass (145 tests)
