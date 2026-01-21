-- ============================================
-- Interview Replay App - Database Schema
-- ============================================
-- Run this SQL in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. ENABLE REQUIRED EXTENSIONS
-- ============================================
-- Enable pgcrypto for gen_random_uuid() function
-- (uuid-ossp is an alternative, but pgcrypto is recommended)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 2. CREATE TABLES
-- ============================================

-- --------------------------------------------
-- profiles: User profile data linked to auth.users
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    company TEXT,
    job_title TEXT,
    timezone TEXT DEFAULT 'UTC',
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------
-- sessions: Interview recording sessions
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'recording', 'recorded', 'processing', 'ready', 'archived')),
    duration_seconds INTEGER,
    video_url TEXT,
    audio_url TEXT,
    thumbnail_url TEXT,
    -- Audio file metadata (populated after upload)
    audio_storage_path TEXT,
    audio_duration_seconds INTEGER,
    audio_mime_type TEXT,
    audio_file_size_bytes BIGINT,
    -- Video file metadata (populated after upload)
    video_storage_path TEXT,
    video_duration_seconds INTEGER,
    video_mime_type TEXT,
    video_file_size_bytes BIGINT,
    -- Media type indicator (audio or video)
    media_type TEXT CHECK (media_type IN ('audio', 'video')),
    metadata JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    recorded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------
-- bookmarks: Markers/timestamps within sessions
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    timestamp_seconds INTEGER NOT NULL,
    label TEXT NOT NULL,
    description TEXT,
    bookmark_type TEXT DEFAULT 'general' CHECK (bookmark_type IN ('general', 'question', 'answer', 'highlight', 'issue', 'follow_up')),
    color TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------
-- session_notes: Notes taken during/after sessions
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS session_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    timestamp_seconds INTEGER,
    note_type TEXT DEFAULT 'general' CHECK (note_type IN ('general', 'summary', 'feedback', 'action_item', 'question')),
    is_private BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------
-- transcripts: Transcription data for sessions
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS transcripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    language TEXT NOT NULL DEFAULT 'en',
    content TEXT,
    segments JSONB DEFAULT '[]',
    speaker_labels JSONB DEFAULT '{}',
    confidence_score DECIMAL(5, 4),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    word_count INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(session_id, language)
);

-- --------------------------------------------
-- session_shares: Sharing sessions with others
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS session_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    shared_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    shared_with_email TEXT,
    shared_with_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    permission TEXT NOT NULL DEFAULT 'view' CHECK (permission IN ('view', 'comment', 'edit')),
    share_token TEXT UNIQUE,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    accessed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------
-- ai_jobs: AI processing jobs queue
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS ai_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    job_type TEXT NOT NULL CHECK (job_type IN ('transcription', 'summarization', 'analysis', 'sentiment', 'action_items', 'custom')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'queued', 'processing', 'completed', 'failed', 'cancelled')),
    priority INTEGER NOT NULL DEFAULT 0,
    input_data JSONB DEFAULT '{}',
    config JSONB DEFAULT '{}',
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------
-- ai_outputs: Results from AI processing
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS ai_outputs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ai_job_id UUID NOT NULL REFERENCES ai_jobs(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    output_type TEXT NOT NULL CHECK (output_type IN ('transcript', 'summary', 'analysis', 'sentiment', 'action_items', 'insights', 'custom')),
    content TEXT,
    structured_data JSONB DEFAULT '{}',
    model_used TEXT,
    tokens_used INTEGER,
    confidence_score DECIMAL(5, 4),
    is_approved BOOLEAN DEFAULT FALSE,
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 3. CREATE INDEXES
-- ============================================

-- profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- sessions indexes (primary query patterns)
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id_status ON sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id_created_at ON sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_is_public ON sessions(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_sessions_tags ON sessions USING GIN(tags);

-- bookmarks indexes (frequently queried with session_id)
CREATE INDEX IF NOT EXISTS idx_bookmarks_session_id ON bookmarks(session_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_session_timestamp ON bookmarks(session_id, timestamp_seconds);
CREATE INDEX IF NOT EXISTS idx_bookmarks_session_user ON bookmarks(session_id, user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_type ON bookmarks(bookmark_type);

-- session_notes indexes
CREATE INDEX IF NOT EXISTS idx_session_notes_session_id ON session_notes(session_id);
CREATE INDEX IF NOT EXISTS idx_session_notes_user_id ON session_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_session_notes_session_user ON session_notes(session_id, user_id);

-- transcripts indexes
CREATE INDEX IF NOT EXISTS idx_transcripts_session_id ON transcripts(session_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_status ON transcripts(status);

-- session_shares indexes
CREATE INDEX IF NOT EXISTS idx_session_shares_session_id ON session_shares(session_id);
CREATE INDEX IF NOT EXISTS idx_session_shares_shared_by ON session_shares(shared_by_user_id);
CREATE INDEX IF NOT EXISTS idx_session_shares_shared_with_user ON session_shares(shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_session_shares_shared_with_email ON session_shares(shared_with_email);
CREATE INDEX IF NOT EXISTS idx_session_shares_token ON session_shares(share_token) WHERE share_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_session_shares_active ON session_shares(is_active) WHERE is_active = TRUE;

-- ai_jobs indexes
CREATE INDEX IF NOT EXISTS idx_ai_jobs_session_id ON ai_jobs(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_user_id ON ai_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_status ON ai_jobs(status);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_type_status ON ai_jobs(job_type, status);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_pending ON ai_jobs(priority DESC, created_at ASC) WHERE status IN ('pending', 'queued');

-- ai_outputs indexes
CREATE INDEX IF NOT EXISTS idx_ai_outputs_job_id ON ai_outputs(ai_job_id);
CREATE INDEX IF NOT EXISTS idx_ai_outputs_session_id ON ai_outputs(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_outputs_user_id ON ai_outputs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_outputs_type ON ai_outputs(output_type);

-- ============================================
-- 4. CREATE UPDATED_AT TRIGGER FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. ATTACH TRIGGERS TO ALL TABLES
-- ============================================

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookmarks_updated_at
    BEFORE UPDATE ON bookmarks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_notes_updated_at
    BEFORE UPDATE ON session_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transcripts_updated_at
    BEFORE UPDATE ON transcripts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_shares_updated_at
    BEFORE UPDATE ON session_shares
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_jobs_updated_at
    BEFORE UPDATE ON ai_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_outputs_updated_at
    BEFORE UPDATE ON ai_outputs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
-- Enable RLS on all tables

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_outputs ENABLE ROW LEVEL SECURITY;

-- profiles: Users can only access their own profile
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- sessions: Users can access their own sessions + shared sessions
CREATE POLICY "Users can view own sessions"
    ON sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view public sessions"
    ON sessions FOR SELECT
    USING (is_public = TRUE);

CREATE POLICY "Users can view shared sessions"
    ON sessions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM session_shares
            WHERE session_shares.session_id = sessions.id
            AND session_shares.is_active = TRUE
            AND (
                session_shares.shared_with_user_id = auth.uid()
                OR session_shares.shared_with_email = auth.email()
            )
            AND (session_shares.expires_at IS NULL OR session_shares.expires_at > NOW())
        )
    );

CREATE POLICY "Users can insert own sessions"
    ON sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
    ON sessions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
    ON sessions FOR DELETE
    USING (auth.uid() = user_id);

-- bookmarks: Users can access bookmarks on sessions they own or have access to
CREATE POLICY "Users can view own bookmarks"
    ON bookmarks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookmarks"
    ON bookmarks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookmarks"
    ON bookmarks FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
    ON bookmarks FOR DELETE
    USING (auth.uid() = user_id);

-- session_notes: Users can access their own notes
CREATE POLICY "Users can view own notes"
    ON session_notes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes"
    ON session_notes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes"
    ON session_notes FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes"
    ON session_notes FOR DELETE
    USING (auth.uid() = user_id);

-- transcripts: Users can view transcripts for sessions they own
CREATE POLICY "Users can view transcripts for own sessions"
    ON transcripts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM sessions
            WHERE sessions.id = transcripts.session_id
            AND sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert transcripts for own sessions"
    ON transcripts FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM sessions
            WHERE sessions.id = transcripts.session_id
            AND sessions.user_id = auth.uid()
        )
    );

-- session_shares: Users can manage shares for their own sessions
CREATE POLICY "Users can view shares they created"
    ON session_shares FOR SELECT
    USING (auth.uid() = shared_by_user_id);

CREATE POLICY "Users can view shares with them"
    ON session_shares FOR SELECT
    USING (auth.uid() = shared_with_user_id);

CREATE POLICY "Users can insert shares for own sessions"
    ON session_shares FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM sessions
            WHERE sessions.id = session_shares.session_id
            AND sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own shares"
    ON session_shares FOR UPDATE
    USING (auth.uid() = shared_by_user_id);

CREATE POLICY "Users can delete own shares"
    ON session_shares FOR DELETE
    USING (auth.uid() = shared_by_user_id);

-- ai_jobs: Users can access their own AI jobs
CREATE POLICY "Users can view own ai_jobs"
    ON ai_jobs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ai_jobs"
    ON ai_jobs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ai_jobs"
    ON ai_jobs FOR UPDATE
    USING (auth.uid() = user_id);

-- ai_outputs: Users can access their own AI outputs
CREATE POLICY "Users can view own ai_outputs"
    ON ai_outputs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ai_outputs"
    ON ai_outputs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ai_outputs"
    ON ai_outputs FOR UPDATE
    USING (auth.uid() = user_id);

-- ============================================
-- 7. HELPER FUNCTION: Auto-create profile on signup
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile when a new user signs up
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 8. STORAGE BUCKET AND POLICIES
-- ============================================
-- Create a private storage bucket for replay recordings
-- NOTE: Bucket creation must be done via Supabase Dashboard or API
-- The SQL below creates the RLS policies for the bucket

-- First, create the bucket (run this via Supabase Dashboard SQL Editor)
-- The bucket is PRIVATE by default (public = false)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'replays',
    'replays',
    FALSE,  -- PRIVATE bucket - no public access
    104857600,  -- 100MB file size limit (increased for video)
    ARRAY[
        -- Audio MIME types
        'audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav',
        -- Video MIME types
        'video/webm', 'video/mp4', 'video/quicktime', 'video/x-msvideo'
    ]::text[]
)
ON CONFLICT (id) DO UPDATE SET
    public = FALSE,
    file_size_limit = 104857600,
    allowed_mime_types = ARRAY[
        'audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav',
        'video/webm', 'video/mp4', 'video/quicktime', 'video/x-msvideo'
    ]::text[];

-- --------------------------------------------
-- Storage Policy: Authenticated users can upload to their own folder
-- Path pattern: {user_id}/{session_id}/audio.webm
-- --------------------------------------------

-- Policy: Users can upload files to their own user_id folder
CREATE POLICY "Users can upload to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'replays'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update/overwrite their own files
CREATE POLICY "Users can update own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'replays'
    AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
    bucket_id = 'replays'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can read/select their own files
CREATE POLICY "Users can read own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'replays'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'replays'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- --------------------------------------------
-- Optional: Additional policy to validate session ownership
-- This ensures users can only upload to sessions they own
-- Uncomment if you want stricter validation
-- --------------------------------------------

-- DROP POLICY IF EXISTS "Users can upload to own folder" ON storage.objects;
-- 
-- CREATE POLICY "Users can upload to own sessions"
-- ON storage.objects
-- FOR INSERT
-- TO authenticated
-- WITH CHECK (
--     bucket_id = 'replays'
--     AND (storage.foldername(name))[1] = auth.uid()::text
--     AND EXISTS (
--         SELECT 1 FROM sessions
--         WHERE sessions.id::text = (storage.foldername(name))[2]
--         AND sessions.user_id = auth.uid()
--     )
-- );

-- ============================================
-- DONE! All tables, indexes, triggers, storage
-- bucket, and RLS policies have been created.
-- ============================================
