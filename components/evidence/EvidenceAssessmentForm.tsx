'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface EvidenceAssessmentFormProps {
  evidenceId: string;
  evidenceTitle: string;
  submitterTier: 'event_pass' | 'evidence_analyst';
  onSuccess?: () => void;
}

export function EvidenceAssessmentForm({
  evidenceId,
  evidenceTitle,
  submitterTier,
  onSuccess,
}: EvidenceAssessmentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Auto-set expertise score based on submitter tier
  const expertiseScore = submitterTier === 'evidence_analyst' ? 40 : 20;

  const [methodologyScore, setMethodologyScore] = useState<number>(15);
  const [peerReviewScore, setPeerReviewScore] = useState<number>(15);
  const [notes, setNotes] = useState('');

  // Calculate overall score
  const overallScore = expertiseScore + methodologyScore + peerReviewScore;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/evidence/${evidenceId}/assess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expertise_score: expertiseScore,
          methodology_score: methodologyScore,
          peer_review_score: peerReviewScore,
          notes: notes || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit assessment');
      }

      setSuccess(true);

      if (onSuccess) {
        onSuccess();
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit assessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Evidence being assessed */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Assessing Evidence</CardTitle>
          <CardDescription>{evidenceTitle}</CardDescription>
        </CardHeader>
      </Card>

      {/* Expertise Score (auto-calculated) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            Expertise Factor: {expertiseScore} / 40 points
          </CardTitle>
          <CardDescription>
            Based on submitter tier (
            {submitterTier === 'evidence_analyst'
              ? 'Evidence Analyst = 40 points'
              : 'Event Pass = 20 points'}
            )
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Methodology Score Slider */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="methodology">
            Methodology Quality: {methodologyScore} / 30 points
          </Label>
          <Slider
            id="methodology"
            min={0}
            max={30}
            step={1}
            value={[methodologyScore]}
            onValueChange={(value) => setMethodologyScore(value[0])}
            className="w-full"
          />
          <p className="text-sm text-muted-foreground">
            How sound is the methodology used to collect or analyze this evidence?
          </p>
        </div>

        {/* Methodology scale guide */}
        <div className="text-xs text-muted-foreground space-y-1 pl-4 border-l-2">
          <p><strong>0-10:</strong> Poor methodology, significant flaws</p>
          <p><strong>11-20:</strong> Adequate methodology, some limitations</p>
          <p><strong>21-30:</strong> Rigorous methodology, well-documented</p>
        </div>
      </div>

      {/* Peer Review Score Slider */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="peer_review">
            Peer Review Quality: {peerReviewScore} / 30 points
          </Label>
          <Slider
            id="peer_review"
            min={0}
            max={30}
            step={1}
            value={[peerReviewScore]}
            onValueChange={(value) => setPeerReviewScore(value[0])}
            className="w-full"
          />
          <p className="text-sm text-muted-foreground">
            Has this evidence been peer-reviewed or independently verified?
          </p>
        </div>

        {/* Peer review scale guide */}
        <div className="text-xs text-muted-foreground space-y-1 pl-4 border-l-2">
          <p><strong>0-10:</strong> No peer review, unverified claims</p>
          <p><strong>11-20:</strong> Limited review, informal verification</p>
          <p><strong>21-30:</strong> Peer-reviewed, published, replicated</p>
        </div>
      </div>

      {/* Overall Score Preview */}
      <Card className="bg-muted">
        <CardHeader>
          <CardTitle className="text-xl">
            Overall Quality Score: {overallScore} / 100
          </CardTitle>
          <CardDescription>
            Expertise ({expertiseScore}) + Methodology ({methodologyScore}) +
            Peer Review ({peerReviewScore})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-secondary rounded-full h-4">
            <div
              className="bg-primary h-4 rounded-full transition-all"
              style={{ width: `${overallScore}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notes (optional) */}
      <div className="space-y-2">
        <Label htmlFor="notes">Assessment Notes (optional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional context or reasoning for your assessment..."
          rows={4}
        />
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
            Assessment submitted successfully! The evidence quality score will
            update automatically.
          </AlertDescription>
        </Alert>
      )}

      {/* Submit button */}
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
      </Button>

      {/* Info note */}
      <p className="text-xs text-muted-foreground text-center">
        Your assessment will be visible to all users and will contribute to the
        overall quality score calculation.
      </p>
    </form>
  );
}
