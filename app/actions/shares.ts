'use server';

import crypto from 'crypto';
import { createClient, requireUser } from '@/lib/supabase/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type {
  SessionShare,
  CreateSessionShareResult,
  SharedSessionData,
  SharedBookmark,
  SharedTranscript,
  SharedSessionNote,
} from '@/types';

/**
 * Generate a cryptographically secure random token
 * Uses 32 bytes of randomness encoded as URL-safe base64
 */
function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Create a Supabase client without authentication requirements
 * Used for public share endpoints
 */
async function createPublicClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore errors from Server Components
          }
        },
      },
    }
  );
}

/**
 * Server Action: Generate a share token for a session
 * 
 * Security:
 * - Validates the authenticated user owns the session
 * - Generates a cryptographically secure random token
 * - Creates a session_shares row
 * - Returns the full share URL (not the session ID)
 * 
 * @param sessionId - The session ID to share
 * @param expiresInDays - Optional: Number of days until the share expires (null = no expiration)
 * @returns Share URL and share details, or error
 */
export async function generateSessionShareToken(
  sessionId: string,
  expiresInDays?: number
): Promise<CreateSessionShareResult> {
  // Get authenticated user
  const user = await requireUser();
  const supabase = await createClient();

  // 1. Verify the authenticated user owns the session
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('id, user_id')
    .eq('id', sessionId)
    .single();

  if (sessionError || !session) {
    return { share: null, shareUrl: null, error: 'Session not found' };
  }

  if (session.user_id !== user.id) {
    return { share: null, shareUrl: null, error: 'You do not have permission to share this session' };
  }

  // 2. Generate a cryptographically secure random share token
  const shareToken = generateSecureToken();

  // 3. Calculate expiration date if specified
  let expiresAt: string | null = null;
  if (expiresInDays && expiresInDays > 0) {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + expiresInDays);
    expiresAt = expirationDate.toISOString();
  }

  // 4. Create the session_shares row (using existing schema column names)
  const { data: share, error: insertError } = await supabase
    .from('session_shares')
    .insert({
      session_id: sessionId,
      shared_by_user_id: user.id,
      share_token: shareToken,
      expires_at: expiresAt,
      is_active: true,
    })
    .select()
    .single();

  if (insertError) {
    console.error('Failed to create share:', insertError);
    return { share: null, shareUrl: null, error: 'Failed to create share link. Please try again.' };
  }

  // 5. Construct the share URL (without exposing session ID)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const shareUrl = `${baseUrl}/share/${shareToken}`;

  return {
    share: share as SessionShare,
    shareUrl,
    error: null,
  };
}

/**
 * Server Action: Get all active share links for a session
 * 
 * @param sessionId - The session ID
 * @returns Array of share links
 */
export async function getSessionShares(sessionId: string): Promise<{
  shares: SessionShare[];
  error: string | null;
}> {
  const user = await requireUser();
  const supabase = await createClient();

  // Verify ownership
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('user_id')
    .eq('id', sessionId)
    .single();

  if (sessionError || !session || session.user_id !== user.id) {
    return { shares: [], error: 'Session not found or access denied' };
  }

  // Get all shares for this session (using existing schema column names)
  const { data: shares, error } = await supabase
    .from('session_shares')
    .select('*')
    .eq('session_id', sessionId)
    .eq('shared_by_user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    return { shares: [], error: error.message };
  }

  return { shares: shares as SessionShare[], error: null };
}

/**
 * Server Action: Revoke a share link
 * 
 * @param shareId - The share ID to revoke
 * @returns Success status
 */
export async function revokeSessionShare(shareId: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  const user = await requireUser();
  const supabase = await createClient();

  // Set is_active = false to revoke (using existing schema)
  const { error } = await supabase
    .from('session_shares')
    .update({ is_active: false })
    .eq('id', shareId)
    .eq('shared_by_user_id', user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

// ============================================
// Public Share Data Access Functions
// These are used by the /share/[token] route
// ============================================

/**
 * Server Action: Get session data for a share view (public)
 * No authentication required - validates by share token
 * 
 * @param token - The share token
 * @returns Session data or null if invalid
 */
export async function getSharedSession(token: string): Promise<{
  session: SharedSessionData | null;
  error: string | null;
}> {
  const supabase = await createPublicClient();

  // Use the database function to get session data
  const { data, error } = await supabase
    .rpc('get_session_for_share', { token });

  if (error) {
    console.error('Error fetching shared session:', error);
    return { session: null, error: 'Share not found or has expired' };
  }

  if (!data || data.length === 0) {
    return { session: null, error: 'Share not found or has expired' };
  }

  return { session: data[0] as SharedSessionData, error: null };
}

/**
 * Server Action: Get bookmarks for a share view (public)
 * 
 * @param token - The share token
 * @returns Bookmarks array
 */
export async function getSharedBookmarks(token: string): Promise<{
  bookmarks: SharedBookmark[];
  error: string | null;
}> {
  const supabase = await createPublicClient();

  const { data, error } = await supabase
    .rpc('get_bookmarks_for_share', { token });

  if (error) {
    console.error('Error fetching shared bookmarks:', error);
    return { bookmarks: [], error: 'Failed to load bookmarks' };
  }

  return { bookmarks: (data || []) as SharedBookmark[], error: null };
}

/**
 * Server Action: Get transcript for a share view (public)
 * 
 * @param token - The share token
 * @returns Transcript or null
 */
export async function getSharedTranscript(token: string): Promise<{
  transcript: SharedTranscript | null;
  error: string | null;
}> {
  const supabase = await createPublicClient();

  const { data, error } = await supabase
    .rpc('get_transcript_for_share', { token });

  if (error) {
    console.error('Error fetching shared transcript:', error);
    return { transcript: null, error: 'Failed to load transcript' };
  }

  if (!data || data.length === 0) {
    return { transcript: null, error: null };
  }

  return { transcript: data[0] as SharedTranscript, error: null };
}

/**
 * Server Action: Get session note for a share view (public)
 * 
 * @param token - The share token
 * @returns Session note or null
 */
export async function getSharedSessionNote(token: string): Promise<{
  note: SharedSessionNote | null;
  error: string | null;
}> {
  const supabase = await createPublicClient();

  const { data, error } = await supabase
    .rpc('get_session_note_for_share', { token });

  if (error) {
    console.error('Error fetching shared session note:', error);
    return { note: null, error: 'Failed to load notes' };
  }

  if (!data || data.length === 0) {
    return { note: null, error: null };
  }

  return { note: data[0] as SharedSessionNote, error: null };
}

/**
 * Server Action: Create a signed URL for media playback from a share view
 * 
 * Security:
 * - Validates the share token is valid (not expired/revoked)
 * - Uses the owner's storage path to generate signed URL
 * - Does not require authentication (public share)
 * 
 * @param token - The share token
 * @returns Signed URL with 30 minute expiration
 */
export async function createSignedMediaUrlForShare(token: string): Promise<{
  url: string | null;
  recordingType: 'audio' | 'video' | null;
  expiresAt: number | null;
  error: string | null;
}> {
  const supabase = await createPublicClient();

  // First get the session data via the share token
  const { data: sessionData, error: sessionError } = await supabase
    .rpc('get_session_for_share', { token });

  if (sessionError || !sessionData || sessionData.length === 0) {
    return { url: null, recordingType: null, expiresAt: null, error: 'Share not found or has expired' };
  }

  const session = sessionData[0];

  // Determine which storage path to use
  let storagePath: string | null = null;
  let recordingType: 'audio' | 'video' | null = null;

  if (session.recording_type === 'audio' && session.audio_storage_path) {
    storagePath = session.audio_storage_path;
    recordingType = 'audio';
  } else if (session.recording_type === 'video' && session.video_storage_path) {
    storagePath = session.video_storage_path;
    recordingType = 'video';
  }

  if (!storagePath) {
    return { url: null, recordingType: null, expiresAt: null, error: 'No recording found for this session' };
  }

  // Generate signed URL (30 minutes expiration)
  const expiresIn = 1800; // 30 minutes
  const { data, error: signedUrlError } = await supabase.storage
    .from('replays')
    .createSignedUrl(storagePath, expiresIn);

  if (signedUrlError) {
    console.error('Failed to generate signed URL:', signedUrlError);
    return { url: null, recordingType: null, expiresAt: null, error: 'Failed to generate playback URL' };
  }

  const expiresAt = Date.now() + (expiresIn * 1000);

  return { url: data.signedUrl, recordingType, expiresAt, error: null };
}
