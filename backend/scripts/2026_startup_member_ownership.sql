-- Migration: repurpose StartupMember.role/status into permission tiers
-- Turns the free-form job-title `role` and PENDING/ACTIVE/REMOVED `status`
-- columns into permission-tier enums used by resource-scoped ownership:
--   role   -> StartupMemberRole   (OWNER | ADMIN | MEMBER)
--   status -> StartupMemberStatus (ACTIVE | INVITED)
--
-- NOT purely additive: existing rows are mapped in place and soft-deleted
-- (REMOVED) rows are dropped, since removal is now a hard delete. Run this
-- BEFORE `prisma db push` (or instead of it) so the enum cast succeeds.
--
-- Apply with:
--   psql "$DATABASE_URL" -f backend/scripts/2026_startup_member_ownership.sql

BEGIN;

-- 1. Enum types (idempotent)
DO $$ BEGIN
  CREATE TYPE "StartupMemberRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "StartupMemberStatus" AS ENUM ('ACTIVE', 'INVITED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. New createdAt column (backfilled from invitedAt where present)
ALTER TABLE "StartupMember"
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
UPDATE "StartupMember" SET "createdAt" = "invitedAt" WHERE "invitedAt" IS NOT NULL;

-- 3. Drop soft-deleted rows — REMOVED is no longer a representable status
DELETE FROM "StartupMember" WHERE "status" = 'REMOVED';

-- 4. Convert role: Founder/Co-Founder -> OWNER, CTO -> ADMIN, everything else -> MEMBER
ALTER TABLE "StartupMember" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "StartupMember"
  ALTER COLUMN "role" TYPE "StartupMemberRole"
  USING (
    CASE
      WHEN "role" IN ('Founder', 'Co-Founder') THEN 'OWNER'
      WHEN "role" = 'CTO'                        THEN 'ADMIN'
      ELSE 'MEMBER'
    END
  )::"StartupMemberRole";
ALTER TABLE "StartupMember" ALTER COLUMN "role" SET DEFAULT 'MEMBER';

-- 5. Convert status: ACTIVE stays ACTIVE, anything else (PENDING) -> INVITED
ALTER TABLE "StartupMember" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "StartupMember"
  ALTER COLUMN "status" TYPE "StartupMemberStatus"
  USING (
    CASE
      WHEN "status" = 'ACTIVE' THEN 'ACTIVE'
      ELSE 'INVITED'
    END
  )::"StartupMemberStatus";
ALTER TABLE "StartupMember" ALTER COLUMN "status" SET DEFAULT 'INVITED';

-- 6. Drop obsolete soft-delete column
ALTER TABLE "StartupMember" DROP COLUMN IF EXISTS "removedAt";

-- 7. Index for the requireStartupAccess lookup (userId + startupId)
CREATE INDEX IF NOT EXISTS "StartupMember_userId_startupId_idx"
  ON "StartupMember" ("userId", "startupId");

COMMIT;
