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
import { Video, Square, Pause, Play, Trash2, VideoOff } from 'lucide-react';

type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped';

interface VideoRecorderProps {
  onRecordingComplete?: (blob: Blob) => void;
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

export function VideoRecorder({ onRecordingComplete }: VideoRecorderProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const playbackVideoRef = useRef<HTMLVideoElement | null>(null);

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
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  const handleStart = useCallback(async () => {
    setError(null);

    // Revoke previous video URL if exists
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
      setVideoUrl(null);
    }
    setVideoBlob(null);

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
  }, [videoUrl, onRecordingComplete, startTimer, stopTimer, cleanup]);

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
    setRecordingState('idle');
    setError(null);
    setHasPermission(false);
  }, [videoUrl]);

  const isIdle = recordingState === 'idle';
  const isRecording = recordingState === 'recording';
  const isPaused = recordingState === 'paused';
  const isStopped = recordingState === 'stopped';
  const isActive = isRecording || isPaused;

  return (
    <Card className="border-slate-700 bg-slate-800/50">
      <CardHeader>
        <CardTitle className="text-lg text-white flex items-center gap-2">
          <Video className="h-5 w-5" />
          Video Recorder
        </CardTitle>
        <CardDescription className="text-slate-400">
          Record video and audio for your interview session
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Video Preview / Playback Area */}
        <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden">
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
          {isStopped && videoUrl && (
            <video
              ref={playbackVideoRef}
              className="absolute inset-0 w-full h-full object-contain bg-black"
              src={videoUrl}
              controls
              playsInline
            />
          )}

          {/* Placeholder when idle */}
          {isIdle && !hasPermission && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
              <VideoOff className="h-12 w-12 mb-2" />
              <p className="text-sm">Click &quot;Start Recording&quot; to begin</p>
            </div>
          )}

          {/* Recording indicator overlay */}
          {isActive && (
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                  isPaused
                    ? 'bg-amber-500/90 text-white'
                    : 'bg-red-500/90 text-white'
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
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-slate-900/80 text-white border border-slate-700'
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
            <div className="text-2xl font-mono font-bold text-slate-300">
              Duration: {formatTime(elapsedSeconds)}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 p-4 space-y-3">
            <p className="text-sm text-red-300 font-medium">{error}</p>
            {error.includes('denied') && (
              <>
                <div className="text-xs text-red-300/80 space-y-1">
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
                  className="border-red-500/30 text-red-300 hover:bg-red-500/20 hover:text-red-200"
                >
                  Try Again
                </Button>
              </>
            )}
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex items-center justify-center gap-3">
          {isIdle && (
            <Button
              onClick={handleStart}
              className="bg-red-600 hover:bg-red-700 text-white"
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
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <Video className="mr-2 h-4 w-4" />
                New Recording
              </Button>
              {videoUrl && (
                <Button
                  onClick={handleReset}
                  variant="ghost"
                  className="text-red-400 hover:bg-red-500/20 hover:text-red-300"
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
          <div className="pt-4 border-t border-slate-700">
            <p className="text-xs text-slate-500">
              Format: {videoBlob.type || 'video/webm'} | Size:{' '}
              {(videoBlob.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
