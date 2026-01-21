'use server';

import { getSignedReplayUrl, uploadReplay, deleteReplay } from '@/lib/supabase/storage';
import { createClient, requireUser } from '@/lib/supabase/server';

/**
 * Server Action: Get a signed URL for audio replay playback
 * This validates the user owns the session before generating the URL
 */
export async function getReplayPlaybackUrl(sessionId: string) {
  const user = await requireUser();

  // Generate signed URL for the authenticated user's replay
  const { url, error } = await getSignedReplayUrl(
    user.id,
    sessionId,
    'audio.webm',
    3600 // 1 hour expiration
  );

  if (error) {
    return { url: null, error: error.message };
  }

  return { url, error: null };
}

/**
 * Server Action: Create a signed URL for audio playback from a session's audio_storage_path
 * 
 * Security:
 * - Validates the user is authenticated
 * - Verifies the session belongs to the authenticated user
 * - Only generates signed URL if audio_storage_path exists
 * 
 * @param sessionId - The session ID to get audio for
 * @returns Signed URL with 60 second expiration, or error
 */
export async function createSignedAudioUrl(sessionId: string): Promise<{
  url: string | null;
  expiresAt: number | null;
  error: string | null;
}> {
  // Get authenticated user
  const user = await requireUser();
  const supabase = await createClient();

  // Fetch the session and verify ownership
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('id, user_id, recording_type, audio_storage_path')
    .eq('id', sessionId)
    .single();

  if (sessionError) {
    return { url: null, expiresAt: null, error: 'Session not found' };
  }

  // Verify the session belongs to the authenticated user
  if (session.user_id !== user.id) {
    return { url: null, expiresAt: null, error: 'You do not have permission to access this session' };
  }

  // Check if recording_type is audio and audio_storage_path exists
  if (session.recording_type !== 'audio' || !session.audio_storage_path) {
    return { url: null, expiresAt: null, error: 'No audio recording found for this session' };
  }

  // Generate signed URL with 60 second expiration
  const expiresIn = 60; // 60 seconds
  const { data, error: signedUrlError } = await supabase.storage
    .from('replays')
    .createSignedUrl(session.audio_storage_path, expiresIn);

  if (signedUrlError) {
    return { url: null, expiresAt: null, error: `Failed to generate playback URL: ${signedUrlError.message}` };
  }

  // Calculate expiration timestamp (current time + expiresIn seconds)
  const expiresAt = Date.now() + (expiresIn * 1000);

  return { url: data.signedUrl, expiresAt, error: null };
}

/**
 * Server Action: Get a signed URL for video replay playback
 * This validates the user owns the session before generating the URL
 */
export async function getVideoPlaybackUrl(sessionId: string) {
  const user = await requireUser();

  // Generate signed URL for the authenticated user's video replay
  const { url, error } = await getSignedReplayUrl(
    user.id,
    sessionId,
    'video.webm',
    3600 // 1 hour expiration
  );

  if (error) {
    return { url: null, error: error.message };
  }

  return { url, error: null };
}

/**
 * Server Action: Upload a replay file
 * Validates user authentication before upload
 */
export async function uploadReplayAction(
  sessionId: string,
  formData: FormData
) {
  const user = await requireUser();
  const file = formData.get('file') as File;

  if (!file) {
    return { path: null, error: 'No file provided' };
  }

  const { path, error } = await uploadReplay(
    user.id,
    sessionId,
    file,
    'audio.webm'
  );

  if (error) {
    return { path: null, error: error.message };
  }

  return { path, error: null };
}

/**
 * Server Action: Delete an audio replay file
 * Validates user owns the file before deletion
 */
export async function deleteReplayAction(sessionId: string) {
  const user = await requireUser();

  const { error } = await deleteReplay(user.id, sessionId, 'audio.webm');

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

/**
 * Server Action: Delete a video replay file
 * Validates user owns the file before deletion
 */
export async function deleteVideoReplayAction(sessionId: string) {
  const user = await requireUser();

  const { error } = await deleteReplay(user.id, sessionId, 'video.webm');

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

/**
 * Server Action: Create a signed URL for video playback from a session's video_storage_path
 * 
 * Security:
 * - Validates the user is authenticated
 * - Verifies the session belongs to the authenticated user
 * - Only generates signed URL if video_storage_path exists
 * 
 * @param sessionId - The session ID to get video for
 * @returns Signed URL with 60 second expiration, or error
 */
export async function createSignedVideoUrl(sessionId: string): Promise<{
  url: string | null;
  expiresAt: number | null;
  error: string | null;
}> {
  // Get authenticated user
  const user = await requireUser();
  const supabase = await createClient();

  // Fetch the session and verify ownership
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('id, user_id, recording_type, video_storage_path')
    .eq('id', sessionId)
    .single();

  if (sessionError) {
    return { url: null, expiresAt: null, error: 'Session not found' };
  }

  // Verify the session belongs to the authenticated user
  if (session.user_id !== user.id) {
    return { url: null, expiresAt: null, error: 'You do not have permission to access this session' };
  }

  // Check if recording_type is video and video_storage_path exists
  if (session.recording_type !== 'video' || !session.video_storage_path) {
    return { url: null, expiresAt: null, error: 'No video recording found for this session' };
  }

  // Generate signed URL with 60 second expiration
  const expiresIn = 60; // 60 seconds
  const { data, error: signedUrlError } = await supabase.storage
    .from('replays')
    .createSignedUrl(session.video_storage_path, expiresIn);

  if (signedUrlError) {
    return { url: null, expiresAt: null, error: `Failed to generate playback URL: ${signedUrlError.message}` };
  }

  // Calculate expiration timestamp (current time + expiresIn seconds)
  const expiresAt = Date.now() + (expiresIn * 1000);

  return { url: data.signedUrl, expiresAt, error: null };
}
