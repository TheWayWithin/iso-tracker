'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to Sentry
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-3xl font-bold text-slate-100 mb-4">
          Something Went Wrong
        </h1>
        <p className="text-slate-400 mb-6">
          We encountered an unexpected error while processing your request.
          Our team has been notified and is investigating the issue.
        </p>
        {error.digest && (
          <p className="text-xs text-slate-500 mb-4">
            Error ID: {error.digest}
          </p>
        )}
        <div className="space-y-3">
          <button
            onClick={() => reset()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Try Again
          </button>
          <a
            href="/dashboard"
            className="block w-full bg-slate-700 hover:bg-slate-600 text-slate-100 font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Return to Dashboard
          </a>
          <a
            href="/"
            className="block text-blue-400 hover:text-blue-300 transition-colors"
          >
            Go to Homepage
          </a>
        </div>
      </div>
    </div>
  )
}
