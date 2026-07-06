-- ============================================
-- Migration: AI answer rating for Job Prep attempts
-- ============================================

ALTER TABLE interview_answer_attempts
    ADD COLUMN IF NOT EXISTS rating_status TEXT
        CHECK (rating_status IN ('pending', 'processing', 'completed', 'failed')),
    ADD COLUMN IF NOT EXISTS rating_result JSONB,
    ADD COLUMN IF NOT EXISTS rating_error_message TEXT,
    ADD COLUMN IF NOT EXISTS rating_provider TEXT,
    ADD COLUMN IF NOT EXISTS rating_model TEXT;

-- ============================================
-- Migration complete!
-- ============================================
