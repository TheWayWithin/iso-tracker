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
    },
  })

  console.log('Supabase signUp response:', { data, error })

  if (error) {
    console.log('Signup error:', error.message)
    return
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
