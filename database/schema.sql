-- ============================================================================
-- ISO Tracker MVP - Database Schema (Sprint 1)
-- ============================================================================
-- Purpose: Core database schema for evidence-based ISO analysis platform
-- Strategy: Soft Paid-First with 3-tier pricing (Guest, Event Pass, Evidence Analyst)
-- Security: RLS enabled on all tables, policies enforce tier requirements
-- Performance: Indexes on foreign keys and tier checks, denormalized vote counts
-- ============================================================================

-- ----------------------------------------------------------------------------
-- EXTENSIONS
-- ----------------------------------------------------------------------------

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable case-insensitive text matching (for email, etc.)
CREATE EXTENSION IF NOT EXISTS "citext";

-- ----------------------------------------------------------------------------
-- CUSTOM TYPES
-- ----------------------------------------------------------------------------

-- Subscription tiers enum
CREATE TYPE subscription_tier AS ENUM (
  'guest',              -- Free, read-only access
  'event_pass',         -- $4.99/mo - voting, alerts
  'evidence_analyst'    -- $19/mo - evidence framework, all features
);

-- Early adopter pricing status
CREATE TYPE adopter_status AS ENUM (
  'early_adopter',      -- First 500 users (locked-in pricing)
  'regular'             -- Regular pricing
);

-- Subscription status
CREATE TYPE subscription_status AS ENUM (
  'active',             -- Currently subscribed and paid
  'past_due',           -- Payment failed, grace period
  'canceled',           -- User canceled, access until period end
  'incomplete',         -- Initial payment pending
  'incomplete_expired', -- Initial payment failed
  'trialing',           -- Free trial period
  'unpaid'              -- Payment failed, no access
);

-- ----------------------------------------------------------------------------
-- TABLES
-- ----------------------------------------------------------------------------

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
-- Purpose: User profile information (extends Supabase auth.users)
-- Note: User ID comes from auth.users, this stores additional profile data
-- ============================================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email CITEXT NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT display_name_length CHECK (char_length(display_name) <= 50),
  CONSTRAINT bio_length CHECK (char_length(bio) <= 500)
);

-- Index for email lookups
CREATE INDEX idx_profiles_email ON profiles(email);

-- ============================================================================
-- SUBSCRIPTIONS TABLE
-- ============================================================================
-- Purpose: Track user subscription tier and Stripe integration
-- Note: One active subscription per user, tracks Stripe customer/subscription IDs
-- ============================================================================

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Tier and status
  tier subscription_tier NOT NULL DEFAULT 'guest',
  status subscription_status NOT NULL DEFAULT 'active',

  -- Early adopter tracking
  adopter_status adopter_status NOT NULL DEFAULT 'regular',
  adopter_number INTEGER, -- 1-500 for early adopters, NULL for regular

  -- Stripe integration
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,

  -- Subscription period
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT one_subscription_per_user UNIQUE(user_id),
  CONSTRAINT adopter_number_range CHECK (adopter_number >= 1 AND adopter_number <= 500),
  CONSTRAINT early_adopter_has_number CHECK (
    (adopter_status = 'early_adopter' AND adopter_number IS NOT NULL) OR
    (adopter_status = 'regular' AND adopter_number IS NULL)
  )
);

-- Indexes for performance
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_tier ON subscriptions(tier); -- Fast tier checks for RLS
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_stripe_subscription ON subscriptions(stripe_subscription_id);

-- ============================================================================
-- EARLY ADOPTER COUNTER TABLE
-- ============================================================================
-- Purpose: Atomic counter for "first 500" early adopter pricing
-- Note: Single-row table with CHECK constraint, uses SELECT FOR UPDATE lock
-- ============================================================================

CREATE TABLE early_adopter_counter (
  id INTEGER PRIMARY KEY DEFAULT 1,
  count INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT single_row CHECK (id = 1),
  CONSTRAINT max_count CHECK (count <= 500)
);

-- Initialize the counter
INSERT INTO early_adopter_counter (id, count) VALUES (1, 0);

-- ============================================================================
-- ISO_OBJECTS TABLE
-- ============================================================================
-- Purpose: Interstellar objects catalog (sourced from NASA API)
-- Note: Public read access for SEO, updated via background job
-- ============================================================================

CREATE TABLE iso_objects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- NASA data
  nasa_id TEXT UNIQUE NOT NULL, -- External ID from NASA API
  name TEXT NOT NULL,
  designation TEXT,
  discovery_date DATE,

  -- Physical properties
  absolute_magnitude NUMERIC(5,2),
  diameter_km NUMERIC(10,2),
  perihelion_au NUMERIC(10,4),
  aphelion_au NUMERIC(10,4),
  orbital_period_years NUMERIC(10,2),

  -- Classification
  object_type TEXT, -- 'asteroid', 'comet', 'interstellar', etc.
  is_potentially_hazardous BOOLEAN DEFAULT FALSE,

  -- Metadata
  description TEXT,
  data_source TEXT DEFAULT 'NASA JPL',
  last_observation_date DATE,

  -- Denormalized stats for performance
  argument_count INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT name_not_empty CHECK (char_length(name) > 0)
);

-- Indexes
CREATE INDEX idx_iso_objects_nasa_id ON iso_objects(nasa_id);
CREATE INDEX idx_iso_objects_name ON iso_objects(name);
CREATE INDEX idx_iso_objects_discovery_date ON iso_objects(discovery_date);
CREATE INDEX idx_iso_objects_type ON iso_objects(object_type);

-- ============================================================================
-- ARGUMENTS TABLE
-- ============================================================================
-- Purpose: Community debate posts about ISO objects
-- Note: Any authenticated user can post, voting requires Event Pass tier
-- ============================================================================

CREATE TABLE arguments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  iso_object_id UUID NOT NULL REFERENCES iso_objects(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Content
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  stance TEXT NOT NULL, -- 'natural', 'artificial', 'unknown'

  -- Denormalized vote counts for performance
  upvote_count INTEGER NOT NULL DEFAULT 0,
  downvote_count INTEGER NOT NULL DEFAULT 0,
  vote_score INTEGER NOT NULL DEFAULT 0, -- upvotes - downvotes

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT title_length CHECK (char_length(title) >= 5 AND char_length(title) <= 200),
  CONSTRAINT content_length CHECK (char_length(content) >= 10 AND char_length(content) <= 10000),
  CONSTRAINT valid_stance CHECK (stance IN ('natural', 'artificial', 'unknown'))
);

-- Indexes
CREATE INDEX idx_arguments_iso_object ON arguments(iso_object_id);
CREATE INDEX idx_arguments_author ON arguments(author_id);
CREATE INDEX idx_arguments_vote_score ON arguments(vote_score DESC); -- Hot ranking
CREATE INDEX idx_arguments_created_at ON arguments(created_at DESC); -- New posts

-- ============================================================================
-- VOTES TABLE
-- ============================================================================
-- Purpose: User votes on arguments (requires Event Pass or Evidence Analyst tier)
-- Note: One vote per user per argument, updates denormalized counts via trigger
-- ============================================================================

CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  argument_id UUID NOT NULL REFERENCES arguments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Vote direction
  vote_type TEXT NOT NULL, -- 'upvote' or 'downvote'

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT one_vote_per_user_per_argument UNIQUE(argument_id, user_id),
  CONSTRAINT valid_vote_type CHECK (vote_type IN ('upvote', 'downvote'))
);

-- Indexes
CREATE INDEX idx_votes_argument ON votes(argument_id);
CREATE INDEX idx_votes_user ON votes(user_id);

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------

-- ============================================================================
-- PROFILES RLS
-- ============================================================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Public: Read all profiles (for author attribution)
CREATE POLICY "profiles_select_public" ON profiles
  FOR SELECT
  USING (true);

-- Users: Update own profile only
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- System: Insert new profiles (triggered by auth.users creation)
CREATE POLICY "profiles_insert_system" ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- SUBSCRIPTIONS RLS
-- ============================================================================

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users: Read own subscription only
CREATE POLICY "subscriptions_select_own" ON subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- System: Insert/update via Stripe webhook handler (no user context)
-- Note: These policies use service_role key, bypassing RLS
-- Users cannot directly insert/update subscriptions

-- ============================================================================
-- EARLY_ADOPTER_COUNTER RLS
-- ============================================================================

-- Enable RLS
ALTER TABLE early_adopter_counter ENABLE ROW LEVEL SECURITY;

-- System only: No direct user access
-- Accessed via claim_early_adopter_number() function

-- ============================================================================
-- ISO_OBJECTS RLS
-- ============================================================================

-- Enable RLS
ALTER TABLE iso_objects ENABLE ROW LEVEL SECURITY;

-- Public: Read all objects (SEO benefit, public catalog)
CREATE POLICY "iso_objects_select_public" ON iso_objects
  FOR SELECT
  USING (true);

-- System: Insert/update via NASA sync job (service_role key)
-- Users cannot directly insert/update objects

-- ============================================================================
-- ARGUMENTS RLS
-- ============================================================================

-- Enable RLS
ALTER TABLE arguments ENABLE ROW LEVEL SECURITY;

-- Public: Read all arguments
CREATE POLICY "arguments_select_public" ON arguments
  FOR SELECT
  USING (true);

-- Authenticated users: Create arguments (any tier)
CREATE POLICY "arguments_insert_authenticated" ON arguments
  FOR INSERT
  WITH CHECK (
    auth.uid() = author_id
    AND auth.uid() IS NOT NULL
  );

-- Authors: Update own arguments only
CREATE POLICY "arguments_update_own" ON arguments
  FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Authors: Delete own arguments only
CREATE POLICY "arguments_delete_own" ON arguments
  FOR DELETE
  USING (auth.uid() = author_id);

-- ============================================================================
-- VOTES RLS
-- ============================================================================

-- Enable RLS
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Users: Read own votes only
CREATE POLICY "votes_select_own" ON votes
  FOR SELECT
  USING (auth.uid() = user_id);

-- Event Pass or Evidence Analyst: Create votes
CREATE POLICY "votes_insert_paid_tiers" ON votes
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM subscriptions
      WHERE subscriptions.user_id = auth.uid()
      AND subscriptions.status = 'active'
      AND subscriptions.tier IN ('event_pass', 'evidence_analyst')
    )
  );

-- Users: Update own votes only (change upvote to downvote, etc.)
CREATE POLICY "votes_update_own" ON votes
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users: Delete own votes only
CREATE POLICY "votes_delete_own" ON votes
  FOR DELETE
  USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- FUNCTIONS
-- ----------------------------------------------------------------------------

-- ============================================================================
-- CLAIM EARLY ADOPTER NUMBER
-- ============================================================================
-- Purpose: Atomically claim an early adopter slot (1-500)
-- Returns: Adopter number (1-500) or NULL if all slots claimed
-- Security: Uses SELECT FOR UPDATE to prevent race conditions
-- ============================================================================

CREATE OR REPLACE FUNCTION claim_early_adopter_number()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER -- Run with elevated privileges
AS $$
DECLARE
  adopter_num INTEGER;
BEGIN
  -- Lock the counter row for update (prevents race conditions)
  SELECT count INTO adopter_num
  FROM early_adopter_counter
  WHERE id = 1
  FOR UPDATE;

  -- Check if slots available
  IF adopter_num >= 500 THEN
    RETURN NULL; -- No slots remaining
  END IF;

  -- Increment counter
  UPDATE early_adopter_counter
  SET count = count + 1,
      updated_at = NOW()
  WHERE id = 1;

  -- Return the claimed number
  RETURN adopter_num + 1;
END;
$$;

-- ============================================================================
-- UPDATE ARGUMENT VOTE COUNTS
-- ============================================================================
-- Purpose: Maintain denormalized vote counts on arguments table
-- Trigger: After INSERT, UPDATE, DELETE on votes
-- Security: Runs as trigger, no direct user access
-- ============================================================================

CREATE OR REPLACE FUNCTION update_argument_vote_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  arg_id UUID;
BEGIN
  -- Determine which argument to update
  IF TG_OP = 'DELETE' THEN
    arg_id := OLD.argument_id;
  ELSE
    arg_id := NEW.argument_id;
  END IF;

  -- Recalculate vote counts
  UPDATE arguments
  SET
    upvote_count = (
      SELECT COUNT(*) FROM votes
      WHERE votes.argument_id = arg_id
      AND votes.vote_type = 'upvote'
    ),
    downvote_count = (
      SELECT COUNT(*) FROM votes
      WHERE votes.argument_id = arg_id
      AND votes.vote_type = 'downvote'
    ),
    vote_score = (
      SELECT COUNT(*) FILTER (WHERE vote_type = 'upvote')
           - COUNT(*) FILTER (WHERE vote_type = 'downvote')
      FROM votes
      WHERE votes.argument_id = arg_id
    ),
    updated_at = NOW()
  WHERE id = arg_id;

  RETURN NULL;
END;
$$;

-- ============================================================================
-- UPDATE ISO OBJECT ARGUMENT COUNTS
-- ============================================================================
-- Purpose: Maintain denormalized argument counts on iso_objects table
-- Trigger: After INSERT, DELETE on arguments
-- Security: Runs as trigger, no direct user access
-- ============================================================================

CREATE OR REPLACE FUNCTION update_iso_object_argument_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  obj_id UUID;
BEGIN
  -- Determine which object to update
  IF TG_OP = 'DELETE' THEN
    obj_id := OLD.iso_object_id;
  ELSE
    obj_id := NEW.iso_object_id;
  END IF;

  -- Recalculate argument count
  UPDATE iso_objects
  SET
    argument_count = (
      SELECT COUNT(*) FROM arguments
      WHERE arguments.iso_object_id = obj_id
    ),
    updated_at = NOW()
  WHERE id = obj_id;

  RETURN NULL;
END;
$$;

-- ----------------------------------------------------------------------------
-- TRIGGERS
-- ----------------------------------------------------------------------------

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================
-- Purpose: Automatically update updated_at timestamp on row changes
-- ============================================================================

-- Generic trigger function for updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply to all tables with updated_at column
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER early_adopter_counter_updated_at BEFORE UPDATE ON early_adopter_counter
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER iso_objects_updated_at BEFORE UPDATE ON iso_objects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER arguments_updated_at BEFORE UPDATE ON arguments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER votes_updated_at BEFORE UPDATE ON votes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VOTE COUNT TRIGGERS
-- ============================================================================
-- Purpose: Keep denormalized vote counts in sync with votes table
-- ============================================================================

CREATE TRIGGER votes_update_counts_after_insert
  AFTER INSERT ON votes
  FOR EACH ROW EXECUTE FUNCTION update_argument_vote_counts();

CREATE TRIGGER votes_update_counts_after_update
  AFTER UPDATE ON votes
  FOR EACH ROW EXECUTE FUNCTION update_argument_vote_counts();

CREATE TRIGGER votes_update_counts_after_delete
  AFTER DELETE ON votes
  FOR EACH ROW EXECUTE FUNCTION update_argument_vote_counts();

-- ============================================================================
-- ARGUMENT COUNT TRIGGERS
-- ============================================================================
-- Purpose: Keep denormalized argument counts in sync with arguments table
-- ============================================================================

CREATE TRIGGER arguments_update_counts_after_insert
  AFTER INSERT ON arguments
  FOR EACH ROW EXECUTE FUNCTION update_iso_object_argument_count();

CREATE TRIGGER arguments_update_counts_after_delete
  AFTER DELETE ON arguments
  FOR EACH ROW EXECUTE FUNCTION update_iso_object_argument_count();

-- ----------------------------------------------------------------------------
-- INDEXES FOR COMMON QUERIES
-- ----------------------------------------------------------------------------

-- Hot/trending arguments (vote_score + recency)
CREATE INDEX idx_arguments_hot_ranking ON arguments(vote_score DESC, created_at DESC);

-- User's subscription tier lookup (most common query)
CREATE INDEX idx_subscriptions_user_tier ON subscriptions(user_id, tier, status);

-- Active subscriptions by tier (for analytics)
CREATE INDEX idx_subscriptions_active_tier ON subscriptions(tier, status)
  WHERE status = 'active';

-- ----------------------------------------------------------------------------
-- COMMENTS FOR DOCUMENTATION
-- ----------------------------------------------------------------------------

COMMENT ON TABLE profiles IS 'User profile information extending Supabase auth.users';
COMMENT ON TABLE subscriptions IS 'User subscription tier tracking with Stripe integration';
COMMENT ON TABLE early_adopter_counter IS 'Atomic counter for first 500 early adopter pricing';
COMMENT ON TABLE iso_objects IS 'Interstellar objects catalog from NASA API';
COMMENT ON TABLE arguments IS 'Community debate posts about ISO objects';
COMMENT ON TABLE votes IS 'User votes on arguments (Event Pass tier and above)';

COMMENT ON FUNCTION claim_early_adopter_number() IS 'Atomically claim early adopter slot (1-500), returns NULL if full';
COMMENT ON FUNCTION update_argument_vote_counts() IS 'Maintain denormalized vote counts on arguments';
COMMENT ON FUNCTION update_iso_object_argument_count() IS 'Maintain denormalized argument counts on iso_objects';

-- ============================================================================
-- SCHEMA COMPLETE
-- ============================================================================
-- To apply this schema:
-- 1. Copy entire file contents
-- 2. Open Supabase Dashboard → SQL Editor
-- 3. Paste and run
-- 4. Verify all tables created with: SELECT * FROM pg_tables WHERE schemaname = 'public';
-- 5. Verify RLS enabled with: SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
-- ============================================================================
