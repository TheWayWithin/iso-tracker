-- Migration: 009_user_signup_trigger.sql
-- Purpose: Auto-create profile and subscription when user signs up
-- Date: 2025-01-12
-- Fixes: Signup 500 error - users couldn't sign up because profile wasn't auto-created

-- =====================================================
-- FUNCTION: handle_new_user
-- Purpose: Automatically create profile + subscription when user signs up
-- Security: SECURITY DEFINER (elevated privileges to bypass RLS)
-- =====================================================

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

-- =====================================================
-- TRIGGER: on_auth_user_created
-- Purpose: Call handle_new_user() when new user signs up
-- Table: auth.users (Supabase auth schema)
-- =====================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates profile and guest subscription when user signs up';
-- Note: Cannot add comment on auth.users trigger (permission denied) - this is expected
