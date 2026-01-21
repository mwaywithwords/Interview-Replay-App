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
export type SessionType = 'interview' | 'trading';
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
  recording_type: RecordingType;
  prompt?: string;
  company_id?: string; // Required if session_type is 'interview'
  symbol_id?: string; // Required if session_type is 'trading'
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

// ============================================
// Grouping Entities Types
// ============================================

// --------------------------------------------
// Company: For organizing interview sessions
// --------------------------------------------
export interface Company {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface CreateCompanyInput {
  name: string;
}

export interface UpdateCompanyInput {
  name?: string;
}

// --------------------------------------------
// Symbol: For organizing trading sessions
// --------------------------------------------
export interface Symbol {
  id: string;
  user_id: string;
  ticker: string;
  created_at: string;
}

export interface CreateSymbolInput {
  ticker: string;
}

export interface UpdateSymbolInput {
  ticker?: string;
}

// --------------------------------------------
// Session-Company Association
// --------------------------------------------
export interface SessionCompany {
  id: string;
  user_id: string;
  session_id: string;
  company_id: string;
  created_at: string;
}

export interface SessionCompanyWithCompany extends SessionCompany {
  company: Company;
}

export interface InterviewSessionWithCompanies extends InterviewSession {
  companies: Company[];
}

// --------------------------------------------
// Session-Symbol Association
// --------------------------------------------
export interface SessionSymbol {
  id: string;
  user_id: string;
  session_id: string;
  symbol_id: string;
  created_at: string;
}

export interface SessionSymbolWithSymbol extends SessionSymbol {
  symbol: Symbol;
}

export interface InterviewSessionWithSymbols extends InterviewSession {
  symbols: Symbol[];
}

// --------------------------------------------
// Combined session with both companies and symbols
// --------------------------------------------
export interface InterviewSessionWithGroupings extends InterviewSession {
  companies?: Company[];
  symbols?: Symbol[];
}

// ============================================
// Bookmark Types
// ============================================

export interface Bookmark {
  id: string;
  session_id: string;
  user_id: string;
  timestamp_ms: number;
  label: string;
  category: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateBookmarkInput {
  session_id: string;
  timestamp_ms: number;
  label: string;
  category?: string;
}

export interface UpdateBookmarkInput {
  label?: string;
  category?: string;
}

// ============================================
// Session Note Types (single note per session)
// ============================================

export interface SessionNote {
  id: string;
  user_id: string;
  session_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface SaveSessionNoteInput {
  session_id: string;
  content: string;
}

// ============================================
// Bookmark Note Types (multiple notes per bookmark)
// ============================================

export interface BookmarkNote {
  id: string;
  user_id: string;
  bookmark_id: string;
  content: string;
  created_at: string;
}

export interface CreateBookmarkNoteInput {
  bookmark_id: string;
  content: string;
}

// ============================================
// Transcript Types (manual transcripts)
// ============================================

export interface Transcript {
  id: string;
  user_id: string;
  session_id: string;
  provider: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface SaveTranscriptInput {
  session_id: string;
  content: string;
  provider?: string;
}

// ============================================
// Session Share Types (secure token-based sharing)
// ============================================

export interface SessionShare {
  id: string;
  session_id: string;
  shared_by_user_id: string;
  shared_with_email: string | null;
  shared_with_user_id: string | null;
  permission: 'view' | 'comment' | 'edit';
  share_token: string | null;
  expires_at: string | null;
  is_active: boolean;
  accessed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSessionShareResult {
  share: SessionShare | null;
  shareUrl: string | null;
  error: string | null;
}

export interface SharedSessionData {
  id: string;
  title: string;
  status: string;
  recording_type: string | null;
  audio_storage_path: string | null;
  video_storage_path: string | null;
  created_at: string;
  session_type: string | null;
  owner_user_id: string;
}

export interface SharedBookmark {
  id: string;
  session_id: string;
  timestamp_ms: number;
  label: string;
  category: string | null;
  created_at: string;
}

export interface SharedTranscript {
  id: string;
  session_id: string;
  content: string;
  created_at: string;
}

export interface SharedSessionNote {
  id: string;
  session_id: string;
  content: string;
  created_at: string;
}

// ============================================
// AI Job Types
// ============================================

export type AIJobType = 'transcript' | 'summary' | 'score' | 'suggest_bookmarks';
export type AIJobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface AIJob {
  id: string;
  user_id: string;
  session_id: string;
  job_type: AIJobType;
  status: AIJobStatus;
  provider: string | null;
  model: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAIJobInput {
  session_id: string;
  job_type: AIJobType;
}

export interface AIOutput {
  id: string;
  user_id: string;
  session_id: string;
  job_id: string;
  output_type: string;
  content: Record<string, unknown>;
  created_at: string;
}
