// apps/web/workers/visibility.worker.ts
import type { EphemerisPoint } from '../lib/nasa/horizons-api';
import type { ObserverLocation } from '../lib/astronomy/coordinates';
import type {
  VisibilityForecast,
  VisibilityStatus,
  VisibilityWindow
} from '../lib/astronomy/visibility';

// Import coordinate transformation utilities
// These need to be worker-compatible (no DOM dependencies)
interface AltAzCoordinates {
  altitude: number;
  azimuth: number;
  airmass: number;
}

// Coordinate transformation function (copied from coordinates.ts for worker context)
function raDecToAltAz(
  ra: number,
  dec: number,
  latitude: number,
  longitude: number,
  datetime: Date
): AltAzCoordinates {
  // Convert RA/Dec to Alt/Az using spherical trigonometry
  const degToRad = Math.PI / 180;
  const radToDeg = 180 / Math.PI;

  // Calculate Local Sidereal Time
  const J2000 = new Date('2000-01-01T12:00:00Z').getTime();
  const daysSinceJ2000 = (datetime.getTime() - J2000) / (1000 * 60 * 60 * 24);
  const LST = (100.46 + 0.985647 * daysSinceJ2000 + longitude + 15 * datetime.getUTCHours()) % 360;

  // Hour Angle
  const HA = (LST - ra + 360) % 360;

  // Convert to radians
  const HArad = HA * degToRad;
  const decRad = dec * degToRad;
  const latRad = latitude * degToRad;

  // Calculate altitude
  const sinAlt = Math.sin(decRad) * Math.sin(latRad) +
                 Math.cos(decRad) * Math.cos(latRad) * Math.cos(HArad);
  const altitude = Math.asin(sinAlt) * radToDeg;

  // Calculate azimuth
  const cosAz = (Math.sin(decRad) - Math.sin(latRad) * sinAlt) /
                (Math.cos(latRad) * Math.cos(Math.asin(sinAlt)));
  let azimuth = Math.acos(Math.max(-1, Math.min(1, cosAz))) * radToDeg;

  if (Math.sin(HArad) > 0) {
    azimuth = 360 - azimuth;
  }

  // Calculate airmass (Pickering 2002 formula)
  const zenithAngle = 90 - altitude;
  let airmass: number;
  if (altitude < 0) {
    airmass = Infinity;
  } else if (altitude > 85) {
    airmass = 1 / Math.cos(zenithAngle * degToRad);
  } else {
    airmass = 1 / Math.sin((altitude + 244 / (165 + 47 * Math.pow(altitude, 1.1))) * degToRad);
  }

  return { altitude, azimuth, airmass };
}

// Worker message types
type WorkerRequest = {
  type: 'CALCULATE_VISIBILITY';
  payload: {
    ephemeris: EphemerisPoint[];
    location: ObserverLocation;
    days: number;
  };
} | {
  type: 'CALCULATE_CURRENT_STATUS';
  payload: {
    ephemeris: EphemerisPoint[];
    location: ObserverLocation;
    datetime: string;
  };
};

type WorkerResponse = {
  type: 'VISIBILITY_RESULT';
  payload: VisibilityForecast;
} | {
  type: 'STATUS_RESULT';
  payload: VisibilityStatus;
} | {
  type: 'ERROR';
  payload: { message: string };
} | {
  type: 'PROGRESS';
  payload: { processed: number; total: number };
};

// Calculate current visibility status
function calculateCurrentStatus(
  ephemeris: EphemerisPoint[],
  location: ObserverLocation,
  datetime: Date
): VisibilityStatus {
  // Find closest ephemeris point
  const targetTime = datetime.getTime();
  let closestPoint = ephemeris[0];
  let minDiff = Math.abs(new Date(closestPoint.calendar_date).getTime() - targetTime);

  for (const point of ephemeris) {
    const diff = Math.abs(new Date(point.calendar_date).getTime() - targetTime);
    if (diff < minDiff) {
      minDiff = diff;
      closestPoint = point;
    }
  }

  // Calculate alt/az
  const coords = raDecToAltAz(
    closestPoint.ra,
    closestPoint.dec,
    location.latitude,
    location.longitude,
    datetime
  );

  // Determine observability
  const isVisible = coords.altitude > 20; // Above 20° altitude
  const isDaytime = false; // Simplified - would need sun position
  const isMoonUp = false; // Simplified - would need moon position

  let quality: 'excellent' | 'good' | 'fair' | 'poor';
  if (coords.airmass < 1.5 && !isDaytime && !isMoonUp) {
    quality = 'excellent';
  } else if (coords.airmass < 2.0 && !isDaytime) {
    quality = 'good';
  } else if (coords.airmass < 3.0) {
    quality = 'fair';
  } else {
    quality = 'poor';
  }

  return {
    isVisible,
    altitude: coords.altitude,
    azimuth: coords.azimuth,
    apparentAltitude: coords.altitude, // Simplified - same as geometric altitude
    quality,
    datetime
  };
}

// Calculate visibility windows
function calculateVisibilityWindows(
  ephemeris: EphemerisPoint[],
  location: ObserverLocation,
  days: number
): VisibilityForecast {
  const windows: VisibilityWindow[] = [];
  const now = new Date();
  const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  let currentWindow: VisibilityWindow | null = null;
  let pointsProcessed = 0;

  for (const point of ephemeris) {
    const datetime = new Date(point.calendar_date);
    if (datetime < now || datetime > endDate) continue;

    const coords = raDecToAltAz(
      point.ra,
      point.dec,
      location.latitude,
      location.longitude,
      datetime
    );

    const isVisible = coords.altitude > 20;

    if (isVisible && !currentWindow) {
      // Start new window
      currentWindow = {
        start: datetime,
        end: datetime,
        maxAltitude: coords.altitude,
        quality: coords.airmass < 2 ? 'good' : 'fair',
        duration: 0 // Will be calculated when window ends
      };
    } else if (isVisible && currentWindow) {
      // Extend window
      currentWindow.end = datetime;
      if (coords.altitude > currentWindow.maxAltitude) {
        currentWindow.maxAltitude = coords.altitude;
      }
    } else if (!isVisible && currentWindow) {
      // End window - calculate duration in minutes
      const durationMs = currentWindow.end.getTime() - currentWindow.start.getTime();
      currentWindow.duration = Math.round(durationMs / (1000 * 60));
      windows.push(currentWindow);
      currentWindow = null;
    }

    // Report progress every 10%
    pointsProcessed++;
    if (pointsProcessed % Math.ceil(ephemeris.length / 10) === 0) {
      self.postMessage({
        type: 'PROGRESS',
        payload: { processed: pointsProcessed, total: ephemeris.length }
      } as WorkerResponse);
    }
  }

  // Add final window if still open
  if (currentWindow) {
    const durationMs = currentWindow.end.getTime() - currentWindow.start.getTime();
    currentWindow.duration = Math.round(durationMs / (1000 * 60));
    windows.push(currentWindow);
  }

  // Calculate visibility percentage (% of time object is visible)
  const totalTime = endDate.getTime() - now.getTime();
  const visibleTime = windows.reduce((sum, w) => sum + w.duration * 60 * 1000, 0);
  const visibilityPercentage = totalTime > 0 ? (visibleTime / totalTime) * 100 : 0;

  // Determine next rise/set times (simplified)
  const nextRise = windows.length > 0 && !windows[0] ? windows[0].start : null;
  const nextSet = windows.length > 0 ? windows[0].end : null;

  // Get current status (use first ephemeris point as approximation)
  const currentStatus = calculateCurrentStatus(ephemeris, location, now);

  return {
    currentStatus,
    nextRise,
    nextSet,
    upcomingWindows: windows,
    visibilityPercentage
  };
}

// Message handler
self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  try {
    const { type, payload } = e.data;

    if (type === 'CALCULATE_CURRENT_STATUS') {
      const datetime = new Date(payload.datetime);
      const status = calculateCurrentStatus(
        payload.ephemeris,
        payload.location,
        datetime
      );

      self.postMessage({
        type: 'STATUS_RESULT',
        payload: status
      } as WorkerResponse);

    } else if (type === 'CALCULATE_VISIBILITY') {
      const forecast = calculateVisibilityWindows(
        payload.ephemeris,
        payload.location,
        payload.days
      );

      self.postMessage({
        type: 'VISIBILITY_RESULT',
        payload: forecast
      } as WorkerResponse);
    }

  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      payload: {
        message: error instanceof Error ? error.message : 'Unknown error in visibility worker'
      }
    } as WorkerResponse);
  }
};

// Handle worker termination
self.onerror = (event) => {
  const errorMessage = typeof event === 'string'
    ? event
    : (event as ErrorEvent).message || 'Unknown worker error';
  self.postMessage({
    type: 'ERROR',
    payload: { message: `Worker error: ${errorMessage}` }
  } as WorkerResponse);
};
