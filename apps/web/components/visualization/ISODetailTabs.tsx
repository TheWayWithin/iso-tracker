'use client';

import { useState, useCallback, useEffect } from 'react';
import { OrbitalPlot2D } from './OrbitalPlot2D';
import { EphemerisTable } from './EphemerisTable';
import { CommunitySentiment } from '../evidence/CommunitySentiment';
import { ArgumentList } from '../arguments';
import { EvidenceList } from '../evidence';
import { ErrorBoundary } from '../ErrorBoundary';
import Link from 'next/link';
import { Eye, EyeOff, Scale, MessageSquare } from 'lucide-react';

// Observation Planning Components
import LocationSelector from '../observation/LocationSelector';
import VisibilityStatus from '../observation/VisibilityStatus';
import ObservationWindows from '../observation/ObservationWindows';
import SkyMap from '../observation/SkyMap';
import HowToGuide from '../observation/HowToGuide';
import { useVisibility, formatTimeUntil } from '@/hooks/useVisibility';
import type { LocationResult } from '@/lib/location/location-service';

// Loeb Scale Components
import { LoebScaleDashboard, LoebCriteriaChecklist, LoebScaleVoting } from '../loeb-scale';
import { useLoebScale } from '@/hooks/useLoebScale';

interface ISODetailTabsProps {
  isoId: string;
  isoName: string;
  isoNasaId: string;
  isoObjectType: string;
  isoDiscoveryDate: string;
  isoDesignation: string;
}

export function ISODetailTabs({
  isoId,
  isoName,
  isoNasaId,
  isoObjectType,
  isoDiscoveryDate,
  isoDesignation,
}: ISODetailTabsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'orbital' | 'observation' | 'loeb-scale' | 'evidence' | 'community'>('overview');
  const [userLocation, setUserLocation] = useState<LocationResult | undefined>(undefined);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [canVote, setCanVote] = useState(false);
  const [canSubmitEvidence, setCanSubmitEvidence] = useState(false);
  const [canAssessEvidence, setCanAssessEvidence] = useState(false);

  // Check auth status for community features
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/status');
        if (response.ok) {
          const data = await response.json();
          setIsAuthenticated(!!data.user);
          // Event Pass or higher can vote and submit evidence
          const isEventPassOrHigher = data.tier === 'event_pass' || data.tier === 'evidence_analyst';
          setCanVote(isEventPassOrHigher);
          setCanSubmitEvidence(isEventPassOrHigher);
          // Only Evidence Analyst can assess evidence
          setCanAssessEvidence(data.tier === 'evidence_analyst');
        }
      } catch {
        setIsAuthenticated(false);
        setCanVote(false);
        setCanSubmitEvidence(false);
        setCanAssessEvidence(false);
      }
    };
    checkAuth();
  }, []);

  // Fetch Loeb Scale data
  const { data: loebData, loading: loebLoading, error: loebError, refetch: refetchLoeb } = useLoebScale({
    isoId,
    autoRefresh: true,
    refreshInterval: 60000,
  });

  // Fetch visibility data
  const { data: visibilityData, loading: visibilityLoading, error: visibilityError, refetch: refetchVisibility } = useVisibility({
    isoId,
    location: userLocation,
    days: 30,
    autoRefresh: true,
    refreshInterval: 300000, // 5 minutes
  });

  // Handle location changes
  const handleLocationChange = useCallback((location: LocationResult) => {
    setUserLocation(location);
  }, []);

  return (
    <div>
      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 rounded-t-lg">
        <div className="flex gap-1 px-2 pt-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 font-medium rounded-t-lg transition-colors ${
              activeTab === 'overview'
                ? 'bg-white text-blue-600 border-t-2 border-x border-blue-600'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            aria-current={activeTab === 'overview' ? 'page' : undefined}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('orbital')}
            className={`px-6 py-3 font-medium rounded-t-lg transition-colors ${
              activeTab === 'orbital'
                ? 'bg-white text-blue-600 border-t-2 border-x border-blue-600'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            aria-current={activeTab === 'orbital' ? 'page' : undefined}
          >
            Orbital Data
          </button>
          <button
            onClick={() => setActiveTab('observation')}
            className={`px-6 py-3 font-medium rounded-t-lg transition-colors flex items-center gap-2 ${
              activeTab === 'observation'
                ? 'bg-white text-blue-600 border-t-2 border-x border-blue-600'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            aria-current={activeTab === 'observation' ? 'page' : undefined}
          >
            Observation
            {/* Quick visibility indicator */}
            {visibilityData?.forecast?.currentStatus && (
              visibilityData.forecast.currentStatus.isVisible ? (
                <span className="w-2 h-2 rounded-full bg-green-500" title="Currently visible" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-gray-400" title="Not currently visible" />
              )
            )}
          </button>
          <button
            onClick={() => setActiveTab('loeb-scale')}
            className={`px-6 py-3 font-medium rounded-t-lg transition-colors flex items-center gap-2 ${
              activeTab === 'loeb-scale'
                ? 'bg-white text-blue-600 border-t-2 border-x border-blue-600'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            aria-current={activeTab === 'loeb-scale' ? 'page' : undefined}
          >
            <Scale className="w-4 h-4" />
            Loeb Scale
            {/* Zone indicator */}
            {loebData?.official_zone && (
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor:
                    loebData.official_zone === 'green' ? '#10B981' :
                    loebData.official_zone === 'yellow' ? '#FFB84D' :
                    loebData.official_zone === 'orange' ? '#F97316' : '#EF4444'
                }}
                title={`Level ${loebData.official_level}`}
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('evidence')}
            className={`px-6 py-3 font-medium rounded-t-lg transition-colors ${
              activeTab === 'evidence'
                ? 'bg-white text-blue-600 border-t-2 border-x border-blue-600'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            aria-current={activeTab === 'evidence' ? 'page' : undefined}
          >
            Evidence
          </button>
          <button
            onClick={() => setActiveTab('community')}
            className={`px-6 py-3 font-medium rounded-t-lg transition-colors flex items-center gap-2 ${
              activeTab === 'community'
                ? 'bg-white text-blue-600 border-t-2 border-x border-blue-600'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            aria-current={activeTab === 'community' ? 'page' : undefined}
          >
            <MessageSquare className="w-4 h-4" />
            Debate
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-b-lg border border-t-0 border-gray-200">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="p-6 space-y-6">
            {/* Object Information */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                Object Information
                <span
                  className="text-sm font-normal text-gray-600 cursor-help"
                  title="Basic metadata about this interstellar object from NASA JPL"
                >
                  ℹ️
                </span>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-gray-700 text-sm font-medium">NASA ID</p>
                  <p className="font-mono font-semibold text-gray-900">{isoNasaId}</p>
                </div>
                <div>
                  <p className="text-gray-700 text-sm font-medium">Type</p>
                  <p className="capitalize font-semibold text-gray-900 flex items-center gap-1">
                    {isoObjectType}
                    {isoObjectType === 'hyperbolic' && (
                      <span
                        className="text-xs text-gray-600 cursor-help"
                        title="A hyperbolic orbit proves this object came from outside our solar system. Unlike elliptical planetary orbits, hyperbolic paths are open-ended and pass through the solar system only once."
                      >
                        ℹ️
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-gray-700 text-sm font-medium">Discovery Date</p>
                  <p className="font-semibold text-gray-900">{new Date(isoDiscoveryDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-gray-700 text-sm font-medium">Designation</p>
                  <p className="font-semibold text-gray-900">{isoDesignation}</p>
                </div>
              </div>
            </div>

            {/* Quick Visibility Status */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  {visibilityLoading ? (
                    <div className="w-3 h-3 rounded-full bg-gray-300 animate-pulse" />
                  ) : visibilityData?.forecast?.currentStatus?.isVisible ? (
                    <div className="flex items-center gap-2">
                      <Eye className="h-5 w-5 text-green-600" />
                      <span className="font-semibold text-green-700">Currently Visible</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <EyeOff className="h-5 w-5 text-gray-500" />
                      <span className="font-semibold text-gray-600">Not Currently Visible</span>
                    </div>
                  )}
                  {visibilityData?.forecast?.nextRise && !visibilityData?.forecast?.currentStatus?.isVisible && (
                    <span className="text-sm text-gray-600">
                      • Next visible {formatTimeUntil(visibilityData.forecast.nextRise)}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setActiveTab('observation')}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  View Observation Details →
                </button>
              </div>
              {!userLocation && !visibilityLoading && (
                <p className="text-xs text-gray-500 mt-2">
                  Set your location in the Observation tab to see visibility information.
                </p>
              )}
            </div>

            {/* 2D Orbital Visualization */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                Orbital Trajectory
                <span
                  className="text-sm font-normal text-gray-600 cursor-help"
                  title="Interactive visualization showing the object's path through our solar system"
                >
                  ℹ️
                </span>
              </h2>
              <ErrorBoundary>
                <OrbitalPlot2D isoId={isoId} isoName={isoName} />
              </ErrorBoundary>
            </div>

            {/* How to Read This Chart */}
            <details className="border border-gray-200 rounded-lg">
              <summary className="px-4 py-3 cursor-pointer font-medium text-gray-900 hover:bg-gray-50 rounded-lg">
                📖 How to read this chart
              </summary>
              <div className="px-4 py-3 text-sm text-gray-700 space-y-2 border-t border-gray-200">
                <p>
                  <strong>Sun (yellow):</strong> The center of our solar system. All distances are measured from here.
                </p>
                <p>
                  <strong>Planetary orbits (gray circles):</strong> Shown for scale. Earth is at 1.0 AU (Astronomical Unit = Earth-Sun distance, ~150 million km).
                </p>
                <p>
                  <strong>Object trajectory (orange line):</strong> The path this interstellar object took/will take through our solar system. Notice it's not a circle - it's hyperbolic!
                </p>
                <p>
                  <strong>Current position (blue pulsing dot):</strong> Use the time slider to see where the object was or will be on any date.
                </p>
                <p>
                  <strong>Controls:</strong> Zoom in/out with buttons, pan by clicking and dragging, scrub through time with the slider.
                </p>
                <p className="text-xs text-gray-700 font-medium mt-3">
                  Data provided by{' '}
                  <a
                    href="https://ssd.jpl.nasa.gov/horizons/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 underline"
                  >
                    NASA JPL Horizons System
                  </a>
                </p>
              </div>
            </details>
          </div>
        )}

        {/* Orbital Data Tab */}
        {activeTab === 'orbital' && (
          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Ephemeris Data</h2>
              <p className="text-sm text-gray-700 font-medium mb-4">
                Precise position and velocity data from NASA JPL Horizons. Shows where the object is/was at different times.
              </p>
              <ErrorBoundary>
                <EphemerisTable isoId={isoId} />
              </ErrorBoundary>
            </div>
          </div>
        )}

        {/* Observation Planning Tab */}
        {activeTab === 'observation' && (
          <div className="p-6 space-y-6">
            {/* Location Selector */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                Your Location
                <span
                  className="text-sm font-normal text-gray-600 cursor-help"
                  title="Set your location to calculate when this object is visible from your position"
                >
                  ℹ️
                </span>
              </h2>
              <ErrorBoundary>
                <LocationSelector onLocationChange={handleLocationChange} />
              </ErrorBoundary>
            </div>

            {/* Current Visibility Status */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                Current Visibility
                {visibilityData?.forecast?.currentStatus?.isVisible ? (
                  <Eye className="h-5 w-5 text-green-600" />
                ) : (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                )}
              </h2>
              <ErrorBoundary>
                <VisibilityStatus
                  data={visibilityData}
                  loading={visibilityLoading}
                  error={visibilityError}
                />
              </ErrorBoundary>
            </div>

            {/* Sky Map */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Sky Position</h2>
              <ErrorBoundary>
                <SkyMap
                  data={visibilityData}
                  loading={visibilityLoading}
                />
              </ErrorBoundary>
            </div>

            {/* Upcoming Observation Windows */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Upcoming Observation Windows</h2>
              <ErrorBoundary>
                <ObservationWindows
                  data={visibilityData}
                  loading={visibilityLoading}
                  error={visibilityError}
                />
              </ErrorBoundary>
            </div>

            {/* How To Guide */}
            <HowToGuide />
          </div>
        )}

        {/* Loeb Scale Tab */}
        {activeTab === 'loeb-scale' && (
          <div className="p-6 space-y-8 bg-slate-900">
            {/* Dashboard */}
            <ErrorBoundary>
              <LoebScaleDashboard
                officialLevel={loebData?.official_level ?? null}
                officialZone={loebData?.official_zone ?? null}
                officialClassification={loebData?.official_classification ?? null}
                communityLevel={loebData?.community_level ?? null}
                communityZone={loebData?.community_zone ?? null}
                communityVoteCount={loebData?.community_vote_count ?? 0}
                isLoading={loebLoading}
              />
            </ErrorBoundary>

            {/* Two-column layout on desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Criteria Checklist */}
              <div>
                <h3 className="text-lg font-semibold text-slate-100 mb-4">Assessment Criteria</h3>
                <ErrorBoundary>
                  <LoebCriteriaChecklist
                    currentLevel={loebData?.official_level ?? null}
                    criteriaMet={loebData?.criteria_met ?? []}
                    evidenceLinks={loebData?.evidence_links ?? []}
                  />
                </ErrorBoundary>
              </div>

              {/* Voting */}
              <div>
                <h3 className="text-lg font-semibold text-slate-100 mb-4">Community Voting</h3>
                <ErrorBoundary>
                  <LoebScaleVoting
                    isoId={isoId}
                    officialLevel={loebData?.official_level ?? null}
                    onVoteSubmit={() => refetchLoeb()}
                  />
                </ErrorBoundary>
              </div>
            </div>

            {/* Additional Info */}
            {loebData?.official_reasoning && (
              <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                <h4 className="text-sm font-semibold text-slate-300 mb-2">Official Assessment Reasoning</h4>
                <p className="text-sm text-slate-400">{loebData.official_reasoning}</p>
                {loebData.official_source && (
                  <p className="text-xs text-slate-500 mt-2">Source: {loebData.official_source}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Evidence Tab */}
        {activeTab === 'evidence' && (
          <div className="p-6 bg-slate-900">
            <ErrorBoundary>
              <EvidenceList
                isoId={isoId}
                isAuthenticated={isAuthenticated}
                canSubmit={canSubmitEvidence}
                canAssess={canAssessEvidence}
              />
            </ErrorBoundary>
          </div>
        )}

        {/* Community Debate Tab */}
        {activeTab === 'community' && (
          <div className="p-6 bg-slate-900">
            <ErrorBoundary>
              <ArgumentList
                isoId={isoId}
                isAuthenticated={isAuthenticated}
                canVote={canVote}
              />
            </ErrorBoundary>
          </div>
        )}
      </div>
    </div>
  );
}
