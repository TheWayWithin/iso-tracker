import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/iso/[id]/follow
 * Check if current user follows this ISO and get follow count
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const isoId = params.id;

    // Get follow count for this ISO
    const { count: followCount, error: countError } = await supabase
      .from('iso_follows')
      .select('*', { count: 'exact', head: true })
      .eq('iso_id', isoId);

    if (countError) {
      console.error('Failed to get follow count:', countError);
    }

    // Check if current user follows this ISO
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let isFollowing = false;
    if (user) {
      const { data: follow } = await supabase
        .from('iso_follows')
        .select('id')
        .eq('user_id', user.id)
        .eq('iso_id', isoId)
        .maybeSingle();

      isFollowing = !!follow;
    }

    return NextResponse.json({
      isFollowing,
      followCount: followCount || 0,
    });
  } catch (error) {
    console.error('Error in GET /api/iso/[id]/follow:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/iso/[id]/follow
 * Follow an ISO
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const isoId = params.id;

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

    // Check if ISO exists
    const { data: iso, error: isoError } = await supabase
      .from('iso_objects')
      .select('id')
      .eq('id', isoId)
      .single();

    if (isoError || !iso) {
      return NextResponse.json(
        { error: 'ISO not found' },
        { status: 404 }
      );
    }

    // Check if already following
    const { data: existingFollow } = await supabase
      .from('iso_follows')
      .select('id')
      .eq('user_id', user.id)
      .eq('iso_id', isoId)
      .maybeSingle();

    if (existingFollow) {
      return NextResponse.json({
        success: true,
        isFollowing: true,
        message: 'Already following this ISO',
      });
    }

    // Create follow
    const { error: insertError } = await supabase
      .from('iso_follows')
      .insert({
        user_id: user.id,
        iso_id: isoId,
      });

    if (insertError) {
      console.error('Failed to follow ISO:', insertError);
      return NextResponse.json(
        { error: 'Failed to follow ISO' },
        { status: 500 }
      );
    }

    // Get updated follow count
    const { count: followCount } = await supabase
      .from('iso_follows')
      .select('*', { count: 'exact', head: true })
      .eq('iso_id', isoId);

    return NextResponse.json({
      success: true,
      isFollowing: true,
      followCount: followCount || 0,
    });
  } catch (error) {
    console.error('Error in POST /api/iso/[id]/follow:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/iso/[id]/follow
 * Unfollow an ISO
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const isoId = params.id;

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

    // Delete follow
    const { error: deleteError } = await supabase
      .from('iso_follows')
      .delete()
      .eq('user_id', user.id)
      .eq('iso_id', isoId);

    if (deleteError) {
      console.error('Failed to unfollow ISO:', deleteError);
      return NextResponse.json(
        { error: 'Failed to unfollow ISO' },
        { status: 500 }
      );
    }

    // Get updated follow count
    const { count: followCount } = await supabase
      .from('iso_follows')
      .select('*', { count: 'exact', head: true })
      .eq('iso_id', isoId);

    return NextResponse.json({
      success: true,
      isFollowing: false,
      followCount: followCount || 0,
    });
  } catch (error) {
    console.error('Error in DELETE /api/iso/[id]/follow:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
