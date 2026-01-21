'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createSignedAudioUrl } from '@/app/actions/storage';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Volume2,
  VolumeX,
  Loader2,
  AlertCircle,
  RefreshCw,
  Music,
} from 'lucide-react';

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
 * Uses signed URLs with automatic refresh before expiration.
 */
export function AudioPlayer({ sessionId, hasAudio, className }: AudioPlayerProps) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        setError(result.error);
        setAudioUrl(null);
        setExpiresAt(null);
        return;
      }

      setAudioUrl(result.url);
      setExpiresAt(result.expiresAt);
    } catch (err) {
      console.error('Failed to fetch signed URL:', err);
      setError('Failed to load audio. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, hasAudio]);

  /**
   * Schedule URL refresh before expiration
   * Refresh 10 seconds before expiration to ensure seamless playback
   */
  const scheduleRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    if (!expiresAt) return;

    // Calculate time until expiration (refresh 10 seconds early)
    const timeUntilExpiration = expiresAt - Date.now() - 10000;

    if (timeUntilExpiration <= 0) {
      // URL already expired or about to expire, refresh immediately
      fetchSignedUrl();
      return;
    }

    refreshTimeoutRef.current = setTimeout(() => {
      // Only refresh if audio is playing or paused (not idle)
      if (audioRef.current && !audioRef.current.paused) {
        fetchSignedUrl();
      }
    }, timeUntilExpiration);
  }, [expiresAt, fetchSignedUrl]);

  // Fetch signed URL on mount if hasAudio is true
  useEffect(() => {
    if (hasAudio) {
      fetchSignedUrl();
    }
  }, [hasAudio, fetchSignedUrl]);

  // Schedule refresh when expiresAt changes
  useEffect(() => {
    scheduleRefresh();

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [scheduleRefresh]);

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
      // Check if URL might have expired
      if (expiresAt && Date.now() >= expiresAt) {
        setError('Playback URL expired. Refreshing...');
        fetchSignedUrl();
      } else {
        setError('Failed to load audio. Please try again.');
      }
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
  }, [expiresAt, fetchSignedUrl]);

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

  // Empty state: No audio recording exists
  if (!hasAudio) {
    return (
      <Card className={`border-slate-700 bg-slate-800/50 ${className || ''}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-white">
            <Volume2 className="h-5 w-5" />
            Audio Playback
          </CardTitle>
          <CardDescription className="text-slate-400">
            Listen to your recorded interview audio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-4 rounded-full bg-slate-700/50 p-4">
              <Music className="h-8 w-8 text-slate-500" />
            </div>
            <p className="text-slate-400 font-medium">No audio recording yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Use the Audio Recorder above to create a recording for this session
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-slate-700 bg-slate-800/50 ${className || ''}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg text-white">
          <Volume2 className="h-5 w-5" />
          Audio Playback
        </CardTitle>
        <CardDescription className="text-slate-400">
          Listen to your recorded interview audio
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
            <span className="ml-3 text-slate-400">Loading audio...</span>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="flex-1">
                <p className="text-sm text-red-300 font-medium">{error}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={fetchSignedUrl}
                className="border-red-500/30 text-red-300 hover:bg-red-500/20 hover:text-red-200"
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
            <div className="flex items-center justify-between text-sm text-slate-400">
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
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-4
                [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-emerald-400
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:shadow-lg
                [&::-moz-range-thumb]:w-4
                [&::-moz-range-thumb]:h-4
                [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-emerald-400
                [&::-moz-range-thumb]:cursor-pointer
                [&::-moz-range-thumb]:border-0"
              aria-label="Audio progress"
            />

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
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
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8"
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
                className="text-slate-400 hover:text-white hover:bg-slate-700"
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </Button>
            </div>

            {/* URL expiration indicator (for debugging, can be removed in production) */}
            {expiresAt && (
              <p className="text-xs text-slate-500 text-center">
                Playback URL refreshes automatically
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
