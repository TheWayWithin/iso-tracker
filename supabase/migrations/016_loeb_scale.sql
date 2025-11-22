-- Migration: 016_loeb_scale.sql
-- Description: Loeb Scale (Interstellar Object Significance Scale) framework
-- Sprint 10: The Loeb Scale - Anomaly Assessment Engine

-- ============================================================================
-- LOEB SCALE CRITERIA REFERENCE TABLE
-- Pre-populated definitions for all 11 levels (0-10)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.loeb_scale_criteria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level INTEGER NOT NULL UNIQUE CHECK (level >= 0 AND level <= 10),
    zone TEXT NOT NULL CHECK (zone IN ('green', 'yellow', 'orange', 'red')),
    zone_color TEXT NOT NULL,
    classification TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    criteria JSONB NOT NULL DEFAULT '[]'::jsonb,
    observable_categories JSONB NOT NULL DEFAULT '[]'::jsonb,
    examples TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for level lookups
CREATE INDEX IF NOT EXISTS idx_loeb_scale_criteria_level ON public.loeb_scale_criteria(level);
CREATE INDEX IF NOT EXISTS idx_loeb_scale_criteria_zone ON public.loeb_scale_criteria(zone);

-- ============================================================================
-- LOEB SCALE ASSESSMENTS TABLE
-- Official and community assessments for each ISO
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.loeb_scale_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    iso_id UUID NOT NULL REFERENCES public.iso_objects(id) ON DELETE CASCADE,

    -- Official assessment (from scientific community/Galileo Project)
    official_level INTEGER CHECK (official_level >= 0 AND official_level <= 10),
    official_zone TEXT CHECK (official_zone IN ('green', 'yellow', 'orange', 'red')),
    official_reasoning TEXT,
    official_source TEXT,
    official_updated_at TIMESTAMPTZ,
    official_updated_by UUID REFERENCES public.profiles(id),

    -- Community assessment (calculated from votes)
    community_level NUMERIC(3,1) CHECK (community_level >= 0 AND community_level <= 10),
    community_zone TEXT CHECK (community_zone IN ('green', 'yellow', 'orange', 'red')),
    community_vote_count INTEGER NOT NULL DEFAULT 0,

    -- Criteria and evidence tracking
    criteria_met JSONB NOT NULL DEFAULT '[]'::jsonb,
    evidence_links JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Observable category scores (0-10 for each category)
    trajectory_score NUMERIC(3,1) CHECK (trajectory_score >= 0 AND trajectory_score <= 10),
    spectroscopic_score NUMERIC(3,1) CHECK (spectroscopic_score >= 0 AND spectroscopic_score <= 10),
    geometric_score NUMERIC(3,1) CHECK (geometric_score >= 0 AND geometric_score <= 10),
    composition_score NUMERIC(3,1) CHECK (composition_score >= 0 AND composition_score <= 10),
    electromagnetic_score NUMERIC(3,1) CHECK (electromagnetic_score >= 0 AND electromagnetic_score <= 10),
    operational_score NUMERIC(3,1) CHECK (operational_score >= 0 AND operational_score <= 10),

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    -- One assessment per ISO
    CONSTRAINT unique_iso_assessment UNIQUE (iso_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_loeb_assessments_iso_id ON public.loeb_scale_assessments(iso_id);
CREATE INDEX IF NOT EXISTS idx_loeb_assessments_official_level ON public.loeb_scale_assessments(official_level);
CREATE INDEX IF NOT EXISTS idx_loeb_assessments_community_level ON public.loeb_scale_assessments(community_level);
CREATE INDEX IF NOT EXISTS idx_loeb_assessments_official_zone ON public.loeb_scale_assessments(official_zone);
CREATE INDEX IF NOT EXISTS idx_loeb_assessments_deleted ON public.loeb_scale_assessments(deleted_at) WHERE deleted_at IS NULL;

-- ============================================================================
-- LOEB SCALE VOTES TABLE
-- User votes for ISO significance (Analyst tier and above)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.loeb_scale_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    iso_id UUID NOT NULL REFERENCES public.iso_objects(id) ON DELETE CASCADE,

    -- Vote details
    voted_level INTEGER NOT NULL CHECK (voted_level >= 0 AND voted_level <= 10),
    voted_zone TEXT NOT NULL CHECK (voted_zone IN ('green', 'yellow', 'orange', 'red')),
    reasoning TEXT,

    -- Category-specific votes (optional detailed breakdown)
    trajectory_vote INTEGER CHECK (trajectory_vote >= 0 AND trajectory_vote <= 10),
    spectroscopic_vote INTEGER CHECK (spectroscopic_vote >= 0 AND spectroscopic_vote <= 10),
    geometric_vote INTEGER CHECK (geometric_vote >= 0 AND geometric_vote <= 10),
    composition_vote INTEGER CHECK (composition_vote >= 0 AND composition_vote <= 10),
    electromagnetic_vote INTEGER CHECK (electromagnetic_vote >= 0 AND electromagnetic_vote <= 10),
    operational_vote INTEGER CHECK (operational_vote >= 0 AND operational_vote <= 10),

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- One vote per user per ISO (can be updated)
    CONSTRAINT unique_user_iso_vote UNIQUE (user_id, iso_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_loeb_votes_user_id ON public.loeb_scale_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_loeb_votes_iso_id ON public.loeb_scale_votes(iso_id);
CREATE INDEX IF NOT EXISTS idx_loeb_votes_level ON public.loeb_scale_votes(voted_level);
CREATE INDEX IF NOT EXISTS idx_loeb_votes_created ON public.loeb_scale_votes(created_at DESC);

-- ============================================================================
-- HELPER FUNCTION: Calculate zone from level
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_loeb_zone(level NUMERIC)
RETURNS TEXT AS $$
BEGIN
    IF level IS NULL THEN
        RETURN NULL;
    ELSIF level <= 1 THEN
        RETURN 'green';
    ELSIF level <= 4 THEN
        RETURN 'yellow';
    ELSIF level <= 7 THEN
        RETURN 'orange';
    ELSE
        RETURN 'red';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- TRIGGER: Auto-calculate community score on vote changes
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_community_loeb_score()
RETURNS TRIGGER AS $$
DECLARE
    v_iso_id UUID;
    v_avg_level NUMERIC(3,1);
    v_vote_count INTEGER;
    v_zone TEXT;
BEGIN
    -- Get the ISO ID from the affected row
    IF TG_OP = 'DELETE' THEN
        v_iso_id := OLD.iso_id;
    ELSE
        v_iso_id := NEW.iso_id;
    END IF;

    -- Calculate new average and count
    SELECT
        ROUND(AVG(voted_level)::numeric, 1),
        COUNT(*)
    INTO v_avg_level, v_vote_count
    FROM public.loeb_scale_votes
    WHERE iso_id = v_iso_id;

    -- Calculate zone from average level
    v_zone := public.get_loeb_zone(v_avg_level);

    -- Update or insert the assessment
    INSERT INTO public.loeb_scale_assessments (
        iso_id,
        community_level,
        community_zone,
        community_vote_count,
        updated_at
    )
    VALUES (
        v_iso_id,
        v_avg_level,
        v_zone,
        COALESCE(v_vote_count, 0),
        NOW()
    )
    ON CONFLICT (iso_id)
    DO UPDATE SET
        community_level = EXCLUDED.community_level,
        community_zone = EXCLUDED.community_zone,
        community_vote_count = EXCLUDED.community_vote_count,
        updated_at = NOW();

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for vote changes
DROP TRIGGER IF EXISTS trigger_loeb_vote_insert ON public.loeb_scale_votes;
CREATE TRIGGER trigger_loeb_vote_insert
    AFTER INSERT ON public.loeb_scale_votes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_community_loeb_score();

DROP TRIGGER IF EXISTS trigger_loeb_vote_update ON public.loeb_scale_votes;
CREATE TRIGGER trigger_loeb_vote_update
    AFTER UPDATE ON public.loeb_scale_votes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_community_loeb_score();

DROP TRIGGER IF EXISTS trigger_loeb_vote_delete ON public.loeb_scale_votes;
CREATE TRIGGER trigger_loeb_vote_delete
    AFTER DELETE ON public.loeb_scale_votes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_community_loeb_score();

-- ============================================================================
-- TRIGGER: Auto-update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_loeb_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_loeb_assessments_updated ON public.loeb_scale_assessments;
CREATE TRIGGER trigger_loeb_assessments_updated
    BEFORE UPDATE ON public.loeb_scale_assessments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_loeb_updated_at();

DROP TRIGGER IF EXISTS trigger_loeb_votes_updated ON public.loeb_scale_votes;
CREATE TRIGGER trigger_loeb_votes_updated
    BEFORE UPDATE ON public.loeb_scale_votes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_loeb_updated_at();

DROP TRIGGER IF EXISTS trigger_loeb_criteria_updated ON public.loeb_scale_criteria;
CREATE TRIGGER trigger_loeb_criteria_updated
    BEFORE UPDATE ON public.loeb_scale_criteria
    FOR EACH ROW
    EXECUTE FUNCTION public.update_loeb_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.loeb_scale_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loeb_scale_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loeb_scale_votes ENABLE ROW LEVEL SECURITY;

-- LOEB_SCALE_CRITERIA: Read-only for all authenticated users
CREATE POLICY "Anyone can view Loeb Scale criteria"
    ON public.loeb_scale_criteria
    FOR SELECT
    USING (true);

-- LOEB_SCALE_ASSESSMENTS: View for all authenticated, modify for admins only
CREATE POLICY "Authenticated users can view assessments"
    ON public.loeb_scale_assessments
    FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL);

CREATE POLICY "Admins can insert assessments"
    ON public.loeb_scale_assessments
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update assessments"
    ON public.loeb_scale_assessments
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- LOEB_SCALE_VOTES: Analyst tier and above can vote
CREATE POLICY "Analyst tier can view all votes"
    ON public.loeb_scale_votes
    FOR SELECT
    TO authenticated
    USING (
        check_tier(auth.uid(), 'evidence_analyst')
    );

CREATE POLICY "Analyst tier can insert own votes"
    ON public.loeb_scale_votes
    FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id = auth.uid()
        AND check_tier(auth.uid(), 'evidence_analyst')
    );

CREATE POLICY "Users can update own votes"
    ON public.loeb_scale_votes
    FOR UPDATE
    TO authenticated
    USING (
        user_id = auth.uid()
        AND check_tier(auth.uid(), 'evidence_analyst')
    );

CREATE POLICY "Users can delete own votes"
    ON public.loeb_scale_votes
    FOR DELETE
    TO authenticated
    USING (
        user_id = auth.uid()
        AND check_tier(auth.uid(), 'evidence_analyst')
    );

-- ============================================================================
-- SEED DATA: Loeb Scale Criteria (Levels 0-10)
-- ============================================================================

INSERT INTO public.loeb_scale_criteria (level, zone, zone_color, classification, title, description, criteria, observable_categories, examples)
VALUES
-- GREEN ZONE: Natural Objects (0-1)
(0, 'green', '#10B981', 'Natural Objects', 'Confirmed Natural',
 'Definitively identified as a natural object with no anomalous characteristics. Trajectory, composition, and behavior fully explained by known physics.',
 '["Trajectory consistent with gravitational dynamics", "Spectroscopy matches known natural materials", "No anomalous acceleration", "Shape consistent with natural formation", "No electromagnetic emissions"]'::jsonb,
 '["Trajectory Anomalies", "Spectroscopic Signatures", "Geometric Properties", "Surface Composition"]'::jsonb,
 ARRAY['2I/Borisov', 'Most observed comets and asteroids']
),

(1, 'green', '#10B981', 'Natural Objects', 'Probably Natural',
 'Likely natural origin with minor unexplained features that could be attributed to observational limitations or rare natural phenomena.',
 '["Trajectory mostly explained by gravity", "Minor spectroscopic anomalies within error margins", "Slight acceleration possibly from outgassing", "Unusual but possible natural shape"]'::jsonb,
 '["Trajectory Anomalies", "Spectroscopic Signatures", "Geometric Properties", "Surface Composition"]'::jsonb,
 ARRAY['Unusual asteroids with elongated shapes', 'Objects with minor unexplained brightness variations']
),

-- YELLOW ZONE: Anomalous Objects (2-4)
(2, 'yellow', '#FFB84D', 'Anomalous Objects', 'Notable Anomaly',
 'Object displays one significant unexplained characteristic that warrants further investigation.',
 '["One unexplained feature (trajectory, composition, or behavior)", "Natural origin still possible but less likely", "Additional data needed for classification"]'::jsonb,
 '["Trajectory Anomalies", "Spectroscopic Signatures", "Geometric Properties", "Surface Composition"]'::jsonb,
 ARRAY['Objects with single unexplained feature']
),

(3, 'yellow', '#FFB84D', 'Anomalous Objects', 'Significant Anomaly',
 'Multiple unexplained characteristics that challenge conventional explanations. Natural origin possible but requires unusual circumstances.',
 '["Two or more unexplained features", "Behavior inconsistent with known natural objects", "Standard astrophysical models insufficient", "May require new natural phenomena to explain"]'::jsonb,
 '["Trajectory Anomalies", "Spectroscopic Signatures", "Geometric Properties", "Surface Composition", "Electromagnetic Signals"]'::jsonb,
 ARRAY['Objects with multiple anomalies like unusual trajectory AND unexpected brightness']
),

(4, 'yellow', '#FFB84D', 'Anomalous Objects', 'Highly Anomalous',
 'Exhibits multiple significant anomalies that strain natural explanations. Artificial origin becomes a reasonable hypothesis to consider.',
 '["Three or more significant anomalies", "Natural explanations require multiple unlikely coincidences", "Behavior patterns suggest non-random origin", "Acceleration not explained by outgassing", "Geometric properties unusual for natural formation"]'::jsonb,
 '["Trajectory Anomalies", "Spectroscopic Signatures", "Geometric Properties", "Surface Composition", "Electromagnetic Signals"]'::jsonb,
 ARRAY['1I/''Oumuamua', '3I/ATLAS (pending confirmation)']
),

-- ORANGE ZONE: Suspected Technology (5-7)
(5, 'orange', '#F97316', 'Suspected Technology', 'Technology Possible',
 'Characteristics suggest artificial origin is as likely as natural origin. Clear deviation from expected natural behavior.',
 '["Propulsion-like behavior detected", "Material composition inconsistent with known natural objects", "Geometric regularity suggesting manufacture", "Purposeful-seeming trajectory changes"]'::jsonb,
 '["Trajectory Anomalies", "Spectroscopic Signatures", "Geometric Properties", "Surface Composition", "Electromagnetic Signals", "Operational Indicators"]'::jsonb,
 ARRAY['Hypothetical objects with propulsion signatures']
),

(6, 'orange', '#F97316', 'Suspected Technology', 'Technology Probable',
 'Artificial origin more likely than natural. Multiple lines of evidence point to manufactured object.',
 '["Clear non-gravitational acceleration without cometary activity", "Spectroscopy indicates processed materials", "Shape highly unlikely from natural formation", "Possible functional components detected"]'::jsonb,
 '["Trajectory Anomalies", "Spectroscopic Signatures", "Geometric Properties", "Surface Composition", "Electromagnetic Signals", "Operational Indicators"]'::jsonb,
 ARRAY['Hypothetical objects with manufactured materials detected']
),

(7, 'orange', '#F97316', 'Suspected Technology', 'Technology Highly Probable',
 'Strong evidence for artificial origin. Natural explanations require extraordinary and unsupported assumptions.',
 '["Controlled maneuvers observed", "Artificial materials confirmed", "Regular geometric structure verified", "Electromagnetic emissions detected", "Response to external stimuli possible"]'::jsonb,
 '["Trajectory Anomalies", "Spectroscopic Signatures", "Geometric Properties", "Surface Composition", "Electromagnetic Signals", "Operational Indicators"]'::jsonb,
 ARRAY['Hypothetical objects with active propulsion and artificial composition']
),

-- RED ZONE: Confirmed Technology (8-10)
(8, 'red', '#EF4444', 'Confirmed Technology', 'Technology Confirmed',
 'Artificial origin confirmed through multiple independent lines of evidence. Object is definitively manufactured.',
 '["Active propulsion system verified", "Manufactured materials confirmed by spectroscopy", "Purposeful navigation demonstrated", "Communication signals possible", "Clear technological signatures"]'::jsonb,
 '["Trajectory Anomalies", "Spectroscopic Signatures", "Geometric Properties", "Surface Composition", "Electromagnetic Signals", "Operational Indicators"]'::jsonb,
 ARRAY['No confirmed examples yet']
),

(9, 'red', '#EF4444', 'Confirmed Technology', 'Advanced Technology',
 'Object demonstrates technology beyond current human capabilities or known terrestrial origin. Interstellar probe likely.',
 '["Propulsion system exceeds current human technology", "Materials unknown to human science", "Navigation suggests intelligence", "Communication attempts detected", "Clearly extraterrestrial origin"]'::jsonb,
 '["Trajectory Anomalies", "Spectroscopic Signatures", "Geometric Properties", "Surface Composition", "Electromagnetic Signals", "Operational Indicators"]'::jsonb,
 ARRAY['No confirmed examples yet']
),

(10, 'red', '#EF4444', 'Confirmed Technology', 'Confirmed Extraterrestrial Technology',
 'Definitively confirmed extraterrestrial technological artifact. Communication established or origin conclusively determined.',
 '["Extraterrestrial origin proven", "Technology clearly non-human", "Possible communication established", "Full characterization achieved", "Scientific consensus on artificial nature"]'::jsonb,
 '["Trajectory Anomalies", "Spectroscopic Signatures", "Geometric Properties", "Surface Composition", "Electromagnetic Signals", "Operational Indicators"]'::jsonb,
 ARRAY['No confirmed examples yet - would represent first contact']
);

-- ============================================================================
-- SEED DATA: Initial Loeb Scale Assessments for Known ISOs
-- ============================================================================

-- Get ISO IDs and create assessments
DO $$
DECLARE
    v_oumuamua_id UUID;
    v_borisov_id UUID;
    v_atlas_id UUID;
BEGIN
    -- Get 1I/'Oumuamua ID
    SELECT id INTO v_oumuamua_id
    FROM public.iso_objects
    WHERE name ILIKE '%Oumuamua%'
    LIMIT 1;

    -- Get 2I/Borisov ID
    SELECT id INTO v_borisov_id
    FROM public.iso_objects
    WHERE name ILIKE '%Borisov%'
    LIMIT 1;

    -- Get 3I/ATLAS ID
    SELECT id INTO v_atlas_id
    FROM public.iso_objects
    WHERE name ILIKE '%ATLAS%'
    LIMIT 1;

    -- Insert assessment for 1I/'Oumuamua (Level 4 - Highly Anomalous)
    IF v_oumuamua_id IS NOT NULL THEN
        INSERT INTO public.loeb_scale_assessments (
            iso_id,
            official_level,
            official_zone,
            official_reasoning,
            official_source,
            official_updated_at,
            criteria_met,
            evidence_links,
            trajectory_score,
            spectroscopic_score,
            geometric_score,
            composition_score
        ) VALUES (
            v_oumuamua_id,
            4,
            'yellow',
            'Exhibits non-gravitational acceleration without visible outgassing, extreme elongated shape (6:1 to 10:1 aspect ratio), unusual tumbling motion, and high reflectivity variations. Multiple anomalies challenge conventional explanations.',
            'Galileo Project / Scientific Literature',
            NOW(),
            '["Non-gravitational acceleration detected", "No cometary activity observed", "Extreme elongation unprecedented", "Tumbling motion with variable brightness", "High reflectivity inconsistent with comets"]'::jsonb,
            '["Micheli et al. 2018 (Nature)", "Bialy & Loeb 2018", "Meech et al. 2017 (Nature)"]'::jsonb,
            7.5,
            3.0,
            8.0,
            4.0
        )
        ON CONFLICT (iso_id) DO UPDATE SET
            official_level = EXCLUDED.official_level,
            official_zone = EXCLUDED.official_zone,
            official_reasoning = EXCLUDED.official_reasoning,
            updated_at = NOW();
    END IF;

    -- Insert assessment for 2I/Borisov (Level 0 - Confirmed Natural)
    IF v_borisov_id IS NOT NULL THEN
        INSERT INTO public.loeb_scale_assessments (
            iso_id,
            official_level,
            official_zone,
            official_reasoning,
            official_source,
            official_updated_at,
            criteria_met,
            evidence_links,
            trajectory_score,
            spectroscopic_score,
            geometric_score,
            composition_score
        ) VALUES (
            v_borisov_id,
            0,
            'green',
            'Classic cometary behavior with clear coma and tail. Composition matches Solar System comets. Trajectory fully explained by gravitational dynamics with expected outgassing effects. No anomalous characteristics.',
            'Scientific Consensus',
            NOW(),
            '["Visible cometary activity", "Standard cometary composition", "Trajectory explained by physics", "Size and shape typical for comets"]'::jsonb,
            '["Jewitt & Luu 2019 (ApJL)", "Fitzsimmons et al. 2019 (ApJL)", "Bodewits et al. 2020 (Nature Astronomy)"]'::jsonb,
            0.5,
            1.0,
            1.0,
            0.5
        )
        ON CONFLICT (iso_id) DO UPDATE SET
            official_level = EXCLUDED.official_level,
            official_zone = EXCLUDED.official_zone,
            official_reasoning = EXCLUDED.official_reasoning,
            updated_at = NOW();
    END IF;

    -- Insert assessment for 3I/ATLAS (Level 4 - Highly Anomalous, pending confirmation)
    IF v_atlas_id IS NOT NULL THEN
        INSERT INTO public.loeb_scale_assessments (
            iso_id,
            official_level,
            official_zone,
            official_reasoning,
            official_source,
            official_updated_at,
            criteria_met,
            evidence_links,
            trajectory_score,
            spectroscopic_score,
            geometric_score,
            composition_score
        ) VALUES (
            v_atlas_id,
            4,
            'yellow',
            'Recently discovered object with confirmed hyperbolic trajectory. Initial observations suggest anomalous characteristics similar to 1I/''Oumuamua. Assessment pending additional data collection and analysis.',
            'Preliminary Assessment',
            NOW(),
            '["Hyperbolic trajectory confirmed", "Interstellar origin verified", "Anomalous characteristics under investigation", "Additional observations ongoing"]'::jsonb,
            '["ATLAS Survey Discovery", "Minor Planet Center Confirmation"]'::jsonb,
            6.0,
            NULL,
            NULL,
            NULL
        )
        ON CONFLICT (iso_id) DO UPDATE SET
            official_level = EXCLUDED.official_level,
            official_zone = EXCLUDED.official_zone,
            official_reasoning = EXCLUDED.official_reasoning,
            updated_at = NOW();
    END IF;
END $$;

-- ============================================================================
-- VIEWS: Convenient access patterns
-- ============================================================================

-- Combined view of ISOs with their Loeb Scale assessments
CREATE OR REPLACE VIEW public.iso_loeb_summary AS
SELECT
    iso.id,
    iso.name,
    iso.designation,
    iso.discovery_date,
    lsa.official_level,
    lsa.official_zone,
    lsc_official.title AS official_classification,
    lsa.community_level,
    lsa.community_zone,
    lsa.community_vote_count,
    lsa.criteria_met,
    lsa.updated_at AS assessment_updated_at
FROM public.iso_objects iso
LEFT JOIN public.loeb_scale_assessments lsa ON iso.id = lsa.iso_id AND lsa.deleted_at IS NULL
LEFT JOIN public.loeb_scale_criteria lsc_official ON lsc_official.level = lsa.official_level;

-- Grant access to the view
GRANT SELECT ON public.iso_loeb_summary TO authenticated;

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT SELECT ON public.loeb_scale_criteria TO anon, authenticated;
GRANT SELECT ON public.loeb_scale_assessments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.loeb_scale_votes TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.loeb_scale_criteria IS 'Reference table defining the 11 levels (0-10) of the Loeb Scale for interstellar object significance assessment';
COMMENT ON TABLE public.loeb_scale_assessments IS 'Official and community assessments of each ISO on the Loeb Scale';
COMMENT ON TABLE public.loeb_scale_votes IS 'User votes on ISO Loeb Scale level (Analyst tier and above)';

COMMENT ON COLUMN public.loeb_scale_assessments.official_level IS 'Official Loeb Scale level (0-10) from scientific community/Galileo Project';
COMMENT ON COLUMN public.loeb_scale_assessments.community_level IS 'Average of all user votes, calculated automatically';
COMMENT ON COLUMN public.loeb_scale_assessments.criteria_met IS 'JSONB array of criteria met for this assessment';
COMMENT ON COLUMN public.loeb_scale_assessments.evidence_links IS 'JSONB array of supporting evidence references';

COMMENT ON FUNCTION public.get_loeb_zone IS 'Returns the zone color name (green/yellow/orange/red) for a given Loeb Scale level';
COMMENT ON FUNCTION public.update_community_loeb_score IS 'Trigger function to automatically recalculate community score when votes change';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
