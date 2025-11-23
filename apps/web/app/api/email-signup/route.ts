import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Create a simple Supabase client for public endpoints (no auth required)
function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, source = '3i-atlas.live' } = body

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const trimmedEmail = email.trim().toLowerCase()

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Get referrer from headers
    const headersList = await headers()
    const referrer = headersList.get('referer') || null

    const supabase = getSupabaseClient()

    // Insert email signup
    const { data, error } = await supabase
      .from('email_signups')
      .insert({
        email: trimmedEmail,
        source,
        referrer
      })
      .select('id')
      .single()

    if (error) {
      // Handle duplicate email
      if (error.code === '23505') {
        return NextResponse.json(
          { message: 'You are already signed up for updates!' },
          { status: 200 }
        )
      }

      console.error('Email signup error:', error)
      return NextResponse.json(
        { error: 'Failed to save email' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Successfully signed up for updates!',
      id: data.id
    })
  } catch (error) {
    console.error('Email signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
