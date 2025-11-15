'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EvidenceSubmissionFormProps {
  isoObjectId: string;
  onSuccess?: () => void;
}

const EVIDENCE_TYPES = [
  { value: 'observation', label: 'Observation - Direct measurements' },
  { value: 'spectroscopy', label: 'Spectroscopy - Light spectrum analysis' },
  { value: 'astrometry', label: 'Astrometry - Position and motion' },
  { value: 'photometry', label: 'Photometry - Brightness measurements' },
  { value: 'radar', label: 'Radar - Radar observations' },
  { value: 'theoretical', label: 'Theoretical - Mathematical models' },
  { value: 'simulation', label: 'Simulation - Computer simulations' },
  { value: 'literature', label: 'Literature - Peer-reviewed papers' },
  { value: 'other', label: 'Other' },
];

export function EvidenceSubmissionForm({
  isoObjectId,
  onSuccess,
}: EvidenceSubmissionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    evidence_type: '',
    title: '',
    description: '',
    methodology: '',
    source_url: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/evidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          iso_object_id: isoObjectId,
          ...formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit evidence');
      }

      setSuccess(true);
      setFormData({
        evidence_type: '',
        title: '',
        description: '',
        methodology: '',
        source_url: '',
      });

      if (onSuccess) {
        onSuccess();
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit evidence');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Evidence Type */}
      <div className="space-y-2">
        <Label htmlFor="evidence_type">
          Evidence Type <span className="text-red-500">*</span>
        </Label>
        <Select
          value={formData.evidence_type}
          onValueChange={(value) =>
            setFormData({ ...formData, evidence_type: value })
          }
          required
        >
          <SelectTrigger id="evidence_type">
            <SelectValue placeholder="Select evidence type" />
          </SelectTrigger>
          <SelectContent>
            {EVIDENCE_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          Choose the category that best describes your evidence
        </p>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">
          Title <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Brief descriptive title (3-200 characters)"
          required
          minLength={3}
          maxLength={200}
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">
          Description <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="Detailed description of the evidence (minimum 10 characters)"
          required
          minLength={10}
          rows={4}
        />
        <p className="text-sm text-muted-foreground">
          Explain what this evidence shows and why it's relevant
        </p>
      </div>

      {/* Methodology */}
      <div className="space-y-2">
        <Label htmlFor="methodology">
          Methodology <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="methodology"
          value={formData.methodology}
          onChange={(e) =>
            setFormData({ ...formData, methodology: e.target.value })
          }
          placeholder="How was this evidence collected or analyzed? (minimum 10 characters)"
          required
          minLength={10}
          rows={4}
        />
        <p className="text-sm text-muted-foreground">
          Describe the methods used to gather or analyze this evidence
        </p>
      </div>

      {/* Source URL (optional) */}
      <div className="space-y-2">
        <Label htmlFor="source_url">Source URL (optional)</Label>
        <Input
          id="source_url"
          type="url"
          value={formData.source_url}
          onChange={(e) =>
            setFormData({ ...formData, source_url: e.target.value })
          }
          placeholder="https://example.com/source"
        />
        <p className="text-sm text-muted-foreground">
          Link to the original source or paper (if available)
        </p>
      </div>

      {/* Error message */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success message */}
      {success && (
        <Alert>
          <AlertDescription>
            Evidence submitted successfully! It will now be visible to all users
            and can be assessed by Evidence Analysts.
          </AlertDescription>
        </Alert>
      )}

      {/* Submit button */}
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Submitting...' : 'Submit Evidence'}
      </Button>

      {/* Rate limit info */}
      <p className="text-xs text-muted-foreground text-center">
        Event Pass users can submit up to 10 evidence pieces per ISO per hour.
        Evidence Analyst users have unlimited submissions.
      </p>
    </form>
  );
}
