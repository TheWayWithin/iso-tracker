'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, MessageSquare, Reply, Lock, User, Clock } from 'lucide-react';

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
  return date.toLocaleDateString();
}

interface CommentProfile {
  display_name: string | null;
  avatar_url: string | null;
}

interface Comment {
  id: string;
  evidence_id: string;
  user_id: string;
  parent_comment_id: string | null;
  content: string;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  profiles?: CommentProfile[] | CommentProfile | null;
  replies?: Comment[];
}

interface EvidenceCommentsProps {
  evidenceId: string;
  canComment: boolean;
  isAuthenticated: boolean;
}

interface CommentFormProps {
  evidenceId: string;
  parentCommentId?: string | null;
  onSuccess: () => void;
  onCancel?: () => void;
  placeholder?: string;
}

function CommentForm({ evidenceId, parentCommentId, onSuccess, onCancel, placeholder }: CommentFormProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contentLength = content.trim().length;
  const isValid = contentLength >= 10 && contentLength <= 10000;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/evidence/${evidenceId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          parent_comment_id: parentCommentId || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to post comment');
      }

      setContent('');
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder || 'Add a comment...'}
        rows={3}
        className={`w-full px-3 py-2 bg-slate-900 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 resize-none text-sm ${
          contentLength > 0 && contentLength < 10
            ? 'border-red-500 focus:ring-red-500'
            : 'border-slate-700 focus:ring-blue-500'
        }`}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">
          {contentLength}/10,000 {contentLength > 0 && contentLength < 10 && '(min 10)'}
        </span>
        <div className="flex gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 text-sm text-slate-400 hover:text-slate-300"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </form>
  );
}

interface CommentThreadProps {
  comment: Comment;
  depth: number;
  canComment: boolean;
  evidenceId: string;
  onRefresh: () => void;
}

function CommentThread({ comment, depth, canComment, evidenceId, onRefresh }: CommentThreadProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);

  // Handle both array and object profile formats
  const profile = Array.isArray(comment.profiles)
    ? comment.profiles[0]
    : comment.profiles;
  const authorName = profile?.display_name || 'Anonymous';
  const isDeleted = !!comment.deleted_at;
  const maxDepth = 3;

  return (
    <div className={`${depth > 0 ? 'ml-6 border-l-2 border-slate-700 pl-4' : ''}`}>
      <div className="py-3">
        {/* Comment Header */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
          <User className="w-3 h-3" />
          <span className={isDeleted ? 'italic' : ''}>{isDeleted ? '[deleted]' : authorName}</span>
          <span>•</span>
          <Clock className="w-3 h-3" />
          <span>{formatTimeAgo(comment.created_at)}</span>
        </div>

        {/* Comment Content */}
        <div className={`text-sm ${isDeleted ? 'text-slate-500 italic' : 'text-slate-300'}`}>
          {isDeleted ? '[This comment has been removed]' : comment.content}
        </div>

        {/* Reply Button */}
        {canComment && !isDeleted && depth < maxDepth - 1 && (
          <button
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="flex items-center gap-1 mt-2 text-xs text-slate-500 hover:text-slate-400"
          >
            <Reply className="w-3 h-3" />
            Reply
          </button>
        )}

        {/* Reply Form */}
        {showReplyForm && (
          <div className="mt-3">
            <CommentForm
              evidenceId={evidenceId}
              parentCommentId={comment.id}
              onSuccess={() => {
                setShowReplyForm(false);
                onRefresh();
              }}
              onCancel={() => setShowReplyForm(false)}
              placeholder="Write a reply..."
            />
          </div>
        )}
      </div>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div>
          {comment.replies.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              canComment={canComment}
              evidenceId={evidenceId}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function EvidenceComments({ evidenceId, canComment, isAuthenticated }: EvidenceCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/evidence/${evidenceId}/comments`);
      if (!response.ok) throw new Error('Failed to fetch comments');
      const data = await response.json();
      setComments(data.comments || []);
      setTotal(data.total || 0);
      setError(null);
    } catch (err) {
      setError('Failed to load comments');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [evidenceId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-6">
        <p className="text-red-400 mb-2">{error}</p>
        <button onClick={fetchComments} className="text-blue-400 hover:text-blue-300 text-sm">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-slate-400" />
        <h4 className="text-sm font-medium text-slate-300">
          Discussion ({total} {total === 1 ? 'comment' : 'comments'})
        </h4>
      </div>

      {/* New Comment Form */}
      {canComment ? (
        <CommentForm
          evidenceId={evidenceId}
          onSuccess={fetchComments}
          placeholder="Start a discussion about this evidence..."
        />
      ) : !isAuthenticated ? (
        <div className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-lg border border-slate-700 text-slate-400 text-sm">
          <Lock className="w-4 h-4" />
          <span>Sign in to join the discussion</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-lg border border-slate-700 text-slate-400 text-sm">
          <Lock className="w-4 h-4" />
          <span>Evidence Analyst tier required to comment</span>
        </div>
      )}

      {/* Comments List */}
      {comments.length === 0 ? (
        <div className="text-center py-6 text-slate-500 text-sm">
          No comments yet. Be the first to start a discussion.
        </div>
      ) : (
        <div className="divide-y divide-slate-700/50">
          {comments.map((comment) => (
            <CommentThread
              key={comment.id}
              comment={comment}
              depth={0}
              canComment={canComment}
              evidenceId={evidenceId}
              onRefresh={fetchComments}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default EvidenceComments;
