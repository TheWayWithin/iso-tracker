# Sprint 7: Orbital Visualization & NASA API Integration

**Mission**: Transform ISO Tracker from static data platform to dynamic tracking system with real-time orbital visualization

**Status**: Ready to start
**Estimated Time**: 6-8 hours
**Approach**: Hybrid (Option C) - 2D visualization + data table, with 3D for future

---

## Context: Why Sprint 7?

**Current State** (After Sprint 6):
- ✅ MVP is **LIVE** at https://www.isotracker.org
- ✅ Core features working: Auth, Evidence Assessment, Community Sentiment
- ✅ Database migrations deployed (PRD-aligned schema)
- ✅ PWA icons installed and displaying
- ✅ 36 QA tests passed, 0 failures

**Critical Gap Identified**:
- ❌ **No orbital visualization** - the "tracker" in "ISO Tracker" doesn't track yet
- ❌ **No NASA API integration** - data is static seed data from database
- ❌ **No ephemeris data** - position, velocity, observation windows
- ❌ Placeholder says "NASA API Integration Coming Soon"

**User Impact**:
Right now, users see ISO metadata (name, designation, date) but cannot:
- Visualize the object's path through space
- See hyperbolic trajectories (proof of interstellar origin)
- Plan observation windows (when visible from Earth)
- Access scientific ephemeris data for analysis

**Sprint 7 Goal**:
Add orbital visualization and NASA Horizons API integration to make ISO Tracker truly track interstellar objects.

---

## Technical Plan

### Phase 7.1: NASA Horizons API Integration (2 hours)

**Objective**: Fetch real ephemeris data from JPL Horizons system

**Tasks**:
1. **Research NASA Horizons API**
   - Endpoint: https://ssd.jpl.nasa.gov/api/horizons.api
   - Query parameters: COMMAND (object ID), START_TIME, STOP_TIME, STEP_SIZE, QUANTITIES
   - For ephemeris: QUANTITIES='1,9,20,23,24' (RA, Dec, distance, magnitude, phase angle)
   - Rate limits: Unknown, implement caching to be safe

2. **Create API Client**
   - **File**: `apps/web/lib/nasa/horizons-api.ts`
   - **Functions**:
     ```typescript
     export async function fetchEphemeris(
       objectId: string,    // e.g., "1I" for 'Oumuamua
       startDate: Date,
       endDate: Date,
       stepSize?: string    // default "1d" (1 day)
     ): Promise<EphemerisData[]>

     export async function fetchOrbitalElements(
       objectId: string
     ): Promise<OrbitalElements>
     ```
   - **Types**: Define EphemerisData and OrbitalElements interfaces
   - **Error Handling**: Graceful fallback if API unavailable

3. **Database Caching**
   - **Migration**: `supabase/migrations/015_ephemeris_cache.sql`
   - **Table Schema**:
     ```sql
     CREATE TABLE ephemeris_cache (
       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
       iso_object_id UUID REFERENCES iso_objects(id) ON DELETE CASCADE,
       observation_date TIMESTAMPTZ NOT NULL,
       ra NUMERIC(10,6),        -- Right Ascension (degrees)
       dec NUMERIC(10,6),       -- Declination (degrees)
       distance_au NUMERIC(10,6), -- Distance from Sun (AU)
       earth_distance_au NUMERIC(10,6), -- Distance from Earth (AU)
       magnitude NUMERIC(5,2),  -- Apparent magnitude
       phase_angle NUMERIC(6,2), -- Sun-Object-Earth angle
       cached_at TIMESTAMPTZ DEFAULT NOW(),
       UNIQUE(iso_object_id, observation_date)
     );
     CREATE INDEX idx_ephemeris_iso_date ON ephemeris_cache(iso_object_id, observation_date);
     ```

4. **API Routes**
   - **File**: `apps/web/app/api/iso/[id]/ephemeris/route.ts`
   - **Logic**:
     ```typescript
     // GET /api/iso/[id]/ephemeris?start=2025-11-01&end=2025-12-01
     // 1. Check cache for date range
     // 2. If cache miss or stale (>7 days), fetch from NASA
     // 3. Store in database
     // 4. Return JSON
     ```
   - **Response Format**:
     ```json
     {
       "iso_object_id": "uuid",
       "date_range": { "start": "2025-11-01", "end": "2025-12-01" },
       "data": [
         {
           "date": "2025-11-01T00:00:00Z",
           "ra": 123.456,
           "dec": -12.345,
           "distance_au": 25.5,
           "earth_distance_au": 24.8,
           "magnitude": 22.5,
           "phase_angle": 45.2
         }
       ],
       "cached": true
     }
     ```

**Success Criteria**:
- [ ] NASA API client successfully fetches data for 1I/'Oumuamua
- [ ] Data cached in database with proper indexes
- [ ] API route returns ephemeris JSON for visualization

---

### Phase 7.2: Ephemeris Data Table (1 hour)

**Objective**: Display observation data in user-friendly table

**Tasks**:
1. **Create Component**
   - **File**: `apps/web/components/visualization/EphemerisTable.tsx`
   - **Props**:
     ```typescript
     interface EphemerisTableProps {
       isoId: string
       initialDateRange?: { start: Date, end: Date }
     }
     ```

2. **Table Features**:
   - Columns: Date/Time, RA (hh:mm:ss), Dec (dd:mm:ss), Distance (AU), Magnitude, Phase Angle
   - Sortable columns (click header to sort)
   - Date range selector (default: ±30 days from today)
   - Responsive: horizontal scroll on mobile
   - Loading skeleton while fetching
   - Empty state: "No ephemeris data available for this date range"

3. **Educational Tooltips**:
   - RA/Dec: "Celestial coordinates (like latitude/longitude in space)"
   - AU: "Astronomical Units (1 AU = distance from Earth to Sun)"
   - Magnitude: "Brightness (lower number = brighter, each -1 = 2.5x brighter)"
   - Phase Angle: "Sun-Object-Earth angle (affects brightness)"

4. **Integration**:
   - Add to ISO detail page: `apps/web/app/iso-objects/[id]/page.tsx`
   - Place in "NASA Horizons Data" section (replace "Coming Soon" placeholder)

**Success Criteria**:
- [ ] Table displays real NASA data with proper formatting
- [ ] Users can change date range and see updated data
- [ ] Tooltips help non-astronomers understand terms
- [ ] Mobile-responsive with horizontal scroll

---

### Phase 7.3: 2D Orbital Visualization (2-3 hours)

**Objective**: Interactive solar system plot showing hyperbolic trajectory

**Technology Decision**:
- **Option A**: D3.js (powerful, flexible, steeper learning curve)
- **Option B**: Canvas API (performant, lower-level control)
- **Option C**: React-based charting (Recharts, Victory) - simpler but less control
- **Recommended**: Canvas API for performance + full control

**Tasks**:
1. **Create Component**
   - **File**: `apps/web/components/visualization/OrbitalPlot2D.tsx`
   - **Props**:
     ```typescript
     interface OrbitalPlot2DProps {
       isoId: string
       currentDate?: Date
       viewMode: 'heliocentric' | 'geocentric'
     }
     ```

2. **Coordinate System**:
   - **Heliocentric**: Sun at center (0,0), planets orbit in circles/ellipses
   - **Geocentric**: Earth at center, show object's apparent motion in sky
   - Start with heliocentric (more intuitive for interstellar objects)

3. **Visual Elements**:
   ```typescript
   // Canvas layers (bottom to top):
   // 1. Background grid (10 AU spacing)
   // 2. Planetary orbits (Mercury, Venus, Earth, Mars, Jupiter as reference)
   // 3. Object's hyperbolic trajectory (golden/yellow curve)
   // 4. Current positions (animated dots)
   // 5. Labels and annotations
   ```

4. **Interactive Features**:
   - **Zoom**: Mouse wheel or +/- buttons (scale: 0.5x to 5x)
   - **Pan**: Click-drag to move view
   - **Hover**: Show tooltip with date, distance when hovering over trajectory
   - **Time Scrubbing**: Slider to show object position at any date
   - **Reset**: Button to reset zoom/pan to default view

5. **Visual Design**:
   - **Background**: Dark cosmic blue (#0A1628) matching brand
   - **Sun**: Yellow circle at center (#FFD700)
   - **Planets**: Small gray circles (#9CA3AF)
   - **Planetary Orbits**: Thin gray dotted lines (#6B7280, opacity 0.3)
   - **Object Trajectory**: Thick golden line (#FFB84D, 2px)
   - **Current Position**: Blue animated pulsing dot (#2E5BFF)
   - **Grid Lines**: Subtle gray (#374151, opacity 0.2)
   - **Labels**: White text (#F5F7FA)

6. **Responsive Design**:
   - Desktop: Full width of container (max 800px)
   - Tablet: Scale proportionally
   - Mobile: Full width with touch controls (pinch zoom, drag pan)

7. **Data Transformation**:
   ```typescript
   // Convert NASA ephemeris data to canvas coordinates
   function ephemerisToCanvasCoords(
     ephemeris: EphemerisData,
     viewMode: 'heliocentric' | 'geocentric'
   ): { x: number, y: number }

   // Calculate hyperbolic trajectory from orbital elements
   function calculateTrajectory(
     orbitalElements: OrbitalElements,
     dateRange: { start: Date, end: Date }
   ): Point2D[]
   ```

**Success Criteria**:
- [ ] Visualization shows Sun, planets, and object trajectory
- [ ] Hyperbolic path is clearly visible (proof of interstellar origin)
- [ ] Interactive controls (zoom, pan, time scrub) work smoothly
- [ ] Performance: 60 FPS on desktop, 30+ FPS on mobile
- [ ] Touch controls work on iPad/iPhone

---

### Phase 7.4: Data Pipeline & Performance (0.5 hours)

**Objective**: Optimize data loading and caching

**Tasks**:
1. **Cache Strategy**:
   - Check database cache first (SELECT with date range)
   - If cache hit AND < 7 days old: return cached data
   - If cache miss OR stale: fetch from NASA API
   - Store new data with `cached_at = NOW()`
   - Implement cache warming for popular date ranges

2. **Database Migration**:
   - Run migration 015 on production Supabase
   - Verify indexes created correctly
   - Test cache hit/miss with sample queries

3. **Performance Optimizations**:
   - Limit ephemeris queries to 90 days max (prevent huge datasets)
   - Compress API responses with gzip
   - Use React.memo for visualization component
   - Debounce date range changes (500ms delay)
   - Lazy load visualization (only render when user scrolls to it)

4. **Loading States**:
   - Skeleton loader for table (gray animated rows)
   - Canvas placeholder for visualization (spinning orbital icon)
   - Progress bar for NASA API calls (if > 2 seconds)
   - Error boundary with retry button if API fails

**Success Criteria**:
- [ ] First load: < 5 seconds (NASA API fetch)
- [ ] Cached loads: < 1 second
- [ ] No UI blocking during data fetch
- [ ] Graceful error handling with user-friendly messages

---

### Phase 7.5: UI/UX Polish (0.5 hours)

**Objective**: Professional presentation and usability

**Tasks**:
1. **Page Layout Update** (`apps/web/app/iso-objects/[id]/page.tsx`):
   - Move "NASA Horizons Data" section to top (primary content)
   - Order: Orbital Visualization → Ephemeris Table → Community Sentiment → Evidence
   - Use tab navigation for cleaner layout:
     - Tab 1: Overview (metadata + visualization)
     - Tab 2: Orbital Data (ephemeris table + elements)
     - Tab 3: Evidence (existing evidence framework)
     - Tab 4: Community (Community Sentiment)

2. **Educational Content**:
   - Add "ℹ️" info icon next to "Hyperbolic Trajectory"
   - Tooltip: "A hyperbolic orbit proves this object came from outside our solar system. Unlike elliptical planetary orbits, hyperbolic paths are open-ended and pass through the solar system only once."
   - Link to NASA JPL Horizons: "Data provided by NASA JPL Horizons System"
   - "How to read this chart" expandable section

3. **Mobile Optimization**:
   - Test on iPhone Safari and Android Chrome
   - Ensure pinch-zoom works on visualization
   - Table scrolls horizontally without breaking layout
   - Touch-friendly controls (larger tap targets: 44px minimum)

4. **Accessibility**:
   - Alt text for visualization: "2D orbital plot showing [object name]'s hyperbolic trajectory through the solar system"
   - Keyboard navigation: Tab through zoom controls, time slider
   - ARIA labels for interactive elements
   - Screen reader announcement: "Orbital visualization loaded. Use arrow keys to scrub through time."
   - High contrast mode support

**Success Criteria**:
- [ ] Visualization is visually prominent on page
- [ ] Non-technical users understand what they're seeing
- [ ] Works smoothly on iPhone 12+ and Android devices
- [ ] Passes WCAG 2.1 AA accessibility standards

---

### Phase 7.6: Testing & QA (1 hour)

**Objective**: Validate all features work correctly

**Tasks**:
1. **Unit Tests** (using Jest):
   ```typescript
   // lib/nasa/horizons-api.test.ts
   describe('fetchEphemeris', () => {
     it('fetches data from NASA API')
     it('handles API errors gracefully')
     it('parses response correctly')
   })

   // lib/nasa/coordinates.test.ts
   describe('ephemerisToCanvasCoords', () => {
     it('converts RA/Dec to canvas x/y')
     it('handles heliocentric view')
     it('handles geocentric view')
   })
   ```

2. **Integration Tests**:
   - API route returns valid JSON for all 3 ISOs
   - Cache hit/miss works correctly
   - Stale cache triggers refresh
   - UI components render with real data

3. **Manual Testing Checklist**:
   - [ ] **1I/'Oumuamua**: Verify hyperbolic trajectory visible
   - [ ] **2I/Borisov**: Verify data loads and displays correctly
   - [ ] **3I/ATLAS**: Verify future predictions work
   - [ ] Date range change: Updates table and visualization
   - [ ] Zoom in/out: Smooth scaling without artifacts
   - [ ] Pan: Dragging moves view correctly
   - [ ] Time scrubbing: Slider updates object position
   - [ ] Tooltip: Hover shows date and distance
   - [ ] Mobile: Pinch zoom and drag work on touch devices
   - [ ] Error handling: Displays friendly message if NASA API down

4. **Performance Testing**:
   - Measure time to first render: < 3 seconds
   - Measure cache vs non-cache load time
   - Check memory usage with Chrome DevTools (< 50MB for visualization)
   - Test with throttled network (Fast 3G simulation)

5. **Cross-browser Testing**:
   - [ ] Chrome (desktop and mobile)
   - [ ] Safari (desktop and iOS)
   - [ ] Firefox (desktop)
   - [ ] Edge (desktop)

**Success Criteria**:
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Manual QA checklist 100% complete
- [ ] No critical bugs or regressions
- [ ] Performance within targets

---

## Implementation Order

**Recommended sequence** (incremental, testable):

1. **Day 1 (4 hours)**:
   - ✅ Phase 7.1: NASA API Integration (2h)
   - ✅ Phase 7.2: Ephemeris Data Table (1h)
   - ✅ Phase 7.4: Database Migration (0.5h)
   - ✅ Test: Verify table displays real NASA data

2. **Day 2 (3-4 hours)**:
   - ✅ Phase 7.3: 2D Visualization (2-3h)
   - ✅ Phase 7.5: UI/UX Polish (0.5h)
   - ✅ Phase 7.6: Testing & QA (1h)
   - ✅ Deploy to production

**OR single session** (6-8 hours straight):
- Follow phases 7.1 → 7.6 sequentially
- Take 10-minute breaks between phases
- Deploy at end of Phase 7.6

---

## Technical Notes

### NASA Horizons API Specifics

**1I/'Oumuamua (A/2017 U1)**:
- COMMAND: 'A2017 U1' or DES=2017001
- Perihelion: 2017-09-09 (already passed through solar system)
- Current location: Beyond Pluto, moving away

**2I/Borisov (C/2019 Q4)**:
- COMMAND: 'C2019 Q4' or DES=2019002
- Perihelion: 2019-12-08 (already passed)
- Current location: Beyond Neptune

**3I/ATLAS (A/2025 O1)**:
- COMMAND: 'A2025 O1' or DES=2025001
- Perihelion: 2025-10-29 (UPCOMING - perfect timing!)
- Current location: Approaching inner solar system

**API Query Example**:
```
https://ssd.jpl.nasa.gov/api/horizons.api?
  format=text&
  COMMAND='A2017 U1'&
  OBJ_DATA='YES'&
  MAKE_EPHEM='YES'&
  EPHEM_TYPE='OBSERVER'&
  CENTER='500@10'&  (Sun)
  START_TIME='2025-11-01'&
  STOP_TIME='2025-12-01'&
  STEP_SIZE='1d'&
  QUANTITIES='1,9,20,23,24'
```

### Coordinate System Notes

**Heliocentric (Sun-centered)**:
- Use ecliptic coordinates (most common for solar system visualization)
- X-axis: Vernal equinox direction
- Y-axis: 90° from X in ecliptic plane
- Z-axis: North ecliptic pole

**Canvas Mapping**:
```typescript
// Convert AU to pixels
const scale = canvasWidth / (maxAU * 2)  // maxAU = Jupiter orbit ~5.2 AU

// Center origin at canvas center
const centerX = canvasWidth / 2
const centerY = canvasHeight / 2

// Map astronomical coords to screen coords
const screenX = centerX + (astronomicalX * scale)
const screenY = centerY - (astronomicalY * scale)  // Flip Y (canvas Y goes down)
```

---

## Files to Create/Modify

**New Files**:
1. `apps/web/lib/nasa/horizons-api.ts` - NASA API client
2. `apps/web/lib/nasa/coordinates.ts` - Coordinate transformations
3. `apps/web/components/visualization/EphemerisTable.tsx` - Data table
4. `apps/web/components/visualization/OrbitalPlot2D.tsx` - 2D canvas visualization
5. `apps/web/app/api/iso/[id]/ephemeris/route.ts` - Ephemeris API endpoint
6. `supabase/migrations/015_ephemeris_cache.sql` - Database schema
7. `apps/web/lib/nasa/horizons-api.test.ts` - Unit tests

**Modified Files**:
1. `apps/web/app/iso-objects/[id]/page.tsx` - Integrate visualization
2. `apps/web/lib/nasa/horizons.ts` - Update to use real API instead of mock data

---

## Success Criteria (Overall Sprint 7)

- [ ] NASA Horizons API successfully integrated and tested
- [ ] Ephemeris data table displays real observation data
- [ ] 2D orbital visualization shows hyperbolic trajectories
- [ ] Interactive controls work smoothly (zoom, pan, time scrub)
- [ ] Data cached efficiently (< 3 second load with cache)
- [ ] Mobile-responsive and accessible (WCAG 2.1 AA)
- [ ] All 3 ISOs (1I, 2I, 3I) display correctly
- [ ] Deployed to production at https://www.isotracker.org
- [ ] Users can visually track interstellar objects through space

---

## Future Enhancements (Post-Sprint 7)

These are **NOT** part of Sprint 7, but good ideas for Sprint 8+:

- 3D visualization using Three.js (rotate, tilt view)
- Animated time-lapse showing object movement over months
- Observation planning tool (best viewing dates from Earth)
- Sky chart overlay (show where to point telescope)
- Export ephemeris data to CSV
- Compare multiple objects on same chart
- Integration with telescope control systems (ASCOM/INDI)
- AR mode: Point phone at sky, highlight object location

---

## How to Execute This Sprint

**To start Sprint 7**, use this command:

```bash
/coord complete /Users/jamiewatters/DevProjects/ISOTracker/SPRINT-7-PROMPT.md
```

The coordinator will:
1. Read this entire prompt
2. Create todo list from phases 7.1-7.6
3. Delegate to appropriate specialists (@developer, @tester, @designer)
4. Track progress in project-plan.md and progress.md
5. Deploy to production when complete

**Alternatively, manual execution**:
1. Read Phase 7.1 tasks
2. Implement NASA API client
3. Test with 1I/'Oumuamua
4. Continue through phases 7.2-7.6
5. Update project-plan.md as you complete each phase
6. Document issues in progress.md
7. Deploy and test on production

---

**Good luck! This will make ISO Tracker truly track interstellar objects! 🚀**
