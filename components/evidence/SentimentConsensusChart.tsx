'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SentimentConsensusChartProps {
  communityAlienPct: number;
  communityNaturalPct: number;
  scientificConsensus: number;
  evidenceCount: number;
}

export function SentimentConsensusChart({
  communityAlienPct,
  communityNaturalPct,
  scientificConsensus,
  evidenceCount,
}: SentimentConsensusChartProps) {
  // Prepare data for chart
  const chartData = [
    {
      name: 'Community Sentiment',
      alien: Math.round(communityAlienPct),
      natural: Math.round(communityNaturalPct),
    },
    {
      name: 'Scientific Consensus',
      score: Math.round(scientificConsensus),
    },
  ];

  // Calculate gap
  const gap = Math.abs(communityAlienPct - scientificConsensus);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Community Sentiment vs Scientific Consensus</CardTitle>
        <CardDescription>
          Based on {evidenceCount} evidence piece{evidenceCount !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Chart */}
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis label={{ value: 'Score / Percentage', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="alien" fill="#3b82f6" name="Alien %" />
              <Bar dataKey="natural" fill="#10b981" name="Natural %" />
              <Bar dataKey="score" fill="#8b5cf6" name="Consensus Score" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary */}
        <div className="mt-6 space-y-4">
          {/* Community Sentiment */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Community Sentiment</h4>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm">Alien: {Math.round(communityAlienPct)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm">Natural: {Math.round(communityNaturalPct)}%</span>
              </div>
            </div>
          </div>

          {/* Scientific Consensus */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Scientific Consensus</h4>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span className="text-sm">
                Quality Score: {Math.round(scientificConsensus)} / 100
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Based on Evidence Analyst assessments
            </p>
          </div>

          {/* Gap Analysis */}
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <h4 className="text-sm font-semibold">Gap Analysis</h4>
            <p className="text-sm">
              Community sentiment differs from scientific consensus by{' '}
              <span className="font-bold">{Math.round(gap)}%</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {gap > 20
                ? 'Significant divergence - review the evidence to understand why'
                : 'Community views align closely with scientific assessment'}
            </p>
          </div>

          {/* Educational note */}
          <div className="text-xs text-muted-foreground border-l-2 pl-4">
            <p className="font-semibold mb-1">What does this mean?</p>
            <p>
              This chart shows WHERE your assessment might differ from scientific
              consensus. Use it to ask: "Why do I disagree? What evidence supports
              my view?" Remember: Follow the data, admit uncertainty.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
