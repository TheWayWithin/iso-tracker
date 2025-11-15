-- =====================================================
-- Evidence Framework Database Schema (Sprint 3)
-- =====================================================
-- Purpose: Add scientific evidence system alongside existing community arguments
-- Strategy: Parallel systems - arguments (community) + evidence (scientific)
-- PRD Alignment: Section 4.1 - Evidence-Based Analysis Framework
--
-- SYSTEM ARCHITECTURE:
-- 1. arguments table = Community Sentiment (user opinions, simple votes)
-- 2. evidence table = Scientific Evidence (structured data, quality scores)
-- 3. Consensus shows BOTH: Community Sentiment vs Scientific Consensus
--
-- CORRECTED FOR EXISTING SCHEMA:
-- - Uses existing iso_objects table (not "isos")
-- - Uses existing subscriptions.tier (not profiles.tier)
-- - Parallel to existing arguments/votes system
-- =====================================================

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function: Check user tier from subscriptions table
-- Purpose: Centralized tier validation for RLS policies
-- Returns: TRUE if user meets or exceeds required tier
CREATE OR REPLACE FUNCTION check_tier(user_id UUID, required_tier TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_tier TEXT;
BEGIN
  -- Get user's current tier from subscriptions table (existing schema)
  SELECT tier::TEXT INTO user_tier
  FROM subscriptions
  WHERE user_id = check_tier.user_id
    AND status = 'active';

  -- If no active subscription, default to guest
  IF user_tier IS NULL THEN
    user_tier := 'guest';
  END IF;

  -- Tier hierarchy: guest < event_pass < evidence_analyst
  CASE required_tier
    WHEN 'guest' THEN
      RETURN user_tier IN ('guest', 'event_pass', 'evidence_analyst');
    WHEN 'event_pass' THEN
      RETURN user_tier IN ('event_pass', 'evidence_analyst');
    WHEN 'evidence_analyst' THEN
      RETURN user_tier = 'evidence_analyst';
    ELSE
      RETURN FALSE;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- EVIDENCE TABLE (Scientific Evidence System)
-- =====================================================
-- Purpose: Store scientific evidence submissions for ISOs
-- Parallel to: arguments table (community opinions)
-- Security: RLS policies enforce tier-based access
-- Performance: Indexes on iso_object_id, submitter_id, created_at
-- =====================================================

CREATE TABLE IF NOT EXISTS evidence (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Foreign keys (CORRECTED: uses existing iso_objects table)
  iso_object_id UUID NOT NULL REFERENCES iso_objects(id) ON DELETE CASCADE,
  submitter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Evidence metadata
  evidence_type TEXT NOT NULL CHECK (evidence_type IN (
    'observation',      -- Direct measurements (highest confidence)
    'spectroscopy',     -- Light spectrum analysis
    'astrometry',       -- Position and motion measurements
    'photometry',       -- Brightness measurements
    'radar',            -- Radar observations
    'theoretical',      -- Mathematical models
    'simulation',       -- Computer simulations
    'literature',       -- Peer-reviewed papers
    'other'
  )),

  -- Evidence content
  title TEXT NOT NULL CHECK (char_length(title) >= 3 AND char_length(title) <= 200),
  description TEXT NOT NULL CHECK (char_length(description) >= 10),
  methodology TEXT NOT NULL CHECK (char_length(methodology) >= 10),
  source_url TEXT CHECK (source_url ~ '^https?://.*' OR source_url IS NULL),

  -- Quality scoring (auto-calculated via trigger)
  quality_score INTEGER NOT NULL DEFAULT 0 CHECK (quality_score >= 0 AND quality_score <= 100),

  -- Audit trail
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  -- Prevent duplicate evidence titles per ISO
  CONSTRAINT evidence_iso_title_unique UNIQUE (iso_object_id, title)
);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_evidence_iso_object ON evidence(iso_object_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_evidence_submitter ON evidence(submitter_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_evidence_created_at ON evidence(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_evidence_quality_score ON evidence(quality_score DESC) WHERE deleted_at IS NULL;

-- Enable RLS
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;

-- RLS Policy: All authenticated users can view non-deleted evidence
CREATE POLICY "evidence_select_policy" ON evidence
  FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

-- RLS Policy: Only Event Pass tier or higher can insert
CREATE POLICY "evidence_insert_policy" ON evidence
  FOR INSERT
  TO authenticated
  WITH CHECK (
    check_tier(auth.uid(), 'event_pass')
    AND submitter_id = auth.uid()
  );

-- RLS Policy: Only submitter OR Evidence Analyst can update
CREATE POLICY "evidence_update_policy" ON evidence
  FOR UPDATE
  TO authenticated
  USING (
    submitter_id = auth.uid()
    OR check_tier(auth.uid(), 'evidence_analyst')
  )
  WITH CHECK (
    submitter_id = auth.uid()
    OR check_tier(auth.uid(), 'evidence_analyst')
  );

-- RLS Policy: Only submitter can soft-delete (sets deleted_at)
CREATE POLICY "evidence_delete_policy" ON evidence
  FOR UPDATE
  TO authenticated
  USING (submitter_id = auth.uid() AND deleted_at IS NULL)
  WITH CHECK (submitter_id = auth.uid() AND deleted_at IS NOT NULL);

-- =====================================================
-- EVIDENCE ASSESSMENTS TABLE (Quality Scoring System)
-- =====================================================
-- Purpose: Store expert assessments of evidence quality
-- Parallel to: votes table (simple upvote/downvote)
-- Security: Only Evidence Analyst tier can assess
-- Performance: Indexes on evidence_id, assessor_id
-- =====================================================

CREATE TABLE IF NOT EXISTS evidence_assessments (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Foreign keys
  evidence_id UUID NOT NULL REFERENCES evidence(id) ON DELETE CASCADE,
  assessor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Quality scoring components (per PRD specification)
  expertise_score INTEGER NOT NULL CHECK (expertise_score IN (0, 20, 40)),
  methodology_score INTEGER NOT NULL CHECK (methodology_score >= 0 AND methodology_score <= 30),
  peer_review_score INTEGER NOT NULL CHECK (peer_review_score >= 0 AND peer_review_score <= 30),

  -- Computed overall score
  overall_score INTEGER GENERATED ALWAYS AS (
    expertise_score + methodology_score + peer_review_score
  ) STORED,

  -- Assessment notes
  notes TEXT,

  -- Audit trail
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  -- One assessment per assessor per evidence piece
  CONSTRAINT evidence_assessments_unique UNIQUE (evidence_id, assessor_id)
);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_assessments_evidence_id ON evidence_assessments(evidence_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_assessments_assessor_id ON evidence_assessments(assessor_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_assessments_created_at ON evidence_assessments(created_at DESC) WHERE deleted_at IS NULL;

-- Enable RLS
ALTER TABLE evidence_assessments ENABLE ROW LEVEL SECURITY;

-- RLS Policy: All authenticated users can view assessments
CREATE POLICY "assessments_select_policy" ON evidence_assessments
  FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

-- RLS Policy: Only Evidence Analyst tier can insert
CREATE POLICY "assessments_insert_policy" ON evidence_assessments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    check_tier(auth.uid(), 'evidence_analyst')
    AND assessor_id = auth.uid()
  );

-- RLS Policy: Only original assessor can update
CREATE POLICY "assessments_update_policy" ON evidence_assessments
  FOR UPDATE
  TO authenticated
  USING (assessor_id = auth.uid())
  WITH CHECK (assessor_id = auth.uid());

-- RLS Policy: Only assessor can soft-delete
CREATE POLICY "assessments_delete_policy" ON evidence_assessments
  FOR UPDATE
  TO authenticated
  USING (assessor_id = auth.uid() AND deleted_at IS NULL)
  WITH CHECK (assessor_id = auth.uid() AND deleted_at IS NOT NULL);

-- =====================================================
-- QUALITY SCORE CALCULATION FUNCTION
-- =====================================================
-- Purpose: Calculate evidence quality score per PRD algorithm
-- Algorithm:
--   - Expertise Factor (0-40): Based on submitter tier
--   - Methodology Factor (0-30): AVG(methodology_score) from assessments
--   - Peer Review Factor (0-30): AVG(peer_review_score) from assessments
-- Trigger: Auto-update on assessment INSERT/UPDATE/DELETE
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_quality_score(p_evidence_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_expertise_score INTEGER := 0;
  v_methodology_avg NUMERIC := 0;
  v_peer_review_avg NUMERIC := 0;
  v_submitter_tier TEXT;
BEGIN
  -- Get submitter's tier from subscriptions (CORRECTED: uses existing schema)
  SELECT s.tier::TEXT INTO v_submitter_tier
  FROM evidence e
  JOIN subscriptions s ON e.submitter_id = s.user_id AND s.status = 'active'
  WHERE e.id = p_evidence_id;

  -- If no active subscription, default to guest
  IF v_submitter_tier IS NULL THEN
    v_submitter_tier := 'guest';
  END IF;

  -- Calculate expertise factor based on tier (per PRD)
  CASE v_submitter_tier
    WHEN 'event_pass' THEN
      v_expertise_score := 20;
    WHEN 'evidence_analyst' THEN
      v_expertise_score := 40;
    ELSE
      v_expertise_score := 0; -- Guest tier cannot submit (blocked by RLS)
  END CASE;

  -- Calculate average methodology and peer review scores from assessments
  SELECT
    COALESCE(AVG(methodology_score), 0),
    COALESCE(AVG(peer_review_score), 0)
  INTO v_methodology_avg, v_peer_review_avg
  FROM evidence_assessments
  WHERE evidence_id = p_evidence_id
    AND deleted_at IS NULL;

  -- Return total quality score (0-100)
  RETURN v_expertise_score + ROUND(v_methodology_avg)::INTEGER + ROUND(v_peer_review_avg)::INTEGER;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Update quality score on assessment changes
CREATE OR REPLACE FUNCTION update_evidence_quality_score()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the evidence quality score
  UPDATE evidence
  SET
    quality_score = calculate_quality_score(
      CASE
        WHEN TG_OP = 'DELETE' THEN OLD.evidence_id
        ELSE NEW.evidence_id
      END
    ),
    updated_at = NOW()
  WHERE id = CASE
    WHEN TG_OP = 'DELETE' THEN OLD.evidence_id
    ELSE NEW.evidence_id
  END;

  RETURN CASE
    WHEN TG_OP = 'DELETE' THEN OLD
    ELSE NEW
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for all assessment operations
DROP TRIGGER IF EXISTS trigger_update_quality_on_assessment_insert ON evidence_assessments;
CREATE TRIGGER trigger_update_quality_on_assessment_insert
  AFTER INSERT ON evidence_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_evidence_quality_score();

DROP TRIGGER IF EXISTS trigger_update_quality_on_assessment_update ON evidence_assessments;
CREATE TRIGGER trigger_update_quality_on_assessment_update
  AFTER UPDATE ON evidence_assessments
  FOR EACH ROW
  WHEN (OLD.methodology_score IS DISTINCT FROM NEW.methodology_score
        OR OLD.peer_review_score IS DISTINCT FROM NEW.peer_review_score
        OR OLD.deleted_at IS DISTINCT FROM NEW.deleted_at)
  EXECUTE FUNCTION update_evidence_quality_score();

DROP TRIGGER IF EXISTS trigger_update_quality_on_assessment_delete ON evidence_assessments;
CREATE TRIGGER trigger_update_quality_on_assessment_delete
  AFTER DELETE ON evidence_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_evidence_quality_score();

-- =====================================================
-- CONSENSUS SNAPSHOT MATERIALIZED VIEW
-- =====================================================
-- Purpose: Pre-calculate consensus metrics for <100ms queries
-- Shows: Community Sentiment (arguments) vs Scientific Consensus (evidence)
-- Refresh: CONCURRENTLY on assessment changes via trigger
-- Indexes: UNIQUE on iso_object_id for fast lookups
-- =====================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS consensus_snapshot AS
SELECT
  io.id AS iso_object_id,
  io.name AS iso_name,

  -- Community Sentiment (from arguments table - simple stance votes)
  COALESCE(
    (SELECT COUNT(*) FROM arguments WHERE iso_object_id = io.id AND stance = 'artificial')::NUMERIC /
    NULLIF((SELECT COUNT(*) FROM arguments WHERE iso_object_id = io.id), 0) * 100,
    0
  ) AS community_alien_pct,

  COALESCE(
    (SELECT COUNT(*) FROM arguments WHERE iso_object_id = io.id AND stance = 'natural')::NUMERIC /
    NULLIF((SELECT COUNT(*) FROM arguments WHERE iso_object_id = io.id), 0) * 100,
    0
  ) AS community_natural_pct,

  -- Scientific Consensus (from evidence assessments - Evidence Analyst tier only)
  COALESCE(AVG(ea_analyst.overall_score), 0) AS scientific_consensus,

  -- Evidence metrics
  COUNT(DISTINCT e.id) AS evidence_count,
  MAX(ea_all.created_at) AS last_assessment_at,

  -- Refresh tracking
  NOW() AS refreshed_at

FROM iso_objects io
LEFT JOIN evidence e ON e.iso_object_id = io.id AND e.deleted_at IS NULL
LEFT JOIN evidence_assessments ea_all ON ea_all.evidence_id = e.id AND ea_all.deleted_at IS NULL
LEFT JOIN evidence_assessments ea_analyst ON ea_analyst.evidence_id = e.id
  AND ea_analyst.deleted_at IS NULL
  AND EXISTS (
    SELECT 1 FROM subscriptions s
    WHERE s.user_id = ea_analyst.assessor_id
    AND s.tier = 'evidence_analyst'
    AND s.status = 'active'
  )
GROUP BY io.id, io.name;

-- Unique index for fast ISO lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_consensus_iso_object_id ON consensus_snapshot(iso_object_id);

-- Refresh function for materialized view
CREATE OR REPLACE FUNCTION refresh_consensus_snapshot()
RETURNS TRIGGER AS $$
BEGIN
  -- Refresh concurrently to avoid locking
  REFRESH MATERIALIZED VIEW CONCURRENTLY consensus_snapshot;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to refresh on assessment changes
DROP TRIGGER IF EXISTS trigger_refresh_consensus_on_assessment ON evidence_assessments;
CREATE TRIGGER trigger_refresh_consensus_on_assessment
  AFTER INSERT OR UPDATE OR DELETE ON evidence_assessments
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_consensus_snapshot();

-- =====================================================
-- RATE LIMITING SCHEMA (Phase 3.4 prep)
-- =====================================================
-- Purpose: Track submission counts for Event Pass tier (10/ISO limit)
-- Note: Evidence Analyst tier = unlimited (no log entry)
-- =====================================================

CREATE TABLE IF NOT EXISTS evidence_submissions_log (
  -- Composite primary key (user, iso, time window)
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  iso_object_id UUID NOT NULL REFERENCES iso_objects(id) ON DELETE CASCADE,
  window_start TIMESTAMPTZ NOT NULL,

  -- Submission tracking
  submission_count INTEGER NOT NULL DEFAULT 0 CHECK (submission_count >= 0),

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (user_id, iso_object_id, window_start)
);

-- Index for rate limit checks
CREATE INDEX IF NOT EXISTS idx_submissions_log_window ON evidence_submissions_log(user_id, iso_object_id, window_start);

-- Enable RLS (users can only see their own logs)
ALTER TABLE evidence_submissions_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "submissions_log_select_policy" ON evidence_submissions_log
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Function: Check submission rate limit
-- Returns: TRUE if user can submit (within limit or Evidence Analyst)
CREATE OR REPLACE FUNCTION check_submission_limit(p_user_id UUID, p_iso_object_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_tier TEXT;
  v_current_window TIMESTAMPTZ;
  v_submission_count INTEGER;
BEGIN
  -- Evidence Analyst tier has unlimited submissions
  SELECT tier::TEXT INTO v_tier
  FROM subscriptions
  WHERE user_id = p_user_id AND status = 'active';

  IF v_tier = 'evidence_analyst' THEN
    RETURN TRUE;
  END IF;

  -- Calculate current 1-hour window (floor to hour)
  v_current_window := date_trunc('hour', NOW());

  -- Get submission count for current window
  SELECT COALESCE(submission_count, 0) INTO v_submission_count
  FROM evidence_submissions_log
  WHERE user_id = p_user_id
    AND iso_object_id = p_iso_object_id
    AND window_start = v_current_window;

  -- Event Pass tier: 10 submissions per ISO per hour
  RETURN v_submission_count < 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Update submission log on evidence insert
CREATE OR REPLACE FUNCTION log_evidence_submission()
RETURNS TRIGGER AS $$
DECLARE
  v_current_window TIMESTAMPTZ;
  v_tier TEXT;
BEGIN
  -- Only log for Event Pass tier (Evidence Analyst = unlimited)
  SELECT tier::TEXT INTO v_tier
  FROM subscriptions
  WHERE user_id = NEW.submitter_id AND status = 'active';

  IF v_tier = 'evidence_analyst' THEN
    RETURN NEW;
  END IF;

  -- Calculate current 1-hour window
  v_current_window := date_trunc('hour', NOW());

  -- Upsert submission count
  INSERT INTO evidence_submissions_log (user_id, iso_object_id, window_start, submission_count)
  VALUES (NEW.submitter_id, NEW.iso_object_id, v_current_window, 1)
  ON CONFLICT (user_id, iso_object_id, window_start)
  DO UPDATE SET
    submission_count = evidence_submissions_log.submission_count + 1,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_log_evidence_submission ON evidence;
CREATE TRIGGER trigger_log_evidence_submission
  AFTER INSERT ON evidence
  FOR EACH ROW
  EXECUTE FUNCTION log_evidence_submission();

-- =====================================================
-- INITIAL DATA SETUP
-- =====================================================

-- Initial materialized view refresh
REFRESH MATERIALIZED VIEW consensus_snapshot;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
--
-- DELIVERABLES:
-- ✅ Evidence table with RLS policies (parallel to arguments)
-- ✅ Evidence assessments table with tier-based access (parallel to votes)
-- ✅ Quality score calculation function + triggers
-- ✅ Consensus snapshot materialized view (Community + Scientific)
-- ✅ Rate limiting schema for Phase 3.4
-- ✅ All indexes for <100ms query performance
-- ✅ Comprehensive security policies (defense in depth)
-- ✅ CORRECTED: Uses iso_objects table (existing)
-- ✅ CORRECTED: Uses subscriptions.tier (existing)
-- ✅ CORRECTED: Parallel systems (arguments + evidence)
--
-- NEXT STEPS FOR DEVELOPER:
-- 1. Deploy migration to Supabase
-- 2. Test RLS policies with different tier users
-- 3. Verify quality score calculations match PRD
-- 4. Load test consensus view queries (<100ms requirement)
-- 5. Implement API endpoints using this schema
-- =====================================================
