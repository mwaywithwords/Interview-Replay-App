-- ============================================
-- Migration: Fix check_single_recording constraint
-- ============================================
-- This migration fixes the constraint to allow recording_type
-- to be set even when storage paths are NULL (for draft sessions).
-- The constraint should only enforce the rule when storage paths are set.
-- ============================================

-- Step 1: Drop the existing constraint
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS check_single_recording;

-- Step 2: Add the updated constraint that allows recording_type to be set
-- even when storage paths are NULL (for draft sessions)
ALTER TABLE sessions ADD CONSTRAINT check_single_recording CHECK (
    -- Case 1: recording_type is 'audio'
    -- Allow audio_storage_path to be NULL (draft) or NOT NULL (recorded)
    -- But video_storage_path must always be NULL
    (recording_type = 'audio' AND video_storage_path IS NULL) OR
    
    -- Case 2: recording_type is 'video'
    -- Allow video_storage_path to be NULL (draft) or NOT NULL (recorded)
    -- But audio_storage_path must always be NULL
    (recording_type = 'video' AND audio_storage_path IS NULL) OR
    
    -- Case 3: recording_type is NULL
    -- Both storage paths must be NULL
    (recording_type IS NULL AND audio_storage_path IS NULL AND video_storage_path IS NULL)
);

-- ============================================
-- Migration complete!
-- ============================================
-- The constraint now allows:
-- - recording_type = 'audio' with audio_storage_path = NULL (draft) or NOT NULL (recorded)
-- - recording_type = 'video' with video_storage_path = NULL (draft) or NOT NULL (recorded)
-- - recording_type = NULL with both storage paths = NULL
-- But prevents:
-- - Both storage paths being set at the same time
-- - recording_type = 'audio' with video_storage_path set
-- - recording_type = 'video' with audio_storage_path set
-- ============================================
