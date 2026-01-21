'use server';

import { getSignedReplayUrl, uploadReplay, deleteReplay } from '@/lib/supabase/storage';
import { requireUser } from '@/lib/supabase/server';

/**
 * Server Action: Get a signed URL for replay playback
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
 * Server Action: Delete a replay file
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
