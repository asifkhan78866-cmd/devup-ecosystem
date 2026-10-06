# Incident: Supabase JWT signing secret committed to git

**Status:** code fixed on `security/remove-local-jwt-fallback`. **Secret rotation still required.**
**Exposed since:** 2026-07-10, commit `aa718c9` (`backend/test-jwt.js`), pushed to `origin/main`
and `origin/seo/phase-1-location-pages`.
**Confirmed live:** the committed value matched `SUPABASE_JWT_SECRET` in the backend's
environment on 2026-10-07.

## Why deleting the file is not enough

The value is still in every clone, fork and cache of the repository's history. Anyone who
has it can mint Supabase JWTs for this project:

- **Through Supabase directly, bypassing this backend entirely.** A token with
  `"role": "service_role"` signed with this secret is accepted by PostgREST and Storage, so
  it reads and writes every table and bucket with RLS bypassed. No code change in this
  repository can prevent that. Only rotating the secret does.
- **Through this backend.** `requireAuth` fell back to verifying tokens locally with the
  secret, so a token for any user id (an admin's, for example) was accepted. That
  fallback is now removed.

## What changed in the code

- `backend/test-jwt.js` deleted.
- `requireAuth` accepts only tokens that Supabase Auth (`auth.getUser`) vouches for. There
  is no local verification and no fallback. If Supabase is unreachable the request gets a
  503; it is never let through.
- `/api/auth/login` returns Supabase's own session (`token`, `refreshToken`, `expiresAt`)
  instead of a locally signed 7-day JWT. The new `/api/auth/refresh` renews it, and the
  admin portal refreshes automatically.
- The hardcoded development login (`admin@devup.in` / `admin123`, `ALLOW_DEV_LOGIN`) is
  removed.
- `SUPABASE_JWT_SECRET`, `JWT_EXPIRES_IN`, `REFRESH_TOKEN_EXPIRES_IN` and `ALLOW_DEV_LOGIN`
  are no longer read. The server warns if `SUPABASE_JWT_SECRET` is still set, naming the
  variable but never printing its value.
- In production the server refuses to start unless the Supabase URL is https, both keys
  have the right shape and role, and Supabase accepts the service-role key.
- `jsonwebtoken` has been removed from the backend's dependencies.

## Required manual actions (outside the repository)

Do these in order. Steps 0–3 are urgent.

0. **Deploy this branch first.** The currently deployed backend verifies tokens itself
   using whatever `SUPABASE_JWT_SECRET` is in Render's environment, so until this code is
   live, forged tokens keep working against the API even after a Supabase rotation.
   This branch works with the current keys, so it can ship immediately. It will sign
   existing admin-portal users out once, because their old 7-day tokens are not Supabase
   sessions.
1. **Rotate the signing secret in Supabase.** Recommended: migrate the project to the
   asymmetric JWT signing keys, rotate to the new key, then **revoke the legacy HS256
   secret**. Alternatively, generate a new legacy JWT secret. Either way, every token
   signed with the old secret stops working. This also signs everyone out.
2. **Replace the API keys everywhere they are configured.** Legacy `anon` and
   `service_role` keys are themselves JWTs signed by the old secret, so they stop working
   after step 1 and leaked copies become useless. Prefer the newer publishable/secret keys,
   then disable the legacy keys. Update:
   - Render (backend): `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - Vercel (frontend): `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Note that
     `frontend/.env.production` is tracked and contains the old anon key, and the
     dashboard value must override it or the frontend build will ship a dead key.
   - Admin portal host: `VITE_SUPABASE_ANON_KEY`, if it is set
   - GitHub Actions secrets that hold Supabase keys

   Do steps 1 and 2 together. Between them, the backend's service-role key is dead and
   nobody can sign in. A restart with a rejected key refuses to boot, by design.
3. **Delete `SUPABASE_JWT_SECRET`** from Render, Vercel, GitHub Actions and every local
   `backend/.env`. Nothing needs it any more.
4. **Review access since 2026-07-10.** In Supabase logs (API, Auth, Storage, Postgres),
   look for `service_role` traffic that does not come from the backend's host,
   unexpected admin activity, and unfamiliar user ids on admin routes. Check the
   `User.role` column for accounts that became `ADMIN` or `SUPER_ADMIN` unexpectedly.
5. **Purge the secret from git history** (optional once the secret is revoked, but
   recommended). This rewrites history, so coordinate with everyone who has a clone first:

   ```bash
   # from a fresh mirror clone
   git clone --mirror https://github.com/asifkhan78866-cmd/devup-ecosystem.git
   cd devup-ecosystem.git
   git filter-repo --invert-paths --path backend/test-jwt.js
   git push --force --mirror
   ```

   Then ask GitHub Support to purge cached views of the old commits, and have every
   collaborator re-clone. A rewrite does **not** un-leak the secret. Rotation (step 1)
   is what neutralises it.

## Verifying the fix

- `cd backend && npm test` runs `test/auth.test.ts`. A token forged with the configured
  signing secret is rejected (the same test fails against the pre-fix middleware), and
  production refuses to start on missing or invalid Supabase configuration without echoing
  any key.
- After rotation, an admin can sign in to the admin portal and stays signed in past one
  hour (the access token is refreshed).
