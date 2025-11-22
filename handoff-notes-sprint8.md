# Sprint 8: Observation Planning & Visibility Features - Handoff Notes

**Mission**: Transform ISO Tracker from passive viewer to active observation planning tool
**Status**: Phase 8.2 ✅ COMPLETE | Phase 8.3 ⏳ READY TO START
**Date**: 2025-11-19

---

## Phase 8.2: Visibility Windows & Status Calculation ✅ COMPLETE

### Implementation Summary

**What Was Built**:
1. **Visibility Calculation Library** (`apps/web/lib/astronomy/visibility.ts`)
   - Complete visibility forecasting system
   - Functions: `generateVisibilityForecast()`, `findVisibilityWindows()`, `calculateCurrentVisibility()`
   - Quality assessment (excellent/good/fair/poor) based on altitude + magnitude
   - Geographic visibility (latitude ranges where object is visible)
   - Rise/set time predictions
   - 12K, 479 lines

2. **Visibility API Route** (`apps/web/app/api/iso/[id]/visibility/route.ts`)
   - REST endpoint with query params: lat, lon, date, days
   - Integrates Horizons API ephemeris with visibility calculations
   - Returns: current status, next rise/set, upcoming 5 windows, visibility %
   - Edge runtime with 1-hour caching
   - 5.0K, 180 lines

3. **React Integration Hook** (`apps/web/hooks/useVisibility.ts`)
   - Custom hook `useVisibility()` for components
   - Auto-refresh capability (configurable interval)
   - Helper functions: `formatTimeUntil()`, `formatQuality()`
   - 4.8K, 165 lines

**Total**: ~21.8K (824 lines)

### Files Created & Verified

1. `/apps/web/lib/astronomy/visibility.ts` (12K) ✅ VERIFIED 2025-11-19 23:38
2. `/apps/web/app/api/iso/[id]/visibility/route.ts` (5.0K) ✅ VERIFIED 2025-11-19 23:38
3. `/apps/web/hooks/useVisibility.ts` (4.8K) ✅ VERIFIED 2025-11-19 23:38

### Integration Ready For Phase 8.3

**Phase 8.1 Integration** (Complete):
- ✅ Coordinate transformations (`raDecToAltAz()`)
- ✅ Location services (`LocationSelector`, `loadSavedLocation()`)
- ✅ Horizon checks (`isAboveHorizon()`)

**Phase 8.2 Integration** (Complete):
- ✅ Visibility forecasting (`generateVisibilityForecast()`)
- ✅ Window calculations (`findVisibilityWindows()`)
- ✅ Quality assessment (`assessVisibilityQuality()`)
- ✅ API endpoint (`/api/iso/[id]/visibility`)
- ✅ React hook (`useVisibility()`)

**Ready for Phase 8.3**: UI Components for Observation Planning

---

## Phase 8.3: Sky Map & Observation Planning UI ⏳ NEXT

### What to Build

**4 Main Components Needed**:

1. **VisibilityStatus** (`components/observation/VisibilityStatus.tsx`)
   - Real-time visibility indicator: 🟢 "Currently Visible" / 🔴 "Below Horizon"
   - Current altitude & azimuth with compass direction
   - Sky position diagram (simple circle: horizon → zenith → current position)
   - Quality indicator: ⭐⭐⭐⭐⭐ rating
   - Magnitude & expected brightness
   - Updates every 60 seconds

2. **ObservationWindows** (`components/observation/ObservationWindows.tsx`)
   - Table of next 5 visibility windows
   - Columns: Date, Start Time, End Time, Max Altitude, Duration, Quality
   - Timezone-aware (user's local time)
   - "Add to Calendar" button (generates .ics file)
   - Countdown: "Visible in 2 hours 34 minutes"
   - Responsive: card layout on mobile

3. **SkyMap** (`components/observation/SkyMap.tsx`)
   - Interactive sky chart showing object position
   - Horizon line, cardinal directions (N, E, S, W)
   - Current object position marker
   - Altitude circles (30°, 60°, 90°/zenith)
   - Time scrubber: see position at different times tonight
   - Mobile-friendly touch controls

4. **GeographicVisibility** (`components/observation/GeographicVisibility.tsx`)
   - World map showing where object is currently above horizon
   - Highlight best observing latitudes
   - "Visible from your location" indicator
   - Simplified view on mobile

### Integration Example

```typescript
// In ISO detail page
import { VisibilityStatus } from '@/components/observation/VisibilityStatus';
import { ObservationWindows } from '@/components/observation/ObservationWindows';
import { useVisibility } from '@/hooks/useVisibility';
import { loadSavedLocation } from '@/lib/location/location-service';

export function ISODetailPage({ isoId }: { isoId: string }) {
  const location = loadSavedLocation();
  const { data, loading, error } = useVisibility({ isoId, location });

  return (
    <div>
      <VisibilityStatus data={data} loading={loading} />
      <ObservationWindows windows={data?.forecast.upcomingWindows} />
      {/* ... other tabs */}
    </div>
  );
}
```

### Data Available from useVisibility()

```typescript
{
  forecast: {
    currentStatus: {
      isVisible: boolean,
      altitude: number,      // degrees
      azimuth: number,       // degrees (0=N, 90=E, 180=S, 270=W)
      apparentAltitude: number,
      quality: 'excellent' | 'good' | 'fair' | 'poor' | 'not_visible',
      datetime: string       // ISO timestamp
    },
    nextRise: string | null,   // ISO timestamp
    nextSet: string | null,    // ISO timestamp
    upcomingWindows: [{
      start: string,            // ISO timestamp
      end: string,              // ISO timestamp
      duration: number,         // minutes
      maxAltitude: number,      // degrees
      quality: string
    }],
    visibilityPercentage: number  // 0-100
  }
}
```

### Testing Checklist

- [ ] VisibilityStatus updates in real-time (60s interval)
- [ ] ObservationWindows displays in user's local timezone
- [ ] "Add to Calendar" generates valid .ics files
- [ ] SkyMap interactive controls work on touch devices
- [ ] GeographicVisibility map loads and highlights correctly
- [ ] All components handle loading/error states
- [ ] Mobile responsive (test on iPhone/Android)
- [ ] Works with all 3 ISOs (1I, 2I, 3I)

### Next Actions

1. Create 4 UI components listed above
2. Integrate into ISO detail page (new "Observation Planning" tab)
3. Test with real data from visibility API
4. Verify mobile responsiveness
5. Document in progress.md

---

**Status**: Phase 8.2 complete, Phase 8.3 ready to build
**Next**: UI component implementation
**Estimated Time**: 2-3 hours for all components
