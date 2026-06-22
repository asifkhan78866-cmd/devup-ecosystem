-- Migration: add data-driven detail-page fields to Hackathon
-- Safe & additive: all columns are nullable, so existing rows are unaffected and
-- the frontend falls back to its built-in defaults when a column is NULL.
--
-- Apply to Render (or any Postgres) with either:
--   psql "$DATABASE_URL" -f backend/scripts/2026_hackathon_detail_fields.sql
-- or simply run `npx prisma db push` from backend/ (schema already updated).

ALTER TABLE "Hackathon" ADD COLUMN IF NOT EXISTS "subtitle"        TEXT;
ALTER TABLE "Hackathon" ADD COLUMN IF NOT EXISTS "domainsDetailed" JSONB;
ALTER TABLE "Hackathon" ADD COLUMN IF NOT EXISTS "timeline"        JSONB;
ALTER TABLE "Hackathon" ADD COLUMN IF NOT EXISTS "perks"           JSONB;
ALTER TABLE "Hackathon" ADD COLUMN IF NOT EXISTS "logistics"       JSONB;
