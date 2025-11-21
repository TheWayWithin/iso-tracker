'use client';

import { Compass, Info } from 'lucide-react';
import { type VisibilityData } from '@/hooks/useVisibility';

interface SkyMapProps {
  data: VisibilityData | null;
  loading?: boolean;
}

/**
 * SkyMap Component
 *
 * Simplified sky chart showing object position.
 * Future enhancement: Full interactive canvas-based sky map.
 */
export default function SkyMap({ data, loading = false }: SkyMapProps) {
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!data || !data.forecast.currentStatus.isVisible) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="text-center py-8">
          <Compass className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium mb-1">Sky Map Unavailable</p>
          <p className="text-sm text-gray-500">
            Object must be above horizon to display sky map.
          </p>
        </div>
      </div>
    );
  }

  const { currentStatus } = data.forecast;

  // Simple polar coordinate visualization
  const getCompassDirection = (azimuth: number): string => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                       'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(azimuth / 22.5) % 16;
    return directions[index];
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Compass className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Sky Map</h3>
        </div>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <Info className="h-4 w-4" />
          <span>Simplified View</span>
        </div>
      </div>

      {/* Simplified Sky Chart */}
      <div className="relative w-full aspect-square max-w-md mx-auto bg-gradient-to-b from-blue-900 to-blue-600 rounded-full overflow-hidden">
        {/* Cardinal directions */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-white font-bold text-sm">N</div>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white font-bold text-sm">S</div>
        <div className="absolute left-2 top-1/2 -translate-y-1/2 text-white font-bold text-sm">W</div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-white font-bold text-sm">E</div>

        {/* Altitude circles */}
        <div className="absolute inset-[10%] border-2 border-white/20 rounded-full"></div>
        <div className="absolute inset-[30%] border-2 border-white/20 rounded-full"></div>
        <div className="absolute inset-[50%] border-2 border-white/30 rounded-full"></div>

        {/* Zenith label */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/40 text-xs">
          Zenith
        </div>

        {/* Object position */}
        <div
          className="absolute w-6 h-6 bg-yellow-400 rounded-full border-2 border-yellow-600 shadow-lg"
          style={{
            // Convert alt/az to x/y position
            // Radius decreases with altitude (90° = center, 0° = edge)
            top: `${50 - (currentStatus.apparentAltitude / 90 * 40) * Math.cos((currentStatus.azimuth * Math.PI) / 180)}%`,
            left: `${50 + (currentStatus.apparentAltitude / 90 * 40) * Math.sin((currentStatus.azimuth * Math.PI) / 180)}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-bold text-white bg-black/50 px-2 py-1 rounded">
            ISO
          </div>
        </div>
      </div>

      {/* Position Details */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Altitude</p>
          <p className="text-lg font-bold text-gray-900">
            {currentStatus.apparentAltitude.toFixed(1)}°
          </p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Direction</p>
          <p className="text-lg font-bold text-gray-900">
            {getCompassDirection(currentStatus.azimuth)}
          </p>
          <p className="text-xs text-gray-500">
            {currentStatus.azimuth.toFixed(0)}°
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-900">
          <strong>How to find it:</strong> Face {getCompassDirection(currentStatus.azimuth)},
          look {currentStatus.apparentAltitude > 60 ? 'almost straight up' :
               currentStatus.apparentAltitude > 30 ? 'halfway up the sky' :
               'low on the horizon'} ({currentStatus.apparentAltitude.toFixed(0)}° above horizon).
        </p>
      </div>
    </div>
  );
}
