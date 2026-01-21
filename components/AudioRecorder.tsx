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
import { Mic, Square, Pause, Play, Trash2 } from 'lucide-react';

type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped';

interface AudioRecorderProps {
  onRecordingComplete?: (blob: Blob) => void;
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

export function AudioRecorder({ onRecordingComplete }: AudioRecorderProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

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

    // Revoke previous audio URL if exists
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setAudioBlob(null);

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
  }, [audioUrl, onRecordingComplete, startTimer, stopTimer]);

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
    setRecordingState('idle');
    setError(null);
  }, [audioUrl]);

  const isIdle = recordingState === 'idle';
  const isRecording = recordingState === 'recording';
  const isPaused = recordingState === 'paused';
  const isStopped = recordingState === 'stopped';

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

        {/* Error Display */}
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
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <Mic className="mr-2 h-4 w-4" />
                New Recording
              </Button>
              {audioUrl && (
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
