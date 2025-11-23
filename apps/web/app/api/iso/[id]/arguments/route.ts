import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Types - Supabase returns profiles as array due to join
interface ArgumentRow {
  id: string
  iso_object_id: string
  user_id: string
  stance: string
  title: string
  content: string
  upvotes_count: number
  downvotes_count: number
  created_at: string
  updated_at: string
  profiles: {
    display_name: string | null
    avatar_url: string | null
  }[] | null
}

// GET - List arguments for an ISO
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: isoId } = await params
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    // Query params
    const sort = searchParams.get('sort') || 'newest' // newest, top, controversial
    const stance = searchParams.get('stance') // artificial, natural, uncertain, or null for all
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
      .from('arguments')
      .select(`
        id,
        iso_object_id,
        user_id,
        stance,
        title,
        content,
        upvotes_count,
        downvotes_count,
        created_at,
        updated_at,
        profiles:user_id (
          display_name,
          avatar_url
        )
      `, { count: 'exact' })
      .eq('iso_object_id', isoId)
      .is('deleted_at', null)

    // Filter by stance if provided
    if (stance && ['artificial', 'natural', 'uncertain'].includes(stance)) {
      query = query.eq('stance', stance)
    }

    // Sort options
    switch (sort) {
      case 'top':
        // Sort by net votes (upvotes - downvotes), then by recency
        query = query.order('upvotes_count', { ascending: false })
        break
      case 'controversial':
        // Most total votes (most discussed)
        query = query.order('downvotes_count', { ascending: false })
        break
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false })
    }

    // Pagination
    query = query.range(offset, offset + limit - 1)

    const { data: arguments_, count, error } = await query

    if (error) {
      console.error('Error fetching arguments:', error)
      return NextResponse.json(
        { error: 'Failed to fetch arguments' },
        { status: 500 }
      )
    }

    // Get current user's votes on these arguments
    let userVotes: Record<string, string> = {}
    const { data: { user } } = await supabase.auth.getUser()

    if (user && arguments_ && arguments_.length > 0) {
      const argumentIds = (arguments_ as ArgumentRow[]).map((arg) => arg.id)
      const { data: votes } = await supabase
        .from('argument_votes')
        .select('argument_id, vote_type')
        .eq('user_id', user.id)
        .in('argument_id', argumentIds)

      if (votes) {
        votes.forEach(vote => {
          userVotes[vote.argument_id] = vote.vote_type
        })
      }
    }

    // Get aggregate stats for this ISO
    const { data: stats } = await supabase.rpc('get_iso_argument_stats', {
      p_iso_object_id: isoId
    })

    return NextResponse.json({
      arguments: arguments_ || [],
      user_votes: userVotes,
      total: count || 0,
      stats: stats?.[0] || {
        total_arguments: 0,
        artificial_count: 0,
        natural_count: 0,
        uncertain_count: 0,
        total_votes: 0
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

// POST - Create a new argument
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
        { error: 'Authentication required to submit arguments' },
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

    const { stance, title, content } = body

    // Validate stance
    if (!stance || !['artificial', 'natural', 'uncertain'].includes(stance)) {
      return NextResponse.json(
        { error: 'stance must be one of: artificial, natural, uncertain' },
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

    // Validate content
    const cleanContent = content?.trim()
    if (!cleanContent || cleanContent.length < 10) {
      return NextResponse.json(
        { error: 'Content must be at least 10 characters' },
        { status: 400 }
      )
    }
    if (cleanContent.length > 2000) {
      return NextResponse.json(
        { error: 'Content must be 2000 characters or less' },
        { status: 400 }
      )
    }

    // Create the argument
    const { data: argument, error: insertError } = await supabase
      .from('arguments')
      .insert({
        iso_object_id: isoId,
        user_id: user.id,
        stance,
        title: cleanTitle,
        content: cleanContent
      })
      .select(`
        id,
        iso_object_id,
        user_id,
        stance,
        title,
        content,
        upvotes_count,
        downvotes_count,
        created_at,
        updated_at,
        profiles:user_id (
          display_name,
          avatar_url
        )
      `)
      .single()

    if (insertError) {
      console.error('Error creating argument:', insertError)

      // Check for specific error types
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'You have already submitted an argument with this title for this ISO' },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to create argument' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      argument
    }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
