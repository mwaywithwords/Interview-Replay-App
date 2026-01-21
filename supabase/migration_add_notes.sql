-- ============================================
-- Migration: Add Session Notes and Bookmark Notes
-- ============================================
-- This migration creates:
-- 1. session_note table: One note document per session (for the Notes tab)
-- 2. bookmark_notes table: Multiple notes per bookmark
-- ============================================

-- ============================================
-- 1. CREATE session_note TABLE
-- ============================================
-- Stores a single note document per session.
-- Uses UNIQUE constraint on (user_id, session_id) to enforce one note per session per user.

CREATE TABLE IF NOT EXISTS session_note (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    content TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Enforce one note per session per user
    UNIQUE(user_id, session_id)
);

-- ============================================
-- 2. CREATE bookmark_notes TABLE
-- ============================================
-- Stores multiple notes per bookmark.

CREATE TABLE IF NOT EXISTS bookmark_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bookmark_id UUID NOT NULL REFERENCES bookmarks(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 3. CREATE INDEXES
-- ============================================

-- session_note indexes
CREATE INDEX IF NOT EXISTS idx_session_note_user_id ON session_note(user_id);
CREATE INDEX IF NOT EXISTS idx_session_note_session_id ON session_note(session_id);
CREATE INDEX IF NOT EXISTS idx_session_note_user_session ON session_note(user_id, session_id);

-- bookmark_notes indexes
CREATE INDEX IF NOT EXISTS idx_bookmark_notes_user_id ON bookmark_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmark_notes_bookmark_id ON bookmark_notes(bookmark_id);
CREATE INDEX IF NOT EXISTS idx_bookmark_notes_user_bookmark ON bookmark_notes(user_id, bookmark_id);
CREATE INDEX IF NOT EXISTS idx_bookmark_notes_created_at ON bookmark_notes(bookmark_id, created_at);

-- ============================================
-- 4. CREATE UPDATED_AT TRIGGER FOR session_note
-- ============================================
-- Note: The trigger function update_updated_at_column() already exists from schema.sql

CREATE TRIGGER update_session_note_updated_at
    BEFORE UPDATE ON session_note
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE session_note ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmark_notes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. RLS POLICIES FOR session_note
-- ============================================

-- Users can view their own session notes
CREATE POLICY "Users can view own session notes"
    ON session_note FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own session notes
CREATE POLICY "Users can insert own session notes"
    ON session_note FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own session notes
CREATE POLICY "Users can update own session notes"
    ON session_note FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own session notes
CREATE POLICY "Users can delete own session notes"
    ON session_note FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- 7. RLS POLICIES FOR bookmark_notes
-- ============================================

-- Users can view their own bookmark notes
CREATE POLICY "Users can view own bookmark notes"
    ON bookmark_notes FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own bookmark notes
CREATE POLICY "Users can insert own bookmark notes"
    ON bookmark_notes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own bookmark notes
CREATE POLICY "Users can delete own bookmark notes"
    ON bookmark_notes FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- DONE! Tables, indexes, triggers, and RLS 
-- policies have been created.
-- ============================================
