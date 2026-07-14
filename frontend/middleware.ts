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

  // All routes are now soft-protected or fully protected on the client side
  // using AuthGate and ProtectedContent. We no longer redirect to /login.
  
  // Auth routes (login/signup) still redirect logged-in users to dashboard
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
