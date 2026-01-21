'use client';

import { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import { createSignedMediaUrlForShare } from '@/app/actions/shares';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Volume2,
  VolumeX,
  Loader2,
  AlertCircle,
  RefreshCw,
  Music,
  Video,
  SkipBack,
  SkipForward,
  Gauge,
} from 'lucide-react';

export interface MediaPlayerRef {
  getCurrentTimeMs: () => number;
  seekToMs: (ms: number) => void;
}

interface SharedMediaPlayerProps {
  shareToken: string;
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
 * SharedMediaPlayer - Read-only media player for shared sessions
 * Uses signed URLs validated by share token
 */
export const SharedMediaPlayer = forwardRef<MediaPlayerRef, SharedMediaPlayerProps>(
  function SharedMediaPlayer({ shareToken, className }, ref) {
    const [mediaUrl, setMediaUrl] = useState<string | null>(null);
    const [recordingType, setRecordingType] = useState<'audio' | 'video' | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);

    const mediaRef = useRef<HTMLAudioElement | HTMLVideoElement>(null);

    // Available playback speeds
    const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2];

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
      getCurrentTimeMs: () => {
        if (mediaRef.current) {
          return Math.round(mediaRef.current.currentTime * 1000);
        }
        return 0;
      },
      seekToMs: (ms: number) => {
        if (mediaRef.current) {
          const seconds = ms / 1000;
          mediaRef.current.currentTime = Math.max(0, Math.min(seconds, mediaRef.current.duration || seconds));
          setCurrentTime(mediaRef.current.currentTime);
        }
      },
    }), []);

    /**
     * Fetch a signed URL using the share token
     */
    const fetchSignedUrl = useCallback(async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await createSignedMediaUrlForShare(shareToken);

        if (result.error) {
          setError(result.error);
          setMediaUrl(null);
          return;
        }

        setMediaUrl(result.url);
        setRecordingType(result.recordingType);
      } catch (err) {
        console.error('Failed to fetch signed URL:', err);
        setError('Failed to load media. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }, [shareToken]);

    // Fetch signed URL on mount
    useEffect(() => {
      fetchSignedUrl();
    }, [fetchSignedUrl]);

    // Media event handlers
    useEffect(() => {
      const media = mediaRef.current;
      if (!media) return;

      const handleTimeUpdate = () => {
        setCurrentTime(media.currentTime);
      };

      const handleDurationChange = () => {
        setDuration(media.duration);
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
        setError('Failed to load media. Please try again.');
      };

      media.addEventListener('timeupdate', handleTimeUpdate);
      media.addEventListener('durationchange', handleDurationChange);
      media.addEventListener('play', handlePlay);
      media.addEventListener('pause', handlePause);
      media.addEventListener('ended', handleEnded);
      media.addEventListener('error', handleError);

      return () => {
        media.removeEventListener('timeupdate', handleTimeUpdate);
        media.removeEventListener('durationchange', handleDurationChange);
        media.removeEventListener('play', handlePlay);
        media.removeEventListener('pause', handlePause);
        media.removeEventListener('ended', handleEnded);
        media.removeEventListener('error', handleError);
      };
    }, [mediaUrl]);

    const toggleMute = () => {
      if (mediaRef.current) {
        mediaRef.current.muted = !mediaRef.current.muted;
        setIsMuted(!isMuted);
      }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
      const time = parseFloat(e.target.value);
      if (mediaRef.current) {
        mediaRef.current.currentTime = time;
        setCurrentTime(time);
      }
    };

    const togglePlayPause = () => {
      if (mediaRef.current) {
        if (isPlaying) {
          mediaRef.current.pause();
        } else {
          mediaRef.current.play();
        }
      }
    };

    const handleSpeedChange = (speed: number) => {
      if (mediaRef.current) {
        mediaRef.current.playbackRate = speed;
        setPlaybackSpeed(speed);
      }
    };

    const skipBackward = () => {
      if (mediaRef.current) {
        const newTime = Math.max(0, mediaRef.current.currentTime - 10);
        mediaRef.current.currentTime = newTime;
        setCurrentTime(newTime);
      }
    };

    const skipForward = () => {
      if (mediaRef.current) {
        const newTime = Math.min(duration, mediaRef.current.currentTime + 10);
        mediaRef.current.currentTime = newTime;
        setCurrentTime(newTime);
      }
    };

    // Loading state
    if (isLoading) {
      return (
        <Card className={cn('border-border bg-card', className)}>
          <CardContent className="py-12">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Loading media...</span>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Error state
    if (error && !mediaUrl) {
      return (
        <Card className={cn('border-border bg-card', className)}>
          <CardContent className="py-8">
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-center">
              <div className="flex flex-col items-center gap-3">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <p className="text-sm text-foreground font-medium">{error}</p>
                <Button size="sm" variant="outline" onClick={fetchSignedUrl}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    // No media state
    if (!mediaUrl) {
      return (
        <Card className={cn('border-border bg-card', className)}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-foreground">
              {recordingType === 'video' ? (
                <Video className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Volume2 className="h-5 w-5 text-muted-foreground" />
              )}
              Media Playback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-4 rounded-full bg-muted p-4">
                <Music className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-foreground font-medium">No recording available</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className={cn('border-border bg-card', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-foreground">
            {recordingType === 'video' ? (
              <Video className="h-5 w-5 text-muted-foreground" />
            ) : (
              <Volume2 className="h-5 w-5 text-muted-foreground" />
            )}
            {recordingType === 'video' ? 'Video Playback' : 'Audio Playback'}
          </CardTitle>
          <CardDescription>
            Shared recording
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {recordingType === 'video' ? (
            <div className="relative w-full rounded-lg overflow-hidden bg-black">
              <video
                ref={mediaRef as React.RefObject<HTMLVideoElement>}
                src={mediaUrl}
                preload="metadata"
                className="w-full aspect-video"
                onClick={togglePlayPause}
              />
            </div>
          ) : (
            <audio ref={mediaRef as React.RefObject<HTMLAudioElement>} src={mediaUrl} preload="metadata" />
          )}

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
            aria-label="Media progress"
          />

          {/* Controls */}
          <div className="flex items-center justify-center gap-2 pt-2">
            {/* Skip backward button */}
            <Button
              size="icon"
              variant="ghost"
              onClick={skipBackward}
              className="rounded-full text-muted-foreground hover:text-foreground"
              aria-label="Skip backward 10 seconds"
              title="Skip backward 10s"
            >
              <SkipBack className="h-5 w-5" />
            </Button>

            {/* Play/Pause button */}
            <Button size="lg" onClick={togglePlayPause} className="rounded-full px-8 shadow-md">
              {isPlaying ? (
                <>
                  <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                  Pause
                </>
              ) : (
                <>
                  <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <polygon points="5,3 19,12 5,21" />
                  </svg>
                  Play
                </>
              )}
            </Button>

            {/* Skip forward button */}
            <Button
              size="icon"
              variant="ghost"
              onClick={skipForward}
              className="rounded-full text-muted-foreground hover:text-foreground"
              aria-label="Skip forward 10 seconds"
              title="Skip forward 10s"
            >
              <SkipForward className="h-5 w-5" />
            </Button>

            {/* Mute button */}
            <Button
              size="icon"
              variant="ghost"
              onClick={toggleMute}
              className="rounded-full text-muted-foreground hover:text-foreground"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
          </div>

          {/* Speed Control */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <Gauge className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Speed:</span>
            <div className="flex items-center gap-1">
              {speedOptions.map((speed) => (
                <Button
                  key={speed}
                  size="sm"
                  variant={playbackSpeed === speed ? 'default' : 'ghost'}
                  onClick={() => handleSpeedChange(speed)}
                  className={cn(
                    "h-7 px-2 text-xs font-medium",
                    playbackSpeed === speed 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {speed}x
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);
