import { createClient } from './client';

/**
 * Storage path helper - generates the correct path for replay files
 * Path format: {user_id}/{session_id}/{filename}
 */
export function getReplayPath(userId: string, sessionId: string, filename = 'audio.webm'): string {
  return `${userId}/${sessionId}/${filename}`;
}

/**
 * Determine the default content type based on filename
 */
function getDefaultContentType(filename: string): string {
  if (filename.endsWith('.webm')) {
    return filename.includes('video') ? 'video/webm' : 'audio/webm';
  }
  if (filename.endsWith('.mp4')) {
    return filename.includes('video') ? 'video/mp4' : 'audio/mp4';
  }
  if (filename.startsWith('video')) {
    return 'video/webm';
  }
  return 'audio/webm';
}

/**
 * Upload a replay file from the browser
 * Use this in Client Components with the user's authenticated session
 * Supports both audio and video files
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

  // Determine content type from file or filename
  const contentType = file.type || getDefaultContentType(filename);

  // Note: Supabase JS SDK doesn't support progress callbacks natively
  // For progress tracking, you'd need to use XMLHttpRequest or fetch with streams
  const { data, error } = await supabase.storage
    .from('replays')
    .upload(path, file, {
      contentType,
      upsert: true,
    });

  if (error) {
    return { path: '', error: new Error(error.message) };
  }

  // Call progress callback with 100% on success
  onProgress?.(100);

  return { path: data.path, error: null };
}
