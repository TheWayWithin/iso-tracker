import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/evidence/[id]/assess
 * Submit quality assessment for evidence
 *
 * Requirements:
 * - User must be authenticated
 * - User must have Evidence Analyst tier
 * - Scores: expertise (0|20|40), methodology (0-30), peer_review (0-30)
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
      expertise_score,
      methodology_score,
      peer_review_score,
      notes,
    } = body;

    // 3. Validate required fields
    if (
      expertise_score === undefined ||
      methodology_score === undefined ||
      peer_review_score === undefined
    ) {
      return NextResponse.json(
        { error: 'Missing required fields: expertise_score, methodology_score, peer_review_score' },
        { status: 400 }
      );
    }

    // 4. Validate score ranges
    if (![0, 20, 40].includes(expertise_score)) {
      return NextResponse.json(
        { error: 'expertise_score must be 0, 20, or 40' },
        { status: 400 }
      );
    }

    if (methodology_score < 0 || methodology_score > 30) {
      return NextResponse.json(
        { error: 'methodology_score must be between 0 and 30' },
        { status: 400 }
      );
    }

    if (peer_review_score < 0 || peer_review_score > 30) {
      return NextResponse.json(
        { error: 'peer_review_score must be between 0 and 30' },
        { status: 400 }
      );
    }

    // 5. Insert assessment (RLS policies enforce Evidence Analyst tier requirement)
    const { data: assessment, error: insertError } = await supabase
      .from('evidence_assessments')
      .insert({
        evidence_id,
        assessor_id: user.id,
        expertise_score,
        methodology_score,
        peer_review_score,
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

    // 6. Return success with created assessment
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
