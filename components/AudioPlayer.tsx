'use client';

import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { createSignedAudioUrl } from '@/app/actions/storage';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  Volume2,
  VolumeX,
  Loader2,
  AlertCircle,
  RefreshCw,
  Music,
} from 'lucide-react';

/**
 * Skeleton loader for audio player
 */
export function AudioPlayerSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("border-border bg-card", className)}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-4 w-48 mt-1" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-2 w-full rounded-lg" />
        <div className="flex items-center justify-center gap-4 pt-2">
          <Skeleton className="h-10 w-28 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export interface MediaPlayerRef {
  getCurrentTimeMs: () => number;
  seekToMs: (ms: number) => void;
}

interface AudioPlayerProps {
  sessionId: string;
  hasAudio: boolean; // Whether the session has recording_type = 'audio'
  className?: string;
}

/**
 * Format seconds into MM:SS display format.
 */
function formatTime(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds)) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * AudioPlayer component for playing audio from private Supabase Storage buckets.
 * Uses signed URLs with 30-minute expiration. No auto-refresh logic.
 * 
 * Exposes ref methods:
 * - getCurrentTimeMs(): Returns current playback position in milliseconds
 * - seekToMs(ms): Seeks to the specified position in milliseconds
 */
export const AudioPlayer = forwardRef<MediaPlayerRef, AudioPlayerProps>(
  function AudioPlayer({ sessionId, hasAudio, className }, ref) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    getCurrentTimeMs: () => {
      if (audioRef.current) {
        return Math.round(audioRef.current.currentTime * 1000);
      }
      return 0;
    },
    seekToMs: (ms: number) => {
      if (audioRef.current) {
        const seconds = ms / 1000;
        audioRef.current.currentTime = Math.max(0, Math.min(seconds, audioRef.current.duration || seconds));
        setCurrentTime(audioRef.current.currentTime);
      }
    },
  }), []);

  /**
   * Fetch a new signed URL from the server
   */
  const fetchSignedUrl = useCallback(async () => {
    if (!hasAudio) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await createSignedAudioUrl(sessionId);

      if (result.error) {
        // Check if error is due to missing audio_storage_path
        if (result.error.includes('No audio recording found')) {
          setError(null); // Don't show error, will show empty state instead
          setAudioUrl(null);
        } else {
          setError(result.error);
          setAudioUrl(null);
        }
        return;
      }

      setAudioUrl(result.url);
    } catch (err) {
      console.error('Failed to fetch signed URL:', err);
      setError('Failed to load audio. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [hasAudio, sessionId]);

  // Fetch signed URL on mount if hasAudio is true
  useEffect(() => {
    if (hasAudio) {
      fetchSignedUrl();
    }
  }, [hasAudio, fetchSignedUrl]);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleDurationChange = () => {
      setDuration(audio.duration);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      setError('Failed to load audio. Please try again.');
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, []);

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Empty state: No audio recording exists or missing audio_storage_path
  if (!hasAudio || (!isLoading && !audioUrl && !error)) {
    return (
      <Card className={cn("border-border bg-card", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-foreground">
            <Volume2 className="h-5 w-5 text-muted-foreground" />
            Audio Playback
          </CardTitle>
          <CardDescription>
            Listen to your recorded interview audio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-4 rounded-full bg-muted p-4">
              <Music className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-foreground font-medium">No audio recording yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Use the Audio Recorder above to create a recording for this session
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-border bg-card", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg text-foreground">
          <Volume2 className="h-5 w-5 text-muted-foreground" />
          Audio Playback
        </CardTitle>
        <CardDescription>
          Listen to your recorded interview audio
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Loading audio...</span>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-center">
            <div className="flex flex-col items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-sm text-foreground font-medium">{error}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={fetchSignedUrl}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Audio Player */}
        {audioUrl && !isLoading && !error && (
          <div className="space-y-4">
            {/* Hidden audio element */}
            <audio ref={audioRef} src={audioUrl} preload="metadata" />

            {/* Time display */}
            <div className="flex items-center justify-between text-sm text-muted-foreground font-medium">
              <span className="font-mono">{formatTime(currentTime)}</span>
              <span className="font-mono">{formatTime(duration)}</span>
            </div>

            {/* Progress bar / seek slider */}
            <input
              type="range"
              min={0}
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-4
                [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-primary
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:shadow-lg
                [&::-moz-range-thumb]:w-4
                [&::-moz-range-thumb]:h-4
                [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-primary
                [&::-moz-range-thumb]:cursor-pointer
                [&::-moz-range-thumb]:border-0"
              aria-label="Audio progress"
            />

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 pt-2">
              {/* Play/Pause button */}
              <Button
                size="lg"
                onClick={() => {
                  if (audioRef.current) {
                    if (isPlaying) {
                      audioRef.current.pause();
                    } else {
                      audioRef.current.play();
                    }
                  }
                }}
                className="rounded-full px-8 shadow-md"
              >
                {isPlaying ? (
                  <>
                    <svg
                      className="mr-2 h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <rect x="6" y="4" width="4" height="16" />
                      <rect x="14" y="4" width="4" height="16" />
                    </svg>
                    Pause
                  </>
                ) : (
                  <>
                    <svg
                      className="mr-2 h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <polygon points="5,3 19,12 5,21" />
                    </svg>
                    Play
                  </>
                )}
              </Button>

              {/* Mute button */}
              <Button
                size="icon"
                variant="ghost"
                onClick={toggleMute}
                className="rounded-full text-muted-foreground hover:text-foreground"
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
