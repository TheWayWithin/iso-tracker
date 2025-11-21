/**
 * React Hook: useVisibility
 *
 * Fetches and manages visibility data for an ISO from observer's location.
 * Integrates with LocationSelector to provide real-time visibility updates.
 */

'use client';

import { useState, useEffect } from 'react';
import { loadSavedLocation, type LocationResult } from '@/lib/location/location-service';

export interface VisibilityData {
  isoId: string;
  observer: {
    latitude: number;
    longitude: number;
  };
  forecastPeriod: {
    start: string;
    end: string;
    days: number;
  };
  forecast: {
    currentStatus: {
      isVisible: boolean;
      altitude: number;
      azimuth: number;
      apparentAltitude: number;
      quality: 'excellent' | 'good' | 'fair' | 'poor' | 'not_visible';
      datetime: string;
    };
    nextRise: string | null;
    nextSet: string | null;
    upcomingWindows: Array<{
      start: string;
      end: string;
      duration: number;
      maxAltitude: number;
      quality: 'excellent' | 'good' | 'fair' | 'poor' | 'not_visible';
    }>;
    visibilityPercentage: number;
  };
  dataPoints: number;
}

export interface UseVisibilityOptions {
  isoId: string;
  location?: LocationResult;
  days?: number;
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
}

export interface UseVisibilityResult {
  data: VisibilityData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Fetch visibility data for an ISO
 *
 * @param options - Hook options
 * @returns Visibility data, loading state, and error
 */
export function useVisibility({
  isoId,
  location,
  days = 30,
  autoRefresh = false,
  refreshInterval = 300000, // 5 minutes default
}: UseVisibilityOptions): UseVisibilityResult {
  const [data, setData] = useState<VisibilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVisibility = async () => {
    // Use provided location or load from localStorage
    const observerLocation = location || loadSavedLocation();

    if (!observerLocation) {
      setError('No location set. Please enable location services or select a city.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        lat: observerLocation.latitude.toString(),
        lon: observerLocation.longitude.toString(),
        days: days.toString(),
      });

      const response = await fetch(`/api/iso/${isoId}/visibility?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch visibility data');
      }

      const visibilityData = await response.json();
      setData(visibilityData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error('Visibility fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchVisibility();
  }, [isoId, location?.latitude, location?.longitude, days]);

  // Auto-refresh if enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchVisibility();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, isoId, location]);

  return {
    data,
    loading,
    error,
    refetch: fetchVisibility,
  };
}

/**
 * Format time until next event
 *
 * @param dateString - ISO date string
 * @returns Human-readable time until event
 */
export function formatTimeUntil(dateString: string | null): string {
  if (!dateString) return 'Unknown';

  const now = new Date();
  const target = new Date(dateString);
  const diffMs = target.getTime() - now.getTime();

  if (diffMs < 0) return 'Past';

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
  } else if (diffHours > 0) {
    return `in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
  } else if (diffMinutes > 0) {
    return `in ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
  } else {
    return 'now';
  }
}

/**
 * Format quality for display
 *
 * @param quality - Visibility quality
 * @returns Display text and color class
 */
export function formatQuality(quality: string): { text: string; color: string } {
  const formats = {
    excellent: { text: 'Excellent', color: 'text-green-600' },
    good: { text: 'Good', color: 'text-blue-600' },
    fair: { text: 'Fair', color: 'text-yellow-600' },
    poor: { text: 'Poor', color: 'text-orange-600' },
    not_visible: { text: 'Not Visible', color: 'text-gray-500' },
  };

  return formats[quality as keyof typeof formats] || { text: quality, color: 'text-gray-600' };
}
