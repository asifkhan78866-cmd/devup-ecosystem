-- Migration: private access tokens for hackathon registrations.
--
-- Additive only: two nullable columns and a unique index. Code from before this
-- change ignores them, so apply this BEFORE deploying the backend that reads
-- them (the reverse order would fail every hackathon-lead query):
--
--   psql "$DIRECT_URL" -f backend/scripts/2026_hackathon_lead_access.sql
--
-- Safe to re-run. Existing registrations get a token the first time their team
-- asks for an access link by email.

BEGIN;

ALTER TABLE "HackathonLead" ADD COLUMN IF NOT EXISTS "accessTokenHash" TEXT;
ALTER TABLE "HackathonLead" ADD COLUMN IF NOT EXISTS "accessLinkSentAt" TIMESTAMP(3);
CREATE UNIQUE INDEX IF NOT EXISTS "HackathonLead_accessTokenHash_key"
  ON "HackathonLead" ("accessTokenHash");

COMMIT;
