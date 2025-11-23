import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Types for Supabase response
interface CommentRow {
  id: string
  evidence_id: string
  user_id: string
  parent_comment_id: string | null
  content: string
  deleted_at: string | null
  created_at: string
  updated_at: string
  profiles: {
    display_name: string | null
    avatar_url: string | null
  }[] | null
}

// GET - List comments for an evidence piece
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

    // Fetch all comments for this evidence
    const { data: comments, error } = await supabase
      .from('evidence_comments')
      .select(`
        id,
        evidence_id,
        user_id,
        parent_comment_id,
        content,
        deleted_at,
        created_at,
        updated_at,
        profiles:user_id (
          display_name,
          avatar_url
        )
      `)
      .eq('evidence_id', evidenceId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching comments:', error)
      return NextResponse.json(
        { error: 'Failed to fetch comments' },
        { status: 500 }
      )
    }

    // Build nested comment structure
    const commentMap = new Map<string, CommentRow & { replies: (CommentRow & { replies: CommentRow[] })[] }>()
    const rootComments: (CommentRow & { replies: (CommentRow & { replies: CommentRow[] })[] })[] = []

    // First pass: create map of all comments
    comments?.forEach((comment) => {
      commentMap.set(comment.id, { ...comment, replies: [] })
    })

    // Second pass: build tree structure
    comments?.forEach((comment) => {
      const commentWithReplies = commentMap.get(comment.id)!
      if (comment.parent_comment_id && commentMap.has(comment.parent_comment_id)) {
        const parent = commentMap.get(comment.parent_comment_id)!
        parent.replies.push(commentWithReplies as CommentRow & { replies: CommentRow[] })
      } else {
        rootComments.push(commentWithReplies)
      }
    })

    return NextResponse.json({
      comments: rootComments,
      total: comments?.length || 0
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a new comment
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
        { error: 'Authentication required to comment' },
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
        { error: 'Evidence Analyst tier required to comment on evidence' },
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

    const { content, parent_comment_id } = body

    // Validate content
    const cleanContent = content?.trim()
    if (!cleanContent || cleanContent.length < 10) {
      return NextResponse.json(
        { error: 'Comment must be at least 10 characters' },
        { status: 400 }
      )
    }
    if (cleanContent.length > 10000) {
      return NextResponse.json(
        { error: 'Comment must be 10,000 characters or less' },
        { status: 400 }
      )
    }

    // Validate parent_comment_id if provided
    if (parent_comment_id) {
      if (!uuidRegex.test(parent_comment_id)) {
        return NextResponse.json(
          { error: 'Invalid parent comment ID format' },
          { status: 400 }
        )
      }

      // Check parent exists and belongs to this evidence
      const { data: parentComment, error: parentError } = await supabase
        .from('evidence_comments')
        .select('id, parent_comment_id, evidence_id')
        .eq('id', parent_comment_id)
        .eq('evidence_id', evidenceId)
        .single()

      if (parentError || !parentComment) {
        return NextResponse.json(
          { error: 'Parent comment not found' },
          { status: 404 }
        )
      }

      // Check nesting depth (max 3 levels per PRD)
      // Level 1: root comment (parent_comment_id = null)
      // Level 2: reply to root (parent_comment_id = root.id)
      // Level 3: reply to reply (parent has parent_comment_id)
      if (parentComment.parent_comment_id) {
        // Parent is already a reply - check if parent's parent is also a reply
        const { data: grandparent } = await supabase
          .from('evidence_comments')
          .select('parent_comment_id')
          .eq('id', parentComment.parent_comment_id)
          .single()

        if (grandparent?.parent_comment_id) {
          return NextResponse.json(
            { error: 'Maximum nesting depth (3 levels) reached' },
            { status: 400 }
          )
        }
      }
    }

    // Create the comment
    const { data: comment, error: insertError } = await supabase
      .from('evidence_comments')
      .insert({
        evidence_id: evidenceId,
        user_id: user.id,
        parent_comment_id: parent_comment_id || null,
        content: cleanContent
      })
      .select(`
        id,
        evidence_id,
        user_id,
        parent_comment_id,
        content,
        deleted_at,
        created_at,
        updated_at,
        profiles:user_id (
          display_name,
          avatar_url
        )
      `)
      .single()

    if (insertError) {
      console.error('Error creating comment:', insertError)
      return NextResponse.json(
        { error: 'Failed to create comment' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      comment
    }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
