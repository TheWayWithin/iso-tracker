import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { validateEvidenceSubmission, sanitizeEvidenceSubmission } from '@/lib/validation';

/**
 * POST /api/evidence
 * Submit new evidence for an ISO
 *
 * Requirements:
 * - User must be authenticated
 * - User must have Event Pass tier or higher
 * - Rate limit: 10 submissions per ISO per hour (Event Pass)
 * - Rate limit: Unlimited (Evidence Analyst)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

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
      iso_object_id,
      evidence_type,
      title,
      description,
      methodology,
      source_url,
    } = body;

    // 3. Validate required fields
    if (!iso_object_id || !evidence_type || !title || !description || !methodology) {
      return NextResponse.json(
        { error: 'Missing required fields: iso_object_id, evidence_type, title, description, methodology' },
        { status: 400 }
      );
    }

    // 3.5 Validate and sanitize input
    const validation = validateEvidenceSubmission({
      title,
      description,
      methodology,
      source_url,
    });

    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    const sanitized = sanitizeEvidenceSubmission({
      title,
      description,
      methodology,
      source_url,
    });

    // 4. Check rate limit (database function handles tier checking)
    const { data: canSubmit, error: rateLimitError } = await supabase
      .rpc('check_submission_limit', {
        p_user_id: user.id,
        p_iso_object_id: iso_object_id,
      });

    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError);
      return NextResponse.json(
        { error: 'Failed to check submission limit' },
        { status: 500 }
      );
    }

    if (!canSubmit) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Event Pass users can submit 10 evidence pieces per ISO per hour. Upgrade to Evidence Analyst for unlimited submissions.' },
        { status: 429 }
      );
    }

    // 5. Insert evidence (RLS policies will enforce tier requirements)
    const { data: evidence, error: insertError } = await supabase
      .from('evidence')
      .insert({
        iso_object_id,
        submitter_id: user.id,
        evidence_type,
        title: sanitized.title,
        description: sanitized.description,
        methodology: sanitized.methodology,
        source_url: sanitized.source_url || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Evidence insertion error:', insertError);

      // Check if it's a permission error (RLS policy blocked it)
      if (insertError.code === '42501') {
        return NextResponse.json(
          { error: 'Insufficient permissions. Event Pass tier required to submit evidence.' },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to submit evidence', details: insertError.message },
        { status: 500 }
      );
    }

    // 6. Return success with created evidence
    return NextResponse.json(
      {
        message: 'Evidence submitted successfully',
        evidence,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Unexpected error in POST /api/evidence:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/evidence?iso_object_id=xxx
 * List evidence for a specific ISO
 *
 * Requirements:
 * - Public access (no authentication required)
 * - Paginated (20 per page)
 * - Sorted by quality_score DESC (highest quality first)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);

    const iso_object_id = searchParams.get('iso_object_id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;
    const offset = (page - 1) * limit;

    if (!iso_object_id) {
      return NextResponse.json(
        { error: 'Missing required parameter: iso_object_id' },
        { status: 400 }
      );
    }

    // Fetch evidence with pagination
    const { data: evidence, error, count } = await supabase
      .from('evidence')
      .select('*, profiles(display_name, avatar_url)', { count: 'exact' })
      .eq('iso_object_id', iso_object_id)
      .is('deleted_at', null)
      .order('quality_score', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Evidence fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch evidence' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      evidence: evidence || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });

  } catch (error) {
    console.error('Unexpected error in GET /api/evidence:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
