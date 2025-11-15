import { createClient } from '@/lib/supabase/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

/**
 * Check if user can receive a notification (rate limit + preferences)
 */
export async function canSendNotification(
  userId: string,
  notificationType: 'reply' | 'evidence' | 'observation_window'
): Promise<{ allowed: boolean; reason?: string }> {
  const supabase = await createClient();

  // Check preferences first
  const { data: prefs, error: prefsError } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (prefsError || !prefs) {
    return { allowed: false, reason: 'No preferences found' };
  }

  // Check if unsubscribed
  if (prefs.unsubscribed_at) {
    return { allowed: false, reason: 'User unsubscribed' };
  }

  // Check specific notification type enabled
  const typeEnabled = {
    reply: prefs.reply_notifications,
    evidence: prefs.evidence_notifications,
    observation_window: prefs.observation_window_alerts,
  }[notificationType];

  if (!typeEnabled) {
    return { allowed: false, reason: `${notificationType} notifications disabled` };
  }

  // Check rate limit via database function
  const { data: canSend, error: rateLimitError } = await supabase.rpc(
    'can_send_notification',
    {
      p_user_id: userId,
      p_notification_type: notificationType,
    }
  );

  if (rateLimitError) {
    console.error('Rate limit check error:', rateLimitError);
    return { allowed: false, reason: 'Rate limit check failed' };
  }

  if (!canSend) {
    return { allowed: false, reason: 'Rate limit exceeded' };
  }

  return { allowed: true };
}

/**
 * Increment notification count after successful send
 */
export async function incrementNotificationCount(
  userId: string,
  notificationType: 'reply' | 'evidence' | 'observation_window'
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.rpc('increment_notification_count', {
    p_user_id: userId,
    p_notification_type: notificationType,
  });

  if (error) {
    console.error('Failed to increment notification count:', error);
    throw error;
  }
}

/**
 * Get user's notification preferences
 */
export async function getNotificationPreferences(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Failed to get notification preferences:', error);
    return null;
  }

  return data;
}

/**
 * Generate JWT token for unsubscribe links
 */
export function generateUnsubscribeToken(userId: string, email: string): string {
  return jwt.sign(
    {
      userId,
      email,
      purpose: 'unsubscribe',
    },
    JWT_SECRET,
    {
      expiresIn: '90d', // Long-lived for unsubscribe links
    }
  );
}

/**
 * Verify unsubscribe token
 */
export function verifyUnsubscribeToken(token: string): {
  valid: boolean;
  userId?: string;
  email?: string;
  error?: string;
} {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      purpose: string;
    };

    if (decoded.purpose !== 'unsubscribe') {
      return { valid: false, error: 'Invalid token purpose' };
    }

    return {
      valid: true,
      userId: decoded.userId,
      email: decoded.email,
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid token',
    };
  }
}

/**
 * Get user's tier notification limits
 */
export async function getUserNotificationLimits(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_user_notification_limits', {
    p_user_id: userId,
  });

  if (error) {
    console.error('Failed to get notification limits:', error);
    return null;
  }

  return data?.[0] || null;
}
