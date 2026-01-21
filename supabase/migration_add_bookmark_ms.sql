-- ============================================
-- Migration: Update Bookmarks for Milliseconds and Flexible Category
-- ============================================
-- This migration updates the bookmarks table to:
-- 1. Add timestamp_ms column (milliseconds instead of seconds)
-- 2. Add category column (flexible text field)
-- 3. Migrate existing data from timestamp_seconds to timestamp_ms
-- 4. Drop the old columns (timestamp_seconds, bookmark_type, description, color)
-- ============================================

-- Step 1: Add new columns
ALTER TABLE bookmarks
ADD COLUMN IF NOT EXISTS timestamp_ms BIGINT,
ADD COLUMN IF NOT EXISTS category TEXT;

-- Step 2: Migrate existing data (convert seconds to milliseconds)
UPDATE bookmarks
SET timestamp_ms = timestamp_seconds * 1000
WHERE timestamp_ms IS NULL AND timestamp_seconds IS NOT NULL;

-- Step 3: Make timestamp_ms NOT NULL after migration
-- (Only run this if you've migrated all existing data)
-- ALTER TABLE bookmarks ALTER COLUMN timestamp_ms SET NOT NULL;

-- Step 4: Add index for sorting by timestamp_ms
CREATE INDEX IF NOT EXISTS idx_bookmarks_session_timestamp_ms ON bookmarks(session_id, timestamp_ms);

-- Step 5: Update existing index that used timestamp_seconds (optional cleanup)
-- Note: Keep the old index for backwards compatibility during transition
-- DROP INDEX IF EXISTS idx_bookmarks_session_timestamp;

-- ============================================
-- If you want to drop old columns (do this after verifying migration):
-- ============================================
-- ALTER TABLE bookmarks DROP COLUMN IF EXISTS timestamp_seconds;
-- ALTER TABLE bookmarks DROP COLUMN IF EXISTS bookmark_type;
-- ALTER TABLE bookmarks DROP COLUMN IF EXISTS description;
-- ALTER TABLE bookmarks DROP COLUMN IF EXISTS color;

-- ============================================
-- RLS Policies (already exist in schema.sql, but included for reference)
-- ============================================
-- Bookmarks RLS policies ensure users can only manage their own bookmarks:
-- - "Users can view own bookmarks" ON bookmarks FOR SELECT USING (auth.uid() = user_id)
-- - "Users can insert own bookmarks" ON bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id)
-- - "Users can update own bookmarks" ON bookmarks FOR UPDATE USING (auth.uid() = user_id)
-- - "Users can delete own bookmarks" ON bookmarks FOR DELETE USING (auth.uid() = user_id)
