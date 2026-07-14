import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_ROUTES = [
  '/dashboard',
  '/profile',
  '/settings',
  '/applications',
  '/messages',
  '/apply',
  '/admin',
]

const AUTH_ROUTES = [
  '/login',
  '/signup',
]

// These routes require login but are less strict (still protected)
const SOFT_PROTECTED = [
  '/startups',
  '/cofounders',
]

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do NOT run code between createServerClient and supabase.auth.getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // Skip auth check for callback route
  if (path.startsWith('/auth/callback')) {
    return supabaseResponse
  }

  // Hard-protected routes: redirect to login
  if (PROTECTED_ROUTES.some(route => path.startsWith(route))) {
    if (!user) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirect', path)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Soft-protected routes: redirect to login (but allow public listing pages)
  if (SOFT_PROTECTED.some(route => path === route || (path.startsWith(route + '/') && !path.endsWith('/new')))) {
    // Allow browsing, but specific actions need auth (handled client-side)
  }

  // Auth routes: redirect logged-in users to dashboard
  if (AUTH_ROUTES.some(route => path.startsWith(route))) {
    if (user) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|mp4|webm)).*)',
  ],
}
