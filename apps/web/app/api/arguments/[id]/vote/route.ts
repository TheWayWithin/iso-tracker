import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// POST - Cast or update a vote on an argument
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: argumentId } = await params
    const supabase = await createClient()

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required to vote' },
        { status: 401 }
      )
    }

    // Validate argument ID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(argumentId)) {
      return NextResponse.json(
        { error: 'Invalid argument ID format' },
        { status: 400 }
      )
    }

    // Check if user has Event Pass+ tier
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tier')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    const hasVotingTier = subscription?.tier === 'event_pass' ||
                          subscription?.tier === 'evidence_analyst'

    if (!hasVotingTier) {
      return NextResponse.json(
        {
          error: 'Explorer tier or higher required to vote on arguments. Upgrade to participate in community voting.',
          upgrade_required: true
        },
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

    const { vote_type } = body

    // Validate vote_type
    if (!vote_type || !['upvote', 'downvote'].includes(vote_type)) {
      return NextResponse.json(
        { error: 'vote_type must be one of: upvote, downvote' },
        { status: 400 }
      )
    }

    // Verify argument exists and is not deleted
    const { data: argument, error: argError } = await supabase
      .from('arguments')
      .select('id, upvotes_count, downvotes_count')
      .eq('id', argumentId)
      .is('deleted_at', null)
      .single()

    if (argError || !argument) {
      return NextResponse.json(
        { error: 'Argument not found' },
        { status: 404 }
      )
    }

    // Check if user already has a vote on this argument
    const { data: existingVote } = await supabase
      .from('argument_votes')
      .select('id, vote_type')
      .eq('argument_id', argumentId)
      .eq('user_id', user.id)
      .maybeSingle()

    let result
    if (existingVote) {
      // Update existing vote if different
      if (existingVote.vote_type === vote_type) {
        return NextResponse.json({
          success: true,
          message: 'Vote unchanged',
          vote_type,
          action: 'unchanged'
        })
      }

      // Update to new vote type
      const { error: updateError } = await supabase
        .from('argument_votes')
        .update({ vote_type })
        .eq('id', existingVote.id)

      if (updateError) {
        console.error('Error updating vote:', updateError)
        return NextResponse.json(
          { error: 'Failed to update vote' },
          { status: 500 }
        )
      }

      result = { action: 'updated', vote_type }
    } else {
      // Insert new vote
      const { error: insertError } = await supabase
        .from('argument_votes')
        .insert({
          argument_id: argumentId,
          user_id: user.id,
          vote_type
        })

      if (insertError) {
        console.error('Error inserting vote:', insertError)
        return NextResponse.json(
          { error: 'Failed to record vote' },
          { status: 500 }
        )
      }

      result = { action: 'created', vote_type }
    }

    // Fetch updated vote counts (trigger should have updated them)
    const { data: updatedArgument } = await supabase
      .from('arguments')
      .select('upvotes_count, downvotes_count')
      .eq('id', argumentId)
      .single()

    return NextResponse.json({
      success: true,
      ...result,
      counts: {
        upvotes: updatedArgument?.upvotes_count || 0,
        downvotes: updatedArgument?.downvotes_count || 0
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

// DELETE - Remove a vote from an argument
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: argumentId } = await params
    const supabase = await createClient()

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Validate argument ID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(argumentId)) {
      return NextResponse.json(
        { error: 'Invalid argument ID format' },
        { status: 400 }
      )
    }

    // Delete the user's vote (RLS ensures they can only delete their own)
    const { error: deleteError, count } = await supabase
      .from('argument_votes')
      .delete()
      .eq('argument_id', argumentId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting vote:', deleteError)
      return NextResponse.json(
        { error: 'Failed to remove vote' },
        { status: 500 }
      )
    }

    // Fetch updated vote counts
    const { data: updatedArgument } = await supabase
      .from('arguments')
      .select('upvotes_count, downvotes_count')
      .eq('id', argumentId)
      .single()

    return NextResponse.json({
      success: true,
      action: count && count > 0 ? 'removed' : 'not_found',
      counts: {
        upvotes: updatedArgument?.upvotes_count || 0,
        downvotes: updatedArgument?.downvotes_count || 0
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
