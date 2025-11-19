# Sprint 7: Orbital Visualization & NASA API Integration

**Mission**: Transform ISO Tracker from static data platform to dynamic tracking system
**Status**: 🔵 READY TO START
**Date**: 2025-11-17
**Estimated Time**: 6-8 hours total

---

## Context: Where We Are

### ✅ Sprint 6 Complete (MVP Live at https://www.isotracker.org)
- Database migrations deployed (013 & 014)
- Community Sentiment visualization working
- Evidence Assessment framework functional
- Authentication and user flows tested
- PWA icons deployed and displaying
- 36 QA tests passed, 0 failures

### ❌ Current Gap: No Orbital Visualization
**The "tracker" in "ISO Tracker" doesn't track yet!**

Users can see:
- ✅ ISO metadata (name, designation, discovery date)
- ✅ Evidence assessments and Community Sentiment
- ✅ NASA Horizons Data section (placeholder)

Users CANNOT see:
- ❌ Orbital trajectories (hyperbolic paths proving interstellar origin)
- ❌ Real ephemeris data from NASA API
- ❌ Position/velocity/observation windows
- ❌ Visual representation of object movement

---

## Sprint 7 Goal

**Add orbital visualization to make ISO Tracker truly track interstellar objects.**

This includes:
1. NASA Horizons API integration for real ephemeris data
2. Ephemeris data table (RA, Dec, distance, magnitude)
3. 2D orbital plot showing hyperbolic trajectories
4. Database caching for performance
5. Mobile-responsive visualization
6. Educational tooltips for non-astronomers

---

## Implementation Plan

### Phase 7.1: NASA Horizons API Integration (2 hours)
**Objective**: Fetch real ephemeris data from JPL Horizons system

**Tasks**:
1. Create API client: `apps/web/lib/nasa/horizons-api.ts`
   - Function: `fetchEphemeris(objectId, startDate, endDate, stepSize?)`
   - Function: `fetchOrbitalElements(objectId)`
   - Error handling with graceful fallback

2. Database migration: `supabase/migrations/015_ephemeris_cache.sql`
   - Table: `ephemeris_cache` with columns for RA, Dec, distance, magnitude, phase angle
   - Index on (iso_object_id, observation_date)
   - Cache TTL: 7 days

3. API route: `apps/web/app/api/iso/[id]/ephemeris/route.ts`
   - Check cache first (7-day TTL)
   - Fetch from NASA if cache miss/stale
   - Store in database
   - Return JSON for visualization

**Success Criteria**:
- [ ] NASA API client fetches data for 1I/'Oumuamua
- [ ] Data cached in database with indexes
- [ ] API route returns ephemeris JSON

---

### Phase 7.2: Ephemeris Data Table (1 hour)
**Objective**: Display observation data in user-friendly table

**Tasks**:
1. Create component: `apps/web/components/visualization/EphemerisTable.tsx`
   - Columns: Date/Time, RA, Dec, Distance (AU), Magnitude, Phase Angle
   - Sortable columns
   - Date range selector (default: ±30 days)
   - Responsive: horizontal scroll on mobile

2. Add educational tooltips:
   - RA/Dec: "Celestial coordinates (like lat/lon in space)"
   - AU: "Astronomical Units (Earth-Sun distance)"
   - Magnitude: "Brightness (lower = brighter)"
   - Phase Angle: "Sun-Object-Earth angle"

3. Integrate into ISO detail page
   - Replace "NASA API Integration Coming Soon" placeholder
   - Add to "NASA Horizons Data" section

**Success Criteria**:
- [ ] Table displays real NASA data
- [ ] Date range changes update data
- [ ] Tooltips explain astronomy terms
- [ ] Mobile-responsive

---

### Phase 7.3: 2D Orbital Visualization (2-3 hours)
**Objective**: Interactive solar system plot showing hyperbolic trajectory

**Technology**: Canvas API for performance + full control

**Tasks**:
1. Create component: `apps/web/components/visualization/OrbitalPlot2D.tsx`
   - Canvas layers: Background grid → Planetary orbits → Object trajectory → Current positions → Labels
   - Sun at center (0,0) in heliocentric view
   - Planets as reference points (Mercury through Jupiter)
   - Object's hyperbolic trajectory (golden curve)
   - Current position (animated pulsing dot)

2. Interactive features:
   - Zoom: Mouse wheel or +/- buttons (0.5x to 5x scale)
   - Pan: Click-drag to move view
   - Hover: Tooltip with date/distance on trajectory
   - Time scrubbing: Slider to show object at any date
   - Reset button to default view

3. Visual design:
   - Background: Cosmic blue (#0A1628)
   - Sun: Yellow (#FFD700)
   - Planets: Gray circles (#9CA3AF)
   - Object trajectory: Golden (#FFB84D, 2px line)
   - Current position: Blue pulsing dot (#2E5BFF)
   - Grid lines: Subtle gray (#374151, opacity 0.2)

4. Responsive design:
   - Desktop: Max 800px width
   - Mobile: Full width with touch controls (pinch zoom, drag pan)

**Success Criteria**:
- [ ] Visualization shows Sun, planets, object trajectory
- [ ] Hyperbolic path clearly visible
- [ ] Interactive controls work smoothly
- [ ] 60 FPS on desktop, 30+ FPS on mobile
- [ ] Touch controls work on iPad/iPhone

---

### Phase 7.4: Data Pipeline & Performance (0.5 hours)
**Objective**: Optimize data loading and caching

**Tasks**:
1. Cache strategy:
   - Check database cache first
   - If cache hit AND < 7 days old: return cached
   - If cache miss OR stale: fetch from NASA
   - Store new data with `cached_at = NOW()`

2. Performance optimizations:
   - Limit ephemeris queries to 90 days max
   - React.memo for visualization component
   - Debounce date range changes (500ms)
   - Lazy load visualization (render when scrolled to)

3. Loading states:
   - Skeleton loader for table
   - Canvas placeholder for visualization
   - Progress bar if NASA API > 2 seconds
   - Error boundary with retry button

**Success Criteria**:
- [ ] First load: < 5 seconds
- [ ] Cached loads: < 1 second
- [ ] No UI blocking during fetch
- [ ] Graceful error handling

---

### Phase 7.5: UI/UX Polish (0.5 hours)
**Objective**: Professional presentation and usability

**Tasks**:
1. Page layout update:
   - Move "NASA Horizons Data" section to top
   - Tab navigation: Overview | Orbital Data | Evidence | Community
   - Visualization as primary content

2. Educational content:
   - Info icon next to "Hyperbolic Trajectory"
   - Tooltip explaining hyperbolic orbit = proof of interstellar origin
   - Link to NASA JPL Horizons documentation
   - "How to read this chart" expandable section

3. Mobile optimization:
   - Test on iPhone Safari and Android Chrome
   - Pinch-zoom works on visualization
   - Table scrolls horizontally without breaking layout
   - Touch-friendly controls (44px minimum tap targets)

4. Accessibility:
   - Alt text for visualization
   - Keyboard navigation for zoom controls
   - ARIA labels for interactive elements
   - Screen reader announcement when loaded
   - High contrast mode support

**Success Criteria**:
- [ ] Visualization visually prominent
- [ ] Non-technical users understand what they're seeing
- [ ] Works smoothly on mobile devices
- [ ] Passes WCAG 2.1 AA standards

---

### Phase 7.6: Testing & QA (1 hour)
**Objective**: Validate all features work correctly

**Tasks**:
1. Manual testing checklist:
   - [ ] 1I/'Oumuamua: Hyperbolic trajectory visible
   - [ ] 2I/Borisov: Data loads correctly
   - [ ] 3I/ATLAS: Future predictions work
   - [ ] Date range change updates table/visualization
   - [ ] Zoom in/out smooth without artifacts
   - [ ] Pan dragging works correctly
   - [ ] Time scrubbing slider updates position
   - [ ] Tooltip shows date/distance on hover
   - [ ] Mobile pinch zoom and drag work
   - [ ] Error handling displays friendly message

2. Performance testing:
   - Measure time to first render: < 3 seconds
   - Cache vs non-cache load time comparison
   - Memory usage < 50MB for visualization
   - Test with Fast 3G network simulation

3. Cross-browser testing:
   - [ ] Chrome (desktop and mobile)
   - [ ] Safari (desktop and iOS)
   - [ ] Firefox (desktop)
   - [ ] Edge (desktop)

**Success Criteria**:
- [ ] Manual QA checklist 100% complete
- [ ] No critical bugs or regressions
- [ ] Performance within targets

---

## Files to Create

**New Files** (7 total):
1. `apps/web/lib/nasa/horizons-api.ts` - NASA API client
2. `apps/web/lib/nasa/coordinates.ts` - Coordinate transformations
3. `apps/web/components/visualization/EphemerisTable.tsx` - Data table
4. `apps/web/components/visualization/OrbitalPlot2D.tsx` - 2D canvas viz
5. `apps/web/app/api/iso/[id]/ephemeris/route.ts` - Ephemeris API
6. `supabase/migrations/015_ephemeris_cache.sql` - Database schema
7. `apps/web/lib/nasa/horizons-api.test.ts` - Unit tests (optional)

**Modified Files** (2 total):
1. `apps/web/app/iso-objects/[id]/page.tsx` - Integrate visualization
2. `apps/web/lib/nasa/horizons.ts` - Update to use real API (already uses real data)

---

## Critical Warnings

### 🚨 Security-First Development (CRITICAL)
Per CLAUDE.md Critical Software Development Principles:
- ✅ **NEVER compromise security for convenience**
- ✅ **Root cause analysis before fixes**
- ✅ **Understand design intent before changing**
- ✅ **Maintain all security requirements**

### 🚨 NASA API Specifics
**Object IDs for Horizons API**:
- 1I/'Oumuamua: COMMAND='A2017 U1' or DES=2017001
- 2I/Borisov: COMMAND='C2019 Q4' or DES=2019002
- 3I/ATLAS: COMMAND='A2025 O1' or DES=2025001

**API Endpoint**:
```
https://ssd.jpl.nasa.gov/api/horizons.api?
  format=text&
  COMMAND='A2017 U1'&
  MAKE_EPHEM='YES'&
  EPHEM_TYPE='OBSERVER'&
  CENTER='500@10'&  (Sun)
  START_TIME='2025-11-01'&
  STOP_TIME='2025-12-01'&
  STEP_SIZE='1d'&
  QUANTITIES='1,9,20,23,24'
```

### 🚨 Database Architecture Rule
Per CLAUDE.md Database Architecture Principles:
- ❌ **NEVER create triggers on `auth.users` table**
- ✅ **Always handle auth-related records in application layer**
- ✅ **User records created in application code, not triggers**

### 🚨 File Persistence Verification
Per CLAUDE.md File Persistence Bug Protocol:
- ⚠️ **NEVER mark task [x] without filesystem verification**
- ⚠️ **After creating files, verify with `ls -lh /path/to/file`**
- ⚠️ **Document verification timestamp in progress.md**

---

## Communication Protocol for Jamie (ADHD-Friendly)

**MANDATORY for all agents working on Sprint 7:**

### Structure Every Response:
1. **Brief Context** (1-2 sentences): What we're doing and why it matters
2. **Exact Instructions**: Start from current state, numbered steps with specific actions
3. **Closure After Each Step**: Ask "Have you completed this step?" and wait for confirmation

### Example of GOOD Communication:
```
**Context**: We're creating the NASA API client. This fetches real orbital data for visualization.

**Where you are now**: You have the project open in your terminal.

**Steps**:
1. Create the file: `touch apps/web/lib/nasa/horizons-api.ts`
2. Open it in your editor
3. Copy the code from the developer's response

**Checkpoint**: Have you created the file? Ready to add the code?
```

### Red Flags (Rewrite if you see these):
- ❌ Starting without stating current location
- ❌ Multiple paragraphs before instructions
- ❌ Assuming steps done without confirmation
- ❌ Technical jargon without plain-language explanation
- ❌ 10+ steps without a check-in point

---

## Next Action

**Delegate to Developer**: Phase 7.1 - NASA Horizons API Integration

**What Developer Needs**:
- Read this handoff-notes.md
- Read agent-context.md
- Follow Critical Software Development Principles
- Create files for Phase 7.1
- Update handoff-notes.md with findings for Phase 7.2

**Success Signal**: Developer reports "Phase 7.1 complete" with verification that files exist and API works.

---

*Last Updated: 2025-11-17 by coordinator*
