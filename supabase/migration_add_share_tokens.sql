-- ============================================
-- Migration: Add Secure Share Token Functions
-- ============================================
-- This migration adds functions for secure, token-based session sharing.
-- It works with the EXISTING session_shares table from schema.sql.
-- 
-- Existing table columns used:
--   - shared_by_user_id (owner of the share)
--   - share_token (unique token for sharing)
--   - is_active (TRUE = active, FALSE = revoked)
--   - expires_at (NULL = no expiration)
-- ============================================

-- ============================================
-- 1. ADD MISSING INDEX FOR SHARE TOKEN LOOKUPS
-- ============================================

-- Ensure we have an index for active share token lookups
CREATE INDEX IF NOT EXISTS idx_session_shares_token_active 
    ON session_shares(share_token) 
    WHERE share_token IS NOT NULL AND is_active = TRUE;

-- ============================================
-- 2. CREATE FUNCTION FOR PUBLIC TOKEN LOOKUP
-- ============================================
-- This function allows looking up a share by token without authentication
-- It returns the session_id only if the share is valid (active, not expired)

CREATE OR REPLACE FUNCTION public.get_shared_session_by_token(token TEXT)
RETURNS TABLE (
    session_id UUID,
    owner_user_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ss.session_id,
        ss.shared_by_user_id as owner_user_id
    FROM session_shares ss
    WHERE ss.share_token = token
    AND ss.is_active = TRUE
    AND (ss.expires_at IS NULL OR ss.expires_at > NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.get_shared_session_by_token(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_shared_session_by_token(TEXT) TO authenticated;

-- ============================================
-- 3. CREATE FUNCTION TO GET SESSION DATA FOR SHARE
-- ============================================
-- This function returns session data needed for the share view
-- It only returns minimal fields needed for display

CREATE OR REPLACE FUNCTION public.get_session_for_share(token TEXT)
RETURNS TABLE (
    id UUID,
    title TEXT,
    status TEXT,
    recording_type TEXT,
    audio_storage_path TEXT,
    video_storage_path TEXT,
    created_at TIMESTAMPTZ,
    session_type TEXT,
    owner_user_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.title,
        s.status,
        s.recording_type,
        s.audio_storage_path,
        s.video_storage_path,
        s.created_at,
        (s.metadata->>'session_type')::TEXT as session_type,
        ss.shared_by_user_id as owner_user_id
    FROM session_shares ss
    JOIN sessions s ON s.id = ss.session_id
    WHERE ss.share_token = token
    AND ss.is_active = TRUE
    AND (ss.expires_at IS NULL OR ss.expires_at > NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_session_for_share(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_session_for_share(TEXT) TO authenticated;

-- ============================================
-- 4. CREATE FUNCTION TO GET BOOKMARKS FOR SHARE
-- ============================================

CREATE OR REPLACE FUNCTION public.get_bookmarks_for_share(token TEXT)
RETURNS TABLE (
    id UUID,
    session_id UUID,
    timestamp_ms BIGINT,
    label TEXT,
    category TEXT,
    created_at TIMESTAMPTZ
) AS $$
DECLARE
    v_session_id UUID;
    v_owner_user_id UUID;
BEGIN
    -- First validate the share token
    SELECT ss.session_id, ss.shared_by_user_id
    INTO v_session_id, v_owner_user_id
    FROM session_shares ss
    WHERE ss.share_token = token
    AND ss.is_active = TRUE
    AND (ss.expires_at IS NULL OR ss.expires_at > NOW());
    
    IF v_session_id IS NULL THEN
        RETURN; -- Return empty if invalid token
    END IF;
    
    -- Return bookmarks for the session owned by the share owner
    RETURN QUERY
    SELECT 
        b.id,
        b.session_id,
        b.timestamp_ms,
        b.label,
        b.category,
        b.created_at
    FROM bookmarks b
    WHERE b.session_id = v_session_id
    AND b.user_id = v_owner_user_id
    ORDER BY b.timestamp_ms ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_bookmarks_for_share(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_bookmarks_for_share(TEXT) TO authenticated;

-- ============================================
-- 5. CREATE FUNCTION TO GET TRANSCRIPT FOR SHARE
-- ============================================

CREATE OR REPLACE FUNCTION public.get_transcript_for_share(token TEXT)
RETURNS TABLE (
    id UUID,
    session_id UUID,
    content TEXT,
    created_at TIMESTAMPTZ
) AS $$
DECLARE
    v_session_id UUID;
    v_owner_user_id UUID;
BEGIN
    -- First validate the share token
    SELECT ss.session_id, ss.shared_by_user_id
    INTO v_session_id, v_owner_user_id
    FROM session_shares ss
    WHERE ss.share_token = token
    AND ss.is_active = TRUE
    AND (ss.expires_at IS NULL OR ss.expires_at > NOW());
    
    IF v_session_id IS NULL THEN
        RETURN; -- Return empty if invalid token
    END IF;
    
    -- Return transcript for the session owned by the share owner
    RETURN QUERY
    SELECT 
        t.id,
        t.session_id,
        t.content,
        t.created_at
    FROM transcripts t
    WHERE t.session_id = v_session_id
    AND t.user_id = v_owner_user_id
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_transcript_for_share(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_transcript_for_share(TEXT) TO authenticated;

-- ============================================
-- 6. CREATE FUNCTION TO GET SESSION NOTE FOR SHARE
-- ============================================

CREATE OR REPLACE FUNCTION public.get_session_note_for_share(token TEXT)
RETURNS TABLE (
    id UUID,
    session_id UUID,
    content TEXT,
    created_at TIMESTAMPTZ
) AS $$
DECLARE
    v_session_id UUID;
    v_owner_user_id UUID;
BEGIN
    -- First validate the share token
    SELECT ss.session_id, ss.shared_by_user_id
    INTO v_session_id, v_owner_user_id
    FROM session_shares ss
    WHERE ss.share_token = token
    AND ss.is_active = TRUE
    AND (ss.expires_at IS NULL OR ss.expires_at > NOW());
    
    IF v_session_id IS NULL THEN
        RETURN; -- Return empty if invalid token
    END IF;
    
    -- Return session note for the session owned by the share owner
    RETURN QUERY
    SELECT 
        sn.id,
        sn.session_id,
        sn.content,
        sn.created_at
    FROM session_notes sn
    WHERE sn.session_id = v_session_id
    AND sn.user_id = v_owner_user_id
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_session_note_for_share(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_session_note_for_share(TEXT) TO authenticated;

-- ============================================
-- DONE! Share token functions are ready.
-- ============================================
-- 
-- The existing session_shares table from schema.sql is used:
--   - shared_by_user_id = owner of the share
--   - share_token = unique token for the share link
--   - is_active = TRUE for active shares, FALSE for revoked
--   - expires_at = expiration timestamp (NULL = never expires)
--
-- Usage:
-- 1. Create a share: INSERT INTO session_shares (session_id, shared_by_user_id, share_token, is_active) VALUES (...)
-- 2. Lookup share: SELECT * FROM get_shared_session_by_token('token')
-- 3. Get session data: SELECT * FROM get_session_for_share('token')
-- 4. Get bookmarks: SELECT * FROM get_bookmarks_for_share('token')
-- 5. Get transcript: SELECT * FROM get_transcript_for_share('token')
-- 6. Revoke share: UPDATE session_shares SET is_active = FALSE WHERE share_token = 'token'
-- ============================================
