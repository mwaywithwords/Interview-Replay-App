'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Video,
  Square,
  Pause,
  Play,
  Trash2,
  VideoOff,
  Upload,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { uploadReplayFromClient } from '@/lib/supabase/storage-client';
import { updateSessionVideoMetadata, getSessionRecordingType } from '@/app/actions/sessions';
import { toast } from 'sonner';

type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped';
type UploadState = 'idle' | 'uploading' | 'success' | 'error';

interface VideoRecorderProps {
  sessionId: string;
  userId: string;
  onRecordingComplete?: (blob: Blob) => void;
  onUploadComplete?: (storagePath: string) => void;
  /** Remote video URL for playback (signed URL from server) */
  remoteVideoUrl?: string | null;
}

/**
 * Get the best supported MIME type for video recording.
 * Prefers video/webm with vp8/vp9 and opus codecs.
 */
function getSupportedMimeType(): string {
  const types = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4',
  ];

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  // Fallback to empty string - MediaRecorder will use browser default
  return '';
}

/**
 * Format seconds into MM:SS display format.
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function VideoRecorder({
  sessionId,
  userId,
  onRecordingComplete,
  onUploadComplete,
  remoteVideoUrl,
}: VideoRecorderProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [finalDuration, setFinalDuration] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const playbackVideoRef = useRef<HTMLVideoElement | null>(null);
  const durationRef = useRef<number>(0);

  // Cleanup function to stop stream and revoke URLs
  const cleanup = useCallback(() => {
    // Stop timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    // Stop all media tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Clear preview video srcObject
    if (previewVideoRef.current) {
      previewVideoRef.current.srcObject = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
      // Revoke object URL on unmount
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [cleanup, videoUrl]);

  const startTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    timerIntervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => {
        const newValue = prev + 1;
        durationRef.current = newValue;
        return newValue;
      });
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  /**
   * Upload video to Supabase Storage and update session metadata
   */
  const handleUpload = useCallback(
    async (blob: Blob, durationSeconds: number) => {
      // Validate authentication
      if (!userId) {
        setUploadError(
          'You must be signed in to upload recordings. Please sign in and try again.'
        );
        setUploadState('error');
        return;
      }

      if (!sessionId) {
        setUploadError('No session ID provided. Please create a session first.');
        setUploadState('error');
        return;
      }

      setUploadState('uploading');
      setUploadError(null);

      try {
        // Validate session recording_type is video
        const { recording_type, error: typeError } = await getSessionRecordingType(sessionId);
        
        if (typeError) {
          setUploadError(`Failed to validate session: ${typeError}`);
          setUploadState('error');
          return;
        }

        if (recording_type !== 'video') {
          setUploadError(`Cannot upload video: this session is configured for '${recording_type || 'unknown'}' recordings.`);
          setUploadState('error');
          return;
        }

        // Upload to Supabase Storage with correct filename
        const { path, error: uploadErr } = await uploadReplayFromClient(
          userId,
          sessionId,
          blob,
          'video.webm'
        );

        if (uploadErr) {
          // Handle specific Supabase storage errors
          const errorMessage = uploadErr.message.toLowerCase();
          if (
            errorMessage.includes('not authenticated') ||
            errorMessage.includes('jwt')
          ) {
            setUploadError(
              'Your session has expired. Please sign in again to upload.'
            );
          } else if (errorMessage.includes('policy')) {
            setUploadError(
              'You do not have permission to upload to this location.'
            );
          } else if (errorMessage.includes('size')) {
            setUploadError('The video file is too large. Maximum size is 100MB.');
          } else {
            setUploadError(`Upload failed: ${uploadErr.message}`);
          }
          setUploadState('error');
          return;
        }

        // Update session with video metadata via server action
        const { error: metadataErr } = await updateSessionVideoMetadata(
          sessionId,
          {
            video_storage_path: path,
            video_duration_seconds: durationSeconds,
            video_mime_type: blob.type || 'video/webm',
            video_file_size_bytes: blob.size,
          }
        );

        if (metadataErr) {
          setUploadError(`Failed to save recording metadata: ${metadataErr}`);
          setUploadState('error');
          return;
        }

        // Clean up local object URL after successful upload
        if (videoUrl) {
          URL.revokeObjectURL(videoUrl);
          setVideoUrl(null);
        }

        setUploadState('success');
        toast.success('Video uploaded successfully');
        onUploadComplete?.(path);
      } catch (err) {
        console.error('Upload error:', err);
        setUploadError(
          'An unexpected error occurred during upload. Please try again.'
        );
        setUploadState('error');
        toast.error('Failed to upload video');
      }
    },
    [userId, sessionId, onUploadComplete, videoUrl]
  );

  const handleStart = useCallback(async () => {
    setError(null);
    setUploadError(null);
    setUploadState('idle');

    // Revoke previous video URL if exists
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
      setVideoUrl(null);
    }
    setVideoBlob(null);
    setFinalDuration(0);
    durationRef.current = 0;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      streamRef.current = stream;
      setHasPermission(true);

      // Set up live preview
      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = stream;
        previewVideoRef.current.muted = true; // Mute to prevent feedback
        await previewVideoRef.current.play();
      }

      const mimeType = getSupportedMimeType();
      const options: MediaRecorderOptions = mimeType ? { mimeType } : {};

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      videoChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          videoChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Capture final duration before any state resets
        const recordedDuration = durationRef.current;
        setFinalDuration(recordedDuration);

        // Determine the actual MIME type used
        const actualMimeType =
          mediaRecorder.mimeType || mimeType || 'video/webm';
        const blob = new Blob(videoChunksRef.current, { type: actualMimeType });
        const url = URL.createObjectURL(blob);

        setVideoBlob(blob);
        setVideoUrl(url);

        // Notify parent component if callback provided
        if (onRecordingComplete) {
          onRecordingComplete(blob);
        }

        // Stop all tracks and release camera/mic
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;

        // Clear preview video srcObject
        if (previewVideoRef.current) {
          previewVideoRef.current.srcObject = null;
        }

        // Automatically start upload
        handleUpload(blob, recordedDuration);
      };

      mediaRecorder.onerror = () => {
        setError('Recording error occurred');
        setRecordingState('idle');
        stopTimer();
        cleanup();
      };

      // Start recording with timeslice for frequent data availability
      mediaRecorder.start(1000);
      setRecordingState('recording');
      setElapsedSeconds(0);
      startTimer();
    } catch (err) {
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') {
          setError(
            'Camera and microphone access denied. Please allow access in your browser settings.'
          );
        } else if (err.name === 'NotFoundError') {
          setError(
            'No camera or microphone found. Please connect a camera and microphone.'
          );
        } else if (err.name === 'NotReadableError') {
          setError(
            'Camera or microphone is already in use by another application.'
          );
        } else if (err.name === 'OverconstrainedError') {
          setError('Could not satisfy camera/microphone constraints.');
        } else {
          setError(`Error accessing camera/microphone: ${err.message}`);
        }
      } else {
        setError('Failed to start recording');
      }
      setHasPermission(false);
    }
  }, [
    videoUrl,
    onRecordingComplete,
    startTimer,
    stopTimer,
    cleanup,
    handleUpload,
  ]);

  const handlePause = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === 'recording'
    ) {
      mediaRecorderRef.current.pause();
      setRecordingState('paused');
      stopTimer();
    }
  }, [stopTimer]);

  const handleResume = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === 'paused'
    ) {
      mediaRecorderRef.current.resume();
      setRecordingState('recording');
      startTimer();
    }
  }, [startTimer]);

  const handleStop = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive'
    ) {
      mediaRecorderRef.current.stop();
      setRecordingState('stopped');
      stopTimer();
    }
  }, [stopTimer]);

  const handleReset = useCallback(() => {
    // Revoke previous video URL
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    setVideoUrl(null);
    setVideoBlob(null);
    setElapsedSeconds(0);
    setFinalDuration(0);
    durationRef.current = 0;
    setRecordingState('idle');
    setUploadState('idle');
    setError(null);
    setUploadError(null);
    setHasPermission(false);
  }, [videoUrl]);

  /**
   * Retry upload for failed uploads
   */
  const handleRetryUpload = useCallback(() => {
    if (videoBlob && finalDuration > 0) {
      handleUpload(videoBlob, finalDuration);
    }
  }, [videoBlob, finalDuration, handleUpload]);

  const isIdle = recordingState === 'idle';
  const isRecording = recordingState === 'recording';
  const isPaused = recordingState === 'paused';
  const isStopped = recordingState === 'stopped';
  const isActive = isRecording || isPaused;

  const isUploading = uploadState === 'uploading';
  const isUploadSuccess = uploadState === 'success';
  const isUploadError = uploadState === 'error';

  // Determine which video URL to use for playback
  // After successful upload, use remote URL; otherwise use local blob URL
  const playbackUrl = isUploadSuccess && remoteVideoUrl ? remoteVideoUrl : videoUrl;

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-lg text-foreground flex items-center gap-2">
          <Video className="h-5 w-5 text-muted-foreground" />
          Video Recorder
        </CardTitle>
        <CardDescription>
          Record video and audio for your interview session
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Video Preview / Playback Area */}
        <div className="relative aspect-video bg-muted rounded-xl overflow-hidden shadow-inner border border-border">
          {/* Live Preview Video (during recording) */}
          {!isStopped && (
            <video
              ref={previewVideoRef}
              className={`absolute inset-0 w-full h-full object-cover ${
                isActive || hasPermission ? 'block' : 'hidden'
              }`}
              autoPlay
              playsInline
              muted
            />
          )}

          {/* Playback Video (after stop) */}
          {isStopped && playbackUrl && (
            <video
              ref={playbackVideoRef}
              className="absolute inset-0 w-full h-full object-contain bg-black"
              src={playbackUrl}
              controls
              playsInline
            />
          )}

          {/* Remote video playback when no recording in progress and remote URL exists */}
          {isIdle && !hasPermission && remoteVideoUrl && (
            <video
              className="absolute inset-0 w-full h-full object-contain bg-black"
              src={remoteVideoUrl}
              controls
              playsInline
            />
          )}

          {/* Placeholder when idle and no remote video */}
          {isIdle && !hasPermission && !remoteVideoUrl && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
              <VideoOff className="h-12 w-12 mb-2" />
              <p className="text-sm font-medium">Click &quot;Start Recording&quot; to begin</p>
            </div>
          )}

          {/* Recording indicator overlay */}
          {isActive && (
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                  isPaused
                    ? 'bg-amber-500 text-white'
                    : 'bg-destructive text-destructive-foreground'
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    isPaused ? 'bg-white' : 'bg-white animate-pulse'
                  }`}
                />
                {isPaused ? 'PAUSED' : 'REC'}
              </span>
            </div>
          )}

          {/* Timer overlay */}
          {isActive && (
            <div className="absolute top-3 right-3">
              <span
                className={`inline-flex items-center rounded-md px-2.5 py-1 text-sm font-mono font-bold ${
                  isPaused
                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 backdrop-blur-md'
                    : 'bg-background/80 text-foreground border border-border backdrop-blur-md'
                }`}
              >
                {formatTime(elapsedSeconds)}
              </span>
            </div>
          )}
        </div>

        {/* Timer Display (when stopped) */}
        {isStopped && (
          <div className="flex items-center justify-center">
            <div className="text-2xl font-mono font-bold text-muted-foreground">
              Duration: {formatTime(finalDuration)}
            </div>
          </div>
        )}

        {/* Recording Error Display */}
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 space-y-3">
            <p className="text-sm text-destructive font-medium">{error}</p>
            {error.includes('denied') && (
              <>
                <div className="text-xs text-destructive/80 space-y-1">
                  <p>To allow camera and microphone access:</p>
                  <ol className="list-decimal list-inside space-y-0.5 ml-1">
                    <li>
                      Click the lock/site icon in your browser&apos;s address
                      bar
                    </li>
                    <li>
                      Find &quot;Camera&quot; and &quot;Microphone&quot; and set
                      them to &quot;Allow&quot;
                    </li>
                    <li>
                      Refresh the page or click &quot;Try Again&quot; below
                    </li>
                  </ol>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setError(null);
                    handleStart();
                  }}
                >
                  Try Again
                </Button>
              </>
            )}
          </div>
        )}

        {/* Upload Status Display */}
        {isUploading && (
          <div className="rounded-lg border border-primary/30 bg-primary/10 p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
              <div>
                <p className="text-sm text-primary font-medium">
                  Uploading video...
                </p>
                <p className="text-xs text-muted-foreground">
                  Please wait while your video is being saved
                </p>
              </div>
            </div>
          </div>
        )}

        {isUploadSuccess && (
          <div className="rounded-lg border border-success/30 bg-success/10 p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-success" />
              <div>
                <p className="text-sm text-success font-medium">
                  Video saved successfully!
                </p>
                <p className="text-xs text-muted-foreground">
                  Your video has been uploaded and session updated
                </p>
              </div>
            </div>
          </div>
        )}

        {isUploadError && uploadError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-sm text-destructive font-medium">Upload failed</p>
                <p className="text-xs text-destructive/70">{uploadError}</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRetryUpload}
            >
              <Upload className="mr-2 h-4 w-4" />
              Retry Upload
            </Button>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex items-center justify-center gap-3">
          {isIdle && (
            <Button
              onClick={handleStart}
              className="rounded-full px-6 shadow-lg shadow-destructive/20"
              variant="destructive"
            >
              <Video className="mr-2 h-4 w-4" />
              Start Recording
            </Button>
          )}

          {isRecording && (
            <>
              <Button
                variant="outline"
                onClick={handlePause}
                className="rounded-full px-6 border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
              >
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </Button>
              <Button
                variant="secondary"
                onClick={handleStop}
                className="rounded-full px-6"
              >
                <Square className="mr-2 h-4 w-4" />
                Stop
              </Button>
            </>
          )}

          {isPaused && (
            <>
              <Button
                onClick={handleResume}
                className="rounded-full px-6 bg-success hover:bg-success/90 text-success-foreground"
              >
                <Play className="mr-2 h-4 w-4" />
                Resume
              </Button>
              <Button
                variant="secondary"
                onClick={handleStop}
                className="rounded-full px-6"
              >
                <Square className="mr-2 h-4 w-4" />
                Stop
              </Button>
            </>
          )}

          {isStopped && (
            <>
              <Button
                onClick={handleReset}
                variant="outline"
                disabled={isUploading}
                className="rounded-full px-6"
              >
                <Video className="mr-2 h-4 w-4" />
                New Recording
              </Button>
              {playbackUrl && !isUploadSuccess && (
                <Button
                  onClick={handleReset}
                  variant="ghost"
                  disabled={isUploading}
                  className="rounded-full px-6 text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              )}
            </>
          )}
        </div>

        {/* Video Info (after recording) */}
        {isStopped && videoBlob && (
          <div className="pt-4 border-t border-border">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold text-center">
              Format: {videoBlob.type || 'video/webm'} | Size:{' '}
              {(videoBlob.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
