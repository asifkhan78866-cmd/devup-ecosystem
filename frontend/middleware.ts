import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Edge middleware.
 *
 * Two rules here, both learned the hard way:
 *
 *  1. NEVER touch auth on /auth/callback. The browser is in the middle of
 *     exchanging a one-time OAuth code and writing the session cookies. A
 *     server-side `getUser()` at that moment refreshes the token from the other
 *     side of the race and rotates the refresh token the browser is about to
 *     use — after which the client's own call never settles and the user sits
 *     on "Signing you in..." forever with no error to click.
 *
 *  2. `getUser()` is a NETWORK request to the Supabase auth server, not a
 *     cookie read. Running it on every navigation put a remote round-trip in
 *     front of every page in the site. It is now made only on the two routes
 *     whose behaviour actually depends on the answer.
 */

const AUTH_ROUTES = ['/login', '/signup']

/** Paths that must never have their auth cookies touched mid-flight. */
const AUTH_FLOW_PREFIXES = ['/auth/callback', '/auth/confirm']

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Rule 1. Before the client exists, so nothing can refresh a token here.
  if (AUTH_FLOW_PREFIXES.some((p) => path.startsWith(p))) {
    return NextResponse.next({ request })
  }

  // Rule 2. Every other route is decided on the client by AuthGate, so there is
  // nothing for the edge to look up and no reason to pay for the lookup.
  const needsUser = AUTH_ROUTES.some((route) => path.startsWith(route))
  if (!needsUser) {
    return NextResponse.next({ request })
  }

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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do NOT run code between createServerClient and supabase.auth.getUser().
  //
  // Wrapped in a timeout because this is a remote call sitting in front of a
  // page render: if the auth server is slow, a signed-out visitor should still
  // get the login page rather than a hanging request.
  let user = null
  try {
    const result = await Promise.race([
      supabase.auth.getUser(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
    ])
    user = result?.data?.user ?? null
  } catch {
    user = null
  }

  if (user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Only the routes that redirect a signed-in visitor away. Previously this
     * matched every page in the site, which is what made the auth round-trip
     * above run on every navigation.
     */
    '/login/:path*',
    '/signup/:path*',
    '/auth/callback/:path*',
  ],
}
