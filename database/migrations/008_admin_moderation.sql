-- Migration: 008_admin_moderation.sql
-- Purpose: Admin dashboard moderation and user management
-- Phase: Sprint 4, Phase 4.4
-- Date: 2025-01-12
-- Fixed: Functions created BEFORE tables/policies that reference them

-- =====================================================
-- STEP 1: CREATE FUNCTIONS FIRST
-- =====================================================

-- FUNCTION: check_admin_role
-- Purpose: Check if current user has admin role
-- Security: SECURITY DEFINER (elevated privileges)
CREATE OR REPLACE FUNCTION check_admin_role()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
END;
$$;

-- =====================================================
-- STEP 2: SCHEMA UPDATES (Add columns to profiles)
-- =====================================================

-- Add suspended_until column (temporary suspensions)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ;

-- Add banned_at column (permanent bans)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ;

-- Add suspension_reason column (for transparency)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- Index for finding suspended/banned users
CREATE INDEX IF NOT EXISTS idx_profiles_suspended ON profiles(suspended_until) WHERE suspended_until IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_banned ON profiles(banned_at) WHERE banned_at IS NOT NULL;

-- =====================================================
-- STEP 3: CREATE TABLES
-- =====================================================

-- TABLE: moderation_flags
-- Purpose: Track flagged content (comments, evidence, arguments)
CREATE TABLE IF NOT EXISTS moderation_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL CHECK (content_type IN ('comment', 'evidence', 'argument')),
  content_id UUID NOT NULL,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (length(reason) >= 10),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Prevent duplicate flags from same user on same content
  UNIQUE(reporter_id, content_type, content_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_moderation_flags_status_created ON moderation_flags(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_flags_content ON moderation_flags(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_moderation_flags_reporter ON moderation_flags(reporter_id);

-- TABLE: moderation_actions
-- Purpose: Audit log of all moderation actions (append-only)
CREATE TABLE IF NOT EXISTS moderation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('suspend_user', 'unsuspend_user', 'ban_user', 'remove_content', 'approve_content', 'dismiss_flag')),
  target_type TEXT NOT NULL CHECK (target_type IN ('user', 'comment', 'evidence', 'argument', 'flag')),
  target_id UUID NOT NULL,
  reason TEXT NOT NULL CHECK (length(reason) >= 10),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_moderation_actions_admin ON moderation_actions(admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_target ON moderation_actions(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_type ON moderation_actions(action_type, created_at DESC);

-- =====================================================
-- STEP 4: ENABLE RLS AND CREATE POLICIES
-- (Now that tables exist and check_admin_role() function exists)
-- =====================================================

-- Enable RLS on moderation_flags
ALTER TABLE moderation_flags ENABLE ROW LEVEL SECURITY;

-- Policy: Users can create flags
CREATE POLICY "users_can_flag_content" ON moderation_flags
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- Policy: Users can view their own flags
CREATE POLICY "users_can_view_own_flags" ON moderation_flags
  FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

-- Policy: Admins can view all flags
CREATE POLICY "admins_can_view_all_flags" ON moderation_flags
  FOR SELECT
  TO authenticated
  USING (check_admin_role());

-- Policy: Admins can update flags
CREATE POLICY "admins_can_update_flags" ON moderation_flags
  FOR UPDATE
  TO authenticated
  USING (check_admin_role())
  WITH CHECK (check_admin_role());

-- Enable RLS on moderation_actions
ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can insert actions
CREATE POLICY "admins_can_log_actions" ON moderation_actions
  FOR INSERT
  TO authenticated
  WITH CHECK (check_admin_role() AND auth.uid() = admin_id);

-- Policy: Admins can view all actions
CREATE POLICY "admins_can_view_actions" ON moderation_actions
  FOR SELECT
  TO authenticated
  USING (check_admin_role());

-- NO UPDATE/DELETE policies = append-only audit log

-- =====================================================
-- STEP 5: ADDITIONAL FUNCTIONS
-- =====================================================

-- FUNCTION: log_moderation_action
-- Purpose: Helper to insert moderation action log entry
-- Returns: action_id (UUID)
CREATE OR REPLACE FUNCTION log_moderation_action(
  p_action_type TEXT,
  p_target_type TEXT,
  p_target_id UUID,
  p_reason TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_action_id UUID;
BEGIN
  -- Verify caller is admin
  IF NOT check_admin_role() THEN
    RAISE EXCEPTION 'Only admins can log moderation actions';
  END IF;

  -- Insert action
  INSERT INTO moderation_actions (admin_id, action_type, target_type, target_id, reason, metadata)
  VALUES (auth.uid(), p_action_type, p_target_type, p_target_id, p_reason, p_metadata)
  RETURNING id INTO v_action_id;

  RETURN v_action_id;
END;
$$;

-- FUNCTION: is_user_suspended
-- Purpose: Check if user is currently suspended or banned
CREATE OR REPLACE FUNCTION is_user_suspended(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile RECORD;
BEGIN
  SELECT suspended_until, banned_at
  INTO v_profile
  FROM profiles
  WHERE id = p_user_id;

  -- Banned users are permanently suspended
  IF v_profile.banned_at IS NOT NULL THEN
    RETURN TRUE;
  END IF;

  -- Check if suspension is still active
  IF v_profile.suspended_until IS NOT NULL AND v_profile.suspended_until > now() THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- =====================================================
-- STEP 6: HELPER VIEWS
-- =====================================================

-- View: Pending flags summary
CREATE OR REPLACE VIEW admin_pending_flags_summary AS
SELECT
  content_type,
  COUNT(*) as count,
  MIN(created_at) as oldest_flag
FROM moderation_flags
WHERE status = 'pending'
GROUP BY content_type;

-- View: Recent moderation actions
CREATE OR REPLACE VIEW admin_recent_actions AS
SELECT
  ma.id,
  ma.action_type,
  ma.target_type,
  ma.created_at,
  p.username as admin_username
FROM moderation_actions ma
JOIN profiles p ON ma.admin_id = p.id
ORDER BY ma.created_at DESC
LIMIT 100;

-- Grant access to views (admins only via RLS on underlying tables)
GRANT SELECT ON admin_pending_flags_summary TO authenticated;
GRANT SELECT ON admin_recent_actions TO authenticated;

-- =====================================================
-- COMMENTS (Documentation)
-- =====================================================

COMMENT ON TABLE moderation_flags IS 'Content moderation flags submitted by users';
COMMENT ON TABLE moderation_actions IS 'Audit log of all moderation actions (append-only)';
COMMENT ON FUNCTION check_admin_role() IS 'Returns true if current user has admin role';
COMMENT ON FUNCTION log_moderation_action(TEXT, TEXT, UUID, TEXT, JSONB) IS 'Log a moderation action to audit trail';
COMMENT ON FUNCTION is_user_suspended(UUID) IS 'Check if user is currently suspended or banned';
COMMENT ON VIEW admin_pending_flags_summary IS 'Summary of pending flags by content type';
COMMENT ON VIEW admin_recent_actions IS 'Last 100 moderation actions with admin usernames';
