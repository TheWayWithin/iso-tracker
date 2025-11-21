'use client';

import { Info, HelpCircle } from 'lucide-react';
import { useState } from 'react';

interface HelpTooltipProps {
  term: string;
  definition: string;
  example?: string;
  icon?: 'info' | 'help';
  className?: string;
}

/**
 * HelpTooltip Component
 *
 * Displays educational tooltips explaining astronomy terms.
 * Click or hover to show definition and optional example.
 */
export default function HelpTooltip({
  term,
  definition,
  example,
  icon = 'help',
  className = '',
}: HelpTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  const Icon = icon === 'info' ? Info : HelpCircle;

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
        aria-label={`Help: ${term}`}
      >
        <span className="text-sm font-medium underline decoration-dotted">{term}</span>
        <Icon className="h-3.5 w-3.5" />
      </button>

      {/* Tooltip */}
      {isOpen && (
        <div className="absolute z-50 w-64 p-3 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="space-y-2">
            <p className="text-sm text-gray-900 font-medium">{term}</p>
            <p className="text-sm text-gray-700">{definition}</p>
            {example && (
              <p className="text-xs text-gray-600 italic border-t border-gray-200 pt-2">
                Example: {example}
              </p>
            )}
          </div>
          {/* Arrow */}
          <div className="absolute -top-2 left-4 w-4 h-4 bg-white border-l border-t border-gray-200 transform rotate-45"></div>
        </div>
      )}
    </div>
  );
}

/**
 * Common astronomy terms with definitions
 */
export const ASTRONOMY_TERMS = {
  altitude: {
    term: 'Altitude',
    definition: 'Height above the horizon, measured in degrees. 0° is at the horizon, 90° is directly overhead (zenith).',
    example: 'An object at 45° altitude is halfway between the horizon and zenith.',
  },
  azimuth: {
    term: 'Azimuth',
    definition: 'Compass direction measured in degrees. 0° = North, 90° = East, 180° = South, 270° = West.',
    example: 'An azimuth of 135° means the object is toward the Southeast.',
  },
  magnitude: {
    term: 'Magnitude',
    definition: 'Brightness of an object. Lower numbers = brighter. Objects fainter than magnitude 6 typically require telescopes.',
    example: 'The brightest star Sirius is magnitude -1.5. Pluto is magnitude 14.',
  },
  rightAscension: {
    term: 'Right Ascension (RA)',
    definition: 'Celestial coordinate similar to longitude on Earth, measured in hours (0-24h). Used for locating objects in the sky.',
    example: 'RA changes ~1 hour every 15 degrees eastward.',
  },
  declination: {
    term: 'Declination (Dec)',
    definition: 'Celestial coordinate similar to latitude on Earth, measured in degrees (-90° to +90°). Positive values are north of celestial equator.',
    example: 'The North Celestial Pole has Dec = +90°.',
  },
  zenith: {
    term: 'Zenith',
    definition: 'The point directly overhead in the sky (90° altitude). Objects at zenith experience minimal atmospheric interference.',
    example: 'Best viewing conditions are when objects are near zenith.',
  },
  horizon: {
    term: 'Horizon',
    definition: 'The line where Earth meets sky (0° altitude). Objects below the horizon are not visible.',
    example: 'Rising objects cross the eastern horizon, setting objects cross the western horizon.',
  },
  visibilityWindow: {
    term: 'Visibility Window',
    definition: 'A period when an object is above the horizon and potentially observable from your location.',
    example: 'A window from 8 PM to 2 AM means the object is visible during those hours.',
  },
  observationQuality: {
    term: 'Observation Quality',
    definition: 'Rating based on altitude and brightness. Higher altitude and brighter objects = better quality. Rated as Excellent, Good, Fair, or Poor.',
    example: 'Excellent quality: object is >60° altitude in dark sky.',
  },
};
