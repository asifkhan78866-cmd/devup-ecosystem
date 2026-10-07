-- Migration: proven email ownership before records are claimed, and hashed,
-- expiring, single-use invitation tokens.
--
-- Apply in the same deploy window as the backend that contains
-- src/modules/auth/verification.service.ts — before the new code starts, so it
-- finds its column and table, and not long before, because the old code looks
-- invitations up by the raw token this script hashes:
--
--   psql "$DIRECT_URL" -f backend/scripts/2026_email_verification.sql
--
-- Safe to re-run.

BEGIN;

-- 1. Proven ownership of User.email. NULL for every existing account on
--    purpose — see the note at the end.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerifiedAt" TIMESTAMP(3);

-- 2. Verification links. Only the SHA-256 of a token is stored.
CREATE TABLE IF NOT EXISTS "EmailVerification" (
  "id"        TEXT         NOT NULL,
  "userId"    TEXT         NOT NULL,
  "email"     TEXT         NOT NULL,
  "tokenHash" TEXT         NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt"    TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailVerification_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "EmailVerification_tokenHash_key"
  ON "EmailVerification" ("tokenHash");
CREATE INDEX IF NOT EXISTS "EmailVerification_userId_createdAt_idx"
  ON "EmailVerification" ("userId", "createdAt");
DO $$ BEGIN
  ALTER TABLE "EmailVerification"
    ADD CONSTRAINT "EmailVerification_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. Invitation tokens: keep only the SHA-256 (hex). Links already sitting in
--    inboxes keep working because the server now hashes what it receives.
--    Raw tokens were 48 hex characters and hashes are 64, so a second run
--    leaves hashed rows alone.
UPDATE "StartupMember"
   SET "inviteToken" = encode(sha256(convert_to("inviteToken", 'UTF8')), 'hex')
 WHERE length("inviteToken") <> 64;

COMMIT;

-- Why nothing is backfilled as verified
-- -------------------------------------
-- Until this change, signup marked every address confirmed without proof, so
-- no existing account's email can be trusted — not even a Google one: an
-- account someone created with another person's address keeps its password
-- after the real owner signs in with Google. Accounts become verified on their
-- next Google sign-in (which also retires any password and other sessions) or
-- by following a link from POST /api/auth/resend-verification. Records they
-- already hold are not taken away.
--
-- Review: records claimed before this fix by email-signup accounts.
--   SELECT u.email, u."createdAt", 'employee' AS kind, e."startupId"
--     FROM "Employee" e JOIN "User" u ON u.id = e."userId"
--    WHERE u."authProvider" = 'EMAIL' AND e."createdAt" < u."createdAt"
--   UNION ALL
--   SELECT u.email, u."createdAt", 'intern', i."startupId"
--     FROM "Intern" i JOIN "User" u ON u.id = i."userId"
--    WHERE u."authProvider" = 'EMAIL' AND i."createdAt" < u."createdAt";
--
-- Check before adding a one-seat-per-startup constraint (must return no rows):
--   SELECT "startupId", "userId", count(*) FROM "StartupMember"
--    WHERE "userId" IS NOT NULL GROUP BY 1, 2 HAVING count(*) > 1;
