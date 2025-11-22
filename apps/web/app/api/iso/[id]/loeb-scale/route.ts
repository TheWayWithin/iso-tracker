import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: isoId } = await params
    const supabase = await createClient()

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Validate ISO ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(isoId)) {
      return NextResponse.json(
        { error: 'Invalid ISO ID format' },
        { status: 400 }
      )
    }

    // Fetch the Loeb Scale assessment for this ISO
    const { data: assessment, error: assessmentError } = await supabase
      .from('loeb_scale_assessments')
      .select(`
        *
      `)
      .eq('iso_id', isoId)
      .is('deleted_at', null)
      .maybeSingle()

    if (assessmentError) {
      console.error('Error fetching Loeb Scale assessment:', assessmentError)
      return NextResponse.json(
        { error: 'Failed to fetch assessment' },
        { status: 500 }
      )
    }

    // Fetch the criteria for the official level
    let officialCriteria = null
    if (assessment?.official_level !== null && assessment?.official_level !== undefined) {
      const { data: criteria } = await supabase
        .from('loeb_scale_criteria')
        .select('*')
        .eq('level', assessment.official_level)
        .single()
      officialCriteria = criteria
    }

    // If no assessment exists yet, return default values
    if (!assessment) {
      // Get level 0 criteria as default
      const { data: defaultCriteria } = await supabase
        .from('loeb_scale_criteria')
        .select('*')
        .eq('level', 0)
        .single()

      return NextResponse.json({
        assessment: null,
        official_level: null,
        official_zone: null,
        official_classification: null,
        community_level: null,
        community_zone: null,
        community_vote_count: 0,
        criteria_met: [],
        evidence_links: [],
        category_scores: {
          trajectory: null,
          spectroscopic: null,
          geometric: null,
          composition: null,
          electromagnetic: null,
          operational: null
        },
        criteria: defaultCriteria
      })
    }

    return NextResponse.json({
      assessment,
      official_level: assessment.official_level,
      official_zone: assessment.official_zone,
      official_classification: officialCriteria?.title || null,
      official_reasoning: assessment.official_reasoning,
      official_source: assessment.official_source,
      community_level: assessment.community_level,
      community_zone: assessment.community_zone,
      community_vote_count: assessment.community_vote_count || 0,
      criteria_met: assessment.criteria_met || [],
      evidence_links: assessment.evidence_links || [],
      category_scores: {
        trajectory: assessment.trajectory_score,
        spectroscopic: assessment.spectroscopic_score,
        geometric: assessment.geometric_score,
        composition: assessment.composition_score,
        electromagnetic: assessment.electromagnetic_score,
        operational: assessment.operational_score
      },
      criteria: officialCriteria
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
