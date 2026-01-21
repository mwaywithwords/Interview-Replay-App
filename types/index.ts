// Type definitions for Interview Replay
// Add your custom types here

export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface Session {
  user: User | null;
  isAuthenticated: boolean;
}

// ============================================
// Storage Types
// ============================================

export interface ReplayUploadResult {
  path: string;
  error: Error | null;
}

export interface SignedUrlResult {
  url: string | null;
  error: Error | null;
}

export interface SignedUrlBatchResult {
  urls: { path: string; signedUrl: string }[];
  error: Error | null;
}

/**
 * Replay file metadata
 * Path format: {user_id}/{session_id}/audio.webm
 */
export interface ReplayFile {
  userId: string;
  sessionId: string;
  filename: string;
  path: string;
  size?: number;
  createdAt?: string;
  updatedAt?: string;
}
