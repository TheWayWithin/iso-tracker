'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signUp(formData: FormData) {
  console.log('========= SIGNUP ACTION CALLED =========')
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  console.log('Email:', email, 'Password length:', password?.length)

  if (!email || !password) {
    console.log('ERROR: Missing email or password')
    return
  }

  if (password.length < 8) {
    console.log('ERROR: Password too short')
    return
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      data: {
        display_name: email.split('@')[0],
      },
    },
  })

  console.log('Supabase signUp response:', { data, error })

  if (error) {
    console.log('Signup error:', error.message)
    return
  }

  // Create profile, subscription, and notification_preferences records
  // (Database triggers on auth.users don't work in Supabase - create records manually)
  if (data.user) {
    const userId = data.user.id

    // 1. Create profile
    const { error: profileError } = await supabase.from('profiles').insert({
      id: userId,
      email: email,
      display_name: email.split('@')[0],
    })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Note: User is created in auth, but profile failed - they'll need to retry or we need cleanup
    }

    // 2. Create subscription (free tier by default)
    const { error: subscriptionError } = await supabase.from('subscriptions').insert({
      user_id: userId,
      tier: 'guest',
      status: 'active',
    })

    if (subscriptionError) {
      console.error('Subscription creation error:', subscriptionError)
    }

    // 3. Create notification preferences
    const { error: prefsError } = await supabase.from('notification_preferences').insert({
      user_id: userId,
      email: email,
      unsubscribe_token: crypto.randomUUID(),
      reply_notifications: true,
      evidence_notifications: true,
      observation_window_alerts: false,
    })

    if (prefsError) {
      console.error('Notification preferences creation error:', prefsError)
    }
  }

  console.log('Signup successful, redirecting to dashboard...')
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signIn(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: 'Invalid email or password' }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signOut() {
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    return { error: 'Failed to sign out' }
  }

  revalidatePath('/', 'layout')
  redirect('/auth/sign-in')
}
