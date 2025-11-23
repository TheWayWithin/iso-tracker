'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, FileText, Filter, ArrowUpDown, Plus, Lock } from 'lucide-react';
import { EvidenceCard, Evidence, EvidenceType } from './EvidenceCard';

interface EvidenceListProps {
  isoId: string;
  isAuthenticated: boolean;
  canSubmit: boolean; // Event Pass+ can submit
  canAssess: boolean; // Evidence Analyst can assess
  onSubmitClick?: () => void;
  onViewComments?: (evidenceId: string) => void;
}

interface EvidenceStats {
  total_evidence: number;
  by_type: Record<string, number>;
}

const SORT_OPTIONS = [
  { value: 'quality', label: 'Highest Quality' },
  { value: 'newest', label: 'Newest' },
  { value: 'most_assessed', label: 'Most Assessed' },
];

const TYPE_OPTIONS: { value: EvidenceType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'observation', label: 'Observation' },
  { value: 'spectroscopy', label: 'Spectroscopy' },
  { value: 'astrometry', label: 'Astrometry' },
  { value: 'photometry', label: 'Photometry' },
  { value: 'radar', label: 'Radar' },
  { value: 'theoretical', label: 'Theoretical' },
  { value: 'simulation', label: 'Simulation' },
  { value: 'literature', label: 'Literature' },
  { value: 'other', label: 'Other' },
];

export function EvidenceList({
  isoId,
  isAuthenticated,
  canSubmit,
  canAssess,
  onSubmitClick,
  onViewComments,
}: EvidenceListProps) {
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [stats, setStats] = useState<EvidenceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('quality');
  const [filterType, setFilterType] = useState<EvidenceType | 'all'>('all');
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchEvidence = useCallback(async (reset = false) => {
    const currentOffset = reset ? 0 : offset;

    if (reset) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const params = new URLSearchParams({
        sort: sortBy,
        limit: '20',
        offset: currentOffset.toString(),
      });

      if (filterType !== 'all') {
        params.set('type', filterType);
      }

      const response = await fetch(`/api/iso/${isoId}/evidence?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch evidence');
      }

      const data = await response.json();

      if (reset) {
        setEvidence(data.evidence || []);
        setOffset(20);
      } else {
        setEvidence(prev => [...prev, ...(data.evidence || [])]);
        setOffset(currentOffset + 20);
      }

      setStats(data.stats);
      setHasMore(data.pagination?.has_more || false);
      setError(null);
    } catch (err) {
      setError('Failed to load evidence');
      console.error('Error fetching evidence:', err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [isoId, sortBy, filterType, offset]);

  // Initial fetch and refetch on filter/sort change
  useEffect(() => {
    fetchEvidence(true);
  }, [isoId, sortBy, filterType]);

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      fetchEvidence(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={() => fetchEvidence(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">
            Scientific Evidence
          </h3>
          <p className="text-sm text-slate-400">
            {stats?.total_evidence || 0} evidence {(stats?.total_evidence || 0) === 1 ? 'piece' : 'pieces'} submitted
          </p>
        </div>

        {/* Submit Button */}
        {canSubmit ? (
          <button
            onClick={onSubmitClick}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Submit Evidence
          </button>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-400 rounded-lg border border-slate-700">
            <Lock className="w-4 h-4" />
            <span className="text-sm">
              {isAuthenticated ? 'Event Pass required' : 'Sign in to submit'}
            </span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Sort */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-slate-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {SORT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as EvidenceType | 'all')}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {TYPE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Evidence List */}
      {evidence.length === 0 ? (
        <div className="text-center py-12 bg-slate-800/50 rounded-xl border border-slate-700">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-white mb-2">No Evidence Yet</h4>
          <p className="text-slate-400 mb-4">
            Be the first to submit scientific evidence for this ISO.
          </p>
          {canSubmit && (
            <button
              onClick={onSubmitClick}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Submit Evidence
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {evidence.map((item) => (
            <EvidenceCard
              key={item.id}
              evidence={item}
              onViewComments={onViewComments}
            />
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <div className="text-center pt-4">
          <button
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors"
          >
            {isLoadingMore ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </span>
            ) : (
              'Load More'
            )}
          </button>
        </div>
      )}

      {/* Tier Info for Assessment */}
      {!canAssess && evidence.length > 0 && (
        <div className="text-center py-4 px-4 bg-slate-800/50 rounded-lg border border-slate-700">
          <p className="text-sm text-slate-400">
            <Lock className="w-4 h-4 inline mr-1" />
            Evidence Analyst tier required to assess evidence quality
          </p>
        </div>
      )}
    </div>
  );
}

export default EvidenceList;
