'use client';

import { useState, useEffect, useMemo } from 'react';
import { Check, ChevronDown, ChevronRight, HelpCircle, ExternalLink, Info } from 'lucide-react';

// Types for Loeb Scale criteria
interface LoebCriteria {
  level: number;
  zone: string;
  zone_color: string;
  classification: string;
  title: string;
  description: string;
  criteria: string[];
  observable_categories: string[];
  examples: string[];
}

interface LoebCriteriaChecklistProps {
  currentLevel: number | null;
  criteriaMet: string[];
  evidenceLinks: string[];
  onCriteriaClick?: (criterion: string) => void;
  criteria?: LoebCriteria[];
}

// Zone color mappings
const ZONE_COLORS = {
  green: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    text: 'text-green-400',
    accent: 'bg-green-500',
  },
  yellow: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    text: 'text-yellow-400',
    accent: 'bg-yellow-500',
  },
  orange: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    text: 'text-orange-400',
    accent: 'bg-orange-500',
  },
  red: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-400',
    accent: 'bg-red-500',
  },
};

const CATEGORY_EXPLANATIONS: Record<string, string> = {
  'Trajectory Anomalies': 'Unusual movement patterns that differ from expected orbital mechanics',
  'Spectroscopic Signatures': 'Light patterns that reveal chemical composition and properties',
  'Geometric Properties': 'Physical shape and structural characteristics',
  'Surface Composition': 'Materials and substances detected on the surface',
  'Electromagnetic Signals': 'Radio waves, light emissions, or other EM radiation',
  'Operational Indicators': 'Signs of purposeful activity or functionality',
};

function HelpTooltip({ text }: { text: string }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        aria-label="More information"
      >
        <HelpCircle className="w-4 h-4" />
      </button>
      {isVisible && (
        <div className="absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-3 text-xs text-slate-200 bg-slate-800 border border-slate-700 rounded-lg shadow-lg">
          <div className="absolute left-1/2 -translate-x-1/2 top-full -mt-1">
            <div className="border-4 border-transparent border-t-slate-800" />
          </div>
          {text}
        </div>
      )}
    </div>
  );
}

function LevelAccordion({
  level,
  isCurrentLevel,
  criteriaMet,
  evidenceLinks,
  onCriteriaClick,
  isExpanded,
  onToggle,
}: {
  level: LoebCriteria;
  isCurrentLevel: boolean;
  criteriaMet: string[];
  evidenceLinks: string[];
  onCriteriaClick?: (criterion: string) => void;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const zoneKey = level.zone as keyof typeof ZONE_COLORS;
  const colors = ZONE_COLORS[zoneKey] || ZONE_COLORS.green;

  const metCount = level.criteria.filter(c =>
    criteriaMet.some(met => met.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(met.toLowerCase()))
  ).length;

  const criteriaByCategory = useMemo(() => {
    const grouped: Record<string, string[]> = {};

    level.criteria.forEach(criterion => {
      let category = 'General';

      if (criterion.toLowerCase().includes('trajectory') || criterion.toLowerCase().includes('orbit') || criterion.toLowerCase().includes('velocity') || criterion.toLowerCase().includes('acceleration')) {
        category = 'Trajectory Anomalies';
      } else if (criterion.toLowerCase().includes('spectrum') || criterion.toLowerCase().includes('spectral') || criterion.toLowerCase().includes('light') || criterion.toLowerCase().includes('emission')) {
        category = 'Spectroscopic Signatures';
      } else if (criterion.toLowerCase().includes('shape') || criterion.toLowerCase().includes('geometric') || criterion.toLowerCase().includes('structure') || criterion.toLowerCase().includes('size')) {
        category = 'Geometric Properties';
      } else if (criterion.toLowerCase().includes('surface') || criterion.toLowerCase().includes('material') || criterion.toLowerCase().includes('composition') || criterion.toLowerCase().includes('albedo')) {
        category = 'Surface Composition';
      } else if (criterion.toLowerCase().includes('signal') || criterion.toLowerCase().includes('electromagnetic') || criterion.toLowerCase().includes('radio') || criterion.toLowerCase().includes('transmission')) {
        category = 'Electromagnetic Signals';
      } else if (criterion.toLowerCase().includes('operation') || criterion.toLowerCase().includes('function') || criterion.toLowerCase().includes('behavior') || criterion.toLowerCase().includes('maneuver')) {
        category = 'Operational Indicators';
      }

      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(criterion);
    });

    return grouped;
  }, [level.criteria]);

  return (
    <div
      className={`
        border rounded-lg overflow-hidden transition-all duration-200
        ${colors.border}
        ${isCurrentLevel ? `${colors.bg} ring-2 ring-offset-2 ring-offset-slate-900 ${colors.border.replace('border-', 'ring-')}` : 'bg-slate-900/50'}
      `}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/50 transition-colors"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${colors.bg} ${colors.text}`}>
            {level.level}
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">{level.title}</span>
              {isCurrentLevel && (
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${colors.bg} ${colors.text}`}>
                  Current
                </span>
              )}
            </div>
            <span className="text-xs text-slate-400">{level.classification}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className={`text-sm font-medium ${metCount > 0 ? colors.text : 'text-slate-500'}`}>
              {metCount}/{level.criteria.length}
            </span>
            <span className="text-xs text-slate-500">met</span>
          </div>

          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-slate-800 p-4 space-y-4">
          <p className="text-sm text-slate-300">{level.description}</p>

          {Object.entries(criteriaByCategory).map(([category, criteriaList]) => (
            <div key={category} className="space-y-2">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {category}
                </h4>
                {CATEGORY_EXPLANATIONS[category] && (
                  <HelpTooltip text={CATEGORY_EXPLANATIONS[category]} />
                )}
              </div>

              <ul className="space-y-2">
                {criteriaList.map((criterion, idx) => {
                  const isMet = criteriaMet.some(
                    met => met.toLowerCase().includes(criterion.toLowerCase()) ||
                           criterion.toLowerCase().includes(met.toLowerCase())
                  );
                  const evidenceIdx = criteriaMet.findIndex(
                    met => met.toLowerCase().includes(criterion.toLowerCase()) ||
                           criterion.toLowerCase().includes(met.toLowerCase())
                  );
                  const evidenceLink = evidenceIdx >= 0 ? evidenceLinks[evidenceIdx] : null;

                  return (
                    <li
                      key={idx}
                      className={`flex items-start gap-3 p-2 rounded-lg transition-colors ${isMet ? 'bg-green-500/10' : 'bg-slate-800/30'}`}
                    >
                      <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${isMet ? 'bg-green-500 text-white' : 'border border-slate-600 text-transparent'}`}>
                        <Check className="w-3.5 h-3.5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={() => onCriteriaClick?.(criterion)}
                          className={`text-sm text-left ${isMet ? 'text-white' : 'text-slate-400'} ${onCriteriaClick ? 'hover:text-slate-200 cursor-pointer' : 'cursor-default'}`}
                        >
                          {criterion}
                        </button>

                        {evidenceLink && (
                          <a
                            href={evidenceLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-1 text-xs text-blue-400 hover:text-blue-300"
                          >
                            <ExternalLink className="w-3 h-3" />
                            View evidence
                          </a>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {level.examples && level.examples.length > 0 && (
            <div className="pt-2 border-t border-slate-800">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Examples
              </h4>
              <ul className="space-y-1">
                {level.examples.map((example, idx) => (
                  <li key={idx} className="text-sm text-slate-400 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                    {example}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function WhyThisScore({
  currentLevel,
  criteria,
  criteriaMet,
}: {
  currentLevel: number | null;
  criteria: LoebCriteria[];
  criteriaMet: string[];
}) {
  if (currentLevel === null) return null;

  const levelData = criteria.find(c => c.level === currentLevel);
  if (!levelData) return null;

  const zoneKey = levelData.zone as keyof typeof ZONE_COLORS;
  const colors = ZONE_COLORS[zoneKey] || ZONE_COLORS.green;

  return (
    <div className={`p-4 rounded-lg ${colors.bg} ${colors.border} border`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${colors.bg}`}>
          <Info className={`w-5 h-5 ${colors.text}`} />
        </div>

        <div className="flex-1 space-y-2">
          <h3 className="font-semibold text-white">Why Level {currentLevel}?</h3>

          <p className="text-sm text-slate-300">
            This object has been assigned <span className={`font-semibold ${colors.text}`}>Level {currentLevel}</span> on
            the Loeb Scale based on {criteriaMet.length} confirmed {criteriaMet.length === 1 ? 'criterion' : 'criteria'}.
          </p>

          <div className="text-sm text-slate-400">
            <p>
              <strong className="text-slate-300">Zone:</strong>{' '}
              <span className={colors.text}>{levelData.zone}</span> ({levelData.classification})
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LoebCriteriaChecklist({
  currentLevel,
  criteriaMet,
  evidenceLinks,
  onCriteriaClick,
  criteria: propCriteria,
}: LoebCriteriaChecklistProps) {
  const [criteria, setCriteria] = useState<LoebCriteria[]>(propCriteria || []);
  const [expandedLevels, setExpandedLevels] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(!propCriteria);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (propCriteria) {
      setCriteria(propCriteria);
      return;
    }

    async function fetchCriteria() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/loeb-scale/criteria');

        if (!response.ok) {
          throw new Error('Failed to fetch criteria');
        }

        const data = await response.json();
        setCriteria(data.criteria || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load criteria');
      } finally {
        setIsLoading(false);
      }
    }

    fetchCriteria();
  }, [propCriteria]);

  useEffect(() => {
    if (currentLevel !== null) {
      setExpandedLevels(new Set([currentLevel]));
    }
  }, [currentLevel]);

  const toggleLevel = (level: number) => {
    setExpandedLevels(prev => {
      const next = new Set(prev);
      if (next.has(level)) {
        next.delete(level);
      } else {
        next.add(level);
      }
      return next;
    });
  };

  const criteriaByZone = useMemo(() => {
    const zones: Record<string, LoebCriteria[]> = {
      green: [],
      yellow: [],
      orange: [],
      red: [],
    };

    criteria.forEach(level => {
      const zone = level.zone || 'green';
      if (zones[zone]) {
        zones[zone].push(level);
      }
    });

    return zones;
  }, [criteria]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 bg-slate-800 rounded animate-pulse w-48" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 bg-slate-800 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
        <p className="text-red-400 text-sm">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-2 text-xs text-red-300 hover:text-red-200 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <WhyThisScore
        currentLevel={currentLevel}
        criteria={criteria}
        criteriaMet={criteriaMet}
      />

      {Object.entries(criteriaByZone).map(([zone, levels]) => {
        if (levels.length === 0) return null;

        const colors = ZONE_COLORS[zone as keyof typeof ZONE_COLORS];
        const zoneLabel = zone.charAt(0).toUpperCase() + zone.slice(1);

        return (
          <div key={zone} className="space-y-3">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${colors.accent}`} />
              <h3 className={`text-sm font-semibold ${colors.text}`}>
                {zoneLabel} Zone
              </h3>
              <span className="text-xs text-slate-500">
                (Levels {levels[0]?.level}-{levels[levels.length - 1]?.level})
              </span>
            </div>

            <div className="space-y-2">
              {levels.map(level => (
                <LevelAccordion
                  key={level.level}
                  level={level}
                  isCurrentLevel={level.level === currentLevel}
                  criteriaMet={criteriaMet}
                  evidenceLinks={evidenceLinks}
                  onCriteriaClick={onCriteriaClick}
                  isExpanded={expandedLevels.has(level.level)}
                  onToggle={() => toggleLevel(level.level)}
                />
              ))}
            </div>
          </div>
        );
      })}

      <div className="pt-4 border-t border-slate-800">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Observable Categories
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {Object.entries(CATEGORY_EXPLANATIONS).map(([category, explanation]) => (
            <div key={category} className="flex items-start gap-2 text-xs">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-500 mt-1.5 flex-shrink-0" />
              <div>
                <span className="text-slate-300 font-medium">{category}</span>
                <p className="text-slate-500 mt-0.5">{explanation}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default LoebCriteriaChecklist;
