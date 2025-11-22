'use client';

import React from 'react';

// ============================================================================
// Type Definitions
// ============================================================================

type LoebZone = 'green' | 'yellow' | 'orange' | 'red';

interface LoebScaleDashboardProps {
  officialLevel: number | null;
  officialZone: LoebZone | null;
  officialClassification: string | null;
  communityLevel: number | null;
  communityZone: LoebZone | null;
  communityVoteCount: number;
  isLoading?: boolean;
}

interface ScoreGaugeProps {
  level: number | null;
  zone: LoebZone | null;
  classification: string | null;
  label: string;
  subtitle?: string;
  isLoading?: boolean;
}

// ============================================================================
// Zone Configuration
// ============================================================================

const ZONE_CONFIG: Record<LoebZone, {
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
}> = {
  green: {
    color: '#10B981',
    bgColor: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500',
    icon: '●',
  },
  yellow: {
    color: '#FFB84D',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500',
    icon: '◐',
  },
  orange: {
    color: '#F97316',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-500',
    icon: '◉',
  },
  red: {
    color: '#EF4444',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500',
    icon: '★',
  },
};

const ZONE_LABELS: Record<LoebZone, string> = {
  green: 'Natural Object',
  yellow: 'Anomalous Object',
  orange: 'Suspected Technology',
  red: 'Confirmed Technology',
};

// ============================================================================
// Helper Functions
// ============================================================================

function calculateGaugeRotation(level: number): number {
  const normalizedLevel = Math.max(0, Math.min(10, level));
  return -135 + (normalizedLevel / 10) * 270;
}

// ============================================================================
// Loading Skeleton Component
// ============================================================================

function GaugeSkeleton({ label }: { label: string }) {
  return (
    <div
      className="flex flex-col items-center p-6 rounded-2xl bg-slate-800/50 border border-slate-700"
      aria-label={`Loading ${label}`}
    >
      <div className="relative w-48 h-48 mb-4">
        <div className="absolute inset-0 rounded-full bg-slate-700 animate-pulse" />
        <div className="absolute inset-4 rounded-full bg-slate-800" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-8 bg-slate-700 rounded animate-pulse" />
        </div>
      </div>
      <div className="w-24 h-4 bg-slate-700 rounded animate-pulse mb-2" />
      <div className="w-32 h-6 bg-slate-700 rounded animate-pulse" />
    </div>
  );
}

// ============================================================================
// Score Gauge Component
// ============================================================================

function ScoreGauge({
  level,
  zone,
  classification,
  label,
  subtitle,
  isLoading = false,
}: ScoreGaugeProps) {
  if (isLoading) {
    return <GaugeSkeleton label={label} />;
  }

  if (level === null || zone === null) {
    return (
      <div
        className="flex flex-col items-center p-6 rounded-2xl bg-slate-800/50 border border-slate-700"
        role="region"
        aria-label={`${label} - No score available`}
      >
        <div className="relative w-48 h-48 mb-4">
          <svg
            viewBox="0 0 200 200"
            className="w-full h-full"
            aria-hidden="true"
          >
            <path
              d="M 30 150 A 85 85 0 1 1 170 150"
              fill="none"
              stroke="#334155"
              strokeWidth="12"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl text-slate-500">--</span>
            <span className="text-xs text-slate-500 mt-1">No Data</span>
          </div>
        </div>
        <span className="text-sm font-medium text-slate-400">{label}</span>
        {subtitle && (
          <span className="text-xs text-slate-500 mt-1">{subtitle}</span>
        )}
      </div>
    );
  }

  const config = ZONE_CONFIG[zone];
  const rotation = calculateGaugeRotation(level);
  const shouldPulse = level >= 4;
  const displayClassification = classification || ZONE_LABELS[zone];

  return (
    <div
      className={`
        flex flex-col items-center p-6 rounded-2xl
        ${config.bgColor} border-2 ${config.borderColor}
        transition-all duration-500 ease-out
        ${shouldPulse ? 'animate-[pulse-glow_2s_ease-in-out_infinite]' : ''}
      `}
      role="region"
      aria-label={`${label}: Level ${level}, ${displayClassification}`}
    >
      {/* Gauge */}
      <div className="relative w-48 h-48 mb-4">
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full"
          aria-hidden="true"
        >
          {/* Background arc */}
          <path
            d="M 30 150 A 85 85 0 1 1 170 150"
            fill="none"
            stroke="#334155"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Zone color segments */}
          <path
            d="M 30 150 A 85 85 0 0 1 39.5 108"
            fill="none"
            stroke="#10B981"
            strokeWidth="12"
            strokeLinecap="round"
            opacity={zone === 'green' ? 1 : 0.3}
          />

          <path
            d="M 42 100 A 85 85 0 0 1 100 15"
            fill="none"
            stroke="#FFB84D"
            strokeWidth="12"
            opacity={zone === 'yellow' ? 1 : 0.3}
          />

          <path
            d="M 108 15 A 85 85 0 0 1 165 85"
            fill="none"
            stroke="#F97316"
            strokeWidth="12"
            opacity={zone === 'orange' ? 1 : 0.3}
          />

          <path
            d="M 168 95 A 85 85 0 0 1 170 150"
            fill="none"
            stroke="#EF4444"
            strokeWidth="12"
            strokeLinecap="round"
            opacity={zone === 'red' ? 1 : 0.3}
          />

          {/* Tick marks */}
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((tick) => {
            const tickAngle = -135 + (tick / 10) * 270;
            const innerRadius = 70;
            const outerRadius = tick % 5 === 0 ? 60 : 65;
            const x1 = 100 + innerRadius * Math.cos((tickAngle * Math.PI) / 180);
            const y1 = 100 + innerRadius * Math.sin((tickAngle * Math.PI) / 180);
            const x2 = 100 + outerRadius * Math.cos((tickAngle * Math.PI) / 180);
            const y2 = 100 + outerRadius * Math.sin((tickAngle * Math.PI) / 180);
            return (
              <line
                key={tick}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#64748B"
                strokeWidth={tick % 5 === 0 ? 2 : 1}
              />
            );
          })}

          {/* Needle */}
          <g transform={`rotate(${rotation} 100 100)`}>
            <polygon
              points="100,35 96,100 100,110 104,100"
              fill={config.color}
              className={shouldPulse ? 'drop-shadow-lg' : ''}
            />
            <circle
              cx="100"
              cy="100"
              r="8"
              fill={config.color}
            />
            <circle
              cx="100"
              cy="100"
              r="4"
              fill="#0A1628"
            />
          </g>
        </svg>

        {/* Center score display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
          <span
            className="text-4xl font-bold"
            style={{ color: config.color }}
          >
            {typeof level === 'number' ? level.toFixed(1) : level}
          </span>
          <span className="text-xs text-slate-400 mt-1">/ 10</span>
        </div>
      </div>

      {/* Classification badge */}
      <div className="flex items-center gap-2 mb-2">
        <span
          className="text-lg"
          style={{ color: config.color }}
          aria-hidden="true"
        >
          {config.icon}
        </span>
        <span
          className="text-lg font-semibold"
          style={{ color: config.color }}
        >
          Level {Math.floor(level)}
        </span>
      </div>

      {/* Zone label */}
      <span className="text-sm font-medium text-slate-200 text-center">
        {displayClassification}
      </span>

      {/* Source label */}
      <div className="mt-3 flex flex-col items-center">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          {label}
        </span>
        {subtitle && (
          <span className="text-xs text-slate-500 mt-0.5">{subtitle}</span>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Main Dashboard Component
// ============================================================================

export function LoebScaleDashboard({
  officialLevel,
  officialZone,
  officialClassification,
  communityLevel,
  communityZone,
  communityVoteCount,
  isLoading = false,
}: LoebScaleDashboardProps) {
  const hasOfficialScore = officialLevel !== null;
  const hasCommunityScore = communityLevel !== null;
  const hasBothScores = hasOfficialScore && hasCommunityScore;

  return (
    <section
      className="w-full"
      aria-labelledby="loeb-scale-heading"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2
          id="loeb-scale-heading"
          className="text-lg font-semibold text-slate-100"
        >
          Loeb Scale Assessment
        </h2>
      </div>

      {/* Gauge container */}
      <div
        className={`
          grid gap-4
          ${hasBothScores ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 max-w-sm mx-auto'}
        `}
      >
        {hasOfficialScore && (
          <ScoreGauge
            level={officialLevel}
            zone={officialZone}
            classification={officialClassification}
            label="Official Score"
            subtitle="Expert Assessment"
            isLoading={isLoading}
          />
        )}

        {hasCommunityScore && (
          <ScoreGauge
            level={communityLevel}
            zone={communityZone}
            classification={communityZone ? ZONE_LABELS[communityZone] : null}
            label="Community Score"
            subtitle={`${communityVoteCount.toLocaleString()} votes`}
            isLoading={isLoading}
          />
        )}

        {!hasOfficialScore && !hasCommunityScore && !isLoading && (
          <div className="col-span-full flex flex-col items-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
              <span className="text-2xl">?</span>
            </div>
            <h3 className="text-lg font-medium text-slate-300 mb-2">
              No Assessment Yet
            </h3>
            <p className="text-sm text-slate-500 max-w-xs">
              This ISO has not been assessed on the Loeb Scale.
              Check back later or contribute your analysis.
            </p>
          </div>
        )}

        {isLoading && !hasOfficialScore && !hasCommunityScore && (
          <>
            <GaugeSkeleton label="Official Score" />
            <GaugeSkeleton label="Community Score" />
          </>
        )}
      </div>

      {/* Scale legend */}
      <div className="mt-6 p-4 rounded-xl bg-slate-800/30 border border-slate-700">
        <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
          Loeb Scale Zones
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(['green', 'yellow', 'orange', 'red'] as LoebZone[]).map((zone) => {
            const config = ZONE_CONFIG[zone];
            const ranges = {
              green: '0-1',
              yellow: '2-4',
              orange: '5-7',
              red: '8-10',
            };
            return (
              <div key={zone} className="flex items-center gap-2">
                <span
                  className="text-sm"
                  style={{ color: config.color }}
                  aria-hidden="true"
                >
                  {config.icon}
                </span>
                <div className="flex flex-col">
                  <span
                    className="text-xs font-medium"
                    style={{ color: config.color }}
                  >
                    {ranges[zone]}
                  </span>
                  <span className="text-xs text-slate-400">
                    {ZONE_LABELS[zone].split(' ')[0]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default LoebScaleDashboard;
