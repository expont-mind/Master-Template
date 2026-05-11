-- Migration: Improve events table with new fields
-- Adds: slug, location, image_url, video_url columns

-- Add slug column with unique constraint
ALTER TABLE events ADD COLUMN IF NOT EXISTS slug VARCHAR UNIQUE;

-- Add location column
ALTER TABLE events ADD COLUMN IF NOT EXISTS location TEXT;

-- Add image_url column
ALTER TABLE events ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add video_url column for YouTube embeds
ALTER TABLE events ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Create function to generate slug from title
CREATE OR REPLACE FUNCTION generate_event_slug()
RETURNS TRIGGER AS $$
DECLARE
    base_slug TEXT;
    new_slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- If slug is already provided and not empty, use it
    IF NEW.slug IS NOT NULL AND NEW.slug != '' THEN
        RETURN NEW;
    END IF;

    -- Generate base slug from title
    base_slug := lower(regexp_replace(NEW.title, '[^a-zA-Z0-9\u0400-\u04FF]+', '-', 'g'));
    base_slug := trim(both '-' from base_slug);

    new_slug := base_slug;

    -- Check for uniqueness and append counter if needed
    WHILE EXISTS (SELECT 1 FROM events WHERE slug = new_slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) LOOP
        counter := counter + 1;
        new_slug := base_slug || '-' || counter;
    END LOOP;

    NEW.slug := new_slug;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-generating slug
DROP TRIGGER IF EXISTS events_generate_slug ON events;
CREATE TRIGGER events_generate_slug
    BEFORE INSERT OR UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION generate_event_slug();

-- Update existing events without slug
UPDATE events SET slug = lower(regexp_replace(title, '[^a-zA-Z0-9\u0400-\u04FF]+', '-', 'g')) WHERE slug IS NULL;

-- Create index for slug lookups
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);

-- Create index for date-based queries
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);

-- Grant permissions
GRANT SELECT ON events TO anon;
GRANT ALL ON events TO authenticated;
