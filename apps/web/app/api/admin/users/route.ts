import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/users
 * List users with moderation status for admin review
 *
 * Query params:
 * - search: string (search by username or email)
 * - status: 'active' | 'suspended' | 'banned' (optional filter)
 * - tier: 'free' | 'event_pass' | 'evidence_analyst' (optional filter)
 * - limit: number (default: 50, max: 100)
 * - offset: number (default: 0)
 *
 * Auth: Requires admin role
 * Returns: Array of users with profile info, subscription tier, moderation status
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

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
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const tier = searchParams.get('tier');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('profiles')
      .select(`
        id,
        username,
        email,
        created_at,
        role,
        suspended_until,
        banned_at,
        suspension_reason,
        subscriptions (
          tier,
          status,
          current_period_start,
          current_period_end
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // Search filter (username or email)
    if (search) {
      query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Status filter
    if (status === 'suspended') {
      query = query.not('suspended_until', 'is', null);
      query = query.gt('suspended_until', new Date().toISOString());
    } else if (status === 'banned') {
      query = query.not('banned_at', 'is', null);
    } else if (status === 'active') {
      query = query.is('banned_at', null);
      query = query.or('suspended_until.is.null,suspended_until.lt.' + new Date().toISOString());
    }

    // Tier filter (via subscription join)
    if (tier && ['free', 'event_pass', 'evidence_analyst'].includes(tier)) {
      query = query.eq('subscriptions.tier', tier);
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: users, error: usersError, count } = await query;

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    // Format response with computed status
    const formattedUsers = users.map((u) => {
      let computedStatus = 'active';
      if (u.banned_at) {
        computedStatus = 'banned';
      } else if (u.suspended_until && new Date(u.suspended_until) > new Date()) {
        computedStatus = 'suspended';
      }

      return {
        id: u.id,
        username: u.username,
        email: u.email,
        created_at: u.created_at,
        role: u.role,
        status: computedStatus,
        suspended_until: u.suspended_until,
        banned_at: u.banned_at,
        suspension_reason: u.suspension_reason,
        tier: u.subscriptions?.[0]?.tier || 'free',
        subscription_status: u.subscriptions?.[0]?.status || null,
      };
    });

    return NextResponse.json({
      users: formattedUsers,
      total: count || 0,
      limit,
      offset,
    });

  } catch (error) {
    console.error('Unexpected error in GET /api/admin/users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/users/[userId]
 * Suspend or ban a user
 *
 * Body:
 * {
 *   user_id: UUID,
 *   action: 'suspend' | 'unsuspend' | 'ban',
 *   duration_days?: number (required for suspend, default 7),
 *   reason: string (min 10 chars)
 * }
 *
 * Actions:
 * - suspend: Set profiles.suspended_until = now() + duration_days
 * - unsuspend: Set profiles.suspended_until = null
 * - ban: Set profiles.banned_at = now() (permanent)
 *
 * Auth: Requires admin role
 * Side effects: Logs action, sends email notification to user
 * Returns: { success: true, user_id: UUID, action: string }
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient();

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
    const { user_id, action, duration_days, reason } = body;

    // Validate input
    if (!user_id || !action || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, action, reason' },
        { status: 400 }
      );
    }

    if (!['suspend', 'unsuspend', 'ban'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be: suspend, unsuspend, or ban' },
        { status: 400 }
      );
    }

    if (reason.length < 10) {
      return NextResponse.json(
        { error: 'Reason must be at least 10 characters' },
        { status: 400 }
      );
    }

    if (action === 'suspend' && !duration_days) {
      return NextResponse.json(
        { error: 'duration_days required for suspend action' },
        { status: 400 }
      );
    }

    // Check target user exists and is not an admin
    const { data: targetUser, error: targetError } = await supabase
      .from('profiles')
      .select('id, username, email, role')
      .eq('id', user_id)
      .single();

    if (targetError || !targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent suspending/banning other admins
    if (targetUser.role === 'admin') {
      return NextResponse.json(
        { error: 'Cannot suspend or ban other admins' },
        { status: 403 }
      );
    }

    // Execute action
    let updateData: any = {};
    let actionType = '';

    if (action === 'suspend') {
      actionType = 'suspend_user';
      const suspendUntil = new Date();
      suspendUntil.setDate(suspendUntil.getDate() + duration_days);

      updateData = {
        suspended_until: suspendUntil.toISOString(),
        suspension_reason: reason,
      };
    } else if (action === 'unsuspend') {
      actionType = 'unsuspend_user';
      updateData = {
        suspended_until: null,
        suspension_reason: null,
      };
    } else if (action === 'ban') {
      actionType = 'ban_user';
      updateData = {
        banned_at: new Date().toISOString(),
        suspension_reason: reason,
      };
    }

    // Update user profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user_id);

    if (updateError) {
      console.error('Error updating user:', updateError);
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }

    // Log moderation action
    const { data: actionLog, error: logError } = await supabase
      .from('moderation_actions')
      .insert({
        admin_id: user.id,
        action_type: actionType,
        target_type: 'user',
        target_id: user_id,
        reason,
        metadata: {
          duration_days: duration_days || null,
          target_username: targetUser.username,
          target_email: targetUser.email,
        },
      })
      .select('id')
      .single();

    if (logError) {
      console.error('Error logging action:', logError);
      // Non-blocking error - action still succeeded
    }

    // TODO: Send email notification to user (Phase 4.3 integration)
    // sendEmail({
    //   to: targetUser.email,
    //   template: 'account_suspended',
    //   data: { reason, duration_days, action }
    // });

    return NextResponse.json({
      success: true,
      user_id,
      action: actionType,
      action_id: actionLog?.id,
    });

  } catch (error) {
    console.error('Unexpected error in PATCH /api/admin/users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
