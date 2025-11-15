-- Migration: 010_fix_signup_trigger.sql
-- Purpose: Fix handle_new_user() to also create notification_preferences
-- Date: 2025-01-12
-- Fixes: Signup failing because notification_preferences record wasn't created

-- Replace the handle_new_user function to include notification_preferences
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Create profile record
  INSERT INTO public.profiles (
    id,
    email,
    display_name,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NOW(),
    NOW()
  );

  -- Create guest subscription (free tier by default)
  INSERT INTO public.subscriptions (
    user_id,
    tier,
    status,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    'guest',
    'active',
    NOW(),
    NOW()
  );

  -- Create notification preferences (with unsubscribe token)
  INSERT INTO public.notification_preferences (
    user_id,
    email,
    unsubscribe_token,
    reply_notifications,
    evidence_notifications,
    observation_window_alerts,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    encode(gen_random_bytes(32), 'hex'),
    true,
    true,
    false,
    NOW(),
    NOW()
  );

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS 'Creates profile, subscription, and notification_preferences when user signs up';
