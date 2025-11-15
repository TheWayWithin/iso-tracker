import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/consensus/[iso_object_id]
 * Get consensus metrics for an ISO
 *
 * Returns:
 * - community_alien_pct: % of community who think it's alien (from arguments)
 * - community_natural_pct: % of community who think it's natural (from arguments)
 * - scientific_consensus: Average quality score from Evidence Analyst assessments
 * - evidence_count: Total number of evidence pieces
 * - last_assessment_at: When the last assessment was made
 *
 * Requirements:
 * - Public access (no authentication required)
 * - Cached for 5 minutes
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { iso_object_id: string } }
) {
  try {
    const supabase = createClient();
    const iso_object_id = params.iso_object_id;

    // Fetch from consensus_snapshot materialized view
    const { data: consensus, error } = await supabase
      .from('consensus_snapshot')
      .select('*')
      .eq('iso_object_id', iso_object_id)
      .single();

    if (error) {
      // If no consensus data exists yet, return defaults
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          consensus: {
            iso_object_id,
            community_alien_pct: 0,
            community_natural_pct: 0,
            scientific_consensus: 0,
            evidence_count: 0,
            last_assessment_at: null,
          },
        });
      }

      console.error('Consensus fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch consensus data' },
        { status: 500 }
      );
    }

    // Return consensus data with cache headers (5 minutes)
    return NextResponse.json(
      { consensus },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );

  } catch (error) {
    console.error('Unexpected error in GET /api/consensus/[iso_object_id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
