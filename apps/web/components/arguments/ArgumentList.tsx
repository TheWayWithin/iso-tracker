'use client';

import { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Filter, TrendingUp, Clock, Loader2, AlertCircle, Lock } from 'lucide-react';
import { ArgumentCard, type Argument, type Stance } from './ArgumentCard';
import { ArgumentForm } from './ArgumentForm';

interface ArgumentStats {
  total_arguments: number;
  artificial_count: number;
  natural_count: number;
  uncertain_count: number;
  total_votes: number;
}

interface ArgumentListProps {
  isoId: string;
  isAuthenticated: boolean;
  canVote: boolean;
}

type SortOption = 'newest' | 'top' | 'controversial';
type StanceFilter = 'all' | Stance;

const STANCE_FILTERS: { value: StanceFilter; label: string; color: string }[] = [
  { value: 'all', label: 'All', color: 'text-slate-300' },
  { value: 'artificial', label: 'Artificial', color: 'text-orange-400' },
  { value: 'natural', label: 'Natural', color: 'text-green-400' },
  { value: 'uncertain', label: 'Uncertain', color: 'text-yellow-400' },
];

const SORT_OPTIONS: { value: SortOption; label: string; icon: typeof Clock }[] = [
  { value: 'newest', label: 'Newest', icon: Clock },
  { value: 'top', label: 'Top Voted', icon: TrendingUp },
  { value: 'controversial', label: 'Most Discussed', icon: MessageSquare },
];

export function ArgumentList({ isoId, isAuthenticated, canVote }: ArgumentListProps) {
  const [arguments_, setArguments] = useState<Argument[]>([]);
  const [userVotes, setUserVotes] = useState<Record<string, 'upvote' | 'downvote'>>({});
  const [stats, setStats] = useState<ArgumentStats | null>(null);
  const [total, setTotal] = useState(0);

  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [stanceFilter, setStanceFilter] = useState<StanceFilter>('all');

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const limit = 10;

  // Fetch arguments
  const fetchArguments = useCallback(async (reset = false) => {
    try {
      if (reset) {
        setIsLoading(true);
        setOffset(0);
      } else {
        setIsLoadingMore(true);
      }

      const currentOffset = reset ? 0 : offset;
      const params = new URLSearchParams({
        sort: sortBy,
        limit: limit.toString(),
        offset: currentOffset.toString(),
      });

      if (stanceFilter !== 'all') {
        params.set('stance', stanceFilter);
      }

      const response = await fetch(`/api/iso/${isoId}/arguments?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch arguments');
      }

      const data = await response.json();

      if (reset) {
        setArguments(data.arguments || []);
      } else {
        setArguments(prev => [...prev, ...(data.arguments || [])]);
      }

      setUserVotes(data.user_votes || {});
      setStats(data.stats || null);
      setTotal(data.total || 0);
      setHasMore(data.pagination?.has_more || false);

      if (!reset) {
        setOffset(currentOffset + limit);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load arguments');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [isoId, sortBy, stanceFilter, offset]);

  // Initial fetch and refetch on filter/sort change
  useEffect(() => {
    fetchArguments(true);
  }, [isoId, sortBy, stanceFilter]);

  // Handle vote
  const handleVote = async (argumentId: string, voteType: 'upvote' | 'downvote' | null) => {
    if (!canVote) return;

    try {
      if (voteType === null) {
        // Remove vote
        const response = await fetch(`/api/arguments/${argumentId}/vote`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to remove vote');
        }

        setUserVotes(prev => {
          const next = { ...prev };
          delete next[argumentId];
          return next;
        });
      } else {
        // Add/update vote
        const response = await fetch(`/api/arguments/${argumentId}/vote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vote_type: voteType }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to vote');
        }

        setUserVotes(prev => ({ ...prev, [argumentId]: voteType }));
      }
    } catch (err) {
      console.error('Vote error:', err);
      throw err;
    }
  };

  // Handle new argument submitted
  const handleNewArgument = (argument: Argument) => {
    // Add to top of list if sorted by newest
    if (sortBy === 'newest') {
      setArguments(prev => [argument, ...prev]);
    }
    setTotal(prev => prev + 1);

    // Update stats
    if (stats) {
      const stanceKey = `${argument.stance}_count` as keyof ArgumentStats;
      setStats(prev => prev ? {
        ...prev,
        total_arguments: prev.total_arguments + 1,
        [stanceKey]: (prev[stanceKey] as number) + 1,
      } : null);
    }
  };

  // Calculate sentiment percentages
  const artificialPercent = stats && stats.total_arguments > 0
    ? Math.round((stats.artificial_count / stats.total_arguments) * 100)
    : 0;
  const naturalPercent = stats && stats.total_arguments > 0
    ? Math.round((stats.natural_count / stats.total_arguments) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-white">Community Debate</h3>
          </div>
          <span className="text-sm text-slate-400">
            {total} {total === 1 ? 'argument' : 'arguments'}
          </span>
        </div>

        {/* Sentiment Bar */}
        {stats && stats.total_arguments > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span className="text-orange-400">{artificialPercent}% Artificial</span>
              <span className="text-green-400">{naturalPercent}% Natural</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-orange-500 transition-all duration-500"
                style={{ width: `${artificialPercent}%` }}
              />
              <div
                className="h-full bg-yellow-500 transition-all duration-500"
                style={{ width: `${100 - artificialPercent - naturalPercent}%` }}
              />
              <div
                className="h-full bg-green-500 transition-all duration-500"
                style={{ width: `${naturalPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Stance Filter */}
          <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
            {STANCE_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setStanceFilter(filter.value)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  stanceFilter === filter.value
                    ? `bg-slate-700 ${filter.color}`
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {filter.label}
                {filter.value !== 'all' && stats && (
                  <span className="ml-1 opacity-60">
                    ({stats[`${filter.value}_count` as keyof ArgumentStats]})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSortBy(option.value)}
                className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  sortBy === option.value
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <option.icon className="w-3 h-3" />
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Vote CTA for non-voters */}
        {!canVote && isAuthenticated && (
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-center gap-3">
            <Lock className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-blue-300">
                Upgrade to Explorer ($4.99/mo) to vote on arguments and influence community sentiment.
              </p>
            </div>
            <a
              href="/auth/sign-up?tier=explorer"
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-md text-xs font-medium text-white whitespace-nowrap"
            >
              Upgrade
            </a>
          </div>
        )}
      </div>

      {/* Submit Form */}
      <ArgumentForm
        isoId={isoId}
        isAuthenticated={isAuthenticated}
        onSubmit={handleNewArgument}
      />

      {/* Arguments List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center py-12 text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mb-2" />
          <p className="text-red-400">{error}</p>
          <button
            type="button"
            onClick={() => fetchArguments(true)}
            className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300"
          >
            Try Again
          </button>
        </div>
      ) : arguments_.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <MessageSquare className="w-12 h-12 text-slate-600 mb-3" />
          <h4 className="font-medium text-slate-400 mb-1">No Arguments Yet</h4>
          <p className="text-sm text-slate-500 max-w-xs">
            Be the first to submit your analysis and start the community debate!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {arguments_.map((argument) => (
            <ArgumentCard
              key={argument.id}
              argument={argument}
              userVote={userVotes[argument.id] || null}
              canVote={canVote}
              onVote={handleVote}
            />
          ))}

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                type="button"
                onClick={() => fetchArguments(false)}
                disabled={isLoadingMore}
                className="flex items-center gap-2 px-6 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg text-sm text-slate-300 transition-colors"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More Arguments'
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ArgumentList;
