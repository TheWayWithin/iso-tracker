'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

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

interface EvidenceTimelineProps {
  evidence: Evidence[];
}

const QUALITY_LEVELS = {
  high: { min: 70, color: 'bg-green-500', label: 'High Quality' },
  medium: { min: 40, color: 'bg-yellow-500', label: 'Medium Quality' },
  low: { min: 0, color: 'bg-red-500', label: 'Low Quality' },
};

function getQualityLevel(score: number) {
  if (score >= QUALITY_LEVELS.high.min) return QUALITY_LEVELS.high;
  if (score >= QUALITY_LEVELS.medium.min) return QUALITY_LEVELS.medium;
  return QUALITY_LEVELS.low;
}

function formatEvidenceType(type: string): string {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function EvidenceTimeline({ evidence }: EvidenceTimelineProps) {
  if (evidence.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">
            No evidence submitted yet. Be the first to contribute!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {evidence.map((item, index) => {
        const qualityLevel = getQualityLevel(item.quality_score);

        return (
          <Card key={item.id} className="relative">
            {/* Timeline connector */}
            {index < evidence.length - 1 && (
              <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-border" />
            )}

            <CardHeader className="flex flex-row items-start gap-4 pb-2">
              {/* Quality badge indicator */}
              <div className="relative flex-shrink-0">
                <div className={`w-12 h-12 rounded-full ${qualityLevel.color} flex items-center justify-center text-white font-bold z-10 relative`}>
                  {item.quality_score}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  <Badge variant="outline">{qualityLevel.label}</Badge>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="secondary">
                    {formatEvidenceType(item.evidence_type)}
                  </Badge>
                  <span>•</span>
                  <span>
                    by {item.profiles.display_name || 'Anonymous'}
                  </span>
                  <span>•</span>
                  <span>
                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pl-20">
              <p className="text-sm text-muted-foreground line-clamp-3">
                {item.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
