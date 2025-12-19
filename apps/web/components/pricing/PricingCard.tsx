'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, Clock } from 'lucide-react'
import { AuthModal } from '@/components/auth/AuthModal'

interface PricingCardProps {
  title: string
  description: string
  price: string
  priceId?: string
  period: string
  features: string[]
  missingFeatures?: string[]
  comingSoonFeatures?: string[]
  ctaText: string
  ctaSubtext?: string
  highlighted?: boolean
  savings?: string
  isFree?: boolean
}

export function PricingCard({
  title,
  description,
  price,
  priceId,
  period,
  features,
  missingFeatures,
  comingSoonFeatures,
  ctaText,
  ctaSubtext,
  highlighted = false,
  savings,
  isFree = false,
}: PricingCardProps) {
  const [loading, setLoading] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const router = useRouter()

  // Proceed to Stripe checkout (called after auth or if already authenticated)
  const proceedToCheckout = async () => {
    console.log('[CLIENT] Proceeding to checkout for price:', priceId)
    setLoading(true)
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('[CLIENT] Checkout failed:', data)
        throw new Error(data.error || 'Something went wrong')
      }

      if (data.url) {
        console.log('[CLIENT] Redirecting to Stripe:', data.url)
        window.location.href = data.url
      } else {
        console.error('[CLIENT] No checkout URL in response')
      }
    } catch (error) {
      console.error('[CLIENT] Checkout error:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckout = async () => {
    if (isFree) {
      router.push('/auth/sign-up')
      return
    }

    console.log('[CLIENT] Starting checkout for price:', priceId)
    setLoading(true)

    try {
      // First, check if user is authenticated by trying checkout
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      })

      const data = await response.json()

      // If user needs to authenticate, show auth modal
      if (!response.ok && (data.error === 'Email is required' || response.status === 401)) {
        console.log('[CLIENT] Auth required, showing modal...')
        setLoading(false)
        setShowAuthModal(true)
        return
      }

      if (!response.ok) {
        console.error('[CLIENT] Checkout failed:', data)
        throw new Error(data.error || 'Something went wrong')
      }

      if (data.url) {
        console.log('[CLIENT] Redirecting to Stripe:', data.url)
        window.location.href = data.url
      } else {
        console.error('[CLIENT] No checkout URL in response')
      }
    } catch (error) {
      console.error('[CLIENT] Checkout error:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleAuthSuccess = () => {
    console.log('[CLIENT] Auth successful, proceeding to checkout')
    setShowAuthModal(false)
    // Small delay to ensure session is established
    setTimeout(() => {
      proceedToCheckout()
    }, 500)
  }

  return (
    <div
      className={`relative rounded-lg border-2 p-8 ${
        highlighted
          ? 'border-blue-500 bg-blue-50/50 shadow-lg'
          : 'border-gray-200 bg-white'
      }`}
    >
      {highlighted && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-blue-500 px-4 py-1 text-sm font-semibold text-white">
          Recommended
        </div>
      )}
      {savings && (
        <div className="absolute -right-3 top-6 rounded-full bg-green-500 px-3 py-1 text-xs font-bold text-white shadow-md">
          {savings}
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm text-gray-600">{description}</p>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline">
          <span className="text-4xl font-extrabold text-gray-900">{price}</span>
          {!isFree && (
            <span className="ml-2 text-lg text-gray-600">{period}</span>
          )}
        </div>
        {ctaSubtext && (
          <p className="mt-2 text-sm text-gray-500">{ctaSubtext}</p>
        )}
      </div>

      <button
        onClick={handleCheckout}
        disabled={loading}
        className={`w-full rounded-lg py-3 px-4 font-semibold transition-colors ${
          highlighted
            ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400'
            : 'bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-400'
        }`}
      >
        {loading ? 'Loading...' : ctaText}
      </button>

      <ul className="mt-8 space-y-3">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <Check className="h-5 w-5 flex-shrink-0 text-green-500" />
            <span className="text-sm text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>

      {comingSoonFeatures && comingSoonFeatures.length > 0 && (
        <div className="mt-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-blue-600">
            Coming Soon
          </p>
          <ul className="space-y-3">
            {comingSoonFeatures.map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <Clock className="h-5 w-5 flex-shrink-0 text-blue-500" />
                <span className="text-sm text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {missingFeatures && missingFeatures.length > 0 && (
        <div className="mt-6 rounded-lg bg-gray-50 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            What You're Missing
          </p>
          <ul className="space-y-2">
            {missingFeatures.map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <X className="h-5 w-5 flex-shrink-0 text-gray-400" />
                <span className="text-sm text-gray-600">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!isFree && (
        <p className="mt-6 text-center text-xs text-gray-500">
          30-day money-back guarantee • Cancel anytime
        </p>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        title="Create your account"
        subtitle={`Sign up to get ${title}`}
      />
    </div>
  )
}
