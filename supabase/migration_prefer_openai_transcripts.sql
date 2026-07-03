-- ============================================
-- Migration: Prefer OpenAI transcripts with manual fallback
-- ============================================
-- Updates shared transcript lookup to match app/AI lookup order.

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

    -- Return generated OpenAI transcript first, then manual transcript fallback.
    RETURN QUERY
    SELECT
        t.id,
        t.session_id,
        t.content,
        t.created_at
    FROM transcripts_manual t
    WHERE t.session_id = v_session_id
    AND t.user_id = v_owner_user_id
    AND t.provider IN ('openai', 'manual')
    AND LENGTH(BTRIM(t.content)) > 0
    ORDER BY CASE t.provider
        WHEN 'openai' THEN 1
        WHEN 'manual' THEN 2
        ELSE 3
    END
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_transcript_for_share(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_transcript_for_share(TEXT) TO authenticated;
