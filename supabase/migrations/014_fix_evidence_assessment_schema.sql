-- =====================================================
-- Migration 014: Fix Evidence Assessment Schema (PRD Alignment)
-- =====================================================
-- Purpose: Correct evidence assessment to use PRD-defined rubric + verdict
--
-- PRD Requirement: Two-step assessment process
-- Step 1: Quality Rubric (Chain of Custody, Witness Credibility, Technical Analysis)
-- Step 2: Verdict (alien/natural/uncertain) with Confidence (1-10)
--
-- Previous (INCORRECT):
-- - expertise_score (0, 20, 40) - wrong concept
-- - methodology_score (0-30) - wrong concept
-- - peer_review_score (0-30) - wrong concept
-- - Missing verdict and confidence
--
-- Corrected (PRD-ALIGNED):
-- - chain_of_custody_score (1-5)
-- - witness_credibility_score (1-5)
-- - technical_analysis_score (1-5)
-- - verdict (alien/natural/uncertain)
-- - confidence (1-10)
-- =====================================================

-- Step 1: Add new columns (PRD-aligned rubric + verdict)
ALTER TABLE evidence_assessments
ADD COLUMN IF NOT EXISTS chain_of_custody_score INTEGER CHECK (chain_of_custody_score >= 1 AND chain_of_custody_score <= 5),
ADD COLUMN IF NOT EXISTS witness_credibility_score INTEGER CHECK (witness_credibility_score >= 1 AND witness_credibility_score <= 5),
ADD COLUMN IF NOT EXISTS technical_analysis_score INTEGER CHECK (technical_analysis_score >= 1 AND technical_analysis_score <= 5),
ADD COLUMN IF NOT EXISTS verdict TEXT CHECK (verdict IN ('alien', 'natural', 'uncertain')),
ADD COLUMN IF NOT EXISTS confidence INTEGER CHECK (confidence >= 1 AND confidence <= 10);

-- Step 2: Migrate existing data (map old scores to new rubric)
-- Since old scores were 0-40 and 0-30, we need to scale them to 1-5
UPDATE evidence_assessments
SET
  -- Map expertise_score (0,20,40) → chain_of_custody_score (1-5): 0→1, 20→3, 40→5
  chain_of_custody_score = CASE
    WHEN expertise_score = 0 THEN 1
    WHEN expertise_score = 20 THEN 3
    WHEN expertise_score = 40 THEN 5
    ELSE 3
  END,
  -- Map methodology_score (0-30) → witness_credibility_score (1-5)
  witness_credibility_score = GREATEST(1, LEAST(5, ROUND(methodology_score / 6.0)::INTEGER)),
  -- Map peer_review_score (0-30) → technical_analysis_score (1-5)
  technical_analysis_score = GREATEST(1, LEAST(5, ROUND(peer_review_score / 6.0)::INTEGER)),
  -- Default verdict to 'uncertain' for existing assessments
  verdict = 'uncertain',
  -- Default confidence to 5 (middle of range) for existing assessments
  confidence = 5
WHERE chain_of_custody_score IS NULL;

-- Step 3: Make new columns required
ALTER TABLE evidence_assessments
ALTER COLUMN chain_of_custody_score SET NOT NULL,
ALTER COLUMN witness_credibility_score SET NOT NULL,
ALTER COLUMN technical_analysis_score SET NOT NULL,
ALTER COLUMN verdict SET NOT NULL,
ALTER COLUMN confidence SET NOT NULL;

-- Step 4: Drop old GENERATED column (can't modify it directly)
-- First, drop the old overall_score computed column
ALTER TABLE evidence_assessments DROP COLUMN IF EXISTS overall_score;

-- Step 5: Add new overall_score based on PRD rubric (1-5 scale × 3 = 3-15)
ALTER TABLE evidence_assessments
ADD COLUMN overall_score INTEGER GENERATED ALWAYS AS (
  chain_of_custody_score + witness_credibility_score + technical_analysis_score
) STORED;

-- Step 6: Drop old columns (no longer needed)
ALTER TABLE evidence_assessments
DROP COLUMN IF EXISTS expertise_score,
DROP COLUMN IF EXISTS methodology_score,
DROP COLUMN IF EXISTS peer_review_score;

-- Step 7: Update quality score calculation function to use new rubric
CREATE OR REPLACE FUNCTION calculate_evidence_quality_score(evidence_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  avg_chain NUMERIC;
  avg_witness NUMERIC;
  avg_technical NUMERIC;
  avg_overall NUMERIC;
  submitter_tier TEXT;
  tier_bonus INTEGER;
BEGIN
  -- Get average scores from all assessments
  SELECT
    AVG(chain_of_custody_score),
    AVG(witness_credibility_score),
    AVG(technical_analysis_score)
  INTO avg_chain, avg_witness, avg_technical
  FROM evidence_assessments
  WHERE evidence_id = evidence_uuid AND deleted_at IS NULL;

  -- If no assessments yet, return 0
  IF avg_chain IS NULL THEN
    RETURN 0;
  END IF;

  -- Calculate weighted score (each component 1-5, weighted to 0-100 scale)
  -- Each rubric category contributes equally: 100 / 3 = 33.33 points max per category
  -- Score of 5 = 33.33 points, Score of 1 = 6.67 points
  avg_overall := (
    (avg_chain / 5.0 * 33.33) +
    (avg_witness / 5.0 * 33.33) +
    (avg_technical / 5.0 * 33.34)
  );

  RETURN ROUND(avg_overall)::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Update trigger to use new calculation
DROP TRIGGER IF EXISTS update_evidence_quality_score ON evidence_assessments;

CREATE TRIGGER update_evidence_quality_score
AFTER INSERT OR UPDATE OR DELETE ON evidence_assessments
FOR EACH ROW
EXECUTE FUNCTION update_evidence_quality();

-- Step 9: Add comments documenting the PRD alignment
COMMENT ON COLUMN evidence_assessments.chain_of_custody_score IS
  'PRD 3-Tier Rubric Step 1: Source reliability, data provenance (1-5 scale)';
COMMENT ON COLUMN evidence_assessments.witness_credibility_score IS
  'PRD 3-Tier Rubric Step 2: Observer expertise, bias assessment (1-5 scale)';
COMMENT ON COLUMN evidence_assessments.technical_analysis_score IS
  'PRD 3-Tier Rubric Step 3: Methodology rigor, data quality (1-5 scale)';
COMMENT ON COLUMN evidence_assessments.verdict IS
  'PRD Step 2: User opinion after assessing evidence (alien/natural/uncertain)';
COMMENT ON COLUMN evidence_assessments.confidence IS
  'PRD Step 2: User confidence in their verdict (1-10 scale)';

-- Step 10: Create index for consensus queries by verdict
CREATE INDEX IF NOT EXISTS idx_assessments_verdict ON evidence_assessments(verdict) WHERE deleted_at IS NULL;
