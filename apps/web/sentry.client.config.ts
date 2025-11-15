// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: 1.0, // Capture 100% of traces in production

  // Session Replay (disabled for privacy per PRD)
  replaysSessionSampleRate: 0, // Don't capture sessions
  replaysOnErrorSampleRate: 0, // Don't capture on error either

  // Set `tracePropagationTargets` to control for which URLs distributed tracing should be enabled
  tracePropagationTargets: [
    'localhost',
    /^https:\/\/iso-tracker\.app/,
    /^https:\/\/.*\.vercel\.app/,
  ],

  // Filter out sensitive data (no PII per PRD)
  beforeSend(event) {
    // Remove user email from error events
    if (event.user) {
      delete event.user.email
      delete event.user.ip_address
    }
    return event
  },

  // Environment
  environment: process.env.NODE_ENV,

  // Release tracking (set by build process)
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,

  // Enabled only in production
  enabled: process.env.NODE_ENV === 'production',

  // Ignore common errors that aren't actionable
  ignoreErrors: [
    // Network errors
    'Network request failed',
    'Failed to fetch',
    'Load failed',
    // Browser extensions
    /^chrome-extension:\/\//,
    /^moz-extension:\/\//,
    // Common React errors that aren't bugs
    'ResizeObserver loop',
    // User-initiated
    'AbortError',
  ],
})
