-- Migration: 012_remove_auth_trigger.sql
-- Purpose: Remove auth.users trigger - handle record creation in application code instead
-- Date: 2025-01-12
-- Reason: Supabase doesn't reliably support custom triggers on auth.users table
-- Solution: Create profile/subscription/notification_preferences in signup action

-- =====================================================
-- Drop trigger on auth.users (doesn't work in Supabase)
-- =====================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- =====================================================
-- Drop the function (no longer needed)
-- =====================================================

DROP FUNCTION IF EXISTS public.handle_new_user();

-- =====================================================
-- Note: Record creation now handled in app/auth/actions.ts signUp()
-- =====================================================

COMMENT ON TABLE profiles IS
  'User profiles - created by application code during signup (app/auth/actions.ts)';

COMMENT ON TABLE subscriptions IS
  'User subscriptions - created by application code during signup (app/auth/actions.ts)';

COMMENT ON TABLE notification_preferences IS
  'User notification preferences - created by application code during signup (app/auth/actions.ts)';
