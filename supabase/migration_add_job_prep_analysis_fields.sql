-- ============================================
-- Migration: Add analysis metadata to resume_job_analyses
-- ============================================

ALTER TABLE resume_job_analyses
    ADD COLUMN IF NOT EXISTS error_message TEXT,
    ADD COLUMN IF NOT EXISTS provider TEXT,
    ADD COLUMN IF NOT EXISTS model TEXT;

-- ============================================
-- Migration complete!
-- ============================================
