import posthog from 'posthog-js'

// PostHog analytics for ISO Tracker
// Events track user engagement without PII (user IDs only, no emails)

export const initPostHog = () => {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
      loaded: (ph) => {
        // Disable in development to prevent test data
        if (process.env.NODE_ENV === 'development') {
          ph.opt_out_capturing()
        }
      },
      // Privacy-focused configuration
      persistence: 'localStorage',
      autocapture: false, // Manual tracking only for privacy
      capture_pageview: false, // We'll track manually for better control
      disable_session_recording: true, // No session recordings (privacy)
      bootstrap: {
        distinctID: '', // Will be set after auth
      },
    })
  }
}

// Identify user (call after authentication)
export const identifyUser = (userId: string, properties?: Record<string, unknown>) => {
  if (typeof window !== 'undefined' && posthog.__loaded) {
    posthog.identify(userId, properties)
  }
}

// Reset user on logout
export const resetUser = () => {
  if (typeof window !== 'undefined' && posthog.__loaded) {
    posthog.reset()
  }
}

// Track custom events (per PRD Section 5.4)
export const trackEvent = (event: string, properties?: Record<string, unknown>) => {
  if (typeof window !== 'undefined' && posthog.__loaded) {
    posthog.capture(event, properties)
  }
}

// Pre-defined event tracking functions (per PRD requirements)

/**
 * Track when user signs up
 * PRD: "user_signup" - New user registration
 */
export const trackUserSignup = (tier: string = 'free') => {
  trackEvent('user_signup', { tier })
}

/**
 * Track subscription upgrade
 * PRD: "subscription_upgrade" - Tier change
 */
export const trackSubscriptionUpgrade = (fromTier: string, toTier: string, price: number) => {
  trackEvent('subscription_upgrade', {
    from_tier: fromTier,
    to_tier: toTier,
    price,
  })
}

/**
 * Track evidence submission
 * PRD: "evidence_submit" - Evidence submission
 */
export const trackEvidenceSubmit = (isoObjectId: string, evidenceType: string) => {
  trackEvent('evidence_submit', {
    iso_object_id: isoObjectId,
    evidence_type: evidenceType,
  })
}

/**
 * Track ISO follow
 * PRD: "iso_follow" - Follow an ISO
 */
export const trackISOFollow = (isoObjectId: string) => {
  trackEvent('iso_follow', { iso_object_id: isoObjectId })
}

/**
 * Track ISO unfollow
 */
export const trackISOUnfollow = (isoObjectId: string) => {
  trackEvent('iso_unfollow', { iso_object_id: isoObjectId })
}

/**
 * Track notification preference change
 * PRD: "notification_toggle" - Change notification preference
 */
export const trackNotificationToggle = (
  notificationType: 'reply' | 'evidence' | 'observation_window',
  enabled: boolean
) => {
  trackEvent('notification_toggle', {
    notification_type: notificationType,
    enabled,
  })
}

/**
 * Track page view
 * PRD: "page_view" - Track key pages (dashboard, ISO detail)
 */
export const trackPageView = (pageName: string, properties?: Record<string, unknown>) => {
  trackEvent('$pageview', {
    page: pageName,
    ...properties,
  })
}

/**
 * Track evidence assessment
 */
export const trackEvidenceAssessment = (evidenceId: string, qualityScore: number) => {
  trackEvent('evidence_assessment', {
    evidence_id: evidenceId,
    quality_score: qualityScore,
  })
}

/**
 * Track content flag (moderation)
 */
export const trackContentFlag = (contentType: string, contentId: string) => {
  trackEvent('content_flag', {
    content_type: contentType,
    content_id: contentId,
  })
}

/**
 * Track NASA API data fetch (performance monitoring)
 */
export const trackNASAAPIFetch = (isoObjectId: string, cacheHit: boolean, durationMs: number) => {
  trackEvent('nasa_api_fetch', {
    iso_object_id: isoObjectId,
    cache_hit: cacheHit,
    duration_ms: durationMs,
  })
}

/**
 * Track PWA install prompt
 */
export const trackPWAInstallPrompt = (accepted: boolean) => {
  trackEvent('pwa_install_prompt', { accepted })
}

/**
 * Track offline mode detection
 */
export const trackOfflineMode = () => {
  trackEvent('offline_mode_detected')
}

export default posthog
