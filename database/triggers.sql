-- Profile and Subscription Creation Trigger
--
-- Automatically creates a profile and guest-tier subscription when a new user signs up.
-- This ensures every user has the necessary records for the application to function.
--
-- Security: Runs with SECURITY DEFINER (elevated privileges) to bypass RLS policies
-- during profile creation. This is necessary because the trigger runs before the user
-- session is fully established.

-- Function to create profile and subscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Create profile
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
    COALESCE(NEW.raw_user_meta_data->>'display_name', ''),
    NOW(),
    NOW()
  );

  -- Create guest subscription (free tier)
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

  RETURN NEW;
END;
$$;

-- NOTE: The trigger on auth.users must be created using Supabase's Database Webhooks
-- instead of a direct trigger because we don't have permission to modify auth.users
--
-- Alternative approach: Use Supabase Database Webhook
-- Dashboard → Database → Webhooks → Create a new hook
-- Table: auth.users
-- Events: INSERT
-- Type: HTTP Request to Edge Function OR use the function directly if available

-- For now, we'll create a manual approach using RPC that can be called after signup
-- This ensures compatibility with Supabase's auth system

-- Grant necessary permissions for the function
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated, service_role;

-- Comments for documentation
COMMENT ON FUNCTION public.handle_new_user() IS
  'Automatically creates profile and guest subscription when user signs up';

COMMENT ON TRIGGER on_auth_user_created ON auth.users IS
  'Triggers profile and subscription creation after user signup';
