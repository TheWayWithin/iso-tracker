-- ============================================================================
-- Migration: 017_arguments_system.sql
-- Sprint 11: Community Arguments & Debate System
--
-- Purpose: Enable community-driven scientific debate around ISO classification
-- with structured arguments (artificial/natural/uncertain stances), voting system,
-- and proper RLS for tier-based access control.
--
-- Dependencies:
--   - iso_objects table
--   - auth.users table
--   - check_tier() function from existing migrations
--
-- Security Model:
--   - Arguments: All authenticated users can read and submit
--   - Voting: Event Pass+ tier required (check_tier validation)
--   - Update/Delete: Only own records
-- ============================================================================

-- ============================================================================
-- SECTION 1: ARGUMENTS TABLE
-- Core table for community arguments about ISO classification
-- ============================================================================

CREATE TABLE IF NOT EXISTS arguments (
    -- Primary identifier
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Foreign keys
    iso_object_id UUID NOT NULL REFERENCES iso_objects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Argument content
    -- stance: The user's position on the ISO's origin
    -- - 'artificial': Believes the object is artificial/engineered
    -- - 'natural': Believes the object is natural/astrophysical
    -- - 'uncertain': Cannot determine, presents balanced analysis
    stance TEXT NOT NULL CHECK (stance IN ('artificial', 'natural', 'uncertain')),

    -- title: Brief summary of the argument (3-200 chars)
    title VARCHAR(200) NOT NULL CHECK (length(title) >= 3),

    -- content: Full argument text (10-2000 chars)
    -- Minimum ensures substantive contribution, maximum prevents walls of text
    content TEXT NOT NULL CHECK (length(content) >= 10 AND length(content) <= 2000),

    -- Denormalized vote counts for performance
    -- Updated via triggers on argument_votes table
    -- Avoids expensive COUNT queries on every page load
    upvotes_count INTEGER NOT NULL DEFAULT 0 CHECK (upvotes_count >= 0),
    downvotes_count INTEGER NOT NULL DEFAULT 0 CHECK (downvotes_count >= 0),

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Soft delete support (pattern from existing migrations)
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Add comments for documentation
COMMENT ON TABLE arguments IS 'Community arguments for/against artificial origin of ISO objects';
COMMENT ON COLUMN arguments.stance IS 'User position: artificial (engineered), natural (astrophysical), or uncertain';
COMMENT ON COLUMN arguments.upvotes_count IS 'Denormalized count - updated by trigger on argument_votes';
COMMENT ON COLUMN arguments.downvotes_count IS 'Denormalized count - updated by trigger on argument_votes';

-- ============================================================================
-- SECTION 2: ARGUMENTS INDEXES
-- Optimized for common query patterns
-- ============================================================================

-- Primary lookup: Get all arguments for an ISO object
CREATE INDEX IF NOT EXISTS idx_arguments_iso_object_id
    ON arguments(iso_object_id)
    WHERE deleted_at IS NULL;

-- User's arguments: Profile page, "my arguments" feature
CREATE INDEX IF NOT EXISTS idx_arguments_user_id
    ON arguments(user_id)
    WHERE deleted_at IS NULL;

-- Timeline view: Recent arguments across platform
CREATE INDEX IF NOT EXISTS idx_arguments_created_at
    ON arguments(created_at DESC)
    WHERE deleted_at IS NULL;

-- Composite: Arguments for ISO sorted by recency (common query)
CREATE INDEX IF NOT EXISTS idx_arguments_iso_created
    ON arguments(iso_object_id, created_at DESC)
    WHERE deleted_at IS NULL;

-- Stance filtering: "Show only artificial stance arguments"
CREATE INDEX IF NOT EXISTS idx_arguments_stance
    ON arguments(stance)
    WHERE deleted_at IS NULL;

-- ============================================================================
-- SECTION 3: ARGUMENT_VOTES TABLE
-- Voting system with one vote per user per argument
-- ============================================================================

CREATE TABLE IF NOT EXISTS argument_votes (
    -- Primary identifier
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Foreign keys
    argument_id UUID NOT NULL REFERENCES arguments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Vote type
    -- upvote: Supports this argument's reasoning
    -- downvote: Disagrees with this argument's reasoning
    vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Enforce one vote per user per argument
    -- Users can change their vote (update) but not have multiple votes
    UNIQUE(argument_id, user_id)
);

-- Add comments for documentation
COMMENT ON TABLE argument_votes IS 'User votes on arguments - one vote per user per argument';
COMMENT ON COLUMN argument_votes.vote_type IS 'upvote (supports reasoning) or downvote (disagrees with reasoning)';

-- ============================================================================
-- SECTION 4: ARGUMENT_VOTES INDEXES
-- ============================================================================

-- Lookup votes for an argument (to show who voted)
CREATE INDEX IF NOT EXISTS idx_argument_votes_argument_id
    ON argument_votes(argument_id);

-- User's voting history
CREATE INDEX IF NOT EXISTS idx_argument_votes_user_id
    ON argument_votes(user_id);

-- ============================================================================
-- SECTION 5: TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- 5.1: Update updated_at timestamp on arguments
CREATE OR REPLACE FUNCTION update_arguments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_arguments_updated_at ON arguments;
CREATE TRIGGER trigger_arguments_updated_at
    BEFORE UPDATE ON arguments
    FOR EACH ROW
    EXECUTE FUNCTION update_arguments_updated_at();

-- 5.2: Update updated_at timestamp on argument_votes
CREATE OR REPLACE FUNCTION update_argument_votes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_argument_votes_updated_at ON argument_votes;
CREATE TRIGGER trigger_argument_votes_updated_at
    BEFORE UPDATE ON argument_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_argument_votes_updated_at();

-- 5.3: Update denormalized vote counts on arguments table
-- This function handles INSERT, UPDATE, and DELETE on argument_votes
CREATE OR REPLACE FUNCTION update_argument_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle DELETE: Decrement the appropriate counter
    IF TG_OP = 'DELETE' THEN
        IF OLD.vote_type = 'upvote' THEN
            UPDATE arguments
            SET upvotes_count = GREATEST(upvotes_count - 1, 0)
            WHERE id = OLD.argument_id;
        ELSE
            UPDATE arguments
            SET downvotes_count = GREATEST(downvotes_count - 1, 0)
            WHERE id = OLD.argument_id;
        END IF;
        RETURN OLD;
    END IF;

    -- Handle INSERT: Increment the appropriate counter
    IF TG_OP = 'INSERT' THEN
        IF NEW.vote_type = 'upvote' THEN
            UPDATE arguments
            SET upvotes_count = upvotes_count + 1
            WHERE id = NEW.argument_id;
        ELSE
            UPDATE arguments
            SET downvotes_count = downvotes_count + 1
            WHERE id = NEW.argument_id;
        END IF;
        RETURN NEW;
    END IF;

    -- Handle UPDATE (vote type changed): Adjust both counters
    IF TG_OP = 'UPDATE' AND OLD.vote_type != NEW.vote_type THEN
        IF OLD.vote_type = 'upvote' THEN
            -- Changed from upvote to downvote
            UPDATE arguments
            SET upvotes_count = GREATEST(upvotes_count - 1, 0),
                downvotes_count = downvotes_count + 1
            WHERE id = NEW.argument_id;
        ELSE
            -- Changed from downvote to upvote
            UPDATE arguments
            SET downvotes_count = GREATEST(downvotes_count - 1, 0),
                upvotes_count = upvotes_count + 1
            WHERE id = NEW.argument_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_argument_votes_count ON argument_votes;
CREATE TRIGGER trigger_argument_votes_count
    AFTER INSERT OR UPDATE OR DELETE ON argument_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_argument_vote_counts();

-- ============================================================================
-- SECTION 6: ROW LEVEL SECURITY (RLS)
-- Security model aligned with tier-based access control
-- ============================================================================

-- Enable RLS on both tables
ALTER TABLE arguments ENABLE ROW LEVEL SECURITY;
ALTER TABLE argument_votes ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 6.1: ARGUMENTS TABLE POLICIES
-- ----------------------------------------------------------------------------

-- SELECT: All authenticated users can read non-deleted arguments
DROP POLICY IF EXISTS "arguments_select_authenticated" ON arguments;
CREATE POLICY "arguments_select_authenticated" ON arguments
    FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL);

-- INSERT: All authenticated users can submit arguments (free tier included)
DROP POLICY IF EXISTS "arguments_insert_authenticated" ON arguments;
CREATE POLICY "arguments_insert_authenticated" ON arguments
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id
    );

-- UPDATE: Users can only update their own arguments
DROP POLICY IF EXISTS "arguments_update_own" ON arguments;
CREATE POLICY "arguments_update_own" ON arguments
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id AND deleted_at IS NULL)
    WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can only delete (soft delete) their own arguments
DROP POLICY IF EXISTS "arguments_delete_own" ON arguments;
CREATE POLICY "arguments_delete_own" ON arguments
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 6.2: ARGUMENT_VOTES TABLE POLICIES
-- ----------------------------------------------------------------------------

-- SELECT: All authenticated users can see votes (for UI indicators)
DROP POLICY IF EXISTS "argument_votes_select_authenticated" ON argument_votes;
CREATE POLICY "argument_votes_select_authenticated" ON argument_votes
    FOR SELECT
    TO authenticated
    USING (true);

-- INSERT: Event Pass+ tier required for voting
-- Uses check_tier function from existing migrations
DROP POLICY IF EXISTS "argument_votes_insert_tier" ON argument_votes;
CREATE POLICY "argument_votes_insert_tier" ON argument_votes
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id
        AND check_tier(auth.uid(), 'event_pass')
    );

-- UPDATE: Users can change their own vote (upvote <-> downvote)
DROP POLICY IF EXISTS "argument_votes_update_own" ON argument_votes;
CREATE POLICY "argument_votes_update_own" ON argument_votes
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can remove their own vote
DROP POLICY IF EXISTS "argument_votes_delete_own" ON argument_votes;
CREATE POLICY "argument_votes_delete_own" ON argument_votes
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- ============================================================================
-- SECTION 7: HELPER FUNCTIONS
-- ============================================================================

-- 7.1: Get user's vote on a specific argument (for UI state)
CREATE OR REPLACE FUNCTION get_user_argument_vote(
    p_argument_id UUID,
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS TEXT AS $$
    SELECT vote_type
    FROM argument_votes
    WHERE argument_id = p_argument_id
    AND user_id = p_user_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_user_argument_vote IS 'Returns upvote, downvote, or NULL for user vote on an argument';

-- 7.2: Get argument statistics for an ISO object
CREATE OR REPLACE FUNCTION get_iso_argument_stats(p_iso_object_id UUID)
RETURNS TABLE (
    total_arguments BIGINT,
    artificial_count BIGINT,
    natural_count BIGINT,
    uncertain_count BIGINT,
    total_votes BIGINT
) AS $$
    SELECT
        COUNT(*) as total_arguments,
        COUNT(*) FILTER (WHERE stance = 'artificial') as artificial_count,
        COUNT(*) FILTER (WHERE stance = 'natural') as natural_count,
        COUNT(*) FILTER (WHERE stance = 'uncertain') as uncertain_count,
        COALESCE(SUM(upvotes_count + downvotes_count), 0) as total_votes
    FROM arguments
    WHERE iso_object_id = p_iso_object_id
    AND deleted_at IS NULL;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_iso_argument_stats IS 'Returns aggregated argument statistics for an ISO object';

-- ============================================================================
-- SECTION 8: GRANTS
-- ============================================================================

-- Grant execute on helper functions to authenticated users
GRANT EXECUTE ON FUNCTION get_user_argument_vote TO authenticated;
GRANT EXECUTE ON FUNCTION get_iso_argument_stats TO authenticated;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
