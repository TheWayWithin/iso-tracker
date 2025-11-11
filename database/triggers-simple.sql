-- Simple Profile Creation Function (No Trigger Required)
--
-- This approach works around Supabase permission limitations by using
-- Supabase's built-in trigger support via the Dashboard.
--
-- STEP 1: Run this SQL to create the function
-- STEP 2: Set up trigger in Supabase Dashboard (instructions below)

-- Create the profile and subscription creation function
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated, service_role, supabase_auth_admin;

-- Add comments
COMMENT ON FUNCTION public.handle_new_user() IS
  'Automatically creates profile and guest subscription when user signs up via Supabase Auth';

--------------------------------------------------------------------------------
-- STEP 2: Set Up Trigger in Supabase Dashboard
--------------------------------------------------------------------------------
--
-- You CANNOT create triggers on auth.users via SQL (permission denied).
-- Instead, use Supabase's Dashboard:
--
-- 1. Go to: Supabase Dashboard → Database → Triggers
-- 2. Click "Create a new trigger"
-- 3. Fill in:
--    - Name: on_auth_user_created
--    - Table: auth.users
--    - Events: INSERT
--    - Type: After
--    - Function: handle_new_user (select from dropdown)
-- 4. Click "Create trigger"
--
-- Alternatively, use Database Webhooks:
-- 1. Go to: Supabase Dashboard → Database → Webhooks
-- 2. Click "Create webhook"
-- 3. Fill in:
--    - Table: auth.users
--    - Events: INSERT
--    - Type: Run a SQL function
--    - Function: handle_new_user
-- 4. Click "Create webhook"
--
--------------------------------------------------------------------------------
