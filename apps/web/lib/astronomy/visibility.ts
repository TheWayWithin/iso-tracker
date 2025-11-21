/**
 * Visibility Calculations
 *
 * Determines when and where ISOs are observable from any location on Earth.
 * Integrates coordinate transformations with ephemeris data to calculate
 * visibility windows, rise/set times, and observation quality.
 */

import {
  raDecToAltAz,
  isAboveHorizon,
  applyRefraction,
  type ObserverLocation,
  type HorizontalPosition,
} from './coordinates';

export interface VisibilityStatus {
  isVisible: boolean;
  altitude: number;
  azimuth: number;
  apparentAltitude: number;
  quality: VisibilityQuality;
  datetime: Date;
}

export interface VisibilityWindow {
  start: Date;
  end: Date;
  duration: number; // minutes
  maxAltitude: number;
  quality: VisibilityQuality;
}

export interface VisibilityForecast {
  currentStatus: VisibilityStatus;
  nextRise: Date | null;
  nextSet: Date | null;
  upcomingWindows: VisibilityWindow[];
  visibilityPercentage: number; // 0-100
}

export type VisibilityQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'not_visible';

export interface EphemerisPoint {
  datetime: string | Date;
  ra: number;        // Right Ascension in hours
  dec: number;       // Declination in degrees
  delta?: number;    // Distance in AU (optional)
  mag?: number;      // Apparent magnitude (optional)
}

/**
 * Calculate current visibility status for an object
 *
 * @param ephemeris - Current ephemeris point (RA/Dec from Horizons API)
 * @param observer - Observer's geographic location
 * @param datetime - Observation time (default: now)
 * @returns Current visibility status
 */
export function calculateCurrentVisibility(
  ephemeris: EphemerisPoint,
  observer: ObserverLocation,
  datetime: Date = new Date()
): VisibilityStatus {
  const horizontal = raDecToAltAz(
    { rightAscension: ephemeris.ra, declination: ephemeris.dec },
    observer,
    datetime
  );

  const apparentAltitude = applyRefraction(horizontal.altitude);
  const visible = isAboveHorizon(apparentAltitude);

  const quality = assessVisibilityQuality(
    apparentAltitude,
    ephemeris.mag
  );

  return {
    isVisible: visible,
    altitude: horizontal.altitude,
    azimuth: horizontal.azimuth,
    apparentAltitude,
    quality,
    datetime,
  };
}

/**
 * Generate visibility timeline for multiple ephemeris points
 *
 * @param ephemeris - Array of ephemeris points from Horizons API
 * @param observer - Observer's geographic location
 * @returns Array of visibility status for each point
 */
export function generateVisibilityTimeline(
  ephemeris: EphemerisPoint[],
  observer: ObserverLocation
): VisibilityStatus[] {
  return ephemeris.map((point) => {
    const datetime = typeof point.datetime === 'string'
      ? new Date(point.datetime)
      : point.datetime;

    return calculateCurrentVisibility(point, observer, datetime);
  });
}

/**
 * Find next rise and set times from current moment
 *
 * @param ephemeris - Array of ephemeris points (hourly or daily)
 * @param observer - Observer's geographic location
 * @param startDate - Start searching from this date (default: now)
 * @returns Next rise and set times
 */
export function findNextRiseSet(
  ephemeris: EphemerisPoint[],
  observer: ObserverLocation,
  startDate: Date = new Date()
): { nextRise: Date | null; nextSet: Date | null } {
  const timeline = generateVisibilityTimeline(ephemeris, observer);

  // Filter to points after startDate
  const futureTimeline = timeline.filter(
    (status) => status.datetime >= startDate
  );

  let nextRise: Date | null = null;
  let nextSet: Date | null = null;

  for (let i = 1; i < futureTimeline.length; i++) {
    const prev = futureTimeline[i - 1];
    const curr = futureTimeline[i];

    // Rising: was below horizon, now above
    if (!prev.isVisible && curr.isVisible && !nextRise) {
      nextRise = curr.datetime;
    }

    // Setting: was above horizon, now below
    if (prev.isVisible && !curr.isVisible && !nextSet) {
      nextSet = curr.datetime;
    }

    // Found both? Break early
    if (nextRise && nextSet) break;
  }

  return { nextRise, nextSet };
}

/**
 * Find next N visibility windows (periods when object is above horizon)
 *
 * @param ephemeris - Array of ephemeris points
 * @param observer - Observer's geographic location
 * @param count - Number of windows to find (default: 5)
 * @param startDate - Start searching from this date (default: now)
 * @returns Array of visibility windows
 */
export function findVisibilityWindows(
  ephemeris: EphemerisPoint[],
  observer: ObserverLocation,
  count: number = 5,
  startDate: Date = new Date()
): VisibilityWindow[] {
  const timeline = generateVisibilityTimeline(ephemeris, observer);

  // Filter to points after startDate
  const futureTimeline = timeline.filter(
    (status) => status.datetime >= startDate
  );

  const windows: VisibilityWindow[] = [];
  let windowStart: Date | null = null;
  let maxAltitude = -90;

  for (let i = 1; i < futureTimeline.length; i++) {
    const prev = futureTimeline[i - 1];
    const curr = futureTimeline[i];

    // Window starts (object rises)
    if (!prev.isVisible && curr.isVisible) {
      windowStart = curr.datetime;
      maxAltitude = curr.apparentAltitude;
    }

    // Track max altitude during window
    if (curr.isVisible && curr.apparentAltitude > maxAltitude) {
      maxAltitude = curr.apparentAltitude;
    }

    // Window ends (object sets)
    if (prev.isVisible && !curr.isVisible && windowStart) {
      const duration = (prev.datetime.getTime() - windowStart.getTime()) / (1000 * 60);
      const quality = assessVisibilityQuality(maxAltitude);

      windows.push({
        start: windowStart,
        end: prev.datetime,
        duration,
        maxAltitude,
        quality,
      });

      windowStart = null;
      maxAltitude = -90;

      if (windows.length >= count) break;
    }
  }

  // Handle case where object is currently visible and stays visible
  if (windowStart && futureTimeline.length > 0) {
    const lastPoint = futureTimeline[futureTimeline.length - 1];
    const duration = (lastPoint.datetime.getTime() - windowStart.getTime()) / (1000 * 60);
    const quality = assessVisibilityQuality(maxAltitude);

    windows.push({
      start: windowStart,
      end: lastPoint.datetime,
      duration,
      maxAltitude,
      quality,
    });
  }

  return windows.slice(0, count);
}

/**
 * Calculate percentage of time object is visible over a period
 *
 * @param ephemeris - Array of ephemeris points
 * @param observer - Observer's geographic location
 * @returns Percentage (0-100)
 */
export function calculateVisibilityPercentage(
  ephemeris: EphemerisPoint[],
  observer: ObserverLocation
): number {
  const timeline = generateVisibilityTimeline(ephemeris, observer);

  if (timeline.length === 0) return 0;

  const visibleCount = timeline.filter((t) => t.isVisible).length;
  return (visibleCount / timeline.length) * 100;
}

/**
 * Find best observation time (highest altitude)
 *
 * @param ephemeris - Array of ephemeris points
 * @param observer - Observer's geographic location
 * @param startDate - Start searching from this date (default: now)
 * @returns Best observation time and details
 */
export function findBestObservationTime(
  ephemeris: EphemerisPoint[],
  observer: ObserverLocation,
  startDate: Date = new Date()
): VisibilityStatus | null {
  const timeline = generateVisibilityTimeline(ephemeris, observer);

  // Filter to visible points after startDate
  const visiblePoints = timeline.filter(
    (status) => status.isVisible && status.datetime >= startDate
  );

  if (visiblePoints.length === 0) return null;

  // Find point with highest altitude
  let best = visiblePoints[0];
  for (const point of visiblePoints) {
    if (point.apparentAltitude > best.apparentAltitude) {
      best = point;
    }
  }

  return best;
}

/**
 * Assess visibility quality based on altitude and magnitude
 *
 * @param altitude - Altitude in degrees
 * @param magnitude - Apparent magnitude (optional)
 * @returns Visibility quality rating
 */
export function assessVisibilityQuality(
  altitude: number,
  magnitude?: number
): VisibilityQuality {
  if (altitude < 0) {
    return 'not_visible';
  }

  // Consider magnitude if provided
  if (magnitude !== undefined) {
    // Magnitude scale: lower = brighter
    // Naked eye limit ~6.0, excellent visibility <3.0
    if (magnitude > 10) {
      // Very faint, needs large telescope
      return altitude > 60 ? 'fair' : 'poor';
    } else if (magnitude > 6) {
      // Needs telescope/binoculars
      return altitude > 60 ? 'good' : altitude > 30 ? 'fair' : 'poor';
    } else if (magnitude > 3) {
      // Visible to naked eye in dark sky
      return altitude > 60 ? 'excellent' : altitude > 30 ? 'good' : 'fair';
    } else {
      // Bright, easy to see
      return altitude > 45 ? 'excellent' : altitude > 20 ? 'good' : 'fair';
    }
  }

  // Altitude-only assessment (no magnitude data)
  if (altitude > 60) {
    return 'excellent'; // Near zenith, minimal atmospheric interference
  } else if (altitude > 45) {
    return 'good'; // High in sky, good conditions
  } else if (altitude > 20) {
    return 'fair'; // Moderate altitude, some atmospheric effects
  } else {
    return 'poor'; // Low on horizon, significant atmospheric interference
  }
}

/**
 * Generate complete visibility forecast
 *
 * @param ephemeris - Array of ephemeris points (recommend 30 days)
 * @param observer - Observer's geographic location
 * @returns Complete visibility forecast
 */
export function generateVisibilityForecast(
  ephemeris: EphemerisPoint[],
  observer: ObserverLocation
): VisibilityForecast {
  const currentStatus = calculateCurrentVisibility(
    ephemeris[0],
    observer
  );

  const { nextRise, nextSet } = findNextRiseSet(ephemeris, observer);
  const upcomingWindows = findVisibilityWindows(ephemeris, observer, 5);
  const visibilityPercentage = calculateVisibilityPercentage(ephemeris, observer);

  return {
    currentStatus,
    nextRise,
    nextSet,
    upcomingWindows,
    visibilityPercentage,
  };
}

/**
 * Format visibility quality for display
 *
 * @param quality - Visibility quality rating
 * @returns Human-readable description
 */
export function formatVisibilityQuality(quality: VisibilityQuality): string {
  const descriptions = {
    excellent: 'Excellent viewing conditions',
    good: 'Good viewing conditions',
    fair: 'Fair viewing conditions',
    poor: 'Poor viewing conditions (low on horizon)',
    not_visible: 'Not visible (below horizon)',
  };

  return descriptions[quality];
}

/**
 * Calculate geographic visibility (which latitudes can see the object)
 *
 * @param declination - Object's declination in degrees
 * @returns Latitude range where object is visible
 */
export function calculateGeographicVisibility(
  declination: number
): { minLatitude: number; maxLatitude: number; alwaysVisible?: { minLat: number; maxLat: number } } {
  // Object is circumpolar (always above horizon) within this range:
  // Latitude > 90° - declination (northern circumpolar)
  // Latitude < -(90° - declination) (southern circumpolar)

  // Object is visible (rises and sets) between:
  // -90° + declination to 90° - declination

  const minLatitude = Math.max(-90, declination - 90);
  const maxLatitude = Math.min(90, declination + 90);

  // Circumpolar regions (if applicable)
  let alwaysVisible: { minLat: number; maxLat: number } | undefined;

  if (declination > 0) {
    // Northern object - circumpolar in far north
    const minCircumpolarLat = 90 - declination;
    if (minCircumpolarLat < 90) {
      alwaysVisible = { minLat: minCircumpolarLat, maxLat: 90 };
    }
  } else if (declination < 0) {
    // Southern object - circumpolar in far south
    const maxCircumpolarLat = -90 - declination;
    if (maxCircumpolarLat > -90) {
      alwaysVisible = { minLat: -90, maxLat: maxCircumpolarLat };
    }
  }

  return { minLatitude, maxLatitude, alwaysVisible };
}
