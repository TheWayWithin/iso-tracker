'use client';

import { useEffect, useState } from 'react';
import { Eye, EyeOff, Compass, TrendingUp, AlertCircle } from 'lucide-react';
import { formatQuality, type VisibilityData } from '@/hooks/useVisibility';

interface VisibilityStatusProps {
  data: VisibilityData | null;
  loading?: boolean;
  error?: string | null;
  autoUpdate?: boolean;
  updateInterval?: number; // milliseconds, default 60000 (1 minute)
}

export default function VisibilityStatus({
  data,
  loading = false,
  error = null,
  autoUpdate = true,
  updateInterval = 60000,
}: VisibilityStatusProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time for real-time calculations
  useEffect(() => {
    if (!autoUpdate) return;

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, updateInterval);

    return () => clearInterval(interval);
  }, [autoUpdate, updateInterval]);

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900 mb-1">Unable to Calculate Visibility</h3>
            <p className="text-sm text-red-700">{error}</p>
            <p className="text-sm text-red-600 mt-2">
              Please set your location to see visibility information.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Location Required</h3>
            <p className="text-sm text-blue-700">
              Set your location to see when this object is visible from your area.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { currentStatus } = data.forecast;
  const { text: qualityText, color: qualityColor } = formatQuality(currentStatus.quality);

  // Convert azimuth to compass direction
  const getCompassDirection = (azimuth: number): string => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                       'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(azimuth / 22.5) % 16;
    return directions[index];
  };

  const compassDir = getCompassDirection(currentStatus.azimuth);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      {/* Header with Status Badge */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {currentStatus.isVisible ? (
            <Eye className="h-6 w-6 text-green-600" />
          ) : (
            <EyeOff className="h-6 w-6 text-gray-400" />
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {currentStatus.isVisible ? 'Currently Visible' : 'Below Horizon'}
            </h3>
            <p className="text-sm text-gray-600">
              From {data.observer.latitude.toFixed(2)}°N, {data.observer.longitude.toFixed(2)}°E
            </p>
          </div>
        </div>

        {/* Quality Badge */}
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          currentStatus.quality === 'excellent' ? 'bg-green-100 text-green-800' :
          currentStatus.quality === 'good' ? 'bg-blue-100 text-blue-800' :
          currentStatus.quality === 'fair' ? 'bg-yellow-100 text-yellow-800' :
          currentStatus.quality === 'poor' ? 'bg-orange-100 text-orange-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {qualityText}
        </div>
      </div>

      {/* Sky Position Information */}
      {currentStatus.isVisible && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Altitude */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-600">Altitude</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {currentStatus.apparentAltitude.toFixed(1)}°
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {currentStatus.apparentAltitude > 60 ? 'Near zenith' :
               currentStatus.apparentAltitude > 45 ? 'High in sky' :
               currentStatus.apparentAltitude > 20 ? 'Moderate altitude' :
               'Low on horizon'}
            </p>
          </div>

          {/* Azimuth */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Compass className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-600">Azimuth</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {currentStatus.azimuth.toFixed(1)}°
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Direction: {compassDir}
            </p>
          </div>
        </div>
      )}

      {/* Simple Sky Position Diagram */}
      {currentStatus.isVisible && (
        <div className="mt-4">
          <p className="text-xs text-gray-500 mb-2 text-center">Sky Position</p>
          <div className="relative w-full h-32 bg-gradient-to-b from-blue-100 to-blue-50 rounded-lg overflow-hidden">
            {/* Horizon line */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-600"></div>
            <div className="absolute bottom-0 left-0 right-0 text-center text-xs text-gray-600 pb-1">
              Horizon (0°)
            </div>

            {/* Zenith marker */}
            <div className="absolute top-2 left-0 right-0 text-center text-xs text-gray-600">
              Zenith (90°)
            </div>

            {/* Object position marker */}
            <div
              className="absolute w-4 h-4 bg-yellow-500 rounded-full border-2 border-yellow-600 shadow-lg"
              style={{
                bottom: `${(currentStatus.apparentAltitude / 90) * 100}%`,
                left: '50%',
                transform: 'translateX(-50%)',
              }}
            >
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-semibold text-gray-700">
                ISO
              </div>
            </div>

            {/* Altitude reference lines */}
            <div className="absolute bottom-[33%] left-0 right-0 h-px bg-gray-300 opacity-50"></div>
            <div className="absolute bottom-[66%] left-0 right-0 h-px bg-gray-300 opacity-50"></div>
          </div>

          {/* Compass directions */}
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>N (0°)</span>
            <span>E (90°)</span>
            <span>S (180°)</span>
            <span>W (270°)</span>
          </div>
          <div className="text-center mt-1">
            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
              Currently at {compassDir} ({currentStatus.azimuth.toFixed(0)}°)
            </span>
          </div>
        </div>
      )}

      {/* Not Visible State */}
      {!currentStatus.isVisible && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 text-center">
            Object is currently below the horizon from your location.
            Check the observation windows below for upcoming visibility times.
          </p>
        </div>
      )}

      {/* Last Updated */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Last updated: {currentTime.toLocaleTimeString()}
          {autoUpdate && ' • Auto-updating every minute'}
        </p>
      </div>
    </div>
  );
}
