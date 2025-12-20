'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthModal } from '@/components/auth/AuthModal'

// TEMPORARY WORKAROUND: Hardcoded TEST mode price IDs since env vars not loading correctly
// TODO: Fix environment variable loading before production deployment
const PRICE_IDS = {
  eventPass: {
    monthly: 'price_1SXqsOIiC84gpR8HysaVrxgV', // Event Pass Monthly (TEST)
    annual: 'price_1SXqsOIiC84gpR8HovvfZEQ5',  // Event Pass Annual (TEST)
  },
  evidenceAnalyst: {
    monthly: 'price_1SXqxFIiC84gpR8H7Woz8a48', // Evidence Analyst Monthly (TEST)
    annual: 'price_1SXqxFIiC84gpR8HRZivV2bA',  // Evidence Analyst Annual (TEST)
  },
}

export default function Home() {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [selectedTier, setSelectedTier] = useState<'event-pass' | 'evidence-analyst' | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Handle subscribe button click
  const handleSubscribe = async (tier: 'event-pass' | 'evidence-analyst') => {
    setSelectedTier(tier)
    setIsLoading(true)

    // Get the correct price ID
    const priceId = tier === 'event-pass'
      ? (billingInterval === 'annual' ? PRICE_IDS.eventPass.annual : PRICE_IDS.eventPass.monthly)
      : (billingInterval === 'annual' ? PRICE_IDS.evidenceAnalyst.annual : PRICE_IDS.evidenceAnalyst.monthly)

    try {
      // Try checkout - if user is authenticated, it will work
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })

      const data = await response.json()

      // If auth required, show modal
      if (!response.ok && (data.error === 'Email is required' || response.status === 401)) {
        setIsLoading(false)
        setShowAuthModal(true)
        return
      }

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong')
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Something went wrong. Please try again.')
      setIsLoading(false)
    }
  }

  // After auth success, proceed to checkout
  const handleAuthSuccess = async () => {
    setShowAuthModal(false)
    if (!selectedTier) return

    setIsLoading(true)
    const priceId = selectedTier === 'event-pass'
      ? (billingInterval === 'annual' ? PRICE_IDS.eventPass.annual : PRICE_IDS.eventPass.monthly)
      : (billingInterval === 'annual' ? PRICE_IDS.evidenceAnalyst.annual : PRICE_IDS.evidenceAnalyst.monthly)

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-xl font-bold text-white">ISO Tracker</span>
            </Link>

            {/* Auth Buttons */}
            <div className="flex items-center gap-3">
              <Link
                href="/auth/sign-in"
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/sign-up"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 relative">
        {/* Star field overlay */}
        <div className="absolute inset-0 star-field opacity-60" />
        <div className="text-center relative z-10">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Are We Alone?
            <span className="block text-blue-400">Track the Answer.</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8">
            Something is passing through our solar system. Thousands are already watching. Join them.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/sign-up"
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Start Free - View Evidence
            </Link>
            <Link
              href="/auth/sign-in"
              className="inline-flex items-center justify-center px-8 py-3 border border-slate-600 text-base font-medium rounded-md text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="bg-slate-800/50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Why ISO Tracker?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700">
              <div className="text-blue-400 text-2xl mb-4">📡</div>
              <h3 className="text-xl font-semibold text-white mb-3">Live Sky Tracking</h3>
              <p className="text-slate-400">
                Watch interstellar visitors cross your sky. Real-time positions, updated every minute.
              </p>
            </div>
            <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700">
              <div className="text-blue-400 text-2xl mb-4">🔭</div>
              <h3 className="text-xl font-semibold text-white mb-3">Observation Planning</h3>
              <p className="text-slate-400">
                Know exactly when and where to look tonight. Custom alerts for optimal viewing from your location.
              </p>
            </div>
            <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700">
              <div className="text-blue-400 text-2xl mb-4">🗳️</div>
              <h3 className="text-xl font-semibold text-white mb-3">Community Debate</h3>
              <p className="text-slate-400">
                Cast your vote: alien or natural? Join 12,000+ observers analyzing the evidence together.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Evidence Framework Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Go Beyond Speculation: The Evidence Framework
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Not just opinions - a structured approach to evaluate evidence scientifically.
              Every assessment follows the same rigorous methodology.
            </p>
          </div>

          {/* Two-Step Process */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Step 1: Assess Quality */}
            <div className="bg-slate-800/50 rounded-xl p-8 border border-slate-700">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                  1
                </div>
                <h3 className="text-xl font-semibold text-white">Assess Quality</h3>
              </div>
              <p className="text-slate-400 mb-6">
                Every piece of evidence is scored against three objective criteria:
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg">
                  <div className="text-2xl">🔗</div>
                  <div>
                    <div className="text-white font-medium">Chain of Custody</div>
                    <div className="text-sm text-slate-500">Where did this evidence come from? Is the source verifiable?</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg">
                  <div className="text-2xl">👤</div>
                  <div>
                    <div className="text-white font-medium">Witness Credibility</div>
                    <div className="text-sm text-slate-500">What&apos;s the expertise level of the observer or analyst?</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg">
                  <div className="text-2xl">🔬</div>
                  <div>
                    <div className="text-white font-medium">Technical Analysis</div>
                    <div className="text-sm text-slate-500">Has it been independently reviewed using scientific methods?</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Cast Your Verdict */}
            <div className="bg-slate-800/50 rounded-xl p-8 border border-slate-700">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                  2
                </div>
                <h3 className="text-xl font-semibold text-white">Cast Your Verdict</h3>
              </div>
              <p className="text-slate-400 mb-6">
                After assessing evidence quality, make your determination:
              </p>
              <div className="space-y-4">
                <button className="w-full flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/20 transition-colors">
                  <span className="text-2xl">🌍</span>
                  <div className="text-left">
                    <div className="text-emerald-400 font-medium">Natural Origin</div>
                    <div className="text-sm text-slate-500">Evidence points to known natural phenomena</div>
                  </div>
                </button>
                <button className="w-full flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg hover:bg-amber-500/20 transition-colors">
                  <span className="text-2xl">❓</span>
                  <div className="text-left">
                    <div className="text-amber-400 font-medium">Uncertain</div>
                    <div className="text-sm text-slate-500">More data needed before making a determination</div>
                  </div>
                </button>
                <button className="w-full flex items-center gap-3 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg hover:bg-purple-500/20 transition-colors">
                  <span className="text-2xl">🛸</span>
                  <div className="text-left">
                    <div className="text-purple-400 font-medium">Anomalous / Artificial</div>
                    <div className="text-sm text-slate-500">Evidence suggests non-natural characteristics</div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Community vs Scientific Consensus */}
          <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/30 rounded-xl p-8 border border-slate-600">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-white mb-2">
                Track the Evolving Consensus
              </h3>
              <p className="text-slate-400">
                See how community assessments compare to scientific consensus over time
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="text-center p-4 bg-slate-900/50 rounded-lg">
                <div className="text-3xl mb-2">👥</div>
                <div className="text-white font-medium mb-1">Community Sentiment</div>
                <div className="text-sm text-slate-500">Real-time aggregate of all user verdicts</div>
              </div>
              <div className="text-center p-4 bg-slate-900/50 rounded-lg">
                <div className="text-3xl mb-2">🎓</div>
                <div className="text-white font-medium mb-1">Scientific Consensus</div>
                <div className="text-sm text-slate-500">Peer-reviewed assessments from experts</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured ISO */}
      <section className="py-16 bg-slate-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-xl p-8 border border-blue-700/50">
            <div className="flex items-center gap-4 mb-4">
              <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-semibold">
                UPCOMING
              </span>
              <h2 className="text-2xl font-bold text-white">3I/ATLAS - Observation Window</h2>
            </div>
            <p className="text-slate-300 mb-6">
              The next confirmed interstellar object is approaching. Track the evidence as it develops
              and join the analysis when the observation window opens.
            </p>
            <Link
              href="/3i-atlas"
              className="inline-flex items-center text-blue-400 hover:text-blue-300 font-medium"
            >
              Learn more about 3I/ATLAS
              <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Loeb Scale Showcase */}
      <section className="py-16 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              The Loeb Scale
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              A scientific 0-10 classification system for evaluating interstellar objects.
              Based on Avi Loeb&apos;s framework for assessing potential technosignatures.
            </p>
          </div>

          {/* Scale Legend */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <span className="text-emerald-500">●</span>
              <span className="text-sm text-emerald-400 font-medium">0-1: Natural</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <span className="text-amber-500">◐</span>
              <span className="text-sm text-amber-400 font-medium">2-4: Anomalous</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-500/10 border border-orange-500/30">
              <span className="text-orange-500">◉</span>
              <span className="text-sm text-orange-400 font-medium">5-7: Suspected</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30">
              <span className="text-red-500">★</span>
              <span className="text-sm text-red-400 font-medium">8-10: Confirmed</span>
            </div>
          </div>

          {/* ISO Cards with Loeb Scores */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* 1I/'Oumuamua */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 hover:border-amber-500/50 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">1I/&apos;Oumuamua</h3>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40">
                  <span className="text-amber-400">◐</span>
                  <span className="text-amber-400 font-bold">4</span>
                </div>
              </div>
              <p className="text-slate-400 text-sm mb-4">
                The first confirmed interstellar object. Exhibits non-gravitational acceleration
                and extreme elongation that challenge natural explanations.
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Discovered 2017</span>
                <Link href="/iso-objects" className="text-blue-400 hover:text-blue-300 font-medium">
                  View Details →
                </Link>
              </div>
            </div>

            {/* 2I/Borisov */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 hover:border-emerald-500/50 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">2I/Borisov</h3>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40">
                  <span className="text-emerald-400">●</span>
                  <span className="text-emerald-400 font-bold">0</span>
                </div>
              </div>
              <p className="text-slate-400 text-sm mb-4">
                Classic cometary behavior with clear coma and tail. Composition matches
                Solar System comets. Definitively natural.
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Discovered 2019</span>
                <Link href="/iso-objects" className="text-blue-400 hover:text-blue-300 font-medium">
                  View Details →
                </Link>
              </div>
            </div>

            {/* 3I/ATLAS */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 hover:border-amber-500/50 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">3I/ATLAS</h3>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40">
                  <span className="text-amber-400">◐</span>
                  <span className="text-amber-400 font-bold">4</span>
                </div>
              </div>
              <p className="text-slate-400 text-sm mb-4">
                Newly discovered interstellar object. Assessment pending additional
                data collection. Shows early signs of anomalous characteristics.
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Discovered 2025</span>
                <Link href="/3i-atlas" className="text-blue-400 hover:text-blue-300 font-medium">
                  View Details →
                </Link>
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link
              href="/iso-objects"
              className="inline-flex items-center justify-center px-6 py-3 border border-slate-600 text-base font-medium rounded-md text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Browse All ISOs
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section className="bg-slate-800/50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            Choose Your Role
          </h2>
          <p className="text-slate-400 text-center mb-8 max-w-2xl mx-auto">
            Start free as a Spectator, or upgrade to contribute evidence and verdicts.
          </p>

          {/* Billing Toggle */}
          <div className="flex justify-center items-center gap-4 mb-12">
            <span className={`text-sm font-medium ${billingInterval === 'monthly' ? 'text-white' : 'text-slate-400'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingInterval(billingInterval === 'monthly' ? 'annual' : 'monthly')}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  billingInterval === 'annual' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${billingInterval === 'annual' ? 'text-white' : 'text-slate-400'}`}>
              Annual <span className="text-green-400 ml-1">Save up to 33%</span>
            </span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {/* Spectator - Free */}
            <div className="bg-slate-900 p-6 rounded-lg border border-slate-700 flex flex-col">
              <h3 className="text-xl font-semibold text-white mb-2">Spectator</h3>
              <p className="text-3xl font-bold text-white mb-4">Free</p>
              <ul className="space-y-3 text-slate-400 mb-6 flex-grow">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  View tracking data
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Read community analysis
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Follow ISOs
                </li>
              </ul>
              <Link
                href="/auth/sign-up"
                className="block text-center w-full py-2 border border-slate-600 rounded text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Get Started
              </Link>
            </div>

            {/* Event Pass - $4.99/mo or $49.95/year */}
            <div className="bg-slate-900 p-6 rounded-lg border border-slate-700 flex flex-col relative">
              {billingInterval === 'annual' && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                  2 MONTHS FREE
                </div>
              )}
              <h3 className="text-xl font-semibold text-white mb-2">Event Pass</h3>
              {billingInterval === 'monthly' ? (
                <p className="text-3xl font-bold text-white mb-4">
                  $4.99<span className="text-sm text-slate-400">/mo</span>
                </p>
              ) : (
                <div className="mb-4">
                  <p className="text-3xl font-bold text-white">
                    $49.95<span className="text-sm text-slate-400">/year</span>
                  </p>
                  <p className="text-sm text-slate-400">$4.16/mo billed annually</p>
                </div>
              )}
              <ul className="space-y-3 text-slate-400 mb-6 flex-grow">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Everything in Spectator
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Vote on community debates
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Observation window alerts
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-slate-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-slate-500">Auto-pauses between events</span>
                </li>
              </ul>
              <button
                onClick={() => handleSubscribe('event-pass')}
                disabled={isLoading}
                className="block text-center w-full py-2 border border-slate-600 rounded text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                {isLoading && selectedTier === 'event-pass' ? 'Loading...' : 'Subscribe'}
              </button>
            </div>

            {/* Evidence Analyst - $9.95/mo or $79.95/year - POPULAR */}
            <div className="bg-slate-900 p-6 rounded-lg border border-blue-600 relative flex flex-col">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                POPULAR
              </div>
              {billingInterval === 'annual' && (
                <div className="absolute -top-3 right-4 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                  4 MONTHS FREE
                </div>
              )}
              <h3 className="text-xl font-semibold text-white mb-2">Evidence Analyst</h3>
              {billingInterval === 'monthly' ? (
                <p className="text-3xl font-bold text-white mb-4">
                  $9.95<span className="text-sm text-slate-400">/mo</span>
                </p>
              ) : (
                <div className="mb-4">
                  <p className="text-3xl font-bold text-white">
                    $79.95<span className="text-sm text-slate-400">/year</span>
                  </p>
                  <p className="text-sm text-slate-400">$6.66/mo billed annually</p>
                </div>
              )}
              <ul className="space-y-3 text-slate-400 mb-6 flex-grow">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Everything in Event Pass
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Submit & assess evidence
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Cast verdicts with confidence
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Full year-round access
                </li>
              </ul>
              <button
                onClick={() => handleSubscribe('evidence-analyst')}
                disabled={isLoading}
                className="block text-center w-full py-2 bg-blue-600 rounded text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isLoading && selectedTier === 'evidence-analyst' ? 'Loading...' : 'Subscribe'}
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Separate Fact from Fiction?
          </h2>
          <p className="text-slate-400 mb-8">
            Join thousands of evidence-based analysts tracking interstellar objects.
          </p>
          <Link
            href="/auth/sign-up"
            className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Create Free Account
          </Link>
        </div>
      </section>

      {/* About & Contact Section */}
      <section className="py-16 bg-slate-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            {/* About */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">About ISO Tracker</h2>
              <p className="text-slate-400 mb-4">
                ISO Tracker is built by Jamie Watters, a solo founder using AI to build products that matter.
                As a former enterprise architect turned indie hacker, I created ISO Tracker to bring
                evidence-based analysis to the study of interstellar objects.
              </p>
              <p className="text-slate-400 mb-6">
                This is one of 10+ products in my portfolio, all built with the mission of demonstrating
                what one person with the right AI tools can accomplish.
              </p>
              <a
                href="https://jamiewatters.work"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-blue-400 hover:text-blue-300 font-medium"
              >
                Learn more about my journey
                <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>

            {/* Contact */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Get in Touch</h2>
              <p className="text-slate-400 mb-6">
                Have questions, feedback, or want to collaborate? I&apos;d love to hear from you.
              </p>
              <div className="space-y-4">
                <a
                  href="mailto:support@isotracker.org"
                  className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  support@isotracker.org
                </a>
                <a
                  href="https://jamiewatters.work"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  jamiewatters.work
                </a>
                <a
                  href="https://www.linkedin.com/in/jamie-watters-solo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  LinkedIn
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-slate-400 text-center md:text-left">
              &copy; 2025 ISO Tracker. Built by{' '}
              <a href="https://jamiewatters.work" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                Jamie Watters
              </a>
            </div>
            <div className="flex flex-wrap justify-center gap-6">
              <Link href="/guidelines" className="text-slate-400 hover:text-white">
                Guidelines
              </Link>
              <Link href="/iso-objects" className="text-slate-400 hover:text-white">
                Browse ISOs
              </Link>
              <a href="mailto:support@isotracker.org" className="text-slate-400 hover:text-white">
                Contact
              </a>
              <a href="https://www.linkedin.com/in/jamie-watters-solo" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white">
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false)
          setIsLoading(false)
        }}
        onSuccess={handleAuthSuccess}
        title="Create your account"
        subtitle={`Sign up to get ${selectedTier === 'event-pass' ? 'Event Pass' : 'Evidence Analyst'}`}
      />
    </div>
  )
}
