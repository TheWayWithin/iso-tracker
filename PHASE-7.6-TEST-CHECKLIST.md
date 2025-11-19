# Sprint 7 Phase 7.6: Testing & QA Checklist

**Date**: 2025-11-19
**Tester**: Jamie Watters
**Build**: Sprint 7 - Orbital Visualization & NASA API Integration

---

## Manual Testing Checklist

### A. ISO Object Data Loading

#### Test 1: 1I/'Oumuamua
- [ ] Navigate to 1I/'Oumuamua detail page
- [ ] Verify page loads without errors
- [ ] Check "Overview" tab shows orbital visualization
- [ ] Verify hyperbolic trajectory is visible on canvas
- [ ] Confirm object metadata displays correctly (NASA ID, type, discovery date)
- [ ] Switch to "Orbital Data" tab
- [ ] Verify ephemeris table loads with data
- [ ] Check date range is ±30 days from today

**Expected**: Hyperbolic trajectory visible, data from NASA API, object already passed through solar system

#### Test 2: 2I/Borisov
- [ ] Navigate to 2I/Borisov detail page
- [ ] Verify all tabs load without errors
- [ ] Check visualization shows trajectory
- [ ] Verify ephemeris table populates
- [ ] Confirm data is different from 'Oumuamua

**Expected**: Different trajectory, valid data, already passed perihelion (2019-12-08)

#### Test 3: 3I/ATLAS
- [ ] Navigate to 3I/ATLAS detail page (if available in database)
- [ ] Verify future predictions work
- [ ] Check trajectory shows approach to perihelion
- [ ] Confirm dates include future dates (perihelion 2025-10-29)

**Expected**: Upcoming object, future trajectory prediction works

---

### B. Orbital Visualization Interactions

#### Canvas Rendering
- [ ] Canvas displays without errors
- [ ] Sun appears as yellow/gold gradient in center
- [ ] Planetary orbits (gray circles) are visible
- [ ] Object trajectory (orange line) is clearly visible
- [ ] Current position (blue pulsing dot) animates smoothly
- [ ] Grid lines are subtle and helpful
- [ ] Scale indicator shows AU measurement

#### Zoom Controls
- [ ] Click "Zoom In" button → view zooms closer
- [ ] Click "Zoom Out" button → view zooms further
- [ ] Zoom maintains center position
- [ ] No visual artifacts during zoom
- [ ] "Reset View" button returns to default zoom

#### Pan/Drag Functionality
- [ ] Click and drag on canvas → view pans smoothly
- [ ] Cursor changes to indicate draggable area
- [ ] Pan works in all directions
- [ ] Releasing mouse stops panning
- [ ] Mouse leave event stops panning

#### Time Scrubber
- [ ] Slider moves smoothly from left to right
- [ ] Blue position dot updates in real-time as slider moves
- [ ] Date display updates to match slider position
- [ ] Start date label shows correct date (30 days ago)
- [ ] End date label shows correct date (30 days from now)
- [ ] Arrow keys move slider (keyboard navigation)

---

### C. Ephemeris Table Functionality

#### Data Display
- [ ] Table shows columns: Date, RA, Dec, Distance, Mag, Phase
- [ ] All values formatted correctly (decimals, units)
- [ ] Data is readable and aligned properly
- [ ] Column headers have tooltips explaining meaning

#### Sorting
- [ ] Click "Date" header → sorts chronologically
- [ ] Click again → reverses sort order (asc ↔ desc)
- [ ] Click "RA" header → sorts by right ascension
- [ ] Click "Dec" header → sorts by declination
- [ ] Click "Distance" header → sorts by AU
- [ ] Sort arrows (↑↓) indicate current sort direction

#### Pagination
- [ ] Shows "Showing 1 to 10 of X entries"
- [ ] "Previous" button disabled on page 1
- [ ] "Next" button advances to page 2
- [ ] Page number buttons work correctly
- [ ] "Next" button disabled on last page

#### Date Range Selector
- [ ] Change "From" date → table updates with new data
- [ ] Change "To" date → table updates with new range
- [ ] Wider range → more rows appear
- [ ] Narrower range → fewer rows

---

### D. Tab Navigation

#### Tab Switching
- [ ] Click "Overview" tab → shows metadata + visualization
- [ ] Click "Orbital Data" tab → shows ephemeris table
- [ ] Click "Evidence" tab → shows evidence framework (coming soon)
- [ ] Click "Community" tab → shows Community Sentiment
- [ ] Active tab highlighted (blue underline)
- [ ] Tab switches are smooth without page reload

#### Content Display
- [ ] "Overview" tab includes:
  - [ ] Object information card
  - [ ] 2D orbital visualization
  - [ ] "How to read this chart" expandable guide
- [ ] "Orbital Data" tab includes:
  - [ ] Ephemeris table with all features
- [ ] "Evidence" tab includes:
  - [ ] Placeholder with "Coming soon"
  - [ ] Link to evidence page
- [ ] "Community" tab includes:
  - [ ] Community Sentiment component

---

### E. Educational Content & Tooltips

#### Info Icons
- [ ] Hover over "Object Information" ℹ️ → tooltip appears
- [ ] Hover over "Orbital Trajectory" ℹ️ → tooltip appears
- [ ] Hover over "hyperbolic" type → tooltip explains hyperbolic orbits
- [ ] Tooltips display clearly and are readable
- [ ] Tooltips don't block important content

#### "How to Read This Chart" Guide
- [ ] Click to expand → guide appears
- [ ] Explains Sun, planetary orbits, trajectory, current position
- [ ] Explains zoom, pan, time slider controls
- [ ] Includes NASA JPL Horizons attribution link
- [ ] Link opens in new tab

---

### F. Accessibility Features

#### Keyboard Navigation
- [ ] Tab key moves focus to canvas
- [ ] Tab key moves through zoom buttons
- [ ] Tab key reaches time slider
- [ ] Arrow keys work on slider
- [ ] Enter/Space activate buttons
- [ ] Focus indicators are visible

#### Screen Reader Support
- [ ] Canvas has aria-label describing visualization
- [ ] Buttons have descriptive aria-labels
- [ ] Time slider has aria-valuetext with current date
- [ ] Tab panel has aria-current="page" on active tab

#### Touch Targets
- [ ] All buttons are at least 44px tall (mobile-friendly)
- [ ] Buttons have adequate spacing
- [ ] Easy to tap without accidentally hitting adjacent controls

---

### G. Error Handling

#### Network Errors
- [ ] Disable network → reload page
- [ ] Verify error message displays (not just blank screen)
- [ ] Error message explains what happened
- [ ] Error message is styled appropriately (red border/icon)

#### Missing Data
- [ ] If ephemeris data fails to load → table shows error
- [ ] If visualization fails → error boundary catches it
- [ ] Error boundaries show "Try again" button
- [ ] Clicking "Try again" resets error state

---

### H. Performance Testing

#### Load Times
- [ ] Page loads in < 3 seconds on fast connection
- [ ] Visualization renders within 1 second after data loads
- [ ] No visible lag when switching tabs
- [ ] Smooth animations (60fps pulsing effect)

#### Memory Usage
- [ ] Open dev tools → Performance tab
- [ ] Monitor memory during interactions
- [ ] No memory leaks after 5 minutes of use
- [ ] Memory usage remains stable

#### Canvas Performance
- [ ] Zoom in/out is smooth without stuttering
- [ ] Pan/drag is responsive
- [ ] Time scrubber updates without lag
- [ ] Animation frame rate stays above 30fps

---

### I. Cross-Browser Testing

#### Desktop Browsers
- [ ] **Chrome**: All features work
- [ ] **Safari**: All features work
- [ ] **Firefox**: All features work
- [ ] **Edge**: All features work

#### Mobile Browsers
- [ ] **iPhone Safari**: Touch controls work
- [ ] **Android Chrome**: Pinch zoom works
- [ ] Canvas renders correctly on small screens
- [ ] Table scrolls horizontally on narrow screens

---

### J. Integration Tests

#### API Routes
- [ ] Visit `/api/iso/{id}/ephemeris?start_date=2025-11-01&end_date=2025-11-30&step_size=1d`
- [ ] Verify JSON response with valid data structure
- [ ] Check response includes `ephemeris` array
- [ ] Verify data matches expected NASA format

#### Database Cache
- [ ] First load: slow (fetches from NASA)
- [ ] Second load: fast (reads from cache)
- [ ] Cache expires after 7 days
- [ ] Stale cache triggers background refresh

---

## Test Results Summary

**Date Tested**: _____________
**Total Tests**: 100+
**Passed**: ___
**Failed**: ___
**Blocked**: ___

### Critical Issues Found
1.
2.
3.

### Minor Issues Found
1.
2.
3.

### Performance Metrics
- Average page load time: _____
- Average API response time: _____
- Canvas FPS: _____
- Memory usage: _____

---

## Sign-Off

- [ ] All critical features working
- [ ] No blocking bugs
- [ ] Performance acceptable
- [ ] Accessibility validated
- [ ] Ready for deployment

**Tested by**: ________________
**Date**: ________________
**Signature**: ________________
