'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, Clock, ChevronDown } from 'lucide-react'

type Tier = 'free' | 'event-pass' | 'evidence-analyst'
type BillingPeriod = 'monthly' | 'annual'

// Brand colors from brand-style-guide.md
const colors = {
  cosmicDeepBlue: '#0A1628',
  starlightWhite: '#F5F7FA',
  nebulaBlue: '#2E5BFF',
  trajectoryGold: '#FFB84D',
  successGreen: '#10B981',
  warningAmber: '#F59E0B',
  errorRed: '#EF4444',
}

export default function PricingPage() {
  const [selectedTier, setSelectedTier] = useState<Tier>('evidence-analyst')
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('annual')
  const [loading, setLoading] = useState(false)
  const [showTierDropdown, setShowTierDropdown] = useState(false)
  const router = useRouter()

  // Tier configurations
  const tiers = {
    free: {
      name: 'Free',
      icon: '⚠️',
      tagline: 'Basic access to ISO data and community discussions',
      monthlyPrice: '$0',
      annualPrice: '$0',
      annualMonthlyCost: '$0',
      billedAnnually: null,
      savings: null,
      savingsPercent: null,
      recommended: false,
      priceId: null,
      features: [
        'View basic ISO detection data',
        'Read community arguments',
        'Access public orbital visualizations',
        'Join community discussions',
      ],
      comingSoon: [] as string[],
      missingVsAnalyst: [] as string[],
      missingVsEventPass: [
        'Can\'t vote on arguments (spectator only)',
        'Can\'t see evidence citations (don\'t know what\'s proven vs speculation)',
        'Can\'t access 60-second expert summaries (30 mins of reading vs 60 seconds)',
        'Can\'t auto-pause between events (pay year-round for inactive periods)',
        'No access to 3D orbital trajectory visualizations (January 2026)',
        'No access to geocentric viewing modes (January 2026)',
      ],
    },
    'event-pass': {
      name: 'Event Pass',
      icon: '🚀',
      tagline:
        'Auto-Pauses Between Events—You Only Pay When There\'s Something to Analyze',
      monthlyPrice: '$4.99',
      annualPrice: '$49.95',
      annualMonthlyCost: '$4.16',
      billedAnnually: 49.95,
      savings: 9.93,
      savingsPercent: 17,
      recommended: false,
      missingVsEventPass: [] as string[],
      // TEMPORARY WORKAROUND: Hardcoded TEST mode price IDs since env vars not loading correctly
      priceId: {
        monthly: 'price_1SXqsOIiC84gpR8HysaVrxgV', // Event Pass Monthly (TEST)
        annual: 'price_1SXqsOIiC84gpR8HovvfZEQ5',  // Event Pass Annual (TEST)
      },
      features: [
        'Everything in Free, plus:',
        'Auto-pauses between events (only pay during active ISOs)',
        'Vote on arguments with evidence citations',
        'Access 60-second analysis summaries',
        'Understand what 30+ scientists think',
        'Filter arguments by evidence strength',
      ],
      comingSoon: [
        '3D orbital trajectory visualizations (January 2026)',
        'Geocentric viewing modes (January 2026)',
      ],
      missingVsAnalyst: [
        'Your insights vanish when event ends (no permanent record)',
        'Can\'t post your own evidence (read-only analysis)',
        'Can\'t build analyst reputation (anonymous voting)',
        'Can\'t export analysis reports to PDF (January 2026)',
      ],
    },
    'evidence-analyst': {
      name: 'Evidence Analyst',
      icon: '🔬',
      tagline:
        'Earn the Right to Say "I Analyzed This"—Permanent Record in Scientific History',
      recommended: true,
      monthlyPrice: '$9.95',
      annualPrice: '$79.95',
      annualMonthlyCost: '$6.66',
      billedAnnually: 79.95,
      savings: 39.45,
      savingsPercent: 33,
      missingVsEventPass: [] as string[],
      missingVsAnalyst: [] as string[],
      // TEMPORARY WORKAROUND: Hardcoded TEST mode price IDs since env vars not loading correctly
      priceId: {
        monthly: 'price_1SXqxFIiC84gpR8H7Woz8a48', // Evidence Analyst Monthly (TEST)
        annual: 'price_1SXqxFIiC84gpR8HRZivV2bA',  // Evidence Analyst Annual (TEST)
      },
      features: [
        'Everything in Event Pass, plus:',
        'Your analysis preserved forever (even after event ends)',
        'Post evidence with academic citations',
        'Build credible analyst reputation',
        'Access complete evidence framework',
        'Contribute to 3 peer-reviewed papers',
        'Join 15+ universities analyzing ISOs',
      ],
      comingSoon: [
        'Export analysis reports to PDF (January 2026)',
      ],
    },
  }

  const currentTier = tiers[selectedTier]
  const isFree = selectedTier === 'free'
  const isAnnual = billingPeriod === 'annual'

  const displayPrice = isAnnual
    ? currentTier.annualMonthlyCost || currentTier.annualPrice
    : currentTier.monthlyPrice
  const period = isFree ? '' : '/mo'
  const billedText =
    isAnnual && currentTier.billedAnnually
      ? `billed $${currentTier.billedAnnually.toFixed(2)} annually`
      : 'billed monthly'

  const handleCheckout = async () => {
    if (isFree) {
      router.push('/auth/sign-up')
      return
    }

    const priceId = isAnnual
      ? currentTier.priceId?.annual
      : currentTier.priceId?.monthly

    if (!priceId) return

    setLoading(true)
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          router.push(
            `/auth/sign-in?redirect=/pricing&plan=${encodeURIComponent(currentTier.name)}`
          )
          return
        }
        throw new Error(data.error || 'Something went wrong')
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8"
      style={{ background: colors.starlightWhite }}
    >
      {/* Header */}
      <div className="text-center">
        <h1
          className="text-4xl font-extrabold sm:text-5xl"
          style={{ color: colors.cosmicDeepBlue }}
        >
          Evidence-Based ISO Analysis
        </h1>
        <p
          className="mt-4 text-xl"
          style={{ color: colors.cosmicDeepBlue, opacity: 0.7 }}
        >
          Understand What We Know vs. What We're Speculating About
        </p>
      </div>

      {/* Step indicator */}
      <div
        className="mt-12 rounded-lg px-6 py-4"
        style={{
          background: `${colors.nebulaBlue}15`,
          border: `1px solid ${colors.nebulaBlue}`,
        }}
      >
        <p className="text-sm font-medium" style={{ color: colors.cosmicDeepBlue }}>
          Step 1 of 2: Choose your plan first, then we'll securely connect your
          account.
        </p>
      </div>

      {/* Billing Frequency Toggle */}
      <div className="mt-8">
        <p className="mb-3 text-sm font-medium" style={{ color: colors.cosmicDeepBlue }}>
          Billing Frequency:
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className="flex-1 rounded-lg border-2 px-6 py-3 text-center font-semibold transition-all"
            style={{
              background: !isAnnual ? colors.nebulaBlue : '#FFFFFF',
              borderColor: !isAnnual ? colors.nebulaBlue : '#E5E7EB',
              color: !isAnnual ? '#FFFFFF' : colors.cosmicDeepBlue,
            }}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingPeriod('annual')}
            className="flex-1 rounded-lg border-2 px-6 py-3 text-center font-semibold transition-all"
            style={{
              background: isAnnual ? colors.nebulaBlue : '#FFFFFF',
              borderColor: isAnnual ? colors.nebulaBlue : '#E5E7EB',
              color: isAnnual ? '#FFFFFF' : colors.cosmicDeepBlue,
            }}
          >
            Annual ✓
          </button>
        </div>
        {!isFree && currentTier.savings && isAnnual && (
          <p className="mt-2 text-sm font-medium" style={{ color: colors.successGreen }}>
            💰 Save up to ${currentTier.savings.toFixed(2)}/year with annual
            billing
          </p>
        )}
        {!isFree && !isAnnual && currentTier.savings && (
          <p
            className="mt-2 text-sm"
            style={{ color: colors.cosmicDeepBlue, opacity: 0.6 }}
          >
            Switch to annual to save up to ${currentTier.savings.toFixed(2)}
            /year
          </p>
        )}
      </div>

      {/* Tier Selector */}
      <div className="relative mt-6">
        <button
          onClick={() => setShowTierDropdown(!showTierDropdown)}
          className="w-full rounded-lg border-2 px-6 py-4 text-left transition-colors"
          style={{ borderColor: '#E5E7EB', background: '#FFFFFF' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{currentTier.icon}</span>
                <span
                  className="text-lg font-bold"
                  style={{ color: colors.cosmicDeepBlue }}
                >
                  {currentTier.name}
                </span>
                {currentTier.recommended && (
                  <span
                    className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide"
                    style={{
                      background: `${colors.trajectoryGold}20`,
                      color: '#B45309',
                    }}
                  >
                    Recommended
                  </span>
                )}
              </div>
              <p
                className="mt-1 text-sm"
                style={{ color: colors.cosmicDeepBlue, opacity: 0.7 }}
              >
                {currentTier.tagline}
              </p>
            </div>
            <ChevronDown
              className={`h-5 w-5 transition-transform ${showTierDropdown ? 'rotate-180' : ''}`}
              style={{ color: '#9CA3AF' }}
            />
          </div>
        </button>

        {showTierDropdown && (
          <div
            className="absolute z-10 mt-2 w-full rounded-lg border shadow-lg"
            style={{ borderColor: '#E5E7EB', background: '#FFFFFF' }}
          >
            {(['evidence-analyst', 'event-pass', 'free'] as const).map((tier) => (
              <button
                key={tier}
                onClick={() => {
                  setSelectedTier(tier)
                  setShowTierDropdown(false)
                }}
                className="w-full border-b px-6 py-4 text-left transition-colors last:border-b-0 hover:bg-gray-50"
                style={{
                  background: selectedTier === tier ? `${colors.nebulaBlue}10` : undefined,
                  borderColor: '#F3F4F6',
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{tiers[tier].icon}</span>
                  <span
                    className="font-semibold"
                    style={{ color: colors.cosmicDeepBlue }}
                  >
                    {tiers[tier].name}
                  </span>
                  {tiers[tier].recommended && (
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wide"
                      style={{
                        background: `${colors.trajectoryGold}20`,
                        color: '#B45309',
                      }}
                    >
                      Recommended
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm" style={{ color: '#6B7280' }}>
                  {tiers[tier].monthlyPrice}
                  {tier !== 'free' && '/mo'}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Price Display */}
      <div className="mt-8 text-center">
        <div
          className="text-5xl font-extrabold"
          style={{ color: colors.cosmicDeepBlue }}
        >
          {displayPrice}
          {period}
        </div>
        {!isFree && (
          <p className="mt-2 text-sm" style={{ color: '#6B7280' }}>
            {billedText}
          </p>
        )}
        {!isFree && isAnnual && currentTier.savings && (
          <p className="mt-1 text-sm font-semibold" style={{ color: colors.successGreen }}>
            💰 Save ${currentTier.savings.toFixed(2)}/year (
            {currentTier.savingsPercent}% discount)
          </p>
        )}
      </div>

      {/* Tier Description Box */}
      <div
        className="mt-8 rounded-lg border-2 px-6 py-4"
        style={{
          borderColor: colors.nebulaBlue,
          background: `${colors.nebulaBlue}08`,
        }}
      >
        <div className="flex items-start gap-3">
          <span className="text-3xl">{currentTier.icon}</span>
          <div>
            <h3
              className="text-lg font-bold"
              style={{ color: colors.cosmicDeepBlue }}
            >
              {currentTier.name}
            </h3>
            <p className="mt-1 text-sm" style={{ color: colors.cosmicDeepBlue, opacity: 0.8 }}>
              {currentTier.tagline}
            </p>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <button
        onClick={handleCheckout}
        disabled={loading}
        className="mt-6 w-full rounded-lg py-4 text-lg font-bold transition-colors disabled:opacity-50"
        style={{
          background: colors.nebulaBlue,
          color: '#FFFFFF',
        }}
      >
        {loading
          ? 'Loading...'
          : isFree
            ? 'Get Started Free →'
            : 'Join Now'}
      </button>

      {!isFree && (
        <p className="mt-3 text-center text-sm" style={{ color: '#6B7280' }}>
          Try free for 7 days
        </p>
      )}

      {/* Features List */}
      <div className="mt-8">
        <h4
          className="mb-4 text-sm font-semibold uppercase tracking-wide"
          style={{ color: '#6B7280' }}
        >
          What You Get:
        </h4>
        <ul className="space-y-3">
          {currentTier.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <Check className="h-5 w-5 flex-shrink-0" style={{ color: colors.successGreen }} />
              <span className="text-sm" style={{ color: colors.cosmicDeepBlue }}>
                {feature}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Coming Soon Features */}
      {currentTier.comingSoon && currentTier.comingSoon.length > 0 && (
        <div className="mt-6">
          <h4
            className="mb-4 text-sm font-semibold uppercase tracking-wide"
            style={{ color: colors.nebulaBlue }}
          >
            Coming Soon:
          </h4>
          <ul className="space-y-3">
            {currentTier.comingSoon.map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <Clock className="h-5 w-5 flex-shrink-0" style={{ color: colors.nebulaBlue }} />
                <span className="text-sm" style={{ color: colors.cosmicDeepBlue }}>
                  {feature}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* What You're Missing (for Free tier) */}
      {selectedTier === 'free' && currentTier.missingVsEventPass && (
        <div
          className="mt-6 rounded-lg p-6"
          style={{
            background: `${colors.warningAmber}15`,
            border: `1px solid ${colors.warningAmber}`,
          }}
        >
          <h4
            className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide"
            style={{ color: '#92400E' }}
          >
            <span>⚠️</span>
            <span>Free tier vs Event Pass tier comparison</span>
          </h4>
          <ul className="space-y-2">
            {currentTier.missingVsEventPass.map((item, index) => (
              <li key={index} className="flex items-start gap-3">
                <X className="h-5 w-5 flex-shrink-0" style={{ color: colors.warningAmber }} />
                <span className="text-sm" style={{ color: colors.cosmicDeepBlue }}>
                  {item}
                </span>
              </li>
            ))}
          </ul>
          <p
            className="mt-4 text-center text-sm italic"
            style={{ color: '#6B7280' }}
          >
            💡 Event Pass is only ${tiers['event-pass'].annualMonthlyCost}/mo on
            annual billing
          </p>
        </div>
      )}

      {/* What You're Missing (for Event Pass tier) */}
      {selectedTier === 'event-pass' && currentTier.missingVsAnalyst && (
        <div
          className="mt-6 rounded-lg p-6"
          style={{
            background: `${colors.warningAmber}15`,
            border: `1px solid ${colors.warningAmber}`,
          }}
        >
          <h4
            className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide"
            style={{ color: '#92400E' }}
          >
            <span>⚠️</span>
            <span>Event Pass vs Evidence Analyst comparison</span>
          </h4>
          <ul className="space-y-2">
            {currentTier.missingVsAnalyst.map((item, index) => (
              <li key={index} className="flex items-start gap-3">
                <X className="h-5 w-5 flex-shrink-0" style={{ color: colors.warningAmber }} />
                <span className="text-sm" style={{ color: colors.cosmicDeepBlue }}>
                  {item}
                </span>
              </li>
            ))}
          </ul>
          <p
            className="mt-4 text-center text-sm italic"
            style={{ color: '#6B7280' }}
          >
            💡 Evidence Analyst is only $
            {(
              parseFloat(tiers['evidence-analyst'].annualMonthlyCost?.replace('$', '') || '0') -
              parseFloat(currentTier.annualMonthlyCost?.replace('$', '') || '0')
            ).toFixed(2)}
            /mo more on annual billing
          </p>
        </div>
      )}

      {/* Annual Savings Breakdown */}
      {!isFree && isAnnual && currentTier.savings && (
        <div
          className="mt-6 rounded-lg border-2 p-6"
          style={{
            borderColor: colors.successGreen,
            background: `${colors.successGreen}10`,
          }}
        >
          <h4
            className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide"
            style={{ color: '#065F46' }}
          >
            <span>💰</span>
            <span>Annual Savings Breakdown</span>
          </h4>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span style={{ color: colors.cosmicDeepBlue }}>
                Monthly billing (12 months)
              </span>
              <span
                className="font-semibold"
                style={{ color: colors.cosmicDeepBlue }}
              >
                $
                {(
                  parseFloat(currentTier.monthlyPrice.replace('$', '')) * 12
                ).toFixed(2)}
                /year
              </span>
            </div>
            <div className="flex justify-between">
              <span
                className="font-semibold"
                style={{ color: colors.successGreen }}
              >
                Annual billing
              </span>
              <span
                className="font-semibold"
                style={{ color: colors.successGreen }}
              >
                ${currentTier.billedAnnually?.toFixed(2)}/year
              </span>
            </div>
            <div
              className="border-t pt-3"
              style={{ borderColor: `${colors.successGreen}40` }}
            >
              <div className="flex justify-between">
                <span className="font-bold" style={{ color: '#065F46' }}>
                  You save
                </span>
                <span className="font-bold" style={{ color: '#065F46' }}>
                  ${currentTier.savings.toFixed(2)}/year (
                  {currentTier.savingsPercent}% discount)
                </span>
              </div>
            </div>
            <div
              className="mt-4 border-t pt-3"
              style={{ borderColor: `${colors.successGreen}40` }}
            >
              <div className="flex justify-between">
                <span style={{ color: colors.cosmicDeepBlue }}>
                  Cost per month
                </span>
                <span
                  className="font-semibold"
                  style={{ color: colors.cosmicDeepBlue }}
                >
                  ${currentTier.annualMonthlyCost}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Money-back guarantee */}
      {!isFree && (
        <p className="mt-6 text-center text-sm" style={{ color: '#6B7280' }}>
          30-day money-back guarantee • Cancel anytime, no questions asked
        </p>
      )}

      {/* Social Proof */}
      <div className="mt-16 border-t pt-12" style={{ borderColor: '#E5E7EB' }}>
        <div className="grid gap-8 text-center md:grid-cols-3">
          <div>
            <div
              className="text-3xl font-bold"
              style={{ color: colors.cosmicDeepBlue }}
            >
              3
            </div>
            <div className="mt-2 text-sm" style={{ color: '#6B7280' }}>
              Peer-reviewed papers
            </div>
          </div>
          <div>
            <div
              className="text-3xl font-bold"
              style={{ color: colors.cosmicDeepBlue }}
            >
              15+
            </div>
            <div className="mt-2 text-sm" style={{ color: '#6B7280' }}>
              Universities analyzing ISOs
            </div>
          </div>
          <div>
            <div
              className="text-3xl font-bold"
              style={{ color: colors.cosmicDeepBlue }}
            >
              98%
            </div>
            <div className="mt-2 text-sm" style={{ color: '#6B7280' }}>
              Retention rate
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
