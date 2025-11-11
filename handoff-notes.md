# Handoff Notes - Sprint 2: NASA API Integration

**From**: @analyst
**To**: @developer
**Date**: 2025-01-10
**Mission**: Sprint 2 Planning Complete - Ready for Implementation

---

## Sprint 2 Context

**What we're doing**: Integrating NASA JPL Horizons API to track interstellar objects
**Why it matters**: This is the core data source for ISO Tracker - without it, we can't show 'Oumuamua, Borisov, or future discoveries

**Sprint 1 Complete**:
- ✅ Authentication working (sign-up, sign-in, sign-out)
- ✅ Database schema with profiles and subscriptions tables
- ✅ Automatic profile + guest subscription creation on signup
- ✅ Dashboard showing user profile and subscription status

**Sprint 2 Goals** (from project-plan.md):
1. NASA JPL Horizons API integration
2. ISO objects table and data model
3. Basic object list page
4. Object detail page with orbital data
5. Data refresh/sync functionality

---

## Research Complete: NASA JPL Horizons API

### Key Findings

**API Recommendation**: Use HTTP API (not telnet)
- **Endpoint**: `https://ssd.jpl.nasa.gov/api/horizons.api`
- **Method**: GET with query parameters
- **Auth**: None required (public API)
- **Rate Limit**: Implicit fair-use (implement 24hr caching)

**Known Interstellar Objects**:
1. **1I/'Oumuamua** - NASA ID: `1I` or `A/2017 U1`, discovered Oct 19, 2017
2. **2I/Borisov** - NASA ID: `2I` or `C/2019 Q4`, discovered Aug 30, 2019

**Data Available**:
- ✅ Orbital elements (eccentricity, perihelion, inclination, etc.)
- ✅ Ephemeris data (position, distance, magnitude over time)
- ✅ Physical properties (absolute magnitude, rotation, size estimates)
- ⚠️ Text format (not JSON) - parsing required

### Sample API Call

```bash
curl "https://ssd.jpl.nasa.gov/api/horizons.api?format=text&COMMAND='1I'&OBJ_DATA='YES'&MAKE_EPHEM='YES'&EPHEM_TYPE='OBSERVER'&CENTER='500@399'&START_TIME='2017-10-19'&STOP_TIME='2017-11-20'&STEP_SIZE='1d'"
```

**Key Parameters**:
- `COMMAND`: Object designation (e.g., `'1I'`, `'2I'`)
- `OBJ_DATA`: `'YES'` to get physical/orbital data
- `MAKE_EPHEM`: `'YES'` to generate ephemeris table
- `EPHEM_TYPE`: `'OBSERVER'` for Earth-based observations
- `CENTER`: `'500@399'` (geocentric) or `'500@0'` (heliocentric)
- `START_TIME`, `STOP_TIME`: Date range (ISO format: YYYY-MM-DD)
- `STEP_SIZE`: Time interval (e.g., `'1d'`, `'1h'`)

### Response Structure (Text Format)

```
*******************************************************************************
Revised: July 27, 2021             1I/'Oumuamua                            1I

PHYSICAL PROPERTIES:
  Absolute mag= ~22.2                Rotation period= ~8 hr

ORBITAL ELEMENTS:
  Eccentricity= 1.1956        Perihelion distance= 0.2559 AU
  Semi-major axis= -1.2798 AU   Inclination= 122.74 deg

EPHEMERIS:
Date__(UT)__HR:MN     R.A._____(ICRF)_____DEC    Delta    deldot ...
2017-Oct-19 00:00     23 52 01.2 +15 23 32.1   0.16189  -27.0432
2017-Oct-20 00:00     00 06 24.8 +16 48 12.3   0.19234  -18.5621
```

---

## Implementation Strategy

### 1. Caching Approach

**Strategy**: Store Horizons responses in Supabase with 24hr TTL

**Rationale**:
- ISO orbital data changes slowly (objects are far away)
- Reduces API load and improves response time
- 24-hour refresh balances freshness with efficiency

**Suggested Schema Addition**:
```sql
-- Add to database/schema.sql
CREATE TABLE iso_horizons_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  object_id TEXT NOT NULL,           -- '1I', '2I', etc.
  data JSONB NOT NULL,                -- Full parsed Horizons response
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ NOT NULL,  -- Cache expiration (fetched_at + 24 hours)
  UNIQUE(object_id)
);

-- Indexes for cache lookup
CREATE INDEX idx_iso_cache_object ON iso_horizons_cache(object_id);
CREATE INDEX idx_iso_cache_expiry ON iso_horizons_cache(valid_until);
```

### 2. TypeScript Structure

**Suggested File**: `/apps/web/lib/nasa/horizons-api.ts`

```typescript
export interface HorizonsParams {
  objectId: string;        // e.g., '1I', '2I'
  startDate: string;       // ISO format: '2017-10-19'
  stopDate: string;        // ISO format: '2017-11-19'
  stepSize?: string;       // e.g., '1d', '1h'
  center?: string;         // Default: '500@399' (geocentric)
}

export interface ISOData {
  identification: {
    name: string;
    designation: string;
    discoveryDate: string;
  };
  orbital: {
    eccentricity: number;
    perihelion: number;
    semiMajorAxis: number;
    inclination: number;
  };
  physical: {
    absoluteMagnitude: number | null;
    rotationPeriod?: number;
    size?: number;
  };
  ephemeris: Array<{
    date: Date;
    ra: number;          // Right Ascension
    dec: number;         // Declination
    delta: number;       // Distance from Earth (AU)
    magnitude: number;
  }>;
}

export async function fetchHorizonsData(
  params: HorizonsParams
): Promise<ISOData> {
  const url = buildHorizonsURL(params);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Horizons API error: ${response.status}`);
  }

  const text = await response.text();
  return parseHorizonsResponse(text);
}

function buildHorizonsURL(params: HorizonsParams): string {
  const baseURL = 'https://ssd.jpl.nasa.gov/api/horizons.api';
  const queryParams = new URLSearchParams({
    format: 'text',
    COMMAND: `'${params.objectId}'`,
    OBJ_DATA: 'YES',
    MAKE_EPHEM: 'YES',
    EPHEM_TYPE: 'OBSERVER',
    CENTER: params.center || '500@399',
    START_TIME: params.startDate,
    STOP_TIME: params.stopDate,
    STEP_SIZE: params.stepSize || '1d',
  });

  return `${baseURL}?${queryParams}`;
}

function parseHorizonsResponse(text: string): ISOData {
  // TODO: Implement robust text parsing
  // Extract sections: PHYSICAL PROPERTIES, ORBITAL ELEMENTS, EPHEMERIS
  throw new Error('Not implemented');
}
```

### 3. Error Handling

**Priority Scenarios**:

1. **Object Not Found** (future ISOs not yet in database)
   ```typescript
   if (response.includes("No matches found")) {
     throw new ObjectNotFoundError(objectId);
   }
   ```

2. **Rate Limiting** (implement exponential backoff)
   ```typescript
   async function fetchWithRetry(url: string, maxRetries = 3) {
     for (let i = 0; i < maxRetries; i++) {
       try {
         const response = await fetch(url);
         if (response.ok) return response;
         if (response.status === 429) {
           await sleep(2 ** i * 1000); // Exponential backoff: 1s, 2s, 4s
           continue;
         }
       } catch (error) {
         if (i === maxRetries - 1) throw error;
       }
     }
   }
   ```

3. **Parsing Errors** (text format can be inconsistent)
   ```typescript
   function parseHorizonsResponse(text: string): ISOData {
     try {
       const objectData = extractSection(text, "PHYSICAL PROPERTIES");
       const orbitalElements = extractSection(text, "ORBITAL ELEMENTS");
       const ephemeris = extractSection(text, "EPHEMERIS");
       return { objectData, orbitalElements, ephemeris };
     } catch (error) {
       throw new ParsingError("Failed to parse Horizons response");
     }
   }
   ```

---

## Critical Gotchas

### ⚠️ Text Parsing Required (Not JSON)

**Problem**: The Horizons API returns plain text, not JSON

**Impact**:
- Need robust regex-based parsing
- Different sections for object data, orbital elements, ephemeris
- Format can vary slightly by object type

**Mitigation**:
- Use well-tested parsing patterns
- Implement schema validation on parsed data
- Handle missing/malformed sections gracefully

### ⚠️ Missing Data Common

**Problem**: Not all ISOs have complete physical properties

**Impact**:
- Physical properties often limited or estimated
- Historical ISOs may have sparse ephemeris coverage
- Future ISOs won't exist in database until discovered

**Mitigation**:
- Handle missing data gracefully with `null` or `undefined`
- Display "Data unavailable" in UI for missing fields
- Use TypeScript optional properties (e.g., `rotationPeriod?: number`)

### ⚠️ Coordinate Systems Matter

**Problem**: Multiple reference frames available

**Options**:
- Geocentric (`CENTER='500@399'`) - Earth-based observations
- Heliocentric (`CENTER='500@0'`) - Sun-centered
- Barycentric (`CENTER='500@10'`) - Solar system barycenter

**Recommendation**:
- Use geocentric for observation planning (default)
- Use heliocentric for orbital analysis (optional)
- Document which frame you're using in UI

### ⚠️ Time Zones & Formats

**Problem**: Horizons uses multiple time scales

**Details**:
- UTC (Coordinated Universal Time) - default
- TT (Terrestrial Time) - sometimes used for high precision
- Dates can be Julian Day Numbers or calendar format

**Recommendation**:
- Always use ISO 8601 format for input (`YYYY-MM-DD`)
- Parse output dates carefully (format varies by query type)
- Store all timestamps in UTC in database

---

## Next Developer Steps

### Phase 1: API Client (Now)

1. **Create API client module**
   - File: `/apps/web/lib/nasa/horizons-api.ts`
   - Functions: `fetchHorizonsData()`, `buildHorizonsURL()`, `parseHorizonsResponse()`
   - Interfaces: `HorizonsParams`, `ISOData`

2. **Implement caching layer**
   - Add migration: `database/migrations/002_iso_horizons_cache.sql`
   - Add cache check/set logic in API client
   - 24-hour TTL strategy

3. **Add error handling**
   - Retry logic with exponential backoff
   - Object not found handling
   - Parsing error recovery

4. **Test with known ISOs**
   - 1I/'Oumuamua (Oct 2017)
   - 2I/Borisov (Aug 2019 - Dec 2019)
   - Invalid object ID (e.g., '99I')

### Phase 2: Data Display (Next)

5. **Create ISO list page**
   - Route: `/app/iso-objects/page.tsx`
   - Display: Table/grid of known ISOs
   - Data: Name, designation, discovery date, status

6. **Create ISO detail page**
   - Route: `/app/iso-objects/[id]/page.tsx`
   - Display: Orbital elements, physical properties, ephemeris table
   - Visualization: Consider simple charts for position over time

7. **Add refresh functionality**
   - Manual refresh button (force cache invalidation)
   - Automatic background refresh (cron job or edge function)

### Phase 3: Polish (Later)

8. **Add loading states**
   - Skeleton loaders during API fetch
   - Error boundaries for parsing failures

9. **Add tests**
   - Unit tests for parsing functions
   - Integration tests for API client
   - E2E tests for ISO list/detail pages

---

## Testing Strategy

### Manual Test Cases

1. **Fetch 1I/'Oumuamua** (Oct 2017 discovery period)
   ```typescript
   await fetchHorizonsData({
     objectId: '1I',
     startDate: '2017-10-19',
     stopDate: '2017-11-19',
     stepSize: '1d'
   });
   ```

2. **Fetch 2I/Borisov** (Aug 2019 - Dec 2019)
   ```typescript
   await fetchHorizonsData({
     objectId: '2I',
     startDate: '2019-08-30',
     stopDate: '2019-12-30',
     stepSize: '1d'
   });
   ```

3. **Test cache behavior**
   - First request: Should fetch from NASA API (cache miss)
   - Second request (within 24hrs): Should return cached data
   - After 24hrs: Should refetch from NASA API

4. **Test invalid object**
   ```typescript
   await fetchHorizonsData({
     objectId: '99I',  // Doesn't exist
     startDate: '2020-01-01',
     stopDate: '2020-01-31'
   });
   // Should throw ObjectNotFoundError
   ```

### Edge Cases to Handle

- ❌ Object not found in Horizons database
- ❌ Network timeout or API unavailable
- ❌ Malformed response text
- ❌ Missing ephemeris data for requested date range
- ❌ Date range before object's discovery
- ❌ Parsing fails due to unexpected format

---

## Questions for Jamie

Before starting implementation, please confirm:

1. **Coordinate system preference**: Should we support both geocentric and heliocentric views, or start with geocentric only?

2. **Parsing approach**: Regex-based custom parser or explore existing libraries? (Tradeoff: custom = full control, library = faster but dependency)

3. **Cache invalidation**: Automatic 24hr refresh only, or also add manual "Refresh Data" button for users?

4. **ISO object IDs**: Should we hardcode 1I and 2I initially, or build a system to discover new ISOs automatically? (Recommendation: Start with hardcoded, add discovery later)

---

## Resources & References

**Primary Source**: NASA JPL Horizons System - https://ssd.jpl.nasa.gov/horizons/
**API Documentation**: https://ssd-api.jpl.nasa.gov/doc/horizons.html
**Small-Body Database**: https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html

**Current Database Schema**: `/database/schema.sql`
**Current Dashboard**: `/apps/web/app/dashboard/page.tsx`

---

## Handoff Checklist

**Jamie, before we proceed**:
- [ ] Have you reviewed the NASA API research findings above?
- [ ] Are you comfortable with the caching strategy (24hr TTL)?
- [ ] Do you want to review the sample API response format?
- [ ] Any questions about the implementation approach?
- [ ] Ready for me to delegate to @developer for implementation?

**Checkpoint**: Are you ready to continue, or do you want to discuss the approach first?

---

**Analysis Confidence**: High (95%)
**Business Impact**: Critical - NASA API is core data source
**Risk Level**: Low - public API, well-documented, proven implementations exist

**Ready for**: @developer implementation OR user questions/feedback

---

*Last updated: 2025-01-10 by @analyst*
*Mission: Sprint 2 NASA API Integration Planning*
