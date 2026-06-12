-- ============================================================================
-- FAQ (Frequently Asked Questions) TABLE
-- ============================================================================

-- Create FAQ status enum (reusing content_status for consistency)
-- content_status already exists: draft, published, archived

-- Create FAQs table
CREATE TABLE IF NOT EXISTS faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(100),
    sort_order INT DEFAULT 0,
    status content_status DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for sorting and filtering
CREATE INDEX IF NOT EXISTS idx_faqs_status ON faqs(status);
CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category);
CREATE INDEX IF NOT EXISTS idx_faqs_sort_order ON faqs(sort_order);

-- Grant permissions
GRANT ALL ON faqs TO anon, authenticated, service_role;

-- Disable RLS for admin access (you can enable and add policies later)
ALTER TABLE faqs DISABLE ROW LEVEL SECURITY;

-- Add comment
COMMENT ON TABLE faqs IS 'Frequently Asked Questions for the platform';
