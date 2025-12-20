import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Middleware that handles:
 * 1. Supabase auth session refresh (REQUIRED for SSR auth to work)
 * 2. Multi-domain routing for 3i-atlas.live
 */
export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const pathname = request.nextUrl.pathname

  // Handle 3i-atlas.live domain - serve standalone landing page
  if (hostname.includes('3i-atlas.live') || hostname.includes('3i-atlas')) {
    if (pathname === '/' || pathname === '') {
      return NextResponse.rewrite(new URL('/atlas-landing', request.url))
    }
    if (pathname.startsWith('/api/')) {
      return NextResponse.next()
    }
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Supabase auth session refresh
  // This is REQUIRED for auth to work between client and server
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // IMPORTANT: This call refreshes the auth session and syncs cookies
  // Without this, server-side auth won't work properly
  await supabase.auth.getUser()

  return response
}

export const config = {
  // Match all routes except static files
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
