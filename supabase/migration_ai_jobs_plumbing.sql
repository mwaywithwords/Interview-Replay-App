-- ============================================
-- AI Jobs Plumbing Migration
-- ============================================
-- This migration creates the ai_jobs and ai_outputs tables
-- with the exact schema needed for AI job creation and display.
-- ============================================

-- ============================================
-- PREREQUISITE: If you have old ai_jobs/ai_outputs tables,
-- run these commands manually first:
--
--   DROP TABLE IF EXISTS ai_outputs;
--   DROP TABLE IF EXISTS ai_jobs;
--
-- The old schema from schema.sql is incompatible.
-- ============================================

-- ============================================
-- 1. CREATE ai_jobs TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS ai_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    job_type TEXT NOT NULL CHECK (job_type IN ('transcript', 'summary', 'score', 'suggest_bookmarks')),
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
    provider TEXT,
    model TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. CREATE ai_outputs TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS ai_outputs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES ai_jobs(id) ON DELETE CASCADE,
    output_type TEXT NOT NULL,
    content JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 3. CREATE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_ai_jobs_user_id ON ai_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_session_id ON ai_jobs(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_status ON ai_jobs(status);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_session_user ON ai_jobs(session_id, user_id);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_job_type ON ai_jobs(job_type);

CREATE INDEX IF NOT EXISTS idx_ai_outputs_user_id ON ai_outputs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_outputs_session_id ON ai_outputs(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_outputs_job_id ON ai_outputs(job_id);

-- ============================================
-- 4. CREATE UPDATED_AT TRIGGER
-- ============================================
DO $$
BEGIN
    CREATE TRIGGER update_ai_jobs_updated_at
        BEFORE UPDATE ON ai_jobs
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 5. ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE ai_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_outputs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. CREATE RLS POLICIES FOR ai_jobs
-- ============================================
DO $$ BEGIN
    CREATE POLICY "Users can view own ai_jobs" ON ai_jobs FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert own ai_jobs" ON ai_jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update own ai_jobs" ON ai_jobs FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can delete own ai_jobs" ON ai_jobs FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================
-- 7. CREATE RLS POLICIES FOR ai_outputs
-- ============================================
DO $$ BEGIN
    CREATE POLICY "Users can view own ai_outputs" ON ai_outputs FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert own ai_outputs" ON ai_outputs FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update own ai_outputs" ON ai_outputs FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can delete own ai_outputs" ON ai_outputs FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================
-- DONE! AI Jobs tables are ready.
-- ============================================
