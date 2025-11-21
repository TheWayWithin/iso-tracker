/**
 * Visibility API Route
 *
 * GET /api/iso/[id]/visibility?lat=X&lon=Y&date=Z
 *
 * Returns visibility forecast for an ISO from a specific observer location.
 * Integrates Horizons API ephemeris data with coordinate transformations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchEphemeris, getHorizonsId } from '@/lib/nasa/horizons-api';
import { generateVisibilityForecast } from '@/lib/astronomy/visibility';
import type { ObserverLocation } from '@/lib/astronomy/coordinates';

export const revalidate = 3600; // Cache for 1 hour

interface VisibilityParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/iso/[id]/visibility
 *
 * Query parameters:
 * - lat: Observer latitude in degrees (required)
 * - lon: Observer longitude in degrees (required)
 * - date: Start date for forecast (optional, default: now)
 * - days: Number of days to forecast (optional, default: 30)
 */
export async function GET(
  request: NextRequest,
  { params }: VisibilityParams
) {
  try {
    const { id } = params;
    const searchParams = request.nextUrl.searchParams;

    // Parse and validate query parameters
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    const dateParam = searchParams.get('date');
    const daysParam = searchParams.get('days');

    if (!lat || !lon) {
      return NextResponse.json(
        { error: 'Missing required parameters: lat, lon' },
        { status: 400 }
      );
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (
      isNaN(latitude) ||
      isNaN(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return NextResponse.json(
        { error: 'Invalid coordinates: lat must be -90 to 90, lon must be -180 to 180' },
        { status: 400 }
      );
    }

    // Parse date and forecast period
    const startDate = dateParam ? new Date(dateParam) : new Date();
    const days = daysParam ? parseInt(daysParam, 10) : 30;

    if (isNaN(startDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    if (days < 1 || days > 90) {
      return NextResponse.json(
        { error: 'Days must be between 1 and 90' },
        { status: 400 }
      );
    }

    // Calculate end date
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days);

    // Look up ISO object in database to get NASA Horizons ID
    const supabase = await createClient();
    const { data: isoObject, error: isoError } = await supabase
      .from('iso_objects')
      .select('id, name, nasa_id')
      .eq('id', id)
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

    // Fetch ephemeris data from Horizons API
    // Use hourly steps for detailed visibility calculations
    const ephemeris = await fetchEphemeris(
      horizonsId,
      startDate,
      endDate,
      '1h' // Hourly data for accurate rise/set times
    );

    if (!ephemeris || ephemeris.length === 0) {
      return NextResponse.json(
        { error: 'No ephemeris data available for this ISO' },
        { status: 404 }
      );
    }

    // Create observer location
    const observer: ObserverLocation = {
      latitude,
      longitude,
      elevation: 0, // Assume sea level for simplicity
    };

    // Map NASA ephemeris format to visibility format
    const mappedEphemeris = ephemeris.map(point => ({
      datetime: new Date(point.calendar_date),
      ra: point.ra,
      dec: point.dec,
      delta: point.delta,
      mag: point.mag
    }));

    // Generate visibility forecast
    const forecast = generateVisibilityForecast(mappedEphemeris, observer);

    // Return forecast with metadata
    return NextResponse.json({
      isoId: id,
      observer: {
        latitude,
        longitude,
      },
      forecastPeriod: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days,
      },
      forecast: {
        currentStatus: {
          isVisible: forecast.currentStatus.isVisible,
          altitude: forecast.currentStatus.altitude,
          azimuth: forecast.currentStatus.azimuth,
          apparentAltitude: forecast.currentStatus.apparentAltitude,
          quality: forecast.currentStatus.quality,
          datetime: forecast.currentStatus.datetime.toISOString(),
        },
        nextRise: forecast.nextRise?.toISOString() || null,
        nextSet: forecast.nextSet?.toISOString() || null,
        upcomingWindows: forecast.upcomingWindows.map((window) => ({
          start: window.start.toISOString(),
          end: window.end.toISOString(),
          duration: window.duration,
          maxAltitude: window.maxAltitude,
          quality: window.quality,
        })),
        visibilityPercentage: forecast.visibilityPercentage,
      },
      dataPoints: ephemeris.length,
    });
  } catch (error) {
    console.error('Visibility API error:', error);

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'ISO not found' },
        { status: 404 }
      );
    }

    console.error('Visibility API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to calculate visibility',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS handler for CORS
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
