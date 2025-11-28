/**
 * NASA JPL Horizons API Client
 *
 * Fetches ephemeris data and orbital elements for interstellar objects
 * from the NASA JPL Horizons system.
 *
 * API Documentation: https://ssd-api.jpl.nasa.gov/doc/horizons.html
 */

export interface EphemerisPoint {
  datetime_jd: string;       // Julian Date
  calendar_date: string;      // ISO 8601 date string
  ra: number;                 // Right Ascension (degrees)
  dec: number;                // Declination (degrees)
  delta: number;              // Distance from observer (AU)
  deldot: number;             // Range rate (km/s)
  mag: number | null;         // Visual magnitude
  phase_angle: number | null; // Sun-Object-Observer angle (degrees)
}

export interface OrbitalElements {
  eccentricity: number;       // e
  perihelion_distance: number; // q (AU)
  inclination: number;        // i (degrees)
  ascending_node: number;     // Ω (degrees)
  arg_perihelion: number;     // ω (degrees)
  perihelion_time: string;    // Time of perihelion passage
}

export interface HorizonsResponse {
  ephemeris: EphemerisPoint[];
  orbital_elements?: OrbitalElements;
  object_id: string;
  cached: boolean;
}

/**
 * NASA Horizons object IDs for known interstellar objects
 * Using official NASA JPL Horizons designations (verified working)
 */
export const ISO_HORIZONS_IDS: Record<string, string> = {
  "1I/'Oumuamua": '1I',  // Full designation: 1I/'Oumuamua (A/2017 U1), SPK-ID: 3788040
  '2I/Borisov': '2I',    // Full designation: 2I/Borisov (C/2019 Q4), SPK-ID: 1003639
  '3I/ATLAS': '3I',      // Full designation: 3I/ATLAS (C/2025 N1), SPK-ID: 1004083
};

/**
 * Fetch ephemeris data from NASA Horizons API
 *
 * @param objectId - NASA Horizons object identifier (e.g., "DES=2017001")
 * @param startDate - Start date for ephemeris (ISO 8601)
 * @param endDate - End date for ephemeris (ISO 8601)
 * @param stepSize - Time step between data points (default: "1d" for 1 day)
 * @returns Promise with ephemeris data points
 */
export async function fetchEphemeris(
  objectId: string,
  startDate: Date,
  endDate: Date,
  stepSize: string = '1d'
): Promise<EphemerisPoint[]> {
  // Validate date range (max 90 days)
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff > 90) {
    throw new Error('Date range cannot exceed 90 days');
  }

  // Format dates for NASA API (YYYY-MM-DD)
  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];

  // Build NASA Horizons API query with manual parameter construction
  // NASA API requires quoting for COMMAND and QUANTITIES parameters
  const params: Record<string, string> = {
    format: 'json',
    COMMAND: `'${objectId}'`, // Quote the object ID
    OBJ_DATA: 'NO',
    MAKE_EPHEM: 'YES',
    EPHEM_TYPE: 'OBSERVER',
    CENTER: '500@399', // Geocentric (Earth center)
    START_TIME: startStr,
    STOP_TIME: endStr,
    STEP_SIZE: stepSize,
    QUANTITIES: "'1,20'", // Quote quantities: RA/Dec + range/range-rate
    CAL_FORMAT: 'CAL',
    TIME_DIGITS: 'MINUTES',
    ANG_FORMAT: 'DEG',
    APPARENT: 'AIRLESS',
    RANGE_UNITS: 'AU',
    SUPPRESS_RANGE_RATE: 'NO',
    SKIP_DAYLT: 'NO',
    EXTRA_PREC: 'NO',
    R_T_S_ONLY: 'NO',
    REF_SYSTEM: 'ICRF',
    CSV_FORMAT: 'YES',
  };

  // Manually construct query string to preserve quotes
  const queryString = Object.entries(params)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  const url = `https://ssd.jpl.nasa.gov/api/horizons.api?${queryString}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 604800 }, // Cache for 7 days (604800 seconds)
    });

    if (!response.ok) {
      throw new Error(`NASA Horizons API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Check for API errors
    if (data.error) {
      throw new Error(`NASA Horizons API error: ${data.error}`);
    }

    // Parse ephemeris data from response
    const ephemeris = parseEphemerisData(data.result);

    return ephemeris;
  } catch (error) {
    console.error('Error fetching NASA Horizons data:', error);
    throw error;
  }
}

/**
 * Parse ephemeris data from NASA Horizons API response
 *
 * The response format includes a header followed by data lines between
 * $$SOE (Start of Ephemeris) and $$EOE (End of Ephemeris) markers.
 *
 * CSV format with QUANTITIES='1,20':
 * Column 0: Date (e.g., "2025-Oct-20 00:00")
 * Columns 1-2: Empty separators
 * Column 3: RA in degrees
 * Column 4: DEC in degrees
 * Column 5: Delta (range in AU)
 * Column 6: Deldot (range rate in km/s)
 */
function parseEphemerisData(resultText: string): EphemerisPoint[] {
  const lines = resultText.split('\n');

  // Find ephemeris data section between $$SOE and $$EOE
  const startIdx = lines.findIndex(line => line.includes('$$SOE'));
  const endIdx = lines.findIndex(line => line.includes('$$EOE'));

  if (startIdx === -1 || endIdx === -1) {
    throw new Error('Could not find ephemeris data in NASA response');
  }

  const dataLines = lines.slice(startIdx + 1, endIdx);
  const ephemeris: EphemerisPoint[] = [];

  for (const line of dataLines) {
    if (!line.trim()) continue;

    // Parse CSV format from Horizons
    const parts = line.split(',').map(s => s.trim());

    // Need at least 7 columns (Date, 2 empty, RA, DEC, delta, deldot)
    if (parts.length < 7) continue;

    try {
      // Convert calendar date to ISO format and Julian Date
      // NASA format: "2025-Oct-20 00:00" -> ISO: "2025-10-20T00:00:00.000Z"
      const nasaDate = parts[0];
      const isoDate = nasaDateToIso(nasaDate);
      const jd = calendarToJulianDate(nasaDate);

      ephemeris.push({
        calendar_date: isoDate,  // Store as ISO format for JavaScript Date parsing
        datetime_jd: jd.toString(),
        ra: parseFloat(parts[3]),
        dec: parseFloat(parts[4]),
        delta: parseFloat(parts[5]),
        deldot: parseFloat(parts[6]),
        mag: null, // Not requested in QUANTITIES='1,20'
        phase_angle: null, // Not requested in QUANTITIES='1,20'
      });
    } catch (e) {
      // Skip malformed lines
      console.warn('Could not parse ephemeris line:', line);
      continue;
    }
  }

  return ephemeris;
}

/**
 * Parse NASA date format to components
 *
 * @param dateStr - Date string in format "YYYY-MMM-DD HH:MM" (e.g., "2025-Oct-20 00:00")
 * @returns Object with year, month (1-12), day, hour, minute
 */
function parseNasaDate(dateStr: string): { year: number; month: number; day: number; hour: number; minute: number } {
  const monthMap: Record<string, number> = {
    Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
    Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12
  };

  const parts = dateStr.split(/[\s-:]+/);
  return {
    year: parseInt(parts[0]),
    month: monthMap[parts[1]] || 1,
    day: parseInt(parts[2]),
    hour: parseInt(parts[3] || '0'),
    minute: parseInt(parts[4] || '0'),
  };
}

/**
 * Convert NASA date format to ISO 8601 string
 *
 * @param dateStr - Date string in format "YYYY-MMM-DD HH:MM" (e.g., "2025-Oct-20 00:00")
 * @returns ISO 8601 date string (e.g., "2025-10-20T00:00:00.000Z")
 */
function nasaDateToIso(dateStr: string): string {
  const { year, month, day, hour, minute } = parseNasaDate(dateStr);
  // Create ISO string with zero-padded values
  const monthStr = month.toString().padStart(2, '0');
  const dayStr = day.toString().padStart(2, '0');
  const hourStr = hour.toString().padStart(2, '0');
  const minuteStr = minute.toString().padStart(2, '0');
  return `${year}-${monthStr}-${dayStr}T${hourStr}:${minuteStr}:00.000Z`;
}

/**
 * Convert calendar date to Julian Date
 * Simplified calculation for dates after 1582 (Gregorian calendar)
 *
 * @param dateStr - Date string in format "YYYY-MMM-DD HH:MM" (e.g., "2025-Oct-20 00:00")
 * @returns Julian Date as number
 */
function calendarToJulianDate(dateStr: string): number {
  const { year, month, day, hour, minute } = parseNasaDate(dateStr);

  // Convert to fractional day
  const dayFraction = day + (hour / 24.0) + (minute / 1440.0);

  // Julian Date calculation
  let a = Math.floor((14 - month) / 12);
  let y = year + 4800 - a;
  let m = month + 12 * a - 3;

  let jd = dayFraction + Math.floor((153 * m + 2) / 5) +
           365 * y + Math.floor(y / 4) -
           Math.floor(y / 100) + Math.floor(y / 400) - 32045;

  return jd;
}

/**
 * Fetch orbital elements from NASA Horizons API
 *
 * @param objectId - NASA Horizons object identifier
 * @returns Promise with orbital elements
 */
export async function fetchOrbitalElements(
  objectId: string
): Promise<OrbitalElements | null> {
  const params: Record<string, string> = {
    format: 'json',
    COMMAND: `'${objectId}'`, // Quote the object ID
    OBJ_DATA: 'YES',
    MAKE_EPHEM: 'NO',
  };

  // Manually construct query string to preserve quotes
  const queryString = Object.entries(params)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  const url = `https://ssd.jpl.nasa.gov/api/horizons.api?${queryString}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 2592000 }, // Cache for 30 days (orbital elements change slowly)
    });

    if (!response.ok) {
      throw new Error(`NASA Horizons API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`NASA Horizons API error: ${data.error}`);
    }

    // Parse orbital elements from response
    const elements = parseOrbitalElements(data.result);
    return elements;
  } catch (error) {
    console.error('Error fetching orbital elements:', error);
    return null; // Return null if orbital elements unavailable
  }
}

/**
 * Parse orbital elements from NASA Horizons response
 */
function parseOrbitalElements(resultText: string): OrbitalElements | null {
  // This is a simplified parser - NASA Horizons format varies by object
  // For MVP, we'll return null and use ephemeris data for visualization
  // TODO: Implement full orbital elements parser in future sprint
  console.warn('Orbital elements parsing not yet implemented');
  return null;
}

/**
 * Get the NASA Horizons ID for a known interstellar object
 *
 * @param isoName - Common name (e.g., "1I/Oumuamua")
 * @returns NASA Horizons object ID or null if not found
 */
export function getHorizonsId(isoName: string): string | null {
  return ISO_HORIZONS_IDS[isoName] || null;
}
