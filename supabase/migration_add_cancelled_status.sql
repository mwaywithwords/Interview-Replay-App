-- ============================================
-- Migration: Add 'cancelled' status to ai_jobs
-- ============================================
-- This migration adds support for the 'cancelled' status
-- to allow users to cancel stuck queued or running jobs.
-- ============================================

-- ============================================
-- 1. UPDATE ai_jobs STATUS CHECK CONSTRAINT
-- ============================================
-- Drop the existing constraint and recreate with 'cancelled'
-- Note: PostgreSQL requires dropping and recreating CHECK constraints

ALTER TABLE ai_jobs DROP CONSTRAINT IF EXISTS ai_jobs_status_check;

ALTER TABLE ai_jobs ADD CONSTRAINT ai_jobs_status_check 
    CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled'));

-- ============================================
-- 2. ADD INDEX FOR CANCELLED STATUS (optional optimization)
-- ============================================
-- The existing status index will cover cancelled jobs too,
-- but this comment documents that cancelled is now a valid status.

-- ============================================
-- DONE! 'cancelled' status is now supported.
-- ============================================
