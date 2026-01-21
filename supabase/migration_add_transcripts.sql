-- ============================================
-- Migration: Add transcripts table for manual transcript input
-- ============================================
-- This migration creates a new transcripts_manual table for user-provided transcripts
-- with a unique constraint on session_id + provider to allow one transcript per provider per session

-- ============================================
-- 1. CREATE TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS transcripts_manual (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    provider TEXT NOT NULL DEFAULT 'manual',
    content TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure one transcript per session per provider
    UNIQUE(session_id, provider)
);

-- ============================================
-- 2. CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_transcripts_manual_session_id ON transcripts_manual(session_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_manual_user_id ON transcripts_manual(user_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_manual_session_provider ON transcripts_manual(session_id, provider);

-- ============================================
-- 3. CREATE UPDATED_AT TRIGGER
-- ============================================

CREATE TRIGGER update_transcripts_manual_updated_at
    BEFORE UPDATE ON transcripts_manual
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

ALTER TABLE transcripts_manual ENABLE ROW LEVEL SECURITY;

-- Users can view their own transcripts
CREATE POLICY "Users can view own transcripts"
    ON transcripts_manual FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert transcripts for sessions they own
CREATE POLICY "Users can insert own transcripts"
    ON transcripts_manual FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM sessions
            WHERE sessions.id = transcripts_manual.session_id
            AND sessions.user_id = auth.uid()
        )
    );

-- Users can update their own transcripts
CREATE POLICY "Users can update own transcripts"
    ON transcripts_manual FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own transcripts
CREATE POLICY "Users can delete own transcripts"
    ON transcripts_manual FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- DONE! transcripts_manual table created with RLS
-- ============================================
