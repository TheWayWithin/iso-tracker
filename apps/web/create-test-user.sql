-- Create test user for Playwright tests
-- Run this with: supabase db execute -f create-test-user.sql

-- Insert test user into auth.users table
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token
) VALUES (
  '99999999-9999-9999-9999-999999999999'::uuid,
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'test@isotracker.local',
  '$2a$10$vGELNZEyW3qlELmXq9TmJOqPBhDJPmxsLmBhBQsJL2mGK5LzC1H6m', -- Password: TestUser123!
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  false,
  ''
) ON CONFLICT (id) DO NOTHING;

-- Create corresponding profile
INSERT INTO public.profiles (
  id,
  email,
  created_at,
  updated_at
) VALUES (
  '99999999-9999-9999-9999-999999999999'::uuid,
  'test@isotracker.local',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create subscription record
INSERT INTO public.subscriptions (
  id,
  user_id,
  tier,
  status,
  created_at
) VALUES (
  gen_random_uuid(),
  '99999999-9999-9999-9999-999999999999'::uuid,
  'spectator',
  'active',
  NOW()
) ON CONFLICT DO NOTHING;

-- Create notification preferences
INSERT INTO public.notification_preferences (
  id,
  user_id,
  email_new_evidence,
  email_community_digest,
  email_system_updates,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '99999999-9999-9999-9999-999999999999'::uuid,
  true,
  true,
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;
