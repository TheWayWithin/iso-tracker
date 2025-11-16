import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  canSendNotification,
  incrementNotificationCount,
  getNotificationPreferences,
} from '@/lib/notifications/helpers';
import { sendObservationWindowAlert } from '@/lib/emails/send';

// Force dynamic rendering (uses headers for auth)
export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/observation-windows
 * Cron job to send observation window alerts
 * Protected by CRON_SECRET
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // Get upcoming observation windows (next 7 days)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const { data: upcomingWindows, error: windowsError } = await supabase
      .from('observation_windows')
      .select(
        `
        *,
        iso:isos(id, name)
      `
      )
      .gte('start_date', new Date().toISOString())
      .lte('start_date', sevenDaysFromNow.toISOString())
      .eq('status', 'upcoming');

    if (windowsError) {
      console.error('Failed to fetch observation windows:', windowsError);
      return NextResponse.json(
        { error: 'Failed to fetch observation windows' },
        { status: 500 }
      );
    }

    const notificationResults = {
      total: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
    };

    // Process each upcoming window
    for (const window of upcomingWindows || []) {
      try {
        // Get all users following this ISO
        const { data: follows } = await supabase
          .from('iso_follows')
          .select('user_id')
          .eq('iso_id', window.iso_id);

        if (!follows || follows.length === 0) {
          continue;
        }

        // Calculate days until window
        const startDate = new Date(window.start_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const daysUntilWindow = Math.ceil(
          (startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Only send notifications for 1, 3, or 7 days out
        if (![1, 3, 7].includes(daysUntilWindow)) {
          continue;
        }

        // Send notification to each follower
        for (const follow of follows) {
          notificationResults.total++;

          try {
            // Check if notification can be sent
            const { allowed } = await canSendNotification(
              follow.user_id,
              'observation_window'
            );

            if (!allowed) {
              notificationResults.skipped++;
              continue;
            }

            // Get user preferences
            const prefs = await getNotificationPreferences(follow.user_id);

            if (!prefs || !prefs.observation_window_alerts) {
              notificationResults.skipped++;
              continue;
            }

            // Format dates for email
            const formatDate = (date: string) => {
              return new Date(date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });
            };

            // Send notification email
            const emailResult = await sendObservationWindowAlert({
              to: prefs.email,
              recipientName: prefs.email.split('@')[0], // Fallback username
              isoName: window.iso.name,
              windowStartDate: formatDate(window.start_date),
              windowEndDate: formatDate(window.end_date),
              daysUntilWindow,
              isoUrl: `${process.env.NEXT_PUBLIC_APP_URL}/iso/${window.iso_id}`,
              unsubscribeToken: prefs.unsubscribe_token,
            });

            if (emailResult.success) {
              // Increment notification count
              await incrementNotificationCount(
                follow.user_id,
                'observation_window'
              );
              notificationResults.sent++;
            } else {
              notificationResults.failed++;
            }
          } catch (error) {
            console.error(
              `Failed to send notification to user ${follow.user_id}:`,
              error
            );
            notificationResults.failed++;
          }
        }
      } catch (error) {
        console.error(
          `Failed to process window ${window.id}:`,
          error
        );
      }
    }

    return NextResponse.json({
      success: true,
      results: notificationResults,
      windows_processed: upcomingWindows?.length || 0,
    });
  } catch (error) {
    console.error('Error in GET /api/cron/observation-windows:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
