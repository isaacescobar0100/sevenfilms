-- Migration: Add metadata column and reaction type to notifications
-- Run this in Supabase SQL Editor

-- Step 1: Add metadata column for storing additional notification data (like reaction type)
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL;

-- Step 2: Drop the existing type constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Step 3: Add new constraint that includes 'reaction' type
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
    CHECK (type IN ('like', 'comment', 'follow', 'movie_upload', 'reaction'));

-- Step 4: Create index for metadata queries (optional, for performance)
CREATE INDEX IF NOT EXISTS idx_notifications_metadata ON notifications USING GIN (metadata);

-- Verify the changes
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'notifications';
