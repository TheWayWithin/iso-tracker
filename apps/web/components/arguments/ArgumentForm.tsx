'use client';

import { useState } from 'react';
import { Send, Loader2, AlertCircle, CheckCircle, Lock } from 'lucide-react';
import type { Stance, Argument } from './ArgumentCard';

interface ArgumentFormProps {
  isoId: string;
  isAuthenticated: boolean;
  onSubmit?: (argument: Argument) => void;
}

const STANCE_OPTIONS: { value: Stance; label: string; description: string; color: string }[] = [
  {
    value: 'artificial',
    label: 'Artificial',
    description: 'I believe this object is artificially engineered',
    color: 'border-orange-500 bg-orange-500/10 text-orange-400',
  },
  {
    value: 'natural',
    label: 'Natural',
    description: 'I believe this object has natural astrophysical origins',
    color: 'border-green-500 bg-green-500/10 text-green-400',
  },
  {
    value: 'uncertain',
    label: 'Uncertain',
    description: 'I present a balanced analysis without firm conclusion',
    color: 'border-yellow-500 bg-yellow-500/10 text-yellow-400',
  },
];

export function ArgumentForm({ isoId, isAuthenticated, onSubmit }: ArgumentFormProps) {
  const [stance, setStance] = useState<Stance | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const titleLength = title.length;
  const contentLength = content.length;
  const isValid = stance !== null && titleLength >= 3 && titleLength <= 200 && contentLength >= 10 && contentLength <= 2000;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid || !stance) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/iso/${isoId}/arguments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stance,
          title: title.trim(),
          content: content.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit argument');
      }

      const data = await response.json();

      // Reset form
      setStance(null);
      setTitle('');
      setContent('');
      setSuccess(true);

      // Notify parent
      onSubmit?.(data.argument);

      // Clear success after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit argument');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="p-6 bg-slate-900/50 rounded-xl border border-slate-700">
        <div className="flex flex-col items-center py-6 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-3">
            <Lock className="w-6 h-6 text-slate-500" />
          </div>
          <h4 className="font-medium text-slate-300 mb-1">Sign In to Participate</h4>
          <p className="text-sm text-slate-500 max-w-xs mb-4">
            Create a free account to submit your arguments and join the community debate.
          </p>
          <a
            href="/auth/sign-in"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium text-white transition-colors"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-slate-900/50 rounded-xl border border-slate-700 space-y-5">
      <h3 className="text-lg font-semibold text-white">Submit Your Argument</h3>

      {/* Stance Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">
          Your Position <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {STANCE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setStance(option.value)}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                stance === option.value
                  ? option.color
                  : 'border-slate-700 hover:border-slate-600 bg-slate-800/50'
              }`}
            >
              <span className={`block font-medium ${
                stance === option.value ? '' : 'text-slate-300'
              }`}>
                {option.label}
              </span>
              <span className={`block text-xs mt-1 ${
                stance === option.value ? 'opacity-80' : 'text-slate-500'
              }`}>
                {option.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <label htmlFor="argument-title" className="block text-sm font-medium text-slate-300 mb-2">
          Title <span className="text-red-400">*</span>
        </label>
        <input
          id="argument-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="A clear, concise summary of your argument"
          maxLength={200}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <div className="flex justify-between mt-1">
          <span className={`text-xs ${titleLength < 3 ? 'text-red-400' : 'text-slate-500'}`}>
            {titleLength < 3 ? 'At least 3 characters required' : ''}
          </span>
          <span className={`text-xs ${titleLength > 180 ? 'text-yellow-400' : 'text-slate-500'}`}>
            {titleLength}/200
          </span>
        </div>
      </div>

      {/* Content */}
      <div>
        <label htmlFor="argument-content" className="block text-sm font-medium text-slate-300 mb-2">
          Your Argument <span className="text-red-400">*</span>
        </label>
        <textarea
          id="argument-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Present your reasoning with evidence and logical analysis. Consider trajectory data, spectroscopic observations, and scientific consensus."
          rows={6}
          maxLength={2000}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
        <div className="flex justify-between mt-1">
          <span className={`text-xs ${contentLength < 10 ? 'text-red-400' : 'text-slate-500'}`}>
            {contentLength < 10 ? `${10 - contentLength} more characters required` : ''}
          </span>
          <span className={`text-xs ${contentLength > 1800 ? 'text-yellow-400' : 'text-slate-500'}`}>
            {contentLength}/2000
          </span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span className="text-sm text-red-400">{error}</span>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
          <span className="text-sm text-green-400">Argument submitted successfully!</span>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!isValid || isSubmitting}
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
            Submit Argument
          </>
        )}
      </button>

      <p className="text-xs text-slate-500 text-center">
        Arguments are public and contribute to the Community Sentiment score.
        Please be respectful and evidence-based.
      </p>
    </form>
  );
}

export default ArgumentForm;
