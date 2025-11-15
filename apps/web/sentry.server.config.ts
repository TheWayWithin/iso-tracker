// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: 1.0,

  // Environment
  environment: process.env.NODE_ENV,

  // Release tracking
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,

  // Enabled only in production
  enabled: process.env.NODE_ENV === 'production',

  // Filter out sensitive data (no PII per PRD)
  beforeSend(event) {
    // Remove user email and IP from error events
    if (event.user) {
      delete event.user.email
      delete event.user.ip_address
    }
    // Remove sensitive headers
    if (event.request?.headers) {
      delete event.request.headers['Authorization']
      delete event.request.headers['Cookie']
    }
    return event
  },

  // Ignore common errors
  ignoreErrors: [
    'NEXT_NOT_FOUND',
    'NEXT_REDIRECT',
  ],
})
