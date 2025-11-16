import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/iso/[id]/sentiment
 * Fetch community sentiment (verdict percentages) for an ISO object
 *
 * Returns:
 * - Total assessments count
 * - Percentage breakdown: alien, natural, uncertain
 * - Average confidence per verdict category
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const iso_id = params.id;

    // Get all evidence IDs for this ISO
    const { data: evidenceList, error: evidenceError } = await supabase
      .from('evidence')
      .select('id')
      .eq('iso_id', iso_id)
      .is('deleted_at', null);

    if (evidenceError) {
      console.error('Evidence fetch error:', evidenceError);
      return NextResponse.json(
        { error: 'Failed to fetch evidence' },
        { status: 500 }
      );
    }

    if (!evidenceList || evidenceList.length === 0) {
      // No evidence for this ISO
      return NextResponse.json({
        total_assessments: 0,
        alien: { count: 0, percentage: 0, avg_confidence: 0 },
        natural: { count: 0, percentage: 0, avg_confidence: 0 },
        uncertain: { count: 0, percentage: 0, avg_confidence: 0 },
      });
    }

    const evidenceIds = evidenceList.map(e => e.id);

    // Get all assessments for this ISO's evidence
    const { data: assessments, error: assessmentError } = await supabase
      .from('evidence_assessments')
      .select('verdict, confidence')
      .in('evidence_id', evidenceIds)
      .is('deleted_at', null);

    if (assessmentError) {
      console.error('Assessment fetch error:', assessmentError);
      return NextResponse.json(
        { error: 'Failed to fetch assessments' },
        { status: 500 }
      );
    }

    if (!assessments || assessments.length === 0) {
      // No assessments yet
      return NextResponse.json({
        total_assessments: 0,
        alien: { count: 0, percentage: 0, avg_confidence: 0 },
        natural: { count: 0, percentage: 0, avg_confidence: 0 },
        uncertain: { count: 0, percentage: 0, avg_confidence: 0 },
      });
    }

    // Aggregate verdicts
    const total = assessments.length;

    const alienAssessments = assessments.filter(a => a.verdict === 'alien');
    const naturalAssessments = assessments.filter(a => a.verdict === 'natural');
    const uncertainAssessments = assessments.filter(a => a.verdict === 'uncertain');

    const calcAvgConfidence = (items: typeof assessments) => {
      if (items.length === 0) return 0;
      const sum = items.reduce((acc, item) => acc + (item.confidence || 0), 0);
      return Math.round((sum / items.length) * 10) / 10; // 1 decimal place
    };

    return NextResponse.json({
      total_assessments: total,
      alien: {
        count: alienAssessments.length,
        percentage: Math.round((alienAssessments.length / total) * 100),
        avg_confidence: calcAvgConfidence(alienAssessments),
      },
      natural: {
        count: naturalAssessments.length,
        percentage: Math.round((naturalAssessments.length / total) * 100),
        avg_confidence: calcAvgConfidence(naturalAssessments),
      },
      uncertain: {
        count: uncertainAssessments.length,
        percentage: Math.round((uncertainAssessments.length / total) * 100),
        avg_confidence: calcAvgConfidence(uncertainAssessments),
      },
    });

  } catch (error) {
    console.error('Unexpected error in GET /api/iso/[id]/sentiment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
