import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Helper function to calculate zone from level
function getZoneFromLevel(level: number): string {
  if (level <= 1) return 'green'
  if (level <= 4) return 'yellow'
  if (level <= 7) return 'orange'
  return 'red'
}

// GET - Get vote distribution and user's own vote
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

    // Validate ISO ID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(isoId)) {
      return NextResponse.json(
        { error: 'Invalid ISO ID format' },
        { status: 400 }
      )
    }

    // Check if user has Analyst tier (evidence_analyst)
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tier')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    const isAnalyst = subscription?.tier === 'evidence_analyst'

    // Get user's own vote regardless of tier
    const { data: userVote } = await supabase
      .from('loeb_scale_votes')
      .select('voted_level, voted_zone, reasoning, created_at, updated_at')
      .eq('iso_id', isoId)
      .eq('user_id', user.id)
      .maybeSingle()

    // Get vote aggregates (available to all authenticated users)
    const { data: voteAggregates, error: aggError } = await supabase
      .from('loeb_scale_votes')
      .select('voted_level')
      .eq('iso_id', isoId)

    if (aggError) {
      console.error('Error fetching vote aggregates:', aggError)
      return NextResponse.json(
        { error: 'Failed to fetch votes' },
        { status: 500 }
      )
    }

    // Calculate vote distribution
    const voteDistribution: Record<number, number> = {}
    for (let i = 0; i <= 10; i++) {
      voteDistribution[i] = 0
    }

    voteAggregates?.forEach(vote => {
      if (vote.voted_level !== null && vote.voted_level >= 0 && vote.voted_level <= 10) {
        voteDistribution[vote.voted_level]++
      }
    })

    const totalVotes = voteAggregates?.length || 0

    // If analyst tier, include detailed votes (anonymized)
    let detailedVotes = null
    if (isAnalyst) {
      const { data: detailed } = await supabase
        .from('loeb_scale_votes')
        .select('voted_level, voted_zone, reasoning, created_at')
        .eq('iso_id', isoId)
        .order('created_at', { ascending: false })
        .limit(50)

      detailedVotes = detailed
    }

    return NextResponse.json({
      user_vote: userVote,
      vote_distribution: voteDistribution,
      total_votes: totalVotes,
      detailed_votes: detailedVotes,
      can_vote: isAnalyst,
      can_see_details: isAnalyst
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Cast or update a vote
export async function POST(
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

    // Validate ISO ID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(isoId)) {
      return NextResponse.json(
        { error: 'Invalid ISO ID format' },
        { status: 400 }
      )
    }

    // Check if user has Analyst tier (evidence_analyst)
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tier')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (subscription?.tier !== 'evidence_analyst') {
      return NextResponse.json(
        { error: 'Analyst tier required to vote on Loeb Scale assessments. Upgrade to participate in community voting.' },
        { status: 403 }
      )
    }

    // Parse request body
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    const { voted_level, reasoning } = body

    // Validate voted_level
    if (voted_level === undefined || voted_level === null) {
      return NextResponse.json(
        { error: 'voted_level is required' },
        { status: 400 }
      )
    }

    const level = parseInt(voted_level, 10)
    if (isNaN(level) || level < 0 || level > 10) {
      return NextResponse.json(
        { error: 'voted_level must be between 0 and 10' },
        { status: 400 }
      )
    }

    // Validate reasoning if provided
    const cleanReasoning = reasoning?.trim() || null
    if (cleanReasoning && cleanReasoning.length > 2000) {
      return NextResponse.json(
        { error: 'Reasoning must be 2000 characters or less' },
        { status: 400 }
      )
    }

    // Verify ISO exists
    const { data: iso, error: isoError } = await supabase
      .from('iso_objects')
      .select('id')
      .eq('id', isoId)
      .single()

    if (isoError || !iso) {
      return NextResponse.json(
        { error: 'ISO not found' },
        { status: 404 }
      )
    }

    // Calculate zone from level
    const votedZone = getZoneFromLevel(level)

    // Upsert the vote (one vote per user per ISO)
    const { data: vote, error: voteError } = await supabase
      .from('loeb_scale_votes')
      .upsert(
        {
          iso_id: isoId,
          user_id: user.id,
          voted_level: level,
          voted_zone: votedZone,
          reasoning: cleanReasoning,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'user_id,iso_id',
          ignoreDuplicates: false
        }
      )
      .select()
      .single()

    if (voteError) {
      console.error('Error saving vote:', voteError)
      return NextResponse.json(
        { error: 'Failed to save vote' },
        { status: 500 }
      )
    }

    // The trigger will auto-update community_level in loeb_scale_assessments
    // Fetch the updated assessment
    const { data: updatedAssessment } = await supabase
      .from('loeb_scale_assessments')
      .select('community_level, community_zone, community_vote_count')
      .eq('iso_id', isoId)
      .single()

    return NextResponse.json({
      success: true,
      vote: {
        voted_level: level,
        voted_zone: votedZone,
        reasoning: cleanReasoning
      },
      updated_assessment: {
        community_level: updatedAssessment?.community_level ?? null,
        community_zone: updatedAssessment?.community_zone ?? null,
        total_votes: updatedAssessment?.community_vote_count ?? 1
      }
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
