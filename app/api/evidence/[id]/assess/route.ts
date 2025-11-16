import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/evidence/[id]/assess
 * Submit quality assessment for evidence (PRD-aligned two-step process)
 *
 * Requirements:
 * - User must be authenticated
 * - User must have Evidence Analyst tier ($19/mo)
 * - Step 1: Quality Rubric (chain_of_custody, witness_credibility, technical_analysis) - 1-5 scale
 * - Step 2: Personal Verdict (verdict + confidence)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const evidence_id = params.id;

    // 1. Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body = await request.json();
    const {
      chain_of_custody_score,
      witness_credibility_score,
      technical_analysis_score,
      verdict,
      confidence,
      notes,
    } = body;

    // 3. Validate required fields
    if (
      chain_of_custody_score === undefined ||
      witness_credibility_score === undefined ||
      technical_analysis_score === undefined ||
      verdict === undefined ||
      confidence === undefined
    ) {
      return NextResponse.json(
        { error: 'Missing required fields: chain_of_custody_score, witness_credibility_score, technical_analysis_score, verdict, confidence' },
        { status: 400 }
      );
    }

    // 4. Validate score ranges (1-5 for quality rubric)
    if (chain_of_custody_score < 1 || chain_of_custody_score > 5 || !Number.isInteger(chain_of_custody_score)) {
      return NextResponse.json(
        { error: 'chain_of_custody_score must be an integer between 1 and 5' },
        { status: 400 }
      );
    }

    if (witness_credibility_score < 1 || witness_credibility_score > 5 || !Number.isInteger(witness_credibility_score)) {
      return NextResponse.json(
        { error: 'witness_credibility_score must be an integer between 1 and 5' },
        { status: 400 }
      );
    }

    if (technical_analysis_score < 1 || technical_analysis_score > 5 || !Number.isInteger(technical_analysis_score)) {
      return NextResponse.json(
        { error: 'technical_analysis_score must be an integer between 1 and 5' },
        { status: 400 }
      );
    }

    // 5. Validate verdict (alien, natural, uncertain)
    if (!['alien', 'natural', 'uncertain'].includes(verdict)) {
      return NextResponse.json(
        { error: 'verdict must be one of: alien, natural, uncertain' },
        { status: 400 }
      );
    }

    // 6. Validate confidence (1-10)
    if (confidence < 1 || confidence > 10 || !Number.isInteger(confidence)) {
      return NextResponse.json(
        { error: 'confidence must be an integer between 1 and 10' },
        { status: 400 }
      );
    }

    // 7. Insert assessment (RLS policies enforce Evidence Analyst tier requirement)
    const { data: assessment, error: insertError } = await supabase
      .from('evidence_assessments')
      .insert({
        evidence_id,
        assessor_id: user.id,
        chain_of_custody_score,
        witness_credibility_score,
        technical_analysis_score,
        verdict,
        confidence,
        notes: notes || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Assessment insertion error:', insertError);

      // Check if it's a permission error (RLS policy blocked it)
      if (insertError.code === '42501') {
        return NextResponse.json(
          { error: 'Insufficient permissions. Evidence Analyst tier required to assess evidence.' },
          { status: 403 }
        );
      }

      // Check if it's a duplicate assessment (unique constraint)
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'You have already assessed this evidence. Use PUT to update your assessment.' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to submit assessment', details: insertError.message },
        { status: 500 }
      );
    }

    // 8. Return success with created assessment
    return NextResponse.json(
      {
        message: 'Assessment submitted successfully',
        assessment,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Unexpected error in POST /api/evidence/[id]/assess:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/evidence/[id]/assess
 * List all assessments for a specific evidence piece
 *
 * Requirements:
 * - Public access (no authentication required)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const evidence_id = params.id;

    // Fetch assessments with assessor profiles
    const { data: assessments, error } = await supabase
      .from('evidence_assessments')
      .select('*, profiles(display_name, avatar_url)')
      .eq('evidence_id', evidence_id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Assessment fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch assessments' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      assessments: assessments || [],
    });

  } catch (error) {
    console.error('Unexpected error in GET /api/evidence/[id]/assess:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
