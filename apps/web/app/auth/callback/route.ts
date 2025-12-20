import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Create user records if they don't exist (for new signups via email or OAuth)
      const userId = data.user.id
      const userEmail = data.user.email || ''
      const displayName = data.user.user_metadata?.full_name ||
                         data.user.user_metadata?.name ||
                         data.user.user_metadata?.display_name ||
                         userEmail.split('@')[0]

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single()

      // Only create records if profile doesn't exist (new user)
      if (!existingProfile) {
        // 1. Create profile
        await supabase.from('profiles').insert({
          id: userId,
          email: userEmail,
          display_name: displayName,
        })

        // 2. Create subscription (free tier by default)
        await supabase.from('subscriptions').insert({
          user_id: userId,
          tier: 'guest',
          status: 'active',
        })

        // 3. Create notification preferences
        await supabase.from('notification_preferences').insert({
          user_id: userId,
          email: userEmail,
          unsubscribe_token: crypto.randomUUID(),
          reply_notifications: true,
          evidence_notifications: true,
          observation_window_alerts: false,
        })
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // If there's an error or no code, redirect to error page
  return NextResponse.redirect(`${origin}/auth/error`)
}
