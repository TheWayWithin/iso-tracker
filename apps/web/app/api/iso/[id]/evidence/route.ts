import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Types for Supabase response
interface EvidenceRow {
  id: string
  iso_object_id: string
  submitter_id: string
  evidence_type: string
  title: string
  description: string
  methodology: string
  source_url: string | null
  quality_score: number
  comment_count: number
  created_at: string
  updated_at: string
  profiles: {
    display_name: string | null
    avatar_url: string | null
  }[] | null
}

// GET - List evidence for an ISO
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: isoId } = await params
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    // Query params
    const sort = searchParams.get('sort') || 'quality' // quality, newest, most_assessed
    const type = searchParams.get('type') // evidence type filter
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Validate ISO ID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(isoId)) {
      return NextResponse.json(
        { error: 'Invalid ISO ID format' },
        { status: 400 }
      )
    }

    // Build query
    let query = supabase
      .from('evidence')
      .select(`
        id,
        iso_object_id,
        submitter_id,
        evidence_type,
        title,
        description,
        methodology,
        source_url,
        quality_score,
        comment_count,
        created_at,
        updated_at,
        profiles:submitter_id (
          display_name,
          avatar_url
        )
      `, { count: 'exact' })
      .eq('iso_object_id', isoId)
      .is('deleted_at', null)

    // Filter by type if provided
    const validTypes = ['observation', 'spectroscopy', 'astrometry', 'photometry', 'radar', 'theoretical', 'simulation', 'literature', 'other']
    if (type && validTypes.includes(type)) {
      query = query.eq('evidence_type', type)
    }

    // Sort options
    switch (sort) {
      case 'newest':
        query = query.order('created_at', { ascending: false })
        break
      case 'most_assessed':
        // Sort by quality_score as proxy for most assessed
        query = query.order('quality_score', { ascending: false })
        break
      case 'quality':
      default:
        query = query.order('quality_score', { ascending: false })
    }

    // Pagination
    query = query.range(offset, offset + limit - 1)

    const { data: evidence, count, error } = await query

    if (error) {
      console.error('Error fetching evidence:', error)
      return NextResponse.json(
        { error: 'Failed to fetch evidence' },
        { status: 500 }
      )
    }

    // Get aggregate stats for this ISO
    const { data: stats } = await supabase
      .from('evidence')
      .select('evidence_type')
      .eq('iso_object_id', isoId)
      .is('deleted_at', null)

    const typeStats = validTypes.reduce((acc, t) => {
      acc[t] = stats?.filter(e => e.evidence_type === t).length || 0
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      evidence: evidence || [],
      total: count || 0,
      stats: {
        total_evidence: count || 0,
        by_type: typeStats
      },
      pagination: {
        limit,
        offset,
        has_more: (count || 0) > offset + limit
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

// POST - Submit new evidence
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
        { error: 'Authentication required to submit evidence' },
        { status: 401 }
      )
    }

    // Check user tier - Event Pass+ required
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tier')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    const tier = subscription?.tier || 'guest'
    if (tier === 'guest') {
      return NextResponse.json(
        { error: 'Event Pass or higher required to submit evidence' },
        { status: 403 }
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

    const { evidence_type, title, description, methodology, source_url } = body

    // Validate evidence_type
    const validTypes = ['observation', 'spectroscopy', 'astrometry', 'photometry', 'radar', 'theoretical', 'simulation', 'literature', 'other']
    if (!evidence_type || !validTypes.includes(evidence_type)) {
      return NextResponse.json(
        { error: `evidence_type must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate title
    const cleanTitle = title?.trim()
    if (!cleanTitle || cleanTitle.length < 3) {
      return NextResponse.json(
        { error: 'Title must be at least 3 characters' },
        { status: 400 }
      )
    }
    if (cleanTitle.length > 200) {
      return NextResponse.json(
        { error: 'Title must be 200 characters or less' },
        { status: 400 }
      )
    }

    // Validate description
    const cleanDescription = description?.trim()
    if (!cleanDescription || cleanDescription.length < 10) {
      return NextResponse.json(
        { error: 'Description must be at least 10 characters' },
        { status: 400 }
      )
    }

    // Validate methodology
    const cleanMethodology = methodology?.trim()
    if (!cleanMethodology || cleanMethodology.length < 10) {
      return NextResponse.json(
        { error: 'Methodology must be at least 10 characters' },
        { status: 400 }
      )
    }

    // Validate source_url if provided
    if (source_url && source_url.trim()) {
      const urlRegex = /^https?:\/\/.+/
      if (!urlRegex.test(source_url.trim())) {
        return NextResponse.json(
          { error: 'Source URL must be a valid HTTP/HTTPS URL' },
          { status: 400 }
        )
      }
    }

    // Create the evidence
    const { data: evidence, error: insertError } = await supabase
      .from('evidence')
      .insert({
        iso_object_id: isoId,
        submitter_id: user.id,
        evidence_type,
        title: cleanTitle,
        description: cleanDescription,
        methodology: cleanMethodology,
        source_url: source_url?.trim() || null
      })
      .select(`
        id,
        iso_object_id,
        submitter_id,
        evidence_type,
        title,
        description,
        methodology,
        source_url,
        quality_score,
        created_at,
        updated_at,
        profiles:submitter_id (
          display_name,
          avatar_url
        )
      `)
      .single()

    if (insertError) {
      console.error('Error creating evidence:', insertError)

      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'You have already submitted evidence with this title for this ISO' },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to create evidence' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      evidence
    }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
