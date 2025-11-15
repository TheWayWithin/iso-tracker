import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyUnsubscribeToken } from '@/lib/notifications/helpers';

/**
 * GET /api/notifications/unsubscribe?token=xxx
 * Unsubscribe from all email notifications via token
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Missing unsubscribe token' },
        { status: 400 }
      );
    }

    // Verify token
    const verification = verifyUnsubscribeToken(token);
    if (!verification.valid) {
      return NextResponse.json(
        { error: verification.error || 'Invalid unsubscribe token' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Update preferences to mark as unsubscribed
    const { error: updateError } = await supabase
      .from('notification_preferences')
      .update({
        unsubscribed_at: new Date().toISOString(),
        reply_notifications: false,
        evidence_notifications: false,
        observation_window_alerts: false,
      })
      .eq('unsubscribe_token', token);

    if (updateError) {
      console.error('Failed to unsubscribe:', updateError);
      return NextResponse.json(
        { error: 'Failed to process unsubscribe request' },
        { status: 500 }
      );
    }

    // Return success page (HTML response)
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Unsubscribed - ISO Tracker</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              background-color: #f6f9fc;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
            }
            .container {
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
              padding: 48px;
              max-width: 500px;
              text-align: center;
            }
            h1 {
              color: #1a1a1a;
              font-size: 24px;
              margin: 0 0 16px;
            }
            p {
              color: #6b7280;
              font-size: 16px;
              line-height: 24px;
              margin: 0 0 24px;
            }
            .success-icon {
              font-size: 48px;
              margin-bottom: 24px;
            }
            .button {
              display: inline-block;
              background-color: #2563eb;
              color: white;
              text-decoration: none;
              padding: 12px 24px;
              border-radius: 6px;
              font-weight: 600;
              margin-top: 16px;
            }
            .button:hover {
              background-color: #1d4ed8;
            }
            .footer {
              margin-top: 32px;
              padding-top: 24px;
              border-top: 1px solid #e5e7eb;
              color: #9ca3af;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success-icon">✓</div>
            <h1>Successfully Unsubscribed</h1>
            <p>
              You've been unsubscribed from all ISO Tracker email notifications.
              We're sorry to see you go!
            </p>
            <p>
              You can re-enable notifications anytime from your account settings.
            </p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003'}/settings/notifications" class="button">
              Manage Notification Settings
            </a>
            <div class="footer">
              If you unsubscribed by mistake, you can update your preferences in your account settings.
            </div>
          </div>
        </body>
      </html>
      `,
      {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
        },
      }
    );
  } catch (error) {
    console.error('Error in GET /api/notifications/unsubscribe:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications/resubscribe
 * Re-enable notifications (authenticated)
 */
export async function POST() {
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

    // Clear unsubscribed status and re-enable default notifications
    const { error: updateError } = await supabase
      .from('notification_preferences')
      .update({
        unsubscribed_at: null,
        reply_notifications: true,
        evidence_notifications: true,
        observation_window_alerts: false, // Keep off by default
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Failed to resubscribe:', updateError);
      return NextResponse.json(
        { error: 'Failed to resubscribe' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully resubscribed to notifications',
    });
  } catch (error) {
    console.error('Error in POST /api/notifications/resubscribe:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
