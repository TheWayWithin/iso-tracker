import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Cache health metrics for 5 minutes to reduce DB load
let cachedMetrics: any = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * GET /api/admin/health
 * System health metrics dashboard
 *
 * Auth: Requires admin role
 * Cache: 5 minutes
 * Returns: System metrics (users, content, moderation, performance)
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

    // Check cache
    const now = Date.now();
    if (cachedMetrics && (now - cacheTimestamp) < CACHE_TTL) {
      return NextResponse.json({
        ...cachedMetrics,
        cached: true,
        cache_age_seconds: Math.floor((now - cacheTimestamp) / 1000),
      });
    }

    // Gather system metrics
    const [
      totalUsersResult,
      activeUsers30dResult,
      totalEvidenceResult,
      totalCommentsResult,
      totalISOsResult,
      pendingFlagsResult,
      resolvedFlags7dResult,
      recentSignupsResult,
      subscriptionBreakdownResult,
    ] = await Promise.all([
      // Total users
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true }),

      // Active users (30 days) - users who created content or commented
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),

      // Total evidence submissions
      supabase
        .from('evidence')
        .select('id', { count: 'exact', head: true }),

      // Total comments
      supabase
        .from('comments')
        .select('id', { count: 'exact', head: true }),

      // Total ISOs
      supabase
        .from('iso_objects')
        .select('id', { count: 'exact', head: true }),

      // Pending moderation flags
      supabase
        .from('moderation_flags')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),

      // Resolved flags (7 days)
      supabase
        .from('moderation_flags')
        .select('id', { count: 'exact', head: true })
        .in('status', ['reviewed', 'dismissed'])
        .gte('reviewed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),

      // Recent signups (7 days)
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),

      // Subscription tier breakdown
      supabase
        .from('subscriptions')
        .select('tier')
        .eq('status', 'active'),
    ]);

    // Process subscription breakdown
    const tierCounts = {
      free: 0,
      event_pass: 0,
      evidence_analyst: 0,
    };

    if (subscriptionBreakdownResult.data) {
      subscriptionBreakdownResult.data.forEach((sub: any) => {
        if (sub.tier in tierCounts) {
          tierCounts[sub.tier as keyof typeof tierCounts]++;
        }
      });
    }

    // Calculate engagement metrics
    const totalUsers = totalUsersResult.count || 0;
    const activeUsers = activeUsers30dResult.count || 0;
    const engagementRate = totalUsers > 0 ? (activeUsers / totalUsers * 100).toFixed(1) : '0';

    // Build response
    const metrics = {
      database: {
        total_users: totalUsers,
        active_users_30d: activeUsers,
        engagement_rate: `${engagementRate}%`,
        total_evidence: totalEvidenceResult.count || 0,
        total_comments: totalCommentsResult.count || 0,
        total_isos: totalISOsResult.count || 0,
      },
      moderation: {
        pending_flags: pendingFlagsResult.count || 0,
        resolved_flags_7d: resolvedFlags7dResult.count || 0,
      },
      growth: {
        signups_7d: recentSignupsResult.count || 0,
        tier_breakdown: tierCounts,
      },
      system: {
        uptime_hours: Math.floor(process.uptime() / 3600),
        timestamp: new Date().toISOString(),
        cache_ttl_seconds: CACHE_TTL / 1000,
      },
    };

    // Update cache
    cachedMetrics = metrics;
    cacheTimestamp = now;

    return NextResponse.json({
      ...metrics,
      cached: false,
    });

  } catch (error) {
    console.error('Unexpected error in GET /api/admin/health:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/health/clear-cache
 * Clear health metrics cache
 *
 * Auth: Requires admin role
 * Returns: { success: true }
 */
export async function POST(request: NextRequest) {
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

    // Clear cache
    cachedMetrics = null;
    cacheTimestamp = 0;

    return NextResponse.json({
      success: true,
      message: 'Health metrics cache cleared',
    });

  } catch (error) {
    console.error('Unexpected error in POST /api/admin/health:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
