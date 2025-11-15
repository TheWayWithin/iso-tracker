import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  canSendNotification,
  incrementNotificationCount,
  getNotificationPreferences,
} from '@/lib/notifications/helpers';
import { sendEvidenceNotification } from '@/lib/emails/send';

/**
 * POST /api/evidence
 * Submit new evidence with notification support
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
    const { iso_id, evidence_type, title, description, methodology, source_url } = body;

    // Validate input
    if (!iso_id || !evidence_type || !title || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create evidence
    const { data: evidence, error: evidenceError } = await supabase
      .from('evidence')
      .insert({
        iso_id,
        submitter_id: user.id,
        evidence_type,
        title,
        description,
        methodology,
        source_url,
      })
      .select(
        `
        *,
        submitter:profiles(id, username)
      `
      )
      .single();

    if (evidenceError) {
      console.error('Failed to create evidence:', evidenceError);
      return NextResponse.json(
        { error: 'Failed to create evidence' },
        { status: 500 }
      );
    }

    // Send notifications to users following this ISO
    if (evidence && iso_id) {
      try {
        // Get all users following this ISO
        const { data: follows } = await supabase
          .from('iso_follows')
          .select('user_id')
          .eq('iso_id', iso_id);

        if (follows && follows.length > 0) {
          // Get ISO name
          const { data: isoData } = await supabase
            .from('isos')
            .select('name')
            .eq('id', iso_id)
            .single();

          const isoName = isoData?.name || 'Unknown ISO';

          // Get submitter's username
          const { data: userData } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', user.id)
            .single();

          const submitterName = userData?.username || 'A user';

          // Send notification to each follower (except submitter)
          for (const follow of follows) {
            if (follow.user_id === user.id) {
              continue; // Don't notify submitter
            }

            try {
              // Check if notification can be sent
              const { allowed } = await canSendNotification(
                follow.user_id,
                'evidence'
              );

              if (!allowed) {
                continue;
              }

              // Get user preferences
              const prefs = await getNotificationPreferences(follow.user_id);

              if (!prefs || !prefs.evidence_notifications) {
                continue;
              }

              // Send notification email
              const emailResult = await sendEvidenceNotification({
                to: prefs.email,
                recipientName: prefs.email.split('@')[0], // Fallback username
                submitterName,
                isoName,
                evidenceType: evidence_type,
                evidenceTitle: title,
                evidenceUrl: `${process.env.NEXT_PUBLIC_APP_URL}/iso/${iso_id}?evidence=${evidence.id}`,
                unsubscribeToken: prefs.unsubscribe_token,
              });

              if (emailResult.success) {
                // Increment notification count
                await incrementNotificationCount(follow.user_id, 'evidence');
              }
            } catch (notificationError) {
              // Log error but don't fail evidence creation
              console.error(
                `Failed to send notification to user ${follow.user_id}:`,
                notificationError
              );
            }
          }
        }
      } catch (notificationError) {
        // Log error but don't fail evidence creation
        console.error('Failed to send evidence notifications:', notificationError);
      }
    }

    return NextResponse.json({
      success: true,
      evidence,
    });
  } catch (error) {
    console.error('Error in POST /api/evidence:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/evidence?iso_id=xxx
 * Get evidence for an ISO
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const isoId = searchParams.get('iso_id');

    if (!isoId) {
      return NextResponse.json(
        { error: 'Missing iso_id parameter' },
        { status: 400 }
      );
    }

    // Get all evidence for ISO
    const { data: evidence, error } = await supabase
      .from('evidence')
      .select(
        `
        *,
        submitter:profiles(id, username, avatar_url)
      `
      )
      .eq('iso_id', isoId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch evidence:', error);
      return NextResponse.json(
        { error: 'Failed to fetch evidence' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      evidence: evidence || [],
    });
  } catch (error) {
    console.error('Error in GET /api/evidence:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
