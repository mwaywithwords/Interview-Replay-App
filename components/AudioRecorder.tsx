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
    <Card className="border-slate-700 bg-slate-800/50">
      <CardHeader>
        <CardTitle className="text-lg text-white">Audio Recorder</CardTitle>
        <CardDescription className="text-slate-400">
          Record audio for your interview session
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Timer Display */}
        <div className="flex items-center justify-center">
          <div
            className={`text-4xl font-mono font-bold ${
              isPaused
                ? 'text-amber-400'
                : isRecording
                  ? 'text-red-400'
                  : 'text-slate-300'
            }`}
          >
            {formatTime(elapsedSeconds)}
          </div>
        </div>

        {/* Recording Status Indicator */}
        {(isRecording || isPaused) && (
          <div className="flex items-center justify-center gap-2">
            <div
              className={`h-3 w-3 rounded-full ${
                isPaused
                  ? 'bg-amber-400'
                  : 'bg-red-500 animate-pulse'
              }`}
            />
            <span className="text-sm text-slate-400">
              {isPaused ? 'Paused' : 'Recording'}
            </span>
          </div>
        )}

        {/* Recording Error Display */}
        {error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 p-4 space-y-3">
            <p className="text-sm text-red-300 font-medium">{error}</p>
            {error.includes('denied') && (
              <>
                <div className="text-xs text-red-300/80 space-y-1">
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
                  className="border-red-500/30 text-red-300 hover:bg-red-500/20 hover:text-red-200"
                >
                  Try Again
                </Button>
              </>
            )}
          </div>
        )}

        {/* Upload Status Display */}
        {isUploading && (
          <div className="rounded-md border border-cyan-500/30 bg-cyan-500/10 p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 text-cyan-400 animate-spin" />
              <div>
                <p className="text-sm text-cyan-300 font-medium">Uploading recording...</p>
                <p className="text-xs text-cyan-400/70">Please wait while your audio is being saved</p>
              </div>
            </div>
          </div>
        )}

        {isUploadSuccess && (
          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
              <div>
                <p className="text-sm text-emerald-300 font-medium">Recording saved successfully!</p>
                <p className="text-xs text-emerald-400/70">Your audio has been uploaded and session updated</p>
              </div>
            </div>
          </div>
        )}

        {isUploadError && uploadError && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div>
                <p className="text-sm text-red-300 font-medium">Upload failed</p>
                <p className="text-xs text-red-400/70">{uploadError}</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRetryUpload}
              className="border-red-500/30 text-red-300 hover:bg-red-500/20 hover:text-red-200"
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
              className="bg-red-600 hover:bg-red-700 text-white"
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
                className="border-amber-500/50 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300"
              >
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </Button>
              <Button
                variant="destructive"
                onClick={handleStop}
                className="bg-slate-600 hover:bg-slate-700 text-white"
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
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Play className="mr-2 h-4 w-4" />
                Resume
              </Button>
              <Button
                variant="destructive"
                onClick={handleStop}
                className="bg-slate-600 hover:bg-slate-700 text-white"
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
                className="border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-50"
              >
                <Mic className="mr-2 h-4 w-4" />
                New Recording
              </Button>
              {audioUrl && !isUploadSuccess && (
                <Button
                  onClick={handleReset}
                  variant="ghost"
                  disabled={isUploading}
                  className="text-red-400 hover:bg-red-500/20 hover:text-red-300 disabled:opacity-50"
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
          <div className="space-y-2 pt-4 border-t border-slate-700">
            <p className="text-sm text-slate-400">Playback your recording:</p>
            <audio
              controls
              src={audioUrl}
              className="w-full"
              aria-label="Recorded audio playback"
            />
            {audioBlob && (
              <p className="text-xs text-slate-500">
                Format: {audioBlob.type || 'audio/webm'} | Size:{' '}
                {(audioBlob.size / 1024).toFixed(1)} KB
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
