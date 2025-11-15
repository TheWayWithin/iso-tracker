'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { initPostHog, trackPageView, trackOfflineMode } from './posthog'

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Initialize PostHog on mount
  useEffect(() => {
    initPostHog()

    // Track offline mode
    const handleOffline = () => trackOfflineMode()
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Track page views on route change
  useEffect(() => {
    if (pathname) {
      // Get page name from pathname
      const pageName = getPageName(pathname)
      trackPageView(pageName, {
        path: pathname,
        search: searchParams?.toString(),
      })
    }
  }, [pathname, searchParams])

  return <>{children}</>
}

// Map pathname to friendly page name
function getPageName(pathname: string): string {
  if (pathname === '/') return 'Home'
  if (pathname === '/dashboard') return 'Dashboard'
  if (pathname.startsWith('/iso-objects/')) return 'ISO Detail'
  if (pathname === '/iso-objects') return 'ISO List'
  if (pathname.startsWith('/auth/')) return 'Authentication'
  if (pathname === '/settings/notifications') return 'Notification Settings'
  if (pathname.startsWith('/admin/')) return 'Admin Dashboard'
  if (pathname === '/guidelines') return 'Community Guidelines'
  return 'Other'
}
