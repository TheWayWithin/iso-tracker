'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md text-center text-white">
          <div className="text-6xl mb-4">🚨</div>
          <h1 className="text-3xl font-bold mb-4">Critical Error</h1>
          <p className="text-slate-300 mb-6">
            A critical error occurred. Our team has been automatically notified.
            Please try refreshing the page or contact support if the problem
            persists.
          </p>
          {error.digest && (
            <p className="text-xs text-slate-500 mb-4">
              Error ID: {error.digest}
            </p>
          )}
          <div className="space-y-3">
            <button
              onClick={() => reset()}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Try Again
            </button>
            <a
              href="/"
              className="block w-full bg-slate-700 hover:bg-slate-600 text-slate-100 font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Go to Homepage
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
