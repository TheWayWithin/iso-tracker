'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CreditCard, Calendar, ArrowRight, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface SubscriptionData {
  tier: 'guest' | 'event_pass' | 'evidence_analyst'
  status: 'active' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired'
  stripe_customer_id: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
}

const TIER_INFO = {
  guest: {
    name: 'Spectator',
    description: 'Free access to view evidence and discussions',
    price: 'Free',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  },
  event_pass: {
    name: 'Event Pass',
    description: 'Vote on evidence, receive alerts, join discussions',
    price: '$4.99/mo',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  evidence_analyst: {
    name: 'Evidence Analyst',
    description: 'Full access to evidence framework and all features',
    price: '$9.95/mo',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
}

export default function SubscriptionSettingsPage() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPortalLoading, setIsPortalLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadSubscription()
  }, [])

  const loadSubscription = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('Please sign in to view your subscription')
        setIsLoading(false)
        return
      }

      const { data, error: subError } = await supabase
        .from('subscriptions')
        .select('tier, status, stripe_customer_id, current_period_end, cancel_at_period_end')
        .eq('user_id', user.id)
        .single()

      if (subError) {
        console.error('Error loading subscription:', subError)
        setError('Could not load subscription details')
      } else {
        setSubscription(data)
      }
    } catch (err) {
      console.error('Error:', err)
      setError('An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleManageSubscription = async () => {
    setIsPortalLoading(true)
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to open portal')
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error('Portal error:', err)
      setError('Could not open subscription portal. Please try again.')
      setIsPortalLoading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    )
  }

  if (error && !subscription) {
    return (
      <div className="min-h-screen bg-slate-900 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-300">{error}</p>
            <Link
              href="/auth/sign-in"
              className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const tierInfo = subscription ? TIER_INFO[subscription.tier] : TIER_INFO.guest
  const isActive = subscription?.status === 'active'
  const isPastDue = subscription?.status === 'past_due'
  const isCanceled = subscription?.status === 'canceled'
  const hasStripeSubscription = !!subscription?.stripe_customer_id

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Subscription</h1>
          <p className="text-slate-400">Manage your ISO Tracker subscription</p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-500/50 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Current Plan Card */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden mb-6">
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${tierInfo.bgColor} mb-3`}>
                  <span className={`text-sm font-semibold ${tierInfo.color}`}>
                    {tierInfo.name}
                  </span>
                </div>
                <p className="text-slate-400">{tierInfo.description}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">{tierInfo.price}</p>
              </div>
            </div>

            {/* Status badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {isActive && !subscription?.cancel_at_period_end && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-900/50 text-green-400 text-sm rounded-full">
                  <CheckCircle className="w-4 h-4" />
                  Active
                </span>
              )}
              {subscription?.cancel_at_period_end && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-900/50 text-yellow-400 text-sm rounded-full">
                  <AlertCircle className="w-4 h-4" />
                  Cancels at period end
                </span>
              )}
              {isPastDue && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-900/50 text-red-400 text-sm rounded-full">
                  <AlertCircle className="w-4 h-4" />
                  Payment Past Due
                </span>
              )}
              {isCanceled && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-700 text-gray-400 text-sm rounded-full">
                  Canceled
                </span>
              )}
            </div>

            {/* Billing info */}
            {hasStripeSubscription && subscription?.current_period_end && (
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Calendar className="w-4 h-4" />
                <span>
                  {subscription?.cancel_at_period_end
                    ? `Access until ${formatDate(subscription.current_period_end)}`
                    : `Next billing date: ${formatDate(subscription.current_period_end)}`}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="border-t border-slate-700 p-4 bg-slate-800/50">
            {hasStripeSubscription ? (
              <button
                onClick={handleManageSubscription}
                disabled={isPortalLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isPortalLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Opening Portal...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Manage Subscription
                  </>
                )}
              </button>
            ) : (
              <Link
                href="/#pricing"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Upgrade Your Plan
                <ArrowRight className="w-5 h-5" />
              </Link>
            )}
          </div>
        </div>

        {/* Upgrade prompt for free users */}
        {subscription?.tier === 'guest' && (
          <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-xl border border-blue-500/30 p-6">
            <h3 className="text-xl font-bold text-white mb-2">Unlock More Features</h3>
            <p className="text-slate-300 mb-4">
              Upgrade to Event Pass or Evidence Analyst to vote on evidence, receive alerts, and access the full evidence framework.
            </p>
            <Link
              href="/#pricing"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Plans
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        )}

        {/* Back to settings */}
        <div className="mt-8">
          <Link
            href="/settings/notifications"
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            ← Notification Settings
          </Link>
        </div>
      </div>
    </div>
  )
}
