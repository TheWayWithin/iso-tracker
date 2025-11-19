import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { fetchEphemeris, getHorizonsId } from '@/lib/nasa/horizons-api';

/**
 * GET /api/iso/[id]/ephemeris
 * Fetch ephemeris data for an ISO object with intelligent caching
 *
 * Query parameters:
 * - start_date: ISO 8601 date string (default: 30 days ago)
 * - end_date: ISO 8601 date string (default: today)
 * - step_size: Time step (default: "1d")
 *
 * Returns:
 * - ephemeris: Array of observation points
 * - cached: Boolean indicating if data was from cache
 * - cache_age_hours: Age of cache in hours (if cached)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const iso_id = params.id;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('start_date');
    const endDateParam = searchParams.get('end_date');
    const stepSize = searchParams.get('step_size') || '1d';

    // Default date range: ±30 days from now
    const now = new Date();
    const defaultStartDate = new Date(now);
    defaultStartDate.setDate(defaultStartDate.getDate() - 30);
    const defaultEndDate = new Date(now);
    defaultEndDate.setDate(defaultEndDate.getDate() + 30);

    const startDate = startDateParam ? new Date(startDateParam) : defaultStartDate;
    const endDate = endDateParam ? new Date(endDateParam) : defaultEndDate;

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use ISO 8601 (YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    if (endDate <= startDate) {
      return NextResponse.json(
        { error: 'end_date must be after start_date' },
        { status: 400 }
      );
    }

    // Get ISO object from database
    const { data: isoObject, error: isoError } = await supabase
      .from('iso_objects')
      .select('id, name, nasa_id')
      .eq('id', iso_id)
      .single();

    if (isoError || !isoObject) {
      return NextResponse.json(
        { error: 'ISO object not found' },
        { status: 404 }
      );
    }

    // Get NASA Horizons ID for this object
    const horizonsId = getHorizonsId(isoObject.name) || isoObject.nasa_id;

    if (!horizonsId) {
      return NextResponse.json(
        { error: 'NASA Horizons ID not available for this object' },
        { status: 404 }
      );
    }

    // Check cache first
    const { data: cachedData, error: cacheError } = await supabase
      .from('iso_horizons_cache')
      .select('*')
      .eq('iso_object_id', iso_id)
      .gte('observation_date', startDate.toISOString())
      .lte('observation_date', endDate.toISOString())
      .order('observation_date', { ascending: true });

    // Check if cache is fresh (not expired)
    const isCacheFresh = cachedData && cachedData.length > 0 &&
      cachedData[0].expires_at &&
      new Date(cachedData[0].expires_at) > new Date();

    if (isCacheFresh && cachedData) {
      // Return cached data
      const cacheAgeHours = Math.round(
        (Date.now() - new Date(cachedData[0].cached_at).getTime()) / (1000 * 60 * 60)
      );

      console.log(`[Ephemeris Cache] HIT for ISO ${iso_id}, ${cachedData.length} points, age: ${cacheAgeHours}h`);

      return NextResponse.json({
        ephemeris: cachedData.map(row => ({
          datetime_jd: row.datetime_jd,
          calendar_date: row.observation_date,
          ra: parseFloat(row.ra),
          dec: parseFloat(row.dec),
          delta: parseFloat(row.delta),
          deldot: parseFloat(row.deldot),
          mag: row.magnitude ? parseFloat(row.magnitude) : null,
          phase_angle: row.phase_angle ? parseFloat(row.phase_angle) : null,
        })),
        cached: true,
        cache_age_hours: cacheAgeHours,
      });
    }

    // Cache miss or stale - fetch from NASA
    console.log(`[Ephemeris Cache] MISS for ISO ${iso_id}, fetching from NASA Horizons`);

    try {
      const ephemerisData = await fetchEphemeris(
        horizonsId,
        startDate,
        endDate,
        stepSize
      );

      if (ephemerisData.length === 0) {
        return NextResponse.json(
          { error: 'No ephemeris data available from NASA for this date range' },
          { status: 404 }
        );
      }

      // Store in cache (delete old entries first)
      const { error: deleteError } = await supabase
        .from('iso_horizons_cache')
        .delete()
        .eq('iso_object_id', iso_id)
        .gte('observation_date', startDate.toISOString())
        .lte('observation_date', endDate.toISOString());

      if (deleteError) {
        console.warn('Failed to delete old cache entries:', deleteError);
      }

      // Insert new cache entries
      const cacheEntries = ephemerisData.map(point => ({
        iso_object_id: iso_id,
        observation_date: point.calendar_date,
        datetime_jd: point.datetime_jd,
        ra: point.ra,
        dec: point.dec,
        delta: point.delta,
        deldot: point.deldot,
        magnitude: point.mag,
        phase_angle: point.phase_angle,
      }));

      const { error: insertError } = await supabase
        .from('iso_horizons_cache')
        .insert(cacheEntries);

      if (insertError) {
        console.warn('Failed to cache ephemeris data:', insertError);
        // Continue anyway - we have the data from NASA
      }

      return NextResponse.json({
        ephemeris: ephemerisData,
        cached: false,
        cache_age_hours: 0,
      });

    } catch (nasaError) {
      console.error('NASA Horizons API error:', nasaError);

      // If NASA fails, try to return stale cache if available
      if (cachedData && cachedData.length > 0) {
        console.log(`[Ephemeris Cache] Returning stale cache due to NASA API error`);
        return NextResponse.json({
          ephemeris: cachedData.map(row => ({
            datetime_jd: row.datetime_jd,
            calendar_date: row.observation_date,
            ra: parseFloat(row.ra),
            dec: parseFloat(row.dec),
            delta: parseFloat(row.delta),
            deldot: parseFloat(row.deldot),
            mag: row.magnitude ? parseFloat(row.magnitude) : null,
            phase_angle: row.phase_angle ? parseFloat(row.phase_angle) : null,
          })),
          cached: true,
          cache_age_hours: Math.round(
            (Date.now() - new Date(cachedData[0].cached_at).getTime()) / (1000 * 60 * 60)
          ),
          warning: 'NASA API unavailable, returning stale cache',
        });
      }

      return NextResponse.json(
        { error: 'Failed to fetch ephemeris data from NASA Horizons' },
        { status: 503 }
      );
    }

  } catch (error) {
    console.error('Unexpected error in GET /api/iso/[id]/ephemeris:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
