'use client';

import { Globe, Info } from 'lucide-react';
import { calculateGeographicVisibility } from '@/lib/astronomy/visibility';
import { type VisibilityData } from '@/hooks/useVisibility';

interface GeographicVisibilityProps {
  data: VisibilityData | null;
  declination?: number;
  loading?: boolean;
}

/**
 * GeographicVisibility Component
 *
 * Shows which latitudes can see the object.
 * Simplified version - shows latitude ranges textually.
 * Future enhancement: Interactive world map visualization.
 */
export default function GeographicVisibility({
  data,
  declination,
  loading = false,
}: GeographicVisibilityProps) {
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
        <div className="h-48 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!declination && !data) {
    return null;
  }

  // Use declination from data or prop
  const dec = declination || 0; // TODO: Get from actual ephemeris data
  const geoVis = calculateGeographicVisibility(dec);

  const formatLatitude = (lat: number): string => {
    const absLat = Math.abs(lat);
    const dir = lat >= 0 ? 'N' : 'S';
    return `${absLat.toFixed(1)}° ${dir}`;
  };

  const isVisibleFromLocation = data
    ? data.observer.latitude >= geoVis.minLatitude &&
      data.observer.latitude <= geoVis.maxLatitude
    : true;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Geographic Visibility
          </h3>
        </div>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <Info className="h-4 w-4" />
          <span>Based on declination</span>
        </div>
      </div>

      {/* Visibility Range */}
      <div className="space-y-4">
        {/* Your Location Status */}
        {data && (
          <div className={`p-4 rounded-lg ${
            isVisibleFromLocation
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              {isVisibleFromLocation ? (
                <span className="text-green-700 font-semibold">✓ Visible from your location</span>
              ) : (
                <span className="text-red-700 font-semibold">✗ Not visible from your location</span>
              )}
            </div>
            <p className={`text-sm ${
              isVisibleFromLocation ? 'text-green-600' : 'text-red-600'
            }`}>
              Your location: {formatLatitude(data.observer.latitude)}
            </p>
          </div>
        )}

        {/* Visibility Range Info */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-3">Visibility Latitude Range</h4>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Southernmost:</span>
              <span className="font-medium text-gray-900">
                {formatLatitude(geoVis.minLatitude)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Northernmost:</span>
              <span className="font-medium text-gray-900">
                {formatLatitude(geoVis.maxLatitude)}
              </span>
            </div>
          </div>

          {/* Visual latitude bar */}
          <div className="mt-4">
            <div className="relative h-8 bg-gray-200 rounded">
              {/* Visible range */}
              <div
                className="absolute h-full bg-blue-500 opacity-50"
                style={{
                  left: `${((geoVis.minLatitude + 90) / 180) * 100}%`,
                  right: `${100 - ((geoVis.maxLatitude + 90) / 180) * 100}%`,
                }}
              ></div>

              {/* User location marker (if data available) */}
              {data && isVisibleFromLocation && (
                <div
                  className="absolute top-0 bottom-0 w-1 bg-green-600"
                  style={{
                    left: `${((data.observer.latitude + 90) / 180) * 100}%`,
                  }}
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-semibold text-green-700">
                    You
                  </div>
                </div>
              )}

              {/* Labels */}
              <div className="absolute -bottom-6 left-0 text-xs text-gray-500">90°S</div>
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-gray-500">
                Equator
              </div>
              <div className="absolute -bottom-6 right-0 text-xs text-gray-500">90°N</div>
            </div>
          </div>
        </div>

        {/* Circumpolar Info */}
        {geoVis.alwaysVisible && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-1">Circumpolar Region</h4>
            <p className="text-sm text-blue-700">
              Always above horizon from{' '}
              {formatLatitude(geoVis.alwaysVisible.minLat)} to{' '}
              {formatLatitude(geoVis.alwaysVisible.maxLat)}
            </p>
          </div>
        )}

        {/* Best Viewing Regions */}
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-semibold text-green-900 mb-2">Best Viewing Regions</h4>
          <ul className="text-sm text-green-700 space-y-1">
            {dec > 30 ? (
              <li>• Northern hemisphere (higher altitudes in far north)</li>
            ) : dec < -30 ? (
              <li>• Southern hemisphere (higher altitudes in far south)</li>
            ) : (
              <li>• Equatorial and mid-latitudes (visible from most locations)</li>
            )}
            <li>• Locations between {formatLatitude(geoVis.minLatitude)} and {formatLatitude(geoVis.maxLatitude)}</li>
          </ul>
        </div>
      </div>

      {/* Note */}
      <div className="mt-4 p-3 bg-gray-50 rounded text-sm text-gray-600">
        <strong>Note:</strong> Geographic visibility indicates which latitudes can see this object
        at some point during its visibility period. Actual observability depends on time of day
        and local horizon conditions.
      </div>
    </div>
  );
}
