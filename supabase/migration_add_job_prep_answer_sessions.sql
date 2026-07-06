-- ============================================
-- Migration: Link Job Prep answer attempts to Replay sessions
-- ============================================

ALTER TABLE interview_answer_attempts
    ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES sessions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_interview_answer_attempts_session_id
    ON interview_answer_attempts(session_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_interview_answer_attempts_session_id_unique
    ON interview_answer_attempts(session_id)
    WHERE session_id IS NOT NULL;

-- ============================================
-- Migration complete!
-- ============================================
