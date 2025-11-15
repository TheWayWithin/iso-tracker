-- ============================================================================
-- Phase 4.3: Email Notifications System
-- Migration 007: Database schema for email notifications
-- ============================================================================

-- ============================================================================
-- NOTIFICATION PREFERENCES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,

  -- Notification toggles
  reply_notifications BOOLEAN NOT NULL DEFAULT true,
  evidence_notifications BOOLEAN NOT NULL DEFAULT true,
  observation_window_alerts BOOLEAN NOT NULL DEFAULT false,

  -- Unsubscribe management
  unsubscribe_token TEXT UNIQUE NOT NULL,
  unsubscribed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id)
);

-- RLS Policies
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX idx_notification_preferences_token ON notification_preferences(unsubscribe_token);

-- ============================================================================
-- ISO FOLLOWS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS iso_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  iso_id UUID NOT NULL REFERENCES iso_objects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id, iso_id)
);

-- RLS Policies
ALTER TABLE iso_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own follows"
  ON iso_follows FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own follows"
  ON iso_follows FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own follows"
  ON iso_follows FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_iso_follows_user_id ON iso_follows(user_id);
CREATE INDEX idx_iso_follows_iso_id ON iso_follows(iso_id);

-- ============================================================================
-- NOTIFICATION QUEUE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('reply', 'evidence', 'observation_window')),
  data JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS Policies
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_notification_queue_status ON notification_queue(status, created_at);
CREATE INDEX idx_notification_queue_user_id ON notification_queue(user_id);

-- ============================================================================
-- NOTIFICATION RATE LIMITS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS notification_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('reply', 'evidence', 'observation_window')),
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  send_count INTEGER NOT NULL DEFAULT 0,
  tier_limit INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id, notification_type, window_start)
);

-- RLS Policies
ALTER TABLE notification_rate_limits ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_notification_rate_limits_lookup ON notification_rate_limits(user_id, notification_type, window_end);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get user tier notification limits
CREATE OR REPLACE FUNCTION get_user_notification_limits(p_user_id UUID)
RETURNS TABLE (
  reply_limit INTEGER,
  evidence_limit INTEGER,
  observation_window_limit INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE s.tier
      WHEN 'free' THEN 10
      WHEN 'event_pass' THEN 50
      WHEN 'evidence_analyst' THEN 200
      ELSE 10
    END AS reply_limit,
    CASE s.tier
      WHEN 'free' THEN 5
      WHEN 'event_pass' THEN 25
      WHEN 'evidence_analyst' THEN 100
      ELSE 5
    END AS evidence_limit,
    CASE s.tier
      WHEN 'free' THEN 0
      WHEN 'event_pass' THEN 10
      WHEN 'evidence_analyst' THEN 50
      ELSE 0
    END AS observation_window_limit
  FROM subscriptions s
  WHERE s.user_id = p_user_id
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can receive notification (rate limit check)
CREATE OR REPLACE FUNCTION can_send_notification(
  p_user_id UUID,
  p_notification_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_tier_limit INTEGER;
  v_current_count INTEGER;
  v_window_start TIMESTAMPTZ;
  v_window_end TIMESTAMPTZ;
BEGIN
  -- Get current 24-hour window
  v_window_start := date_trunc('day', now());
  v_window_end := v_window_start + interval '1 day';

  -- Get tier limit for this notification type
  IF p_notification_type = 'reply' THEN
    SELECT reply_limit INTO v_tier_limit FROM get_user_notification_limits(p_user_id);
  ELSIF p_notification_type = 'evidence' THEN
    SELECT evidence_limit INTO v_tier_limit FROM get_user_notification_limits(p_user_id);
  ELSIF p_notification_type = 'observation_window' THEN
    SELECT observation_window_limit INTO v_tier_limit FROM get_user_notification_limits(p_user_id);
  ELSE
    RETURN FALSE;
  END IF;

  -- Not available for tier
  IF v_tier_limit = 0 THEN
    RETURN FALSE;
  END IF;

  -- Check current count in window
  SELECT COALESCE(send_count, 0) INTO v_current_count
  FROM notification_rate_limits
  WHERE user_id = p_user_id
    AND notification_type = p_notification_type
    AND window_end = v_window_end;

  RETURN COALESCE(v_current_count, 0) < v_tier_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment notification count after successful send
CREATE OR REPLACE FUNCTION increment_notification_count(
  p_user_id UUID,
  p_notification_type TEXT
)
RETURNS VOID AS $$
DECLARE
  v_tier_limit INTEGER;
  v_window_start TIMESTAMPTZ;
  v_window_end TIMESTAMPTZ;
BEGIN
  -- Get current 24-hour window
  v_window_start := date_trunc('day', now());
  v_window_end := v_window_start + interval '1 day';

  -- Get tier limit
  IF p_notification_type = 'reply' THEN
    SELECT reply_limit INTO v_tier_limit FROM get_user_notification_limits(p_user_id);
  ELSIF p_notification_type = 'evidence' THEN
    SELECT evidence_limit INTO v_tier_limit FROM get_user_notification_limits(p_user_id);
  ELSIF p_notification_type = 'observation_window' THEN
    SELECT observation_window_limit INTO v_tier_limit FROM get_user_notification_limits(p_user_id);
  END IF;

  -- Insert or update rate limit record
  INSERT INTO notification_rate_limits (
    user_id,
    notification_type,
    window_start,
    window_end,
    send_count,
    tier_limit
  )
  VALUES (
    p_user_id,
    p_notification_type,
    v_window_start,
    v_window_end,
    1,
    v_tier_limit
  )
  ON CONFLICT (user_id, notification_type, window_start)
  DO UPDATE SET
    send_count = notification_rate_limits.send_count + 1,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-create notification preferences on user signup
CREATE OR REPLACE FUNCTION create_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id, email, unsubscribe_token)
  VALUES (
    NEW.id,
    NEW.email,
    encode(gen_random_bytes(32), 'base64')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_created_notification_preferences
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_notification_preferences();

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER notification_rate_limits_updated_at
  BEFORE UPDATE ON notification_rate_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON notification_preferences TO authenticated;
GRANT SELECT, INSERT, DELETE ON iso_follows TO authenticated;
GRANT SELECT ON notification_queue TO authenticated;
GRANT SELECT ON notification_rate_limits TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE notification_preferences IS 'User email notification preferences with unsubscribe tokens';
COMMENT ON TABLE iso_follows IS 'Tracks which users follow which ISOs for observation window alerts';
COMMENT ON TABLE notification_queue IS 'Queue for batching and processing email notifications';
COMMENT ON TABLE notification_rate_limits IS 'Enforces tier-based rate limits on notifications';
