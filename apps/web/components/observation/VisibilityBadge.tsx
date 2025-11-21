'use client';

import { useEffect, useState } from 'react';
import { Eye, EyeOff, MapPin } from 'lucide-react';
import { loadSavedLocation } from '@/lib/location/location-service';

interface VisibilityBadgeProps {
  isoId: string;
  className?: string;
}

interface QuickVisibility {
  isVisible: boolean;
  nextRise?: string;
}

/**
 * Compact visibility badge for ISO list cards.
 * Shows current visibility status if location is set.
 */
export default function VisibilityBadge({ isoId, className = '' }: VisibilityBadgeProps) {
  const [visibility, setVisibility] = useState<QuickVisibility | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasLocation, setHasLocation] = useState(false);

  useEffect(() => {
    const fetchVisibility = async () => {
      const location = loadSavedLocation();

      if (!location) {
        setHasLocation(false);
        setLoading(false);
        return;
      }

      setHasLocation(true);

      try {
        const params = new URLSearchParams({
          lat: location.latitude.toString(),
          lon: location.longitude.toString(),
          days: '7', // Short range for quick check
        });

        const response = await fetch(`/api/iso/${isoId}/visibility?${params}`);

        if (response.ok) {
          const data = await response.json();
          setVisibility({
            isVisible: data.forecast?.currentStatus?.isVisible ?? false,
            nextRise: data.forecast?.nextRise,
          });
        }
      } catch (error) {
        console.error('Failed to fetch visibility:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVisibility();
  }, [isoId]);

  if (loading) {
    return (
      <div className={`flex items-center gap-1 text-xs text-gray-400 ${className}`}>
        <div className="w-2 h-2 rounded-full bg-gray-300 animate-pulse" />
        <span>Checking...</span>
      </div>
    );
  }

  if (!hasLocation) {
    return (
      <div className={`flex items-center gap-1 text-xs text-gray-500 ${className}`}>
        <MapPin className="w-3 h-3" />
        <span>Set location for visibility</span>
      </div>
    );
  }

  if (!visibility) {
    return null;
  }

  return (
    <div className={`flex items-center gap-1 text-xs ${className}`}>
      {visibility.isVisible ? (
        <>
          <Eye className="w-3 h-3 text-green-600" />
          <span className="text-green-600 font-medium">Visible now</span>
        </>
      ) : (
        <>
          <EyeOff className="w-3 h-3 text-gray-500" />
          <span className="text-gray-500">Not visible</span>
        </>
      )}
    </div>
  );
}
