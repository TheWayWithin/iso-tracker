-- Email signups for 3i-atlas.live landing page
-- Captures interest from viral traffic for the main platform

CREATE TABLE IF NOT EXISTS email_signups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  source TEXT DEFAULT '3i-atlas.live',
  referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  converted_at TIMESTAMPTZ, -- When they sign up for a full account
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_email_signups_email ON email_signups(email);
CREATE INDEX IF NOT EXISTS idx_email_signups_source ON email_signups(source);
CREATE INDEX IF NOT EXISTS idx_email_signups_created_at ON email_signups(created_at DESC);

-- RLS policies
ALTER TABLE email_signups ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (for the landing page form)
CREATE POLICY "Allow anonymous email signup inserts"
  ON email_signups
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can view/manage signups
CREATE POLICY "Admins can view email signups"
  ON email_signups
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update email signups"
  ON email_signups
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

COMMENT ON TABLE email_signups IS 'Email capture list from 3i-atlas.live landing page';
COMMENT ON COLUMN email_signups.source IS 'Landing page source (e.g., 3i-atlas.live, isotracker.org)';
COMMENT ON COLUMN email_signups.converted_at IS 'Timestamp when user signed up for full account';
