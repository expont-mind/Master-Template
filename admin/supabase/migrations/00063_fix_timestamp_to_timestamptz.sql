-- ============================================================================
-- Fix TIMESTAMP columns to TIMESTAMPTZ
--
-- Problem: TIMESTAMP (without timezone) columns store UTC time from NOW() but
-- Supabase returns them without timezone indicator. JavaScript's new Date()
-- parses them as local time, causing an 8-hour offset for Asia/Ulaanbaatar.
--
-- Solution: ALTER to TIMESTAMPTZ. PostgreSQL treats existing TIMESTAMP values
-- as being in the session timezone (UTC on Supabase), so conversion is correct.
-- After this, Supabase returns timestamps with +00:00 suffix and JS parses
-- them correctly as UTC.
-- ============================================================================

-- Orders table
ALTER TABLE orders
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';

-- Admin notifications table
ALTER TABLE admin_notifications
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
