import Stripe from 'stripe'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const stripeKey = process.env.STRIPE_SECRET_KEY
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

// Use service role for webhook (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Map Stripe price IDs to subscription tiers
// TEMPORARY: Hardcoded TEST mode price IDs
const PRICE_TO_TIER: Record<string, 'event_pass' | 'evidence_analyst'> = {
  // TEST mode prices
  'price_1SXqsOIiC84gpR8HysaVrxgV': 'event_pass',      // Event Pass Monthly
  'price_1SXqsOIiC84gpR8HovvfZEQ5': 'event_pass',      // Event Pass Annual
  'price_1SXqxFIiC84gpR8H7Woz8a48': 'evidence_analyst', // Evidence Analyst Monthly
  'price_1SXqxFIiC84gpR8HRZivV2bA': 'evidence_analyst', // Evidence Analyst Annual
  // LIVE mode prices (add before production)
  // 'price_1SXKwiIiC84gpR8HwTjbwBct': 'event_pass',
  // 'price_1SXKwiIiC84gpR8HOdkFFchm': 'event_pass',
  // 'price_1SXKzxIiC84gpR8HYQXRjUZp': 'evidence_analyst',
  // 'price_1SXKzxIiC84gpR8H5dJFNv7p': 'evidence_analyst',
}

export async function POST(request: Request) {
  console.log('========== STRIPE WEBHOOK START ==========')

  if (!stripeKey) {
    console.error('[WEBHOOK] STRIPE_SECRET_KEY not configured')
    return NextResponse.json({ error: 'Payment system not configured' }, { status: 500 })
  }

  const stripe = new Stripe(stripeKey, {
    apiVersion: '2025-02-24.acacia',
  })

  // Get the raw body for signature verification
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  let event: Stripe.Event

  // Verify webhook signature (CRITICAL for security)
  try {
    if (webhookSecret && signature) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      console.log('[WEBHOOK] Signature verified')
    } else {
      // In development without webhook secret, parse directly
      // WARNING: This is insecure for production!
      console.warn('[WEBHOOK] No webhook secret configured - parsing without verification')
      event = JSON.parse(body) as Stripe.Event
    }
  } catch (err) {
    console.error('[WEBHOOK] Signature verification failed:', err)
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    )
  }

  console.log('[WEBHOOK] Event type:', event.type)
  console.log('[WEBHOOK] Event ID:', event.id)

  // Initialize Supabase with service role (bypasses RLS)
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        console.log('[WEBHOOK] Checkout session completed:', session.id)

        await handleCheckoutComplete(supabase, stripe, session)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        console.log('[WEBHOOK] Subscription updated:', subscription.id)

        await handleSubscriptionUpdate(supabase, subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        console.log('[WEBHOOK] Subscription deleted:', subscription.id)

        await handleSubscriptionDeleted(supabase, subscription)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        console.log('[WEBHOOK] Payment failed for invoice:', invoice.id)

        await handlePaymentFailed(supabase, invoice)
        break
      }

      default:
        console.log('[WEBHOOK] Unhandled event type:', event.type)
    }

    console.log('========== STRIPE WEBHOOK SUCCESS ==========')
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('========== STRIPE WEBHOOK ERROR ==========')
    console.error('[WEBHOOK] Error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle successful checkout - create or update subscription
 */
async function handleCheckoutComplete(
  supabase: SupabaseClient,
  stripe: Stripe,
  session: Stripe.Checkout.Session
) {
  console.log('[CHECKOUT] Processing session:', {
    id: session.id,
    customer: session.customer,
    subscription: session.subscription,
    customerEmail: session.customer_email,
    clientReferenceId: session.client_reference_id,
  })

  // Get the subscription details from Stripe
  const subscriptionId = session.subscription as string
  if (!subscriptionId) {
    console.error('[CHECKOUT] No subscription ID in session')
    return
  }

  const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId)
  const priceId = stripeSubscription.items.data[0]?.price.id
  const tier = priceId ? PRICE_TO_TIER[priceId] : null

  if (!tier) {
    console.error('[CHECKOUT] Unknown price ID:', priceId)
    return
  }

  // Get user ID from session metadata or client_reference_id
  const userId = session.client_reference_id || session.metadata?.user_id

  if (!userId) {
    console.error('[CHECKOUT] No user ID found in session')
    console.log('[CHECKOUT] This might be an unauthenticated checkout - user needs to be linked manually')
    // TODO: Handle unauthenticated checkout by matching customer email to user
    return
  }

  console.log('[CHECKOUT] Updating subscription for user:', userId, 'to tier:', tier)

  // Update the subscription in database
  const { error } = await supabase
    .from('subscriptions')
    .update({
      tier,
      status: 'active',
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: subscriptionId,
      stripe_price_id: priceId,
      current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: stripeSubscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  if (error) {
    console.error('[CHECKOUT] Failed to update subscription:', error)
    throw error
  }

  console.log('[CHECKOUT] Subscription updated successfully')
}

/**
 * Handle subscription updates (plan changes, renewals)
 */
async function handleSubscriptionUpdate(
  supabase: SupabaseClient,
  subscription: Stripe.Subscription
) {
  const priceId = subscription.items.data[0]?.price.id
  const tier = priceId ? PRICE_TO_TIER[priceId] : null
  const customerId = subscription.customer as string

  console.log('[SUB_UPDATE] Processing:', {
    subscriptionId: subscription.id,
    customerId,
    priceId,
    tier,
    status: subscription.status,
  })

  // Find user by Stripe customer ID
  const { data: existingSub, error: findError } = await supabase
    .from('subscriptions')
    .select('id, user_id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (findError || !existingSub) {
    console.error('[SUB_UPDATE] Could not find subscription for customer:', customerId)
    return
  }

  // Map Stripe status to our status
  let status: 'active' | 'canceled' | 'past_due' = 'active'
  if (subscription.status === 'canceled') {
    status = 'canceled'
  } else if (subscription.status === 'past_due') {
    status = 'past_due'
  }

  // Update subscription
  const updateData: Record<string, unknown> = {
    status,
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  }

  // Only update tier if we have a valid mapping
  if (tier) {
    updateData.tier = tier
  }

  const { error } = await supabase
    .from('subscriptions')
    .update(updateData)
    .eq('id', existingSub.id)

  if (error) {
    console.error('[SUB_UPDATE] Failed to update:', error)
    throw error
  }

  console.log('[SUB_UPDATE] Updated successfully')
}

/**
 * Handle subscription cancellation - downgrade to guest
 */
async function handleSubscriptionDeleted(
  supabase: SupabaseClient,
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string
  console.log('[SUB_DELETE] Processing cancellation for customer:', customerId)

  // Find and downgrade user
  const { error } = await supabase
    .from('subscriptions')
    .update({
      tier: 'guest',
      status: 'canceled',
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customerId)

  if (error) {
    console.error('[SUB_DELETE] Failed to downgrade:', error)
    throw error
  }

  console.log('[SUB_DELETE] User downgraded to guest tier')
}

/**
 * Handle failed payment - mark as past_due
 */
async function handlePaymentFailed(
  supabase: SupabaseClient,
  invoice: Stripe.Invoice
) {
  const customerId = invoice.customer as string
  console.log('[PAYMENT_FAILED] Processing for customer:', customerId)

  // Mark subscription as past_due
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customerId)

  if (error) {
    console.error('[PAYMENT_FAILED] Failed to update status:', error)
    throw error
  }

  console.log('[PAYMENT_FAILED] Subscription marked as past_due')
  // TODO: Send email notification about failed payment
}
