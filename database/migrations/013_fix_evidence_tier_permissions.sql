-- =====================================================
-- Migration 013: Fix Evidence Submission Tier Permissions
-- =====================================================
-- Purpose: Restrict evidence submission to Evidence Analyst tier only
-- Rationale: PRD specifies Event Pass is VIEW-ONLY on evidence framework
--            Evidence submission is the core value of Evidence Analyst tier ($19/mo)
--
-- Previous (INCORRECT): Event Pass ($4.99) could submit evidence
-- Corrected (PRD-ALIGNED): Only Evidence Analyst ($19) can submit evidence
-- =====================================================

-- Drop the incorrect policy
DROP POLICY IF EXISTS "evidence_insert_policy" ON evidence;

-- Create corrected policy: Evidence Analyst tier required for submission
CREATE POLICY "evidence_insert_policy" ON evidence
  FOR INSERT
  TO authenticated
  WITH CHECK (
    check_tier(auth.uid(), 'evidence_analyst')
    AND submitter_id = auth.uid()
  );

-- Add comment explaining the business logic
COMMENT ON POLICY "evidence_insert_policy" ON evidence IS
  'Only Evidence Analyst tier ($19/mo) can submit evidence. Event Pass ($4.99) has VIEW-ONLY access. This is the core value proposition for the premium tier - PRD Section 4.1 lines 220-224.';
