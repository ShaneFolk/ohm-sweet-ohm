-- Phase 5: per-visitor open-ticket cap for demo accounts.
-- Already included in schema.sql for fresh databases. Run this once on an
-- existing database. Safe to run twice (IF NOT EXISTS).
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS submitter_ip_hash TEXT;
