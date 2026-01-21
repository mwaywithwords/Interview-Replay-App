import { createClient } from './server';

/**
 * Storage path helper - generates the correct path for replay files
 * Path format: {user_id}/{session_id}/audio.webm
 */
export function getReplayPath(userId: string, sessionId: string, filename = 'audio.webm'): string {
  return `${userId}/${sessionId}/${filename}`;
}

/**
 * Upload a replay file from the server
 * Use this in Server Actions or API routes
 */
export async function uploadReplay(
  userId: string,
  sessionId: string,
  file: File | Blob,
  filename = 'audio.webm'
): Promise<{ path: string; error: Error | null }> {
  const supabase = await createClient();
  const path = getReplayPath(userId, sessionId, filename);

  const { data, error } = await supabase.storage
    .from('replays')
    .upload(path, file, {
      contentType: file.type || 'audio/webm',
      upsert: true, // Overwrite if exists
    });

  if (error) {
    return { path: '', error: new Error(error.message) };
  }

  return { path: data.path, error: null };
}

/**
 * Generate a signed URL for secure playback
 * 
 * IMPORTANT: This is the recommended approach for private buckets.
 * Signed URLs provide time-limited access without exposing files publicly.
 * 
 * @param path - The storage path (e.g., "{user_id}/{session_id}/audio.webm")
 * @param expiresIn - Seconds until the URL expires (default: 1 hour)
 * @returns Signed URL for playback
 * 
 * HOW IT WORKS:
 * 1. The server generates a cryptographically signed URL
 * 2. The URL contains an expiration timestamp and signature
 * 3. The client can use this URL directly in <audio> or <video> elements
 * 4. After expiration, the URL becomes invalid (security best practice)
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * // In a Server Component or API route
 * const { url } = await getSignedReplayUrl(userId, sessionId);
 * // Pass `url` to client for playback
 * ```
 */
export async function getSignedReplayUrl(
  userId: string,
  sessionId: string,
  filename = 'audio.webm',
  expiresIn = 3600 // 1 hour default
): Promise<{ url: string | null; error: Error | null }> {
  const supabase = await createClient();
  const path = getReplayPath(userId, sessionId, filename);

  const { data, error } = await supabase.storage
    .from('replays')
    .createSignedUrl(path, expiresIn);

  if (error) {
    return { url: null, error: new Error(error.message) };
  }

  return { url: data.signedUrl, error: null };
}

/**
 * Generate multiple signed URLs at once (batch operation)
 * Useful when loading a list of sessions with playback URLs
 */
export async function getSignedReplayUrls(
  paths: string[],
  expiresIn = 3600
): Promise<{ urls: { path: string; signedUrl: string }[]; error: Error | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from('replays')
    .createSignedUrls(paths, expiresIn);

  if (error) {
    return { urls: [], error: new Error(error.message) };
  }

  return {
    urls: data.map((item) => ({
      path: item.path || '',
      signedUrl: item.signedUrl,
    })),
    error: null,
  };
}

/**
 * Delete a replay file
 */
export async function deleteReplay(
  userId: string,
  sessionId: string,
  filename = 'audio.webm'
): Promise<{ error: Error | null }> {
  const supabase = await createClient();
  const path = getReplayPath(userId, sessionId, filename);

  const { error } = await supabase.storage.from('replays').remove([path]);

  if (error) {
    return { error: new Error(error.message) };
  }

  return { error: null };
}

/**
 * Check if a replay file exists
 */
export async function replayExists(
  userId: string,
  sessionId: string,
  filename = 'audio.webm'
): Promise<boolean> {
  const supabase = await createClient();
  const path = getReplayPath(userId, sessionId, filename);

  const { data, error } = await supabase.storage
    .from('replays')
    .list(`${userId}/${sessionId}`, {
      search: filename,
    });

  if (error || !data) {
    return false;
  }

  return data.some((file) => file.name === filename);
}

// ============================================
// CLIENT-SIDE UPLOAD HELPERS
// ============================================
// Client-side storage functions are in ./storage-client.ts
// to avoid bundling server-only code into client components.
// Import from '@/lib/supabase/storage-client' for client components.
