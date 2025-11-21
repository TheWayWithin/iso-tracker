'use client';

import { useState } from 'react';
import { OrbitalPlot2D } from './OrbitalPlot2D';
import { EphemerisTable } from './EphemerisTable';
import { CommunitySentiment } from '../evidence/CommunitySentiment';
import { ErrorBoundary } from '../ErrorBoundary';
import Link from 'next/link';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'orbital' | 'evidence' | 'community'>('overview');

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
            className={`px-6 py-3 font-medium rounded-t-lg transition-colors ${
              activeTab === 'community'
                ? 'bg-white text-blue-600 border-t-2 border-x border-blue-600'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            aria-current={activeTab === 'community' ? 'page' : undefined}
          >
            Community
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
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                Object Information
                <span
                  className="text-sm font-normal text-gray-500 cursor-help"
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

            {/* 2D Orbital Visualization */}
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                Orbital Trajectory
                <span
                  className="text-sm font-normal text-gray-500 cursor-help"
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
              <summary className="px-4 py-3 cursor-pointer font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                📖 How to read this chart
              </summary>
              <div className="px-4 py-3 text-sm text-gray-600 space-y-2 border-t border-gray-200">
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
                <p className="text-xs text-gray-500 mt-3">
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
              <h2 className="text-xl font-bold mb-2">Ephemeris Data</h2>
              <p className="text-sm text-gray-600 mb-4">
                Precise position and velocity data from NASA JPL Horizons. Shows where the object is/was at different times.
              </p>
              <ErrorBoundary>
                <EphemerisTable isoId={isoId} />
              </ErrorBoundary>
            </div>
          </div>
        )}

        {/* Evidence Tab */}
        {activeTab === 'evidence' && (
          <div className="p-6">
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 text-center">
              <h3 className="text-lg font-bold mb-3">Evidence Framework</h3>
              <div className="text-sm text-gray-600 space-y-2 mb-4">
                <p>Total evidence pieces: <span className="font-semibold">Coming soon</span></p>
                <p>Assessment count: <span className="font-semibold">Coming soon</span></p>
              </div>
              <Link
                href={`/iso-objects/${isoId}/evidence`}
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
              >
                View All Evidence →
              </Link>
            </div>
          </div>
        )}

        {/* Community Tab */}
        {activeTab === 'community' && (
          <div className="p-6">
            <CommunitySentiment isoId={isoId} />
          </div>
        )}
      </div>
    </div>
  );
}
