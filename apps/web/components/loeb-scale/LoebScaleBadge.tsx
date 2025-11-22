'use client';

import React from 'react';

type LoebZone = 'green' | 'yellow' | 'orange' | 'red';

interface LoebScaleBadgeProps {
  level: number | null;
  zone: LoebZone | null;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const ZONE_CONFIG: Record<LoebZone, {
  color: string;
  label: string;
  icon: string;
}> = {
  green: { color: '#10B981', label: 'Natural', icon: '●' },
  yellow: { color: '#FFB84D', label: 'Anomalous', icon: '◐' },
  orange: { color: '#F97316', label: 'Suspected', icon: '◉' },
  red: { color: '#EF4444', label: 'Confirmed', icon: '★' },
};

export function LoebScaleBadge({
  level,
  zone,
  size = 'md',
  showLabel = false,
}: LoebScaleBadgeProps) {
  if (level === null || zone === null) {
    return (
      <div
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-800 text-slate-500 ${
          size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'
        }`}
        title="No Loeb Scale assessment"
      >
        <span>--</span>
        {showLabel && <span className="opacity-60">No Data</span>}
      </div>
    );
  }

  const config = ZONE_CONFIG[zone];
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 gap-1',
    md: 'text-sm px-2 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2',
  };

  return (
    <div
      className={`inline-flex items-center rounded-full font-medium ${sizeClasses[size]}`}
      style={{
        backgroundColor: `${config.color}20`,
        color: config.color,
        border: `1px solid ${config.color}40`,
      }}
      title={`Loeb Scale Level ${level} - ${config.label}`}
    >
      <span aria-hidden="true">{config.icon}</span>
      <span className="font-bold">{level}</span>
      {showLabel && (
        <span className="font-normal opacity-80">{config.label}</span>
      )}
    </div>
  );
}

export default LoebScaleBadge;
