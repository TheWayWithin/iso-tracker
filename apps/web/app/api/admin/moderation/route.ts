import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/moderation
 * Fetch flagged content queue for admin review
 *
 * Query params:
 * - status: 'pending' | 'reviewed' | 'dismissed' (default: 'pending')
 * - type: 'comment' | 'evidence' | 'argument' (optional filter)
 * - limit: number (default: 50, max: 100)
 * - offset: number (default: 0)
 *
 * Auth: Requires admin role
 * Returns: Array of flags with content details and reporter info (anonymized)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'pending';
    const type = searchParams.get('type');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('moderation_flags')
      .select(`
        id,
        content_type,
        content_id,
        reason,
        status,
        created_at,
        reviewed_at,
        reporter:profiles!reporter_id (
          id,
          username
        ),
        reviewer:profiles!reviewed_by (
          id,
          username
        )
      `)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Optional type filter
    if (type && ['comment', 'evidence', 'argument'].includes(type)) {
      query = query.eq('content_type', type);
    }

    const { data: flags, error: flagsError, count } = await query;

    if (flagsError) {
      console.error('Error fetching flags:', flagsError);
      return NextResponse.json(
        { error: 'Failed to fetch flags' },
        { status: 500 }
      );
    }

    // Fetch content previews for each flag
    const flagsWithContent = await Promise.all(
      flags.map(async (flag) => {
        let contentPreview = '';
        let contentLink = '';

        // Fetch content based on type
        if (flag.content_type === 'comment') {
          const { data: comment } = await supabase
            .from('comments')
            .select('content, iso_id')
            .eq('id', flag.content_id)
            .single();

          if (comment) {
            contentPreview = comment.content.substring(0, 200);
            contentLink = `/iso/${comment.iso_id}#comment-${flag.content_id}`;
          }
        } else if (flag.content_type === 'evidence') {
          const { data: evidence } = await supabase
            .from('evidence')
            .select('title, description, iso_id')
            .eq('id', flag.content_id)
            .single();

          if (evidence) {
            contentPreview = `${evidence.title}: ${evidence.description.substring(0, 150)}`;
            contentLink = `/iso/${evidence.iso_id}/evidence/${flag.content_id}`;
          }
        } else if (flag.content_type === 'argument') {
          const { data: argument } = await supabase
            .from('debate_arguments')
            .select('content, thread_id')
            .eq('id', flag.content_id)
            .single();

          if (argument) {
            contentPreview = argument.content.substring(0, 200);
            contentLink = `/debate/${argument.thread_id}#argument-${flag.content_id}`;
          }
        }

        return {
          ...flag,
          content_preview: contentPreview,
          content_link: contentLink,
        };
      })
    );

    return NextResponse.json({
      flags: flagsWithContent,
      total: count || 0,
      limit,
      offset,
    });

  } catch (error) {
    console.error('Unexpected error in GET /api/admin/moderation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/moderation
 * Take moderation action on flagged content
 *
 * Body:
 * {
 *   flag_id: UUID,
 *   action: 'approve' | 'reject' | 'remove',
 *   reason: string (min 10 chars)
 * }
 *
 * Actions:
 * - approve: Mark flag as dismissed, content stays
 * - reject: Mark flag as dismissed, no action
 * - remove: Delete content, mark flag as reviewed, log action
 *
 * Auth: Requires admin role
 * Returns: { success: true, action_id: UUID }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { flag_id, action, reason } = body;

    // Validate input
    if (!flag_id || !action || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: flag_id, action, reason' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject', 'remove'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be: approve, reject, or remove' },
        { status: 400 }
      );
    }

    if (reason.length < 10) {
      return NextResponse.json(
        { error: 'Reason must be at least 10 characters' },
        { status: 400 }
      );
    }

    // Fetch flag details
    const { data: flag, error: flagError } = await supabase
      .from('moderation_flags')
      .select('*')
      .eq('id', flag_id)
      .single();

    if (flagError || !flag) {
      return NextResponse.json(
        { error: 'Flag not found' },
        { status: 404 }
      );
    }

    // Execute action
    let actionType: string;
    let targetType = flag.content_type;
    let targetId = flag.content_id;

    if (action === 'approve' || action === 'reject') {
      // Dismiss flag without removing content
      actionType = 'dismiss_flag';

      const { error: updateError } = await supabase
        .from('moderation_flags')
        .update({
          status: 'dismissed',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', flag_id);

      if (updateError) {
        console.error('Error updating flag:', updateError);
        return NextResponse.json(
          { error: 'Failed to update flag' },
          { status: 500 }
        );
      }

    } else if (action === 'remove') {
      // Remove content and mark flag as reviewed
      actionType = 'remove_content';

      // Delete content based on type
      let deleteError;
      if (flag.content_type === 'comment') {
        const { error } = await supabase
          .from('comments')
          .delete()
          .eq('id', flag.content_id);
        deleteError = error;
      } else if (flag.content_type === 'evidence') {
        const { error } = await supabase
          .from('evidence')
          .delete()
          .eq('id', flag.content_id);
        deleteError = error;
      } else if (flag.content_type === 'argument') {
        const { error } = await supabase
          .from('debate_arguments')
          .delete()
          .eq('id', flag.content_id);
        deleteError = error;
      }

      if (deleteError) {
        console.error('Error deleting content:', deleteError);
        return NextResponse.json(
          { error: 'Failed to remove content' },
          { status: 500 }
        );
      }

      // Update flag status
      const { error: updateError } = await supabase
        .from('moderation_flags')
        .update({
          status: 'reviewed',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', flag_id);

      if (updateError) {
        console.error('Error updating flag:', updateError);
        return NextResponse.json(
          { error: 'Failed to update flag' },
          { status: 500 }
        );
      }
    }

    // Log moderation action
    const { data: actionLog, error: logError } = await supabase
      .from('moderation_actions')
      .insert({
        admin_id: user.id,
        action_type: actionType,
        target_type: 'flag',
        target_id: flag_id,
        reason,
        metadata: {
          original_content_type: flag.content_type,
          original_content_id: flag.content_id,
          flag_reason: flag.reason,
        },
      })
      .select('id')
      .single();

    if (logError) {
      console.error('Error logging action:', logError);
      // Non-blocking error - action still succeeded
    }

    return NextResponse.json({
      success: true,
      action_id: actionLog?.id,
    });

  } catch (error) {
    console.error('Unexpected error in POST /api/admin/moderation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
