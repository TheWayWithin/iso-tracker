/**
 * Location Services
 *
 * Handles geographic location detection and geocoding with privacy-first approach.
 * - Browser geolocation API (GPS)
 * - City search with Nominatim (OpenStreetMap)
 * - localStorage persistence
 * - NO server-side tracking
 */

import type { ObserverLocation } from '../astronomy/coordinates';

export interface LocationResult {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  displayName?: string;
}

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  displayName: string;
  city?: string;
  country?: string;
}

const STORAGE_KEY = 'iso_tracker_location';
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'ISOTracker/1.0 (https://github.com/yourusername/iso-tracker)';

/**
 * Get user's current location from GPS (with permission)
 *
 * @returns Promise resolving to location coordinates
 * @throws Error if permission denied or geolocation unavailable
 */
export async function getCurrentLocation(): Promise<LocationResult> {
  if (!navigator.geolocation) {
    throw new Error('Geolocation is not supported by your browser');
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const result: LocationResult = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        // Try to reverse geocode for city name
        try {
          const geocoded = await reverseGeocode(
            result.latitude,
            result.longitude
          );
          result.city = geocoded.city;
          result.country = geocoded.country;
          result.displayName = geocoded.displayName;
        } catch (error) {
          // Continue without city name if reverse geocoding fails
          console.warn('Reverse geocoding failed:', error);
        }

        resolve(result);
      },
      (error) => {
        let message = 'Unable to retrieve your location';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location access denied. Please enable location permissions or enter your city manually.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information unavailable. Please try again or enter your city manually.';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out. Please try again or enter your city manually.';
            break;
        }

        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // Cache for 5 minutes
      }
    );
  });
}

/**
 * Search for cities using Nominatim geocoding API
 *
 * @param query - City name or search query
 * @param limit - Maximum number of results (default 5)
 * @returns Promise resolving to array of geocoding results
 */
export async function searchCities(
  query: string,
  limit: number = 5
): Promise<GeocodingResult[]> {
  if (!query.trim()) {
    return [];
  }

  // Check session cache first
  const cacheKey = `geocode_${query.toLowerCase()}`;
  const cached = sessionStorage.getItem(cacheKey);

  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // Invalid cache, continue to API
    }
  }

  const url = new URL(`${NOMINATIM_BASE}/search`);
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', limit.toString());
  url.searchParams.set('addressdetails', '1');

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': USER_AGENT,
      },
    });

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.statusText}`);
    }

    const data = await response.json();

    const results: GeocodingResult[] = data.map((item: any) => ({
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      displayName: item.display_name,
      city: item.address?.city || item.address?.town || item.address?.village,
      country: item.address?.country,
    }));

    // Cache results in sessionStorage
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify(results));
    } catch {
      // Ignore storage errors
    }

    return results;
  } catch (error) {
    console.error('Geocoding error:', error);
    throw new Error('Failed to search for cities. Please try again.');
  }
}

/**
 * Reverse geocode coordinates to get city/location name
 *
 * @param latitude - Latitude in degrees
 * @param longitude - Longitude in degrees
 * @returns Promise resolving to geocoding result
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<GeocodingResult> {
  const url = new URL(`${NOMINATIM_BASE}/reverse`);
  url.searchParams.set('lat', latitude.toString());
  url.searchParams.set('lon', longitude.toString());
  url.searchParams.set('format', 'json');
  url.searchParams.set('addressdetails', '1');

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': USER_AGENT,
      },
    });

    if (!response.ok) {
      throw new Error(`Reverse geocoding failed: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      latitude,
      longitude,
      displayName: data.display_name,
      city: data.address?.city || data.address?.town || data.address?.village,
      country: data.address?.country,
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    throw new Error('Failed to determine location name');
  }
}

/**
 * Save location to localStorage
 *
 * @param location - Location data to persist
 */
export function saveLocation(location: LocationResult): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
  } catch (error) {
    console.warn('Failed to save location to localStorage:', error);
  }
}

/**
 * Load saved location from localStorage
 *
 * @returns Saved location or null if not found
 */
export function loadSavedLocation(): LocationResult | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.warn('Failed to load location from localStorage:', error);
  }

  return null;
}

/**
 * Clear saved location from localStorage
 */
export function clearSavedLocation(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear location from localStorage:', error);
  }
}

/**
 * Convert LocationResult to ObserverLocation
 *
 * @param location - Location result from GPS or geocoding
 * @returns Observer location for coordinate calculations
 */
export function toObserverLocation(location: LocationResult): ObserverLocation {
  return {
    latitude: location.latitude,
    longitude: location.longitude,
    elevation: 0, // Default to sea level unless we have elevation data
  };
}

/**
 * Format location for display
 *
 * @param location - Location to format
 * @returns Human-readable location string
 */
export function formatLocation(location: LocationResult): string {
  const lat = Math.abs(location.latitude).toFixed(4);
  const latDir = location.latitude >= 0 ? 'N' : 'S';
  const lon = Math.abs(location.longitude).toFixed(4);
  const lonDir = location.longitude >= 0 ? 'E' : 'W';

  if (location.displayName) {
    return `${location.displayName} (${lat}°${latDir}, ${lon}°${lonDir})`;
  } else if (location.city) {
    return `${location.city}${location.country ? ', ' + location.country : ''} (${lat}°${latDir}, ${lon}°${lonDir})`;
  } else {
    return `${lat}°${latDir}, ${lon}°${lonDir}`;
  }
}

/**
 * Validate location coordinates
 *
 * @param latitude - Latitude to validate
 * @param longitude - Longitude to validate
 * @returns true if coordinates are valid
 */
export function validateCoordinates(latitude: number, longitude: number): boolean {
  return (
    !isNaN(latitude) &&
    !isNaN(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}
