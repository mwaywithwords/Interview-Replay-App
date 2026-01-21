-- ============================================
-- Migration: Add recording_type and enforce single recording per session
-- ============================================
-- This migration updates the sessions table to:
-- 1. Rename media_type to recording_type
-- 2. Add constraint to ensure only one storage path is set at a time
-- ============================================

-- Step 1: Add recording_type column (if media_type exists, migrate data)
DO $$
BEGIN
  -- Check if media_type column exists and migrate data
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sessions' AND column_name = 'media_type'
  ) THEN
    -- Add recording_type column
    ALTER TABLE sessions ADD COLUMN IF NOT EXISTS recording_type TEXT;
    
    -- Migrate data from media_type to recording_type
    UPDATE sessions SET recording_type = media_type WHERE media_type IS NOT NULL;
    
    -- Drop old media_type column
    ALTER TABLE sessions DROP COLUMN IF EXISTS media_type;
  ELSE
    -- If media_type doesn't exist, just add recording_type
    ALTER TABLE sessions ADD COLUMN IF NOT EXISTS recording_type TEXT;
  END IF;
END $$;

-- Step 2: Drop the constraint if it exists (in case migration was partially run)
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS check_single_recording;

-- Step 3: Clean up any existing data BEFORE adding the constraint
-- For sessions with both paths set: prefer video, clear audio
UPDATE sessions 
SET 
    recording_type = 'video',
    audio_storage_path = NULL,
    audio_duration_seconds = NULL,
    audio_mime_type = NULL,
    audio_file_size_bytes = NULL
WHERE audio_storage_path IS NOT NULL 
  AND video_storage_path IS NOT NULL;

-- Step 4: Set recording_type based on which storage path exists (for rows where it's NULL)
UPDATE sessions 
SET recording_type = CASE 
    WHEN audio_storage_path IS NOT NULL AND video_storage_path IS NULL THEN 'audio'
    WHEN video_storage_path IS NOT NULL AND audio_storage_path IS NULL THEN 'video'
    ELSE NULL
END
WHERE recording_type IS NULL;

-- Step 5: For sessions with neither path set, ensure recording_type is NULL
UPDATE sessions 
SET recording_type = NULL
WHERE audio_storage_path IS NULL 
  AND video_storage_path IS NULL
  AND recording_type IS NOT NULL;

-- Step 6: NOW add the CHECK constraint (after data is cleaned up)
ALTER TABLE sessions ADD CONSTRAINT check_single_recording CHECK (
    (recording_type = 'audio' AND audio_storage_path IS NOT NULL AND video_storage_path IS NULL) OR
    (recording_type = 'video' AND video_storage_path IS NOT NULL AND audio_storage_path IS NULL) OR
    (recording_type IS NULL AND audio_storage_path IS NULL AND video_storage_path IS NULL)
);

-- ============================================
-- Migration complete!
-- ============================================
