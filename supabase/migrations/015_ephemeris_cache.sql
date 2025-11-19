-- Migration 015: Ephemeris Cache Table
-- Purpose: Store cached NASA Horizons ephemeris data for interstellar objects
-- Reduces API calls and improves performance with 7-day TTL

-- Create ephemeris_cache table
CREATE TABLE IF NOT EXISTS ephemeris_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  iso_object_id UUID NOT NULL REFERENCES iso_objects(id) ON DELETE CASCADE,

  -- Observation metadata
  observation_date TIMESTAMPTZ NOT NULL,
  datetime_jd TEXT NOT NULL, -- Julian Date (string for precision)

  -- Position data (from NASA Horizons)
  ra NUMERIC(10, 6), -- Right Ascension (degrees)
  dec NUMERIC(10, 6), -- Declination (degrees)
  delta NUMERIC(15, 10), -- Distance from observer (AU)
  deldot NUMERIC(10, 4), -- Range rate (km/s)

  -- Visual data
  magnitude NUMERIC(5, 2), -- Visual magnitude (can be null if not visible)
  phase_angle NUMERIC(6, 2), -- Sun-Object-Observer angle (degrees)

  -- Cache metadata
  cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_ephemeris_cache_iso_object ON ephemeris_cache(iso_object_id);
CREATE INDEX idx_ephemeris_cache_observation_date ON ephemeris_cache(observation_date);
CREATE INDEX idx_ephemeris_cache_expires_at ON ephemeris_cache(expires_at);
CREATE INDEX idx_ephemeris_cache_iso_date ON ephemeris_cache(iso_object_id, observation_date);

-- Composite unique constraint (one cache entry per object per observation date)
CREATE UNIQUE INDEX idx_ephemeris_cache_unique
  ON ephemeris_cache(iso_object_id, datetime_jd);

-- RLS (Row Level Security) policies
ALTER TABLE ephemeris_cache ENABLE ROW LEVEL SECURITY;

-- Allow public read access to ephemeris data (non-sensitive scientific data)
CREATE POLICY "Public users can read ephemeris cache"
  ON ephemeris_cache
  FOR SELECT
  TO public
  USING (true);

-- Only authenticated users can insert/update cache (API routes only)
CREATE POLICY "Authenticated users can insert ephemeris cache"
  ON ephemeris_cache
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update ephemeris cache"
  ON ephemeris_cache
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Only service role can delete (for cache cleanup)
CREATE POLICY "Service role can delete ephemeris cache"
  ON ephemeris_cache
  FOR DELETE
  TO service_role
  USING (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ephemeris_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ephemeris_cache_updated_at
  BEFORE UPDATE ON ephemeris_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_ephemeris_cache_updated_at();

-- Function to clean up expired cache entries (can be run via cron)
CREATE OR REPLACE FUNCTION clean_expired_ephemeris_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM ephemeris_cache
  WHERE expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (for API routes)
GRANT EXECUTE ON FUNCTION clean_expired_ephemeris_cache() TO authenticated;

-- Comment for documentation
COMMENT ON TABLE ephemeris_cache IS 'Cached NASA Horizons ephemeris data with 7-day TTL';
COMMENT ON COLUMN ephemeris_cache.ra IS 'Right Ascension in degrees (celestial longitude)';
COMMENT ON COLUMN ephemeris_cache.dec IS 'Declination in degrees (celestial latitude)';
COMMENT ON COLUMN ephemeris_cache.delta IS 'Distance from observer in Astronomical Units';
COMMENT ON COLUMN ephemeris_cache.deldot IS 'Range rate (velocity toward/away from observer) in km/s';
COMMENT ON COLUMN ephemeris_cache.magnitude IS 'Apparent visual magnitude (lower = brighter)';
COMMENT ON COLUMN ephemeris_cache.phase_angle IS 'Sun-Object-Observer angle in degrees';
