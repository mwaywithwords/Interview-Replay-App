// Type definitions for Interview Replay
// Add your custom types here

export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface AuthSession {
  user: User | null;
  isAuthenticated: boolean;
}

// ============================================
// Session (Interview) Types
// ============================================

export type SessionStatus = 'draft' | 'recording' | 'processing' | 'ready' | 'archived';
export type SessionType = 'mock_interview' | 'technical' | 'behavioral' | 'custom';

export interface InterviewSession {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: SessionStatus;
  duration_seconds: number | null;
  video_url: string | null;
  audio_url: string | null;
  thumbnail_url: string | null;
  metadata: SessionMetadata;
  tags: string[];
  is_public: boolean;
  recorded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionMetadata {
  session_type?: SessionType;
  prompt?: string;
  [key: string]: unknown;
}

export interface CreateSessionInput {
  title: string;
  session_type: SessionType;
  prompt?: string;
}

export interface UpdateSessionInput {
  title?: string;
  session_type?: SessionType;
  prompt?: string;
  status?: SessionStatus;
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
