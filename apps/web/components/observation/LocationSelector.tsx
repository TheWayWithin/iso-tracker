'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Search, X, AlertCircle, Check } from 'lucide-react';
import {
  getCurrentLocation,
  searchCities,
  saveLocation,
  loadSavedLocation,
  clearSavedLocation,
  formatLocation,
  type LocationResult,
  type GeocodingResult,
} from '@/lib/location/location-service';

interface LocationSelectorProps {
  onLocationChange?: (location: LocationResult) => void;
  className?: string;
}

export default function LocationSelector({
  onLocationChange,
  className = '',
}: LocationSelectorProps) {
  const [currentLocation, setCurrentLocation] = useState<LocationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Load saved location on mount
  useEffect(() => {
    const saved = loadSavedLocation();
    if (saved) {
      setCurrentLocation(saved);
      onLocationChange?.(saved);
    }
  }, [onLocationChange]);

  // Debounced city search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchCities(searchQuery, 5);
        setSearchResults(results);
      } catch (err) {
        console.error('Search error:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleUseGPS = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const location = await getCurrentLocation();
      setCurrentLocation(location);
      saveLocation(location);
      onLocationChange?.(location);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get location');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCity = (result: GeocodingResult) => {
    const location: LocationResult = {
      latitude: result.latitude,
      longitude: result.longitude,
      city: result.city,
      country: result.country,
      displayName: result.displayName,
    };

    setCurrentLocation(location);
    saveLocation(location);
    onLocationChange?.(location);
    setIsEditing(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleClearLocation = () => {
    setCurrentLocation(null);
    clearSavedLocation();
    setIsEditing(true);
  };

  if (isEditing || !currentLocation) {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* Privacy Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Privacy First</p>
              <p>Your location is stored only on your device. We never send it to our servers.</p>
            </div>
          </div>
        </div>

        {/* GPS Detection */}
        <div>
          <button
            onClick={handleUseGPS}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Navigation className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Detecting Location...' : 'Use My Current Location (GPS)'}
          </button>
        </div>

        <div className="relative flex items-center">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="px-4 text-sm text-gray-500">or</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        {/* City Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search for Your City
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter city name..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Search Results */}
          {isSearching && (
            <div className="mt-2 p-3 text-center text-sm text-gray-500">
              Searching...
            </div>
          )}

          {!isSearching && searchResults.length > 0 && (
            <div className="mt-2 border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-64 overflow-y-auto">
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectCity(result)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-grow min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {result.city || 'Unknown City'}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {result.displayName}
                      </p>
                    </div>
                    <MapPin className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {!isSearching && searchQuery && searchResults.length === 0 && (
            <div className="mt-2 p-3 text-center text-sm text-gray-500">
              No cities found. Try a different search term.
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-900">
                <p className="font-medium mb-1">Error</p>
                <p>{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Button (if location exists) */}
        {currentLocation && (
          <button
            onClick={() => setIsEditing(false)}
            className="w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    );
  }

  // Display current location
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-green-600" />
          <span className="text-sm font-medium text-gray-700">Current Location</span>
        </div>
        <Check className="h-5 w-5 text-green-600" />
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-900 font-medium mb-1">
          {currentLocation.city && currentLocation.country
            ? `${currentLocation.city}, ${currentLocation.country}`
            : currentLocation.displayName || 'Unknown Location'}
        </p>
        <p className="text-xs text-green-700">
          {Math.abs(currentLocation.latitude).toFixed(4)}°
          {currentLocation.latitude >= 0 ? 'N' : 'S'},{' '}
          {Math.abs(currentLocation.longitude).toFixed(4)}°
          {currentLocation.longitude >= 0 ? 'E' : 'W'}
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setIsEditing(true)}
          className="flex-1 px-4 py-2 text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
        >
          Change Location
        </button>
        <button
          onClick={handleClearLocation}
          className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
