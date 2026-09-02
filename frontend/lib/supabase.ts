import { createBrowserClient } from '@supabase/ssr'

/**
 * The browser Supabase client — one per tab, not one per call.
 *
 * This used to construct a fresh client on every invocation, and one of the
 * callers is the API client, which calls it on EVERY request to fetch the
 * bearer token. Each construction builds a new GoTrueClient against the same
 * storage key, and the library itself warns about that:
 *
 *   "Multiple GoTrueClient instances detected in the same browser context.
 *    It is not an error, but this should be avoided as it may produce
 *    undefined behavior when used concurrently under the same storage key."
 *
 * Concurrently under the same storage key is exactly how it was being used.
 * Each instance also runs its own auto-refresh timer and its own visibility
 * listener, so the cost grew with every call the page made.
 */

/**
 * The type is taken from this factory rather than written out. Annotating the
 * cache as `ReturnType<typeof createBrowserClient>` widens the generics to
 * their defaults, and every caller then loses its parameter types — the first
 * attempt turned onAuthStateChange's arguments into implicit `any`.
 */
function build() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

let browserClient: ReturnType<typeof build> | null = null

export function createClient() {
  // On the server every render must get its own client — a module-level cache
  // there would leak one request's session into another's.
  if (typeof window === 'undefined') return build()

  if (!browserClient) browserClient = build()
  return browserClient
}
