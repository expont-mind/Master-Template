-- ============================================================================
-- BRANCHES SCHEMA UPDATE
-- Update branches table to match frontend design
-- ============================================================================

-- Drop the unique index on is_main first
DROP INDEX IF EXISTS idx_branches_main;

-- Remove old columns
ALTER TABLE branches
  DROP COLUMN IF EXISTS city,
  DROP COLUMN IF EXISTS district,
  DROP COLUMN IF EXISTS latitude,
  DROP COLUMN IF EXISTS longitude,
  DROP COLUMN IF EXISTS is_main,
  DROP COLUMN IF EXISTS working_hours;

-- Add new columns
ALTER TABLE branches
  ADD COLUMN IF NOT EXISTS weekday_hours VARCHAR(100),
  ADD COLUMN IF NOT EXISTS weekend_hours VARCHAR(100),
  ADD COLUMN IF NOT EXISTS google_maps_url TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;

-- Create index for sorting
CREATE INDEX IF NOT EXISTS idx_branches_sort_order ON branches(sort_order ASC);

-- ============================================================================
-- DONE!
-- ============================================================================
