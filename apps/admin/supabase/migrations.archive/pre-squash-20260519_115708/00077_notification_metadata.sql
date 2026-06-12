-- Add metadata JSONB column to notifications table for structured data
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL;
