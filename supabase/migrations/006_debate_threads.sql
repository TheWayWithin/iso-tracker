-- ============================================================================
-- MIGRATION 006: DEBATE THREADS ON EVIDENCE
-- ============================================================================
-- Sprint 4 Phase 4.2: Threaded discussions system
-- PRD Reference: Section 4.3 "Debate System - Threaded Discussions"
--
-- USER DECISIONS CONFIRMED (2025-01-11):
-- 1. Comment editing: NO - Users cannot edit comments (maintains thread integrity)
-- 2. Comment deletion: NO - Users cannot delete comments (admin-only moderation)
-- 3. Comment counts: YES - Add comment_count to evidence table (performance optimization)
-- 4. Max nesting depth: 3 levels (UI enforcement, not database constraint)
--
-- REQUIREMENTS SUMMARY (from PRD Section 4.3):
-- - Evidence Analyst tier ($19/mo) can create threads and reply to comments
-- - Event Pass tier ($4.99/mo) can VIEW threads (read-only)
-- - Spectators (free tier) can VIEW threads (read-only)
-- - Nested replies support (parent-child comment structure)
-- - Input validation (HTML sanitization, profanity filtering at API layer)
-- - Soft delete support for moderation (Phase 4.4 admin UI)
--
-- TIER BOUNDARIES (from PRD Section 7):
-- - evidence_analyst: Can INSERT comments
-- - event_pass: Can SELECT comments (read-only)
-- - spectator: Can SELECT comments (read-only)
-- ============================================================================

-- ============================================================================
-- TABLE: evidence_comments
-- ============================================================================
-- PRD Section 4.3: "Enable threaded discussions on evidence entries"
-- Nested structure via self-referential parent_comment_id foreign key

CREATE TABLE IF NOT EXISTS evidence_comments (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  -- PRD Section 4.3: Comments linked to evidence entries
  evidence_id UUID NOT NULL REFERENCES evidence(id) ON DELETE CASCADE,

  -- PRD Section 4.3: Track comment authors (Evidence Analysts)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Nested Reply Structure
  -- PRD Section 4.3: Support threaded discussions with parent-child relationships
  -- NULL = top-level comment, non-NULL = reply to parent comment
  -- ON DELETE SET NULL preserves thread structure when parent deleted
  parent_comment_id UUID REFERENCES evidence_comments(id) ON DELETE SET NULL,

  -- Comment Content
  -- PRD Section 4.3: User-generated discussion content
  -- Validation: Min 10 chars, max 10000 chars (reasonable discussion length)
  -- HTML sanitization handled at API layer (not database trigger)
  content TEXT NOT NULL CHECK (char_length(content) >= 10 AND char_length(content) <= 10000),

  -- Soft Delete for Moderation
  -- PRD Section 4.4: Admin moderation can soft-delete inappropriate comments
  -- NULL = active, non-NULL = deleted (timestamp of deletion)
  -- Deleted comments show "[removed]" placeholder but preserve thread structure
  deleted_at TIMESTAMPTZ DEFAULT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES for Performance
-- ============================================================================
-- PRD Section 4.3: Efficient comment retrieval for evidence detail pages

-- Index: Lookup comments by evidence entry (most common query)
CREATE INDEX IF NOT EXISTS idx_evidence_comments_evidence_id
  ON evidence_comments(evidence_id, created_at DESC);

-- Index: Lookup comments by author (user profile page)
CREATE INDEX IF NOT EXISTS idx_evidence_comments_user_id
  ON evidence_comments(user_id, created_at DESC);

-- Index: Lookup replies by parent comment (nested thread retrieval)
CREATE INDEX IF NOT EXISTS idx_evidence_comments_parent_id
  ON evidence_comments(parent_comment_id, created_at ASC);

-- Index: Filter active vs deleted comments (moderation queries)
CREATE INDEX IF NOT EXISTS idx_evidence_comments_deleted_at
  ON evidence_comments(deleted_at) WHERE deleted_at IS NOT NULL;

-- ============================================================================
-- TRIGGERS: Updated Timestamp
-- ============================================================================
-- Auto-update updated_at timestamp on comment modification

CREATE OR REPLACE FUNCTION update_evidence_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_evidence_comments_updated_at ON evidence_comments;
CREATE TRIGGER trigger_evidence_comments_updated_at
  BEFORE UPDATE ON evidence_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_evidence_comments_updated_at();

-- ============================================================================
-- Comment Counts Denormalization (USER DECISION: YES)
-- ============================================================================
-- PRD Section 4.3: Display "X comments" on evidence cards/detail pages
-- Performance optimization: Denormalize comment_count for fast display
-- Similar pattern to vote counts (upvotes_count, downvotes_count)

ALTER TABLE evidence
  ADD COLUMN IF NOT EXISTS comment_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_evidence_comment_count
  ON evidence(comment_count DESC);

CREATE OR REPLACE FUNCTION update_evidence_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Only count non-deleted comments
    IF NEW.deleted_at IS NULL THEN
      UPDATE evidence
      SET comment_count = comment_count + 1
      WHERE id = NEW.evidence_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle soft delete (deleted_at changed from NULL to non-NULL)
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
      UPDATE evidence
      SET comment_count = comment_count - 1
      WHERE id = NEW.evidence_id;
    ELSIF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
      -- Handle undelete (unlikely but possible)
      UPDATE evidence
      SET comment_count = comment_count + 1
      WHERE id = NEW.evidence_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Only decrement if comment was active (not soft-deleted)
    IF OLD.deleted_at IS NULL THEN
      UPDATE evidence
      SET comment_count = comment_count - 1
      WHERE id = OLD.evidence_id;
    END IF;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_evidence_comment_count ON evidence_comments;
CREATE TRIGGER trigger_evidence_comment_count
  AFTER INSERT OR UPDATE OR DELETE ON evidence_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_evidence_comment_count();

-- ============================================================================
-- RLS POLICIES: Row-Level Security
-- ============================================================================
-- PRD Section 4.3: Tier-based access control for debate threads
-- PRD Section 7: Tier definitions and permissions

-- Enable RLS on evidence_comments table
ALTER TABLE evidence_comments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SELECT Policy: All authenticated users can view comments (read-only)
-- ============================================================================
-- PRD Section 4.3: "Event Pass and Spectators can VIEW threads"
-- PRD Section 7: All tiers (evidence_analyst, event_pass, spectator) can SELECT

DROP POLICY IF EXISTS select_evidence_comments_authenticated ON evidence_comments;
CREATE POLICY select_evidence_comments_authenticated
  ON evidence_comments
  FOR SELECT
  TO authenticated
  USING (true);  -- All authenticated users can view all comments (including soft-deleted)

-- Note: Soft-deleted comments show as "[removed]" in UI, but remain visible in thread structure
-- This prevents breaking nested reply chains when parent comments are moderated

-- ============================================================================
-- INSERT Policy: Only Evidence Analysts can create comments
-- ============================================================================
-- PRD Section 4.3: "Evidence Analyst tier enables threaded discussions"
-- PRD Section 7: evidence_analyst tier ($19/mo) can create threads and replies

DROP POLICY IF EXISTS insert_evidence_comments_analyst ON evidence_comments;
CREATE POLICY insert_evidence_comments_analyst
  ON evidence_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User must be comment author
    auth.uid() = user_id
    AND
    -- User must have active Evidence Analyst subscription
    EXISTS (
      SELECT 1 FROM subscriptions
      WHERE subscriptions.user_id = auth.uid()
        AND subscriptions.tier = 'evidence_analyst'
        AND subscriptions.status = 'active'
    )
  );

-- ============================================================================
-- UPDATE Policy: No user editing (USER DECISION: NO EDITING)
-- ============================================================================
-- USER DECISION: No editing (maintains thread integrity)
--
-- RATIONALE:
-- + Prevents abuse (users cannot change comment meaning after replies received)
-- + Maintains thread context integrity (replies reference original content)
-- + Simpler implementation (no complex timestamp checks or edit history)
-- - Users cannot fix typos (acceptable trade-off for debate integrity)
--
-- No UPDATE policy = editing blocked entirely

-- ============================================================================
-- DELETE Policy: No user deletion (USER DECISION: ADMIN-ONLY MODERATION)
-- ============================================================================
-- USER DECISION: No user deletion (admin moderation only via Phase 4.4)
--
-- RATIONALE:
-- + Prevents abuse (users cannot delete losing side of debate)
-- + Maintains thread structure (no broken reply chains)
-- + Admin-only moderation ensures consistent policy enforcement
-- - Users cannot remove their own comments (acceptable for debate integrity)
--
-- Soft delete mechanism:
-- - Admin can UPDATE evidence_comments SET deleted_at = NOW() via Phase 4.4 UI
-- - Deleted comments show "[removed]" placeholder but preserve thread structure

-- No DELETE policy = hard delete blocked
-- No UPDATE policy = users cannot soft-delete their own comments

-- ============================================================================
-- VALIDATION NOTES
-- ============================================================================
--
-- ✅ PRD Section 4.3 Requirements:
--    - Threaded discussions on evidence entries (evidence_comments table)
--    - Evidence Analyst can create/reply (INSERT policy with tier check)
--    - Event Pass/Spectators can view (SELECT policy for authenticated)
--    - Nested replies (parent_comment_id self-referential foreign key)
--    - Input validation (CHECK constraint for content length)
--    - Soft delete support (deleted_at column for moderation)
--
-- ✅ USER DECISIONS CONFIRMED:
--    1. Comment editing: NO - No UPDATE policy (users cannot edit comments)
--    2. Comment deletion: NO - No DELETE policy (admin-only moderation)
--    3. Comment counts: YES - comment_count column added with trigger maintenance
--    4. Max nesting depth: 3 levels (frontend enforcement, not database constraint)
--
-- ✅ Security-First Principles:
--    - RLS enabled on evidence_comments
--    - Defense in depth (tier check in INSERT policy)
--    - No direct DELETE (prevents thread structure breakage)
--    - Auth.uid() enforcement (users can only act on their own comments)
--
-- ✅ Schema Alignment:
--    - Foreign keys to evidence(id), auth.users(id)
--    - Consistent naming (evidence_comments, not comments)
--    - Timestamp pattern matches existing tables
--    - Index strategy for performance
--
-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE evidence_comments IS 'PRD 4.3: Threaded discussions on evidence. Evidence Analyst tier required to create/reply.';
COMMENT ON COLUMN evidence_comments.parent_comment_id IS 'Self-referential FK: NULL = top-level, non-NULL = reply to parent. ON DELETE SET NULL preserves thread structure.';
COMMENT ON COLUMN evidence_comments.content IS 'PRD 4.3: User-generated debate content. CHECK constraint: 10-10000 chars. HTML sanitization at API layer.';
COMMENT ON COLUMN evidence_comments.deleted_at IS 'Soft delete for moderation: NULL = active, non-NULL = deleted timestamp. Admin-only via Phase 4.4 UI.';
COMMENT ON COLUMN evidence.comment_count IS 'PRD 4.3: Denormalized count for performance (<100ms query time). Updated via trigger.';

-- ============================================================================
-- END MIGRATION
-- ============================================================================
