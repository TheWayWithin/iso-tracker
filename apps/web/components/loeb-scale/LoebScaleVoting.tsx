'use client';

import { useState, useEffect, useCallback } from 'react';
import { Lock, Vote, ChevronUp, ChevronDown, Send, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

type LoebZone = 'green' | 'yellow' | 'orange' | 'red';

interface VoteData {
  voted_level: number;
  voted_zone: string;
  reasoning: string | null;
  created_at: string;
  updated_at: string;
}

interface VoteDistribution {
  [key: number]: number;
}

interface LoebScaleVotingProps {
  isoId: string;
  officialLevel: number | null;
  onVoteSubmit?: (level: number) => void;
}

// Zone configurations
const ZONE_CONFIG: Record<LoebZone, {
  color: string;
  label: string;
  range: string;
}> = {
  green: { color: '#10B981', label: 'Natural', range: '0-1' },
  yellow: { color: '#FFB84D', label: 'Anomalous', range: '2-4' },
  orange: { color: '#F97316', label: 'Suspected', range: '5-7' },
  red: { color: '#EF4444', label: 'Confirmed', range: '8-10' },
};

function getZoneFromLevel(level: number): LoebZone {
  if (level <= 1) return 'green';
  if (level <= 4) return 'yellow';
  if (level <= 7) return 'orange';
  return 'red';
}

function getZoneColor(level: number): string {
  const zone = getZoneFromLevel(level);
  return ZONE_CONFIG[zone].color;
}

// Vote histogram bar
function VoteBar({
  level,
  count,
  maxCount,
  isUserVote,
}: {
  level: number;
  count: number;
  maxCount: number;
  isUserVote: boolean;
}) {
  const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
  const color = getZoneColor(level);

  return (
    <div className="flex items-center gap-2">
      <span className="w-4 text-xs text-slate-500 text-right">{level}</span>
      <div className="flex-1 h-6 bg-slate-800 rounded overflow-hidden relative">
        <div
          className="h-full transition-all duration-500 ease-out"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
            opacity: percentage > 0 ? 1 : 0,
          }}
        />
        {isUserVote && (
          <div
            className="absolute inset-y-0 left-0 w-1"
            style={{ backgroundColor: color }}
          />
        )}
      </div>
      <span className="w-8 text-xs text-slate-400 text-right">{count}</span>
    </div>
  );
}

export function LoebScaleVoting({
  isoId,
  officialLevel,
  onVoteSubmit,
}: LoebScaleVotingProps) {
  const [selectedLevel, setSelectedLevel] = useState<number>(officialLevel ?? 0);
  const [reasoning, setReasoning] = useState('');
  const [userVote, setUserVote] = useState<VoteData | null>(null);
  const [voteDistribution, setVoteDistribution] = useState<VoteDistribution>({});
  const [totalVotes, setTotalVotes] = useState(0);
  const [canVote, setCanVote] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch vote data
  const fetchVotes = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/iso/${isoId}/loeb-scale/vote`);

      if (!response.ok) {
        if (response.status === 401) {
          setCanVote(false);
          return;
        }
        throw new Error('Failed to fetch votes');
      }

      const data = await response.json();
      setUserVote(data.user_vote || null);
      setVoteDistribution(data.vote_distribution || {});
      setTotalVotes(data.total_votes || 0);
      setCanVote(data.can_vote || false);

      // If user has voted, set the selected level
      if (data.user_vote) {
        setSelectedLevel(data.user_vote.voted_level);
        setReasoning(data.user_vote.reasoning || '');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load votes');
    } finally {
      setIsLoading(false);
    }
  }, [isoId]);

  useEffect(() => {
    fetchVotes();
  }, [fetchVotes]);

  // Submit vote
  const handleSubmitVote = async () => {
    if (!canVote) return;

    try {
      setIsSubmitting(true);
      setError(null);
      setSuccessMessage(null);

      const response = await fetch(`/api/iso/${isoId}/loeb-scale/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voted_level: selectedLevel,
          reasoning: reasoning.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit vote');
      }

      const data = await response.json();

      setUserVote({
        voted_level: selectedLevel,
        voted_zone: getZoneFromLevel(selectedLevel),
        reasoning: reasoning.trim() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Update distribution
      if (data.updated_assessment) {
        setTotalVotes(data.updated_assessment.total_votes);
      }

      setSuccessMessage(userVote ? 'Vote updated!' : 'Vote submitted!');
      onVoteSubmit?.(selectedLevel);

      // Refetch to get updated distribution
      await fetchVotes();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit vote');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Level selector controls
  const incrementLevel = () => setSelectedLevel(prev => Math.min(10, prev + 1));
  const decrementLevel = () => setSelectedLevel(prev => Math.max(0, prev - 1));

  if (isLoading) {
    return (
      <div className="p-6 bg-slate-900/50 rounded-xl border border-slate-700">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
        </div>
      </div>
    );
  }

  const selectedZone = getZoneFromLevel(selectedLevel);
  const selectedColor = ZONE_CONFIG[selectedZone].color;
  const maxVoteCount = Math.max(...Object.values(voteDistribution), 1);

  return (
    <div className="p-6 bg-slate-900/50 rounded-xl border border-slate-700 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Vote className="w-5 h-5 text-slate-400" />
          <h3 className="font-semibold text-white">Community Voting</h3>
        </div>
        <span className="text-sm text-slate-400">
          {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
        </span>
      </div>

      {/* Vote Distribution Histogram */}
      <div className="space-y-1.5">
        <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
          Vote Distribution
        </h4>
        {[...Array(11)].map((_, i) => (
          <VoteBar
            key={i}
            level={i}
            count={voteDistribution[i] || 0}
            maxCount={maxVoteCount}
            isUserVote={userVote?.voted_level === i}
          />
        ))}
      </div>

      {/* Voting UI - Only shown if user can vote */}
      {canVote ? (
        <div className="space-y-4 pt-4 border-t border-slate-700">
          <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            {userVote ? 'Update Your Vote' : 'Cast Your Vote'}
          </h4>

          {/* Level Selector */}
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={decrementLevel}
              disabled={selectedLevel <= 0}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Decrease level"
            >
              <ChevronDown className="w-5 h-5 text-slate-300" />
            </button>

            <div
              className="w-24 h-24 rounded-xl flex flex-col items-center justify-center border-2 transition-colors"
              style={{
                backgroundColor: `${selectedColor}20`,
                borderColor: selectedColor,
              }}
            >
              <span
                className="text-3xl font-bold"
                style={{ color: selectedColor }}
              >
                {selectedLevel}
              </span>
              <span
                className="text-xs font-medium"
                style={{ color: selectedColor }}
              >
                {ZONE_CONFIG[selectedZone].label}
              </span>
            </div>

            <button
              type="button"
              onClick={incrementLevel}
              disabled={selectedLevel >= 10}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Increase level"
            >
              <ChevronUp className="w-5 h-5 text-slate-300" />
            </button>
          </div>

          {/* Zone indicator */}
          <div className="flex justify-center gap-2">
            {(['green', 'yellow', 'orange', 'red'] as LoebZone[]).map((zone) => (
              <button
                key={zone}
                type="button"
                onClick={() => {
                  const zoneLevels = {
                    green: 0,
                    yellow: 2,
                    orange: 5,
                    red: 8,
                  };
                  setSelectedLevel(zoneLevels[zone]);
                }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  selectedZone === zone
                    ? 'ring-2 ring-offset-2 ring-offset-slate-900'
                    : 'opacity-50 hover:opacity-75'
                }`}
                style={{
                  backgroundColor: `${ZONE_CONFIG[zone].color}30`,
                  color: ZONE_CONFIG[zone].color,
                  ...(selectedZone === zone ? { ringColor: ZONE_CONFIG[zone].color } : {}),
                }}
              >
                {ZONE_CONFIG[zone].range}
              </button>
            ))}
          </div>

          {/* Reasoning textarea */}
          <div>
            <label htmlFor="reasoning" className="block text-xs font-medium text-slate-400 mb-2">
              Reasoning (optional)
            </label>
            <textarea
              id="reasoning"
              value={reasoning}
              onChange={(e) => setReasoning(e.target.value)}
              placeholder="Why do you think this ISO deserves this score?"
              rows={3}
              maxLength={2000}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <span className="text-xs text-slate-500">{reasoning.length}/2000</span>
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span className="text-sm text-red-400">{error}</span>
            </div>
          )}

          {/* Success message */}
          {successMessage && (
            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
              <span className="text-sm text-green-400">{successMessage}</span>
            </div>
          )}

          {/* Submit button */}
          <button
            type="button"
            onClick={handleSubmitVote}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium text-white transition-colors"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                {userVote ? 'Update Vote' : 'Submit Vote'}
              </>
            )}
          </button>

          {/* Official comparison */}
          {officialLevel !== null && (
            <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
              <span className="text-sm text-slate-400">Official Score</span>
              <span
                className="font-semibold"
                style={{ color: getZoneColor(officialLevel) }}
              >
                Level {officialLevel}
              </span>
            </div>
          )}
        </div>
      ) : (
        /* Locked state for non-Analyst users */
        <div className="pt-4 border-t border-slate-700">
          <div className="flex flex-col items-center py-6 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-3">
              <Lock className="w-6 h-6 text-slate-500" />
            </div>
            <h4 className="font-medium text-slate-300 mb-1">
              Analyst Tier Required
            </h4>
            <p className="text-sm text-slate-500 max-w-xs mb-4">
              Upgrade to Analyst ($9.99/mo) to vote on Loeb Scale assessments and contribute to community consensus.
            </p>
            <a
              href="/auth/sign-up?tier=analyst"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium text-white transition-colors"
            >
              Upgrade to Analyst
            </a>
          </div>
        </div>
      )}

      {/* Current user vote summary */}
      {userVote && (
        <div className="pt-4 border-t border-slate-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Your current vote:</span>
            <span
              className="font-semibold"
              style={{ color: getZoneColor(userVote.voted_level) }}
            >
              Level {userVote.voted_level} ({ZONE_CONFIG[getZoneFromLevel(userVote.voted_level)].label})
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoebScaleVoting;
