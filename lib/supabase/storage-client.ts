import { createClient } from './client';

/**
 * Storage path helper - generates the correct path for replay files
 * Path format: {user_id}/{session_id}/audio.webm
 */
export function getReplayPath(userId: string, sessionId: string, filename = 'audio.webm'): string {
  return `${userId}/${sessionId}/${filename}`;
}

/**
 * Upload a replay file from the browser
 * Use this in Client Components with the user's authenticated session
 */
export async function uploadReplayFromClient(
  userId: string,
  sessionId: string,
  file: File | Blob,
  filename = 'audio.webm',
  onProgress?: (progress: number) => void
): Promise<{ path: string; error: Error | null }> {
  const supabase = createClient();
  const path = getReplayPath(userId, sessionId, filename);

  // Note: Supabase JS SDK doesn't support progress callbacks natively
  // For progress tracking, you'd need to use XMLHttpRequest or fetch with streams
  const { data, error } = await supabase.storage
    .from('replays')
    .upload(path, file, {
      contentType: file.type || 'audio/webm',
      upsert: true,
    });

  if (error) {
    return { path: '', error: new Error(error.message) };
  }

  // Call progress callback with 100% on success
  onProgress?.(100);

  return { path: data.path, error: null };
}
