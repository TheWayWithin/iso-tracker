'use client';

import { useState } from 'react';
import { Book, ChevronDown, ChevronUp, MapPin, Eye, Calendar, Compass, Globe } from 'lucide-react';

interface GuideSection {
  title: string;
  icon: React.ReactNode;
  content: string[];
}

const GUIDE_SECTIONS: GuideSection[] = [
  {
    title: '1. Set Your Location',
    icon: <MapPin className="h-5 w-5" />,
    content: [
      'Click "Use My Current Location" to enable GPS (recommended)',
      'Or search for your city manually using the search box',
      'Your location is stored only on your device - we never send it to our servers',
      'You can change your location anytime',
    ],
  },
  {
    title: '2. Check Current Visibility',
    icon: <Eye className="h-5 w-5" />,
    content: [
      'Green badge = object is currently visible from your location',
      'Red badge = object is below the horizon (not visible now)',
      'See altitude (height above horizon) and azimuth (compass direction)',
      'Quality rating tells you how good viewing conditions are',
    ],
  },
  {
    title: '3. Plan Your Observations',
    icon: <Calendar className="h-5 w-5" />,
    content: [
      'View upcoming visibility windows (next 5 opportunities)',
      'Each window shows start time, end time, and duration',
      'Click "Add to Calendar" to export observation times',
      'Look for "Excellent" or "Good" quality ratings for best viewing',
    ],
  },
  {
    title: '4. Find It In the Sky',
    icon: <Compass className="h-5 w-5" />,
    content: [
      'Use the sky map to see where to point your telescope',
      'Altitude tells you how high to look (0° = horizon, 90° = zenith)',
      'Azimuth tells you which compass direction to face',
      'Higher altitude (>45°) means better viewing conditions',
    ],
  },
  {
    title: '5. Check Geographic Visibility',
    icon: <Globe className="h-5 w-5" />,
    content: [
      'See which latitudes on Earth can observe this object',
      'Check if your location is within the visible range',
      'Some objects are only visible from specific hemispheres',
      'Circumpolar objects (if shown) are always above horizon for certain latitudes',
    ],
  },
];

interface HowToGuideProps {
  className?: string;
}

export default function HowToGuide({ className = '' }: HowToGuideProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  };

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg ${className}`}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-blue-100 transition-colors rounded-lg"
      >
        <div className="flex items-center gap-2">
          <Book className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-blue-900">How to Use Observation Planning</h3>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-blue-600" />
        ) : (
          <ChevronDown className="h-5 w-5 text-blue-600" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          <p className="text-sm text-blue-700 mb-4">
            Follow these steps to plan your observations and find interstellar objects in the night sky:
          </p>

          {GUIDE_SECTIONS.map((section, index) => (
            <div
              key={index}
              className="bg-white border border-blue-200 rounded-lg overflow-hidden"
            >
              {/* Section Header */}
              <button
                onClick={() => toggleSection(index)}
                className="w-full flex items-center justify-between p-3 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="text-blue-600">{section.icon}</div>
                  <h4 className="font-medium text-gray-900 text-left">{section.title}</h4>
                </div>
                {expandedSections.has(index) ? (
                  <ChevronUp className="h-4 w-4 text-gray-600" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-600" />
                )}
              </button>

              {/* Section Content */}
              {expandedSections.has(index) && (
                <div className="px-3 pb-3">
                  <ul className="space-y-2">
                    {section.content.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-blue-600 mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}

          {/* Tips */}
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-2 text-sm">💡 Pro Tips</h4>
            <ul className="space-y-1 text-xs text-green-800">
              <li>• Best viewing: Look for "Excellent" quality windows when object is high in the sky (&gt;60° altitude)</li>
              <li>• Dark skies: Avoid light pollution by observing from rural areas when possible</li>
              <li>• Weather: Clear skies are essential - check local weather forecasts before observing</li>
              <li>• Equipment: Brighter objects (lower magnitude numbers) are easier to see with smaller telescopes</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
