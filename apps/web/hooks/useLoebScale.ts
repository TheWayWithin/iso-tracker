'use client';

import { useState, useEffect, useCallback } from 'react';

type LoebZone = 'green' | 'yellow' | 'orange' | 'red';

interface LoebScaleAssessment {
  official_level: number | null;
  official_zone: LoebZone | null;
  official_classification: string | null;
  official_reasoning: string | null;
  official_source: string | null;
  community_level: number | null;
  community_zone: LoebZone | null;
  community_vote_count: number;
  criteria_met: string[];
  evidence_links: string[];
  category_scores: {
    trajectory: number | null;
    spectroscopic: number | null;
    geometric: number | null;
    composition: number | null;
    electromagnetic: number | null;
    operational: number | null;
  };
}

interface UseLoebScaleOptions {
  isoId: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseLoebScaleReturn {
  data: LoebScaleAssessment | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useLoebScale({
  isoId,
  autoRefresh = false,
  refreshInterval = 60000,
}: UseLoebScaleOptions): UseLoebScaleReturn {
  const [data, setData] = useState<LoebScaleAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!isoId) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/iso/${isoId}/loeb-scale`);

      if (!response.ok) {
        if (response.status === 401) {
          // User not authenticated - return default data
          setData({
            official_level: null,
            official_zone: null,
            official_classification: null,
            official_reasoning: null,
            official_source: null,
            community_level: null,
            community_zone: null,
            community_vote_count: 0,
            criteria_met: [],
            evidence_links: [],
            category_scores: {
              trajectory: null,
              spectroscopic: null,
              geometric: null,
              composition: null,
              electromagnetic: null,
              operational: null,
            },
          });
          setError(null);
          return;
        }
        throw new Error('Failed to fetch Loeb Scale data');
      }

      const responseData = await response.json();
      setData(responseData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Loeb Scale data');
    } finally {
      setLoading(false);
    }
  }, [isoId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !isoId) return;

    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, isoId, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

export default useLoebScale;
