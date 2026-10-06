import { createClient, isAuthApiError } from "@supabase/supabase-js";
import { env } from "./env";
import { logger } from "../middleware/logger";

/**
 * Server-side clients never keep a user session.
 *
 * supabase-js sends a signed-in user's access token in place of the API key
 * once it holds a session. A password sign-in on the shared admin client
 * therefore turned every later service-role call — storage uploads included —
 * into a call made as whoever signed in last.
 */
const serverAuth = {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
};

export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, serverAuth);
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, serverAuth);

/**
 * A throwaway client for one password sign-in or token refresh, so the session
 * it receives dies with the request instead of leaking into shared state.
 */
export function createSessionClient() {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, serverAuth);
}

/**
 * Proves the service-role key is accepted before the server takes traffic.
 *
 * Every request is authenticated by asking Supabase, so a rejected key means
 * no one can sign in. Rotating the project's JWT secret invalidates the old
 * legacy keys, and a deploy still carrying one should fail loudly rather than
 * boot and turn every user away. An unreachable Supabase is only a warning:
 * requests already fail closed, and a network blip should not block a deploy.
 */
export async function verifySupabaseAuthConfig(): Promise<boolean> {
  const { error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 });
  if (!error) return true;

  if (isAuthApiError(error) && (error.status === 401 || error.status === 403)) {
    logger.error(
      "Supabase rejected SUPABASE_SERVICE_ROLE_KEY — set the current key for this project."
    );
    return false;
  }

  logger.warn(`Could not reach Supabase to verify auth configuration (status ${error.status ?? "n/a"}).`);
  return true;
}
