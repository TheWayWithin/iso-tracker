import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/user/following
 * Get list of ISOs the current user is following
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all ISOs the user is following with ISO details
    const { data: follows, error: followsError } = await supabase
      .from('iso_follows')
      .select(`
        id,
        created_at,
        iso:iso_objects (
          id,
          name,
          designation,
          object_type,
          discovery_date
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (followsError) {
      console.error('Failed to get following list:', followsError);
      return NextResponse.json(
        { error: 'Failed to get following list' },
        { status: 500 }
      );
    }

    // Transform the data for easier consumption
    const following = follows?.map((follow) => ({
      followId: follow.id,
      followedAt: follow.created_at,
      iso: follow.iso,
    })) || [];

    return NextResponse.json({
      following,
      count: following.length,
    });
  } catch (error) {
    console.error('Error in GET /api/user/following:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
