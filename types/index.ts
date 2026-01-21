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

export type SessionStatus = 'draft' | 'recording' | 'recorded' | 'processing' | 'ready' | 'archived';
export type SessionType = 'mock_interview' | 'technical' | 'behavioral' | 'custom';
export type RecordingType = 'audio' | 'video';

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
  // Recording type: exactly one recording per session (audio or video)
  recording_type: RecordingType | null;
  // Audio file metadata (populated after upload - only set if recording_type = 'audio')
  audio_storage_path: string | null;
  audio_duration_seconds: number | null;
  audio_mime_type: string | null;
  audio_file_size_bytes: number | null;
  // Video file metadata (populated after upload - only set if recording_type = 'video')
  video_storage_path: string | null;
  video_duration_seconds: number | null;
  video_mime_type: string | null;
  video_file_size_bytes: number | null;
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

export interface AudioUploadMetadata {
  audio_storage_path: string;
  audio_duration_seconds: number;
  audio_mime_type: string;
  audio_file_size_bytes: number;
}

export interface VideoUploadMetadata {
  video_storage_path: string;
  video_duration_seconds: number;
  video_mime_type: string;
  video_file_size_bytes: number;
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
