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
import { Mic, Square, Pause, Play, Trash2, Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { uploadReplayFromClient } from '@/lib/supabase/storage-client';
import { updateSessionAudioMetadata, getSessionRecordingType } from '@/app/actions/sessions';

type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped';
type UploadState = 'idle' | 'uploading' | 'success' | 'error';

interface AudioRecorderProps {
  sessionId: string;
  userId: string;
  onRecordingComplete?: (blob: Blob) => void;
  onUploadComplete?: (storagePath: string) => void;
}

/**
 * Get the best supported MIME type for audio recording.
 * Prefers audio/webm, falls back to other supported types.
 */
function getSupportedMimeType(): string {
  const types = [
    'audio/webm',
    'audio/webm;codecs=opus',
    'audio/ogg;codecs=opus',
    'audio/mp4',
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

export function AudioRecorder({ sessionId, userId, onRecordingComplete, onUploadComplete }: AudioRecorderProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [finalDuration, setFinalDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const durationRef = useRef<number>(0);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      // Stop any active media stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      // Clear timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [audioUrl]);

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
   * Upload audio to Supabase Storage and update session metadata
   */
  const handleUpload = useCallback(async (blob: Blob, durationSeconds: number) => {
    // Validate authentication
    if (!userId) {
      setUploadError('You must be signed in to upload recordings. Please sign in and try again.');
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
      // Validate session recording_type is audio
      const { recording_type, error: typeError } = await getSessionRecordingType(sessionId);
      
      if (typeError) {
        setUploadError(`Failed to validate session: ${typeError}`);
        setUploadState('error');
        return;
      }

      if (recording_type !== 'audio') {
        setUploadError(`Cannot upload audio: this session is configured for '${recording_type || 'unknown'}' recordings.`);
        setUploadState('error');
        return;
      }

      // Upload to Supabase Storage with correct filename
      const { path, error: uploadErr } = await uploadReplayFromClient(
        userId,
        sessionId,
        blob,
        'audio.webm'
      );

      if (uploadErr) {
        // Handle specific Supabase storage errors
        const errorMessage = uploadErr.message.toLowerCase();
        if (errorMessage.includes('not authenticated') || errorMessage.includes('jwt')) {
          setUploadError('Your session has expired. Please sign in again to upload.');
        } else if (errorMessage.includes('policy')) {
          setUploadError('You do not have permission to upload to this location.');
        } else if (errorMessage.includes('size')) {
          setUploadError('The audio file is too large. Maximum size is 50MB.');
        } else {
          setUploadError(`Upload failed: ${uploadErr.message}`);
        }
        setUploadState('error');
        return;
      }

      // Update session with audio metadata via server action
      const { error: metadataErr } = await updateSessionAudioMetadata(sessionId, {
        audio_storage_path: path,
        audio_duration_seconds: durationSeconds,
        audio_mime_type: blob.type || 'audio/webm',
        audio_file_size_bytes: blob.size,
      });

      if (metadataErr) {
        setUploadError(`Failed to save recording metadata: ${metadataErr}`);
        setUploadState('error');
        return;
      }

      setUploadState('success');
      onUploadComplete?.(path);
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError('An unexpected error occurred during upload. Please try again.');
      setUploadState('error');
    }
  }, [userId, sessionId, onUploadComplete]);

  const handleStart = useCallback(async () => {
    setError(null);
    setUploadError(null);
    setUploadState('idle');

    // Revoke previous audio URL if exists
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setAudioBlob(null);
    setFinalDuration(0);
    durationRef.current = 0;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = getSupportedMimeType();
      const options: MediaRecorderOptions = mimeType ? { mimeType } : {};

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Capture final duration before any state resets
        const recordedDuration = durationRef.current;
        setFinalDuration(recordedDuration);

        // Determine the actual MIME type used
        const actualMimeType =
          mediaRecorder.mimeType || mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: actualMimeType });
        const url = URL.createObjectURL(blob);

        setAudioBlob(blob);
        setAudioUrl(url);

        // Notify parent component if callback provided
        if (onRecordingComplete) {
          onRecordingComplete(blob);
        }

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;

        // Automatically start upload
        handleUpload(blob, recordedDuration);
      };

      mediaRecorder.onerror = () => {
        setError('Recording error occurred');
        setRecordingState('idle');
        stopTimer();
      };

      // Start recording
      mediaRecorder.start();
      setRecordingState('recording');
      setElapsedSeconds(0);
      startTimer();
    } catch (err) {
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') {
          setError('Microphone access denied. Please allow microphone access.');
        } else if (err.name === 'NotFoundError') {
          setError('No microphone found. Please connect a microphone.');
        } else {
          setError(`Error accessing microphone: ${err.message}`);
        }
      } else {
        setError('Failed to start recording');
      }
    }
  }, [audioUrl, onRecordingComplete, startTimer, stopTimer, handleUpload]);

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
    // Revoke previous audio URL
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setAudioBlob(null);
    setElapsedSeconds(0);
    setFinalDuration(0);
    durationRef.current = 0;
    setRecordingState('idle');
    setUploadState('idle');
    setError(null);
    setUploadError(null);
  }, [audioUrl]);

  /**
   * Retry upload for failed uploads
   */
  const handleRetryUpload = useCallback(() => {
    if (audioBlob && finalDuration > 0) {
      handleUpload(audioBlob, finalDuration);
    }
  }, [audioBlob, finalDuration, handleUpload]);

  const isIdle = recordingState === 'idle';
  const isRecording = recordingState === 'recording';
  const isPaused = recordingState === 'paused';
  const isStopped = recordingState === 'stopped';

  const isUploading = uploadState === 'uploading';
  const isUploadSuccess = uploadState === 'success';
  const isUploadError = uploadState === 'error';

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-lg text-foreground flex items-center gap-2">
          <Mic className="h-5 w-5 text-muted-foreground" />
          Audio Recorder
        </CardTitle>
        <CardDescription>
          Record audio for your interview session
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Timer Display */}
        <div className="flex items-center justify-center py-6">
          <div
            className={`text-6xl font-mono font-bold tracking-tighter ${
              isPaused
                ? 'text-amber-500'
                : isRecording
                  ? 'text-destructive animate-pulse'
                  : 'text-muted-foreground'
            }`}
          >
            {formatTime(elapsedSeconds)}
          </div>
        </div>

        {/* Recording Status Indicator */}
        {(isRecording || isPaused) && (
          <div className="flex items-center justify-center gap-2">
            <div
              className={`h-2.5 w-2.5 rounded-full ${
                isPaused
                  ? 'bg-amber-500'
                  : 'bg-destructive animate-pulse'
              }`}
            />
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {isPaused ? 'Paused' : 'Recording Live'}
            </span>
          </div>
        )}

        {/* Recording Error Display */}
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 space-y-3">
            <p className="text-sm text-destructive font-medium">{error}</p>
            {error.includes('denied') && (
              <>
                <div className="text-xs text-destructive/80 space-y-1">
                  <p>To allow microphone access:</p>
                  <ol className="list-decimal list-inside space-y-0.5 ml-1">
                    <li>Click the lock/site icon in your browser&apos;s address bar</li>
                    <li>Find &quot;Microphone&quot; and set it to &quot;Allow&quot;</li>
                    <li>Refresh the page or click &quot;Try Again&quot; below</li>
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
                <p className="text-sm text-primary font-medium">Uploading recording...</p>
                <p className="text-xs text-muted-foreground">Please wait while your audio is being saved</p>
              </div>
            </div>
          </div>
        )}

        {isUploadSuccess && (
          <div className="rounded-lg border border-success/30 bg-success/10 p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-success" />
              <div>
                <p className="text-sm text-success font-medium">Recording saved successfully!</p>
                <p className="text-xs text-muted-foreground">Your audio has been uploaded and session updated</p>
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
              className="rounded-full px-8 shadow-lg shadow-destructive/20"
              variant="destructive"
            >
              <Mic className="mr-2 h-4 w-4" />
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
                <Mic className="mr-2 h-4 w-4" />
                New Recording
              </Button>
              {audioUrl && !isUploadSuccess && (
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

        {/* Audio Playback */}
        {isStopped && audioUrl && (
          <div className="space-y-4 pt-6 border-t border-border">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Review Recording</p>
              {audioBlob && (
                <p className="text-[10px] text-muted-foreground font-mono">
                  {(audioBlob.size / 1024).toFixed(1)} KB
                </p>
              )}
            </div>
            <audio
              controls
              src={audioUrl}
              className="w-full h-10"
              aria-label="Recorded audio playback"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
