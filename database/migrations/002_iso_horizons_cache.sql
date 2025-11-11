-- ISO Horizons Cache Table
-- Stores NASA JPL Horizons API responses for 24hr caching
-- Supports both geocentric and heliocentric coordinate systems

CREATE TABLE iso_horizons_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  object_id UUID NOT NULL REFERENCES iso_objects(id) ON DELETE CASCADE,

  -- Geocentric data (Earth-centered, CENTER='500@399')
  geocentric_data JSONB,

  -- Heliocentric data (Sun-centered, CENTER='500@0')
  heliocentric_data JSONB,

  -- Cache metadata
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '24 hours',

  -- Ensure one cache entry per object
  UNIQUE(object_id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for cache lookups
CREATE INDEX idx_iso_horizons_cache_object_id ON iso_horizons_cache(object_id);
CREATE INDEX idx_iso_horizons_cache_valid_until ON iso_horizons_cache(valid_until);

-- Update timestamp trigger
CREATE TRIGGER update_iso_horizons_cache_updated_at
  BEFORE UPDATE ON iso_horizons_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE iso_horizons_cache IS 'Caches NASA JPL Horizons API responses for 24 hours to minimize API calls';
COMMENT ON COLUMN iso_horizons_cache.geocentric_data IS 'Earth-centered coordinate data from Horizons API (CENTER=500@399)';
COMMENT ON COLUMN iso_horizons_cache.heliocentric_data IS 'Sun-centered coordinate data from Horizons API (CENTER=500@0)';
COMMENT ON COLUMN iso_horizons_cache.valid_until IS 'Cache expiration time (24 hours from fetched_at)';
