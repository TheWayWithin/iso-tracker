'use client';

import { useState, useRef, useEffect } from 'react';
import { HelpCircle, X } from 'lucide-react';

export interface AstronomyTerm {
  term: string;
  definition: string;
  example?: string;
}

// Pre-defined astronomy terms for observation planning
export const ASTRONOMY_TERMS: Record<string, AstronomyTerm> = {
  altitude: {
    term: 'Altitude',
    definition: 'Height above the horizon, measured in degrees. 0° is at the horizon, 90° is directly overhead (zenith).',
    example: 'An altitude of 45° means the object is halfway between the horizon and directly overhead.',
  },
  azimuth: {
    term: 'Azimuth',
    definition: 'Compass direction measured in degrees. 0° = North, 90° = East, 180° = South, 270° = West.',
    example: 'An azimuth of 135° means the object is in the southeast direction.',
  },
  magnitude: {
    term: 'Magnitude',
    definition: 'Brightness measure where lower numbers = brighter objects. Negative values are very bright.',
    example: 'Objects with magnitude <6.0 are visible to the naked eye. The Sun is magnitude -27, full Moon is -13.',
  },
  rightAscension: {
    term: 'Right Ascension (RA)',
    definition: 'Celestial longitude measured in hours (0h to 24h). Like longitude on Earth but for the sky.',
    example: 'RA 12h 30m means the object is at celestial longitude 12.5 hours.',
  },
  declination: {
    term: 'Declination (Dec)',
    definition: 'Celestial latitude measured in degrees from -90° to +90°. Like latitude on Earth but for the sky.',
    example: 'Dec +45° means the object is 45° north of the celestial equator.',
  },
  zenith: {
    term: 'Zenith',
    definition: 'The point in the sky directly above you (altitude 90°). Objects at zenith have the best viewing conditions.',
    example: 'When a star is at zenith, you look straight up to see it.',
  },
  horizon: {
    term: 'Horizon',
    definition: 'The apparent boundary between Earth and sky (altitude 0°). Objects below the horizon cannot be seen.',
    example: 'When the Sun sets, it drops below the horizon.',
  },
  visibilityWindow: {
    term: 'Visibility Window',
    definition: 'A time period when an object is above the horizon and potentially observable from your location.',
    example: 'A visibility window from 9pm to 3am means the object is above horizon during those hours.',
  },
  observationQuality: {
    term: 'Observation Quality',
    definition: 'Rating of viewing conditions based on altitude, brightness, and atmospheric conditions.',
    example: 'Excellent quality: high altitude (>60°), good magnitude, clear atmospheric conditions.',
  },
};

interface HelpTooltipProps {
  termKey: keyof typeof ASTRONOMY_TERMS;
  className?: string;
  iconSize?: 'sm' | 'md' | 'lg';
}

export default function HelpTooltip({
  termKey,
  className = '',
  iconSize = 'sm',
}: HelpTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<'top' | 'bottom'>('bottom');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const term = ASTRONOMY_TERMS[termKey];

  // Calculate position on open
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      // Show tooltip above if not enough space below
      setPosition(spaceBelow < 200 && spaceAbove > spaceBelow ? 'top' : 'bottom');
    }
  }, [isOpen]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  if (!term) {
    console.warn(`HelpTooltip: Unknown term key "${termKey}"`);
    return null;
  }

  return (
    <span className={`relative inline-flex items-center ${className}`}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        className="text-gray-500 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full p-0.5 transition-colors"
        aria-label={`Help: ${term.term}`}
        aria-expanded={isOpen}
        data-testid={`tooltip-${termKey}`}
      >
        <HelpCircle className={iconSizes[iconSize]} />
      </button>

      {isOpen && (
        <div
          ref={tooltipRef}
          role="tooltip"
          data-testid="tooltip-content"
          className={`
            absolute z-50 w-72 p-4 bg-white border border-gray-200 rounded-lg shadow-lg
            ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'}
            left-1/2 -translate-x-1/2
          `}
        >
          {/* Close button */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 p-1"
            aria-label="Close tooltip"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Content */}
          <div className="pr-6">
            <h4 className="font-semibold text-gray-900 mb-2">
              {term.term}
            </h4>
            <p className="text-sm text-gray-700 mb-2">
              {term.definition}
            </p>
            {term.example && (
              <p className="text-xs text-gray-500 italic bg-gray-50 p-2 rounded">
                Example: {term.example}
              </p>
            )}
          </div>

          {/* Arrow */}
          <div
            className={`
              absolute left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-gray-200 transform rotate-45
              ${position === 'top'
                ? 'bottom-0 translate-y-1/2 border-r border-b'
                : 'top-0 -translate-y-1/2 border-l border-t'}
            `}
          />
        </div>
      )}
    </span>
  );
}

// Convenience component for inline usage with custom text
interface HelpTextProps {
  children: React.ReactNode;
  termKey: keyof typeof ASTRONOMY_TERMS;
  className?: string;
}

export function HelpText({ children, termKey, className = '' }: HelpTextProps) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <span className="border-b border-dotted border-gray-400 cursor-help">
        {children}
      </span>
      <HelpTooltip termKey={termKey} iconSize="sm" />
    </span>
  );
}
