'use client';

import { useState } from 'react';
import { Loader2, CheckCircle, Lock, Info } from 'lucide-react';

interface EvidenceAssessmentFormProps {
  evidenceId: string;
  canAssess: boolean;
  existingAssessment?: {
    expertise_score: number;
    methodology_score: number;
    peer_review_score: number;
    notes?: string | null;
  } | null;
  onSuccess?: () => void;
}

const EXPERTISE_OPTIONS = [
  { value: 0, label: 'Novice', description: 'General interest, limited experience' },
  { value: 20, label: 'Intermediate', description: 'Event Pass user with knowledge' },
  { value: 40, label: 'Expert', description: 'Evidence Analyst with expertise' },
];

export function EvidenceAssessmentForm({
  evidenceId,
  canAssess,
  existingAssessment,
  onSuccess,
}: EvidenceAssessmentFormProps) {
  const [expertiseScore, setExpertiseScore] = useState(existingAssessment?.expertise_score ?? 20);
  const [methodologyScore, setMethodologyScore] = useState(existingAssessment?.methodology_score ?? 15);
  const [peerReviewScore, setPeerReviewScore] = useState(existingAssessment?.peer_review_score ?? 15);
  const [notes, setNotes] = useState(existingAssessment?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const overallScore = expertiseScore + methodologyScore + peerReviewScore;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canAssess || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/evidence/${evidenceId}/assess`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          expertise_score: expertiseScore,
          methodology_score: methodologyScore,
          peer_review_score: peerReviewScore,
          notes: notes.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit assessment');
      }

      setSuccess(true);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit assessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canAssess) {
    return (
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 text-center">
        <Lock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <h4 className="text-lg font-medium text-white mb-2">Evidence Analyst Required</h4>
        <p className="text-slate-400 mb-4">
          Upgrade to Evidence Analyst tier to assess evidence quality.
        </p>
        <a
          href="/pricing"
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          View Plans
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-white">
          {existingAssessment ? 'Update Assessment' : 'Assess Evidence Quality'}
        </h4>
        <div className="text-2xl font-bold text-blue-400">
          {overallScore}/100
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400">
          <CheckCircle className="w-5 h-5" />
          <p className="text-sm">Assessment {existingAssessment ? 'updated' : 'submitted'} successfully!</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Expertise Factor (0-40) */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <label className="text-sm font-medium text-slate-300">
            Expertise Factor
          </label>
          <span className="text-xs text-slate-500">({expertiseScore}/40)</span>
          <Info className="w-4 h-4 text-slate-500 cursor-help" title="Based on the submitter's credentials and expertise level" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {EXPERTISE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setExpertiseScore(option.value)}
              className={`p-3 rounded-lg border text-left transition-colors ${
                expertiseScore === option.value
                  ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              <div className="text-sm font-medium">{option.label}</div>
              <div className="text-xs opacity-70">{option.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Methodology Factor (0-30) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-300">
              Methodology Score
            </label>
            <Info className="w-4 h-4 text-slate-500 cursor-help" title="How well-documented and rigorous is the methodology?" />
          </div>
          <span className="text-sm text-slate-400">{methodologyScore}/30</span>
        </div>
        <input
          type="range"
          min="0"
          max="30"
          value={methodologyScore}
          onChange={(e) => setMethodologyScore(parseInt(e.target.value))}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>Poor</span>
          <span>Average</span>
          <span>Excellent</span>
        </div>
      </div>

      {/* Peer Review Factor (0-30) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-300">
              Peer Review Score
            </label>
            <Info className="w-4 h-4 text-slate-500 cursor-help" title="Has this been verified or reviewed by other experts?" />
          </div>
          <span className="text-sm text-slate-400">{peerReviewScore}/30</span>
        </div>
        <input
          type="range"
          min="0"
          max="30"
          value={peerReviewScore}
          onChange={(e) => setPeerReviewScore(parseInt(e.target.value))}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>Unverified</span>
          <span>Reviewed</span>
          <span>Peer-reviewed</span>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Assessment Notes <span className="text-slate-500">(optional)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any additional notes about your assessment..."
          rows={3}
          className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {/* Quality Score Preview */}
      <div className="p-4 bg-slate-900 rounded-lg border border-slate-700">
        <div className="text-sm text-slate-400 mb-2">Quality Score Preview</div>
        <div className="flex items-center gap-4">
          <div className="flex-1 h-4 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                overallScore >= 80 ? 'bg-green-500' :
                overallScore >= 60 ? 'bg-yellow-500' :
                overallScore >= 40 ? 'bg-orange-500' : 'bg-red-500'
              }`}
              style={{ width: `${overallScore}%` }}
            />
          </div>
          <span className={`text-lg font-bold ${
            overallScore >= 80 ? 'text-green-400' :
            overallScore >= 60 ? 'text-yellow-400' :
            overallScore >= 40 ? 'text-orange-400' : 'text-red-400'
          }`}>
            {overallScore}
          </span>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <CheckCircle className="w-4 h-4" />
            {existingAssessment ? 'Update Assessment' : 'Submit Assessment'}
          </>
        )}
      </button>
    </form>
  );
}

export default EvidenceAssessmentForm;
