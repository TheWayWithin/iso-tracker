'use client';

import { useState } from 'react';
import { Loader2, Send, X, Lock, AlertCircle } from 'lucide-react';
import { EvidenceType } from './EvidenceCard';

interface EvidenceSubmissionFormProps {
  isoId: string;
  isAuthenticated: boolean;
  canSubmit: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const EVIDENCE_TYPES: { value: EvidenceType; label: string; description: string }[] = [
  { value: 'observation', label: 'Observation', description: 'Direct measurements and telescope observations' },
  { value: 'spectroscopy', label: 'Spectroscopy', description: 'Light spectrum analysis data' },
  { value: 'astrometry', label: 'Astrometry', description: 'Position and motion measurements' },
  { value: 'photometry', label: 'Photometry', description: 'Brightness and magnitude measurements' },
  { value: 'radar', label: 'Radar', description: 'Radar observations and reflectivity data' },
  { value: 'theoretical', label: 'Theoretical', description: 'Mathematical models and predictions' },
  { value: 'simulation', label: 'Simulation', description: 'Computer simulations and modeling' },
  { value: 'literature', label: 'Literature', description: 'Peer-reviewed papers and publications' },
  { value: 'other', label: 'Other', description: 'Other types of evidence' },
];

export function EvidenceSubmissionForm({
  isoId,
  isAuthenticated,
  canSubmit,
  onSuccess,
  onCancel,
}: EvidenceSubmissionFormProps) {
  const [evidenceType, setEvidenceType] = useState<EvidenceType>('observation');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [methodology, setMethodology] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const titleLength = title.trim().length;
  const descriptionLength = description.trim().length;
  const methodologyLength = methodology.trim().length;

  const isValid =
    titleLength >= 3 &&
    titleLength <= 200 &&
    descriptionLength >= 10 &&
    methodologyLength >= 10;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/iso/${isoId}/evidence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          evidence_type: evidenceType,
          title: title.trim(),
          description: description.trim(),
          methodology: methodology.trim(),
          source_url: sourceUrl.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit evidence');
      }

      // Reset form
      setTitle('');
      setDescription('');
      setMethodology('');
      setSourceUrl('');
      setEvidenceType('observation');

      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit evidence');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 text-center">
        <Lock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <h4 className="text-lg font-medium text-white mb-2">Sign In Required</h4>
        <p className="text-slate-400 mb-4">
          Sign in to submit scientific evidence.
        </p>
        <a
          href="/auth/sign-in"
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Sign In
        </a>
      </div>
    );
  }

  // Not authorized (wrong tier)
  if (!canSubmit) {
    return (
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 text-center">
        <Lock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <h4 className="text-lg font-medium text-white mb-2">Event Pass Required</h4>
        <p className="text-slate-400 mb-4">
          Upgrade to Event Pass or higher to submit scientific evidence.
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
        <h4 className="text-lg font-semibold text-white">Submit Evidence</h4>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="p-1 text-slate-400 hover:text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Evidence Type */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Evidence Type
        </label>
        <div className="grid grid-cols-3 gap-2">
          {EVIDENCE_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setEvidenceType(type.value)}
              className={`p-3 rounded-lg border text-left transition-colors ${
                evidenceType === type.value
                  ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
              title={type.description}
            >
              <span className="text-sm font-medium">{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Title
          <span className="float-right text-xs text-slate-500">
            {titleLength}/200
          </span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Brief, descriptive title for your evidence"
          maxLength={200}
          className={`w-full px-4 py-2 bg-slate-900 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 ${
            titleLength > 0 && titleLength < 3
              ? 'border-red-500 focus:ring-red-500'
              : 'border-slate-700 focus:ring-blue-500'
          }`}
        />
        {titleLength > 0 && titleLength < 3 && (
          <p className="text-xs text-red-400 mt-1">Title must be at least 3 characters</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Description
          <span className="float-right text-xs text-slate-500">
            {descriptionLength} characters (min 10)
          </span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the evidence in detail. What does it show? What are the key findings?"
          rows={4}
          className={`w-full px-4 py-2 bg-slate-900 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 resize-none ${
            descriptionLength > 0 && descriptionLength < 10
              ? 'border-red-500 focus:ring-red-500'
              : 'border-slate-700 focus:ring-blue-500'
          }`}
        />
        {descriptionLength > 0 && descriptionLength < 10 && (
          <p className="text-xs text-red-400 mt-1">Description must be at least 10 characters</p>
        )}
      </div>

      {/* Methodology */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Methodology
          <span className="float-right text-xs text-slate-500">
            {methodologyLength} characters (min 10)
          </span>
        </label>
        <textarea
          value={methodology}
          onChange={(e) => setMethodology(e.target.value)}
          placeholder="Describe how this evidence was collected. What instruments or methods were used?"
          rows={3}
          className={`w-full px-4 py-2 bg-slate-900 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 resize-none ${
            methodologyLength > 0 && methodologyLength < 10
              ? 'border-red-500 focus:ring-red-500'
              : 'border-slate-700 focus:ring-blue-500'
          }`}
        />
        {methodologyLength > 0 && methodologyLength < 10 && (
          <p className="text-xs text-red-400 mt-1">Methodology must be at least 10 characters</p>
        )}
      </div>

      {/* Source URL */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Source URL <span className="text-slate-500">(optional)</span>
        </label>
        <input
          type="url"
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          placeholder="https://example.com/source"
          className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-slate-400 hover:text-slate-300 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Submit Evidence
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default EvidenceSubmissionForm;
