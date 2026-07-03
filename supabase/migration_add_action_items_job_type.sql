-- ============================================
-- Migration: Add 'action_items' job type to ai_jobs
-- ============================================
-- This migration adds support for the 'action_items' job_type
-- to allow generating actionable follow-up items from a session transcript.
-- ============================================

-- ============================================
-- 1. UPDATE ai_jobs JOB_TYPE CHECK CONSTRAINT
-- ============================================
-- Drop the existing constraint and recreate with 'action_items'
-- Note: PostgreSQL requires dropping and recreating CHECK constraints

ALTER TABLE ai_jobs DROP CONSTRAINT IF EXISTS ai_jobs_job_type_check;

ALTER TABLE ai_jobs ADD CONSTRAINT ai_jobs_job_type_check
    CHECK (job_type IN ('transcript', 'summary', 'score', 'suggest_bookmarks', 'action_items'));

-- ============================================
-- DONE! 'action_items' job type is now supported.
-- ============================================
