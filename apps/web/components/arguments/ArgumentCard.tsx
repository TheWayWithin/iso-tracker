'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Clock, User, Loader2, Lock } from 'lucide-react';

// Simple relative time formatter (avoids date-fns dependency)
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

export type Stance = 'artificial' | 'natural' | 'uncertain';

interface ArgumentProfile {
  display_name: string | null;
  avatar_url: string | null;
}

export interface Argument {
  id: string;
  iso_object_id: string;
  user_id: string;
  stance: Stance;
  title: string;
  content: string;
  upvotes_count: number;
  downvotes_count: number;
  created_at: string;
  updated_at: string;
  profiles?: ArgumentProfile;
}

interface ArgumentCardProps {
  argument: Argument;
  userVote?: 'upvote' | 'downvote' | null;
  canVote: boolean;
  onVote?: (argumentId: string, voteType: 'upvote' | 'downvote' | null) => Promise<void>;
}

const STANCE_CONFIG: Record<Stance, { label: string; color: string; bg: string }> = {
  artificial: {
    label: 'Artificial',
    color: 'text-orange-400',
    bg: 'bg-orange-500/20 border-orange-500/30',
  },
  natural: {
    label: 'Natural',
    color: 'text-green-400',
    bg: 'bg-green-500/20 border-green-500/30',
  },
  uncertain: {
    label: 'Uncertain',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/20 border-yellow-500/30',
  },
};

export function ArgumentCard({
  argument,
  userVote,
  canVote,
  onVote,
}: ArgumentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [localVote, setLocalVote] = useState<'upvote' | 'downvote' | null>(userVote ?? null);
  const [localUpvotes, setLocalUpvotes] = useState(argument.upvotes_count);
  const [localDownvotes, setLocalDownvotes] = useState(argument.downvotes_count);

  const stanceConfig = STANCE_CONFIG[argument.stance];
  const netVotes = localUpvotes - localDownvotes;
  const authorName = argument.profiles?.display_name || 'Anonymous';
  const timeAgo = formatTimeAgo(argument.created_at);

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    if (!canVote || isVoting || !onVote) return;

    setIsVoting(true);
    const previousVote = localVote;

    // Optimistic update
    if (localVote === voteType) {
      // Remove vote
      setLocalVote(null);
      if (voteType === 'upvote') {
        setLocalUpvotes(prev => Math.max(0, prev - 1));
      } else {
        setLocalDownvotes(prev => Math.max(0, prev - 1));
      }

      try {
        await onVote(argument.id, null);
      } catch {
        // Revert on error
        setLocalVote(previousVote);
        if (voteType === 'upvote') {
          setLocalUpvotes(prev => prev + 1);
        } else {
          setLocalDownvotes(prev => prev + 1);
        }
      }
    } else {
      // Change or add vote
      setLocalVote(voteType);
      if (voteType === 'upvote') {
        setLocalUpvotes(prev => prev + 1);
        if (previousVote === 'downvote') {
          setLocalDownvotes(prev => Math.max(0, prev - 1));
        }
      } else {
        setLocalDownvotes(prev => prev + 1);
        if (previousVote === 'upvote') {
          setLocalUpvotes(prev => Math.max(0, prev - 1));
        }
      }

      try {
        await onVote(argument.id, voteType);
      } catch {
        // Revert on error
        setLocalVote(previousVote);
        if (voteType === 'upvote') {
          setLocalUpvotes(prev => Math.max(0, prev - 1));
          if (previousVote === 'downvote') {
            setLocalDownvotes(prev => prev + 1);
          }
        } else {
          setLocalDownvotes(prev => Math.max(0, prev - 1));
          if (previousVote === 'upvote') {
            setLocalUpvotes(prev => prev + 1);
          }
        }
      }
    }

    setIsVoting(false);
  };

  const truncatedContent = argument.content.length > 200
    ? argument.content.slice(0, 200) + '...'
    : argument.content;

  return (
    <div className="bg-slate-900/50 rounded-xl border border-slate-700 p-4 hover:border-slate-600 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          {/* Stance Badge */}
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${stanceConfig.bg} ${stanceConfig.color} mb-2`}
          >
            {stanceConfig.label}
          </span>

          {/* Title */}
          <h4 className="font-semibold text-white text-lg leading-tight">
            {argument.title}
          </h4>
        </div>

        {/* Vote Score */}
        <div className="flex flex-col items-center">
          <span className={`text-lg font-bold ${
            netVotes > 0 ? 'text-green-400' :
            netVotes < 0 ? 'text-red-400' :
            'text-slate-400'
          }`}>
            {netVotes > 0 ? '+' : ''}{netVotes}
          </span>
          <span className="text-xs text-slate-500">votes</span>
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        <p className="text-slate-300 text-sm leading-relaxed">
          {isExpanded ? argument.content : truncatedContent}
        </p>
        {argument.content.length > 200 && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-400 hover:text-blue-300 text-sm mt-1"
          >
            {isExpanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>

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

        {/* Vote Buttons */}
        <div className="flex items-center gap-2">
          {canVote ? (
            <>
              <button
                type="button"
                onClick={() => handleVote('upvote')}
                disabled={isVoting}
                className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
                  localVote === 'upvote'
                    ? 'bg-green-500/20 text-green-400'
                    : 'hover:bg-slate-800 text-slate-400 hover:text-green-400'
                }`}
                aria-label="Upvote"
              >
                {isVoting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ThumbsUp className="w-4 h-4" />
                )}
                <span className="text-xs">{localUpvotes}</span>
              </button>

              <button
                type="button"
                onClick={() => handleVote('downvote')}
                disabled={isVoting}
                className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
                  localVote === 'downvote'
                    ? 'bg-red-500/20 text-red-400'
                    : 'hover:bg-slate-800 text-slate-400 hover:text-red-400'
                }`}
                aria-label="Downvote"
              >
                {isVoting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ThumbsDown className="w-4 h-4" />
                )}
                <span className="text-xs">{localDownvotes}</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Lock className="w-3 h-3" />
              <span>{localUpvotes} up / {localDownvotes} down</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ArgumentCard;
