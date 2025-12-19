import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const stripeKey = process.env.STRIPE_SECRET_KEY

export async function POST() {
  console.log('========== STRIPE PORTAL START ==========')

  if (!stripeKey) {
    console.error('[PORTAL] STRIPE_SECRET_KEY not configured')
    return NextResponse.json({ error: 'Payment system not configured' }, { status: 500 })
  }

  const stripe = new Stripe(stripeKey, {
    apiVersion: '2024-11-20.acacia',
  })

  try {
    // 1. Verify user is authenticated
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log('[PORTAL] User not authenticated')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.log('[PORTAL] User:', user.id)

    // 2. Get user's Stripe customer ID from subscriptions table
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (subError || !subscription?.stripe_customer_id) {
      console.log('[PORTAL] No Stripe customer found for user')
      return NextResponse.json(
        { error: 'No subscription found. Please subscribe first.' },
        { status: 400 }
      )
    }

    console.log('[PORTAL] Customer ID:', subscription.stripe_customer_id)

    // 3. Create Stripe Customer Portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/settings/subscription`,
    })

    console.log('[PORTAL] Session created:', session.id)
    console.log('========== STRIPE PORTAL SUCCESS ==========')

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('========== STRIPE PORTAL ERROR ==========')
    console.error('[PORTAL] Error:', error)
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    )
  }
}
