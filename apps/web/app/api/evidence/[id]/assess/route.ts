import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET - Get assessments for an evidence piece
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: evidenceId } = await params
    const supabase = await createClient()

    // Validate evidence ID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(evidenceId)) {
      return NextResponse.json(
        { error: 'Invalid evidence ID format' },
        { status: 400 }
      )
    }

    // Get assessments for this evidence
    const { data: assessments, error } = await supabase
      .from('evidence_assessments')
      .select(`
        id,
        evidence_id,
        assessor_id,
        expertise_score,
        methodology_score,
        peer_review_score,
        overall_score,
        notes,
        created_at,
        updated_at,
        profiles:assessor_id (
          display_name,
          avatar_url
        )
      `)
      .eq('evidence_id', evidenceId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching assessments:', error)
      return NextResponse.json(
        { error: 'Failed to fetch assessments' },
        { status: 500 }
      )
    }

    // Get current user's assessment if authenticated
    let userAssessment = null
    const { data: { user } } = await supabase.auth.getUser()

    if (user && assessments) {
      userAssessment = assessments.find(a => a.assessor_id === user.id) || null
    }

    // Calculate averages
    const avgExpertise = assessments?.length
      ? assessments.reduce((sum, a) => sum + a.expertise_score, 0) / assessments.length
      : 0
    const avgMethodology = assessments?.length
      ? assessments.reduce((sum, a) => sum + a.methodology_score, 0) / assessments.length
      : 0
    const avgPeerReview = assessments?.length
      ? assessments.reduce((sum, a) => sum + a.peer_review_score, 0) / assessments.length
      : 0

    return NextResponse.json({
      assessments: assessments || [],
      user_assessment: userAssessment,
      total: assessments?.length || 0,
      averages: {
        expertise: Math.round(avgExpertise),
        methodology: Math.round(avgMethodology),
        peer_review: Math.round(avgPeerReview),
        overall: Math.round(avgExpertise + avgMethodology + avgPeerReview)
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

// POST - Submit or update an assessment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: evidenceId } = await params
    const supabase = await createClient()

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required to assess evidence' },
        { status: 401 }
      )
    }

    // Check user tier - Evidence Analyst required
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tier')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    const tier = subscription?.tier
    if (tier !== 'evidence_analyst') {
      return NextResponse.json(
        { error: 'Evidence Analyst tier required to assess evidence' },
        { status: 403 }
      )
    }

    // Validate evidence ID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(evidenceId)) {
      return NextResponse.json(
        { error: 'Invalid evidence ID format' },
        { status: 400 }
      )
    }

    // Verify evidence exists
    const { data: evidence, error: evidenceError } = await supabase
      .from('evidence')
      .select('id')
      .eq('id', evidenceId)
      .is('deleted_at', null)
      .single()

    if (evidenceError || !evidence) {
      return NextResponse.json(
        { error: 'Evidence not found' },
        { status: 404 }
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

    const { expertise_score, methodology_score, peer_review_score, notes } = body

    // Validate expertise_score (0, 20, or 40)
    if (![0, 20, 40].includes(expertise_score)) {
      return NextResponse.json(
        { error: 'expertise_score must be 0, 20, or 40' },
        { status: 400 }
      )
    }

    // Validate methodology_score (0-30)
    if (typeof methodology_score !== 'number' || methodology_score < 0 || methodology_score > 30) {
      return NextResponse.json(
        { error: 'methodology_score must be between 0 and 30' },
        { status: 400 }
      )
    }

    // Validate peer_review_score (0-30)
    if (typeof peer_review_score !== 'number' || peer_review_score < 0 || peer_review_score > 30) {
      return NextResponse.json(
        { error: 'peer_review_score must be between 0 and 30' },
        { status: 400 }
      )
    }

    // Check if user already has an assessment for this evidence
    const { data: existingAssessment } = await supabase
      .from('evidence_assessments')
      .select('id')
      .eq('evidence_id', evidenceId)
      .eq('assessor_id', user.id)
      .is('deleted_at', null)
      .single()

    let assessment
    let isUpdate = false

    if (existingAssessment) {
      // Update existing assessment
      const { data: updatedAssessment, error: updateError } = await supabase
        .from('evidence_assessments')
        .update({
          expertise_score,
          methodology_score,
          peer_review_score,
          notes: notes?.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingAssessment.id)
        .select(`
          id,
          evidence_id,
          assessor_id,
          expertise_score,
          methodology_score,
          peer_review_score,
          overall_score,
          notes,
          created_at,
          updated_at
        `)
        .single()

      if (updateError) {
        console.error('Error updating assessment:', updateError)
        return NextResponse.json(
          { error: 'Failed to update assessment' },
          { status: 500 }
        )
      }

      assessment = updatedAssessment
      isUpdate = true
    } else {
      // Create new assessment
      const { data: newAssessment, error: insertError } = await supabase
        .from('evidence_assessments')
        .insert({
          evidence_id: evidenceId,
          assessor_id: user.id,
          expertise_score,
          methodology_score,
          peer_review_score,
          notes: notes?.trim() || null
        })
        .select(`
          id,
          evidence_id,
          assessor_id,
          expertise_score,
          methodology_score,
          peer_review_score,
          overall_score,
          notes,
          created_at,
          updated_at
        `)
        .single()

      if (insertError) {
        console.error('Error creating assessment:', insertError)
        return NextResponse.json(
          { error: 'Failed to create assessment' },
          { status: 500 }
        )
      }

      assessment = newAssessment
    }

    return NextResponse.json({
      success: true,
      assessment,
      is_update: isUpdate
    }, { status: isUpdate ? 200 : 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
