import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Simple in-memory rate limiter (use Upstash Redis in production for multi-instance support)
const loginAttempts = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(ip: string, maxAttempts = 10, windowMs = 15 * 60 * 1000): boolean {
  const now = Date.now()
  const entry = loginAttempts.get(ip)
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + windowMs })
    return false
  }
  entry.count++
  return entry.count > maxAttempts
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Rate-limit admin login POSTs ─────────────────────────────
  if (pathname === '/api/auth/login' && request.method === 'POST') {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429 }
      )
    }
  }

  // ── Session refresh for all routes ───────────────────────────
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: do not run code between createServerClient and getUser()
  const { data: { user } } = await supabase.auth.getUser()

  // ── Protect /admin routes ─────────────────────────────────────
  const isAdminRoute = pathname.startsWith('/admin') && pathname !== '/admin-login' && pathname !== '/admin-setup'
  if (isAdminRoute && !user) {
    const loginUrl = new URL('/admin-login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ── Redirect logged-in admins away from login page ───────────
  if (pathname === '/admin-login' && user) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // Match all admin routes and the auth login API
    '/admin/:path*',
    '/admin-login',
    '/api/auth/login',
    // Required for Supabase SSR session refresh on all routes:
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
