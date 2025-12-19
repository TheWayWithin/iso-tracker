'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import { Suspense } from 'react'

function SuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <CheckCircle className="mx-auto h-16 w-16 text-green-500" />

      <h1 className="mt-6 text-4xl font-extrabold text-gray-900">
        Welcome to Evidence-Based ISO Analysis
      </h1>

      <p className="mt-4 text-lg text-gray-600">
        Your subscription is now active. Check your email for a receipt from Stripe.
      </p>

      {sessionId && (
        <p className="mt-2 text-sm text-gray-500">
          Session ID: {sessionId}
        </p>
      )}

      <div className="mt-12 rounded-lg bg-blue-50 p-6 text-left">
        <h2 className="text-xl font-bold text-gray-900">
          What You Can Do Now:
        </h2>
        <ul className="mt-4 space-y-3 text-gray-700">
          <li className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-500" />
            <span>
              <strong>Access the complete evidence framework</strong> — See
              what's proven vs. speculative
            </span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-500" />
            <span>
              <strong>Understand 30+ scientific perspectives</strong> — Know
              what consensus means
            </span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-500" />
            <span>
              <strong>Cast evidence-based votes</strong> — Build your credible
              analyst reputation
            </span>
          </li>
        </ul>
      </div>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
        <Link
          href="/dashboard"
          className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
        >
          Explore Your First ISO →
        </Link>
        <Link
          href="/settings/billing"
          className="rounded-lg border-2 border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50"
        >
          Manage Subscription
        </Link>
      </div>

      <p className="mt-8 text-sm text-gray-500">
        Questions? Email support@isotracker.org
      </p>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  )
}
