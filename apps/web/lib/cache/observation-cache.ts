// apps/web/lib/cache/observation-cache.ts
import type { EphemerisPoint } from '../../types/nasa';
import type { ObserverLocation, VisibilityForecast } from '../../types/visibility';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface LocationResult {
  latitude: number;
  longitude: number;
  altitude?: number;
  name?: string;
  source: 'gps' | 'ip' | 'manual';
}

const CACHE_EXPIRY = {
  ephemeris: 24 * 60 * 60 * 1000, // 24 hours
  visibility: 60 * 60 * 1000,     // 1 hour
  location: 30 * 24 * 60 * 60 * 1000 // 30 days
};

export class ObservationCache {
  private static KEYS = {
    location: 'iso_tracker_user_location',
    ephemeris: (isoId: string) => `iso_tracker_ephemeris_${isoId}`,
    visibility: (isoId: string, lat: number, lon: number) =>
      `iso_tracker_visibility_${isoId}_${lat.toFixed(2)}_${lon.toFixed(2)}`
  };

  // =========================
  // Location Caching (localStorage)
  // =========================

  static saveLocation(location: LocationResult): void {
    try {
      const entry: CacheEntry<LocationResult> = {
        data: location,
        timestamp: Date.now(),
        expiresAt: Date.now() + CACHE_EXPIRY.location
      };
      localStorage.setItem(this.KEYS.location, JSON.stringify(entry));
    } catch (error) {
      console.warn('Failed to save location to cache:', error);
    }
  }

  static loadLocation(): LocationResult | null {
    try {
      const cached = localStorage.getItem(this.KEYS.location);
      if (!cached) return null;

      const entry: CacheEntry<LocationResult> = JSON.parse(cached);

      // Check expiry
      if (Date.now() > entry.expiresAt) {
        this.clearLocation();
        return null;
      }

      return entry.data;
    } catch (error) {
      console.warn('Failed to load location from cache:', error);
      return null;
    }
  }

  static clearLocation(): void {
    try {
      localStorage.removeItem(this.KEYS.location);
    } catch (error) {
      console.warn('Failed to clear location from cache:', error);
    }
  }

  // =========================
  // Ephemeris Caching (localStorage)
  // =========================

  static saveEphemeris(isoId: string, data: EphemerisPoint[]): void {
    try {
      const entry: CacheEntry<EphemerisPoint[]> = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + CACHE_EXPIRY.ephemeris
      };
      localStorage.setItem(this.KEYS.ephemeris(isoId), JSON.stringify(entry));
    } catch (error) {
      console.warn('Failed to save ephemeris to cache:', error);
    }
  }

  static loadEphemeris(isoId: string): EphemerisPoint[] | null {
    try {
      const cached = localStorage.getItem(this.KEYS.ephemeris(isoId));
      if (!cached) return null;

      const entry: CacheEntry<EphemerisPoint[]> = JSON.parse(cached);

      // Check expiry
      if (Date.now() > entry.expiresAt) {
        localStorage.removeItem(this.KEYS.ephemeris(isoId));
        return null;
      }

      return entry.data;
    } catch (error) {
      console.warn('Failed to load ephemeris from cache:', error);
      return null;
    }
  }

  static isEphemerisStale(isoId: string): boolean {
    try {
      const cached = localStorage.getItem(this.KEYS.ephemeris(isoId));
      if (!cached) return true;

      const entry: CacheEntry<EphemerisPoint[]> = JSON.parse(cached);
      return Date.now() > entry.expiresAt;
    } catch (error) {
      return true;
    }
  }

  // =========================
  // Visibility Caching (sessionStorage)
  // =========================

  static saveVisibility(
    isoId: string,
    location: ObserverLocation,
    data: VisibilityForecast
  ): void {
    try {
      const key = this.KEYS.visibility(isoId, location.latitude, location.longitude);
      const entry: CacheEntry<VisibilityForecast> = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + CACHE_EXPIRY.visibility
      };
      sessionStorage.setItem(key, JSON.stringify(entry));
    } catch (error) {
      console.warn('Failed to save visibility to cache:', error);
    }
  }

  static loadVisibility(
    isoId: string,
    location: ObserverLocation
  ): VisibilityForecast | null {
    try {
      const key = this.KEYS.visibility(isoId, location.latitude, location.longitude);
      const cached = sessionStorage.getItem(key);
      if (!cached) return null;

      const entry: CacheEntry<VisibilityForecast> = JSON.parse(cached);

      // Check expiry
      if (Date.now() > entry.expiresAt) {
        sessionStorage.removeItem(key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.warn('Failed to load visibility from cache:', error);
      return null;
    }
  }

  static isVisibilityStale(
    isoId: string,
    location: ObserverLocation
  ): boolean {
    try {
      const key = this.KEYS.visibility(isoId, location.latitude, location.longitude);
      const cached = sessionStorage.getItem(key);
      if (!cached) return true;

      const entry: CacheEntry<VisibilityForecast> = JSON.parse(cached);
      return Date.now() > entry.expiresAt;
    } catch (error) {
      return true;
    }
  }

  // =========================
  // Utilities
  // =========================

  static clearAll(): void {
    try {
      // Clear all ISO Tracker cache entries
      const localStorageKeys = Object.keys(localStorage);
      const sessionStorageKeys = Object.keys(sessionStorage);

      localStorageKeys
        .filter(key => key.startsWith('iso_tracker_'))
        .forEach(key => localStorage.removeItem(key));

      sessionStorageKeys
        .filter(key => key.startsWith('iso_tracker_'))
        .forEach(key => sessionStorage.removeItem(key));

      console.log('All observation cache cleared');
    } catch (error) {
      console.warn('Failed to clear all cache:', error);
    }
  }

  static clearStale(): void {
    try {
      const now = Date.now();

      // Clear stale localStorage entries
      const localStorageKeys = Object.keys(localStorage);
      localStorageKeys
        .filter(key => key.startsWith('iso_tracker_'))
        .forEach(key => {
          try {
            const entry = JSON.parse(localStorage.getItem(key) || '{}');
            if (entry.expiresAt && now > entry.expiresAt) {
              localStorage.removeItem(key);
            }
          } catch {
            // Invalid entry - remove it
            localStorage.removeItem(key);
          }
        });

      // Clear stale sessionStorage entries
      const sessionStorageKeys = Object.keys(sessionStorage);
      sessionStorageKeys
        .filter(key => key.startsWith('iso_tracker_'))
        .forEach(key => {
          try {
            const entry = JSON.parse(sessionStorage.getItem(key) || '{}');
            if (entry.expiresAt && now > entry.expiresAt) {
              sessionStorage.removeItem(key);
            }
          } catch {
            // Invalid entry - remove it
            sessionStorage.removeItem(key);
          }
        });

      console.log('Stale cache entries cleared');
    } catch (error) {
      console.warn('Failed to clear stale cache:', error);
    }
  }

  // Get cache statistics (for debugging/monitoring)
  static getStats(): {
    locationCached: boolean;
    ephemerisCount: number;
    visibilityCount: number;
    totalSize: number;
  } {
    try {
      const localStorageKeys = Object.keys(localStorage);
      const sessionStorageKeys = Object.keys(sessionStorage);

      const ephemerisCount = localStorageKeys
        .filter(key => key.startsWith('iso_tracker_ephemeris_')).length;

      const visibilityCount = sessionStorageKeys
        .filter(key => key.startsWith('iso_tracker_visibility_')).length;

      const locationCached = localStorage.getItem(this.KEYS.location) !== null;

      // Rough size estimate
      const totalSize = [...localStorageKeys, ...sessionStorageKeys]
        .filter(key => key.startsWith('iso_tracker_'))
        .reduce((size, key) => {
          const item = localStorage.getItem(key) || sessionStorage.getItem(key) || '';
          return size + item.length * 2; // Rough bytes (UTF-16)
        }, 0);

      return {
        locationCached,
        ephemerisCount,
        visibilityCount,
        totalSize
      };
    } catch (error) {
      return {
        locationCached: false,
        ephemerisCount: 0,
        visibilityCount: 0,
        totalSize: 0
      };
    }
  }
}
