/**
 * Visibility Calculations Web Worker
 *
 * Performs heavy visibility calculations off the main thread to prevent UI blocking.
 * Includes coordinate transformation and visibility window finding algorithms.
 */

// Type definitions (replicated here since workers can't import modules)
interface ObserverLocation {
  latitude: number;
  longitude: number;
  elevation?: number;
}

interface EphemerisPoint {
  datetime: string | Date;
  ra: number;
  dec: number;
  delta?: number;
  mag?: number;
}

interface VisibilityStatus {
  isVisible: boolean;
  altitude: number;
  azimuth: number;
  apparentAltitude: number;
  quality: VisibilityQuality;
  datetime: Date;
}

interface VisibilityWindow {
  start: Date;
  end: Date;
  duration: number;
  maxAltitude: number;
  quality: VisibilityQuality;
}

interface VisibilityForecast {
  currentStatus: VisibilityStatus;
  nextRise: Date | null;
  nextSet: Date | null;
  upcomingWindows: VisibilityWindow[];
  visibilityPercentage: number;
}

type VisibilityQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'not_visible';

// Worker message types
interface WorkerRequest {
  type: 'calculateForecast' | 'calculateStatus' | 'findWindows';
  ephemeris: EphemerisPoint[];
  observer: ObserverLocation;
  options?: {
    windowCount?: number;
    startDate?: string;
  };
}

interface WorkerResponse {
  type: 'progress' | 'status' | 'windows' | 'forecast' | 'error';
  progress?: number;
  data?: VisibilityStatus | VisibilityWindow[] | VisibilityForecast;
  error?: string;
}

// =========================
// Math Utilities
// =========================

function toRadians(degrees: number): number {
  return degrees * Math.PI / 180;
}

function toDegrees(radians: number): number {
  return radians * 180 / Math.PI;
}

function normalizeAngle(degrees: number): number {
  let normalized = degrees % 360;
  if (normalized < 0) normalized += 360;
  return normalized;
}

// =========================
// Coordinate Transformations
// =========================

function calculateGMST(datetime: Date): number {
  const year = datetime.getUTCFullYear();
  const month = datetime.getUTCMonth() + 1;
  const day = datetime.getUTCDate();
  const hour = datetime.getUTCHours();
  const minute = datetime.getUTCMinutes();
  const second = datetime.getUTCSeconds();

  let a = Math.floor((14 - month) / 12);
  let y = year + 4800 - a;
  let m = month + 12 * a - 3;

  let jdn = day + Math.floor((153 * m + 2) / 5) + 365 * y +
            Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;

  let jd = jdn + (hour - 12) / 24 + minute / 1440 + second / 86400;

  const T = (jd - 2451545.0) / 36525.0;

  let gmst0 = 280.46061837 + 360.98564736629 * (jd - 2451545.0) +
              0.000387933 * T * T - T * T * T / 38710000.0;

  gmst0 = normalizeAngle(gmst0);
  return gmst0 / 15.0;
}

function calculateLocalSiderealTime(observerLongitude: number, datetime: Date): number {
  const gmst = calculateGMST(datetime);
  const lst = gmst + observerLongitude / 15.0;
  let normalized = lst % 24;
  if (normalized < 0) normalized += 24;
  return normalized;
}

function raDecToAltAz(
  ra: number,
  dec: number,
  observer: ObserverLocation,
  datetime: Date
): { altitude: number; azimuth: number } {
  const lst = calculateLocalSiderealTime(observer.longitude, datetime);
  let hourAngle = (lst - ra) * 15.0;

  const ha = toRadians(hourAngle);
  const decRad = toRadians(dec);
  const lat = toRadians(observer.latitude);

  const sinAlt = Math.sin(decRad) * Math.sin(lat) +
                 Math.cos(decRad) * Math.cos(lat) * Math.cos(ha);
  const altitude = toDegrees(Math.asin(sinAlt));

  const cosAz = (Math.sin(decRad) - Math.sin(toRadians(altitude)) * Math.sin(lat)) /
                (Math.cos(toRadians(altitude)) * Math.cos(lat));
  const sinAz = -Math.cos(decRad) * Math.sin(ha) / Math.cos(toRadians(altitude));

  let azimuth = toDegrees(Math.atan2(sinAz, cosAz));
  azimuth = normalizeAngle(azimuth);

  return { altitude, azimuth };
}

function applyRefraction(altitude: number): number {
  if (altitude < -1) return altitude;

  const h = altitude + 7.31 / (altitude + 4.4);
  let R = 1.0 / Math.tan(toRadians(h));
  R = R * (1010 / 1010) * (283 / 283); // Standard conditions
  R = R / 60.0;

  return altitude + R;
}

// =========================
// Visibility Calculations
// =========================

function assessVisibilityQuality(altitude: number, magnitude?: number): VisibilityQuality {
  if (altitude < 0) return 'not_visible';

  if (magnitude !== undefined) {
    if (magnitude > 10) {
      return altitude > 60 ? 'fair' : 'poor';
    } else if (magnitude > 6) {
      return altitude > 60 ? 'good' : altitude > 30 ? 'fair' : 'poor';
    } else if (magnitude > 3) {
      return altitude > 60 ? 'excellent' : altitude > 30 ? 'good' : 'fair';
    } else {
      return altitude > 45 ? 'excellent' : altitude > 20 ? 'good' : 'fair';
    }
  }

  if (altitude > 60) return 'excellent';
  if (altitude > 45) return 'good';
  if (altitude > 20) return 'fair';
  return 'poor';
}

function calculateVisibilityStatus(
  ephemeris: EphemerisPoint,
  observer: ObserverLocation,
  datetime: Date
): VisibilityStatus {
  const horizontal = raDecToAltAz(ephemeris.ra, ephemeris.dec, observer, datetime);
  const apparentAltitude = applyRefraction(horizontal.altitude);
  const visible = apparentAltitude >= 0;
  const quality = assessVisibilityQuality(apparentAltitude, ephemeris.mag);

  return {
    isVisible: visible,
    altitude: horizontal.altitude,
    azimuth: horizontal.azimuth,
    apparentAltitude,
    quality,
    datetime,
  };
}

function generateVisibilityTimeline(
  ephemeris: EphemerisPoint[],
  observer: ObserverLocation,
  onProgress?: (progress: number) => void
): VisibilityStatus[] {
  const results: VisibilityStatus[] = [];
  const total = ephemeris.length;

  for (let i = 0; i < total; i++) {
    const point = ephemeris[i];
    const datetime = typeof point.datetime === 'string'
      ? new Date(point.datetime)
      : point.datetime;

    results.push(calculateVisibilityStatus(point, observer, datetime));

    // Report progress every 10%
    if (onProgress && i % Math.ceil(total / 10) === 0) {
      onProgress(Math.round((i / total) * 50)); // Timeline is 50% of work
    }
  }

  return results;
}

function findVisibilityWindows(
  timeline: VisibilityStatus[],
  count: number,
  startDate: Date,
  onProgress?: (progress: number) => void
): VisibilityWindow[] {
  const futureTimeline = timeline.filter(status => status.datetime >= startDate);
  const windows: VisibilityWindow[] = [];
  let windowStart: Date | null = null;
  let maxAltitude = -90;

  for (let i = 1; i < futureTimeline.length; i++) {
    const prev = futureTimeline[i - 1];
    const curr = futureTimeline[i];

    if (!prev.isVisible && curr.isVisible) {
      windowStart = curr.datetime;
      maxAltitude = curr.apparentAltitude;
    }

    if (curr.isVisible && curr.apparentAltitude > maxAltitude) {
      maxAltitude = curr.apparentAltitude;
    }

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

    // Report progress
    if (onProgress && i % Math.ceil(futureTimeline.length / 10) === 0) {
      onProgress(50 + Math.round((i / futureTimeline.length) * 40)); // Windows is 40% of work
    }
  }

  // Handle ongoing visibility window
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

function findNextRiseSet(
  timeline: VisibilityStatus[],
  startDate: Date
): { nextRise: Date | null; nextSet: Date | null } {
  const futureTimeline = timeline.filter(status => status.datetime >= startDate);

  let nextRise: Date | null = null;
  let nextSet: Date | null = null;

  for (let i = 1; i < futureTimeline.length; i++) {
    const prev = futureTimeline[i - 1];
    const curr = futureTimeline[i];

    if (!prev.isVisible && curr.isVisible && !nextRise) {
      nextRise = curr.datetime;
    }

    if (prev.isVisible && !curr.isVisible && !nextSet) {
      nextSet = curr.datetime;
    }

    if (nextRise && nextSet) break;
  }

  return { nextRise, nextSet };
}

function calculateVisibilityPercentage(timeline: VisibilityStatus[]): number {
  if (timeline.length === 0) return 0;
  const visibleCount = timeline.filter(t => t.isVisible).length;
  return (visibleCount / timeline.length) * 100;
}

// =========================
// Worker Message Handler
// =========================

self.onmessage = function(event: MessageEvent<WorkerRequest>) {
  const { type, ephemeris, observer, options } = event.data;

  const postProgress = (progress: number) => {
    self.postMessage({ type: 'progress', progress } as WorkerResponse);
  };

  try {
    const startDate = options?.startDate ? new Date(options.startDate) : new Date();

    switch (type) {
      case 'calculateStatus': {
        if (ephemeris.length === 0) {
          throw new Error('No ephemeris data provided');
        }
        const status = calculateVisibilityStatus(ephemeris[0], observer, new Date());
        self.postMessage({ type: 'status', data: status } as WorkerResponse);
        break;
      }

      case 'findWindows': {
        postProgress(0);
        const timeline = generateVisibilityTimeline(ephemeris, observer, postProgress);
        const windows = findVisibilityWindows(
          timeline,
          options?.windowCount || 5,
          startDate,
          postProgress
        );
        postProgress(100);
        self.postMessage({ type: 'windows', data: windows } as WorkerResponse);
        break;
      }

      case 'calculateForecast': {
        postProgress(0);

        // Generate timeline (50% of work)
        const timeline = generateVisibilityTimeline(ephemeris, observer, postProgress);
        postProgress(50);

        // Current status (immediate)
        const currentStatus = timeline[0] || calculateVisibilityStatus(
          ephemeris[0],
          observer,
          new Date()
        );
        self.postMessage({ type: 'status', data: currentStatus } as WorkerResponse);

        // Find windows (40% of work)
        const upcomingWindows = findVisibilityWindows(
          timeline,
          options?.windowCount || 5,
          startDate,
          postProgress
        );
        postProgress(90);

        // Rise/set times
        const { nextRise, nextSet } = findNextRiseSet(timeline, startDate);

        // Visibility percentage
        const visibilityPercentage = calculateVisibilityPercentage(timeline);
        postProgress(100);

        const forecast: VisibilityForecast = {
          currentStatus,
          nextRise,
          nextSet,
          upcomingWindows,
          visibilityPercentage,
        };

        self.postMessage({ type: 'forecast', data: forecast } as WorkerResponse);
        break;
      }

      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    } as WorkerResponse);
  }
};

// Export for TypeScript (won't actually be used in worker context)
export {};
