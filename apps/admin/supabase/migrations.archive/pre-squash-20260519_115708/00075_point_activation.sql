-- Add point activation tracking column to users table
-- NULL = not activated, non-NULL = activated at that timestamp
ALTER TABLE users ADD COLUMN IF NOT EXISTS point_activated_at TIMESTAMPTZ;
