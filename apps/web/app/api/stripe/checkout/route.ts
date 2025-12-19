import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  console.log('========== CHECKOUT ROUTE START ==========')

  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    console.error('[1] STRIPE_SECRET_KEY not configured')
    return NextResponse.json({ error: 'Payment system not configured' }, { status: 500 })
  }
  console.log('[1] Stripe key loaded from environment')

  // Initialize Stripe inside the function to avoid build-time errors
  console.log('[2] Initializing Stripe...')
  const stripe = new Stripe(stripeKey, {
    apiVersion: '2024-11-20.acacia',
  })
  console.log('[2] Stripe initialized successfully')

  try {
    // 1. Check authentication (OPTIONAL - allow unauthenticated checkout)
    console.log('[3] Checking authentication...')
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    console.log('[3] Auth result:', {
      hasUser: !!user,
      userEmail: user?.email || null,
      authError: authError?.message || null
    })

    // 2. Parse and validate request
    console.log('[4] Parsing request body...')
    const body = await request.json()
    console.log('[4] RAW BODY RECEIVED:', JSON.stringify(body, null, 2))

    const { priceId, email } = body
    console.log('[4] Extracted priceId:', priceId)
    console.log('[4] Extracted email:', email)
    console.log('[4] User email:', user?.email || 'NO USER')

    if (!priceId) {
      console.log('[4] VALIDATION FAILED: No price ID provided')
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      )
    }

    // Validate email for unauthenticated users
    const customerEmail = user?.email || email
    console.log('[4] Determined customer email:', customerEmail)
    console.log('[4] Email validation:', {
      hasUser: !!user,
      userEmail: user?.email || null,
      requestEmail: email || null,
      finalEmail: customerEmail || null
    })

    if (!customerEmail) {
      console.log('[4] VALIDATION FAILED: No email available for checkout')
      console.log('[4] Returning 400 error: Email is required')
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }
    console.log('[4] Email validation PASSED, using:', customerEmail)

    // 3. Verify price ID is valid (security: whitelist only our price IDs)
    console.log('[5] Validating price ID...')
    // TEMPORARY WORKAROUND: Hardcoded TEST mode price IDs since env vars not loading correctly
    // TODO: Fix environment variable loading before production deployment
    const validPriceIds = [
      'price_1SXqsOIiC84gpR8HysaVrxgV', // Event Pass Monthly (TEST)
      'price_1SXqsOIiC84gpR8HovvfZEQ5', // Event Pass Annual (TEST)
      'price_1SXqxFIiC84gpR8H7Woz8a48', // Evidence Analyst Monthly (TEST)
      'price_1SXqxFIiC84gpR8HRZivV2bA', // Evidence Analyst Annual (TEST)
    ]
    console.log('[5] Valid price IDs (hardcoded TEST):', validPriceIds)

    if (!validPriceIds.includes(priceId)) {
      console.log('[5] Invalid price ID - not in whitelist')
      return NextResponse.json(
        { error: 'Invalid price ID' },
        { status: 400 }
      )
    }
    console.log('[5] Price ID is valid')

    // 4. Create Stripe Checkout session
    console.log('[6] Creating Stripe checkout session...')
    console.log('[6] Session config:', {
      mode: 'subscription',
      priceId,
      email: customerEmail,
      userId: user?.id || 'unauthenticated',
      isAuthenticated: !!user,
    })

    // Build session config based on authentication state
    const sessionConfig: any = {
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `http://localhost:3000/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:3000/pricing`,
      customer_email: customerEmail,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    }

    // Add user metadata only if authenticated
    if (user) {
      sessionConfig.client_reference_id = user.id
      sessionConfig.metadata = { user_id: user.id }
      sessionConfig.subscription_data = {
        metadata: { user_id: user.id },
      }
    } else {
      // For unauthenticated users, mark as pending signup
      sessionConfig.metadata = { pending_signup: 'true' }
      sessionConfig.subscription_data = {
        metadata: { pending_signup: 'true' },
      }
    }

    const session = await stripe.checkout.sessions.create(sessionConfig)

    console.log('[6] Session created successfully:', session.id)
    console.log('[7] Returning checkout URL:', session.url)
    console.log('========== CHECKOUT ROUTE SUCCESS ==========')
    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('========== CHECKOUT ROUTE ERROR ==========')
    console.error('[ERROR] Type:', error instanceof Error ? error.constructor.name : typeof error)
    console.error('[ERROR] Message:', error instanceof Error ? error.message : String(error))
    console.error('[ERROR] Stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('[ERROR] Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
    console.error('========== CHECKOUT ROUTE ERROR END ==========')
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
