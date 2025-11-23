import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Multi-domain routing middleware
 * Routes 3i-atlas.live traffic to the standalone landing page
 */
export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const pathname = request.nextUrl.pathname

  // Handle 3i-atlas.live domain - serve standalone landing page
  if (hostname.includes('3i-atlas.live') || hostname.includes('3i-atlas')) {
    // Root of 3i-atlas.live should show the atlas landing page
    if (pathname === '/' || pathname === '') {
      return NextResponse.rewrite(new URL('/atlas-landing', request.url))
    }

    // Allow API routes (for email signup)
    if (pathname.startsWith('/api/')) {
      return NextResponse.next()
    }

    // Redirect any other paths back to root (simple single-page site)
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  // Match all routes except static files and internal paths
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
