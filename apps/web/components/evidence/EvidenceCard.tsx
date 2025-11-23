'use client';

import { useState } from 'react';
import { Clock, User, MessageSquare, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

// Simple relative time formatter
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return date.toLocaleDateString();
}

export type EvidenceType =
  | 'observation'
  | 'spectroscopy'
  | 'astrometry'
  | 'photometry'
  | 'radar'
  | 'theoretical'
  | 'simulation'
  | 'literature'
  | 'other';

interface EvidenceProfile {
  display_name: string | null;
  avatar_url: string | null;
}

export interface Evidence {
  id: string;
  iso_object_id: string;
  submitter_id: string;
  evidence_type: EvidenceType;
  title: string;
  description: string;
  methodology: string;
  source_url: string | null;
  quality_score: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  profiles?: EvidenceProfile[] | EvidenceProfile | null;
}

interface EvidenceCardProps {
  evidence: Evidence;
  onViewComments?: (evidenceId: string) => void;
}

const TYPE_CONFIG: Record<EvidenceType, { label: string; color: string; bg: string }> = {
  observation: {
    label: 'Observation',
    color: 'text-green-400',
    bg: 'bg-green-500/20 border-green-500/30',
  },
  spectroscopy: {
    label: 'Spectroscopy',
    color: 'text-blue-400',
    bg: 'bg-blue-500/20 border-blue-500/30',
  },
  astrometry: {
    label: 'Astrometry',
    color: 'text-purple-400',
    bg: 'bg-purple-500/20 border-purple-500/30',
  },
  photometry: {
    label: 'Photometry',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/20 border-yellow-500/30',
  },
  radar: {
    label: 'Radar',
    color: 'text-orange-400',
    bg: 'bg-orange-500/20 border-orange-500/30',
  },
  theoretical: {
    label: 'Theoretical',
    color: 'text-gray-400',
    bg: 'bg-gray-500/20 border-gray-500/30',
  },
  simulation: {
    label: 'Simulation',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/20 border-cyan-500/30',
  },
  literature: {
    label: 'Literature',
    color: 'text-pink-400',
    bg: 'bg-pink-500/20 border-pink-500/30',
  },
  other: {
    label: 'Other',
    color: 'text-slate-400',
    bg: 'bg-slate-500/20 border-slate-500/30',
  },
};

function getQualityColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  if (score >= 40) return 'bg-orange-500';
  return 'bg-red-500';
}

export function EvidenceCard({ evidence, onViewComments }: EvidenceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const typeConfig = TYPE_CONFIG[evidence.evidence_type] || TYPE_CONFIG.other;

  // Handle both array and object profile formats
  const profile = Array.isArray(evidence.profiles)
    ? evidence.profiles[0]
    : evidence.profiles;
  const authorName = profile?.display_name || 'Anonymous';
  const timeAgo = formatTimeAgo(evidence.created_at);

  const truncatedDescription = evidence.description.length > 200
    ? evidence.description.slice(0, 200) + '...'
    : evidence.description;

  return (
    <div className="bg-slate-900/50 rounded-xl border border-slate-700 p-4 hover:border-slate-600 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          {/* Type Badge */}
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${typeConfig.bg} ${typeConfig.color} mb-2`}
          >
            {typeConfig.label}
          </span>

          {/* Title */}
          <h4 className="font-semibold text-white text-lg leading-tight">
            {evidence.title}
          </h4>
        </div>

        {/* Quality Score */}
        <div className="flex flex-col items-center min-w-[60px]">
          <div className="relative w-12 h-12">
            <svg className="w-12 h-12 transform -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                className="text-slate-700"
              />
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                strokeDasharray={`${(evidence.quality_score / 100) * 125.6} 125.6`}
                className={getQualityColor(evidence.quality_score).replace('bg-', 'text-')}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
              {evidence.quality_score}
            </span>
          </div>
          <span className="text-xs text-slate-500 mt-1">Quality</span>
        </div>
      </div>

      {/* Description */}
      <div className="mb-3">
        <p className="text-slate-300 text-sm leading-relaxed">
          {isExpanded ? evidence.description : truncatedDescription}
        </p>
        {evidence.description.length > 200 && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-400 hover:text-blue-300 text-sm mt-1 flex items-center gap-1"
          >
            {isExpanded ? (
              <>Show less <ChevronUp className="w-3 h-3" /></>
            ) : (
              <>Read more <ChevronDown className="w-3 h-3" /></>
            )}
          </button>
        )}
      </div>

      {/* Methodology (expandable) */}
      {isExpanded && (
        <div className="mb-3 p-3 bg-slate-800/50 rounded-lg">
          <h5 className="text-xs font-semibold text-slate-400 uppercase mb-1">Methodology</h5>
          <p className="text-slate-300 text-sm">{evidence.methodology}</p>
        </div>
      )}

      {/* Source URL */}
      {evidence.source_url && (
        <a
          href={evidence.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm mb-3"
        >
          <ExternalLink className="w-3 h-3" />
          View Source
        </a>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
        {/* Author & Time */}
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {authorName}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {timeAgo}
          </span>
        </div>

        {/* Comments */}
        <button
          type="button"
          onClick={() => onViewComments?.(evidence.id)}
          className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-300 transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          <span className="text-xs">{evidence.comment_count || 0}</span>
        </button>
      </div>
    </div>
  );
}

export default EvidenceCard;
