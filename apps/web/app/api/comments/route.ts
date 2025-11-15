import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  canSendNotification,
  incrementNotificationCount,
  getNotificationPreferences,
} from '@/lib/notifications/helpers';
import { sendReplyNotification } from '@/lib/emails/send';

/**
 * POST /api/comments
 * Create a new comment or reply with notification support
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { thread_id, parent_id, content, iso_id } = body;

    // Validate input
    if (!thread_id || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create comment
    const { data: comment, error: commentError } = await supabase
      .from('debate_comments')
      .insert({
        thread_id,
        parent_id: parent_id || null,
        user_id: user.id,
        content,
      })
      .select(
        `
        *,
        user:profiles(id, username, avatar_url)
      `
      )
      .single();

    if (commentError) {
      console.error('Failed to create comment:', commentError);
      return NextResponse.json(
        { error: 'Failed to create comment' },
        { status: 500 }
      );
    }

    // If this is a reply, send notification to parent comment author
    if (parent_id) {
      try {
        // Get parent comment
        const { data: parentComment } = await supabase
          .from('debate_comments')
          .select('user_id, content')
          .eq('id', parent_id)
          .single();

        if (parentComment && parentComment.user_id !== user.id) {
          // Don't notify if replying to own comment
          const parentUserId = parentComment.user_id;

          // Check if notification can be sent
          const { allowed } = await canSendNotification(parentUserId, 'reply');

          if (allowed) {
            // Get parent user preferences
            const prefs = await getNotificationPreferences(parentUserId);

            if (prefs) {
              // Get ISO name for email
              const { data: isoData } = await supabase
                .from('isos')
                .select('name')
                .eq('id', iso_id)
                .single();

              const isoName = isoData?.name || 'Unknown ISO';

              // Get replier's username
              const { data: userData } = await supabase
                .from('profiles')
                .select('username')
                .eq('id', user.id)
                .single();

              const replierName = userData?.username || 'A user';

              // Send notification email
              const emailResult = await sendReplyNotification({
                to: prefs.email,
                recipientName: prefs.email.split('@')[0], // Fallback username
                replierName,
                isoName,
                commentPreview: content.substring(0, 150) + (content.length > 150 ? '...' : ''),
                commentUrl: `${process.env.NEXT_PUBLIC_APP_URL}/iso/${iso_id}?comment=${comment.id}`,
                unsubscribeToken: prefs.unsubscribe_token,
              });

              if (emailResult.success) {
                // Increment notification count
                await incrementNotificationCount(parentUserId, 'reply');
              }
            }
          }
        }
      } catch (notificationError) {
        // Log error but don't fail the comment creation
        console.error('Failed to send reply notification:', notificationError);
      }
    }

    return NextResponse.json({
      success: true,
      comment,
    });
  } catch (error) {
    console.error('Error in POST /api/comments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/comments?thread_id=xxx
 * Get comments for a thread
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const threadId = searchParams.get('thread_id');

    if (!threadId) {
      return NextResponse.json(
        { error: 'Missing thread_id parameter' },
        { status: 400 }
      );
    }

    // Get all comments for thread
    const { data: comments, error } = await supabase
      .from('debate_comments')
      .select(
        `
        *,
        user:profiles(id, username, avatar_url),
        replies:debate_comments!parent_id(
          *,
          user:profiles(id, username, avatar_url)
        )
      `
      )
      .eq('thread_id', threadId)
      .is('parent_id', null)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to fetch comments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch comments' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      comments: comments || [],
    });
  } catch (error) {
    console.error('Error in GET /api/comments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
