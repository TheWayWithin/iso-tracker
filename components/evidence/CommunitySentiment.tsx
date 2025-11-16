'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SentimentData {
  total_assessments: number;
  alien: { count: number; percentage: number; avg_confidence: number };
  natural: { count: number; percentage: number; avg_confidence: number };
  uncertain: { count: number; percentage: number; avg_confidence: number };
}

interface CommunitySentimentProps {
  isoId: string;
}

export function CommunitySentiment({ isoId }: CommunitySentimentProps) {
  const [sentiment, setSentiment] = useState<SentimentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSentiment = async () => {
      try {
        const response = await fetch(`/api/iso/${isoId}/sentiment`);
        if (!response.ok) {
          throw new Error('Failed to fetch sentiment data');
        }
        const data = await response.json();
        setSentiment(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSentiment();
  }, [isoId]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Community Sentiment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Community Sentiment</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!sentiment || sentiment.total_assessments === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Community Sentiment</CardTitle>
          <CardDescription>How Evidence Analysts classify this object</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No assessments yet. Be the first Evidence Analyst to evaluate the evidence!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Community Sentiment</CardTitle>
        <CardDescription>
          Based on {sentiment.total_assessments} assessment{sentiment.total_assessments !== 1 ? 's' : ''} from Evidence Analysts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Alien Verdict */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Alien Technology</span>
            <span className="text-muted-foreground">
              {sentiment.alien.percentage}% ({sentiment.alien.count})
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-3">
            <div
              className="bg-purple-500 h-3 rounded-full transition-all"
              style={{ width: `${sentiment.alien.percentage}%` }}
            />
          </div>
          {sentiment.alien.count > 0 && (
            <p className="text-xs text-muted-foreground">
              Avg. confidence: {sentiment.alien.avg_confidence}/10
            </p>
          )}
        </div>

        {/* Natural Verdict */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Natural Phenomenon</span>
            <span className="text-muted-foreground">
              {sentiment.natural.percentage}% ({sentiment.natural.count})
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-3">
            <div
              className="bg-green-500 h-3 rounded-full transition-all"
              style={{ width: `${sentiment.natural.percentage}%` }}
            />
          </div>
          {sentiment.natural.count > 0 && (
            <p className="text-xs text-muted-foreground">
              Avg. confidence: {sentiment.natural.avg_confidence}/10
            </p>
          )}
        </div>

        {/* Uncertain Verdict */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Uncertain</span>
            <span className="text-muted-foreground">
              {sentiment.uncertain.percentage}% ({sentiment.uncertain.count})
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-3">
            <div
              className="bg-yellow-500 h-3 rounded-full transition-all"
              style={{ width: `${sentiment.uncertain.percentage}%` }}
            />
          </div>
          {sentiment.uncertain.count > 0 && (
            <p className="text-xs text-muted-foreground">
              Avg. confidence: {sentiment.uncertain.avg_confidence}/10
            </p>
          )}
        </div>

        {/* Summary */}
        <div className="pt-3 border-t text-xs text-muted-foreground">
          <p>
            Community consensus:{' '}
            <span className="font-medium">
              {sentiment.alien.percentage > sentiment.natural.percentage &&
               sentiment.alien.percentage > sentiment.uncertain.percentage
                ? 'Leaning Alien'
                : sentiment.natural.percentage > sentiment.uncertain.percentage
                ? 'Leaning Natural'
                : 'Uncertain'}
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
