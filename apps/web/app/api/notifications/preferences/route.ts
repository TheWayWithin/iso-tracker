import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/notifications/preferences
 * Get current user's notification preferences and limits
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

    // Get preferences - use maybeSingle() to handle missing records
    const { data: preferences, error: prefsError } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (prefsError) {
      console.error('Failed to get preferences:', prefsError);
      return NextResponse.json(
        { error: 'Failed to load preferences' },
        { status: 500 }
      );
    }

    // If no preferences record exists, create one with defaults
    if (!preferences) {
      const { data: newPrefs, error: createError } = await supabase
        .from('notification_preferences')
        .insert({
          user_id: user.id,
          email: user.email || '',
          unsubscribe_token: crypto.randomUUID(),
          reply_notifications: true,
          evidence_notifications: true,
          observation_window_alerts: false,
        })
        .select()
        .single();

      if (createError) {
        console.error('Failed to create preferences:', createError);
        return NextResponse.json(
          { error: 'Failed to initialize preferences' },
          { status: 500 }
        );
      }

      // Get tier limits from database function
      const { data: limits } = await supabase.rpc('get_user_notification_limits', {
        p_user_id: user.id,
      });

      return NextResponse.json({
        preferences: {
          reply_notifications: newPrefs.reply_notifications,
          evidence_notifications: newPrefs.evidence_notifications,
          observation_window_alerts: newPrefs.observation_window_alerts,
        },
        limits: limits?.[0] || {
          reply_limit: 10,
          evidence_limit: 5,
          observation_window_limit: 0,
        },
        email: newPrefs.email,
        unsubscribed: !!newPrefs.unsubscribed_at,
      });
    }

    // Get tier limits from database function
    const { data: limits } = await supabase.rpc('get_user_notification_limits', {
      p_user_id: user.id,
    });

    return NextResponse.json({
      preferences: {
        reply_notifications: preferences.reply_notifications,
        evidence_notifications: preferences.evidence_notifications,
        observation_window_alerts: preferences.observation_window_alerts,
      },
      limits: limits?.[0] || {
        reply_limit: 10,
        evidence_limit: 5,
        observation_window_limit: 0,
      },
      email: preferences.email,
      unsubscribed: !!preferences.unsubscribed_at,
    });
  } catch (error) {
    console.error('Error in GET /api/notifications/preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications/preferences
 * Update notification preferences
 */
export async function PATCH(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const { reply_notifications, evidence_notifications, observation_window_alerts } = body;

    // Validate input
    if (
      typeof reply_notifications !== 'boolean' &&
      typeof evidence_notifications !== 'boolean' &&
      typeof observation_window_alerts !== 'boolean'
    ) {
      return NextResponse.json(
        { error: 'Invalid preferences data' },
        { status: 400 }
      );
    }

    // Check tier limits for observation window alerts
    if (observation_window_alerts) {
      const { data: limits } = await supabase.rpc('get_user_notification_limits', {
        p_user_id: user.id,
      });
      if (limits?.[0]?.observation_window_limit === 0) {
        return NextResponse.json(
          { error: 'Observation window alerts not available in your tier' },
          { status: 403 }
        );
      }
    }

    // Update preferences
    const updates: Record<string, boolean> = {};
    if (typeof reply_notifications === 'boolean') {
      updates.reply_notifications = reply_notifications;
    }
    if (typeof evidence_notifications === 'boolean') {
      updates.evidence_notifications = evidence_notifications;
    }
    if (typeof observation_window_alerts === 'boolean') {
      updates.observation_window_alerts = observation_window_alerts;
    }

    const { data, error: updateError } = await supabase
      .from('notification_preferences')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update preferences:', updateError);
      return NextResponse.json(
        { error: 'Failed to update preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      preferences: {
        reply_notifications: data.reply_notifications,
        evidence_notifications: data.evidence_notifications,
        observation_window_alerts: data.observation_window_alerts,
      },
    });
  } catch (error) {
    console.error('Error in PATCH /api/notifications/preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
