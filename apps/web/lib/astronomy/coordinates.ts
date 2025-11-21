/**
 * Astronomical Coordinate Transformations
 *
 * Converts between celestial coordinates (RA/Dec) and horizontal coordinates (Alt/Az)
 * for a given observer location and time.
 *
 * Reference: Meeus, J. (1998). Astronomical Algorithms. Willmann-Bell.
 */

export interface ObserverLocation {
  latitude: number;   // degrees, positive north
  longitude: number;  // degrees, positive east
  elevation?: number; // meters above sea level (optional, for refraction)
}

export interface CelestialPosition {
  rightAscension: number;  // hours (0-24)
  declination: number;     // degrees (-90 to +90)
}

export interface HorizontalPosition {
  altitude: number;  // degrees above horizon (-90 to +90)
  azimuth: number;   // degrees from north (0-360)
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * Math.PI / 180;
}

/**
 * Convert radians to degrees
 */
function toDegrees(radians: number): number {
  return radians * 180 / Math.PI;
}

/**
 * Normalize angle to 0-360 range
 */
function normalizeAngle(degrees: number): number {
  let normalized = degrees % 360;
  if (normalized < 0) normalized += 360;
  return normalized;
}

/**
 * Calculate Greenwich Mean Sidereal Time (GMST) in hours
 *
 * @param datetime - JavaScript Date object (UTC)
 * @returns GMST in hours (0-24)
 */
export function calculateGMST(datetime: Date): number {
  // Julian Date calculation
  const year = datetime.getUTCFullYear();
  const month = datetime.getUTCMonth() + 1;
  const day = datetime.getUTCDate();
  const hour = datetime.getUTCHours();
  const minute = datetime.getUTCMinutes();
  const second = datetime.getUTCSeconds();

  // Convert calendar date to Julian Date
  let a = Math.floor((14 - month) / 12);
  let y = year + 4800 - a;
  let m = month + 12 * a - 3;

  let jdn = day + Math.floor((153 * m + 2) / 5) + 365 * y +
            Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;

  let jd = jdn + (hour - 12) / 24 + minute / 1440 + second / 86400;

  // Calculate GMST using IAU formula
  const T = (jd - 2451545.0) / 36525.0;  // Julian centuries since J2000.0

  // GMST at 0h UT
  let gmst0 = 280.46061837 + 360.98564736629 * (jd - 2451545.0) +
              0.000387933 * T * T - T * T * T / 38710000.0;

  gmst0 = normalizeAngle(gmst0);

  // Convert to hours
  return gmst0 / 15.0;
}

/**
 * Calculate Local Sidereal Time (LST) in hours
 *
 * @param observerLongitude - Observer's longitude in degrees (positive east)
 * @param datetime - JavaScript Date object (UTC)
 * @returns LST in hours (0-24)
 */
export function calculateLocalSiderealTime(
  observerLongitude: number,
  datetime: Date
): number {
  const gmst = calculateGMST(datetime);
  const lst = gmst + observerLongitude / 15.0;

  // Normalize to 0-24 range
  let normalized = lst % 24;
  if (normalized < 0) normalized += 24;

  return normalized;
}

/**
 * Convert celestial coordinates (RA/Dec) to horizontal coordinates (Alt/Az)
 *
 * @param celestial - Right Ascension (hours) and Declination (degrees)
 * @param observer - Observer's geographic location
 * @param datetime - Observation time (UTC)
 * @returns Altitude and Azimuth in degrees
 */
export function raDecToAltAz(
  celestial: CelestialPosition,
  observer: ObserverLocation,
  datetime: Date
): HorizontalPosition {
  // Calculate Local Sidereal Time
  const lst = calculateLocalSiderealTime(observer.longitude, datetime);

  // Calculate Hour Angle (LST - RA, in hours)
  let hourAngle = lst - celestial.rightAscension;

  // Convert to degrees
  hourAngle = hourAngle * 15.0;

  // Convert to radians for calculations
  const ha = toRadians(hourAngle);
  const dec = toRadians(celestial.declination);
  const lat = toRadians(observer.latitude);

  // Calculate altitude using spherical trigonometry
  // sin(alt) = sin(dec) × sin(lat) + cos(dec) × cos(lat) × cos(HA)
  const sinAlt = Math.sin(dec) * Math.sin(lat) +
                 Math.cos(dec) * Math.cos(lat) * Math.cos(ha);

  const altitude = toDegrees(Math.asin(sinAlt));

  // Calculate azimuth
  // cos(az) = (sin(dec) - sin(alt) × sin(lat)) / (cos(alt) × cos(lat))
  const cosAz = (Math.sin(dec) - Math.sin(toRadians(altitude)) * Math.sin(lat)) /
                (Math.cos(toRadians(altitude)) * Math.cos(lat));

  // sin(az) = -cos(dec) × sin(HA) / cos(alt)
  const sinAz = -Math.cos(dec) * Math.sin(ha) / Math.cos(toRadians(altitude));

  // Use atan2 to get correct quadrant
  let azimuth = toDegrees(Math.atan2(sinAz, cosAz));

  // Normalize to 0-360 (measured from North, clockwise)
  azimuth = normalizeAngle(azimuth);

  return { altitude, azimuth };
}

/**
 * Apply atmospheric refraction correction to altitude
 *
 * Uses Bennett's empirical formula for refraction.
 * Valid for altitudes above -1 degree.
 *
 * @param altitude - Observed altitude in degrees
 * @param temperature - Temperature in Celsius (optional, default 10°C)
 * @param pressure - Atmospheric pressure in millibars (optional, default 1010 mb)
 * @returns Corrected altitude in degrees
 */
export function applyRefraction(
  altitude: number,
  temperature: number = 10,
  pressure: number = 1010
): number {
  if (altitude < -1) {
    // Refraction formula unreliable below horizon
    return altitude;
  }

  // Bennett's formula (in arcminutes)
  const h = altitude + 7.31 / (altitude + 4.4);
  let R = 1.0 / Math.tan(toRadians(h));

  // Correction for temperature and pressure
  R = R * (pressure / 1010) * (283 / (273 + temperature));

  // Convert from arcminutes to degrees
  R = R / 60.0;

  return altitude + R;
}

/**
 * Check if an object is above the horizon
 *
 * @param altitude - Altitude in degrees
 * @param minAltitude - Minimum altitude to consider "visible" (default 0°)
 * @returns true if object is above the minimum altitude
 */
export function isAboveHorizon(altitude: number, minAltitude: number = 0): boolean {
  return altitude >= minAltitude;
}

/**
 * Calculate angular separation between two celestial positions
 *
 * @param pos1 - First position (RA in hours, Dec in degrees)
 * @param pos2 - Second position (RA in hours, Dec in degrees)
 * @returns Angular separation in degrees
 */
export function angularSeparation(
  pos1: CelestialPosition,
  pos2: CelestialPosition
): number {
  const ra1 = toRadians(pos1.rightAscension * 15);
  const dec1 = toRadians(pos1.declination);
  const ra2 = toRadians(pos2.rightAscension * 15);
  const dec2 = toRadians(pos2.declination);

  // Haversine formula
  const dra = ra2 - ra1;
  const ddec = dec2 - dec1;

  const a = Math.sin(ddec / 2) ** 2 +
            Math.cos(dec1) * Math.cos(dec2) * Math.sin(dra / 2) ** 2;

  const c = 2 * Math.asin(Math.sqrt(a));

  return toDegrees(c);
}

/**
 * Format altitude/azimuth for display
 *
 * @param horizontal - Altitude and azimuth coordinates
 * @returns Formatted string
 */
export function formatHorizontal(horizontal: HorizontalPosition): string {
  const altDeg = Math.floor(horizontal.altitude);
  const altMin = Math.floor((horizontal.altitude - altDeg) * 60);

  const azDeg = Math.floor(horizontal.azimuth);

  // Convert azimuth to cardinal direction
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                     'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(horizontal.azimuth / 22.5) % 16;
  const direction = directions[index];

  return `Alt: ${altDeg}° ${altMin}', Az: ${azDeg}° (${direction})`;
}
