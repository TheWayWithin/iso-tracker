'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { SentimentConsensusChart } from './SentimentConsensusChart';
import { EvidenceTimeline } from './EvidenceTimeline';
import { EvidenceSubmissionForm } from './EvidenceSubmissionForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface EvidenceDashboardProps {
  isoObjectId: string;
  userTier: 'guest' | 'event_pass' | 'evidence_analyst' | null;
}

interface ConsensusData {
  iso_object_id: string;
  community_alien_pct: number;
  community_natural_pct: number;
  scientific_consensus: number;
  evidence_count: number;
  last_assessment_at: string | null;
}

interface Evidence {
  id: string;
  title: string;
  description: string;
  evidence_type: string;
  quality_score: number;
  created_at: string;
  profiles: {
    display_name: string | null;
  };
}

export function EvidenceDashboard({ isoObjectId, userTier }: EvidenceDashboardProps) {
  const [consensus, setConsensus] = useState<ConsensusData | null>(null);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);

  const canSubmit = userTier === 'event_pass' || userTier === 'evidence_analyst';

  // Fetch consensus and evidence data
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch consensus data
      const consensusRes = await fetch(`/api/consensus/${isoObjectId}`);
      if (!consensusRes.ok) throw new Error('Failed to load consensus data');
      const consensusData = await consensusRes.json();
      setConsensus(consensusData.consensus);

      // Fetch evidence list
      const evidenceRes = await fetch(`/api/evidence?iso_object_id=${isoObjectId}`);
      if (!evidenceRes.ok) throw new Error('Failed to load evidence');
      const evidenceData = await evidenceRes.json();
      setEvidence(evidenceData.evidence);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Set up real-time subscription for evidence updates
    const supabase = createClient();

    const channel = supabase
      .channel(`evidence-${isoObjectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'evidence',
          filter: `iso_object_id=eq.${isoObjectId}`,
        },
        () => {
          // Reload data when evidence changes
          fetchData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'evidence_assessments',
        },
        () => {
          // Reload data when assessments change
          fetchData();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [isoObjectId]);

  const handleSubmissionSuccess = () => {
    setShowSubmissionForm(false);
    fetchData(); // Reload data
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle>Evidence Framework Dashboard</CardTitle>
          <CardDescription>
            Community-driven scientific analysis for interstellar objects
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Consensus Chart */}
      {consensus && (
        <SentimentConsensusChart
          communityAlienPct={consensus.community_alien_pct}
          communityNaturalPct={consensus.community_natural_pct}
          scientificConsensus={consensus.scientific_consensus}
          evidenceCount={consensus.evidence_count}
        />
      )}

      {/* Tabs for Evidence and Submission */}
      <Tabs defaultValue="evidence" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="evidence" className="flex-1">
            Evidence Timeline ({evidence.length})
          </TabsTrigger>
          {canSubmit && (
            <TabsTrigger value="submit" className="flex-1">
              Submit Evidence
            </TabsTrigger>
          )}
        </TabsList>

        {/* Evidence Timeline Tab */}
        <TabsContent value="evidence" className="mt-6">
          <EvidenceTimeline evidence={evidence} />
        </TabsContent>

        {/* Submit Evidence Tab */}
        {canSubmit && (
          <TabsContent value="submit" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Submit New Evidence</CardTitle>
                <CardDescription>
                  Share scientific evidence for this ISO
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EvidenceSubmissionForm
                  isoObjectId={isoObjectId}
                  onSuccess={handleSubmissionSuccess}
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Upgrade CTA for guests */}
      {!canSubmit && (
        <Card className="border-primary">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <h3 className="font-semibold text-lg">Want to contribute evidence?</h3>
              <p className="text-muted-foreground">
                Upgrade to Event Pass to submit evidence and participate in the
                scientific discussion.
              </p>
              <Button size="lg">
                Upgrade to Event Pass - $4.99/mo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
