'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface EvidenceAssessmentFormProps {
  evidenceId: string;
  evidenceTitle: string;
  onSuccess?: () => void;
}

export function EvidenceAssessmentForm({
  evidenceId,
  evidenceTitle,
  onSuccess,
}: EvidenceAssessmentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Step 1: Quality Rubric (1-5 scale each)
  const [chainOfCustodyScore, setChainOfCustodyScore] = useState<number>(3);
  const [witnessCredibilityScore, setWitnessCredibilityScore] = useState<number>(3);
  const [technicalAnalysisScore, setTechnicalAnalysisScore] = useState<number>(3);

  // Step 2: Personal Verdict
  const [verdict, setVerdict] = useState<'alien' | 'natural' | 'uncertain'>('uncertain');
  const [confidence, setConfidence] = useState<number>(5);

  // Optional notes
  const [notes, setNotes] = useState('');

  // Calculate overall quality score (3-15)
  const overallScore = chainOfCustodyScore + witnessCredibilityScore + technicalAnalysisScore;

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
          chain_of_custody_score: chainOfCustodyScore,
          witness_credibility_score: witnessCredibilityScore,
          technical_analysis_score: technicalAnalysisScore,
          verdict,
          confidence,
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

      {/* STEP 1: Quality Rubric */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Step 1: Quality Rubric</CardTitle>
          <CardDescription>
            Evaluate the evidence quality objectively (1-5 scale)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Chain of Custody Score */}
          <div className="space-y-2">
            <Label htmlFor="chain_of_custody">
              Chain of Custody: {chainOfCustodyScore} / 5
            </Label>
            <Slider
              id="chain_of_custody"
              min={1}
              max={5}
              step={1}
              value={[chainOfCustodyScore]}
              onValueChange={(value) => setChainOfCustodyScore(value[0])}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              How well-documented is the evidence trail? Is the source verifiable?
            </p>
            <div className="text-xs text-muted-foreground space-y-1 pl-4 border-l-2">
              <p><strong>1:</strong> No provenance, unverified source</p>
              <p><strong>3:</strong> Partial documentation, some verification</p>
              <p><strong>5:</strong> Complete chain of custody, fully verifiable</p>
            </div>
          </div>

          {/* Witness Credibility Score */}
          <div className="space-y-2">
            <Label htmlFor="witness_credibility">
              Witness Credibility: {witnessCredibilityScore} / 5
            </Label>
            <Slider
              id="witness_credibility"
              min={1}
              max={5}
              step={1}
              value={[witnessCredibilityScore]}
              onValueChange={(value) => setWitnessCredibilityScore(value[0])}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              How reliable is the observer/source? Any bias or credibility concerns?
            </p>
            <div className="text-xs text-muted-foreground space-y-1 pl-4 border-l-2">
              <p><strong>1:</strong> Unknown source, clear bias</p>
              <p><strong>3:</strong> Known source, some expertise</p>
              <p><strong>5:</strong> Expert observer, no bias, established credibility</p>
            </div>
          </div>

          {/* Technical Analysis Score */}
          <div className="space-y-2">
            <Label htmlFor="technical_analysis">
              Technical Analysis: {technicalAnalysisScore} / 5
            </Label>
            <Slider
              id="technical_analysis"
              min={1}
              max={5}
              step={1}
              value={[technicalAnalysisScore]}
              onValueChange={(value) => setTechnicalAnalysisScore(value[0])}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              How rigorous is the methodology? Is the data quality sound?
            </p>
            <div className="text-xs text-muted-foreground space-y-1 pl-4 border-l-2">
              <p><strong>1:</strong> No methodology, poor data quality</p>
              <p><strong>3:</strong> Adequate methodology, reasonable data</p>
              <p><strong>5:</strong> Rigorous methodology, high-quality data</p>
            </div>
          </div>

          {/* Overall Quality Score */}
          <div className="pt-4 border-t">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Overall Quality Score</span>
              <span className="text-lg font-bold">{overallScore} / 15</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-3">
              <div
                className="bg-primary h-3 rounded-full transition-all"
                style={{ width: `${(overallScore / 15) * 100}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* STEP 2: Personal Verdict */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Step 2: Your Verdict</CardTitle>
          <CardDescription>
            Based on this evidence, what is your opinion?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Verdict Selection */}
          <div className="space-y-3">
            <Label>Classification</Label>
            <RadioGroup
              value={verdict}
              onValueChange={(value) => setVerdict(value as 'alien' | 'natural' | 'uncertain')}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="alien" id="alien" />
                <Label htmlFor="alien" className="cursor-pointer">
                  Alien Technology / Non-Natural Origin
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="natural" id="natural" />
                <Label htmlFor="natural" className="cursor-pointer">
                  Natural Phenomenon
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="uncertain" id="uncertain" />
                <Label htmlFor="uncertain" className="cursor-pointer">
                  Uncertain / Insufficient Evidence
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Confidence Level */}
          <div className="space-y-2">
            <Label htmlFor="confidence">
              Confidence Level: {confidence} / 10
            </Label>
            <Slider
              id="confidence"
              min={1}
              max={10}
              step={1}
              value={[confidence]}
              onValueChange={(value) => setConfidence(value[0])}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              How confident are you in your verdict?
            </p>
            <div className="text-xs text-muted-foreground space-y-1 pl-4 border-l-2">
              <p><strong>1-3:</strong> Low confidence, many unknowns</p>
              <p><strong>4-6:</strong> Moderate confidence, some uncertainty</p>
              <p><strong>7-10:</strong> High confidence, strong conviction</p>
            </div>
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
            Assessment submitted successfully! Your verdict has been recorded.
          </AlertDescription>
        </Alert>
      )}

      {/* Submit button */}
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
      </Button>

      {/* Info note */}
      <p className="text-xs text-muted-foreground text-center">
        Your assessment contributes to the Community Sentiment. Only Evidence Analysts can submit assessments.
      </p>
    </form>
  );
}
